import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, Callout, CopyLinkButton, PageHeader, SectionTitle,
  getGasSeparationRecords,
} from "../../shared"

const CONDITION_KEYS = ["gasPair", "gasRatio", "temperature", "pressure", "method", "source"]

function pendingText(zh) {
  return zh ? "待补充" : "Pending"
}

function sourceText(status, zh) {
  return status === "pending" ? (zh ? "来源待补充" : "Source pending") : (status || pendingText(zh))
}

function conditionLabels(zh) {
  return {
    gasPair: zh ? "气体体系" : "gas pair",
    gasRatio: zh ? "气体比例" : "gas ratio",
    temperature: zh ? "温度" : "temperature",
    pressure: zh ? "压力" : "pressure",
    method: zh ? "方法" : "method",
    source: zh ? "来源" : "source",
  }
}

function conditionSummary(record) {
  const completeness = record?.conditionCompleteness || {}
  const present = CONDITION_KEYS.filter(key => completeness[key] === true)
  const missing = CONDITION_KEYS.filter(key => completeness[key] !== true)
  return { count: present.length, total: CONDITION_KEYS.length, missing }
}

function formatSelectivity(value, zh) {
  return value == null ? pendingText(zh) : String(value)
}

function formatUptake(record, zh) {
  const rows = Array.isArray(record?.adsorption) ? record.adsorption : []
  if (!rows.length || rows.every(item => item?.uptake == null)) return pendingText(zh)
  return rows.map(item => {
    if (item?.uptake == null) return `${item?.gas || "-"}: ${pendingText(zh)}`
    return `${item.gas}: ${item.uptake} ${item.unit || ""}`.trim()
  }).join("; ")
}

function statusLabel(status, zh) {
  const labels = {
    "uptake-only": zh ? "仅有吸附量数值" : "Only adsorption values are available.",
    "single-component": zh ? "单组分等温线可用" : "Single-component isotherm available.",
    "multi-gas-planned": zh ? "多气体叠加等温线规划中" : "Multi-gas overlay planned.",
    pending: zh ? "等温线数据待补充" : "Isotherm data pending.",
  }
  return labels[status] || labels.pending
}

function CompactCell({ children, strong = false, t }) {
  return (
    <td style={{
      padding: "9px 8px",
      borderBottom: `1px solid ${t.divider}`,
      color: strong ? t.textStrong : t.muted,
      fontSize: 11,
      lineHeight: 1.45,
      verticalAlign: "top",
      fontWeight: strong ? 850 : 600,
    }}>
      {children}
    </td>
  )
}

export function GasSepTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    setStatus("loading")
    getGasSeparationRecords({ throwOnError: true })
      .then(data => {
        if (!active) return
        const next = Array.isArray(data) ? data : []
        setRecords(next)
        setStatus(next.length ? "loaded" : "empty")
      })
      .catch(error => {
        console.warn("GasSep data load failed.", error)
        if (active) {
          setRecords([])
          setStatus("error")
        }
      })
    return () => { active = false }
  }, [])

  const labels = useMemo(() => conditionLabels(zh), [zh])

  const systems = useMemo(() => [
    ["C2H2/CO2", "50/50 or 1/1", zh ? "乙炔纯化" : "acetylene purification"],
    ["C2H2/C2H4", "1/99 or 1/999", zh ? "痕量乙炔脱除" : "trace acetylene removal"],
    ["CO2/N2", "15/85", zh ? "烟道气 CO2 捕集" : "flue gas capture"],
    ["CO2/CH4", "50/50", zh ? "天然气提纯" : "natural gas upgrading"],
    ["C2H6/C2H4", zh ? "取决于条件" : "condition-dependent", zh ? "乙烷/乙烯分离" : "ethane/ethylene separation"],
    ["Xe/Kr", zh ? "取决于条件" : "condition-dependent", zh ? "稀有气体分离" : "noble gas separation"],
  ], [zh])

  const isothermStatuses = useMemo(() => [
    ["uptake-only", statusLabel("uptake-only", zh)],
    ["single-component", statusLabel("single-component", zh)],
    ["multi-gas-planned", statusLabel("multi-gas-planned", zh)],
    ["pending", statusLabel("pending", zh)],
  ], [zh])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={zh ? "GasSep：气体吸附与分离" : "GasSep: Gas Adsorption & Separation"}
        subtitle={zh
          ? "面向 MOF 候选材料的条件化气体吸附与分离记录。"
          : "Condition-aware gas adsorption and separation records for MOF candidates."}
        meta={zh ? "气体比例 · 温度 · 压力 · 方法 · 来源 · 等温线状态" : "gas ratio · temperature · pressure · method · source · isotherm status"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "条件化记录" : "condition-aware records"}</BasisBadge>
            <CopyLinkButton hash="gassep" ariaLabel={zh ? "复制 GasSep 链接" : "Copy GasSep link"} />
          </>
        }
      />

      <Callout tone="info">
        {zh
          ? "气体吸附与分离数据高度依赖测试或计算条件。选择性和吸附量应结合气体比例、温度、压力、方法和来源共同解读。"
          : "Gas adsorption and separation data are condition-sensitive. Selectivity and uptake should be interpreted with gas ratio, temperature, pressure, method, and source context."}
      </Callout>
      <Callout tone="warn">
        {zh
          ? "本模块不执行 IAST、GCMC 或穿透曲线模拟，仅用于整理带条件说明的气体分离记录。"
          : "This module does not perform IAST, GCMC, or breakthrough simulation. It organizes condition-aware records for transparent comparison."}
      </Callout>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "分离体系卡片" : "Separation System Cards"}</SectionTitle>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
          {zh ? "以下比例是常见报道语境，不代表适用于所有论文或所有测试条件。" : "These ratios are commonly reported context, not universal conditions for every paper or test."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {systems.map(([system, ratio, context]) => (
            <article key={system} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minHeight: 116 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, fontFamily: FONT_MONO }}>{system}</div>
                <BasisBadge tone="info">{zh ? "常见报道语境" : "commonly reported context"}</BasisBadge>
              </div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginTop: 10 }}>
                {zh ? "常见比例" : "Common ratio"}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{ratio}</div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginTop: 8 }}>
                {zh ? "语境" : "Context"}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{context}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "条件化记录表" : "Condition-aware Records Table"}</SectionTitle>
        {status === "loading" && <Callout tone="info">{zh ? "正在加载 GasSep 记录…" : "Loading GasSep records..."}</Callout>}
        {status === "error" && (
          <Callout tone="warn">
            {zh
              ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。"
              : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages."}
          </Callout>
        )}
        {status === "empty" && <Callout tone="warn">{zh ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>}
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {(zh
                  ? ["MOF", "体系", "比例", "温度", "压力", "方法", "选择性", "吸附量", "条件", "来源"]
                  : ["MOF", "System", "Ratio", "T", "P", "Method", "Selectivity", "Uptake", "Condition", "Source"]).map(head => (
                  <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}`, textTransform: "uppercase" }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const summary = conditionSummary(record)
                return (
                  <tr key={record.recordId}>
                    <CompactCell t={t} strong>{record.mofName || pendingText(zh)}</CompactCell>
                    <CompactCell t={t}>{record.separationSystem || pendingText(zh)}</CompactCell>
                    <CompactCell t={t}>{record.gasRatio || pendingText(zh)}</CompactCell>
                    <CompactCell t={t}>{record.temperatureK == null ? pendingText(zh) : `${record.temperatureK} K`}</CompactCell>
                    <CompactCell t={t}>{record.pressureKPa == null ? pendingText(zh) : `${record.pressureKPa} kPa`}</CompactCell>
                    <CompactCell t={t}>{record.method || pendingText(zh)}</CompactCell>
                    <CompactCell t={t}>{formatSelectivity(record.selectivity, zh)}</CompactCell>
                    <CompactCell t={t}>{formatUptake(record, zh)}</CompactCell>
                    <CompactCell t={t}>{summary.count}/{summary.total}</CompactCell>
                    <CompactCell t={t}>{sourceText(record.sourceStatus, zh)}</CompactCell>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "条件完整度" : "Condition Completeness"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {records.map(record => {
            const summary = conditionSummary(record)
            const missing = summary.missing.map(key => labels[key]).join(", ") || (zh ? "无" : "none")
            return (
              <article key={record.recordId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{record.separationSystem}</div>
                <div style={{ color: t.accentText, fontSize: 12, fontWeight: 850, marginTop: 8 }}>
                  {zh ? "条件完整度" : "Condition completeness"}: {summary.count}/{summary.total}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
                  {zh ? "缺失" : "Missing"}: {missing}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                  {CONDITION_KEYS.map(key => (
                    <span key={key} style={{
                      border: `1px solid ${record.conditionCompleteness?.[key] ? t.border : t.warn}`,
                      background: record.conditionCompleteness?.[key] ? t.panel : t.badgeWarnBg,
                      color: record.conditionCompleteness?.[key] ? t.muted : t.warn,
                      borderRadius: 999,
                      padding: "4px 7px",
                      fontSize: 10,
                      fontWeight: 780,
                    }}>
                      {labels[key]}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "等温线可用性" : "Isotherm Availability"}</SectionTitle>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "8px 0 0" }}>
          {zh
            ? "当前原型优先整理选择性、吸附量和条件元数据。多气体等温线叠加需要整理后的原始等温线点数据，属于后续工作。"
            : "Current prototype prioritizes selectivity, uptake, and condition metadata. Multi-gas isotherm overlays require curated raw isotherm points and are treated as future work."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {isothermStatuses.map(([key, label]) => (
            <div key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={key === "pending" ? "warn" : "info"}>{key}</BasisBadge>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
          {records.map(record => (
            <div key={record.recordId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px" }}>
              <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>{record.separationSystem}</div>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
                {statusLabel(record.isothermStatus, zh)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
