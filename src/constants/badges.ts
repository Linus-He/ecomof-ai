// @ts-nocheck
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

export const TABS = [
  { id: "home",          copyKey: "overview" },
  { id: "ecoscreen",     copyKey: "ecoScreen" },
  { id: "gassep",        copyKey: "gasSep" },
  { id: "catalysis",     copyKey: "catalysisLab" },
  { id: "library",       copyKey: "mofLibrary" },
  { id: "about",         copyKey: "methodology" },
  { id: "projectEvolution", copyKey: "projectEvolution" },
]
