// @ts-nocheck
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, CopyLinkButton, fetchDataJson } from "../../../shared"
import { ModulePageHeader } from "../../module/ModuleTop"
import { buildCandidateDecisionTrace, buildCuratedRealScreeningResult, runOrganicAcidFinalScreening } from "../../../utils/organicAcidFinalScreening"
import { DatabaseIndexSkeleton } from "../../database-index/DatabaseIndexSkeleton"
import { AlgorithmPipelineStepper } from "./AlgorithmPipelineStepper"
import { AlgorithmRunLauncher } from "./run-launcher/AlgorithmRunLauncher"
import { AlgorithmTraceWorkbench } from "./trace-workbench/AlgorithmTraceWorkbench"
import { AlMofFrameworkRanking } from "./AlMofFrameworkRanking"
import { BlindBaselinePanel } from "./BlindBaselinePanel"
import { CompetitiveMetalComparison } from "./CompetitiveMetalComparison"
import { CandidateDecisionDrawer } from "./CandidateDecisionDrawer"
import { CoupledDescriptorHotSpotMap } from "./CoupledDescriptorHotSpotMap"
import { DataStatusAndProvenancePanel } from "./DataStatusAndProvenancePanel"
import { DemoScoreDisclaimer } from "./DemoScoreDisclaimer"
import { DopantMetalRecommendationMatrix } from "./DopantMetalRecommendationMatrix"
import { ExafsPredictionPanel } from "./ExafsPredictionPanel"
import { ExperimentalValidationRoadmap } from "./ExperimentalValidationRoadmap"
import { LimitationsAndReproducibility } from "./LimitationsAndReproducibility"
import { EvidenceLayerLink, MethodologyLink, MiniMetric, text } from "./FinalScreeningShared"
import { MechanismPathRadar } from "./MechanismPathRadar"
import { MetalSensitivityDistribution } from "./MetalSensitivityDistribution"
import { OrganicAcidFinalDecisionBoard } from "./OrganicAcidFinalDecisionBoard"
import { ReactionConstraintBuilder } from "./ReactionConstraintBuilder"
import { ScreeningFunnelChart } from "./ScreeningFunnelChart"
import { SensitivityAndBaselinePanel } from "./SensitivityAndBaselinePanel"
import { SensitivityRankDistribution } from "./SensitivityRankDistribution"
import { StageSummaryCards } from "./StageSummaryCards"
import { StatusBadgeLegend } from "./StatusBadgeLegend"
import { WhyMoWaterfall } from "./WhyMoWaterfall"
import { WhyMoVsWComparison } from "./WhyMoVsWComparison"
import { OrganicAcidResearchValidationCenter } from "../researchValidation/OrganicAcidResearchValidationCenter"

const DatabaseIndexWorkbench = lazy(() =>
  import("../../database-index/DatabaseIndexWorkbench").then(module => ({ default: module.DatabaseIndexWorkbench })),
)

function LoadingPanel({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
      {text(lang, "正在加载 Organic Acid Final Screening 数据...", "Loading Organic Acid Final Screening data...")}
    </section>
  )
}

function ErrorPanel({ lang, t }) {
  return (
    <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.warn, fontSize: 13, lineHeight: 1.55, padding: 16 }}>
      {text(lang, "Organic Acid Final Screening 数据暂时无法加载。", "Organic Acid Final Screening data could not be loaded.")}
    </section>
  )
}

export function OrganicAcidFinalScreening({ lang, t, isMobile, onBack }) {
  const [frameworks, setFrameworks] = useState([])
  const [metals, setMetals] = useState([])
  const [evidenceRecords, setEvidenceRecords] = useState([])
  const [curatedRealExamples, setCuratedRealExamples] = useState(null)
  const [rules, setRules] = useState(null)
  const [status, setStatus] = useState("loading")
  const [decisionCandidate, setDecisionCandidate] = useState(null)
  const [latestTrace, setLatestTrace] = useState(null)
  const [databaseIndexOverview, setDatabaseIndexOverview] = useState(null)
  const [experimentalLabels, setExperimentalLabels] = useState(null)
  const [benchmarkDataset, setBenchmarkDataset] = useState(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_evidence_records.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_al_mof_framework_examples.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_qmof_descriptor_examples.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_literature_evidence_records.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_data_mapping_report.json", {}, { throwOnError: true }),
      fetchDataJson("experimental_labels/experimental_labels_v2.json", null, { throwOnError: false }),
      fetchDataJson("benchmark_dataset_v3_6.json", null, { throwOnError: false }),
    ])
      .then(([frameworkRows, metalRows, ruleConfig, evidenceRows, curatedFrameworkRows, curatedQmofRows, curatedEvidenceRows, curatedReport, labelRows, benchmarkRows]) => {
        if (!active) return
        setFrameworks(Array.isArray(frameworkRows) ? frameworkRows : [])
        setMetals(Array.isArray(metalRows) ? metalRows : [])
        setRules(ruleConfig || {})
        setEvidenceRecords(Array.isArray(evidenceRows) ? evidenceRows : [])
        setCuratedRealExamples({
          frameworks: Array.isArray(curatedFrameworkRows) ? curatedFrameworkRows : [],
          qmofDescriptors: Array.isArray(curatedQmofRows) ? curatedQmofRows : [],
          evidenceRecords: Array.isArray(curatedEvidenceRows) ? curatedEvidenceRows : [],
          mappingReport: curatedReport || {},
        })
        setExperimentalLabels(labelRows || null)
        setBenchmarkDataset(benchmarkRows || null)
        setStatus("loaded")
      })
      .catch(error => {
        if (!active) return
        console.warn("Organic Acid Final Screening data could not be loaded.", error)
        setFrameworks([])
        setMetals([])
        setEvidenceRecords([])
        setCuratedRealExamples(null)
        setExperimentalLabels(null)
        setBenchmarkDataset(null)
        setRules({})
        setStatus("error")
      })
    return () => { active = false }
  }, [])

  const result = useMemo(() => {
    if (status !== "loaded") return null
    return runOrganicAcidFinalScreening(frameworks, metals, rules || {}, evidenceRecords)
  }, [frameworks, metals, evidenceRecords, rules, status])
  const curatedRealResult = useMemo(() => {
    if (status !== "loaded" || !curatedRealExamples) return null
    return buildCuratedRealScreeningResult(curatedRealExamples, metals, rules || {})
  }, [curatedRealExamples, metals, rules, status])
  const decisionTrace = useMemo(() => (
    decisionCandidate ? buildCandidateDecisionTrace(decisionCandidate) : null
  ), [decisionCandidate])

  const openSelectedScaffold = () => {
    if (result?.selectedFramework) setDecisionCandidate(result.selectedFramework)
  }
  const jumpToMoW = () => {
    const node = document.getElementById("organic-acid-final-mo-vs-w")
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "0 auto", maxWidth: 1280, minWidth: 0, padding: isMobile ? "0 2px" : 0 }}>
      <ModulePageHeader
        title={text(lang, "Organic Acid Final Screening", "Organic Acid Final Screening")}
        subtitle={text(
          lang,
          "Al-MOF 稳定骨架筛选 + 第二金属推荐；Mo 作为缺陷锚定 / 孔道限域活性位点假设输出，而不是直接检索条件。",
          "Al-MOF stable scaffold mining plus second-metal recommendation; Mo appears as a defect-anchored / pore-confined active-site hypothesis, not a direct retrieval condition."
        )}
        action={
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
            <BasisBadge tone="proxy">demo / seed / literature-derived</BasisBadge>
            <MethodologyLink lang={lang} t={t} />
            <EvidenceLayerLink lang={lang} t={t} />
            <CopyLinkButton hash="catalysis-organic-acid-final-screening" ariaLabel={text(lang, "复制最终筛选链接", "Copy final screening link")} />
            <button
              type="button"
              onClick={onBack}
              style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 11px" }}
            >
              {text(lang, "返回 Catalysis Lab", "Back to Catalysis Lab")}
            </button>
          </div>
        }
      />

      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 5, fontSize: 12.5, lineHeight: 1.55, padding: "11px 13px" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>
          {text(lang, "数据状态：演示级闭环，不是已验证催化剂预测", "Data status: demonstration loop, not validated catalyst prediction")}
        </strong>
        <ChemicalText value={text(
          lang,
          "页面展示反应约束 -> Al-MOF 骨架筛选 -> 第二金属推荐 -> Why Mo -> 稳健性 -> 盲测基线 -> EXAFS 可证伪预测 -> 实验验证路线。完整方法论与证据层已同步到 Methods & Evidence。",
          "The page shows reaction constraints -> Al-MOF framework mining -> dopant recommendation -> Why Mo -> robustness -> blind baselines -> EXAFS falsification -> experimental validation roadmap. Methodology and evidence layer updated in Methods & Evidence."
        )} />
      </section>

      {status === "loading" ? <LoadingPanel lang={lang} t={t} /> : null}
      {status === "error" ? <ErrorPanel lang={lang} t={t} /> : null}

      {result ? (
        <>
          <DemoScoreDisclaimer rules={rules} lang={lang} t={t} />
          <div data-cat-zone="run-launcher">
            <AlgorithmRunLauncher frameworks={frameworks} metals={metals} rules={rules} evidenceRecords={evidenceRecords} result={result} curatedRealExamples={curatedRealExamples} curatedRealResult={curatedRealResult} databaseIndexOverview={databaseIndexOverview} onDatabaseIndexOverviewReady={setDatabaseIndexOverview} onTraceReady={setLatestTrace} lang={lang} t={t} isMobile={isMobile} />
          </div>
          <Suspense fallback={<DatabaseIndexSkeleton lang={lang} t={t} />}>
            <DatabaseIndexWorkbench lang={lang} t={t} isMobile={isMobile} onOverviewLoaded={setDatabaseIndexOverview} />
          </Suspense>
          <OrganicAcidResearchValidationCenter result={result} evidenceRecords={evidenceRecords} experimentalLabels={experimentalLabels} benchmarkDataset={benchmarkDataset} lang={lang} t={t} isMobile={isMobile} />
          <OrganicAcidFinalDecisionBoard result={result} lang={lang} t={t} isMobile={isMobile} onInspectCandidate={setDecisionCandidate} />
          <AlgorithmTraceWorkbench trace={latestTrace} lang={lang} t={t} isMobile={isMobile} />
          <AlgorithmPipelineStepper steps={result.algorithmJourneySteps} lang={lang} t={t} isMobile={isMobile} />
          <StatusBadgeLegend lang={lang} t={t} isMobile={isMobile} />

          <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(170px, 1fr))" }}>
            <MiniMetric label={text(lang, "Al-MOF candidates", "Al-MOF candidates")} value={frameworks.length} t={t} />
            <MiniMetric label={text(lang, "Metal pool", "Metal pool")} value={metals.length} t={t} />
            <MiniMetric label={text(lang, "Selected scaffold", "Selected scaffold")} value={result.selectedFramework?.displayName} t={t} />
            <MiniMetric label={result.moRobustnessAudit?.label || "Mo Top 3"} value={`${Math.round((result.sensitivity?.targetMetal?.top3Probability || 0) * 100)}%`} t={t} tone={result.moRobustnessAudit?.status === "audit_required" ? "warn" : "info"} />
            <MiniMetric label={text(lang, "Evidence records", "Evidence records")} value={result.evidenceCoverage?.totalRecords || evidenceRecords.length} t={t} tone="warn" />
          </div>

          <ScreeningFunnelChart data={result.screeningFunnelData} lang={lang} t={t} isMobile={isMobile} onOpenSelectedScaffold={openSelectedScaffold} onJumpToMoW={jumpToMoW} />
          <StageSummaryCards summary={result.stageSummary} trace={result.algorithmTrace} lang={lang} t={t} isMobile={isMobile} onOpenSelectedScaffold={openSelectedScaffold} />
          <div data-cat-zone="hot-spot-map">
            <CoupledDescriptorHotSpotMap result={result} curatedRealResult={curatedRealResult} lang={lang} t={t} isMobile={isMobile} />
          </div>
          <div data-cat-zone="hydrothermal-gate">
            <ReactionConstraintBuilder rules={rules} summary={result.hardGateSummary} lang={lang} t={t} isMobile={isMobile} />
          </div>
          <div data-cat-zone="oacs-ranking">
            <AlMofFrameworkRanking frameworks={result.rankedFrameworks} selectedFramework={result.selectedFramework} lang={lang} t={t} isMobile={isMobile} onInspectCandidate={setDecisionCandidate} />
          </div>
          <div data-cat-zone="dmrs-recommendation">
            <DopantMetalRecommendationMatrix metals={result.rankedMetals} moRecommendation={result.moRecommendation} selectedFramework={result.selectedFramework} algorithmTrace={result.algorithmTrace} lang={lang} t={t} />
          </div>
          <MechanismPathRadar data={result.mechanismRadarData} lang={lang} t={t} isMobile={isMobile} />
          <WhyMoWaterfall moRecommendation={result.moRecommendation} audit={result.moRobustnessAudit} comparisons={result.competitiveMetalComparison} onCompareMoW={jumpToMoW} lang={lang} t={t} isMobile={isMobile} />
          <WhyMoVsWComparison comparisons={result.competitiveMetalComparison} metals={result.rankedMetals} trace={result.algorithmTrace} lang={lang} t={t} isMobile={isMobile} />
          <div id="organic-acid-final-robustness-audit" style={{ display: "grid", gap: 16, scrollMarginTop: 118 }}>
            <SensitivityAndBaselinePanel sensitivity={result.sensitivity} moRecommendation={result.moRecommendation} audit={result.moRobustnessAudit} rules={rules} lang={lang} t={t} isMobile={isMobile} />
            <SensitivityRankDistribution bars={result.sensitivityRankBars} audit={result.moRobustnessAudit} lang={lang} t={t} />
            <MetalSensitivityDistribution distribution={result.fullMetalSensitivityDistribution} sensitivity={result.sensitivity} audit={result.moRobustnessAudit} lang={lang} t={t} isMobile={isMobile} />
            <BlindBaselinePanel baselines={result.blindBaselineSummary} lang={lang} t={t} isMobile={isMobile} />
          </div>
          <div data-cat-zone="exafs">
            <ExafsPredictionPanel signature={result.exafsSignature} trace={result.algorithmTrace} lang={lang} t={t} isMobile={isMobile} />
          </div>
          <ExperimentalValidationRoadmap rules={rules} lang={lang} t={t} isMobile={isMobile} />
          <DataStatusAndProvenancePanel coverage={result.provenanceCoverage} curatedRealResult={curatedRealResult} lang={lang} t={t} isMobile={isMobile} />
          <CompetitiveMetalComparison comparisons={result.competitiveMetalComparison} lang={lang} t={t} isMobile={isMobile} />
          <LimitationsAndReproducibility statement={result.reproducibilityStatement} audit={result.moRobustnessAudit} coverage={result.provenanceCoverage} lang={lang} t={t} />
          <CandidateDecisionDrawer candidateTrace={decisionTrace} open={Boolean(decisionCandidate)} onClose={() => setDecisionCandidate(null)} lang={lang} t={t} />
        </>
      ) : null}
    </div>
  )
}
