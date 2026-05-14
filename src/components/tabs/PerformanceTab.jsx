import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  gasLabel, getGasSystem, getMofCandidates, toolbarBtn,
  evidenceDistribution, scoreDistribution,
  createScoringModel, GlobalScoringWorkbench, DescriptorWeightChart, DescriptorConflictMatrix, ScoringDiagnosticsPanel,
  ScoringModelCard, WeightingMethodPanel, DescriptorSetDrawer, CandidateRankingTable, WhyThisResultButton,
  RankingBarChart, ScoreBreakdownRadar, EvidenceDistributionChart, ScoreDistributionChart,
  BasisBadge, ResultLayer, Callout, UnifiedCandidateCard, RealSeedCallout, DemoModeBanner, CopyLinkButton, DisclaimerLink,
} from "../../shared"
import {
  CompactDataModeBar,
  ModulePageHeader,
  PrimaryWorkbenchCard,
  ScopeNoticeBar,
  SecondaryTabs,
} from "../module/ModuleTop"
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

function rowValue(row, key, fallback = "—") {
  return row?.candidate?.[key] ?? row?.[key] ?? fallback
}

function rowScoreBreakdown(row) {
  return (row?.contributions || []).map(item => ({
    key: item.key,
    label: item.label,
    labelZh: item.labelZh,
    value: Number(item.normalizedValue || 0) * 10,
  }))
}

function rowKeyReasons(row, lang) {
  const drivers = (row?.topDrivers || []).slice(0, 3).map(item => {
    const label = (lang === "zh" ? item.labelZh : item.label) || item.key
    const raw = item.rawValue == null || item.rawValue === "" ? "—" : item.rawValue
    return `${label} ${raw}`
  })
  return drivers.length ? drivers : [
    `CO₂ uptake ${rowValue(row, "co2Uptake")}`,
    `${lang === "zh" ? "稳定性" : "stability"} ${rowValue(row, "waterStability")} / ${rowValue(row, "thermalStability")}`,
  ]
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
  const defaultScoringSettings = useMemo(() => ({
    descriptorPreset: "coreMof8",
    descriptorKeys: null,
    algorithm: "hybrid",
    hybridAlpha: 0.65,
    missingValueStrategy: "median",
  }), [])
  const [appliedScoring, setAppliedScoring] = useState(defaultScoringSettings)
  const [draftScoring, setDraftScoring] = useState(defaultScoringSettings)
  const [descriptorDrawerOpen, setDescriptorDrawerOpen] = useState(false)
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

  const performanceScoringModel = useMemo(() => createScoringModel({
    candidates: [...(currentCandidate ? [currentCandidate] : []), ...baseRows],
    preset: "generalMofScreening",
    descriptorPreset: appliedScoring.descriptorPreset,
    descriptorKeys: appliedScoring.descriptorKeys,
    algorithm: appliedScoring.algorithm,
    missingValueStrategy: appliedScoring.missingValueStrategy,
    hybridAlpha: appliedScoring.hybridAlpha,
    evidenceMode: "descriptor-evidence",
  }), [currentCandidate, baseRows, appliedScoring])

  const performanceCandidates = performanceScoringModel.rankings || []
  const scoringChanged = JSON.stringify(appliedScoring) !== JSON.stringify(draftScoring)
  const applyScoring = () => setAppliedScoring(draftScoring)
  const resetScoring = () => {
    setDraftScoring(defaultScoringSettings)
    setAppliedScoring(defaultScoringSettings)
  }
  const activeCandidate = useMemo(() => performanceCandidates.find(item => item.id === selectedId) || performanceCandidates[0] || null, [performanceCandidates, selectedId])
  const chartData = useMemo(() => ({
    ranking: performanceCandidates,
    evidence: evidenceDistribution(performanceCandidates),
    scores: scoreDistribution(performanceCandidates),
  }), [performanceCandidates])
  const interpretation = useMemo(() => {
    if (!hasResult) {
      return {
        means: lang === "zh" ? "性能优先级分数会把吸附量、选择性、热力学线索和适用域提示合成为早期候选优先级。" : "The Performance score combines uptake, selectivity, thermodynamic cues, and applicability notes into an early-stage candidate priority.",
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

  const contentTabs = useMemo(() => [
    { id: "overview", label: lang === "zh" ? "结果概览" : "Results overview" },
    { id: "explanation", label: lang === "zh" ? "评分解释" : "Scoring explanation" },
    { id: "assumptions", label: lang === "zh" ? "数据与假设" : "Data & assumptions" },
  ], [lang])
  const isContentTab = contentTabs.some(tab => tab.id === performanceView)
  const dataRecordCount = dataMode === "real-seed" ? realSeedRows.length : demoRows.length
  const dataModeStatus = dataStatus === "loading"
    ? (lang === "zh" ? "正在加载记录 · 缺失值由全局评分引擎处理" : "Loading records · missing values handled by the global scoring engine")
    : dataStatus === "error"
      ? (lang === "zh" ? "数据加载失败 · 保留评分诊断提示" : "Data load failed · scoring diagnostics remain visible")
      : (lang === "zh" ? `${dataRecordCount} 条记录 · ${appliedScoring.missingValueStrategy} 缺失值策略` : `${dataRecordCount} records · ${appliedScoring.missingValueStrategy} missing-value strategy`)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModulePageHeader
        title={lang === "zh" ? "性能优先级" : "Performance"}
        subtitle={lang === "zh"
          ? "基于当前可用描述符，对 MOF 候选材料进行早期性能排序与解释。"
          : "Rank and interpret MOF candidates for early-stage performance using currently available descriptors."}
        action={<CopyLinkButton hash="performance" ariaLabel={lang === "zh" ? "复制性能优先级链接" : "Copy Performance link"} />}
      />

      <PrimaryWorkbenchCard
        title={lang === "zh" ? "高级筛选工作台" : "Advanced Screening Workspace"}
        description={lang === "zh"
          ? "上传 CIF 信息、设置吸附条件、调整权重，并运行早期筛选。"
          : "Upload CIF information, configure adsorption conditions, adjust weights, and run early-stage screening."}
        capabilities={lang === "zh"
          ? "CO₂ 吸附 · 选择性 · 热力学解释 · 早期筛选"
          : "CO₂ uptake · selectivity · thermal interpretation · early-stage screening"}
        primaryLabel={lang === "zh" ? "进入筛选台 →" : "Open workbench →"}
        onPrimary={() => setPerformanceView("advanced")}
      />

      <SecondaryTabs
        items={contentTabs}
        active={isContentTab ? performanceView : ""}
        onChange={setPerformanceView}
        ariaLabel={lang === "zh" ? "性能优先级内容导航" : "Performance content navigation"}
      />

      <CompactDataModeBar
        value={dataMode}
        onChange={mode => { setDataMode(mode); setSelectedId(null) }}
        lang={lang}
        statusText={dataModeStatus}
        infoLabel={lang === "zh" ? "数据说明 ⓘ" : "Data notes ⓘ"}
        onInfo={() => setPerformanceView("assumptions")}
      />

      <ScopeNoticeBar
        label={lang === "zh" ? "提示" : "Notice"}
        actionLabel={lang === "zh" ? "打开气体分离 →" : "Open GasSep →"}
        onAction={() => onNavigate?.("gassep")}
      >
        {lang === "zh"
          ? "性能优先级为早期筛选参考，不替代实验等温线、GCMC 或 IAST；如需查看气体比例、选择性条件与吸量记录，请进入气体分离模块。"
          : "Performance priority is an early-screening reference, not a replacement for experimental isotherms, GCMC, or IAST; use GasSep for gas ratio, selectivity conditions, and uptake records."}
      </ScopeNoticeBar>

      <DescriptorSetDrawer
        open={descriptorDrawerOpen}
        onClose={() => setDescriptorDrawerOpen(false)}
        draft={draftScoring}
        setDraft={setDraftScoring}
        candidates={[...(currentCandidate ? [currentCandidate] : []), ...baseRows]}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />

      {performanceView !== "advanced" && (
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.2fr) minmax(330px, 0.8fr)", gap: 12, alignItems: "start" }}>
          <ScoringModelCard
            model={performanceScoringModel}
            settings={draftScoring}
            onManageDescriptors={() => setDescriptorDrawerOpen(true)}
            onApply={applyScoring}
            changed={scoringChanged}
            t={t}
            lang={lang}
            isMobile={isMobile}
          />
          <WeightingMethodPanel
            draft={draftScoring}
            setDraft={setDraftScoring}
            onApply={applyScoring}
            onReset={resetScoring}
            onManageDescriptors={() => setDescriptorDrawerOpen(true)}
            changed={scoringChanged}
            t={t}
            lang={lang}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* ── Results Overview ─────────────────────────────────────────────── */}
      {performanceView === "overview" && (
        <>
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
                  scoreBreakdown={rowScoreBreakdown(candidate)}
                  keyReasons={rowKeyReasons(candidate, lang)}
                  evidenceLevel={`${lang === "zh" ? "证据等级" : "Evidence Level"}: ${candidate.evidenceLevel === "rule-based" ? (lang === "zh" ? "规则辅助" : "rule-assisted") : (candidate.evidenceLevel || (lang === "zh" ? "规则辅助" : "rule-assisted"))}`}
                  limitations={lang === "zh" ? "性能评分用于比较候选材料的吸附和热力学表现，不能替代严格 GCMC 或 IAST 模拟。" : "Performance Score supports comparison of adsorption and thermodynamic indicators. It does not replace rigorous GCMC or IAST simulations."}
                  recommendedNextStep={lang === "zh"
                    ? ["补充实测等温线", "验证混合气选择性", "进行 GCMC 或 IAST 对照"]
                    : ["Add measured isotherms", "Validate mixture selectivity", "Run GCMC or IAST comparison"]}
                  fieldSources={candidate.candidate?.fieldSources}
                  dataStatus={candidate.candidate?.dataMode || dataMode}
                  onDetails={() => setSelectedId(candidate.id)}
                  descriptorTotal={performanceScoringModel.descriptors?.length || 0}
                  extraAction={<WhyThisResultButton model={performanceScoringModel} candidateId={candidate.id} candidate={candidate} t={t} lang={lang} isMobile={isMobile} compact />}
                />
              ))}
            </div>
          </ResultLayer>
        </>
      )}

      {performanceView === "explanation" && (
        <>
          <ResultLayer number="02" title={lang === "zh" ? "当前全局评分摘要" : "Current Global Scoring Summary"}>
            <div style={{ display: "grid", gap: 12 }}>
              <Callout tone="info">
                {lang === "zh"
                  ? "此处复用全局 scoring engine 和当前描述符集，展示权重快照、候选解释和限制提示；Performance 页面不作为完整算法操作台。"
                  : "This view reuses the global scoring engine and current descriptor set for a weight snapshot, candidate explanations, and limitations; Performance is not the full algorithm console."}
              </Callout>
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                {performanceScoringModel.rankings.slice(0, 3).map(row => (
                  <div key={row.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{row.rank}. {row.name}</div>
                    <div style={{ color: t.accentText, fontSize: 18, fontWeight: 920, marginTop: 5 }}>{row.score.toFixed(1)}</div>
                    <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
                      {lang === "zh" ? "主要贡献" : "Main driver"}: {lang === "zh" ? row.mainDriver?.labelZh : row.mainDriver?.label}<br />
                      {lang === "zh" ? "完整度" : "Completeness"}: {Math.round(row.descriptorCompleteness * 100)}%
                    </div>
                    <WhyThisResultButton model={performanceScoringModel} candidateId={row.id} candidate={row} t={t} lang={lang} isMobile={isMobile} compact />
                  </div>
                ))}
              </div>
              <CandidateRankingTable
                model={performanceScoringModel}
                selectedId={selectedId}
                onSelect={setSelectedId}
                t={t}
                lang={lang}
                isMobile={isMobile}
              />
              <DescriptorWeightChart model={performanceScoringModel} t={t} lang={lang} />
              <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
                <DescriptorConflictMatrix model={performanceScoringModel} t={t} lang={lang} />
                <ScoringDiagnosticsPanel model={performanceScoringModel} t={t} lang={lang} isMobile={isMobile} />
              </div>
            </div>
          </ResultLayer>

          <ResultLayer number="03" title={lang === "zh" ? "结果解释说明" : "Results Interpretation Notes"}>
            <Callout tone="info">
              {lang === "zh"
                ? "性能评分用于比较候选材料的吸附和热力学表现，不能替代严格 GCMC 或 IAST 模拟。"
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

          <ResultLayer number="04" title={lang === "zh" ? "模型结果解释图表" : "Model Results / Results Interpretation"}>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
              <RankingBarChart data={chartData.ranking} scoreLabel={lang === "zh" ? "性能评分" : "Performance Score"} />
              <ScoreBreakdownRadar data={rowScoreBreakdown(activeCandidate)} title={activeCandidate ? `${activeCandidate.name} · ${lang === "zh" ? "评分拆解" : "Score Breakdown"}` : (lang === "zh" ? "评分拆解" : "Score Breakdown")} />
              <EvidenceDistributionChart data={chartData.evidence} />
              <ScoreDistributionChart data={chartData.scores} />
              <ScoringDiagnosticsPanel model={performanceScoringModel} t={t} lang={lang} isMobile={isMobile} />
            </div>
          </ResultLayer>

          <ResultLayer number="05" title={lang === "zh" ? "机器学习评估占位" : "Machine Learning Evaluation Placeholder"}>
            <Callout tone="note">
              {lang === "zh"
                ? "当前机器学习评估为占位展示。只有在积累足够带标签的实验或文献数据后，才会启用真实模型评估。"
                : "Machine learning evaluation is currently a placeholder. It will be activated when enough labeled experimental or literature data are available."}
            </Callout>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              {(lang === "zh"
                ? ["预测值 vs 实际值", "残差图", "描述符贡献", "R²：待补充 · MAE：待补充 · RMSE：待补充 · 交叉验证：待补充"]
                : ["Predicted vs Actual", "Residual Plot", "Descriptor Contribution", "R²: pending · MAE: pending · RMSE: pending · Cross-validation: pending"]
              ).map(item => (
                <div key={item} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                  <BasisBadge tone="proxy">{lang === "zh" ? "演示占位 / Demo placeholder" : "Demo only / Placeholder"}</BasisBadge>
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

      {performanceView === "assumptions" && (
        <>
          <ResultLayer
            number="01"
            title={lang === "zh" ? "数据模式与假设边界" : "Data Mode and Assumption Boundary"}
            subtitle={lang === "zh"
              ? "集中查看当前数据集状态、演示/真实种子数据边界，以及缺失值处理假设。"
              : "Review dataset status, demo/real-seed boundaries, and the missing-value handling assumption."}
          >
            <div style={{ display: "grid", gap: 10 }}>
              {dataMode === "real-seed" && <RealSeedCallout lang={lang} />}
              {dataMode === "demo" && <DemoModeBanner lang={lang} />}
              {dataStatus === "loading" && (
                <Callout tone="info">{lang === "zh" ? "正在加载性能优先级数据…" : "Loading Performance data..."}</Callout>
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
                  ? "基于当前可用描述符和整理状态生成优先级参考。更多边界请"
                  : "Rule-assisted priority only. For additional boundaries, "}{" "}
                <DisclaimerLink label={lang === "zh" ? "查看方法说明" : "see methodology notes"} />
              </Callout>
            </div>
          </ResultLayer>

          <ResultLayer
            number="02"
            title={lang === "zh" ? "方法限制与验证路径" : "Method Limits and Validation Path"}
            subtitle={lang === "zh"
              ? "性能优先级只负责早期排序和解释，严格性能判断需要后续实验或模拟验证。"
              : "Performance priority supports early ranking and explanation; rigorous performance claims require later experiments or simulation."}
          >
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {[
                [
                  lang === "zh" ? "不替代 GCMC / IAST" : "Not GCMC / IAST",
                  lang === "zh"
                    ? "当前排序用于提出候选优先级，不输出严格混合气分离结论。"
                    : "Current ranking proposes candidate priority and does not output rigorous mixture-separation conclusions.",
                ],
                [
                  lang === "zh" ? "缺失值由评分引擎处理" : "Missing values handled by scoring engine",
                  lang === "zh"
                    ? "缺失描述符会通过当前策略进入权重、完整度和 warning，应被视为数据质量提示。"
                    : "Missing descriptors flow through the current strategy into weights, completeness, and warnings, and should be treated as data-quality signals.",
                ],
                [
                  lang === "zh" ? "气体分离记录另行查看" : "Gas separation records live separately",
                  lang === "zh"
                    ? "气体比例、选择性条件、吸附量和等温线状态保留在气体分离模块。"
                    : "Gas ratio, selectivity conditions, uptake, and isotherm status remain in the GasSep module.",
                ],
              ].map(([title, body]) => (
                <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
                  <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.6, marginTop: 7 }}>{body}</div>
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
              ? "高级筛选工作台现在使用全局评分引擎：描述符集、Manual / Equal / CRITIC / Hybrid 权重、候选排序和解释诊断保持同一条评分链路。"
              : "Advanced Screening now uses the global scoring engine: descriptor sets, Manual / Equal / CRITIC / Hybrid weighting, ranking, and explanation diagnostics stay on one scoring path."}
          </Callout>
          <GlobalScoringWorkbench
            candidates={[...(currentCandidate ? [currentCandidate] : []), ...baseRows]}
            dataMode={dataMode}
            lang={lang}
            t={t}
            isMobile={isMobile}
            status={dataStatus}
            number="01"
            title={lang === "zh" ? "Global Scoring Workbench / 全局评分工作台" : "Global Scoring Workbench"}
            subtitle={lang === "zh"
              ? "主流程接入 createScoringModel，默认 planned descriptors 不参与评分；设置变更后需点击 Apply scoring 才更新。"
              : "Main workflow is powered by createScoringModel. Planned descriptors are excluded by default; settings update only after Apply scoring."}
          />
          <details style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 13, fontWeight: 900 }}>
              {lang === "zh" ? "Legacy predictor / 结构输入预测" : "Legacy predictor / structure-input prediction"}
            </summary>
            <div style={{ marginTop: 12 }}>
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
            </div>
          </details>
        </>
      )}
    </div>
  )
}
