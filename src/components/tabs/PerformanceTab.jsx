import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  gasLabel, getGasSystem, fetchDataJson, toolbarBtn,
  buildScoredCandidates, DEFAULT_SCORING_WEIGHTS, evidenceDistribution, scoreDistribution, sensitivityRows,
  RankingBarChart, ScoreBreakdownRadar, WeightContributionChart, EvidenceDistributionChart, ScoreDistributionChart, SensitivityAnalysisChart,
  BasisBadge, PageHeader, ResultLayer, Callout, UnifiedCandidateCard,
} from "../../shared"

export function PerformanceTab({ inputs, setInputs, results, loading, onPredict, onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [demoRows, setDemoRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const gas = getGasSystem(inputs.gasSystem)
  const hasResult = results && !results.unavailable

  useEffect(() => {
    let active = true
    fetchDataJson("mof_candidates_demo.json")
      .then(rows => { if (active && Array.isArray(rows)) setDemoRows(rows) })
      .catch(() => { if (active) setDemoRows([]) })
    return () => { active = false }
  }, [])

  const currentCandidate = hasResult ? {
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
  } : null

  const performanceCandidates = useMemo(() => {
    return buildScoredCandidates([...(currentCandidate ? [currentCandidate] : []), ...demoRows], "performance", DEFAULT_SCORING_WEIGHTS.performance)
  }, [currentCandidate, demoRows])

  const activeCandidate = performanceCandidates.find(item => item.id === selectedId) || performanceCandidates[0]
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Performance"
        subtitle={lang === "zh"
          ? "围绕 CO₂ uptake、选择性和热力学解释的早期性能候选筛选。保留现有吸附/筛选能力，但把结果解释成候选优先级。"
          : "Early-stage performance screening around CO₂ uptake, selectivity, and thermodynamic interpretation. Existing adsorption screening remains, but outputs are framed as candidate priority."}
        meta={lang === "zh" ? "CO₂ uptake · selectivity · thermodynamic interpretation · Early-stage Screening" : "CO₂ uptake · selectivity · thermodynamic interpretation · Early-stage Screening"}
        action={<BasisBadge tone="info">{lang === "zh" ? "不替代 GCMC / IAST" : "not GCMC / IAST"}</BasisBadge>}
      />

      <Callout tone="info">
        {lang === "zh"
          ? "Performance 模块用于提出吸附性能假设。它不替代实验等温线、GCMC 或严格混合气 IAST。"
          : "The Performance module is for adsorption-performance hypotheses. It does not replace experimental isotherms, GCMC, or rigorous mixture IAST."}
      </Callout>

      <ResultLayer number="01" title={lang === "zh" ? "当前任务与运行" : "Current Task and Run"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 12, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, alignItems: "center" }}>
          <div>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`}</div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{gasLabel(gas?.label || inputs.gasSystem, lang)} · {inputs.temperature} K · {inputs.pressure} bar</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
            <button type="button" onClick={onPredict} disabled={loading} style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff" }}>
              {loading ? (lang === "zh" ? "运行中..." : "Running...") : (lang === "zh" ? "运行性能筛选" : "Run performance screen")}
            </button>
            <button type="button" onClick={() => onNavigate?.("screening")} style={toolbarBtn(t)}>
              {lang === "zh" ? "高级输入" : "Advanced inputs"}
            </button>
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "性能候选摘要" : "Performance Candidate Summary"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
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
              evidenceLevel={`Evidence Level: ${candidate.evidenceLevel || "rule-based"}`}
              limitations={lang === "zh" ? "Performance Score 用于比较候选材料的吸附和热力学表现，不能替代严格 GCMC 或 IAST 模拟。" : "Performance Score supports comparison of adsorption and thermodynamic indicators. It does not replace rigorous GCMC or IAST simulations."}
              recommendedNextStep={lang === "zh"
                ? ["补充实测等温线", "验证混合气选择性", "进行 GCMC 或 IAST 对照"]
                : ["Add measured isotherms", "Validate mixture selectivity", "Run GCMC or IAST comparison"]}
              onDetails={() => setSelectedId(candidate.id)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title="Results Interpretation Notes">
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
          <RankingBarChart data={performanceCandidates} scoreLabel={lang === "zh" ? "Performance Score" : "Performance Score"} />
          <ScoreBreakdownRadar data={activeCandidate?.scoreBreakdown || []} title={activeCandidate ? `${activeCandidate.name} · Score Breakdown` : "Score Breakdown"} />
          <WeightContributionChart data={activeCandidate?.weightContribution || []} />
          <EvidenceDistributionChart data={evidenceDistribution(performanceCandidates)} />
          <ScoreDistributionChart data={scoreDistribution(performanceCandidates)} />
          <SensitivityAnalysisChart data={sensitivityRows(performanceCandidates, "performance", DEFAULT_SCORING_WEIGHTS.performance, null, "stability")} dimension="Stability" />
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
    </div>
  )
}
