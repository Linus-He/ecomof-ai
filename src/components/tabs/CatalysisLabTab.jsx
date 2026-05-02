import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  fetchDataJson, BasisBadge, BrandMark, PageHeader, ResultLayer, Callout, MethodDrawer, UnifiedCandidateCard,
  calculateCatalysisScore, getScoreBreakdown, getWeightContribution, DEFAULT_SCORING_WEIGHTS, evidenceDistribution, scoreDistribution, sensitivityRows,
  RankingBarChart, ScoreBreakdownRadar, WeightContributionChart, EvidenceDistributionChart, ScoreDistributionChart, SensitivityAnalysisChart,
  DataModeToggle, RealSeedCallout, safeVal, toolbarBtn, SectionTitle, FieldProvenanceButton,
} from "../../shared"

// ── Catalysis Data Template helpers ──────────────────────────────────────────

const CATALYSIS_TEMPLATE_FIELDS = [
  // MOF information
  { key: "mof_name",               label: "MOF name",                       category: "MOF information",        required: true,  example: "UiO-66-NH2",          note: "Standard or IUPAC name" },
  { key: "formula",                label: "Formula",                        category: "MOF information",        required: false, example: "Zr6O4(OH)4(BDC)6",   note: "Hill notation preferred" },
  { key: "metal_nodes",            label: "Metal nodes",                    category: "MOF information",        required: true,  example: "Zr",                  note: "Comma-separated if multiple" },
  { key: "bimetallic_system",      label: "Bimetallic system",              category: "MOF information",        required: false, example: "No / Yes / Possible",  note: "" },
  { key: "linker",                 label: "Linker",                         category: "MOF information",        required: true,  example: "BDC",                 note: "Abbreviation + full name recommended" },
  { key: "topology",               label: "Topology",                       category: "MOF information",        required: false, example: "fcu",                 note: "RCSR code preferred" },
  // Structural properties
  { key: "pore_size_a",            label: "Pore size (Å)",                  category: "Structural properties", required: false, example: "8.5",                 note: "PLD or LCD; specify which" },
  { key: "surface_area_m2g",       label: "BET surface area (m²/g)",        category: "Structural properties", required: false, example: "1050",                note: "Measured by N2 adsorption" },
  { key: "pore_volume_cm3g",       label: "Pore volume (cm³/g)",            category: "Structural properties", required: false, example: "0.46",                note: "" },
  // Catalysis task
  { key: "reaction_type",          label: "Reaction type",                  category: "Catalysis task",        required: true,  example: "CO2 photoreduction",  note: "Match to a known reaction class" },
  { key: "substrate",              label: "Substrate",                      category: "Catalysis task",        required: true,  example: "CO2",                 note: "Include concentration if relevant" },
  { key: "product",                label: "Product",                        category: "Catalysis task",        required: true,  example: "CO, CH4",             note: "List all detected products" },
  // Reaction conditions
  { key: "temperature_c",          label: "Temperature (°C)",               category: "Reaction conditions",   required: true,  example: "25",                  note: "" },
  { key: "pressure_bar",           label: "Pressure (bar)",                 category: "Reaction conditions",   required: true,  example: "1",                   note: "CO2 partial pressure if mixture" },
  { key: "solvent",                label: "Solvent",                        category: "Reaction conditions",   required: false, example: "MeCN / H2O / neat",   note: "" },
  { key: "reaction_time_h",        label: "Reaction time (h)",              category: "Reaction conditions",   required: true,  example: "4",                   note: "" },
  { key: "catalyst_loading_mg",    label: "Catalyst loading (mg)",          category: "Reaction conditions",   required: true,  example: "5",                   note: "Per mL or per reaction volume" },
  { key: "light_or_electrochemical_condition", label: "Light / electrochemical condition", category: "Reaction conditions", required: false, example: "300 W Xe lamp, AM1.5 / −1.0 V vs RHE", note: "Include filter if relevant" },
  // Performance metrics
  { key: "conversion_percent",     label: "Conversion (%)",                 category: "Performance metrics",   required: false, example: "42",                  note: "Substrate conversion" },
  { key: "selectivity_percent",    label: "Selectivity (%)",                category: "Performance metrics",   required: false, example: "85",                  note: "Product selectivity" },
  { key: "yield_percent",          label: "Yield (%)",                      category: "Performance metrics",   required: false, example: "36",                  note: "" },
  { key: "tof",                    label: "TOF (h⁻¹)",                      category: "Performance metrics",   required: false, example: "12.4",                note: "Turnover frequency" },
  { key: "ton",                    label: "TON",                            category: "Performance metrics",   required: false, example: "48",                  note: "Turnover number" },
  { key: "cycle_stability",        label: "Cycle stability",                category: "Performance metrics",   required: false, example: "5 cycles, <5% loss",  note: "Include regeneration conditions" },
  // Evidence and metadata
  { key: "evidence_level",         label: "Evidence level",                 category: "Evidence & metadata",   required: true,  example: "experimental / literature-supported", note: "" },
  { key: "data_source",            label: "Data source",                    category: "Evidence & metadata",   required: true,  example: "own experiment / CoRE MOF / MOFX-DB", note: "" },
  { key: "doi_or_reference",       label: "DOI or reference",               category: "Evidence & metadata",   required: true,  example: "10.1021/xxx",         note: "" },
  { key: "limitations",            label: "Limitations",                    category: "Evidence & metadata",   required: true,  example: "single-run, no blank control", note: "Known issues with this record" },
  { key: "uncertainty_notes",      label: "Uncertainty notes",              category: "Evidence & metadata",   required: false, example: "yield not corrected for blank", note: "" },
  { key: "recommended_next_validation", label: "Recommended next validation", category: "Evidence & metadata", required: false, example: "repeat under inert atmosphere", note: "" },
]

const TEMPLATE_CATEGORIES = [...new Set(CATALYSIS_TEMPLATE_FIELDS.map(f => f.category))]

const CSV_HEADER = CATALYSIS_TEMPLATE_FIELDS.map(f => f.key).join(",")

function downloadCatalysisTemplate() {
  const blob = new Blob([CSV_HEADER + "\n"], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "catalysis_data_template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function CatalysisDataTemplate({ lang, t, isNarrow, isMobile }) {
  const [open, setOpen] = useState(false)
  const categories = TEMPLATE_CATEGORIES

  return (
    <details open={open} onToggle={e => setOpen(e.currentTarget.open)}
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <summary style={{ cursor: "pointer", userSelect: "none" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, verticalAlign: "middle" }}>
          <BrandMark size={isMobile ? 28 : 32} radius={8} style={{ boxShadow: t.shadowSm }} />
          <span style={{ color: t.accentText, fontSize: 14, fontWeight: 800 }}>
            {lang === "zh" ? "催化数据模板" : "Catalysis Data Template"}
          </span>
        </span>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
          {lang === "zh"
            ? "该模板定义了后续接入真实催化数据所需的最小字段。当前 CatalysisLab 结果为基于规则的候选材料优先级排序，仍需实验验证。"
            : "This template defines the minimum fields needed for future catalysis data ingestion. Current CatalysisLab results are rule-based candidate prioritization and require experimental validation."}
        </div>

        <button type="button" onClick={downloadCatalysisTemplate}
          style={{ ...toolbarBtn(t), alignSelf: "flex-start", fontWeight: 700 }}>
          ↓ {lang === "zh" ? "下载 CSV 模板" : "Download CSV template"}
        </button>

        {categories.map(cat => {
          const fields = CATALYSIS_TEMPLATE_FIELDS.filter(f => f.category === cat)
          return (
            <div key={cat}>
              <SectionTitle>{cat}</SectionTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: t.surface }}>
                      {[lang === "zh" ? "字段" : "Field", lang === "zh" ? "标签" : "Label", lang === "zh" ? "必填" : "Required", lang === "zh" ? "示例" : "Example", lang === "zh" ? "说明" : "Note"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: t.subtle, fontWeight: 700, borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f, i) => (
                      <tr key={f.key} style={{ background: i % 2 === 0 ? t.surface : "transparent" }}>
                        <td style={{ padding: "5px 10px", color: t.accentSoft, fontFamily: "monospace", whiteSpace: "nowrap" }}>{f.key}</td>
                        <td style={{ padding: "5px 10px", color: t.textStrong, whiteSpace: "nowrap" }}>{f.label}</td>
                        <td style={{ padding: "5px 10px", color: f.required ? t.accentText : t.faint, whiteSpace: "nowrap" }}>
                          {f.required ? (lang === "zh" ? "必填" : "required") : (lang === "zh" ? "可选" : "optional")}
                        </td>
                        <td style={{ padding: "5px 10px", color: t.subtle }}>{f.example}</td>
                        <td style={{ padding: "5px 10px", color: t.faint }}>{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
          {lang === "zh"
            ? "提供这些字段并不意味着一定可以训练机器学习模型。是否适合建模取决于数据量、标签质量、描述符一致性和实验条件可比性。"
            : "Providing these fields does not guarantee that a machine learning model can be trained. Model selection depends on data volume, label quality, descriptor consistency, and experimental comparability."}
        </div>
      </div>
    </details>
  )
}

const TASKS = [
  { id: "co2_conversion", en: "CO₂ conversion", zh: "CO₂ 转化", emphasis: ["co2Affinity", "activeSite", "stability"] },
  { id: "biomass_conversion", en: "Biomass conversion", zh: "生物质转化", emphasis: ["activeSite", "poreAccessibility", "waterStability"] },
  { id: "photocatalysis", en: "Photocatalysis", zh: "光催化", emphasis: ["electronicProperty", "stability", "evidenceConfidence"] },
  { id: "electrocatalysis", en: "Electrocatalysis", zh: "电催化", emphasis: ["electronicProperty", "activeSite", "stability"] },
  { id: "custom_task", en: "Custom task", zh: "自定义任务", emphasis: ["activeSite", "poreAccessibility", "sustainability"] },
]

const CANDIDATES = [
  {
    id: "uio66nh2",
    name: "UiO-66-NH2",
    metalCenter: "Zr4+",
    bimetallic: "No",
    linker: "NH2-BDC",
    poreSizeA: 5.8,
    surfaceArea: 1050,
    co2Uptake: 3.4,
    bandGap: 3.2,
    waterStability: "High",
    thermalStability: "High",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "Zr cluster + amine functionality",
    reactionClasses: ["co2_conversion", "photocatalysis"],
  },
  {
    id: "pcn222",
    name: "PCN-222",
    metalCenter: "Zr4+",
    bimetallic: "Possible",
    linker: "TCPP",
    poreSizeA: 14.0,
    surfaceArea: 2200,
    co2Uptake: 4.1,
    bandGap: 2.1,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "porphyrinic linker, metalation handle",
    reactionClasses: ["photocatalysis", "electrocatalysis", "co2_conversion"],
  },
  {
    id: "hkust1",
    name: "HKUST-1",
    metalCenter: "Cu2+",
    bimetallic: "No",
    linker: "BTC",
    poreSizeA: 9.0,
    surfaceArea: 1850,
    co2Uptake: 4.82,
    bandGap: 2.8,
    waterStability: "Low",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "open Cu site",
    reactionClasses: ["biomass_conversion", "co2_conversion"],
  },
  {
    id: "fe_mil100",
    name: "Fe-MIL-100",
    metalCenter: "Fe3+",
    bimetallic: "No",
    linker: "BTC",
    poreSizeA: 25.0,
    surfaceArea: 2800,
    co2Uptake: 3.6,
    bandGap: 2.4,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "Fe oxo cluster",
    reactionClasses: ["biomass_conversion", "electrocatalysis"],
  },
  {
    id: "nu1000",
    name: "NU-1000",
    metalCenter: "Zr4+",
    bimetallic: "Possible",
    linker: "TBAPy",
    poreSizeA: 30.0,
    surfaceArea: 2320,
    co2Uptake: 2.7,
    bandGap: 2.6,
    waterStability: "High",
    thermalStability: "High",
    evidenceLevel: "Low-medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "Zr node + pyrene linker, post-synthetic handle",
    reactionClasses: ["photocatalysis", "custom_task"],
  },
  {
    id: "mof74mg",
    name: "MOF-74-Mg",
    metalCenter: "Mg2+",
    bimetallic: "No",
    linker: "DOBDC",
    poreSizeA: 11.0,
    surfaceArea: 1495,
    co2Uptake: 8.61,
    bandGap: 4.0,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Low-medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "open Mg site, strong CO₂ adsorption cue",
    reactionClasses: ["co2_conversion", "custom_task"],
  },
]

const WEIGHTS = DEFAULT_SCORING_WEIGHTS.catalysis

const LEGACY_WEIGHTS = {
  co2Affinity: 0.16,
  activeSite: 0.18,
  poreAccessibility: 0.14,
  stability: 0.16,
  electronicProperty: 0.13,
  sustainability: 0.11,
  evidenceConfidence: 0.12,
}

const zhTask = (task, lang) => lang === "zh" ? (task.nameZh || task.zh || task.labelZh || task.en || task.label || task.name) : (task.name || task.en || task.label || task.zh || task.labelZh)
const scoreMap = { High: 9, Medium: 6.4, Low: 3.8, "Low-medium": 5.2, Possible: 7.2, No: 5.6 }
const riskMap = { Low: 8.7, Medium: 6.2, High: 3.4 }
const evidenceMap = { High: 9, Medium: 7, "Low-medium": 5.3, Low: 3.8 }

function normalizeCandidate(item) {
  const metals = Array.isArray(item.metalNodes) ? item.metalNodes : item.metalCenter ? [item.metalCenter] : []
  return {
    ...item,
    metalCenter: item.metalCenter || metals.join(", ") || "unmarked",
    bimetallic: item.bimetallic === true ? "Yes" : item.bimetallic === false ? "No" : item.bimetallic || "No",
    activeSiteHypothesis: Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis,
    sustainabilityRisk: item.sustainabilityRisk || (item.costLevel === "High" || item.toxicityConcern === "High" ? "High" : item.costLevel === "Medium" || item.toxicityConcern === "Medium" ? "Medium" : "Low"),
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    fieldSources: item.fieldSources || undefined,
  }
}

function computeCatalysisScore(candidate, taskId, weights = WEIGHTS) {
  const taskMatch = candidate.reactionClasses.includes(taskId) ? 1 : taskId === "custom_task" ? 0.78 : 0.62
  const co2Affinity = Math.min(10, Number(candidate.co2Uptake || 0) / 0.9)
  const activeSite = Math.min(10, (candidate.activeSiteHypothesis.includes("open") ? 8.4 : 6.7) + (candidate.bimetallic === "Possible" ? 0.8 : 0))
  const poreAccessibility = Math.max(0, Math.min(10, 10 - Math.abs(Number(candidate.poreSizeA || 0) - 12) / 2.8 + Number(candidate.surfaceArea || 0) / 1800))
  const stability = ((scoreMap[candidate.waterStability] || 5) + (scoreMap[candidate.thermalStability] || 5)) / 2
  const electronicProperty = Math.max(0, Math.min(10, 10 - Math.abs(Number(candidate.bandGap || 0) - 2.4) * 2.1))
  const sustainability = riskMap[candidate.sustainabilityRisk] || 5
  const evidenceConfidence = evidenceMap[candidate.evidenceLevel] || 4
  const parts = { co2Affinity, activeSite, poreAccessibility, stability, electronicProperty, sustainability, evidenceConfidence }
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + parts[key] * weight, 0)
  const score = Math.max(0, Math.min(10, weighted * taskMatch))
  return { score: Number(score.toFixed(1)), parts }
}

function zhValue(value, lang) {
  if (lang !== "zh") return value
  return {
    High: "高",
    Medium: "中",
    Low: "低",
    "Low-medium": "低-中",
    Possible: "可能",
    No: "否",
  }[value] || value
}

// ── Case Study: CO₂ Conversion Candidate Prioritization ──────────────────────

const CASE_DIMS = [
  { key: "co2Affinity",       labelEn: "CO₂ affinity",       labelZh: "CO₂ 亲和力" },
  { key: "activeSite",        labelEn: "Active site",         labelZh: "活性位点" },
  { key: "poreAccessibility", labelEn: "Pore accessibility",  labelZh: "孔道可及性" },
  { key: "stability",         labelEn: "Stability",           labelZh: "稳定性" },
  { key: "electronicProperty",labelEn: "Electronic property", labelZh: "电子性质" },
  { key: "evidenceConfidence",labelEn: "Evidence confidence", labelZh: "证据置信度" },
]

const WORKFLOW_STEPS = [
  { enLabel: "Task",        zhLabel: "任务",    enVal: "CO₂ conversion",           zhVal: "CO₂ 转化" },
  { enLabel: "Dataset",     zhLabel: "数据集",  enVal: "Real Seed / Demo fallback", zhVal: "真实种子 / 演示回退" },
  { enLabel: "Descriptors", zhLabel: "描述符",  enVal: "CO₂ uptake · metal nodes · pore size · surface area · stability · evidence level", zhVal: "CO₂ 吸附量 · 金属节点 · 孔径 · 比表面积 · 稳定性 · 证据等级" },
  { enLabel: "Scoring",     zhLabel: "评分",    enVal: "Rule-based Catalysis Potential Score", zhVal: "规则驱动催化潜力分" },
  { enLabel: "Output",      zhLabel: "输出",    enVal: "Candidate priority ranking", zhVal: "候选材料优先级排序" },
]

function pendingLabel(val, lang) {
  if (val == null || val === "" || val === "unknown" || val === "pending") {
    return lang === "zh" ? "待整理" : "Pending curation"
  }
  return val
}

function ScoreBar({ value, max = 10, color, t }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100))
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || t.accent, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ color: t.subtle, fontSize: 10, minWidth: 24, textAlign: "right" }}>{Number(value).toFixed(1)}</span>
    </div>
  )
}

function CaseStudyCO2({ lang, t, isNarrow, isMobile, realSeedCandidates, demoCandidates, weights }) {
  const [open, setOpen] = useState(true)

  // Prefer real seed; fall back to demo
  const sourceData = realSeedCandidates.length > 0 ? realSeedCandidates : demoCandidates
  const usingRealSeed = realSeedCandidates.length > 0
  const dataLabel = usingRealSeed
    ? (lang === "zh" ? "真实种子数据集" : "Real Seed Dataset")
    : (lang === "zh" ? "演示数据集（回退）" : "Demo Dataset (fallback)")

  // Score all candidates for CO₂ conversion task
  const TASK_ID = "co2_conversion"
  const scored = sourceData
    .map(c => {
      const norm = normalizeCandidate(c)
      const result = computeCatalysisScore(norm, TASK_ID, weights)
      return { ...norm, score: result.score, parts: result.parts }
    })
    .sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, 3)
  const RANK_COLORS = [t.accent, t.accentSoft || t.accent, t.subtle]
  const RANK_LABELS = ["#1", "#2", "#3"]

  const dimColor = (idx) => [t.accent, t.success || t.accent, t.warn || t.accent, t.validationAccent || t.accent, t.sensitivityAccent || t.accent, t.accentSoft || t.accent][idx % 6]

  return (
    <details open={open} onToggle={e => setOpen(e.currentTarget.open)}
      style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 10, padding: 16 }}>
      <summary style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: t.accentText, fontSize: 14, fontWeight: 800 }}>
          {lang === "zh" ? "案例研究：CO₂ 转化候选材料优先级排序" : "Case Study: CO₂ Conversion Candidate Prioritization"}
        </span>
        <span style={{ background: t.badgeInfoBg, color: t.accentText, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 7px", border: `1px solid ${t.border}` }}>
          {dataLabel}
        </span>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Disclaimer */}
        <div style={{ background: t.badgeWarnBg || "#fffbeb", border: `1px solid ${t.warn || "#f59e0b"}`, borderRadius: 8, padding: "9px 13px", fontSize: 12, color: t.warn || "#92400e", lineHeight: 1.65 }}>
          {lang === "zh"
            ? "该案例展示的是早期候选材料优先级排序，不是最终催化性能预测。"
            : "This case study demonstrates early-stage prioritization, not final catalytic performance prediction."}
        </div>

        {/* Workflow steps */}
        <div>
          <div style={{ color: t.subtle, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {lang === "zh" ? "工作流" : "Workflow"}
          </div>
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.enLabel} style={{ display: "flex", alignItems: "stretch", minWidth: 0 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 11px", minWidth: isMobile ? 120 : 0 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                    {lang === "zh" ? step.zhLabel : step.enLabel}
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 700, lineHeight: 1.45 }}>
                    {lang === "zh" ? step.zhVal : step.enVal}
                  </div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: t.faint, fontSize: 12 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top candidates */}
        <div>
          <div style={{ color: t.subtle, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {lang === "zh" ? `Top ${top3.length} 候选材料` : `Top ${top3.length} Candidates`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {top3.map((c, idx) => (
              <div key={c.id || c.name} style={{ background: t.surface, border: `1px solid ${idx === 0 ? (t.borderStrong || t.accent) : t.border}`, borderRadius: 9, padding: 13, display: "flex", flexDirection: "column", gap: 9 }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ background: RANK_COLORS[idx], color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 4, padding: "1px 6px" }}>{RANK_LABELS[idx]}</span>
                      <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{c.name}</span>
                    </div>
                    <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4 }}>
                      {pendingLabel(c.metalCenter, lang)} · {pendingLabel(c.linker, lang)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: t.accentText, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{c.score}</div>
                    <div style={{ color: t.faint, fontSize: 9 }}>{lang === "zh" ? "催化潜力分" : "Catalysis score"}</div>
                  </div>
                </div>

                {/* Key descriptors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {[
                    [lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", c.co2Uptake != null ? `${c.co2Uptake} mmol/g` : null],
                    [lang === "zh" ? "孔径" : "Pore size", c.poreSizeA != null ? `${c.poreSizeA} Å` : null],
                    [lang === "zh" ? "比表面积" : "Surface area", c.surfaceArea != null ? `${Number(c.surfaceArea).toLocaleString()} m²/g` : null],
                    [lang === "zh" ? "水稳定性" : "Water stability", zhValue(c.waterStability, lang)],
                    [lang === "zh" ? "证据等级" : "Evidence level", c.evidenceLevel],
                    [lang === "zh" ? "任务匹配" : "Task match", c.reactionClasses?.includes(TASK_ID) ? (lang === "zh" ? "✓ 匹配" : "✓ matched") : (lang === "zh" ? "○ 推断" : "○ inferred")],
                  ].map(([label, val]) => (
                    <div key={label} style={{ minWidth: 0 }}>
                      <div style={{ color: t.faint, fontSize: 9, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ color: val ? t.textStrong : t.faint, fontSize: 11, fontWeight: 600, fontStyle: val ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pendingLabel(val, lang)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score breakdown bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>
                    {lang === "zh" ? "评分维度" : "Score breakdown"}
                  </div>
                  {CASE_DIMS.map((dim, di) => (
                    <div key={dim.key} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 5, alignItems: "center" }}>
                      <div style={{ color: t.subtle, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lang === "zh" ? dim.labelZh : dim.labelEn}
                      </div>
                      <ScoreBar value={c.parts?.[dim.key] ?? 0} color={dimColor(di)} t={t} />
                    </div>
                  ))}
                </div>

                {/* Real-seed curation note */}
                {usingRealSeed && c.curationNote && (
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, fontStyle: "italic", borderTop: `1px solid ${t.border}`, paddingTop: 7 }}>
                    {c.curationNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shared limitations + recommended validation */}
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 10 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.warn || "#b45309", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              {lang === "zh" ? "当前局限" : "Current limitations"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {(lang === "zh" ? [
                "CO₂ 吸附量字段在 Real Seed Dataset 中暂为空值，评分基于活性位点和孔道假设。",
                "规则权重未经反应条件校准，不可等同于 GCMC 或 IAST 结果。",
                "pore accessibility 对 null 孔径输入默认评分，不反映实际孔道结构。",
              ] : [
                "CO₂ uptake is null in Real Seed records; scoring relies on active site and pore hypotheses.",
                "Rule weights are not calibrated to reaction conditions and cannot substitute GCMC or IAST results.",
                "Pore accessibility defaults to a mid-range score when poreSizeA is null.",
              ]).map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.accentSoft, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              {lang === "zh" ? "推荐验证步骤" : "Recommended validation"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {(lang === "zh" ? [
                "补充 CO₂ 吸附等温线（BET + 低压 CO₂ 测量）。",
                "文献或 GCMC 验证 CO₂/N₂ 混合气选择性。",
                "在定义反应条件下测试催化活性（温度、溶剂、光/电化学）。",
                "将规则分排序结果与后续实验 TON/TOF 进行比较。",
              ] : [
                "Measure CO₂ adsorption isotherm (BET + low-pressure CO₂).",
                "Validate CO₂/N₂ mixture selectivity via literature or GCMC.",
                "Test catalytic activity under defined conditions (temperature, solvent, light/electrochemical).",
                "Compare rule-score ranking against future experimental TON/TOF.",
              ]).map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

      </div>
    </details>
  )
}

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("real-seed")
  const [taskId, setTaskId] = useState("co2_conversion")
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState(TASKS)
  const [demoCandidates, setDemoCandidates] = useState(CANDIDATES)
  const [realSeedCandidates, setRealSeedCandidates] = useState([])
  const [candidates, setCandidates] = useState(CANDIDATES)
  const [weights, setWeights] = useState(WEIGHTS)
  const [filters, setFilters] = useState({
    metalCenter: "all",
    bimetallic: "all",
    poreMin: 3,
    poreMax: 35,
    areaMin: 0,
    areaMax: 5000,
    co2Min: 0,
    bandGapMin: 0,
    bandGapMax: 6,
    waterStability: "all",
    thermalStability: "all",
    evidenceLevel: "all",
    sustainabilityRisk: "all",
  })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_candidates_demo.json"),
      fetchDataJson("mof_candidates_real_seed.json"),
      fetchDataJson("catalysis_tasks.json"),
      fetchDataJson("scoring_weights.json"),
    ]).then(([candidateRows, realSeedRows, taskRows, weightRows]) => {
      if (!active) return
      const demo = Array.isArray(candidateRows) && candidateRows.length ? candidateRows.map(normalizeCandidate) : CANDIDATES
      setDemoCandidates(demo)
      setCandidates(demo)
      if (Array.isArray(realSeedRows) && realSeedRows.length) setRealSeedCandidates(realSeedRows.map(normalizeCandidate))
      if (Array.isArray(taskRows) && taskRows.length) setTasks(taskRows)
      if (weightRows?.CatalysisLab) setWeights(weightRows.CatalysisLab)
      else if (weightRows?.catalysisPotentialScore) setWeights(weightRows.catalysisPotentialScore)
    }).catch(() => {
      if (!active) return
      setDemoCandidates(CANDIDATES)
      setCandidates(CANDIDATES)
      setTasks(TASKS)
      setWeights(LEGACY_WEIGHTS)
    })
    return () => { active = false }
  }, [])

  // Sync active candidates when dataMode changes
  useEffect(() => {
    setCandidates(dataMode === "real-seed" ? realSeedCandidates : demoCandidates)
    setSelected(null)
  }, [dataMode, demoCandidates, realSeedCandidates])

  const task = tasks.find(item => item.id === taskId) || tasks[0]
  const metals = Array.from(new Set(candidates.map(item => item.metalCenter))).sort()

  const ranked = useMemo(() => {
    return candidates
      .map(candidate => {
        const catalysis = calculateCatalysisScore(candidate, task, weights)
        return {
          ...candidate,
          catalysis,
          score: catalysis.score,
          scoreBreakdown: getScoreBreakdown(candidate, "catalysis", task),
          weightContribution: getWeightContribution(candidate, weights, "catalysis", task),
        }
      })
      .filter(item => filters.metalCenter === "all" || item.metalCenter === filters.metalCenter)
      .filter(item => filters.bimetallic === "all" || item.bimetallic === filters.bimetallic)
      // null-safe: real-seed records with null numeric fields pass through filters
      .filter(item => item.poreSizeA == null || (Number(item.poreSizeA) >= Number(filters.poreMin) && Number(item.poreSizeA) <= Number(filters.poreMax)))
      .filter(item => item.surfaceArea == null || (Number(item.surfaceArea) >= Number(filters.areaMin) && Number(item.surfaceArea) <= Number(filters.areaMax)))
      .filter(item => item.co2Uptake == null || Number(item.co2Uptake) >= Number(filters.co2Min))
      .filter(item => item.bandGap == null || (Number(item.bandGap) >= Number(filters.bandGapMin) && Number(item.bandGap) <= Number(filters.bandGapMax)))
      .filter(item => filters.waterStability === "all" || item.waterStability === filters.waterStability)
      .filter(item => filters.thermalStability === "all" || item.thermalStability === filters.thermalStability)
      .filter(item => filters.evidenceLevel === "all" || item.evidenceLevel === filters.evidenceLevel)
      .filter(item => filters.sustainabilityRisk === "all" || item.sustainabilityRisk === filters.sustainabilityRisk)
      .sort((a, b) => b.catalysis.score - a.catalysis.score)
  }, [candidates, taskId, filters, weights, task])

  const activeCandidate = selected || ranked[0]
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%" }
  const filterFields = (
    <>
      <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
        {lang === "zh" ? "金属中心" : "metal center"}
        <select value={filters.metalCenter} onChange={e => updateFilter("metalCenter", e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {metals.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
        {lang === "zh" ? "双金属体系" : "bimetallic system"}
        <select value={filters.bimetallic} onChange={e => updateFilter("bimetallic", e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          <option value="No">{zhValue("No", lang)}</option>
          <option value="Yes">{lang === "zh" ? "是" : "Yes"}</option>
          <option value="Possible">{zhValue("Possible", lang)}</option>
        </select>
      </label>
      {[
        ["poreMin", lang === "zh" ? "最小孔径 Å" : "pore min Å"],
        ["poreMax", lang === "zh" ? "最大孔径 Å" : "pore max Å"],
        ["areaMin", lang === "zh" ? "最小比表面积" : "surface area min"],
        ["areaMax", lang === "zh" ? "最大比表面积" : "surface area max"],
        ["co2Min", "CO₂ uptake min"],
        ["bandGapMin", lang === "zh" ? "最小 band gap" : "band gap min"],
        ["bandGapMax", lang === "zh" ? "最大 band gap" : "band gap max"],
      ].map(([key, label]) => (
        <label key={key} style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
          {label}
          <input type="number" value={filters[key]} onChange={e => updateFilter(key, e.target.value)} style={controlStyle} />
        </label>
      ))}
      {[
        ["waterStability", lang === "zh" ? "水稳定性" : "water stability", ["High", "Medium", "Low"]],
        ["thermalStability", lang === "zh" ? "热稳定性" : "thermal stability", ["High", "Medium", "Low"]],
        ["evidenceLevel", lang === "zh" ? "证据等级" : "evidence level", ["experimental", "literature-supported", "simulation-supported", "ML-predicted", "rule-based", "needs-validation", "Medium", "Low-medium", "Low"]],
        ["sustainabilityRisk", lang === "zh" ? "可持续性风险" : "sustainability risk", ["low", "medium", "high", "Low", "Medium", "High"]],
      ].map(([key, label, options]) => (
        <label key={key} style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
          {label}
          <select value={filters[key]} onChange={e => updateFilter(key, e.target.value)} style={controlStyle}>
            <option value="all">{lang === "zh" ? "全部" : "all"}</option>
            {options.map(option => <option key={option} value={option}>{zhValue(option, lang)}</option>)}
          </select>
        </label>
      ))}
    </>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh"
          ? "CatalysisLab — 面向任务的 MOF 催化候选材料优先级筛选"
          : "CatalysisLab — Task-oriented MOF catalysis candidate prioritization"}
        subtitle={lang === "zh"
          ? "通用 MOF 催化候选筛选模块。当前使用 demo / placeholder / rule-based 数据，只表达 candidate priority、potential 和 needs validation。"
          : "A general MOF catalysis candidate-screening module. Current data are demo / placeholder / rule-based and only express candidate priority, potential, and needs validation."}
        meta={lang === "zh" ? "任务选择 · 筛选器 · Rule-based Catalysis Potential Score · 候选解释" : "Task selector · filters · Rule-based Catalysis Potential Score · candidate explanation"}
        action={<BasisBadge tone="warn">{lang === "zh" ? "Demo only / 需要验证" : "Demo only / needs validation"}</BasisBadge>}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <DataModeToggle value={dataMode} onChange={setDataMode} lang={lang} />
        <span style={{ color: t.faint, fontSize: 11 }}>
          {dataMode === "real-seed"
            ? (lang === "zh" ? `${realSeedCandidates.length} 条真实种子记录 — 缺失字段评分为 0` : `${realSeedCandidates.length} real seed records — null fields score as 0`)
            : (lang === "zh" ? `${demoCandidates.length} 条演示记录` : `${demoCandidates.length} demo records`)}
        </span>
      </div>

      {dataMode === "real-seed" && <RealSeedCallout lang={lang} />}

      <ResultLayer number="01" title={lang === "zh" ? "催化任务选择器" : "Catalysis task selector"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          {tasks.map(item => (
            <button key={item.id} type="button" onClick={() => { setTaskId(item.id); setSelected(null) }} style={{
              textAlign: "left",
              background: taskId === item.id ? t.badgeInfoBg : t.panel,
              border: `1px solid ${taskId === item.id ? t.borderStrong : t.border}`,
              borderRadius: 8,
              padding: 12,
              color: t.text,
              cursor: "pointer",
            }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{zhTask(item, lang)}</div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{lang === "zh" ? "规则驱动模型" : "Rule-based Model"}</div>
            </button>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "催化筛选器" : "Catalysis filters"}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <button type="button" onClick={() => setExpanded(prev => !prev)} style={{ ...controlStyle, display: isMobile ? "block" : "none", marginBottom: expanded ? 10 : 0 }}>
            {expanded ? (lang === "zh" ? "收起筛选器" : "Collapse filters") : (lang === "zh" ? "展开筛选器" : "Expand filters")}
          </button>
          <div style={{ display: isMobile && !expanded ? "none" : "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
            {filterFields}
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "Rule-based Catalysis Potential Score 排名" : "Rule-based Catalysis Potential Score ranking"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {ranked.map(candidate => (
            <UnifiedCandidateCard
              key={candidate.id}
              name={candidate.name}
              score={candidate.catalysis.score}
              scoreLabel={lang === "zh" ? "催化潜力" : "Catalysis potential"}
              suitableTask={zhTask(task, lang)}
              scoreBreakdown={candidate.scoreBreakdown}
              keyReasons={[
                lang === "zh" ? "较高 CO₂ 亲和能力可能有利于反应物富集。" : "High CO₂ affinity may benefit reactant enrichment.",
                lang === "zh" ? "合适孔径可能有利于分子扩散。" : "Suitable pore size may support molecular diffusion.",
                lang === "zh" ? "金属节点可能提供 Lewis 酸位点或氧化还原活性位点。" : "Metal nodes may provide Lewis acidic or redox-active sites.",
                lang === "zh" ? "当前证据为规则推断，仍需实验验证。" : "Current evidence is rule-based and requires experimental validation.",
              ]}
              evidenceLevel={`${lang === "zh" ? "证据等级" : "Evidence Level"}: ${candidate.evidenceLevel || "rule-based"}`}
              limitations={lang === "zh" ? "Demo / placeholder / rule-based 数据；不代表真实催化活性或选择性。" : "Demo / placeholder / rule-based data; not real catalytic activity or selectivity."}
              recommendedNextStep={lang === "zh"
                ? ["定义反应条件与对照实验", "验证转化率、选择性和循环稳定性", "补充机理表征"]
                : ["Define reaction conditions and controls", "Validate conversion, selectivity, and cycling stability", "Add mechanistic characterization"]}
              fieldSources={candidate.fieldSources}
              dataStatus={candidate.dataMode || dataMode}
              onDetails={() => setSelected(candidate)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "结果解释" : "Results Interpretation"}>
        <Callout tone="info">
          {lang === "zh"
            ? "Catalysis Potential Score 表示候选材料在特定催化任务下的潜力优先级，不等同于真实催化活性或产率。"
            : "Catalysis Potential Score indicates candidate priority for a selected catalysis task. It does not represent final catalytic activity or yield."}
        </Callout>
        {activeCandidate && (
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[
              [lang === "zh" ? "分数含义" : "What the score means", lang === "zh" ? "Catalysis Potential Score 表示候选优先级，不是最终催化性能预测。" : "Catalysis Potential Score indicates candidate priority, not final catalytic performance prediction."],
              [lang === "zh" ? "排序原因" : "Why this candidate is ranked high", `${activeCandidate.activeSiteHypothesis}; ${activeCandidate.poreSizeA} Å; ${activeCandidate.surfaceArea} m²/g.`],
              [lang === "zh" ? "支持数据" : "What data supports this result", lang === "zh" ? "当前支持来自 demo 描述符、任务规则、证据等级和占位字段。" : "Support comes from demo descriptors, task rules, evidence level, and placeholder fields."],
              [lang === "zh" ? "下一步验证" : "What should be validated next", lang === "zh" ? "验证反应条件、转化率、选择性、TOF、循环稳定性和机理表征。" : "Validate reaction conditions, conversion, selectivity, TOF, cycling stability, and mechanism characterization."],
            ].map(([title, body]) => (
              <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
                <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 7 }}>{body}</div>
              </div>
            ))}
          </div>
        )}
      </ResultLayer>

      <ResultLayer number="05" title={lang === "zh" ? "评分公式" : "Scoring formula"}>
        <MethodDrawer title="Catalysis Potential Score">
          Catalysis Potential Score = w1 × CO₂ Affinity + w2 × Active Site Potential + w3 × Pore Accessibility + w4 × Stability + w5 × Electronic Property + w6 × Sustainability + w7 × Evidence Confidence
        </MethodDrawer>
      </ResultLayer>

      <ResultLayer number="06" title={lang === "zh" ? "Model Results / 结果解释图表" : "Model Results / Results Interpretation"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
          <RankingBarChart data={ranked} scoreLabel={lang === "zh" ? "催化潜力评分" : "Catalysis Potential Score"} />
          <ScoreBreakdownRadar data={activeCandidate?.scoreBreakdown || []} title={activeCandidate ? `${activeCandidate.name} · ${lang === "zh" ? "评分拆解" : "Score Breakdown"}` : (lang === "zh" ? "评分拆解" : "Score Breakdown")} />
          <WeightContributionChart data={activeCandidate?.weightContribution || []} />
          <EvidenceDistributionChart data={evidenceDistribution(ranked)} />
          <ScoreDistributionChart data={scoreDistribution(ranked)} />
          <SensitivityAnalysisChart data={sensitivityRows(ranked, "catalysis", weights, task, "co2Affinity")} dimension="CO₂ Affinity" />
        </div>
      </ResultLayer>

      <ResultLayer number="07" title={lang === "zh" ? "Machine Learning Evaluation 占位" : "Machine Learning Evaluation Placeholder"}>
        <Callout tone="warn">
          {lang === "zh"
            ? "当前机器学习评估为占位展示。只有在积累足够带标签的实验或文献数据后，才会启用真实模型评估。"
            : "Machine learning evaluation is currently a placeholder. It will be activated when enough labeled experimental or literature data are available."}
        </Callout>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            ["Predicted vs Actual", lang === "zh" ? "需要带标签的实验或文献数据。" : "Requires labeled experimental or literature data."],
            ["Residual Plot", lang === "zh" ? "残差分析将在真实模型训练后启用。" : "Residual analysis will be available after model training."],
            ["Rule Contribution", lang === "zh" ? "当前展示规则贡献，不是 Feature Importance。" : "Current view shows rule contribution, not Feature Importance."],
            ["R²: pending · MAE: pending · RMSE: pending · Cross-validation: pending", lang === "zh" ? "不显示伪造模型指标。" : "No fabricated model metrics are shown."],
          ].map(([title, body]) => (
            <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone="proxy">Demo only / Placeholder</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 9 }}>{title}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <CaseStudyCO2
        lang={lang} t={t} isNarrow={isNarrow} isMobile={isMobile}
        realSeedCandidates={realSeedCandidates}
        demoCandidates={demoCandidates}
        weights={weights}
      />

      <Callout tone="warn">
        {lang === "zh"
          ? "催化性能高度依赖温度、溶剂、压力、底物、光/电化学环境和催化剂制备方式。当前评分用于候选材料优先级排序，不等同于最终催化性能预测。"
          : "Catalytic performance strongly depends on reaction conditions, including temperature, solvent, pressure, substrate, light/electrochemical environment, and catalyst preparation. The current score is intended for candidate prioritization, not final performance prediction."}
      </Callout>

      <CatalysisDataTemplate lang={lang} t={t} isNarrow={isNarrow} isMobile={isMobile} />
    </div>
  )
}
