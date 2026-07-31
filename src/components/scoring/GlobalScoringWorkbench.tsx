// @ts-nocheck
import { useMemo, useState } from "react"
import { useLang, useT, useViewport } from "../../contexts"
import { createScoringModel } from "../../scoring"
import { Callout, ResultLayer } from "../ui"
import {
  CandidateRankingTable,
  DescriptorConflictMatrix,
  DescriptorSetDrawer,
  DescriptorWeightChart,
  MethodComparisonTable,
  ScoringDiagnosticsPanel,
  ScoringModelCard,
  WeightingMethodPanel,
} from "./ScoringEnginePanel"

const DEFAULT_SCORING_SETTINGS = {
  descriptorPreset: "coreMof8",
  descriptorKeys: null,
  algorithm: "hybrid",
  hybridAlpha: 0.65,
  missingValueStrategy: "penalize",
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const settingsKey = settings => JSON.stringify({
  descriptorPreset: settings.descriptorPreset,
  descriptorKeys: settings.descriptorKeys || null,
  algorithm: settings.algorithm,
  hybridAlpha: Number(settings.hybridAlpha ?? 0),
  missingValueStrategy: settings.missingValueStrategy,
})

function statusMessage(status, lang, candidateCount, dataMode) {
  if (status === "loading") return text(lang, "正在加载 MOF 描述符数据；评分工作台会在数据返回后更新。", "Loading MOF descriptor data; the workbench updates after the dataset returns.")
  if (status === "error") return text(lang, "MOF 描述符数据加载失败；工作台保留空模型和 fallback 诊断，不会白屏。", "MOF descriptor data failed to load; the workbench keeps an empty model with fallback diagnostics instead of blanking.")
  if (!candidateCount) return text(lang, "当前没有候选记录；仍可管理描述符集并查看评分模型元数据。", "No candidate records are available; descriptor management and model metadata remain visible.")
  const label = dataMode === "core-mof-2024-cr"
    ? text(lang, "CoRE 2024 CR 真实全局候选源", "CoRE 2024 CR real global candidate source")
    : text(lang, "字段级溯源数据", "field-level provenance data")
  return text(lang, `${label} · ${candidateCount} 条候选记录。`, `${label} · ${candidateCount} candidate records.`)
}

export function GlobalScoringWorkbench({
  candidates = [],
  dataMode = "core-mof-2024-cr",
  lang,
  t,
  isMobile,
  status = "loaded",
  number = "GS",
  title,
  subtitle,
  performancePriorityMode = "balanced",
}) {
  const contextTheme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const theme = t || contextTheme
  const language = lang || contextLang
  const mobile = isMobile ?? viewport.isMobile
  const isNarrow = mobile || viewport.isNarrow
  const candidateRows = useMemo(() => (Array.isArray(candidates) ? candidates.filter(Boolean) : []), [candidates])
  const [appliedScoring, setAppliedScoring] = useState(DEFAULT_SCORING_SETTINGS)
  const [draftScoring, setDraftScoring] = useState(DEFAULT_SCORING_SETTINGS)
  const [descriptorDrawerOpen, setDescriptorDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const scoringModel = useMemo(() => createScoringModel({
    candidates: candidateRows,
    preset: "generalMofScreening",
    descriptorPreset: appliedScoring.descriptorPreset,
    descriptorKeys: appliedScoring.descriptorKeys,
    algorithm: appliedScoring.algorithm,
    hybridAlpha: appliedScoring.hybridAlpha,
    missingValueStrategy: appliedScoring.missingValueStrategy,
    evidenceMode: "descriptor-evidence",
    performancePriorityMode,
  }), [candidateRows, appliedScoring, performancePriorityMode])

  const scoringChanged = settingsKey(appliedScoring) !== settingsKey(draftScoring)
  const applyScoring = () => setAppliedScoring({ ...draftScoring, descriptorKeys: draftScoring.descriptorKeys ? [...draftScoring.descriptorKeys] : null })
  const resetScoring = () => {
    setDraftScoring(DEFAULT_SCORING_SETTINGS)
    setAppliedScoring(DEFAULT_SCORING_SETTINGS)
    setSelectedId(null)
  }
  const warningText = statusMessage(status, language, candidateRows.length, dataMode)
  const plannedExcludedKeys = scoringModel.excludedPlannedKeys?.length ? scoringModel.excludedPlannedKeys : scoringModel.unavailablePlannedKeys
  const hasWarnings = status !== "loaded" || candidateRows.length === 0 || scoringModel.warnings?.length || plannedExcludedKeys?.length || scoringModel.rankings.length === 0

  return (
    <div id="global-scoring-workbench" style={{ display: "grid", gap: 12 }}>
      <DescriptorSetDrawer
        open={descriptorDrawerOpen}
        onClose={() => setDescriptorDrawerOpen(false)}
        draft={draftScoring}
        setDraft={setDraftScoring}
        candidates={candidateRows}
        t={theme}
        lang={language}
        isMobile={mobile}
      />

      <ResultLayer
        number={number}
        title={title || text(language, "General MOF Scoring Workbench", "General MOF Scoring Workbench")}
        subtitle={subtitle || text(
          language,
          "描述符集、权重方法、候选排序、解释与诊断使用同一套全局评分模型。",
          "Descriptor sets, weighting methods, ranking, explanations, and diagnostics use one unified scoring model."
        )}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Callout tone={hasWarnings ? "warn" : "info"}>{warningText}</Callout>
          {plannedExcludedKeys?.length > 0 && (
            <Callout tone="warn">
              {text(
                language,
                `planned descriptors 默认不参与评分：${plannedExcludedKeys.join(", ")}。`,
                `Planned descriptors are excluded by default: ${plannedExcludedKeys.join(", ")}.`
              )}
            </Callout>
          )}
          {scoringModel.rankings.length === 0 && (
            <Callout tone="warn">
              {text(language, "当前评分模型没有可排序候选；请检查数据集、描述符覆盖或缺失值策略。", "The current scoring model has no rankable candidates; check dataset, descriptor coverage, or missing-value strategy.")}
            </Callout>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.2fr) minmax(330px, 0.8fr)", gap: 12, alignItems: "start" }}>
            <ScoringModelCard
              model={scoringModel}
              settings={appliedScoring}
              onManageDescriptors={() => setDescriptorDrawerOpen(true)}
              onApply={applyScoring}
              changed={scoringChanged}
              t={theme}
              lang={language}
              isMobile={mobile}
            />
            <WeightingMethodPanel
              draft={draftScoring}
              setDraft={setDraftScoring}
              onApply={applyScoring}
              onReset={resetScoring}
              onManageDescriptors={() => setDescriptorDrawerOpen(true)}
              changed={scoringChanged}
              t={theme}
              lang={language}
              isMobile={mobile}
            />
          </div>

          <DescriptorWeightChart model={scoringModel} t={theme} lang={language} />
          <CandidateRankingTable
            model={scoringModel}
            selectedId={selectedId}
            onSelect={setSelectedId}
            t={theme}
            lang={language}
            isMobile={mobile}
          />
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
            <DescriptorConflictMatrix model={scoringModel} t={theme} lang={language} />
            <ScoringDiagnosticsPanel model={scoringModel} t={theme} lang={language} isMobile={mobile} />
          </div>
          <MethodComparisonTable model={scoringModel} t={theme} lang={language} isMobile={mobile} />
        </div>
      </ResultLayer>
    </div>
  )
}
