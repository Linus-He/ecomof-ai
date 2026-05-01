import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  fetchDataJson, BasisBadge, PageHeader, ResultLayer, Callout, MethodDrawer, UnifiedCandidateCard,
} from "../../shared"

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

const WEIGHTS = {
  co2Affinity: 0.16,
  activeSite: 0.18,
  poreAccessibility: 0.14,
  stability: 0.16,
  electronicProperty: 0.13,
  sustainability: 0.11,
  evidenceConfidence: 0.12,
}

const zhTask = (task, lang) => lang === "zh" ? (task.zh || task.labelZh || task.en || task.label) : (task.en || task.label || task.zh || task.labelZh)
const scoreMap = { High: 9, Medium: 6.4, Low: 3.8, "Low-medium": 5.2, Possible: 7.2, No: 5.6 }
const riskMap = { Low: 8.7, Medium: 6.2, High: 3.4 }
const evidenceMap = { High: 9, Medium: 7, "Low-medium": 5.3, Low: 3.8 }

function normalizeCandidate(item) {
  const metals = Array.isArray(item.metalNodes) ? item.metalNodes : item.metalCenter ? [item.metalCenter] : []
  return {
    ...item,
    metalCenter: item.metalCenter || metals.join(", ") || "unmarked",
    bimetallic: item.bimetallic || "No",
    sustainabilityRisk: item.sustainabilityRisk || (item.costLevel === "High" || item.toxicityConcern === "High" ? "High" : item.costLevel === "Medium" || item.toxicityConcern === "Medium" ? "Medium" : "Low"),
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
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

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [taskId, setTaskId] = useState("co2_conversion")
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState(TASKS)
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
      fetchDataJson("catalysis_tasks.json"),
      fetchDataJson("scoring_weights.json"),
    ]).then(([candidateRows, taskRows, weightRows]) => {
      if (!active) return
      if (Array.isArray(candidateRows) && candidateRows.length) setCandidates(candidateRows.map(normalizeCandidate))
      if (Array.isArray(taskRows) && taskRows.length) setTasks(taskRows)
      if (weightRows?.catalysisPotentialScore) setWeights(weightRows.catalysisPotentialScore)
    }).catch(() => {
      if (!active) return
      setCandidates(CANDIDATES)
      setTasks(TASKS)
      setWeights(WEIGHTS)
    })
    return () => { active = false }
  }, [])

  const task = tasks.find(item => item.id === taskId) || tasks[0]
  const metals = Array.from(new Set(candidates.map(item => item.metalCenter))).sort()

  const ranked = useMemo(() => {
    return candidates
      .map(candidate => ({ ...candidate, catalysis: computeCatalysisScore(candidate, taskId, weights) }))
      .filter(item => filters.metalCenter === "all" || item.metalCenter === filters.metalCenter)
      .filter(item => filters.bimetallic === "all" || item.bimetallic === filters.bimetallic)
      .filter(item => Number(item.poreSizeA) >= Number(filters.poreMin) && Number(item.poreSizeA) <= Number(filters.poreMax))
      .filter(item => Number(item.surfaceArea) >= Number(filters.areaMin) && Number(item.surfaceArea) <= Number(filters.areaMax))
      .filter(item => Number(item.co2Uptake) >= Number(filters.co2Min))
      .filter(item => Number(item.bandGap) >= Number(filters.bandGapMin) && Number(item.bandGap) <= Number(filters.bandGapMax))
      .filter(item => filters.waterStability === "all" || item.waterStability === filters.waterStability)
      .filter(item => filters.thermalStability === "all" || item.thermalStability === filters.thermalStability)
      .filter(item => filters.evidenceLevel === "all" || item.evidenceLevel === filters.evidenceLevel)
      .filter(item => filters.sustainabilityRisk === "all" || item.sustainabilityRisk === filters.sustainabilityRisk)
      .sort((a, b) => b.catalysis.score - a.catalysis.score)
  }, [candidates, taskId, filters, weights])

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
        ["evidenceLevel", lang === "zh" ? "证据等级" : "evidence level", ["Medium", "Low-medium", "Low"]],
        ["sustainabilityRisk", lang === "zh" ? "可持续性风险" : "sustainability risk", ["Low", "Medium", "High"]],
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
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>Rule-based Model</div>
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
              scoreBreakdown={[
                { label: "CO₂ Affinity", value: candidate.catalysis.parts.co2Affinity },
                { label: "Active Site Potential", value: candidate.catalysis.parts.activeSite },
                { label: "Pore Accessibility", value: candidate.catalysis.parts.poreAccessibility },
                { label: "Stability", value: candidate.catalysis.parts.stability },
                { label: "Electronic Property", value: candidate.catalysis.parts.electronicProperty },
                { label: "Sustainability", value: candidate.catalysis.parts.sustainability },
                { label: "Evidence Confidence", value: candidate.catalysis.parts.evidenceConfidence },
              ]}
              keyReasons={[
                `${lang === "zh" ? "活性位点假设" : "active-site hypothesis"}: ${candidate.activeSiteHypothesis}`,
                `${lang === "zh" ? "孔径" : "pore size"} ${candidate.poreSizeA} Å`,
                `${lang === "zh" ? "稳定性" : "stability"} ${zhValue(candidate.waterStability, lang)} / ${zhValue(candidate.thermalStability, lang)}`,
              ]}
              evidenceLevel={lang === "zh" ? `证据等级：${zhValue(candidate.evidenceLevel, lang)}` : `Evidence level: ${candidate.evidenceLevel}`}
              limitations={lang === "zh" ? "Demo / placeholder / rule-based 数据；不代表真实催化活性或选择性。" : "Demo / placeholder / rule-based data; not real catalytic activity or selectivity."}
              recommendedNextStep={lang === "zh" ? "建立反应条件、对照实验、产物选择性和循环稳定性验证。" : "Define reaction conditions, control experiments, product selectivity, and cycling stability validation."}
              onDetails={() => setSelected(candidate)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "结果解释" : "Results Interpretation"}>
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

      <Callout tone="warn">
        {lang === "zh"
          ? "Catalytic performance depends strongly on reaction conditions. 当前分数用于 candidate prioritization，不是最终性能预测。"
          : "Catalytic performance depends strongly on reaction conditions. The current score is intended for candidate prioritization, not final performance prediction."}
      </Callout>
    </div>
  )
}
