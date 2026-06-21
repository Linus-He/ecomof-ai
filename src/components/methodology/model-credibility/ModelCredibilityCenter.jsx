// @ts-nocheck
// V3.5 Model Credibility Center — composes the explainability, feature
// importance, cross validation, scientific figures, and credibility dashboards.
// Rendered inside the Algorithm Validation Center. All data is read from the
// frozen V3.4 + V3.5 reports.
import { ModelExplainabilityCenter } from "./ModelExplainabilityCenter"
import { FeatureImportanceWorkbench } from "./FeatureImportanceWorkbench"
import { CrossValidationDashboard } from "./CrossValidationDashboard"
import { CredibilityFigures } from "./CredibilityFigures"
import { CredibilityDashboard } from "./CredibilityDashboard"

export function ModelCredibilityCenter({ credibility = null, firstBenchmark = null, lang = "en", t, isMobile = false }) {
  if (!credibility) return null
  return (
    <div data-testid="model-credibility-center" style={{ display: "grid", gap: 14, minWidth: 0 }}>
      <ModelExplainabilityCenter credibility={credibility} lang={lang} t={t} isMobile={isMobile} />
      <FeatureImportanceWorkbench credibility={credibility} lang={lang} t={t} isMobile={isMobile} />
      <CredibilityFigures credibility={credibility} firstBenchmark={firstBenchmark} lang={lang} t={t} isMobile={isMobile} />
      <CrossValidationDashboard credibility={credibility} lang={lang} t={t} isMobile={isMobile} />
      <CredibilityDashboard credibility={credibility} lang={lang} t={t} isMobile={isMobile} />
    </div>
  )
}

export default ModelCredibilityCenter
