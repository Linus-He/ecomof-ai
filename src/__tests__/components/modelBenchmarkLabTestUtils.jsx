// @ts-nocheck
import { render } from "@testing-library/react"
import { THEME_DARK, THEME_LIGHT } from "../../constants/theme"
import { ModelBenchmarkLab } from "../../components/methodology/model-benchmark/ModelBenchmarkLab"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"

export function benchmarkAlgorithm() {
  return rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" })
}

export function renderBenchmarkLab({ lang = "en", theme = THEME_LIGHT, isMobile = false, summary = {} } = {}) {
  window.localStorage.clear()
  return render(
    <ModelBenchmarkLab
      records={[]}
      summary={{ totalCandidates: 1000, verifiedMetadataCount: 30, fieldProvenanceCoverage: 1, labelCount: 0, ...summary }}
      organicAcidResult={{ organicAcidAlgorithm: benchmarkAlgorithm() }}
      lang={lang}
      t={theme}
      isMobile={isMobile}
    />,
  )
}

export function renderBenchmarkLabDark() {
  return renderBenchmarkLab({ theme: THEME_DARK })
}

export function bodyText() {
  return document.body.textContent || ""
}

