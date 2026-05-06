import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  gasLabel, getGasSystem, getMofCandidates, toolbarBtn,
  buildScoredCandidates, DEFAULT_SCORING_WEIGHTS, evidenceDistribution, scoreDistribution, sensitivityRows,
  RankingBarChart, ScoreBreakdownRadar, WeightContributionChart, EvidenceDistributionChart, ScoreDistributionChart, SensitivityAnalysisChart,
  BasisBadge, PageHeader, ResultLayer, Callout, UnifiedCandidateCard, DataModeToggle, RealSeedCallout, DemoModeBanner, safeVal, CopyLinkButton,
  FieldProvenanceButton,
} from "../../shared"
import { ScreeningTab } from "./ScreeningTab"

/** Normalise a real-seed record into the shape PerformanceTab expects.
 *  Null numeric fields become safe defaults so no NaN propagates. */
function normalizeRealSeedForPerf(item) {
  return {
    id: item.id || item.name,
    name: item.name,
    metalNodes: item.metalNodes || [],
    metalCenter: (item.metalNodes || []).join(", ") || "—",
    bimetallic: item.bimetallic ? "Yes" : "No",
    linker: item.linker || "—",
    poreSizeA: item.poreSizeA ?? 0,
    surfaceArea: item.surfaceArea ?? 0,
    poreVolume: item.poreVolume ?? 0,
    co2Uptake: item.co2Uptake ?? 0,
    selectivity: 0,
    thermodynamicIndicator: 0,
    bandGap: item.bandGap ?? 0,
    waterStability: item.waterStability || "unknown",
    thermalStability: item.thermalStability || "unknown",
    costLevel: item.costLevel || "unknown",
    toxicityConcern: item.toxicityConcern || "unknown",
    sustainabilityRisk: item.sustainabilityRisk || "unknown",
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    activeSiteHypothesis: Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis || "—",
    evidenceLevel: item.evidenceLevel || "needs-validation",
    limitations: Array.isArray(item.limitations) ? item.limitations : [],
    dataMode: "real-seed",
    curationNote: item.curationNote || "",
    fieldSources: item.fieldSources || undefined,
  }
}

/** Read & consume a one-shot navigation signal from sessionStorage. */
function consumePerfInitView() {
  try {
    if (typeof sessionStorage === "undefined") return "overview"
    const stored = sessionStorage.getItem("ecomof_perf_init_view")
    if (stored) { sessionStorage.removeItem("ecomof_perf_init_view"); return stored }
  } catch {}
  return "overview"
}

export function PerformanceTab({
  inputs, setInputs, results, loading, onPredict, onNavigate,
  onSaveRun, apiUrl, setApiUrl, apiStatus, onCheckApi, onLoadBenchmark, onAddComparison,
}) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("real-seed")
  // Read sessionStorage on first mount so HomeTab "Advanced Screening" button
  // can pre-select the advanced workspace without extra prop drilling.
  const [performanceView, setPerformanceView] = useState(consumePerfInitView)
  const [demoRows, setDemoRows] = useState([])
  const [realSeedRows, setRealSeedRows] = useState([])
  const [dataStatus, setDataStatus] = useState("loading")
  const [selectedId, setSelectedId] = useState(null)
  const gas = getGasSystem(inputs.gasSystem)
  const hasResult = results && !results.unavailable

  useEffect(() => {
    let active = true
    setDataStatus("loading")
    Promise.all([
      getMofCandidates({ mode: "demo", throwOnError: true }),
      getMofCandidates({ mode: "real-seed", throwOnError: true }),
    ])
      .then(([demo, realSeed]) => {
        if (!active) return
        const nextDemo = Array.isArray(demo) ? demo : []
        const nextRealSeed = Array.isArray(realSeed) ? realSeed : []
        setDemoRows(nextDemo)
        setRealSeedRows(nextRealSeed)
        setDataStatus(nextDemo.length || nextRealSeed.length ? "loaded" : "empty")
      })
      .catch((error) => {
        console.warn("Performance data load failed.", error)
        if (active) { setDemoRows([]); setRealSeedRows([]); setDataStatus("error") }
      })
    return () => { active = false }
  }, [])

  const currentCandidate = useMemo(() => hasResult ? {
    id: "current-performance",
    name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`,
    metalNodes: [inputs.metalCenter],
    linker: inputs.organicLinker,
    poreSizeA: inputs.poreSizeA || inputs.poreSize || 8,
    surfaceArea: inputs.surfaceArea || inputs.bet || 1200,
    poreVolume: inputs.poreVolume || 0.5,
    co2Uptake: results.primaryUptake,
    selectivity: results.selectivity,
    thermodynamicIndicator: results.thermo?.qst0 || 32,
    waterStability: "medium",
    thermalStability: "medium",
    costLevel: "medium",
    toxicityConcern: "low",
    evidenceLevel: "rule-based",
    limitations: [lang === "zh" ? "当前浏览器端结果需要实测等温线、GCMC 或 IAST 验证。" : "Current browser-side result needs measured isotherm, GCMC, or IAST validation."],
  } : null, [hasResult, inputs, results, lang])

  const baseRows = useMemo(() => {
    if (dataMode === "real-seed") return realSeedRows.map(normalizeRealSeedForPerf)
    return demoRows
  }, [dataMode, demoRows, realSeedRows])

  const performanceCandidates = useMemo(() => {
    return buildScoredCandidates([...(currentCandidate ? [currentCandidate] : []), ...baseRows], "performance", DEFAULT_SCORING_WEIGHTS.performance)
  }, [currentCandidate, baseRows])

  const activeCandidate = useMemo(() => performanceCandidates.find(item => item.id === selectedId) || performanceCandidates[0] || null, [performanceCandidates, selectedId])
  const chartData = useMemo(() => ({
    ranking: performanceCandidates,
    evidence: evidenceDistribution(performanceCandidates),
    scores: scoreDistribution(performanceCandidates),
    sensitivity: sensitivityRows(performanceCandidates, "performance", DEFAULT_SCORING_WEIGHTS.performance, null, "stability"),
  }), [performanceCandidates])
  const score = activeCandidate?.score ?? 0
  const reasons = hasResult
    ? [
        `${results.primaryName || "CO₂"} uptake ${results.primaryUptake} mmol/g`,
        `${lang === "zh" ? "表观选择性" : "apparent selectivity"} ${results.selectivity}`,
        `${lang === "zh" ? "置信度" : "confidence"} ${Math.round(Number(results.confidenceScore || 0) * 100)}%`,
      ]
    : [lang === "zh" ? "运行当前结构后生成性能候选解释" : "Run the current structure to generate performance interpretation"]

  const interpretation = useMemo(() => {
    if (!hasResult) {
      return {
        means: lang === "zh" ? "Performance 分数会把吸附量、选择性、热力学线索和适用域提示合成为早期候选优先级。" : "The Performance score combines uptake, selectivity, thermodynamic cues, and applicability notes into an early-stage candidate priority.",
        high: lang === "zh" ? "当前还没有结果；请先运行浏览器端筛选模型。" : "No result yet; run the browser-side screening model first.",
        data: lang === "zh" ? "数据来源将显示为用户输入、MOF 预设或 seed 标签。" : "Data support will be user input, MOF preset, or seed label context.",
        next: lang === "zh" ? "下一步是补充实测等温线、GCMC 或严格 IAST 验证。" : "Next step is measured isotherms, GCMC, or strict IAST validation.",
      }
    }
    return {
      means: lang === "zh" ? "该分数表示当前候选在所选气体体系下的性能优先级，不是真实最终性能。" : "This score indicates candidate priority for the selected gas system, not final material performance.",
      high: lang === "zh" ? "候选排序来自吸附量、选择性和置信度的组合。" : "Ranking comes from a combination of uptake, selectivity, and confidence.",
      data: lang === "zh" ? "支持数据包括当前结构描述符、气体体系规则、预测等温线和适用域提示。" : "Supporting data includes current descriptors, gas-system rules, predicted isotherms, and applicability notes.",
      next: lang === "zh" ? "下一步应验证实测吸附量、混合气选择性、循环稳定性和热力学解释。" : "Validate measured uptake, mixture selectivity, cycling stability, and thermodynamic interpretation next.",
    }
  }, [hasResult, lang])

  // ── Mode definitions ──────────────────────────────────────────────────────
  const modes = useMemo(() => [
    {
      id: "overview",
      icon: "📊",
      title: lang === "zh" ? "结果概览" : "Results Overview",
      body: lang === "zh"
        ? "查看候选 MOF 排名、模型结果图和基于描述符的评分解释。"
        : "Explore ranked MOF candidates, model result visualizations, and descriptor-based score interpretation.",
    },
    {
      id: "advanced",
      icon: "🔬",
      title: lang === "zh" ? "高级筛选工作台" : "Advanced Screening Workspace",
      body: lang === "zh"
        ? "输入自定义 MOF 描述符、上传 CIF 信息、设置吸附条件，并运行早期筛选。"
        : "Input custom MOF descriptors, upload CIF information, configure adsorption conditions, and run early-stage screening.",
    },
  ], [lang])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Performance"
        subtitle={lang === "zh"
          ? "围绕 CO₂ uptake、选择性和热力学解释的早期性能候选筛选。保留现有吸附/筛选能力，但把结果解释成候选优先级。"
          : "Early-stage performance screening around CO₂ uptake, selectivity, and thermodynamic interpretation. Existing adsorption screening remains, but outputs are framed as candidate priority."}
        meta={lang === "zh" ? "CO₂ uptake · selectivity · thermodynamic interpretation · Early-stage Screening" : "CO₂ uptake · selectivity · thermodynamic interpretation · Early-stage Screening"}
        action={
          <>
            <BasisBadge tone="info">{lang === "zh" ? "不替代 GCMC / IAST" : "not GCMC / IAST"}</BasisBadge>
            <CopyLinkButton hash="performance" ariaLabel={lang === "zh" ? "复制 Performance 链接" : "Copy Performance link"} />
          </>
        }
      />

      {/* ── Mode selector cards ───────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 10,
      }}>
        {modes.map(mode => {
          const isActive = performanceView === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPerformanceView(mode.id)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                border: `2px solid ${isActive ? t.accent : t.border}`,
                background: isActive ? t.badgeInfoBg : t.panel,
                borderRadius: 10,
                padding: isMobile ? "14px 16px" : "16px 20px",
                transition: "border-color 0.15s, background 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                outline: "none",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{mode.icon}</span>
                <span style={{
                  color: isActive ? t.accentText : t.textStrong,
                  fontSize: 14,
                  fontWeight: 850,
                  lineHeight: 1.2,
                  flex: 1,
                }}>
                  {mode.title}
                </span>
                {isActive && (
                  <span style={{
                    flexShrink: 0,
                    background: t.accent,
                    color: "#fff",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                  }}>
                    {lang === "zh" ? "当前" : "Active"}
                  </span>
                )}
              </div>
              <p style={{
                margin: 0,
                color: isActive ? t.text : t.subtle,
                fontSize: 12,
                lineHeight: 1.6,
              }}>
                {mode.body}
              </p>
            </button>
          )
        })}
      </div>

      {/* ── Results Overview ─────────────────────────────────────────────── */}
      {performanceView === "overview" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <DataModeToggle value={dataMode} onChange={mode => { setDataMode(mode); setSelectedId(null) }} lang={lang} />
            <span style={{ color: t.faint, fontSize: 11 }}>
              {dataMode === "real-seed"
                ? (lang === "zh" ? `${realSeedRows.length} 条真实种子记录` : `${realSeedRows.length} real seed records — scores set to 0 for null fields`)
                : (lang === "zh" ? "演示数据" : "demo data")}
            </span>
          </div>

          {dataMode === "real-seed" && <RealSeedCallout lang={lang} />}
          {dataMode === "demo" && <DemoModeBanner lang={lang} />}
          {dataStatus === "loading" && (
            <Callout tone="info">{lang === "zh" ? "正在加载 Performance 数据…" : "Loading Performance data..."}</Callout>
          )}
          {dataStatus === "error" && (
            <Callout tone="warn">
              {lang === "zh"
                ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。"
                : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages."}
            </Callout>
          )}
          {dataStatus === "empty" && (
            <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
          )}

          <Callout tone="info">
            {lang === "zh"
              ? "Performance 模块用于提出吸附性能假设。它不替代实验等温线、GCMC 或严格混合气 IAST。"
              : "The Performance module is for adsorption-performance hypotheses. It does not replace experimental isotherms, GCMC, or rigorous mixture IAST."}
          </Callout>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "如需查看带气体比例、选择性条件、吸附量和等温线状态的记录，请进入 GasSep。"
                : "For condition-aware selectivity, gas ratio, uptake, and isotherm status, see GasSep."}
            </span>
            <button type="button" onClick={() => onNavigate?.("gassep")} style={{ ...toolbarBtn(t), padding: "7px 10px", fontSize: 11 }}>
              {lang === "zh" ? "打开 GasSep" : "Open GasSep"}
            </button>
          </div>

          <ResultLayer number="01" title={lang === "zh" ? "当前任务与运行" : "Current Task and Run"}>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 12, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, alignItems: "center" }}>
              <div>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`}</div>
                <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{gasLabel(gas?.label || inputs.gasSystem, lang)} · {inputs.temperature} K · {inputs.pressure} bar</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
                <button
                  type="button"
                  onClick={onPredict}
                  disabled={loading}
                  title={loading ? (lang === "zh" ? "性能筛选正在运行。" : "Performance screen is running.") : undefined}
                  style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", opacity: loading ? 0.72 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? (lang === "zh" ? "运行中..." : "Running...") : (lang === "zh" ? "运行性能筛选" : "Run performance screen")}
                </button>
                <button
                  type="button"
                  onClick={() => setPerformanceView("advanced")}
                  style={{ ...toolbarBtn(t), border: `1px solid ${t.accent}`, color: t.accentText }}
                >
                  {lang === "zh" ? "高级筛选工作台" : "Advanced Screening Workspace"}
                </button>
              </div>
            </div>
          </ResultLayer>

          <ResultLayer number="02" title={lang === "zh" ? "性能候选摘要" : "Performance Candidate Summary"}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
              {performanceCandidates.length === 0 && (
                <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
              )}
              {performanceCandidates.slice(0, 6).map(candidate => (
                <UnifiedCandidateCard
                  key={candidate.id}
                  name={candidate.name}
                  score={candidate.score}
                  scoreLabel={lang === "zh" ? "性能评分" : "Performance score"}
                  suitableTask={lang === "zh" ? "CO₂ 吸附量 / 选择性 / 热力学解释" : "CO₂ uptake / selectivity / thermodynamic interpretation"}
                  scoreBreakdown={candidate.scoreBreakdown}
                  keyReasons={[
                    `CO₂ uptake ${candidate.co2Uptake ?? "—"}`,
                    `${lang === "zh" ? "选择性" : "selectivity"} ${candidate.selectivity ?? "—"}`,
                    `${lang === "zh" ? "稳定性" : "stability"} ${candidate.waterStability ?? "—"} / ${candidate.thermalStability ?? "—"}`,
                  ]}
                  evidenceLevel={`${lang === "zh" ? "证据等级" : "Evidence Level"}: ${candidate.evidenceLevel || "rule-based"}`}
                  limitations={lang === "zh" ? "Performance Score 用于比较候选材料的吸附和热力学表现，不能替代严格 GCMC 或 IAST 模拟。" : "Performance Score supports comparison of adsorption and thermodynamic indicators. It does not replace rigorous GCMC or IAST simulations."}
                  recommendedNextStep={lang === "zh"
                    ? ["补充实测等温线", "验证混合气选择性", "进行 GCMC 或 IAST 对照"]
                    : ["Add measured isotherms", "Validate mixture selectivity", "Run GCMC or IAST comparison"]}
                  fieldSources={candidate.fieldSources}
                  dataStatus={candidate.dataMode || dataMode}
                  onDetails={() => setSelectedId(candidate.id)}
                />
              ))}
            </div>
          </ResultLayer>

          <ResultLayer number="03" title={lang === "zh" ? "结果解释说明" : "Results Interpretation Notes"}>
            <Callout tone="info">
              {lang === "zh"
                ? "Performance Score 用于比较候选材料的吸附和热力学表现，不能替代严格 GCMC 或 IAST 模拟。"
                : "Performance Score supports comparison of adsorption and thermodynamic indicators. It does not replace rigorous GCMC or IAST simulations."}
            </Callout>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              {[
                [lang === "zh" ? "分数含义" : "What the score means", interpretation.means],
                [lang === "zh" ? "排序原因" : "Why ranked high", interpretation.high],
                [lang === "zh" ? "数据支持" : "What data supports this", interpretation.data],
                [lang === "zh" ? "下一步验证" : "What to validate next", interpretation.next],
              ].map(([title, body]) => (
                <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
                  <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 7 }}>{body}</div>
                </div>
              ))}
            </div>
          </ResultLayer>

          <ResultLayer number="04" title={lang === "zh" ? "Model Results / 结果解释图表" : "Model Results / Results Interpretation"}>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
              <RankingBarChart data={chartData.ranking} scoreLabel={lang === "zh" ? "性能评分" : "Performance Score"} />
              <ScoreBreakdownRadar data={activeCandidate?.scoreBreakdown || []} title={activeCandidate ? `${activeCandidate.name} · ${lang === "zh" ? "评分拆解" : "Score Breakdown"}` : (lang === "zh" ? "评分拆解" : "Score Breakdown")} />
              <WeightContributionChart data={activeCandidate?.weightContribution || []} />
              <EvidenceDistributionChart data={chartData.evidence} />
              <ScoreDistributionChart data={chartData.scores} />
              <SensitivityAnalysisChart data={chartData.sensitivity} dimension="Stability" />
            </div>
          </ResultLayer>

          <ResultLayer number="05" title={lang === "zh" ? "Machine Learning Evaluation 占位" : "Machine Learning Evaluation Placeholder"}>
            <Callout tone="warn">
              {lang === "zh"
                ? "当前机器学习评估为占位展示。只有在积累足够带标签的实验或文献数据后，才会启用真实模型评估。"
                : "Machine learning evaluation is currently a placeholder. It will be activated when enough labeled experimental or literature data are available."}
            </Callout>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              {["Predicted vs Actual", "Residual Plot", "Descriptor Contribution", "R²: pending · MAE: pending · RMSE: pending · Cross-validation: pending"].map(item => (
                <div key={item} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                  <BasisBadge tone="proxy">Demo only / Placeholder</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 9 }}>{item}</div>
                  <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
                    {lang === "zh" ? "需要带标签的实验或文献数据。" : "Requires labeled experimental or literature data."}
                  </div>
                </div>
              ))}
            </div>
          </ResultLayer>
        </>
      )}

      {/* ── Advanced Screening Workspace ─────────────────────────────────── */}
      {performanceView === "advanced" && (
        <>
          <Callout tone="info">
            {lang === "zh"
              ? "高级筛选工作台用于基于描述符输入的自定义 MOF 早期筛选。输出仍属于早期筛选证据，不替代实验验证、GCMC 或严格 IAST 分析。"
              : "Advanced Screening restores the descriptor-level input workflow for custom MOF screening. Outputs remain early-stage screening evidence and do not replace experimental validation, GCMC, or rigorous IAST analysis."}
          </Callout>
          <ScreeningTab
            inputs={inputs}
            setInputs={setInputs}
            results={results}
            loading={loading}
            onPredict={onPredict}
            onSaveRun={onSaveRun}
            apiUrl={apiUrl}
            setApiUrl={setApiUrl}
            apiStatus={apiStatus}
            onCheckApi={onCheckApi}
            setActiveTab={onNavigate}
            onLoadBenchmark={onLoadBenchmark}
            onAddComparison={onAddComparison}
          />
        </>
      )}
    </div>
  )
}
