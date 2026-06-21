// @ts-nocheck
import { render } from "@testing-library/react"
import { THEME_DARK, THEME_LIGHT } from "../../constants/theme"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import firstBenchmarkReport from "../../../public/data/first_real_benchmark_report_v1.json"
import credibilityReport from "../../../public/data/model_credibility_report_v1.json"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"
import { runDataAudit } from "../../utils/dataAudit/index"
import { AlgorithmValidationCenter } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"
import { InteractiveScientificFigure } from "../../components/methodology/algorithm-validation/InteractiveScientificFigure"

export { summary as previewSummary, THEME_DARK, THEME_LIGHT }

export function buildOrganicAcidResult() {
  return { organicAcidAlgorithm: rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" }) }
}

export function buildDataAudit() {
  return runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 })
}

export function renderCenter({ lang = "en", t = THEME_LIGHT, isMobile = false } = {}) {
  return render(
    <AlgorithmValidationCenter
      summary={summary}
      organicAcidResult={buildOrganicAcidResult()}
      dataAudit={buildDataAudit()}
      firstBenchmark={firstBenchmarkReport}
      credibility={credibilityReport}
      lang={lang}
      t={t}
      isMobile={isMobile}
    />,
  )
}

export function renderFigure({ lang = "en", t = THEME_LIGHT, isMobile = false, onJumpToSection } = {}) {
  const algorithm = buildOrganicAcidResult().organicAcidAlgorithm
  return render(
    <InteractiveScientificFigure
      summary={summary}
      algorithm={algorithm}
      lang={lang}
      t={t}
      isMobile={isMobile}
      onJumpToSection={onJumpToSection}
    />,
  )
}

export function bodyText() {
  return document.body.textContent || ""
}

export const FIGURE_NODE_IDS = [
  "database",
  "descriptor",
  "feature_selection",
  "evidence",
  "ranking",
  "validation",
  "future_ml",
  "experimental",
]
