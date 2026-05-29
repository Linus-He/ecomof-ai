// @ts-nocheck
import { useLang, BasisBadge, PageHeader, StageStrip, StickySummaryBar, CandidateComparisonPanel, InternalNav } from "../../shared"
import { FeasibilityTab } from "./FeasibilityTab"
import { LCAScoringTab } from "./LCAScoringTab"
import { SensitivityTab } from "./SensitivityTab"

export function ComparisonTab({ activeSub, setActiveSub, results, inputs, onNavigate, onAddComparison, comparisonCandidates, comparisonFocusId, onRemoveCandidate, onMoveCandidate }) {
  const { lang } = useLang()
  const items = [
    { id: "feasibility", label: lang === "zh" ? "可行性" : "Feasibility" },
    { id: "lca", label: "LCA / LCC" },
    { id: "sensitivity", label: lang === "zh" ? "敏感性" : "Sensitivity" },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={lang === "zh" ? "候选比较" : "Comparison"}
        subtitle={lang === "zh"
          ? "科学筛选之后的可行性、LCA/LCC 与敏感性比较。"
          : "Feasibility, LCA/LCC, and sensitivity comparison after scientific screening."}
        meta={lang === "zh" ? "第 2-3 阶段" : "Stages 2-3"}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "非主要命中识别" : "Not primary hit identification"}</BasisBadge>}
      />
      <StageStrip current={activeSub === "feasibility" ? "feasibility" : "comparison"} onNavigate={onNavigate} />
      <StickySummaryBar
        inputs={inputs}
        results={results}
        stage={activeSub === "feasibility" ? (lang === "zh" ? "第 2 阶段" : "Stage 2") : (lang === "zh" ? "第 3 阶段" : "Stage 3")}
        onAddComparison={onAddComparison}
        canAddComparison={Boolean(results && !results.unavailable)}
      />
      <CandidateComparisonPanel candidates={comparisonCandidates} focusId={comparisonFocusId} onRemove={onRemoveCandidate} onMove={onMoveCandidate} />
      <InternalNav items={items} active={activeSub} onChange={setActiveSub} />
      {activeSub === "feasibility" && <FeasibilityTab results={results} inputs={inputs} onNavigate={onNavigate} />}
      {activeSub === "lca" && <LCAScoringTab results={results} inputs={inputs} onNavigate={onNavigate} />}
      {activeSub === "sensitivity" && <SensitivityTab results={results} inputs={inputs} onNavigate={onNavigate} />}
    </div>
  )
}
