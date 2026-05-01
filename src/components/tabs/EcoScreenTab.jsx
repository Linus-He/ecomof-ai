import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  LITERATURE_DB, METAL_CENTERS, ORGANIC_LINKERS,
  fetchDataJson, buildDatabaseRecords, toolbarBtn,
  BasisBadge, PageHeader, ResultLayer, Callout, MethodDrawer, UnifiedCandidateCard,
} from "../../shared"

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
    const score = Math.max(0, Math.min(10, metalScore * 0.42 + linkerScore * 0.32 + processFit * 1.4 + selectivityFit * 1.0 - (record.metal === "Cr3+" ? 1.1 : 0)))
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
      score: Number(score.toFixed(1)),
      task: lang === "zh" ? "低环境负担 CO₂ 捕集候选优先级" : "Low-burden CO2-capture candidate prioritization",
      reasons,
      breakdown: [
        { label: lang === "zh" ? "金属负担" : "Metal burden", value: metalScore },
        { label: lang === "zh" ? "连接体可持续性" : "Linker sustainability", value: linkerScore },
        { label: lang === "zh" ? "孔结构适配" : "Pore fit", value: processFit * 10 },
        { label: lang === "zh" ? "分离趋势" : "Separation trend", value: selectivityFit * 10 },
      ],
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
      score: Number(results.lca?.compositeGreenScore ?? 0),
      task: lang === "zh" ? "当前输入结构的 EcoScreen 候选" : "EcoScreen candidate for current input",
      reasons: [
        lang === "zh" ? "来自当前输入" : "current input",
        lang === "zh" ? `选择性 ${results.selectivity}` : `selectivity ${results.selectivity}`,
        lang === "zh" ? "需要实验和清单验证" : "requires experimental and inventory validation",
      ],
      breakdown: [
        { label: lang === "zh" ? "当前生态评分" : "Current eco score", value: Number(results.lca?.compositeGreenScore ?? 0) },
        { label: lang === "zh" ? "选择性贡献" : "Selectivity contribution", value: Math.min(10, Number(results.selectivity || 0) / 12) },
        { label: lang === "zh" ? "置信度" : "Confidence", value: Number(results.confidenceScore || 0) * 10 },
      ],
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
    minScore: 6.2,
    evidence: "all",
  })

  useEffect(() => {
    let active = true
    Promise.all([fetchDataJson("mof_structures.json"), fetchDataJson("adsorption_labels.json")])
      .then(([structures, labels]) => {
        if (!active) return
        setStructureRows(structures)
        setLabelRows(labels)
      })
      .catch(() => {
        if (!active) return
        setStructureRows([])
        setLabelRows([])
      })
    return () => { active = false }
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

  const activeCandidate = selected || candidates[0]
  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="EcoScreen"
        subtitle={lang === "zh"
          ? "面向可持续性和早期可行性的 MOF 候选筛选。这里保留 Eco Score、LCA/LCC 代理和解释卡片，但所有输出都只用于候选优先级排序。"
          : "MOF candidate screening for sustainability and early feasibility. Eco Score, LCA/LCC proxies, and explanations are preserved here as candidate-prioritization outputs."}
        meta={lang === "zh" ? "任务介绍 · 可持续性筛选条件 · 生态评分排序 · 解释卡片 · 方法说明" : "Task introduction · sustainability filters · Eco Score ranking · explanation cards · method notes"}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "不替代完整 LCA" : "not full LCA"}</BasisBadge>}
      />

      <Callout tone="info">
        {lang === "zh"
          ? "EcoScreen 的目标是帮助形成低负担候选清单。数据库字段、模型评分和代理清单不能直接等同于科研结论。"
          : "EcoScreen helps form lower-burden candidate shortlists. Database fields, model scores, and proxy inventories are not direct scientific conclusions."}
      </Callout>

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
              <input type="number" min="0" max="10" step="0.1" value={filters.minScore} onChange={e => setFilters(prev => ({ ...prev, minScore: e.target.value }))} style={controlStyle} />
            </label>
            <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
              {lang === "zh" ? "证据等级" : "Evidence"}
              <select value={filters.evidence} onChange={e => setFilters(prev => ({ ...prev, evidence: e.target.value }))} style={controlStyle}>
                <option value="all">{lang === "zh" ? "全部证据" : "all evidence"}</option>
                <option value="medium">{lang === "zh" ? "中等及以上" : "medium or higher"}</option>
              </select>
            </label>
            <button type="button" onClick={onPredict} disabled={loading} style={{ ...toolbarBtn(t), alignSelf: "end", minHeight: 38 }}>
              {loading ? (lang === "zh" ? "计算中..." : "Running...") : (lang === "zh" ? "运行当前结构" : "Run current structure")}
            </button>
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "生态评分排序" : "Eco Score Ranking"} subtitle={lang === "zh" ? "统一结果卡片：MOF 名称 / 评分 / 适合任务 / 关键原因 / 证据等级 / 查看详情。" : "Unified result cards: MOF name / Score / Suitable task / Key reasons / Evidence level / View details."}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
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
              onDetails={() => setSelected(candidate)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "解释卡片" : "Explanation Cards"} subtitle={lang === "zh" ? "解释为什么一个候选值得进入下一轮，而不是把分数当作最终结论。" : "Explain why a candidate should enter the next round without treating the score as a final conclusion."}>
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

      <ResultLayer number="04" title={lang === "zh" ? "方法说明" : "Method Notes"}>
        <div style={{ display: "grid", gap: 10 }}>
          <MethodDrawer title={lang === "zh" ? "生态评分解释边界" : "Eco Score interpretation boundary"}>
            {lang === "zh" ? "生态评分聚合金属节点、连接体、过程代理、性能趋势和来源质量。它是候选优先级，不是完整 LCIA 或供应商报价。" : "Eco Score aggregates node, linker, process proxies, performance trend, and source quality. It is candidate priority, not full LCIA or supplier pricing."}
          </MethodDrawer>
          <MethodDrawer title={lang === "zh" ? "已有 Eco 功能如何保留" : "How existing Eco features are preserved"}>
            {lang === "zh" ? "现有 LCA/LCC、绿色评分、敏感性和结果解释逻辑被整理到 EcoScreen 的筛选、排序和方法说明中；旧的细分页面仍保留在代码中。" : "Existing LCA/LCC, green score, sensitivity, and explanation logic are reorganized into EcoScreen filters, ranking, and method notes; older detailed pages remain in code."}
          </MethodDrawer>
        </div>
      </ResultLayer>
    </div>
  )
}
