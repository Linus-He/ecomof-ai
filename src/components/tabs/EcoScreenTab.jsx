import { useCallback, useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  LITERATURE_DB, METAL_CENTERS, ORGANIC_LINKERS,
  getAdsorptionLabels, getMofStructures, buildDatabaseRecords, toolbarBtn,
  calculateEcoScore, getScoreBreakdown, getWeightContribution, DEFAULT_SCORING_WEIGHTS, evidenceDistribution, scoreDistribution, sensitivityRows,
  RankingBarChart, ScoreBreakdownRadar, WeightContributionChart, EvidenceDistributionChart, ScoreDistributionChart, SensitivityAnalysisChart,
  BasisBadge, PageHeader, ResultLayer, Callout, MethodDrawer, UnifiedCandidateCard, CopyLinkButton,
} from "../../shared"

const ECO_LOAD_NOTICE_MS = 700

function scoreTone(score) {
  if (score >= 8) return "calc"
  if (score >= 6.5) return "info"
  if (score >= 5) return "proxy"
  return "warn"
}

function evidenceTone(level) {
  if (/high|高/i.test(level)) return "calc"
  if (/medium|中/i.test(level)) return "info"
  return "proxy"
}

function sourceLabel(record, lang) {
  if (lang !== "zh") return `${record.sourceDatabase || "local seed"} · ${record.sourceType || "screening proxy"}`
  const db = record.sourceDatabase === "local seed" || !record.sourceDatabase ? "本地种子库" : record.sourceDatabase
  const type = record.sourceType === "seed" || !record.sourceType ? "种子数据" : record.sourceType === "screening proxy" ? "筛选代理" : record.sourceType
  return `${db} · ${type}`
}

function buildEcoCandidates(records, results, inputs, lang) {
  const metalByValue = new Map(METAL_CENTERS.map(item => [item.value, item]))
  const linkerByValue = new Map(ORGANIC_LINKERS.map(item => [item.value, item]))
  const candidates = records.map(record => {
    const metal = metalByValue.get(record.metal)
    const linker = linkerByValue.get(record.linker)
    const metalScore = metal?.lcaScore ?? 6
    const linkerScore = linker?.lcaScore ?? 5.5
    const processFit = Math.max(0, Math.min(1, 1 - Math.abs(Number(record.bet || 0) - 1800) / 4200))
    const selectivityFit = Math.min(1, Number(record.selectivity || 0) / 120)
    const scoringCandidate = {
      ...record,
      co2Uptake: record.co2Uptake || record.co2 || record.primaryUptake || 3,
      surfaceArea: record.bet || record.surfaceArea || 1200,
      poreSizeA: record.pd || record.lcd || record.poreSizeA || 8,
      selectivity: record.selectivity || 0,
      waterStability: record.waterStability || "medium",
      thermalStability: record.thermalStability || "medium",
      costLevel: linkerScore >= 7 ? "low" : linkerScore >= 5.5 ? "medium" : "high",
      toxicityConcern: metalScore >= 7 ? "low" : metalScore >= 5 ? "medium" : "high",
      sustainabilityRisk: metalScore >= 7 && linkerScore >= 6 ? "low" : "medium",
      evidenceLevel: record.sourceType?.includes("literature") || record.sourceType?.includes("GCMC") ? "literature-supported" : "rule-based",
    }
    const eco = calculateEcoScore(scoringCandidate, DEFAULT_SCORING_WEIGHTS.ecoscreen)
    const reasons = [
      metalScore >= 7.5 ? (lang === "zh" ? "低金属负担" : "lower metal burden") : (lang === "zh" ? "金属负担需复核" : "metal burden needs review"),
      linkerScore >= 6 ? (lang === "zh" ? "连接体较可持续" : "more sustainable linker") : (lang === "zh" ? "连接体成本/来源敏感" : "linker source sensitive"),
      Number(record.selectivity || 0) >= 40 ? (lang === "zh" ? "分离趋势较强" : "strong separation trend") : (lang === "zh" ? "性能需验证" : "performance needs validation"),
    ]
    return {
      id: record.name,
      name: record.name,
      metal: record.metal,
      linker: record.linker,
      ...scoringCandidate,
      score: eco.score,
      task: lang === "zh" ? "低环境负担 CO₂ 捕集候选优先级" : "Low-burden CO2-capture candidate prioritization",
      reasons,
      breakdown: getScoreBreakdown(scoringCandidate, "ecoscreen"),
      weightContribution: getWeightContribution(scoringCandidate, DEFAULT_SCORING_WEIGHTS.ecoscreen, "ecoscreen"),
      evidence: record.sourceType?.includes("literature") || record.sourceType?.includes("GCMC")
        ? (lang === "zh" ? "中等证据：文献 / GCMC 标签" : "Medium evidence: literature / GCMC labels")
        : (lang === "zh" ? "低-中证据：种子库 / 代理字段" : "Low-medium evidence: seed / proxy fields"),
      source: sourceLabel(record, lang),
      note: lang === "zh"
        ? "Eco Score 是筛选级候选优先级，不代表完整工业 LCA 结论。"
        : "Eco Score is a screening-level candidate priority, not a complete industrial LCA conclusion.",
      limitations: lang === "zh" ? "代理清单和 seed 记录不能替代完整工业 LCA/LCC。" : "Proxy inventory and seed records do not replace full industrial LCA/LCC.",
      nextStep: lang === "zh" ? "补充合成路线、供应链数据、循环寿命和正式清单。" : "Add synthesis route, supply-chain data, cycle lifetime, and formal inventory.",
    }
  })

  if (results && !results.unavailable) {
    candidates.unshift({
      id: "current-run",
      name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`,
      metal: inputs.metalCenter,
      linker: inputs.organicLinker,
      score: calculateEcoScore({
        co2Uptake: results.primaryUptake,
        selectivity: results.selectivity,
        surfaceArea: inputs.surfaceArea || inputs.bet || 1200,
        poreSizeA: inputs.poreSizeA || inputs.poreSize || 8,
        waterStability: "medium",
        thermalStability: "medium",
        costLevel: "medium",
        toxicityConcern: "low",
        evidenceLevel: "rule-based",
      }, DEFAULT_SCORING_WEIGHTS.ecoscreen).score,
      task: lang === "zh" ? "当前输入结构的 EcoScreen 候选" : "EcoScreen candidate for current input",
      reasons: [
        lang === "zh" ? "来自当前输入" : "current input",
        lang === "zh" ? `选择性 ${results.selectivity}` : `selectivity ${results.selectivity}`,
        lang === "zh" ? "需要实验和清单验证" : "requires experimental and inventory validation",
      ],
      breakdown: getScoreBreakdown({
        co2Uptake: results.primaryUptake,
        selectivity: results.selectivity,
        surfaceArea: inputs.surfaceArea || inputs.bet || 1200,
        poreSizeA: inputs.poreSizeA || inputs.poreSize || 8,
        waterStability: "medium",
        thermalStability: "medium",
        costLevel: "medium",
        toxicityConcern: "low",
        evidenceLevel: "rule-based",
      }, "ecoscreen"),
      weightContribution: getWeightContribution({
        co2Uptake: results.primaryUptake,
        selectivity: results.selectivity,
        surfaceArea: inputs.surfaceArea || inputs.bet || 1200,
        poreSizeA: inputs.poreSizeA || inputs.poreSize || 8,
        waterStability: "medium",
        thermalStability: "medium",
        costLevel: "medium",
        toxicityConcern: "low",
        evidenceLevel: "rule-based",
      }, DEFAULT_SCORING_WEIGHTS.ecoscreen, "ecoscreen"),
      evidence: lang === "zh" ? "模型 / 代理证据" : "Model / proxy evidence",
      source: lang === "zh" ? "当前浏览器端模型 + LCA 代理规则" : "Current browser model + LCA proxy rules",
      note: lang === "zh"
        ? "当前结果只说明候选排序方向，应进入数据补充和实验验证。"
        : "The current result only indicates ranking direction and should move to data enrichment and validation.",
      limitations: lang === "zh" ? "浏览器端模型与 LCA 代理不能替代实验、GCMC 或完整清单。" : "Browser model and LCA proxy cannot replace experiment, GCMC, or complete inventory.",
      nextStep: lang === "zh" ? "验证实测吸附、材料寿命、再生能耗和供应商/工艺清单。" : "Validate measured adsorption, material lifetime, regeneration energy, and supplier/process inventory.",
    })
  }
  return candidates
}

export function EcoScreenTab({ inputs, setInputs, results, loading, onPredict, onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    task: "co2-capture",
    metalRisk: "noHigh",
    minScore: 62,
    evidence: "all",
  })
  const [dataStatus, setDataStatus] = useState("loading")
  const [runStatus, setRunStatus] = useState("idle")
  const [runNotice, setRunNotice] = useState("")
  const [scenarioResult, setScenarioResult] = useState(null)

  useEffect(() => {
    let active = true
    let noticeTimer = null
    setDataStatus("loading")
    noticeTimer = window.setTimeout(() => {
      if (active) setDataStatus("loaded")
    }, ECO_LOAD_NOTICE_MS)
    Promise.all([getMofStructures({ throwOnError: true }), getAdsorptionLabels({ throwOnError: true })])
      .then(([structures, labels]) => {
        if (!active) return
        window.clearTimeout(noticeTimer)
        const nextStructures = Array.isArray(structures) ? structures : []
        const nextLabels = Array.isArray(labels) ? labels : []
        setStructureRows(nextStructures)
        setLabelRows(nextLabels)
        setDataStatus(nextStructures.length || nextLabels.length ? "loaded" : "empty")
      })
      .catch((error) => {
        console.warn("EcoScreen data load failed.", error)
        if (!active) return
        window.clearTimeout(noticeTimer)
        setStructureRows([])
        setLabelRows([])
        setDataStatus("error")
      })
    return () => {
      active = false
      window.clearTimeout(noticeTimer)
    }
  }, [])

  const records = useMemo(() => {
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return loaded.length ? loaded : LITERATURE_DB
  }, [structureRows, labelRows])

  const candidates = useMemo(() => {
    return buildEcoCandidates(records, results, inputs, lang)
      .filter(item => {
        if (filters.metalRisk === "noHigh" && ["Cr3+", "Co2+", "Ni2+"].includes(item.metal)) return false
        if (filters.metalRisk === "lowOnly" && !["Zr4+", "Mg2+", "Al3+", "Fe3+"].includes(item.metal)) return false
        if (item.score < Number(filters.minScore)) return false
        if (filters.evidence === "medium" && !/中等|Medium|GCMC|literature/i.test(item.evidence)) return false
        return true
      })
      .sort((a, b) => b.score - a.score)
  }, [records, results, inputs, lang, filters])

  const activeCandidate = useMemo(() => selected || candidates[0] || null, [selected, candidates])
  const chartData = useMemo(() => ({
    ranking: candidates,
    evidence: evidenceDistribution(candidates),
    scores: scoreDistribution(candidates),
    sensitivity: sensitivityRows(candidates, "ecoscreen", DEFAULT_SCORING_WEIGHTS.ecoscreen, null, "sustainability"),
  }), [candidates])
  const hasRunnableContext = Boolean(activeCandidate || inputs?.mofName || records.length)
  const runScenario = useCallback(() => {
    if (!hasRunnableContext) {
      setRunNotice(lang === "zh"
        ? "请先选择候选材料，或使用当前材料库语境后再运行 EcoScreen。"
        : "Select a candidate or use the current library context before running EcoScreen.")
      return
    }

    const candidate = activeCandidate || candidates[0]
    setRunNotice("")
    setRunStatus("running")
    window.setTimeout(() => {
      const descriptorKeys = ["surfaceArea", "poreSizeA", "poreVolume", "co2Uptake", "bandGap", "waterStability", "thermalStability", "toxicityConcern"]
      const available = descriptorKeys.filter(key => {
        const value = candidate?.[key]
        return value !== undefined && value !== null && value !== "" && value !== "pending" && value !== "—"
      })
      const pending = descriptorKeys.filter(key => !available.includes(key))
      setScenarioResult({
        name: candidate?.name || inputs?.mofName || `${inputs?.metalCenter || "—"}/${inputs?.organicLinker || "—"}`,
        dataMode: candidate?.fieldSources ? "real-seed / static JSON" : "demo / library context",
        availableCount: available.length,
        pendingCount: pending.length,
        pendingFields: pending,
        signals: [
          candidate?.metal ? `${lang === "zh" ? "金属节点" : "Metal node"}: ${candidate.metal}` : null,
          candidate?.linker ? `${lang === "zh" ? "连接体" : "Linker"}: ${candidate.linker}` : null,
          Number.isFinite(Number(candidate?.score)) ? `${lang === "zh" ? "生态评分" : "Eco Score"}: ${Number(candidate.score).toFixed(1)}` : null,
        ].filter(Boolean),
      })
      setRunStatus("done")
    }, 420)
  }, [activeCandidate, candidates, hasRunnableContext, inputs, lang])
  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="EcoScreen"
        subtitle={lang === "zh"
          ? "面向可持续性和早期可行性的 MOF 候选筛选。这里保留 Eco Score、LCA/LCC 代理和解释卡片，但所有输出都只用于候选优先级排序。"
          : "MOF candidate screening for sustainability and early feasibility. Eco Score, LCA/LCC proxies, and explanations are preserved here as candidate-prioritization outputs."}
        meta={lang === "zh" ? "任务介绍 · 可持续性筛选条件 · 生态评分排序 · 解释卡片 · 方法与证据" : "Task introduction · sustainability filters · Eco Score ranking · explanation cards · methods and evidence"}
        action={
          <>
            <BasisBadge tone="proxy">{lang === "zh" ? "不替代完整 LCA" : "not full LCA"}</BasisBadge>
            <CopyLinkButton hash="ecoscreen" ariaLabel={lang === "zh" ? "复制 EcoScreen 链接" : "Copy EcoScreen link"} />
          </>
        }
      />

      <Callout tone="info">
        {lang === "zh"
          ? "EcoScreen 的目标是帮助形成低负担候选清单。数据库字段、模型评分和代理清单不能直接等同于科研结论。"
          : "EcoScreen helps form lower-burden candidate shortlists. Database fields, model scores, and proxy inventories are not direct scientific conclusions."}
      </Callout>
      {dataStatus === "loading" && (
        <Callout tone="info">{lang === "zh" ? "正在加载 EcoScreen 数据…" : "Loading EcoScreen data..."}</Callout>
      )}
      {dataStatus === "error" && (
        <Callout tone="warn">
          {lang === "zh"
            ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。当前页面会使用本地种子上下文继续展示。"
            : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages. This view continues with local seed context."}
        </Callout>
      )}
      {dataStatus === "empty" && (
        <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
      )}

      <ResultLayer number="01" title={lang === "zh" ? "可持续性筛选条件" : "Sustainability Filters"} subtitle={lang === "zh" ? "筛选规则影响排序展示，不改变原始数据库记录。" : "Filters affect ranking display, not the underlying database records."}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <button type="button" onClick={() => setFiltersOpen(prev => !prev)} style={{ ...controlStyle, display: isMobile ? "block" : "none", marginBottom: filtersOpen ? 10 : 0 }}>
            {filtersOpen ? (lang === "zh" ? "收起筛选器" : "Collapse filters") : (lang === "zh" ? "展开筛选器" : "Expand filters")}
          </button>
          <div style={{ display: isMobile && !filtersOpen ? "none" : "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
              {lang === "zh" ? "筛选任务" : "Task"}
              <select value={filters.task} onChange={e => setFilters(prev => ({ ...prev, task: e.target.value }))} style={controlStyle}>
                <option value="co2-capture">{lang === "zh" ? "CO₂ 捕集低负担候选" : "CO2 capture low-burden candidates"}</option>
                <option value="solvent-light">{lang === "zh" ? "低溶剂/废弃物压力" : "lower solvent/waste pressure"}</option>
                <option value="supply-aware">{lang === "zh" ? "供应与成本敏感性较低" : "lower supply/cost sensitivity"}</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
              {lang === "zh" ? "金属风险" : "Metal risk"}
              <select value={filters.metalRisk} onChange={e => setFilters(prev => ({ ...prev, metalRisk: e.target.value }))} style={controlStyle}>
                <option value="noHigh">{lang === "zh" ? "排除高风险节点" : "exclude high-risk nodes"}</option>
                <option value="lowOnly">{lang === "zh" ? "只看低/中低负担节点" : "low-burden nodes only"}</option>
                <option value="all">{lang === "zh" ? "全部显示" : "show all"}</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
              {lang === "zh" ? "最低生态评分" : "Minimum Eco Score"}
              <input type="number" min="0" max="100" step="1" value={filters.minScore} onChange={e => setFilters(prev => ({ ...prev, minScore: e.target.value }))} style={controlStyle} />
            </label>
            <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
              {lang === "zh" ? "证据等级" : "Evidence"}
              <select value={filters.evidence} onChange={e => setFilters(prev => ({ ...prev, evidence: e.target.value }))} style={controlStyle}>
                <option value="all">{lang === "zh" ? "全部证据" : "all evidence"}</option>
                <option value="medium">{lang === "zh" ? "中等及以上" : "medium or higher"}</option>
              </select>
            </label>
            <button
              type="button"
              onClick={runScenario}
              disabled={runStatus === "running"}
              title={runStatus === "running" ? (lang === "zh" ? "EcoScreen 正在运行。" : "EcoScreen is running.") : undefined}
              style={{ ...toolbarBtn(t), alignSelf: "end", minHeight: 38, opacity: runStatus === "running" ? 0.72 : 1, cursor: runStatus === "running" ? "not-allowed" : "pointer" }}
            >
              {runStatus === "running"
                ? (lang === "zh" ? "正在运行..." : "Running...")
                : runStatus === "done"
                  ? (lang === "zh" ? "重新运行" : "Run again")
                  : (lang === "zh" ? "运行当前结构" : "Run current structure")}
            </button>
          </div>
          {runNotice && (
            <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
              {runNotice}
            </div>
          )}
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
            {lang === "zh"
              ? "当前原型未接入自定义结构上传。本次运行基于当前候选材料语境和已有描述符信号进行展示。"
              : "No custom structure is uploaded in this prototype. This run uses the current candidate context and available descriptor signals."}
          </div>
        </div>
      </ResultLayer>
      {scenarioResult && (
        <ResultLayer number="01B" title={lang === "zh" ? "EcoScreen 场景结果" : "EcoScreen scenario result"}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, display: "grid", gap: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{scenarioResult.name}</div>
              <BasisBadge tone="proxy">{scenarioResult.dataMode}</BasisBadge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              {[
                [lang === "zh" ? "数据模式" : "Data mode", scenarioResult.dataMode],
                [lang === "zh" ? "可用描述符数量" : "Available descriptor count", `${scenarioResult.availableCount}/8`],
                [lang === "zh" ? "可持续性信号" : "Sustainability signals", scenarioResult.signals.join("; ") || (lang === "zh" ? "待补充" : "Pending")],
                [lang === "zh" ? "待补充字段" : "Pending fields", scenarioResult.pendingCount ? scenarioResult.pendingFields.join(", ") : (lang === "zh" ? "无" : "None")],
              ].map(([label, value]) => (
                <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{label}</div>
                  <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>{value}</div>
                </div>
              ))}
            </div>
            <Callout tone="warn">
              {lang === "zh"
                ? "本次 EcoScreen 运行是基于当前可用描述符的前端决策支持预览，不代表完整 LCA 结果或已验证材料预测。"
                : "This EcoScreen run is a front-end decision-support preview based on available descriptors. It is not a final LCA result or validated material prediction."}
            </Callout>
          </div>
        </ResultLayer>
      )}

      <ResultLayer number="02" title={lang === "zh" ? "生态评分排序" : "Eco Score Ranking"} subtitle={lang === "zh" ? "统一结果卡片：MOF 名称 / 评分 / 适合任务 / 关键原因 / 证据等级 / 查看详情。" : "Unified result cards: MOF name / Score / Suitable task / Key reasons / Evidence level / View details."}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
          {candidates.length === 0 && (
            <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
          )}
          {candidates.slice(0, 6).map(candidate => (
            <UnifiedCandidateCard
              key={candidate.id}
              name={candidate.name}
              score={candidate.score}
              scoreLabel={lang === "zh" ? "生态评分" : "Eco Score"}
              suitableTask={candidate.task}
              scoreBreakdown={candidate.breakdown}
              keyReasons={candidate.reasons}
              evidenceLevel={candidate.evidence}
              limitations={candidate.limitations}
              recommendedNextStep={candidate.nextStep}
              fieldSources={candidate.fieldSources}
              dataStatus={candidate.fieldSources ? undefined : "demo"}
              onDetails={() => setSelected(candidate)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "结果解释说明" : "Results Interpretation Notes"} subtitle={lang === "zh" ? "Eco Score 表示候选材料在当前可持续性评分策略下的优先级，不等同于完整工业 LCA 结论。" : "Eco Score indicates candidate priority under the current sustainability scoring strategy. It does not replace full industrial LCA."}>
        {activeCandidate && (
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone={scoreTone(activeCandidate.score)}>{lang === "zh" ? "生态评分" : "Eco Score"} {activeCandidate.score.toFixed(1)}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{activeCandidate.name}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{activeCandidate.note}</div>
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone={evidenceTone(activeCandidate.evidence)}>{activeCandidate.evidence}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{lang === "zh" ? "数据来源" : "Data source"}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{activeCandidate.source}</div>
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone="proxy">{lang === "zh" ? "下一步" : "Next step"}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>{lang === "zh" ? "需要验证" : "Needs validation"}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
                {lang === "zh" ? "补充合成路线、实测吸附/再生数据和正式清单后，才能进入科研结论表述。" : "Add synthesis route, measured adsorption/regeneration data, and formal inventory before scientific claims."}
              </div>
            </div>
          </div>
        )}
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "Model Results / 结果解释图表" : "Model Results / Results Interpretation"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
          <RankingBarChart data={chartData.ranking} scoreLabel={lang === "zh" ? "生态评分" : "Eco Score"} />
          <ScoreBreakdownRadar data={activeCandidate?.breakdown || []} title={activeCandidate ? `${activeCandidate.name} · ${lang === "zh" ? "评分拆解" : "Score Breakdown"}` : (lang === "zh" ? "评分拆解" : "Score Breakdown")} />
          <WeightContributionChart data={activeCandidate?.weightContribution || []} />
          <EvidenceDistributionChart data={chartData.evidence} />
          <ScoreDistributionChart data={chartData.scores} />
          <SensitivityAnalysisChart data={chartData.sensitivity} dimension="Sustainability" />
        </div>
      </ResultLayer>

      <ResultLayer number="05" title={lang === "zh" ? "方法与证据" : "Methods & Evidence"}>
        <div style={{ display: "grid", gap: 10 }}>
          <MethodDrawer title={lang === "zh" ? "生态评分解释边界" : "Eco Score interpretation boundary"}>
            {lang === "zh" ? "生态评分聚合金属节点、连接体、过程代理、性能趋势和来源质量。它是候选优先级，不是完整 LCIA 或供应商报价。" : "Eco Score aggregates node, linker, process proxies, performance trend, and source quality. It is candidate priority, not full LCIA or supplier pricing."}
          </MethodDrawer>
          <MethodDrawer title={lang === "zh" ? "已有 Eco 功能如何保留" : "How existing Eco features are preserved"}>
            {lang === "zh" ? "现有 LCA/LCC、绿色评分、敏感性和结果解释逻辑被整理到 EcoScreen 的筛选、排序和方法与证据说明中；旧的细分页面仍保留在代码中。" : "Existing LCA/LCC, green score, sensitivity, and explanation logic are reorganized into EcoScreen filters, ranking, and methods and evidence notes; older detailed pages remain in code."}
          </MethodDrawer>
        </div>
      </ResultLayer>
    </div>
  )
}
