import { useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  LITERATURE_DB, getAdsorptionLabels, getMofCandidates, getMofStructures, buildDatabaseRecords, downloadTextFile,
  buildMofMarkdownReport, buildMofCandidateMarkdownReport, buildMofDataGaps, toolbarBtn,
  BasisBadge, PageHeader, ResultLayer, Callout, safeVal, CopyLinkButton,
  FieldProvenanceButton, EvidenceLevelLegend,
  buildCriticScoringModel,
} from "../../shared"
import { CandidateComparisonModal, CompareTray } from "../mof/CandidateComparisonModal"

const KEY_FIELDS = [
  { key: "surfaceArea",      label: { en: "Surface area", zh: "比表面积" }, unit: "m²/g" },
  { key: "poreSizeA",        label: { en: "Pore size",    zh: "孔径"    }, unit: "Å" },
  { key: "poreVolume",       label: { en: "Pore volume",  zh: "孔体积"  }, unit: "cm³/g" },
  { key: "co2Uptake",        label: { en: "CO₂ uptake",   zh: "CO₂ 吸附量" }, unit: "mmol/g" },
  { key: "bandGap",          label: { en: "Band gap",     zh: "带隙"    }, unit: "eV" },
  { key: "waterStability",   label: { en: "Water stab.",  zh: "水稳定性" }, unit: "" },
  { key: "thermalStability", label: { en: "Thermal stab.", zh: "热稳定性" }, unit: "" },
  { key: "toxicityConcern",  label: { en: "Toxicity",     zh: "毒性关注" }, unit: "" },
]

const FILTER_CONTROL_HEIGHT = 38
const FILTER_CONTROL_RADIUS = 6
const FILTER_LABEL_HEIGHT = 14
const FILTER_ACTION_WIDTH = 74

function isFieldCurated(src) {
  if (!src) return false
  if (src.sourceType === "pending") return false
  if (src.evidenceLevel === "needs-validation") return false
  return true
}

function isMissingValue(value) {
  return value === undefined || value === null || value === "" || value === "—" || value === "pending"
}

function recordFieldStatus(record, fieldKey) {
  const src = record.fieldSources?.[fieldKey]
  const hasValue = !isMissingValue(record[fieldKey]) || !isMissingValue(src?.value)
  if (isFieldCurated(src) || (hasValue && !record.fieldSources)) return "curated"
  if (src?.curationStatus === "needs-review" || src?.reviewStatus === "conflict" || src?.hasConflict) return "needs-review"
  return "pending"
}

function getOverviewSummary(record, lang) {
  const statuses = KEY_FIELDS.map(field => recordFieldStatus(record, field.key))
  const curatedCount = statuses.filter(status => status === "curated").length
  const needsReviewCount = statuses.filter(status => status === "needs-review").length
  const pendingCount = KEY_FIELDS.length - curatedCount - needsReviewCount
  const fieldsWithSource = KEY_FIELDS.filter(field => {
    const src = record.fieldSources?.[field.key]
    return src && src.sourceType !== "pending" && Boolean(src.sourceName || src.database || src.url || src.doi)
  }).length
  const fieldsWithCondition = KEY_FIELDS.filter(field => Boolean(record.fieldSources?.[field.key]?.condition)).length
  const statusId = curatedCount >= 5 && fieldsWithSource >= 3 ? "ready" : curatedCount >= 3 ? "partial" : curatedCount >= 1 ? "limited" : "pending"
  const labels = {
    ready: lang === "zh" ? "可初步查看" : "Ready",
    partial: lang === "zh" ? "部分完整" : "Partial",
    limited: lang === "zh" ? "信息有限" : "Limited",
    pending: lang === "zh" ? "待补充" : "Pending",
  }
  return {
    curatedCount,
    pendingCount,
    needsReviewCount,
    fieldsWithSource,
    fieldsWithCondition,
    statusId,
    label: labels[statusId],
  }
}

function DataQualitySection({ realSeedRows, lang, t, isMobile }) {
  const zh = lang === "zh"

  // 1. Provenance coverage by field
  const coverageData = useMemo(() => {
    if (!realSeedRows.length) return KEY_FIELDS.map(f => ({ name: f.label[zh ? "zh" : "en"], pct: 0 }))
    return KEY_FIELDS.map(f => {
      const count = realSeedRows.filter(row => isFieldCurated(row.fieldSources?.[f.key])).length
      return { name: f.label[zh ? "zh" : "en"], pct: Math.round((count / realSeedRows.length) * 100) }
    })
  }, [realSeedRows, zh])

  // 2. Evidence level distribution
  const evidenceData = useMemo(() => {
    const counts = {}
    realSeedRows.forEach(row => {
      const ev = row.evidenceLevel || "pending"
      counts[ev] = (counts[ev] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [realSeedRows])

  // 3. Curation status per MOF
  const curationData = useMemo(() => {
    return realSeedRows.map(row => {
      const curated = KEY_FIELDS.filter(f => isFieldCurated(row.fieldSources?.[f.key])).length
      const pending = KEY_FIELDS.length - curated
      return { name: row.name || row.id || "—", curated, pending }
    })
  }, [realSeedRows])

  const COLORS = {
    curated: t.accent || "#4f86f7",
    pending: t.border || "#dde2ea",
    evidence: [t.accent, t.accentSoft, t.warn, t.faint, "#a78bfa", "#34d399", "#f87171"],
  }

  const chartWrap = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: isMobile ? 12 : 14,
    minWidth: 0,
    overflow: "visible",
  }

  if (!realSeedRows.length) {
    return (
      <div style={{ color: t.faint, fontSize: 12, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        {zh ? "暂无真实种子数据可用于图表计算。" : "No real-seed records available for chart computation."}
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Chart 1 — Provenance coverage */}
      <div style={chartWrap}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
          {zh ? "字段来源覆盖率（%）" : "Provenance Coverage by Field (%)"}
        </div>
        <div style={{ color: t.faint, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
          {zh
            ? `有已核实来源的字段占比（n = ${realSeedRows.length} 条记录）`
            : `Fraction of records with a verified source for each field (n = ${realSeedRows.length})`}
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 210 : 160}>
          <BarChart data={coverageData} margin={isMobile ? { top: 8, right: 10, left: 0, bottom: 18 } : { top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="name" tick={isMobile ? false : { fontSize: 9, fill: t.subtle }} interval={0} height={isMobile ? 8 : 30} />
            <YAxis domain={[0, 100]} width={isMobile ? 34 : 40} tick={{ fontSize: 9, fill: t.subtle }} />
            <RechartsTooltip
              contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
              formatter={(v) => [`${v}%`, zh ? "覆盖率" : "Coverage"]}
            />
            <Bar dataKey="pct" fill={COLORS.curated} radius={[3, 3, 0, 0]}>
              {coverageData.map((entry, i) => (
                <Cell key={i} fill={entry.pct === 0 ? COLORS.pending : COLORS.curated} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Chart 2 — Evidence level distribution */}
        <div style={chartWrap}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
            {zh ? "证据等级分布" : "Evidence Level Distribution"}
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 190 : 150}>
            <BarChart data={evidenceData} layout="vertical" margin={isMobile ? { top: 4, right: 12, left: 4, bottom: 10 } : { top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: t.subtle }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: isMobile ? 8 : 9, fill: t.subtle }} width={isMobile ? 96 : 70} />
              <RechartsTooltip
                contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [v, zh ? "记录数" : "Records"]}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {evidenceData.map((entry, i) => (
                  <Cell key={i} fill={COLORS.evidence[i % COLORS.evidence.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Curation status per MOF */}
        <div style={chartWrap}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 4 }}>
            {zh ? "每个 MOF 的整理进度（8 个关键字段）" : "Curation Status per MOF (8 key fields)"}
          </div>
          <div style={{ color: t.faint, fontSize: 10, marginBottom: 8 }}>
            {zh ? "■ 已整理  □ 待整理" : "■ Curated  □ Pending"}
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 210 : 150}>
            <BarChart data={curationData} margin={isMobile ? { top: 4, right: 10, left: 0, bottom: 16 } : { top: 0, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="name" tick={isMobile ? false : { fontSize: 8, fill: t.subtle }} interval={0} height={isMobile ? 8 : 30} />
              <YAxis domain={[0, 8]} width={isMobile ? 34 : 40} tick={{ fontSize: 9, fill: t.subtle }} />
              <RechartsTooltip
                contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
                formatter={(v, n) => [v, n === "curated" ? (zh ? "已整理" : "Curated") : (zh ? "待整理" : "Pending")]}
              />
              <Bar dataKey="curated" stackId="a" fill={COLORS.curated} name="curated" />
              <Bar dataKey="pending" stackId="a" fill={COLORS.pending} radius={[3, 3, 0, 0]} name="pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6 }}>
        {zh
          ? "图表数据从真实种子数据集的字段来源记录实时计算。大部分字段当前显示为待整理，反映数据库的实际整理状态。"
          : "Chart data are computed from Real Seed Dataset fieldSources. Most fields appear as pending, reflecting the actual curation state of the dataset."}
      </div>
    </div>
  )
}

function normalizeDemoRecord(item) {
  const metalNodes = Array.isArray(item.metalNodes) ? item.metalNodes : item.metal ? [item.metal] : []
  const source = Array.isArray(item.source) ? item.source.join(" / ") : item.source
  const limitations = Array.isArray(item.limitations) ? item.limitations.join("; ") : item.limitations
  const activeSiteHypothesis = Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis
  return {
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes,
    metal: metalNodes.join(", ") || item.metal || "—",
    linker: item.linker || "—",
    topology: item.topology || "—",
    poreSizeA: Number(item.poreSizeA ?? item.pd ?? item.lcd ?? 0),
    surfaceArea: Number(item.surfaceArea ?? item.bet ?? 0),
    poreVolume: item.poreVolume ?? item.pv ?? "—",
    co2Uptake: item.co2Uptake ?? "—",
    bandGap: item.bandGap ?? "—",
    waterStability: item.waterStability || "—",
    thermalStability: item.thermalStability || "—",
    costLevel: item.costLevel || "—",
    toxicityConcern: item.toxicityConcern || "—",
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    activeSiteHypothesis: activeSiteHypothesis || "—",
    source: source || item.sourceDatabase || item.sourceType || "Demo seed",
    evidenceLevel: item.evidenceLevel || "Low",
    limitations: limitations || "Demo / placeholder record; needs validation.",
    dataStatus: item.dataStatus || "demo / placeholder / needs validation",
    dataMode: item.dataMode || "demo",
    fieldSources: item.fieldSources || undefined,
  }
}

function normalizeLegacyRecord(item) {
  return normalizeDemoRecord({
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes: item.metal ? [item.metal] : [],
    linker: item.linker,
    topology: item.topology,
    poreSizeA: item.pd || item.lcd || 0,
    surfaceArea: item.bet || 0,
    poreVolume: item.pv,
    co2Uptake: item.co2Uptake || item.co2_uptake_mmol_g,
    bandGap: item.bandGap || "—",
    waterStability: item.waterStability || "unmarked",
    thermalStability: item.thermalStability || "unmarked",
    costLevel: "unmarked",
    toxicityConcern: "unmarked",
    reactionClasses: [],
    activeSiteHypothesis: item.oms ? "Open metal site marked in structure record" : "Not specified",
    source: item.sourceDatabase || item.sourceType || "local seed",
    evidenceLevel: item.qualityFlag ? "Low-medium" : "Low",
    limitations: item.qualityFlag || "Legacy structure/label record; use as a data attribute, not a conclusion.",
    dataStatus: "local seed / needs validation",
  })
}

const zhValue = (value, lang) => {
  if (lang !== "zh") return value
  return {
    High: "高",
    Medium: "中",
    Low: "低",
    "Low-medium": "低-中",
    "needs-validation": "待验证 needs-validation",
    "unmarked": "未标注",
    "Demo seed": "演示种子数据",
    "local seed": "本地种子数据",
    "real-seed / public-database-placeholder": "真实种子 / 公开数据库占位",
  }[value] || value
}

const LIBRARY_TEXT_ZH = {
  "Real seed record. Structural topology (fcu) confirmed from CoRE MOF. Adsorption and electronic descriptors require curated literature or GCMC values before use.": "真实种子记录。结构拓扑（fcu）来自 CoRE MOF；吸附与电子描述符在作为性能标签前仍需补充整理后的文献或 GCMC 数值。",
  "Real seed record based on Furukawa 2014 synthesis report. Descriptor values require GCMC or measured BET before use as performance label.": "基于 Furukawa 2014 合成报道的真实种子记录。描述符数值在作为性能标签前仍需 GCMC 或实测 BET 支撑。",
  "Well-known benchmark MOF. Open Cu2+ sites reported in literature. Water stability is low — experimental conditions must be specified before drawing conclusions.": "常用基准 MOF。文献报道存在开放 Cu2+ 位点；水稳定性较低，得出结论前必须明确实验条件。",
  "Real seed record. Chromium toxicity concern must be disclosed. Very high surface area reported in literature but requires experimental BET for each batch.": "真实种子记录。必须披露铬毒性关注；文献报道较高比表面积，但每个批次仍需实验 BET 支撑。",
  "Real seed record. Sodalite topology confirmed. Wide band gap (~5 eV range) reduces photocatalytic interest without modification. CO2 uptake must be measured per sample.": "真实种子记录。Sodalite 拓扑已确认；较宽带隙（约 5 eV）在未改性时会降低光催化兴趣，CO2 吸附量仍需逐样品测量。",
  "Real seed record. One of the highest-reported CO2 uptake MOFs at low pressure; values require source-specific citation and experimental confirmation before comparison.": "真实种子记录。低压 CO2 吸附量报道较高，但比较前需要逐来源引用和实验确认。",
  "Real seed record. Extended biphenyl linker gives larger pore than UiO-66. Functionalization potential is a hypothesis, not a measured result.": "真实种子记录。延长的联苯连接体使孔径大于 UiO-66；官能化潜力仍是假设，不是实测结果。",
  "Real seed record. Pyrene-based linker supports light absorption hypothesis. Photocatalytic performance must be measured, not inferred from linker alone.": "真实种子记录。芘基连接体支持光吸收假设；光催化性能必须实测，不能仅由连接体推断。",
  "Real seed record. MIL-53 breathing behavior makes static pore descriptors unreliable — open and narrow forms have different pore sizes. Must specify phase before comparing descriptors.": "真实种子记录。MIL-53 的 breathing 行为会削弱静态孔描述符可靠性，open 与 narrow 形态孔径不同；比较描述符前必须明确相态。",
  "Real seed record. Porphyrin linker hypothesis for photocatalysis and metalation. Actual catalytic performance requires measured quantum yield and TON.": "真实种子记录。卟啉连接体支持光催化和金属化假设；真实催化性能仍需实测量子产率和 TON。",
  "Real seed record. Ti-oxo cluster photocatalytic hypothesis is supported by literature but remains task-specific. NH2-functionalized variant (MIL-125-NH2) is more studied for CO2 photoreduction.": "真实种子记录。Ti-oxo 簇的光催化假设有文献支持，但仍具有任务特异性；NH2 功能化变体（MIL-125-NH2）在 CO2 光还原方向研究更多。",
  "This is a real-seed framework record, not a complete performance label.": "这是真实种子框架记录，不是完整性能标签。",
  "Structural descriptors require validation against synthesized samples.": "结构描述符需要与合成样品进行验证。",
  "Experimental validation is required before drawing catalytic conclusions.": "得出催化结论前需要实验验证。",
  "Synthesis conditions vary by lab; pore descriptors are structure-dependent.": "合成条件随实验室而异；孔描述符依赖结构状态。",
  "CO2 uptake not included — requires measured isotherm.": "尚未纳入 CO2 吸附量，需要实测等温线。",
  "Experimental validation is required.": "需要实验验证。",
  "Low water stability limits application range; must be explicitly stated.": "较低水稳定性限制应用范围，必须明确说明。",
  "Open metal site hypothesis requires experimental confirmation for each batch.": "开放金属位点假设需要逐批次实验确认。",
  "Chromium toxicity concern requires explicit disclosure in any application context.": "任何应用语境都需要明确披露铬毒性关注。",
  "Reported BET values vary significantly across synthesis conditions.": "报道的 BET 数值会随合成条件显著变化。",
  "Wide band gap reduces direct photocatalytic applicability without functionalization.": "在未功能化时，宽带隙会降低直接光催化适用性。",
  "Pore size and uptake depend on activation and measurement conditions.": "孔径和吸附量依赖活化与测试条件。",
  "CO2 uptake is strongly condition-dependent (temperature, pressure, humidity).": "CO2 吸附量强依赖温度、压力和湿度条件。",
  "Mg variant only; Fe/Ni/Co variants have different stability and uptake profiles.": "仅指 Mg 变体；Fe/Ni/Co 变体具有不同稳定性和吸附特征。",
  "Larger pore may reduce CO2 uptake versus UiO-66 at low pressure.": "在低压条件下，较大孔径可能降低相对 UiO-66 的 CO2 吸附量。",
  "Biphenyl rotation can affect accessible pore volume; requires molecular dynamics.": "联苯旋转可能影响可达孔体积，需要分子动力学验证。",
  "Photocatalytic activity is a hypothesis based on linker photophysics, not a measured result.": "光催化活性是基于连接体光物理性质的假设，不是实测结果。",
  "ALD node modification changes structure; descriptors must be re-measured post-modification.": "ALD 节点改性会改变结构，改性后必须重新测量描述符。",
  "Breathing behavior means a single pore size or uptake value is misleading.": "Breathing 行为意味着单一孔径或吸附量数值可能具有误导性。",
  "CO2 uptake depends on the breathing transition pressure and temperature.": "CO2 吸附量依赖 breathing 转变压力和温度。",
  "Experimental validation under defined conditions is required.": "需要在明确条件下进行实验验证。",
  "Porphyrin metalation changes electronic structure; descriptors are metalation-specific.": "卟啉金属化会改变电子结构，描述符具有金属化特异性。",
  "Photocatalytic activity requires measured quantum yield, not band gap alone.": "光催化活性需要实测量子产率，不能只看带隙。",
  "Base MIL-125 absorbs primarily UV; visible-light activity requires NH2 or other functionalization.": "基础 MIL-125 主要吸收紫外光；可见光活性需要 NH2 或其他功能化。",
  "Photocatalytic selectivity depends on reaction medium and co-catalyst.": "光催化选择性依赖反应介质和助催化剂。",
}

function zhLibraryText(value, lang) {
  if (lang !== "zh") return value
  if (Array.isArray(value)) return value.map(item => zhLibraryText(item, lang)).join("; ")
  const text = String(value)
  if (LIBRARY_TEXT_ZH[text]) return LIBRARY_TEXT_ZH[text]
  if (text.includes("; ")) return text.split(/;\s*/).map(item => zhLibraryText(item, lang)).join("; ")
  return zhValue(text, lang)
}

const zhDataStatus = (value, lang) => {
  if (lang !== "zh") return value
  return {
    "demo / placeholder / needs validation": "演示 / 占位 / 待验证",
    "local seed / needs validation": "本地种子 / 待验证",
    "real-seed / pending curation": "真实种子 / 待整理",
  }[value] || zhLibraryText(value, lang)
}

function dataModePanelPosition(anchorRect, isMobile) {
  if (isMobile) {
    return {
      top: 96,
      left: 16,
      right: 16,
      width: "auto",
      maxHeight: "calc(100vh - 128px)",
    }
  }
  const width = 380
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const left = Math.max(16, Math.min((anchorRect?.right ?? vw - 24) - width, vw - width - 16))
  return {
    top: (anchorRect?.bottom ?? 120) + 8,
    left,
    width,
    maxHeight: "min(420px, calc(100vh - 140px))",
  }
}

function inspectorStatusLabel(status, lang) {
  if (status === "curated") return lang === "zh" ? "已整理 / curated" : "curated"
  if (status === "needs-review") return lang === "zh" ? "需复核 / needs review" : "needs review"
  return lang === "zh" ? "待补充 / pending" : "pending"
}

function inspectorStatusTone(status) {
  if (status === "curated") return "calc"
  if (status === "needs-review") return "danger"
  return "warn"
}

function readFieldValue(record, field, lang) {
  const source = record.fieldSources?.[field.key]
  const raw = !isMissingValue(record[field.key]) ? record[field.key] : source?.value
  if (isMissingValue(raw)) return lang === "zh" ? "待补充" : "Pending"
  return field.unit ? `${raw} ${field.unit}` : zhValue(raw, lang)
}

function sourceLine(source, lang) {
  if (!source) return lang === "zh" ? "来源待补充" : "Source pending"
  return [
    source.sourceName || source.database || source.sourceType || (lang === "zh" ? "未命名来源" : "Unnamed source"),
    source.condition ? `${lang === "zh" ? "条件" : "Condition"}: ${source.condition}` : "",
    source.doi ? `DOI: ${source.doi}` : "",
  ].filter(Boolean).join(" · ")
}

function safeFileSegment(value) {
  return String(value || "mof")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "mof"
}

function MofInspector({
  record,
  isSelected,
  limitReached,
  onToggleCompare,
  onExport,
  onClose,
  t,
  lang,
  isMobile,
}) {
  if (!record) return null
  const gaps = buildMofDataGaps(record, lang)
  const basicRows = [
    [lang === "zh" ? "名称" : "Name", record.name],
    [lang === "zh" ? "化学式" : "Formula", record.formula],
    [lang === "zh" ? "金属节点" : "Metal node", record.metal],
    [lang === "zh" ? "连接体" : "Linker", record.linker],
    [lang === "zh" ? "拓扑" : "Topology", record.topology],
  ]
  const gapText = (items) => items.length ? items.join(", ") : (lang === "zh" ? "未发现关键缺口；仍需保持验证边界。" : "No obvious key gap; validation boundary still applies.")

  const sectionTitle = {
    color: t.textStrong,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.35,
  }
  const sectionBox = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 11,
    minWidth: 0,
  }

  return (
    <aside
      aria-label={lang === "zh" ? "MOF 详情 Inspector" : "MOF detail inspector"}
      style={{
        background: t.panel,
        border: `1px solid ${t.borderStrong || t.border}`,
        borderRadius: 8,
        boxShadow: t.shadowSm,
        padding: isMobile ? 12 : 14,
        display: "grid",
        gap: 12,
        minWidth: 0,
        position: isMobile ? "relative" : "sticky",
        top: isMobile ? "auto" : 88,
        maxHeight: isMobile ? "none" : "calc(100vh - 112px)",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 900, marginBottom: 4 }}>
            Inspector
          </div>
          <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 920, lineHeight: 1.2, overflowWrap: "anywhere" }}>
            {record.name}
          </div>
          <div style={{ color: t.subtle, fontSize: 11, marginTop: 4, overflowWrap: "anywhere" }}>
            {record.formula}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === "zh" ? "关闭详情面板" : "Close inspector"}
          style={{ ...toolbarBtn(t), padding: "5px 8px", fontSize: 12, lineHeight: 1 }}
        >
          x
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <BasisBadge tone="info">{zhValue(record.evidenceLevel, lang)}</BasisBadge>
        <BasisBadge tone="proxy">{zhDataStatus(record.dataStatus, lang)}</BasisBadge>
      </div>

      <section style={sectionBox}>
        <div style={sectionTitle}>{lang === "zh" ? "基本信息" : "Basic information"}</div>
        <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
          {basicRows.map(([label, value]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr)", gap: 8, alignItems: "baseline" }}>
              <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{label}</span>
              <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 760, overflowWrap: "anywhere" }}>{value || "—"}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionBox}>
        <div style={sectionTitle}>{lang === "zh" ? "关键描述符与字段来源状态" : "Key descriptors and field provenance"}</div>
        <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
          {KEY_FIELDS.map(field => {
            const status = recordFieldStatus(record, field.key)
            const source = record.fieldSources?.[field.key]
            return (
              <div
                key={field.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "minmax(88px, 1fr) minmax(82px, 1fr)",
                  gap: 6,
                  alignItems: "start",
                  background: t.panel,
                  border: `1px solid ${t.border}`,
                  borderRadius: 7,
                  padding: "7px 8px",
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 1, color: t.faint, fontSize: 10, fontWeight: 850 }}>
                    {field.label[lang === "zh" ? "zh" : "en"]}
                    <FieldProvenanceButton fieldKey={field.key} fieldLabel={field.label[lang === "zh" ? "zh" : "en"]} source={source} lang={lang} />
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, marginTop: 3, overflowWrap: "anywhere" }}>
                    {readFieldValue(record, field, lang)}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 4, justifyItems: isMobile ? "start" : "end", minWidth: 0 }}>
                  <BasisBadge tone={inspectorStatusTone(status)}>{inspectorStatusLabel(status, lang)}</BasisBadge>
                  <div style={{ color: t.faint, fontSize: 9.5, lineHeight: 1.35, textAlign: isMobile ? "left" : "right", overflowWrap: "anywhere" }}>
                    {sourceLine(source, lang)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={sectionBox}>
        <div style={sectionTitle}>{lang === "zh" ? "证据状态与限制" : "Evidence status and limitations"}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, marginTop: 8 }}>
          <strong style={{ color: t.textStrong }}>{lang === "zh" ? "证据等级：" : "Evidence level: "}</strong>{record.evidenceLevel || "pending"}
          <br />
          <strong style={{ color: t.textStrong }}>{lang === "zh" ? "数据状态：" : "Data status: "}</strong>{zhDataStatus(record.dataStatus, lang)}
          <br />
          <strong style={{ color: t.textStrong }}>{lang === "zh" ? "限制：" : "Limitations: "}</strong>{zhLibraryText(record.limitations, lang)}
        </div>
      </section>

      <section style={{ ...sectionBox, borderLeft: `3px solid ${t.warn}` }}>
        <div style={sectionTitle}>{lang === "zh" ? "数据缺口提示" : "Data gap notes"}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, marginTop: 8 }}>
          <div><strong style={{ color: t.textStrong }}>EcoScreen: </strong>{gapText(gaps.ecoScreen)}</div>
          <div style={{ marginTop: 5 }}><strong style={{ color: t.textStrong }}>CatalysisLab: </strong>{gapText(gaps.catalysisLab)}</div>
          <div style={{ color: t.faint, fontSize: 10.5, marginTop: 7 }}>
            {lang === "zh"
              ? "缺口字段会降低候选优先级判断的可解释性，不应被补齐为默认性能结论。"
              : "Missing fields reduce interpretability of candidate-priority judgments and should not be imputed as final performance conclusions."}
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gap: 7 }}>
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={limitReached}
          style={{
            ...toolbarBtn(t),
            justifyContent: "center",
            color: isSelected ? t.accentText : limitReached ? t.faint : t.subtle,
            border: `1px solid ${isSelected ? t.accent : t.borderStrong}`,
            opacity: limitReached ? 0.62 : 1,
            cursor: limitReached ? "not-allowed" : "pointer",
          }}
        >
          {isSelected
            ? (lang === "zh" ? "已加入候选对比" : "Added to comparison")
            : limitReached
              ? (lang === "zh" ? "已达到对比上限" : "Compare limit reached")
              : (lang === "zh" ? "加入候选对比" : "Add to comparison")}
        </button>
        <button type="button" onClick={onExport} style={{ ...toolbarBtn(t), justifyContent: "center", color: t.accentText, border: `1px solid ${t.accent}` }}>
          {lang === "zh" ? "导出该 MOF 报告" : "Export MOF report"}
        </button>
        <button type="button" onClick={onClose} style={{ ...toolbarBtn(t), justifyContent: "center" }}>
          {lang === "zh" ? "关闭面板" : "Close panel"}
        </button>
      </div>
    </aside>
  )
}

function DataModeInfoPopover({ open, onClose, anchorRect, lang, t, isMobile }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = event => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  const panelPos = dataModePanelPosition(anchorRect, isMobile)

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1198, background: "transparent" }}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label={lang === "zh" ? "数据模式说明" : "Data mode notes"}
        onClick={event => event.stopPropagation()}
        style={{
          position: "fixed",
          ...panelPos,
          zIndex: 1199,
          overflowY: "auto",
          background: t.panel,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 10,
          boxShadow: t.shadowMd,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>
            {lang === "zh" ? "数据模式说明" : "Data mode notes"}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === "zh" ? "关闭数据模式说明" : "Close data mode notes"}
            style={{ background: "transparent", border: "none", color: t.subtle, cursor: "pointer", fontSize: 17, lineHeight: 1, padding: 0 }}
          >
            x
          </button>
        </div>
        <div style={{ display: "grid", gap: 10, color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          <p style={{ margin: 0 }}>
            {lang === "zh"
              ? "演示数据用于展示筛选流程和交互逻辑，不用于科研结论。"
              : "Demo data are used to demonstrate the screening workflow and interaction logic, not for scientific conclusions."}
          </p>
          <p style={{ margin: 0 }}>
            {lang === "zh"
              ? "真实种子数据用于承载真实文献或数据库整理记录，但当前仍是种子库，不代表完整数据库。部分字段仍处于待复核状态，后续可能更新。"
              : "Real seed data carry curated records from literature or databases, but the current set remains a seed library rather than a complete database. Some fields are still under review and may be updated later."}
          </p>
        </div>
      </div>
    </>
  )
}

function DataModeBar({ dataMode, onChange, recordCount, infoOpen, setInfoOpen, lang, t, isMobile }) {
  const infoButtonRef = useRef(null)
  const [anchorRect, setAnchorRect] = useState(null)
  const options = [
    { id: "demo", label: lang === "zh" ? "演示数据" : "Demo" },
    { id: "real-seed", label: lang === "zh" ? "真实种子数据" : "Real seed" },
  ]
  const modeNote = dataMode === "real-seed"
    ? (lang === "zh" ? "当前模式：真实种子记录，用于查看字段来源、整理状态与证据等级。" : "Current mode: real seed records for reviewing field sources, curation status, and evidence level.")
    : (lang === "zh" ? "当前模式：演示记录，用于查看筛选流程和交互逻辑。" : "Current mode: demo records for reviewing workflow and interaction logic.")

  const toggleInfo = () => {
    if (infoButtonRef.current) setAnchorRect(infoButtonRef.current.getBoundingClientRect())
    setInfoOpen(prev => !prev)
  }

  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "auto minmax(240px, 1fr) auto",
      gap: isMobile ? 9 : 12,
      alignItems: "center",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: isMobile ? 10 : "9px 12px",
      position: "relative",
    }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>
        {lang === "zh" ? "数据模式" : "Data mode"}
      </div>
      <div style={{ display: "inline-flex", gap: 4, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 3, width: "fit-content", maxWidth: "100%" }}>
        {options.map(option => {
          const active = option.id === dataMode
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              style={{
                border: `1px solid ${active ? t.accent : "transparent"}`,
                background: active ? t.panel : "transparent",
                color: active ? t.accentText : t.subtle,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: active ? 900 : 750,
                lineHeight: 1.2,
                padding: "7px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap" }}>
        <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 850 }}>
          {lang === "zh" ? `${recordCount} 条记录` : `${recordCount} records`}
        </span>
        <button
          ref={infoButtonRef}
          type="button"
          onClick={toggleInfo}
          aria-label={lang === "zh" ? "打开数据模式说明" : "Open data mode notes"}
          aria-expanded={infoOpen}
          style={{
            ...toolbarBtn(t),
            color: t.accentText,
            borderColor: infoOpen ? t.accent : t.borderStrong,
            padding: "6px 9px",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {lang === "zh" ? "数据说明" : "Data notes"} ⓘ
        </button>
      </div>
      <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 11.5, lineHeight: 1.45 }}>
        {modeNote}
      </div>
      <DataModeInfoPopover
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        anchorRect={anchorRect}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />
    </section>
  )
}

export function MOFLibraryTab({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("real-seed")
  const [query, setQuery] = useState("")
  const [metal, setMetal] = useState("all")
  const [source, setSource] = useState("all")
  const [evidence, setEvidence] = useState("all")
  const [poreMin, setPoreMin] = useState(0)
  const [poreMax, setPoreMax] = useState(40)
  const [areaMin, setAreaMin] = useState(0)
  const [areaMax, setAreaMax] = useState(5000)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dataModeInfoOpen, setDataModeInfoOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedInspectorId, setSelectedInspectorId] = useState(null)
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [demoRows, setDemoRows] = useState([])
  const [realSeedRows, setRealSeedRows] = useState([])
  const [status, setStatus] = useState("loading")
  const [selectedCompareIds, setSelectedCompareIds] = useState([])
  const [compareNotice, setCompareNotice] = useState("")
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [qualityChartsReady, setQualityChartsReady] = useState(false)
  const criticModel = useMemo(() => buildCriticScoringModel(), [])

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getMofStructures({ throwOnError: true }),
      getAdsorptionLabels({ throwOnError: true }),
      getMofCandidates({ mode: "demo", throwOnError: true }),
      getMofCandidates({ mode: "real-seed", throwOnError: true }),
    ])
      .then(([structures, labels, demo, realSeed]) => {
        if (!active) return
        const nextStructures = Array.isArray(structures) ? structures : []
        const nextLabels = Array.isArray(labels) ? labels : []
        const nextDemo = Array.isArray(demo) ? demo : []
        const nextRealSeed = Array.isArray(realSeed) ? realSeed : []
        setStructureRows(nextStructures)
        setLabelRows(nextLabels)
        setDemoRows(nextDemo)
        setRealSeedRows(nextRealSeed)
        setStatus(nextStructures.length || nextLabels.length || nextDemo.length || nextRealSeed.length ? "loaded" : "empty")
      })
      .catch((error) => {
        console.warn("MOF Library data load failed.", error)
        if (!active) return
        setStatus("fallback")
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setQualityChartsReady(false)
    let timer = null
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => setQualityChartsReady(true), 90)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (timer) window.clearTimeout(timer)
    }
  }, [dataMode])

  useEffect(() => {
    setSelectedCompareIds([])
    setCompareNotice("")
    setComparisonOpen(false)
    setDataModeInfoOpen(false)
    setSelectedInspectorId(null)
  }, [dataMode])

  const records = useMemo(() => {
    if (dataMode === "real-seed" && realSeedRows.length) {
      return realSeedRows.map(item => normalizeDemoRecord({
        ...item,
        // Graceful fallback for null numeric fields
        poreSizeA: item.poreSizeA ?? "pending",
        surfaceArea: item.surfaceArea ?? "pending",
        poreVolume: item.poreVolume ?? "pending",
        co2Uptake: item.co2Uptake ?? "pending",
        bandGap: item.bandGap ?? "pending",
        dataStatus: item.curationNote || "real-seed / pending curation",
      }))
    }
    if (demoRows.length) return demoRows.map(normalizeDemoRecord)
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return (loaded.length ? loaded : LITERATURE_DB).map(normalizeLegacyRecord)
  }, [dataMode, demoRows, realSeedRows, structureRows, labelRows])

  const metals = useMemo(() => Array.from(new Set(records.flatMap(item => item.metalNodes).filter(Boolean))).sort(), [records])
  const sources = useMemo(() => Array.from(new Set(records.map(item => item.source || "local seed"))).sort(), [records])
  const evidenceLevels = useMemo(() => Array.from(new Set(records.map(item => item.evidenceLevel || "Low"))).sort(), [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter(item => !q || [item.name, item.formula, item.metal, item.linker, item.topology, item.source, item.evidenceLevel].some(value => String(value || "").toLowerCase().includes(q)))
      .filter(item => metal === "all" || item.metalNodes.includes(metal))
      .filter(item => source === "all" || item.source === source)
      .filter(item => evidence === "all" || item.evidenceLevel === evidence)
      .filter(item => Number(item.poreSizeA || 0) >= Number(poreMin) && Number(item.poreSizeA || 0) <= Number(poreMax))
      .filter(item => Number(item.surfaceArea || 0) >= Number(areaMin) && Number(item.surfaceArea || 0) <= Number(areaMax))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [records, query, metal, source, evidence, poreMin, poreMax, areaMin, areaMax])

  const selectedCompareCandidates = useMemo(() => {
    const byId = new Map(records.map(item => [item.id, item]))
    return selectedCompareIds.map(id => byId.get(id)).filter(Boolean)
  }, [records, selectedCompareIds])

  const selectedInspectorRecord = useMemo(() => {
    if (!selectedInspectorId) return null
    return records.find(item => item.id === selectedInspectorId) || null
  }, [records, selectedInspectorId])

  const overviewRows = useMemo(() => filtered.map(item => ({
    item,
    summary: getOverviewSummary(item, lang),
  })), [filtered, lang])

  const criticByName = useMemo(() => {
    const map = new Map()
    criticModel.candidates.forEach(candidate => {
      map.set(String(candidate.name || "").toLowerCase(), candidate)
      if (candidate.libraryName) map.set(String(candidate.libraryName).toLowerCase(), candidate)
    })
    return map
  }, [criticModel])

  const getCriticSummary = (item) => criticByName.get(String(item?.name || "").toLowerCase()) || null

  const openRecordFromOverview = (id) => {
    setSelectedInspectorId(id)
    setDataModeInfoOpen(false)
  }

  const toggleCompare = (item) => {
    setCompareNotice("")
    setSelectedCompareIds(prev => {
      if (prev.includes(item.id)) return prev.filter(id => id !== item.id)
      if (prev.length >= 3) {
        setCompareNotice(lang === "zh" ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.")
        return prev
      }
      return [...prev, item.id]
    })
  }

  const openScoringDetails = () => {
    if (typeof window === "undefined") return
    window.location.hash = "ecoscreen"
  }

  const exportCsv = () => {
    const header = ["MOF name", "Metal nodes", "Linker", "Pore size A", "Surface area m2/g", "CO2 uptake", "Band gap", "Stability", "Source", "Evidence level", "Limitations"]
    const rows = filtered.map(item => [
      item.name, item.metal, item.linker, item.poreSizeA, item.surfaceArea, item.co2Uptake, item.bandGap,
      `${item.waterStability}/${item.thermalStability}`, item.source, item.evidenceLevel, item.limitations,
    ])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    downloadTextFile("ecomof_mof_library.csv", csv, "text/csv")
  }

  const exportMofReport = (item) => {
    if (!item) return
    const markdown = buildMofMarkdownReport(item, {
      lang,
      dataMode,
      scopeLabel: lang === "zh" ? "MOF Library 单条记录" : "MOF Library single record",
    })
    downloadTextFile(`ecomof_mof_${safeFileSegment(item.name)}.md`, markdown, "text/markdown")
  }

  const exportCandidateReport = () => {
    const hasSelection = selectedCompareCandidates.length > 0
    const rows = hasSelection ? selectedCompareCandidates : filtered
    const markdown = buildMofCandidateMarkdownReport(rows, {
      lang,
      dataMode,
      scopeLabel: hasSelection
        ? (lang === "zh" ? `MOF Library 已选候选（${rows.length} 个）` : `MOF Library selected candidates (${rows.length})`)
        : (lang === "zh" ? `MOF Library 当前筛选结果（${rows.length} 个）` : `MOF Library current filtered records (${rows.length})`),
    })
    const suffix = hasSelection ? `selected-${rows.length}` : `filtered-${rows.length}`
    downloadTextFile(`ecomof_mof_candidates_${suffix}.md`, markdown, "text/markdown")
  }

  const controlStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: FILTER_CONTROL_RADIUS,
    boxSizing: "border-box",
    color: t.text,
    display: "block",
    fontSize: 12,
    height: FILTER_CONTROL_HEIGHT,
    lineHeight: "16px",
    minWidth: 0,
    padding: "0 10px",
    width: "100%",
  }
  const compactInputStyle = { ...controlStyle, fontFamily: FONT_MONO, padding: "0 8px" }
  const labelStyle = {
    alignItems: "stretch",
    color: t.faint,
    display: "grid",
    fontSize: 10,
    fontWeight: 850,
    gap: 5,
    gridTemplateRows: `${FILTER_LABEL_HEIGHT}px ${FILTER_CONTROL_HEIGHT}px`,
    lineHeight: `${FILTER_LABEL_HEIGHT}px`,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  }
  const detailBlock = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }
  const field = (label, value, fieldKey, fieldSources) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 4 }}>
        <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
        {fieldKey && <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={fieldSources?.[fieldKey]} lang={lang} />}
      </div>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 750, overflowWrap: "anywhere" }}>
        {value || (lang === "zh" ? "暂无数据" : "Not available")}
      </div>
    </div>
  )

  const filterFields = (
    <>
      <label style={labelStyle}>
        {lang === "zh" ? "搜索" : "Search"}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={lang === "zh" ? "搜索材料名称、金属节点或数据来源" : "Search material name, metal node, or data source"}
          style={controlStyle}
        />
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "金属类型" : "Metal type"}
        <select value={metal} onChange={e => setMetal(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {metals.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "孔结构" : "Pore structure"}
        <span style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 6, height: FILTER_CONTROL_HEIGHT, minWidth: 0 }}>
          <input type="number" aria-label={lang === "zh" ? "最小孔径 Å" : "Pore min Å"} value={poreMin} onChange={e => setPoreMin(e.target.value)} style={compactInputStyle} />
          <input type="number" aria-label={lang === "zh" ? "最大孔径 Å" : "Pore max Å"} value={poreMax} onChange={e => setPoreMax(e.target.value)} style={compactInputStyle} />
        </span>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "数据来源" : "Data source"}
        <select value={source} onChange={e => setSource(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部来源" : "all sources"}</option>
          {sources.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "证据等级" : "Evidence Level"}
        <select value={evidence} onChange={e => setEvidence(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {evidenceLevels.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setFiltersOpen(prev => !prev)}
        aria-expanded={filtersOpen}
        style={{ ...toolbarBtn(t), boxSizing: "border-box", height: FILTER_CONTROL_HEIGHT, alignSelf: "end", justifyContent: "center", whiteSpace: "nowrap", width: FILTER_ACTION_WIDTH }}
      >
        {filtersOpen ? (lang === "zh" ? "收起" : "Less") : (lang === "zh" ? "更多" : "More")}
      </button>
    </>
  )
  const modeRecordCount = records.length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "MOF 候选库" : "MOF Library"}
        subtitle={lang === "zh"
          ? "浏览候选材料，查看描述符完整度、字段来源与证据等级。"
          : "Browse candidate materials, descriptor completeness, field sources, and evidence levels."}
        action={
          <>
            <BasisBadge tone={status === "loaded" ? "calc" : "proxy"}>{status === "loaded" ? "public/data" : (lang === "zh" ? "种子数据" : "fallback seed")}</BasisBadge>
            <CopyLinkButton hash="library" ariaLabel={lang === "zh" ? "复制 MOF 候选库链接" : "Copy MOF Library link"} />
          </>
        }
      />

      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>
            {lang === "zh" ? "筛选条件" : "Filters"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ color: t.faint, fontSize: 11, fontFamily: FONT_MONO }}>
              {filtered.length}/{records.length}
            </div>
            <button
              type="button"
              onClick={exportCandidateReport}
              disabled={filtered.length === 0 && selectedCompareCandidates.length === 0}
              style={{
                ...toolbarBtn(t),
                padding: "5px 9px",
                fontSize: 10.5,
                color: selectedCompareCandidates.length ? t.accentText : t.subtle,
                border: `1px solid ${selectedCompareCandidates.length ? t.accent : t.borderStrong}`,
                opacity: filtered.length === 0 && selectedCompareCandidates.length === 0 ? 0.55 : 1,
              }}
            >
              {selectedCompareCandidates.length
                ? (lang === "zh" ? `↓ 选中报告 · ${selectedCompareCandidates.length}` : `↓ Selected report · ${selectedCompareCandidates.length}`)
                : (lang === "zh" ? "↓ 筛选报告" : "↓ Filtered report")}
            </button>
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isNarrow
              ? "repeat(2, minmax(0, 1fr))"
              : `repeat(5, minmax(0, 1fr)) ${FILTER_ACTION_WIDTH}px`,
          gap: 8,
          alignItems: "end",
        }}>
          {filterFields}
        </div>
        {filtersOpen && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr)) auto auto",
            gap: 8,
            alignItems: "end",
            marginTop: 9,
            paddingTop: 9,
            borderTop: `1px solid ${t.divider}`,
          }}>
            {[
              [lang === "zh" ? "最小比表面积" : "Surface area min", areaMin, setAreaMin],
              [lang === "zh" ? "最大比表面积" : "Surface area max", areaMax, setAreaMax],
            ].map(([label, value, setter]) => (
              <label key={label} style={labelStyle}>
                {label}
                <input type="number" value={value} onChange={e => setter(e.target.value)} style={compactInputStyle} />
              </label>
            ))}
            <button
              type="button"
              onClick={() => setComparisonOpen(true)}
              style={{ ...toolbarBtn(t), boxSizing: "border-box", height: FILTER_CONTROL_HEIGHT, color: t.accentText, border: `1px solid ${t.accent}`, justifyContent: "center" }}
            >
              {selectedCompareIds.length
                ? (lang === "zh" ? `对比 · ${selectedCompareIds.length}` : `Compare · ${selectedCompareIds.length}`)
                : (lang === "zh" ? "候选对比" : "Compare")}
            </button>
            <button type="button" onClick={exportCsv} style={{ ...toolbarBtn(t), boxSizing: "border-box", height: FILTER_CONTROL_HEIGHT, justifyContent: "center" }}>↓ CSV</button>
          </div>
        )}
      </section>

      <DataModeBar
        dataMode={dataMode}
        onChange={mode => { setDataMode(mode); setExpandedId(null) }}
        recordCount={modeRecordCount}
        infoOpen={dataModeInfoOpen}
        setInfoOpen={setDataModeInfoOpen}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <div style={{
        color: t.subtle,
        fontSize: 11.5,
        lineHeight: 1.45,
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: 7,
        padding: "7px 10px",
      }}>
        {lang === "zh"
          ? "提示：点击字段旁的 ⓘ 查看来源、实验条件与整理状态；部分字段仍待复核。"
          : "Tip: click the ⓘ icon next to a field to inspect source, experimental condition, and curation status; some fields remain under review."}
      </div>

      {status === "loading" && (
        <Callout tone="info">{lang === "zh" ? "正在加载 MOF 候选库数据…" : "Loading MOF Library data..."}</Callout>
      )}
      {status === "fallback" && (
        <Callout tone="warn">
          {lang === "zh"
            ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。当前页面会使用本地种子上下文继续展示。"
            : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages. This view continues with local seed context."}
        </Callout>
      )}
      {status === "empty" && (
        <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
      )}

      <ResultLayer
        number="01"
        title={lang === "zh" ? "候选材料列表" : "Candidate Material List"}
        subtitle={lang === "zh"
          ? "查看描述符完整度、来源字段和证据状态，再进入记录详情。"
          : "Review descriptor completeness, source fields, and evidence status before opening record details."}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: selectedInspectorRecord && !isNarrow ? "minmax(0, 1fr) minmax(330px, 380px)" : "1fr",
          gap: 12,
          alignItems: "start",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10, minWidth: 0 }}>
          {overviewRows.map(({ item, summary }) => (
            (() => {
              const scoring = getCriticSummary(item)
              return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => openRecordFromOverview(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  openRecordFromOverview(item.id)
                }
              }}
              style={{
                background: t.panel,
                border: `1px solid ${selectedInspectorId === item.id || expandedId === item.id ? t.accent : t.border}`,
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 10,
                boxShadow: selectedInspectorId === item.id || expandedId === item.id ? t.shadowSm : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880, overflowWrap: "anywhere" }}>{item.name}</div>
                  <div style={{ color: t.faint, fontSize: 10, marginTop: 3 }}>{item.metal}</div>
                </div>
                <BasisBadge tone={summary.statusId === "ready" ? "calc" : summary.statusId === "partial" ? "info" : summary.statusId === "limited" ? "warn" : "proxy"}>
                  {summary.label}
                </BasisBadge>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  [lang === "zh" ? "已整理描述符" : "Curated descriptors", `${summary.curatedCount}/8`, summary.curatedCount / 8],
                  [lang === "zh" ? "带条件字段" : "Condition fields", summary.fieldsWithCondition, Math.min(1, summary.fieldsWithCondition / 4)],
                  [lang === "zh" ? "有来源字段" : "Source fields", summary.fieldsWithSource, Math.min(1, summary.fieldsWithSource / 8)],
                ].map(([label, value, pct]) => (
                  <div key={label} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.faint, fontSize: 10 }}>
                      <span>{label}</span>
                      <strong style={{ color: t.textStrong, fontWeight: 850 }}>{value}</strong>
                    </div>
                    <div style={{ height: 5, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: t.accent }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: 7,
                borderTop: `1px solid ${t.divider}`,
                paddingTop: 9,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>D_expected</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 850 }}>
                    {scoring ? Number(scoring.D_expected).toFixed(3) : (lang === "zh" ? "未映射" : "not mapped")}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>{lang === "zh" ? "证据等级" : "Evidence level"}</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>
                    {scoring ? scoring.evidenceLevel : zhValue(item.evidenceLevel, lang)}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>Q / confidence_Q</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 850 }}>
                    {scoring ? Number(scoring.confidence_Q_clipped).toFixed(2) : (lang === "zh" ? "未映射" : "not mapped")}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1", color: scoring?.status?.tone === "warn" ? t.warn : t.accentText, fontSize: 10.5, fontWeight: 850, lineHeight: 1.3 }}>
                  {scoring ? (lang === "zh" ? scoring.status.zh : scoring.status.label) : (lang === "zh" ? "此记录暂无 CRITIC-MCDA 演示摘要" : "No CRITIC-MCDA demo summary for this record")}
                </div>
                <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
                  {scoring
                    ? (lang === "zh" ? "该分数为演示占位，不代表该 MOF 的真实性能判断。" : "This score is an illustrative placeholder, not a validated statement about this MOF.")
                    : (lang === "zh" ? "CRITIC 演示：未映射" : "CRITIC demo: not mapped")}
                </div>
                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openRecordFromOverview(item.id)
                    }}
                    style={{ ...toolbarBtn(t), justifyContent: "center", fontSize: 10.5, padding: "7px 9px" }}
                  >
                    {lang === "zh" ? "查看 Inspector" : "Open inspector"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openScoringDetails()
                    }}
                    style={{ ...toolbarBtn(t), justifyContent: "center", color: t.accentText, border: `1px solid ${t.accent}`, fontSize: 10.5, padding: "7px 9px" }}
                  >
                    {lang === "zh" ? "查看评分详情" : "View scoring details"}
                  </button>
                </div>
              </div>
            </article>
              )
            })()
          ))}
          </div>
          {selectedInspectorRecord && (
            <MofInspector
              record={selectedInspectorRecord}
              isSelected={selectedCompareIds.includes(selectedInspectorRecord.id)}
              limitReached={selectedCompareIds.length >= 3 && !selectedCompareIds.includes(selectedInspectorRecord.id)}
              onToggleCompare={() => toggleCompare(selectedInspectorRecord)}
              onExport={() => exportMofReport(selectedInspectorRecord)}
              onClose={() => setSelectedInspectorId(null)}
              t={t}
              lang={lang}
              isMobile={isMobile}
            />
          )}
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "基础数据统计" : "Baseline Data Summary"} subtitle={lang === "zh" ? "仅统计当前筛选结果中的字段与来源覆盖。" : "Counts field and source coverage in the current filtered set."}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "当前显示" : "Showing", `${filtered.length} / ${records.length}`],
            [lang === "zh" ? "数据来源" : "Data sources", sources.length],
            [lang === "zh" ? "金属中心" : "Metal centers", metals.length],
            [lang === "zh" ? "证据等级" : "Evidence Level", evidenceLevels.length],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 850, marginTop: 6 }}>{value}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "MOF 记录详情" : "MOF Record Details"} subtitle={lang === "zh" ? "展开记录后继续通过字段旁 ⓘ 查看来源、条件和整理状态。" : "Expand records and use ⓘ to inspect source, condition, and curation status."}>
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.length === 0 && (
            <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
          )}
          {filtered.map(item => (
            <div id={`mof-record-${item.id}`} key={item.id} style={{ background: t.panel, border: `1px solid ${expandedId === item.id ? t.accent : t.border}`, borderRadius: 8, padding: 13 }}>
              {(() => {
                const isSelected = selectedCompareIds.includes(item.id)
                const limitReached = selectedCompareIds.length >= 3 && !isSelected
                const scoring = getCriticSummary(item)
                return (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{item.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>{item.formula}</div>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                  <BasisBadge tone="info">{zhValue(item.evidenceLevel, lang)}</BasisBadge>
                  <BasisBadge tone="proxy">{zhDataStatus(item.dataStatus, lang)}</BasisBadge>
                  <BasisBadge tone={scoring ? scoring.status.tone : "proxy"}>
                    {scoring ? `D_expected ${Number(scoring.D_expected).toFixed(3)}` : (lang === "zh" ? "CRITIC 演示：未映射" : "CRITIC demo: not mapped")}
                  </BasisBadge>
                  {scoring && (
                    <BasisBadge tone="proxy">
                      {`Q ${Number(scoring.confidence_Q_clipped).toFixed(2)}`}
                    </BasisBadge>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleCompare(item)}
                    disabled={limitReached}
                    title={limitReached
                      ? (lang === "zh" ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.")
                      : undefined}
                    aria-label={isSelected
                      ? (lang === "zh" ? `取消选择 ${item.name}` : `Remove ${item.name} from comparison`)
                      : (lang === "zh" ? `加入对比 ${item.name}` : `Add ${item.name} to compare`)}
                    style={{
                      ...toolbarBtn(t),
                      padding: "4px 9px",
                      fontSize: 10,
                      color: isSelected ? t.accentText : limitReached ? t.faint : t.subtle,
                      border: `1px solid ${isSelected ? t.accent : t.borderStrong}`,
                      opacity: limitReached ? 0.6 : 1,
                      cursor: limitReached ? "not-allowed" : "pointer",
                      width: isMobile ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected
                      ? (lang === "zh" ? "已加入" : "Added")
                      : limitReached
                        ? (lang === "zh" ? "已达到对比上限" : "Compare limit reached")
                        : (lang === "zh" ? "加入对比" : "Add to compare")}
                  </button>
                  <button
                    type="button"
                    onClick={openScoringDetails}
                    style={{
                      ...toolbarBtn(t),
                      padding: "4px 9px",
                      fontSize: 10,
                      color: t.accentText,
                      border: `1px solid ${t.accent}`,
                      width: isMobile ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {lang === "zh" ? "查看评分详情" : "View scoring details"}
                  </button>
                </div>
              </div>
                )
              })()}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(9, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
                {field(lang === "zh" ? "金属节点" : "metal nodes", item.metal)}
                {field(lang === "zh" ? "连接体" : "linker", item.linker)}
                {field(lang === "zh" ? "孔径" : "pore size",      item.poreSizeA  === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`,      "poreSizeA",  item.fieldSources)}
                {field(lang === "zh" ? "比表面积" : "surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                {field(lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake",  item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`,     "co2Uptake",  item.fieldSources)}
                {field(lang === "zh" ? "带隙" : "band gap",    item.bandGap   === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap   === "—" ? "—" : `${item.bandGap} eV`,            "bandGap",    item.fieldSources)}
                {field(lang === "zh" ? "稳定性" : "stability", `${zhValue(item.waterStability, lang)} / ${zhValue(item.thermalStability, lang)}`)}
                {field(lang === "zh" ? "来源" : "source", zhLibraryText(item.source, lang))}
                {field(lang === "zh" ? "证据等级" : "Evidence Level", zhValue(item.evidenceLevel, lang))}
              </div>
              <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ ...toolbarBtn(t), marginTop: 12 }}>
                {expandedId === item.id ? (lang === "zh" ? "收起详情" : "Hide details") : (lang === "zh" ? "查看详情" : "View details")}
              </button>
              {expandedId === item.id && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
                  <div style={detailBlock}>{field(lang === "zh" ? "基础结构" : "Basic structure", `${item.topology}; ${item.formula}`)}</div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "孔径" : "Pore size (Å)", item.poreSizeA === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`, "poreSizeA", item.fieldSources)}
                      {field(lang === "zh" ? "比表面积" : "Surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                      {field(lang === "zh" ? "孔体积" : "Pore volume", item.poreVolume === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreVolume || "—"} cm³/g`, "poreVolume", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`, "co2Uptake", item.fieldSources)}
                      {field(lang === "zh" ? "带隙" : "Band gap", item.bandGap === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap === "—" ? "—" : `${item.bandGap} eV`, "bandGap", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "水稳定性" : "Water stability", zhValue(item.waterStability, lang), "waterStability", item.fieldSources)}
                      {field(lang === "zh" ? "热稳定性" : "Thermal stability", zhValue(item.thermalStability, lang), "thermalStability", item.fieldSources)}
                      {field(lang === "zh" ? "毒性关注" : "Toxicity concern", zhValue(item.toxicityConcern, lang), "toxicityConcern", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>{field(lang === "zh" ? "催化潜力线索" : "Catalysis potential", `${item.reactionClasses.join(", ") || "—"}; ${zhLibraryText(item.activeSiteHypothesis, lang)}`)}</div>
                  <div style={detailBlock}>{field(lang === "zh" ? "数据来源 / 限制" : "Data source / Limitations", `${zhLibraryText(item.source, lang)}; ${zhLibraryText(item.limitations, lang)}`)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <CompareTray
          count={selectedCompareIds.length}
          names={selectedCompareCandidates.map(item => item.name)}
          notice={compareNotice}
          onCompare={() => setComparisonOpen(true)}
          onClear={() => { setSelectedCompareIds([]); setCompareNotice(""); setComparisonOpen(false) }}
          t={t}
          lang={lang}
          isMobile={isMobile}
        />
      </ResultLayer>

      <ResultLayer
        number="04"
        title={lang === "zh" ? "数据质量与溯源" : "Data Quality & Provenance"}
        subtitle={lang === "zh"
          ? "从真实种子数据集实时计算的字段覆盖率、证据等级分布和整理进度。"
          : "Field coverage, evidence distribution, and curation progress computed live from Real Seed Dataset."}
      >
        <div id="data-quality-provenance">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <CopyLinkButton hash="data-quality-provenance" ariaLabel={lang === "zh" ? "复制数据质量与溯源链接" : "Copy Data Quality & Provenance link"} />
          </div>
          <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
            {/* Curation criteria checklist */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 8 }}>
                {lang === "zh" ? "描述符整理标准" : "Descriptor curation criteria"}
              </div>
              <div style={{ color: t.faint, fontSize: 11, marginBottom: 8 }}>
                {lang === "zh"
                  ? "一个描述符只有同时包含以下信息时，才应被视为已整理："
                  : "A descriptor is treated as curated only when it includes:"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 5 }}>
                {(lang === "zh"
                  ? ["数值", "必要单位或条件", "证据等级", "字段级来源记录"]
                  : ["value", "unit or condition when applicable", "evidence level", "field-level source record"]
                ).map(item => (
                  <div key={item} style={{ display: "flex", gap: 7, alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 9px" }}>
                    <span style={{ color: t.accentText, fontSize: 11, lineHeight: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ color: t.muted, fontSize: 11 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Evidence Level Legend */}
            <EvidenceLevelLegend lang={lang} />
          </div>
          {qualityChartsReady ? (
            <DataQualitySection
              realSeedRows={realSeedRows}
              lang={lang}
              t={t}
              isMobile={isMobile}
            />
          ) : (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, color: t.faint, fontSize: 12 }}>
              {lang === "zh" ? "数据质量图表将在基础记录就绪后加载。" : "Data-quality charts load after baseline records are ready."}
            </div>
          )}
        </div>
      </ResultLayer>

      {results && !results.unavailable && (
        <ResultLayer number="05" title={lang === "zh" ? "当前输入记录提示" : "Current Input Note"}>
          <Callout tone="success">
            {lang === "zh"
              ? `当前输入 ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} 可在生态筛选、性能优先级或催化实验室中作为候选解释对象；MOF 候选库提供来源字段供复核。`
              : `Current input ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} can be interpreted as a candidate in EcoScreen, Performance, or CatalysisLab; Library presents source fields for review.`}
          </Callout>
        </ResultLayer>
      )}
      <CandidateComparisonModal
        open={comparisonOpen}
        candidates={selectedCompareCandidates}
        allCandidates={records}
        onSelectionChange={setSelectedCompareIds}
        onClose={() => setComparisonOpen(false)}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
    </div>
  )
}
