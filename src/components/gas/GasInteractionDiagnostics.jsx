// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, fetchDataJson, SectionTitle } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function tone(status = "") {
  const label = String(status).toLowerCase()
  if (label.includes("positive")) return "calc"
  if (label.includes("negative")) return "warn"
  if (label.includes("validation")) return "info"
  return "proxy"
}

function statusColor(status, t) {
  const label = String(status).toLowerCase()
  if (label.includes("positive")) return { bg: t.badgeGoodBg, fg: t.good || t.accentText }
  if (label.includes("negative")) return { bg: t.badgeWarnBg, fg: t.warn }
  if (label.includes("validation")) return { bg: t.badgeInfoBg, fg: t.accentText }
  return { bg: t.surface, fg: t.muted }
}

const FALLBACK = [
  ["Functional group", "官能团", "selectivity", "选择性", "needs validation", "需要验证", "Polar groups can increase affinity, but humidity and regeneration may reverse the apparent benefit.", "极性官能团可能提高亲和，但湿度与再生负担可能反转表观优势。", "Run humidity-aware mixture adsorption validation.", "开展含湿条件下的混合吸附验证。"],
  ["Qst", "吸附热 Qst", "regenerability", "可再生性", "negative conflict", "负向冲突", "High heat of adsorption can improve uptake while making cyclic regeneration harder.", "高吸附热可能提高吸附量，但增加循环再生难度。", "Pair isotherms with cyclic desorption tests.", "将等温线与循环脱附测试配套。"],
  ["data type", "数据类型", "evidence confidence", "证据置信度", "needs validation", "需要验证", "Predicted or demo records should not dominate rankings without evidence adjustment.", "预测或演示记录不应在缺少证据校正时主导排序。", "Upgrade with literature curation, GCMC, IAST or breakthrough data.", "通过文献整理、GCMC、IAST 或穿透数据升级证据。"],
]

export function GasInteractionDiagnostics({ scenario = {}, record, lang = "en", t, isMobile }) {
  const [rows, setRows] = useState([])
  const [activeId, setActiveId] = useState("gas-family-pair")

  useEffect(() => {
    let active = true
    fetchDataJson("interaction_effects_demo.json", [])
      .then(items => {
        if (!active) return
        setRows(Array.isArray(items) ? items.filter(item => item.module === "gassep") : [])
      })
      .catch(() => active && setRows([]))
    return () => { active = false }
  }, [])

  const diagnostics = useMemo(() => {
    const base = rows.length ? rows : FALLBACK.map((row, index) => ({
      id: `gas-fallback-${index}`,
      factorA: row[0],
      factorAZh: row[1],
      factorB: row[2],
      factorBZh: row[3],
      status: row[4],
      statusZh: row[5],
      evidenceLevel: "C",
      dataStatus: "demo / inferred",
      mechanismNote: row[6],
      mechanismNoteZh: row[7],
      riskNote: "Decision-support diagnostic only; not a real separation-performance prediction.",
      riskNoteZh: "仅为决策支持诊断，不是真实分离性能预测。",
      validationSuggestion: row[8],
      validationSuggestionZh: row[9],
    }))
    return base
  }, [rows])

  const active = diagnostics.find(row => row.id === activeId) || diagnostics[0]

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 13, minWidth: 0, padding: 16 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "GasSep Interaction Diagnostics / 交互诊断", "GasSep Interaction Diagnostics")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5, maxWidth: 900 }}>
            {text(
              lang,
              "诊断 MOF 家族、金属节点、孔径、官能团、水稳定性、Qst 与数据类型如何和当前气体对 / 工况产生交互；输出是验证假设，不是最终分离性能预测。",
              "Diagnoses how MOF family, metal node, pore class, functional group, water stability, Qst, and data type interact with the current gas pair and condition. Outputs are validation hypotheses, not final separation-performance predictions."
            )}
          </div>
        </div>
        <BasisBadge tone="warn">{text(lang, "hypothesis / validation-first", "hypothesis / validation-first")}</BasisBadge>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(300px, 0.85fr)" }}>
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <div style={{ display: "grid", gap: 7, minWidth: 650 }}>
            {diagnostics.map(row => {
              const colors = statusColor(row.status, t)
              const selected = active?.id === row.id
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setActiveId(row.id)}
                  style={{
                    alignItems: "center",
                    background: selected ? colors.bg : t.surface,
                    border: `1px solid ${selected ? colors.fg : t.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "grid",
                    gap: 9,
                    gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr) 128px 90px",
                    minHeight: 62,
                    padding: 10,
                    textAlign: "left",
                  }}
                >
                  <strong style={{ color: t.textStrong, fontSize: 12.5 }}><ChemicalText value={text(lang, row.factorAZh, row.factorA)} /></strong>
                  <span style={{ color: t.muted, fontSize: 12 }}><ChemicalText value={text(lang, row.factorBZh, row.factorB)} /></span>
                  <span style={{ color: colors.fg, fontSize: 11.5, fontWeight: 900 }}>{text(lang, row.statusZh, row.status)}</span>
                  <BasisBadge tone={tone(row.status)}>A-D {row.evidenceLevel || "C"}</BasisBadge>
                </button>
              )
            })}
          </div>
        </div>

        {active ? (
          <aside style={{ background: t.surface, border: `1px solid ${t.borderStrong}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
              {text(lang, "Interaction inspector", "Interaction inspector")}
            </div>
            <h3 style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.22, margin: 0 }}>
              <ChemicalText value={`${text(lang, active.factorAZh, active.factorA)} × ${text(lang, active.factorBZh, active.factorB)}`} />
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <BasisBadge tone={tone(active.status)}>{text(lang, active.statusZh, active.status)}</BasisBadge>
              <BasisBadge tone="proxy">{active.dataStatus || "demo / inferred"}</BasisBadge>
              <BasisBadge tone="info">{scenario.gasPair || record?.gasPair || "selected gas pair"}</BasisBadge>
            </div>
            <div style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.58 }}>
              <ChemicalText value={text(lang, active.mechanismNoteZh, active.mechanismNote)} />
            </div>
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.55, padding: 10 }}>
              <strong style={{ color: t.warn }}>{text(lang, "风险说明：", "Risk note: ")}</strong>
              <ChemicalText value={text(lang, active.riskNoteZh, active.riskNote)} />
            </div>
            <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.55, padding: 10 }}>
              <strong style={{ color: t.accentText }}>{text(lang, "验证建议：", "Validation suggestion: ")}</strong>
              <ChemicalText value={text(lang, active.validationSuggestionZh, active.validationSuggestion)} />
            </div>
            <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.45 }}>
              {text(lang, "当前候选：", "Selected candidate: ")}<ChemicalText value={record?.displayName || "pending"} />
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
