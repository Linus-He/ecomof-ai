// @ts-nocheck
import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_SANS,
  METAL_CENTERS, ORGANIC_LINKERS, FUNCTIONAL_GROUPS, GAS_SYSTEMS, AROMATIC_SUBSTITUTION_POSITIONS,
  MODEL_PROFILES, DEFAULT_INPUTS,
  normalizeFunctionalGroupDetails, getFunctionalGroupEntries, defaultGroupPositions, formatFunctionalGroupSummary,
  getGasSystem, getPerformanceLabel, validateScreeningInputs,
  parseCifText, zhText, gasLabel, toolbarBtn,
  CustomTooltip, MetricCard, BasisBadge, SectionTitle,
  ResultLayer, HowToRead, InfoTip, NextStepCTA,
  ProvenanceGrid, ResultProvenanceDrawer, Callout, LinkerSubstitutionPreview, InlineFormula,
} from "../../shared"

function ColumnHeader({ title }) {
  const t = useT()
  return (
    <div style={{
      color: t.subtle,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      paddingBottom: 8,
      marginBottom: 10,
      borderBottom: `1px solid ${t.border}`,
    }}>
      {title}
    </div>
  )
}

function SectionCard({ title, meta, children, style }) {
  const t = useT()
  return (
    <section className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 8,
      ...style,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        paddingBottom: 8,
        marginBottom: 10,
        borderBottom: `1px solid ${t.border}`,
        color: t.subtle,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}>
        <span>{title}</span>
        {meta && (
          <span style={{
            color: t.accentText,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0,
            textTransform: "none",
            whiteSpace: "nowrap",
          }}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function FieldRow({ label, modified, children, note }) {
  const t = useT()
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="range-thumb" style={{
          color: t.faint,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          width: 58,
          flexShrink: 0,
        }}>
          {label}
        </div>
        <div style={{
          flex: 1,
          minWidth: 0,
          borderLeft: modified ? `2px solid ${t.accent}` : "2px solid transparent",
          paddingLeft: 6,
        }}>
          {children}
        </div>
      </div>
      {note && (
        <div style={{ marginLeft: 72, marginTop: 3, color: t.faint, fontSize: 10, lineHeight: 1.4 }}>
          {note}
        </div>
      )}
    </div>
  )
}

function InlineNumberField({ value, onChange, min, max, step, unit, modified }) {
  const t = useT()
  const safeValue = Number(value)
  const clamped = Number.isFinite(safeValue) ? Math.max(min, Math.min(max, safeValue)) : min
  const pct = ((clamped - min) / (max - min)) * 100
  const tooltipValue = `${Number(clamped).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} ${unit}`
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 66px", alignItems: "center", gap: 8 }}>
      <div className="range-control" style={{ position: "relative", height: 4, background: t.border, borderRadius: 999 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: t.accent, borderRadius: 999 }} />
        <div
          className="range-value-tooltip"
          style={{
            left: `${pct}%`,
            background: t.textStrong,
            color: t.bg,
          }}
        >
          {tooltipValue}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
        />
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: t.accent,
          border: `2px solid ${t.panel}`,
          boxShadow: "0 1px 4px rgba(15,23,42,0.18)",
          pointerEvents: "none",
        }} />
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || min)}
        aria-label={unit}
        style={{
          width: "100%",
          background: t.surface,
          border: `1px solid ${modified ? t.accent : t.border}`,
          borderRadius: 6,
          padding: "6px 8px",
          color: modified ? t.accentText : t.textStrong,
          fontSize: 12,
          fontFamily: FONT_SANS,
          outline: "none",
          textAlign: "right",
        }}
      />
    </div>
  )
}

export function ScreeningTab({ inputs, setInputs, results, loading, onPredict, onSaveRun, apiUrl, setApiUrl, apiStatus, onCheckApi, setActiveTab, onLoadBenchmark, onAddComparison }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [cifInfo, setCifInfo] = useState(null)
  const metal  = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const gas    = getGasSystem(inputs.gasSystem)
  const perf   = results && !results.unavailable ? getPerformanceLabel(results.primaryUptake, results.selectivity) : null
  const inputValidation = validateScreeningInputs(inputs)
  const benchmarkPresets = ["UiO-66", "HKUST-1", "ZIF-8", "MOF-5"]
  const fieldLabelMap = {
    poreDiameter: lang === "zh" ? "孔径" : "Pore diameter",
    betSurfaceArea: lang === "zh" ? "BET 比表面积" : "BET surface area",
    poreVolume: lang === "zh" ? "孔体积" : "Pore volume",
    temperature: lang === "zh" ? "温度" : "Temperature",
    pressure: lang === "zh" ? "压力" : "Pressure",
    structureConsistency: lang === "zh" ? "结构一致性" : "Structure consistency",
    surfaceVolumeMismatch: lang === "zh" ? "表面积 / 孔体积匹配" : "Surface area / pore volume match",
    catalog: lang === "zh" ? "材料定义" : "Material definition",
    gasSystem: lang === "zh" ? "气体体系" : "Gas system",
  }
  const describeIssue = (issue) => {
    if (lang !== "zh") return { title: issue.field, message: issue.message, suggestion: issue.suggestion }
    const label = fieldLabelMap[issue.field] || issue.field
    switch (issue.field) {
      case "poreDiameter":
        return {
          title: label,
          message: "孔径超出当前界面支持范围或不是有效数字。",
          suggestion: "请输入 2.5-35 Å 之间的数值，并尽量使用数据库、文献或结构计算得到的描述符。",
        }
      case "betSurfaceArea":
        return {
          title: label,
          message: "BET 比表面积超出当前界面支持范围或不是有效数字。",
          suggestion: "请输入 50-8000 m²/g 之间的数值；如果来自手工估计，建议先改用基准材料或 CIF 描述符流程。",
        }
      case "poreVolume":
        return {
          title: label,
          message: "孔体积超出当前界面支持范围或不是有效数字。",
          suggestion: "请输入 0.05-5.5 cm³/g 之间的数值，并确认与孔径、BET 来自同一结构来源。",
        }
      case "temperature":
        return {
          title: label,
          message: "温度超出当前筛选窗口或不是有效数字。",
          suggestion: "请输入 150-500 K 之间的数值；若用于当前多温解释，建议优先使用 273 / 298 / 323 K 附近条件。",
        }
      case "pressure":
        return {
          title: label,
          message: "压力超出当前界面支持范围或不是有效数字。",
          suggestion: "请输入 0.001-60 bar 之间的数值，并确保与所选气体体系的筛选窗口一致。",
        }
      case "structureConsistency":
        return {
          title: label,
          message: "很小的孔径与很大的孔体积组合在一起，物理上一致性可疑。",
          suggestion: "请复核孔径和孔体积是否来自同一结构数据源。",
        }
      case "surfaceVolumeMismatch":
        return {
          title: label,
          message: "较低 BET 与很大的孔体积组合不常见。",
          suggestion: "建议重新核对描述符来源，或先上传 CIF / 使用基准材料自动填充。",
        }
      case "catalog":
        return {
          title: label,
          message: "金属节点和有机连接体必须同时定义。",
          suggestion: "请选择基准材料，或手动同时选择金属节点和连接体。",
        }
      case "gasSystem":
        return {
          title: label,
          message: issue.severity === "error"
            ? "该气体体系在当前版本中不可用。"
            : "该气体体系目前仍是 beta，物理机制或标签覆盖还不完整。",
          suggestion: issue.severity === "error"
            ? "请切换到当前已支持的气体体系。"
            : "结果只能作为方向性筛选证据使用，不能当作严格热力学结论。",
        }
      default:
        return {
          title: label,
          message: issue.message,
          suggestion: issue.suggestion,
        }
    }
  }
  const describeApplicabilityWarning = (warning) => {
    if (lang !== "zh") return warning.message
    switch (warning.code) {
      case "pore_diameter":
        return `孔径 ${inputs.poreDiameter} Å 接近或超出当前原型描述符包络（3.5-28 Å）。`
      case "bet_surface_area":
        return `BET 比表面积 ${inputs.betSurfaceArea} m²/g 接近或超出当前原型描述符包络（150-6000 m²/g）。`
      case "pore_volume":
        return `孔体积 ${inputs.poreVolume} cm³/g 接近或超出当前原型描述符包络（0.12-3.5 cm³/g）。`
      case "temperature":
        return `温度 ${inputs.temperature} K 超出当前多温解释窗口（273-323 K）。`
      case "pressure": {
        const pressureMax = gas.id === "H2/N2" ? 50 : gas.id === "CH4/N2" ? 10 : 1.05
        return `压力 ${inputs.pressure} bar 超出当前 ${gas.id} 等温线绘图窗口（<= ${pressureMax} bar）。`
      }
      case "gas_beta":
        return `${gas.id} 目前标记为 beta，因为关键物理机制或标签覆盖还不完整。`
      case "qst_range":
        return `Qst0 = ${results?.thermo?.qst0 ?? "—"} kJ/mol 超出保守筛选参考范围（4-80 kJ/mol）。`
      default:
        return warning.message
    }
  }

  const radarData = results && !results.unavailable ? [
    { subject: c.tabs.lca,          A: results.lca.metalImpact,         fullMark: 10 },
    { subject: c.structure.organicLinker, A: results.lca.linkerSustainability, fullMark: 10 },
    { subject: "Energy",           A: results.lca.energyConsumption,    fullMark: 10 },
    { subject: "Waste",            A: results.lca.wasteGeneration,      fullMark: 10 },
    { subject: "Water",            A: results.lca.waterUsage,           fullMark: 10 },
    { subject: "Air",              A: results.lca.airQuality,           fullMark: 10 },
  ] : []

  const toggleFG = (fg) => {
    setInputs(prev => ({
      ...prev,
      functionalGroups: prev.functionalGroups.includes(fg)
        ? prev.functionalGroups.filter(f => f !== fg)
        : [...prev.functionalGroups, fg],
      functionalGroupDetails: prev.functionalGroups.includes(fg)
        ? Object.fromEntries(Object.entries(prev.functionalGroupDetails || {}).filter(([key]) => key !== fg))
        : {
            ...(prev.functionalGroupDetails || {}),
            [fg]: (prev.functionalGroupDetails || {})[fg] || { count: 1, positions: ["2"] },
          }
    }))
  }

  const updateFGDetail = (fg, detailPatch) => {
    setInputs(prev => {
      const current = normalizeFunctionalGroupDetails(prev)[fg] || { count: 1, positions: ["2"] }
      const merged = { ...current, ...detailPatch }
      const count = Math.max(0, Math.min(4, merged.count === 0 ? 0 : Number(merged.count) || 1))
      let positions = count > 0 && Array.isArray(merged.positions)
        ? merged.positions.filter(pos => AROMATIC_SUBSTITUTION_POSITIONS.includes(String(pos))).slice(0, count)
        : []
      if (positions.length > count) positions = positions.slice(0, count)
      if (count > 0 && !positions.length) positions = defaultGroupPositions(count)
      return {
        ...prev,
        functionalGroupDetails: {
          ...(prev.functionalGroupDetails || {}),
          [fg]: { count, positions },
        },
      }
    })
  }

  const toggleFGPosition = (fg, pos) => {
    const current = normalizeFunctionalGroupDetails(inputs)[fg] || { count: 1, positions: ["2"] }
    if (current.count === 0) {
      updateFGDetail(fg, { count: 1, positions: [pos] })
      return
    }
    const exists = current.positions.includes(pos)
    let positions = exists
      ? current.positions.filter(item => item !== pos)
      : [...current.positions, pos]
    if (positions.length > current.count) positions = positions.slice(positions.length - current.count)
    if (!positions.length) positions = [pos]
    updateFGDetail(fg, { positions })
  }

  const handleCifUpload = async (file) => {
    if (!file) return
    const text = await file.text()
    const parsed = parseCifText(text, file.name)
    const next = { mofName: parsed.name || file.name.replace(/\.cif$/i, "") }
    for (const [key, value] of Object.entries(parsed.descriptors)) {
      if (Number.isFinite(value)) next[key] = value
    }
    setInputs(prev => ({ ...prev, ...next }))
    setCifInfo({ fileName: file.name, ...parsed })
  }

  const exportCSV = () => {
    if (!results || results.unavailable) return
    const rows = [
      ["Parameter","Value"],
      ["Gas System", results.gasSystem],
      ["Metal Center", inputs.metalCenter],
      ["Organic Linker", inputs.organicLinker],
      ["Functional Groups", formatFunctionalGroupSummary(inputs, lang)],
      ["Pore Diameter (Å)", inputs.poreDiameter],
      ["BET Surface Area (m²/g)", inputs.betSurfaceArea],
      ["Pore Volume (cm³/g)", inputs.poreVolume],
      ["Temperature (K)", inputs.temperature],
      ["Pressure (bar)", inputs.pressure],
      ["",""],
      [`${results.primaryName} Uptake (mmol/g)`, results.primaryUptake],
      [`${results.secondaryName} Uptake (mmol/g)`, results.secondaryUptake],
      [`Selectivity ${results.primaryName}/${results.secondaryName}`, results.selectivity],
      ["Qst at zero-coverage (kJ/mol)", results.thermo?.qst0 ?? "—"],
      ["Confidence Score", results.confidenceScore],
      ["Eco Score", results.lca.compositeGreenScore],
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_${inputs.metalCenter}_${inputs.organicLinker}_${results.gasSystem.replace("/","-")}.csv`
    a.click()
  }

  const hasUsableResults = results && !results.unavailable
  const functionalGroupDetails = normalizeFunctionalGroupDetails(inputs)
  const decisionTips = hasUsableResults
    ? (lang === "zh" ? [
        ["结果驱动因素", `${results.primaryName} uptake 主要由 BET、孔体积、孔径匹配、${inputs.organicLinker} 连接体和官能团数量/位置共同影响。选择性仍是 screening proxy，不是严格混合气 IAST。`],
        ["可信度判断", `当前置信度 ${(results.confidenceScore * 100).toFixed(0)}%。${results.applicability?.warnings?.length ? "输入已有适用域警告，建议补真实等温线或 GCMC 标签。" : "输入位于基准范围附近，可用于早期候选比较。"}`],
        ["后续建议", "先看解释/Qst 判断吸附原因，再进入可行性页检查粗略成本、可得性和供应边界。LCA/LCC 只用于入围候选之后的比较。"],
      ] : [
        ["Key Drivers", `${results.primaryName} uptake is driven by BET, pore volume, pore matching, the ${inputs.organicLinker} linker, and functional-group count/position. Selectivity remains a screening proxy, not rigorous mixture IAST.`],
        ["Confidence Assessment", `Current confidence is ${(results.confidenceScore * 100).toFixed(0)}%. ${results.applicability?.warnings?.length ? "Applicability warnings are present; add real isotherm or GCMC labels before strong claims." : "The input is close to benchmark ranges and is usable for early comparison."}`],
        ["Recommended Next Step", "Use Interpretation/Qst to inspect the mechanism, then Feasibility for coarse cost, availability, and supply boundaries. LCA/LCC comes after shortlist formation."],
      ])
    : (lang === "zh" ? [
        ["工作流", "左侧输入材料与条件，结果显示在中间。"],
        ["推荐起点", "从顶部搜索 UiO-66、HKUST-1 或 ZIF-8 自动填充。"],
        ["结果说明", "输出是筛选级证据，不是论文级数据。"],
      ] : [
        ["Workflow", "Enter material and conditions on the left."],
        ["Recommended start", "Search UiO-66, HKUST-1, or ZIF-8 to auto-fill."],
        ["Result status", "Outputs are screening-level evidence, not publication-grade data."],
      ])
  const isRunDisabled = loading || gas.priority === "unavailable" || inputValidation.blocked
  const runLabel = inputValidation.blocked ? (lang === "zh" ? "⚠ 先修正输入" : "⚠ Fix inputs first") :
    loading ? `⏳ ${c.structure.computing}` :
    gas.priority === "unavailable" ? c.structure.unsupported : `▶ ${c.structure.run}`
  const runDisabledTitle = inputValidation.blocked
    ? (lang === "zh" ? "请先修正高亮输入字段。" : "Fix the highlighted input fields first.")
    : loading
      ? (lang === "zh" ? "筛选正在运行。" : "Screening is running.")
      : gas.priority === "unavailable"
        ? (lang === "zh" ? "当前气体任务暂未开放。" : "The current gas task is not available in this prototype.")
        : undefined
  const runButtonStyle = {
    width: "100%", padding: "14px 0", borderRadius: 8, border: "none",
    cursor: isRunDisabled ? "not-allowed" : "pointer",
    background: isRunDisabled ? t.border : t.accent,
    color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: "0.04em",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.2s",
    boxShadow: isRunDisabled ? "none" : "0 8px 18px rgba(26,109,181,0.16)",
  }
  const isDirty = (key) => JSON.stringify(inputs[key] ?? null) !== JSON.stringify(DEFAULT_INPUTS[key] ?? null)
  const inputSelectStyle = {
    width: "100%",
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: "7px 9px",
    color: t.text,
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  }
  const compactInputStyle = {
    width: "100%",
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: "7px 9px",
    color: t.textStrong,
    fontSize: 12,
    fontFamily: FONT_SANS,
    outline: "none",
  }
  const structureModifiedCount = ["gasSystem", "metalCenter", "organicLinker", "poreDiameter", "betSurfaceArea", "poreVolume"]
    .filter(isDirty).length
  const conditionModifiedCount = ["temperature", "pressure", "mlAlgorithm"].filter(isDirty).length
  const selectedGroupCount = inputs.functionalGroups.length
  const stageSteps = [
    ["1", lang === "zh" ? "科学筛选" : "Screening", t.performance],
    ["2", lang === "zh" ? "可行性" : "Feasibility", t.lccAccent],
    ["3", lang === "zh" ? "比较" : "Comparison", t.sensitivityAccent],
    ["4", lang === "zh" ? "工程" : "Engineering", t.validationAccent],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", gap: 12, alignItems: "center", minHeight: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {stageSteps.map(([num, label, color], index) => (
            <button
              key={num}
              type="button"
              className="stage-breadcrumb-link"
              onClick={() => index === 0 ? setActiveTab?.("screening") : index === 1 ? setActiveTab?.("feasibility") : index === 2 ? setActiveTab?.("lca") : setActiveTab?.("about")}
              style={{
                border: "none",
                background: "transparent",
                color: index === 0 ? color : t.subtle,
                fontSize: 12,
                fontWeight: index === 0 ? 800 : 600,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ color: index === 0 ? t.accentText : t.subtle, fontWeight: index === 0 ? 800 : 600 }}>
                {lang === "zh" ? `阶段 ${num}` : `Stage ${num}`}
              </span>
              {index < stageSteps.length - 1 && <span style={{ color: t.faint, marginLeft: 2 }}>/</span>}
            </button>
          ))}
        </div>
        <div style={{ color: t.muted, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
          {inputs.metalCenter} / {inputs.organicLinker} · {inputs.gasSystem} · {inputs.temperature} K · {inputs.pressure} bar
        </div>
      </div>
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "300px minmax(0, 1fr) 200px", gap: 10, minHeight: isNarrow ? 0 : "calc(100vh - 142px)", alignItems: "start" }}>
      {/* ── Left: Input Panel ── */}
      <div className="content-card" style={{ width: "100%", flexShrink: 0, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: isNarrow ? "none" : "calc(100vh - 142px)" }}>
        <ColumnHeader title={lang === "zh" ? "输入" : "Input"} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2 }}>
          <SectionCard title={lang === "zh" ? "预设" : "Presets"} meta={lang === "zh" ? "快速填充" : "quick fill"} style={{ background: t.surface }}>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginBottom: 8 }}>
              {lang === "zh"
                ? "先用基准材料填充，再替换真实结构描述符。"
                : "Start from a benchmark, then replace with real structural descriptors."}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {benchmarkPresets.map(name => (
                <button key={name} type="button" onClick={() => onLoadBenchmark?.(name)} style={{ ...toolbarBtn(t), padding: "5px 8px", fontSize: 11 }}>
                  {name}
                </button>
              ))}
            </div>
          </SectionCard>

          {inputValidation.issues.length > 0 && (
            <Callout tone={inputValidation.blocked ? "danger" : "warn"}>
              <strong>{lang === "zh" ? (inputValidation.blocked ? "运行前需要修正输入。" : "建议先复核输入。") : (inputValidation.blocked ? "Fix the input before running prediction." : "Review the input before trusting the result.")}</strong>
              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                {inputValidation.issues.slice(0, 3).map(issue => (
                  <div key={`${issue.field}-${issue.message}`}>
                    <span style={{ fontWeight: 700 }}>{describeIssue(issue).title}</span>: {describeIssue(issue).message}
                  </div>
                ))}
              </div>
            </Callout>
          )}

          <SectionCard
            title={lang === "zh" ? "结构" : "Structure"}
            meta={structureModifiedCount ? `${structureModifiedCount} ${lang === "zh" ? "项已改" : "modified"}` : null}
          >
            <FieldRow label={lang === "zh" ? "气体" : "Gas"} modified={isDirty("gasSystem")} note={gas.priority === "beta" ? zhText(lang, gas.dataNote) : null}>
              <select value={inputs.gasSystem}
                onChange={e => setInputs(p => ({ ...p, gasSystem: e.target.value }))}
                style={{ ...inputSelectStyle, color: isDirty("gasSystem") ? t.accentText : t.text }}>
                {GAS_SYSTEMS.map(g => (
                  <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>
                    {gasLabel(g.label, lang)}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label={lang === "zh" ? "金属" : "Metal"} modified={isDirty("metalCenter")} note={metal ? `${zhText(lang, metal.toxicity)} · LCA ${metal.lcaScore}/10${metal.oms ? ` · ${c.structure.oms}` : ""}` : null}>
              <select value={inputs.metalCenter}
                onChange={e => setInputs(p => ({ ...p, metalCenter: e.target.value }))}
                style={{ ...inputSelectStyle, color: isDirty("metalCenter") ? t.accentText : t.text }}>
                {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.label}{m.oms ? " · OMS" : ""}</option>)}
              </select>
            </FieldRow>
            <FieldRow label={lang === "zh" ? "连接体" : "Linker"} modified={isDirty("organicLinker")} note={linker ? `${zhText(lang, linker.category)} · ${linker.connectivity}-${c.structure.connected}` : null}>
              <select value={inputs.organicLinker}
                onChange={e => setInputs(p => ({ ...p, organicLinker: e.target.value }))}
                style={{ ...inputSelectStyle, color: isDirty("organicLinker") ? t.accentText : t.text }}>
                {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </FieldRow>
            <FieldRow label={lang === "zh" ? "孔径" : "Pore"} modified={isDirty("poreDiameter")}>
              <InlineNumberField value={inputs.poreDiameter} min={3} max={30} step={0.1} unit="Å" modified={isDirty("poreDiameter")}
                onChange={v => setInputs(p => ({ ...p, poreDiameter: v }))} />
            </FieldRow>
            <FieldRow label="BET" modified={isDirty("betSurfaceArea")}>
              <InlineNumberField value={inputs.betSurfaceArea} min={100} max={7000} step={10} unit="m²/g" modified={isDirty("betSurfaceArea")}
                onChange={v => setInputs(p => ({ ...p, betSurfaceArea: v }))} />
            </FieldRow>
            <FieldRow label={lang === "zh" ? "孔体积" : "PVol"} modified={isDirty("poreVolume")}>
              <InlineNumberField value={inputs.poreVolume} min={0.1} max={4.5} step={0.01} unit="cm³/g" modified={isDirty("poreVolume")}
                onChange={v => setInputs(p => ({ ...p, poreVolume: v }))} />
            </FieldRow>
          </SectionCard>

          <SectionCard
            title={lang === "zh" ? "化学" : "Chemistry"}
            meta={`${selectedGroupCount} ${lang === "zh" ? "项已选" : "selected"}`}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {FUNCTIONAL_GROUPS.map(fg => {
                const active = inputs.functionalGroups.includes(fg.value)
                return (
                  <button
                    key={fg.value}
                    type="button"
                    className="functional-tag"
                    data-active={active ? "true" : "false"}
                    title={zhText(lang, fg.category)}
                    onClick={() => toggleFG(fg.value)}
                    style={{
                      border: `1px solid ${active ? t.accent : t.border}`,
                      borderRadius: 6,
                      background: active ? t.accentSoft : t.surface,
                      color: active ? t.accentText : t.subtle,
                      padding: "5px 9px",
                      fontSize: 11,
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      lineHeight: 1.2,
                    }}
                  >
                    {fg.label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {getFunctionalGroupEntries(inputs).map(({ value, meta, detail }) => (
                <div key={value} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 7 }}>
                    <div>
                      <div style={{ color: t.accentText, fontSize: 12, fontWeight: 600 }}>{meta.label}</div>
                      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.35 }}>{zhText(lang, meta.category)}</div>
                    </div>
                    <BasisBadge tone="user">{lang === "zh" ? "用户定义" : "user"}</BasisBadge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "74px minmax(0, 1fr)", gap: 8, alignItems: "start" }}>
                    <select
                      value={detail.count}
                      onChange={e => {
                        const count = Math.max(0, Math.min(4, parseInt(e.target.value, 10) || 0))
                        updateFGDetail(value, {
                          count,
                          positions: count === 0 ? [] : detail.positions.length >= count ? detail.positions.slice(0, count) : defaultGroupPositions(count),
                        })
                      }}
                      style={{ ...inputSelectStyle, padding: "6px 7px", fontSize: 11 }}
                    >
                      {[
                        [0, "0"],
                        [1, "1"],
                        [2, "2"],
                        [3, "3"],
                        [4, "4"],
                      ].map(([count, label]) => <option key={count} value={count}>{label}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {AROMATIC_SUBSTITUTION_POSITIONS.map(pos => {
                        const active = (functionalGroupDetails[value]?.positions || []).includes(pos)
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => toggleFGPosition(value, pos)}
                            style={{
                              minWidth: 28,
                              height: 25,
                              borderRadius: 6,
                              border: `1px solid ${active ? t.accent : t.border}`,
                              background: active ? t.badgeInfoBg : t.panel,
                              color: active ? t.accentText : t.subtle,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              fontFamily: FONT_SANS,
                            }}
                          >
                            {pos}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {!getFunctionalGroupEntries(inputs).length && (
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 6, padding: 9 }}>
                  {lang === "zh"
                    ? "选择官能团后，可设置数量和取代位置。"
                    : "Select a functional group to set count and substitution positions."}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title={lang === "zh" ? "条件" : "Conditions"}
            meta={conditionModifiedCount ? `${conditionModifiedCount} ${lang === "zh" ? "项已改" : "modified"}` : null}
          >
            <FieldRow label={lang === "zh" ? "温度 K" : "Temp K"} modified={isDirty("temperature")}>
              <input type="number" value={inputs.temperature} min={200} max={400}
                onChange={e => setInputs(p => ({ ...p, temperature: parseInt(e.target.value, 10) || 298 }))}
                style={{ ...compactInputStyle, color: isDirty("temperature") ? t.accentText : t.textStrong }} />
            </FieldRow>
            <FieldRow label={lang === "zh" ? "压力 bar" : "Press bar"} modified={isDirty("pressure")}>
              <input type="number" value={inputs.pressure} min={0.01} max={50} step={0.01}
                onChange={e => setInputs(p => ({ ...p, pressure: parseFloat(e.target.value) || 0.15 }))}
                style={{ ...compactInputStyle, color: isDirty("pressure") ? t.accentText : t.textStrong }} />
            </FieldRow>
            <FieldRow label={lang === "zh" ? "模型" : "Model"} modified={isDirty("mlAlgorithm")}>
              <select value={inputs.mlAlgorithm}
                onChange={e => setInputs(p => ({ ...p, mlAlgorithm: e.target.value }))}
                style={inputSelectStyle}>
                <option value="ensemble">{lang === "zh" ? "集成基线" : "Ensemble baseline"}</option>
                <option value="rf">Random Forest</option>
                <option value="gbm">Gradient Boosting</option>
                <option value="gnn">Graph Neural Network</option>
              </select>
            </FieldRow>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45, marginLeft: 72 }}>
                {(MODEL_PROFILES[inputs.mlAlgorithm] || MODEL_PROFILES.ensemble).status}
            </div>
          </SectionCard>

          <SectionCard title={lang === "zh" ? "来源" : "Sources"} meta={lang === "zh" ? "可选" : "optional"}>
            <details>
              <summary style={{ cursor: "pointer", color: t.accentText, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                {lang === "zh" ? "API、CIF 与连接体预览" : "API, CIF, and linker preview"}
              </summary>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 700 }}>
                      {lang === "zh" ? "后端预测" : "Backend prediction"}
                    </span>
                    <BasisBadge tone={apiStatus?.ok ? "calc" : "proxy"}>
                      {apiStatus?.ok ? zhText(lang, "API connected") : zhText(lang, "static fallback")}
                    </BasisBadge>
                  </div>
                  <input
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value.trim())}
                    placeholder="http://127.0.0.1:8000"
                    style={{ ...compactInputStyle, fontSize: 11, marginBottom: 8 }}
                  />
                  <button type="button" onClick={onCheckApi} style={{ ...toolbarBtn(t), padding: "5px 8px", fontSize: 11 }}>
                    {lang === "zh" ? "检查 API" : "Check API"}
                  </button>
                  <div style={{ color: apiStatus?.ok ? t.success : apiStatus?.checked ? t.warn : t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 6 }}>
                    {apiStatus?.message
                      ? zhText(lang, apiStatus.message)
                      : lang === "zh" ? "未连接时使用浏览器端模型。" : "Browser model is used until a local API is connected."}
                  </div>
                </div>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "9px 10px", borderRadius: 6,
                  border: `1px dashed ${t.borderStrong}`, background: t.surface,
                  color: t.accentText, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {c.structure.cifButton}
                  <input type="file" accept=".cif,.txt" style={{ display: "none" }}
                    onChange={e => handleCifUpload(e.target.files?.[0])} />
                </label>
                {cifInfo && (
                  <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 9 }}>
                    <div style={{ color: t.success, fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
                      {c.structure.cifParsed}: {cifInfo.fileName}
                    </div>
                    <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                      {lang === "zh" ? "数据" : "data"}: {cifInfo.name || "—"}<br />
                      {lang === "zh" ? "晶胞" : "cell"}: {[cifInfo.cell.a, cifInfo.cell.b, cifInfo.cell.c].filter(Number.isFinite).join(" / ") || "—"} Å
                    </div>
                  </div>
                )}
                <LinkerSubstitutionPreview inputs={inputs} linker={linker} />
              </div>
            </details>
          </SectionCard>
        </div>
        <div style={{ position: "sticky", bottom: 0, borderTop: `1px solid ${t.border}`, padding: "12px 0 0", marginTop: "auto", background: t.panel, boxShadow: "0 -8px 18px rgba(15,23,42,0.03)" }}>
          <button className="btn-primary" onClick={onPredict} disabled={isRunDisabled} title={runDisabledTitle} style={runButtonStyle}>
            {loading && <span className="button-spinner" aria-hidden="true" />}
            {runLabel}
          </button>
          <button onClick={() => setInputs({ ...DEFAULT_INPUTS })}
            style={{ background: "none", border: "none", color: t.faint, fontSize: 11, cursor: "pointer", marginTop: 8 }}>
            ↺ {c.structure.reset}
          </button>
        </div>
      </div>

      {/* ── Center: Results Panel ── */}
      <div className="content-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minHeight: isNarrow ? 0 : "calc(100vh - 142px)" }}>
        <ColumnHeader title={lang === "zh" ? "结果" : "Results"} />
        {loading && !results ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: t.sectionTint, border: `1.5px dashed ${t.borderStrong}`, borderRadius: 8, minHeight: 500, padding: 24 }}>
            <div className="ecomof-pulse-ring" />
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 700, marginTop: 18 }}>
              {lang === "zh" ? "正在运行筛选预测" : "Running screening prediction"}
            </div>
            <div style={{ color: t.subtle, fontSize: 13, textAlign: "center", maxWidth: 360, lineHeight: 1.55, marginTop: 8 }}>
              {lang === "zh" ? "正在计算吸附、选择性、置信度和适用域提示。" : "Calculating uptake, selectivity, confidence, and applicability notes."}
            </div>
          </div>
        ) : !results ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: t.sectionTint, border: `1.5px dashed ${t.borderStrong}`, borderRadius: 8, minHeight: 500, padding: 24, position: "relative", margin: 2 }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: t.badgeInfoBg, color: t.accentText, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 3v6.5L5.5 17a3 3 0 0 0 2.57 4.5h7.86A3 3 0 0 0 18.5 17L14 9.5V3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 3h8M8.2 15h7.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 700, marginBottom: 5 }}>
              {lang === "zh" ? "配置后运行筛选" : "Configure and run"}
            </div>
            <div style={{ color: t.subtle, fontSize: 13, textAlign: "center", maxWidth: 320, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "在左侧设置 MOF 参数和气体条件，然后点击“运行 AI 预测”。"
                : "Set MOF parameters on the left, then click RUN AI PREDICTION."}
            </div>
            <button type="button" onClick={() => onLoadBenchmark?.("UiO-66")}
              className="btn-primary"
              style={{ ...toolbarBtn(t), marginTop: 16, background: t.accent, borderColor: t.accent, color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 700, boxShadow: "0 8px 18px rgba(26,109,181,0.16)" }}>
              {lang === "zh" ? "试用 UiO-66 →" : "Try UiO-66 →"}
            </button>
            <div style={{ color: t.faint, fontSize: 10, marginTop: 8 }}>
              {lang === "zh" ? "这是基准示例，不是用户提交的自定义输入。" : "Benchmark example, not a custom input."}
            </div>
          </div>
        ) : results.unavailable ? (
          <Callout tone="warn">
            <strong>{c.structure.gasUnavailable}</strong> {results.message}
          </Callout>
        ) : (
          <>
            {/* Results Header */}
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px",
              display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ color: t.muted, fontSize: 12 }}>{c.structure.resultTitle}</span>
                  <span style={{ color: t.accentText, fontSize: 13, fontWeight: 700 }}>{results.gasSystem}</span>
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
                  {c.structure.latency}: {results.latencyMs} ms · {c.structure.confidence}: {(results.confidenceScore * 100).toFixed(0)}%
                  {" · "}{c.structure.applicability}: {results.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain}
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, justifyContent: isMobile ? "start" : "end" }}>
                <button onClick={exportCSV}
                  style={{ background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 6, color: t.accentText,
                    fontSize: 11, fontWeight: 800, padding: "7px 11px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  ↓ {c.structure.export}
                </button>
                <button onClick={onSaveRun}
                  style={{ background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 6, color: t.success,
                    fontSize: 11, fontWeight: 800, padding: "7px 11px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  + {c.common.saveRun}
                </button>
              </div>
            </div>

            {results.anomaly && (
              <Callout tone="warn">
                <strong>{results.anomaly.label}</strong>
                <br /><span style={{ opacity: 0.85 }}>{results.anomaly.reason}</span>
              </Callout>
            )}

            {results.applicability?.warnings?.length > 0 && (
              <Callout tone="warn">
                <strong>{c.structure.applicability}: {c.structure.caution}</strong>
                <br /><span style={{ opacity: 0.9 }}>
                  {results.applicability.warnings.slice(0, 3).map(describeApplicabilityWarning).join(" ")}
                </span>
              </Callout>
            )}

            {results.uncertainty && (
              <Callout tone="info">
                <strong>{lang === "zh" ? "不确定性提示" : "Uncertainty note"}</strong>
                <br />
                {lang === "zh"
                  ? `当前结果附带筛选级估计区间：${results.primaryName} 吸附量 ${results.uncertainty.uptake.low}-${results.uncertainty.uptake.high} mmol/g，选择性 ${results.uncertainty.selectivity.low}-${results.uncertainty.selectivity.high}。这不是校准后的概率误差棒，而是由置信度、适用域和气体体系成熟度推导出的伪区间。`
                  : `This result includes a screening-level estimated band: ${results.primaryName} uptake ${results.uncertainty.uptake.low}-${results.uncertainty.uptake.high} mmol/g and selectivity ${results.uncertainty.selectivity.low}-${results.uncertainty.selectivity.high}. This is not a calibrated probabilistic error bar.`}
              </Callout>
            )}

            <ResultLayer
              number="01"
              title={lang === "zh" ? "核心结果" : "Key Outputs"}
              subtitle={lang === "zh" ? "先看阶段 1 的吸附、选择性和置信状态。" : "Start with the Stage 1 uptake, selectivity, and confidence status."}
            >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricCard label={`${results.primaryName.toUpperCase()} ${c.structure.adsorptionCapacity}`}
                value={results.primaryUptake} unit="mmol/g"
                badge={perf?.label} badgeColor={perf?.color} badgeBg={perf?.bg}
                comparison={results.uncertainty ? `${lang === "zh" ? "估计区间" : "estimated band"} ${results.uncertainty.uptake.low}-${results.uncertainty.uptake.high}` : null} />
              <MetricCard label={`${results.secondaryName.toUpperCase()} ${c.structure.uptake}`}
                value={results.secondaryUptake} unit="mmol/g"
                comparison={results.uncertainty ? `${lang === "zh" ? "估计区间" : "estimated band"} ${results.uncertainty.secondary.low}-${results.uncertainty.secondary.high}` : null} />
              <MetricCard label={`${results.primaryName}/${results.secondaryName} ${c.structure.selectivity}`}
                value={results.selectivity}
                comparison={results.uncertainty ? `${lang === "zh" ? "估计区间" : "estimated band"} ${results.uncertainty.selectivity.low}-${results.uncertainty.selectivity.high}` : `${results.selectivity > 30 ? "+" : ""}${((results.selectivity / 30 - 1) * 100).toFixed(1)}% vs 30`} />
              <MetricCard label={lang === "zh" ? "置信度" : "Confidence"} value={(results.confidenceScore * 100).toFixed(0)} unit="%" comparison={results.uncertainty ? (results.uncertainty.level === "wide" ? (lang === "zh" ? "区间较宽" : "wide band") : results.uncertainty.level === "moderate" ? (lang === "zh" ? "区间中等" : "moderate band") : (lang === "zh" ? "区间较窄" : "narrow band")) : null} />
              <MetricCard label={lang === "zh" ? "适用域" : "Applicability"} value={results.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain} unit="" comparison={results.applicability?.warnings?.length ? `${results.applicability.warnings.length} ${lang === "zh" ? "条警告" : "warnings"}` : (lang === "zh" ? "原型范围内" : "within prototype envelope")} />
            </div>
            </ResultLayer>

            <ResultLayer
              number="02"
              title={lang === "zh" ? "结果解释" : "Result Interpretation"}
              subtitle={lang === "zh" ? "用等温线、选择性方法和结构驱动因素解释结果。" : "Interpret the result through isotherm shape, selectivity method, and structural drivers."}
            >
            {results.selectivityDetails && (
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <SectionTitle>{c.methods.selectivity}</SectionTitle>
                  <BasisBadge tone="proxy">{c.common.basisProxy}</BasisBadge>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", color: t.faint, fontSize: 11, marginBottom: 10 }}>
                  <InlineFormula math={"S_{A/B}=q_A/q_B"} fallback="S_A/B = q_A / q_B" />
                  <InlineFormula math={"S_{H,A/B}=K_{H,A}/K_{H,B}"} fallback="S_H,A/B = K_H,A / K_H,B" />
                  <InlineFormula math={"S_{IAST,A/B}\\approx (x_A/y_A)/(x_B/y_B)"} fallback="S_IAST,A/B ~= (x_A/y_A) / (x_B/y_B)" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  {[
                    ["Apparent", results.selectivityDetails.apparent],
                    ["Henry proxy", results.selectivityDetails.henry],
                    ["IAST proxy", results.selectivityDetails.iast],
                    ["Method", results.selectivityDetails.method],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ color: t.faint, fontSize: 10, marginBottom: 5 }}>{zhText(lang, label)}<InfoTip text={label === "Method" ? c.methods.formulaIastBody : c.methods.selectivityBody1} /></div>
                      <div style={{ color: t.textStrong, fontSize: label === "Method" ? 11 : 18, fontWeight: 800, fontFamily: label === "Method" ? FONT_SANS : FONT_SANS, lineHeight: 1.35 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
                  {c.methods.selectivityBody2}
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: t.muted, fontSize: 11, marginBottom: 12, letterSpacing: "0.06em" }}>
                  {c.structure.isotherm}
                </div>
                <ResponsiveContainer width="100%" height={isNarrow ? 210 : 245}>
                  <LineChart data={results.isothermData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="pressure" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "Pressure (bar)", fill: t.subtle, fontSize: 10, dy: 10 }} />
                    <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "mmol/g", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.subtle }} />
                    <Line type="monotone" dataKey="predicted"  stroke={t.accent} strokeWidth={2.5} dot={false} name="ML Predicted" />
                    <Line type="monotone" dataKey="literature" stroke={t.subtle} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Literature Ref." />
                  </LineChart>
                </ResponsiveContainer>
                <HowToRead>
                  {lang === "zh"
                    ? "曲线显示预测吸附量随压力变化；虚线文献参考只作方向性对照，不代表同一严格实验条件。"
                    : "The curve shows predicted uptake versus pressure; the dashed literature reference is directional context, not a matched experimental condition."}
                </HowToRead>
              </div>

              <Callout tone="info">
                <strong>{lang === "zh" ? "为什么这个阶段先开始：" : "Why this stage comes first:"}</strong>{" "}
                {lang === "zh"
                  ? "早期材料筛选应以性能和化学合理性为中心。更宽的成本与生命周期标准只在形成初筛候选后引入。"
                  : "Early-stage materials screening should remain performance- and chemistry-centered. Broader cost and lifecycle criteria are introduced only after an initial filter exists."}
              </Callout>
            </div>
            </ResultLayer>

            <ResultLayer
              number="03"
              title={lang === "zh" ? "依据与局限" : "Basis and Limitations"}
              subtitle={lang === "zh" ? "把模型依据、来源类型和限制与结果分开阅读。" : "Read model basis, source type, and limitations separately from the result."}
            >
            <ProvenanceGrid items={[
              { label: "Basis", value: "Empirical heuristic model (browser-side)", type: "proxy", note: "Hand-crafted correlations based on CoRE MOF 2019 benchmarks. Not a trained ML model on this device." },
              { label: "Source type", value: "Seed benchmark + descriptor input", type: "benchmark", note: lang === "zh" ? `MOF 预设、CIF 派生字段或用户输入。官能团：${formatFunctionalGroupSummary(inputs, lang)}` : `MOF presets, CIF-derived fields, or user input. Groups: ${formatFunctionalGroupSummary(inputs, lang)}` },
              { label: "Quality", value: results.applicability?.warnings?.length ? "Medium-low" : "Medium", type: "proxy", note: results.applicability?.warnings?.length ? "Applicability warning present." : "Within prototype descriptor range." },
              { label: "Limitation", value: "Screening-level only", type: "proxy", note: "Not a strict IAST/GCMC or experimental result." },
            ]} />
            <ResultProvenanceDrawer results={results} inputs={inputs} />
            </ResultLayer>

            <NextStepCTA
              label={lang === "zh" ? "下一步：检查可行性边界" : "Next: check feasibility boundaries"}
              body={lang === "zh" ? "性能和化学筛选之后，再看成本、供应与可得性是否形成早期阻断。" : "After performance and chemistry screening, check whether cost, supply, or availability creates an early boundary."}
              actionLabel={lang === "zh" ? "进入可行性" : "Proceed to feasibility"}
              onClick={() => setActiveTab?.("feasibility")}
            />

            {/* Footer Badges */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📊", title: c.structure.dataSource, desc: "Structure: public/data/mof_structures.json", sub: "Seed schema includes source_database, source_record, descriptor_method, CIF status" },
                { icon: "🤖", title: c.structure.mlArchitecture, desc: "Model: browser profile + optional FastAPI /predict", sub: "Training scaffold reads data/adsorption_labels.csv and writes RF/GBM artifacts" },
                { icon: "🌿", title: c.structure.lcaFramework, desc: "LCA/LCC: public/data/lca_inventory.json", sub: "Proxy inventory now has source_type, assumption, uncertainty, and roadmap replacement" },
              ].map(({ icon, title, desc, sub }) => (
                <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px",
                  display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: t.accentText, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>{title}</div>
                    <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{desc}</div>
                    <div style={{ color: t.faint, fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Right: Guide Sidebar ── */}
      <aside className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, boxShadow: "none", position: isNarrow ? "static" : "sticky", top: 74 }}>
        <ColumnHeader title={lang === "zh" ? "引导" : "Guide"} />
        <details style={{ marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", listStyle: "none", color: t.accentText, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: t.badgeInfoBg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>i</span>
            {lang === "zh" ? "为何从阶段 1 开始" : "Why Stage 1 first?"}
          </summary>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5, padding: "8px 10px", background: t.badgeInfoBg, borderRadius: 6, marginTop: 7 }}>
            {lang === "zh"
              ? "先做性能和化学筛选，再把成本与生命周期放到入围候选比较层。"
              : "Screen performance and chemistry first; cost and lifecycle belong to shortlist comparison."}
          </div>
        </details>
        <div style={{ display: "grid", gap: 6 }}>
          {decisionTips.map(([title, body], index) => (
            <div key={title} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px" }}>
              <span style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: t.badgeInfoBg,
                color: t.accentText,
                fontSize: 10,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {index + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
                <div style={{
                  color: t.muted,
                  fontSize: 12,
                  lineHeight: 1.5,
                  marginTop: 3,
                  display: "-webkit-box",
                  WebkitLineClamp: hasUsableResults ? 4 : 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
        {hasUsableResults && (
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {[
              ["feasibility", lang === "zh" ? "可行性边界" : "Feasibility"],
              ["lca", lang === "zh" ? "入围候选 LCA/LCC" : "Shortlist LCA/LCC"],
              ["validation", lang === "zh" ? "验证依据" : "Validation"],
            ].map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setActiveTab?.(tab)}
                style={{ ...toolbarBtn(t), justifyContent: "space-between", width: "100%", padding: "7px 9px", fontSize: 11 }}>
                <span>{label}</span>
                <span style={{ color: t.faint }}>→</span>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
      <Callout tone="info">
        {lang === "zh"
          ? "来源依据：结构参数来自用户输入、MOF 预设或 CIF 解析；吸附结果为模型/代理筛选输出；LCA/LCC 由代理清单与用户参数计算。"
          : "Source basis: descriptors come from user input, MOF presets, or CIF parsing; adsorption results are model/proxy screening outputs; LCA/LCC uses proxy inventory plus user-defined assumptions."}
      </Callout>
    </div>
  )
}
