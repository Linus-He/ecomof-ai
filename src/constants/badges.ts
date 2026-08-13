// @ts-nocheck
import { getPrimaryNavigationItems } from "../config/navigationRegistry"
export const SOURCE_BADGES = {
  literature: { label: "Literature-backed", tone: "calc" },
  benchmark: { label: "Benchmark-backed", tone: "calc" },
  model: { label: "Model-predicted", tone: "info" },
  proxy: { label: "Screening proxy", tone: "proxy" },
  user: { label: "User-defined", tone: "user" },
}

export const WORKFLOW_STAGE_ITEMS = [
  { id: "screening", stage: "Stage 1", label: "Scientific Screening", zh: "科学筛选", target: "screening", tone: "info" },
  { id: "feasibility", stage: "Stage 2", label: "Feasibility Boundaries", zh: "可行性边界", target: "feasibility", tone: "proxy" },
  { id: "comparison", stage: "Stage 3", label: "Secondary Comparison", zh: "次级比较", target: "lca", tone: "user" },
  { id: "engineering", stage: "Future Stage 4", label: "Engineering Evaluation (future)", zh: "工程评估（未来）", target: "about", tone: "calc" },
]

// Compatibility export for the current tab bar. P1 can render domains and groups
// from the same registry without changing page IDs or deep links.
export const TABS = getPrimaryNavigationItems()
