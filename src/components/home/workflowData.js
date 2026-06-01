// @ts-nocheck

export const evidenceLevels = [
  {
    level: "A",
    zh: "实验或高质量文献",
    en: "experimental or high-quality literature",
    tone: "success",
  },
  {
    level: "B",
    zh: "模拟或部分整理数据",
    en: "simulation or partially curated data",
    tone: "info",
  },
  {
    level: "C",
    zh: "预测、推断或不完整数据",
    en: "predicted / inferred / incomplete",
    tone: "warning",
  },
  {
    level: "D",
    zh: "演示或占位数据",
    en: "demo or placeholder data",
    tone: "muted",
  },
]

export const validationActions = [
  { zh: "描述符补全", en: "Descriptor completion" },
  { zh: "吸附或反应模拟", en: "Adsorption or reaction simulation" },
  { zh: "稳定性验证", en: "Stability validation" },
  { zh: "实验测量", en: "Experimental measurement" },
  { zh: "LCA 或 TEA 边界核查", en: "LCA / TEA boundary check" },
]

export const evidenceLoopNodes = [
  {
    id: "recommendation",
    zh: "推荐结果",
    en: "Recommendation",
    zhDetail: "当前候选排序和推荐解释进入证据核查，而不是作为最终答案。",
    enDetail: "The current ranking and explanation enter evidence review rather than becoming a closed conclusion.",
  },
  {
    id: "evidence",
    zh: "证据核查",
    en: "Evidence Check",
    zhDetail: "检查来源记录、引用、数据类型、字段缺口和证据等级。",
    enDetail: "Review source records, citations, data type, missing fields, and evidence level.",
  },
  {
    id: "boundary",
    zh: "适用边界",
    en: "Applicability Boundary",
    zhDetail: "明确气体体系、反应路径、LCA/TEA 边界或实验条件是否匹配。",
    enDetail: "State whether gas pair, reaction pathway, LCA/TEA boundary, or experimental condition matches.",
  },
  {
    id: "validation",
    zh: "验证动作",
    en: "Validation Action",
    zhDetail: "把不确定性转成描述符补全、模拟、稳定性验证或实验测量任务。",
    enDetail: "Turn uncertainty into descriptor completion, simulation, stability validation, or measurement tasks.",
  },
  {
    id: "confidence",
    zh: "置信度更新",
    en: "Updated Confidence",
    zhDetail: "验证结果回写到候选解释和优先级，形成科研闭环。",
    enDetail: "Validation results update the explanation and priority, closing the research loop.",
  },
]

export const workflowSteps = [
  {
    id: "source-intake",
    number: "01",
    title: { zh: "结构与来源接入", en: "Structure & Source Intake" },
    purpose: {
      zh: "把不同来源的 MOF 材料记录整理成可追踪的候选记录。",
      en: "Turn heterogeneous MOF sources into traceable candidate records.",
    },
    input: {
      zh: "CoRE MOF 记录、QMOF 记录、CIF 文件、文献记录、人工整理条目",
      en: "CoRE MOF records, QMOF records, CIF files, literature records, manual curated entries",
    },
    process: {
      zh: "统一 MOF 标识、来源字段、引用信息、许可信息和数据状态。",
      en: "Normalize MOF identifiers, source fields, citations, licenses, and data status.",
    },
    output: {
      zh: "生成带来源信息的 MOF 候选记录。",
      en: "A source-aware MOF candidate record.",
    },
    visual: "source-flow",
    shortcut: { zh: "浏览 MOF 候选库", en: "Browse MOF Library", target: "mofLibrary" },
  },
  {
    id: "descriptor-curation",
    number: "02",
    title: { zh: "描述符整理", en: "Descriptor Curation" },
    purpose: {
      zh: "检查核心描述符是否已整理、待补充或需要复核。",
      en: "Check whether core descriptors are curated, pending, or need review.",
    },
    input: {
      zh: "比表面积、孔径、孔容、CO₂ 吸附量、带隙、水稳定性、热稳定性、毒性关注",
      en: "surfaceArea, poreSizeA, poreVolume, co2Uptake, bandGap, waterStability, thermalStability, toxicityConcern",
    },
    process: {
      zh: "检查每个描述符是已整理、待补充还是需要复核。",
      en: "Check whether each descriptor is curated, pending, or needs review.",
    },
    output: {
      zh: "描述符完整度评分和字段级数据状态。",
      en: "Descriptor completeness score and field-level data status.",
    },
    visual: "descriptor-checklist",
    shortcut: { zh: "查看描述符清单", en: "View descriptor checklist", target: "data-quality-provenance" },
  },
  {
    id: "scenario-setup",
    number: "03",
    title: { zh: "应用场景设定", en: "Scenario Setup" },
    purpose: {
      zh: "把候选评价绑定到具体气体体系、反应路径或环境边界。",
      en: "Bind candidate evaluation to a specific gas pair, pathway, or environmental boundary.",
    },
    input: {
      zh: "气体分离、催化、有机酸路径、LCA/LCC 边界条件",
      en: "Gas separation, catalysis, organic acid pathway, LCA/LCC boundary",
    },
    process: {
      zh: "将候选材料评价绑定到气体体系、反应路径、环境边界或决策场景。",
      en: "Bind candidate evaluation to gas pair, reaction pathway, environmental boundary, or decision scenario.",
    },
    output: {
      zh: "生成场景化筛选上下文。",
      en: "A scenario-specific screening context.",
    },
    visual: "scenario-chips",
    shortcuts: [
      { zh: "进入 GasSep", en: "Enter GasSep", target: "gassep" },
      { zh: "进入 Catalysis Lab", en: "Enter Catalysis Lab", target: "catalysisLab" },
      { zh: "进入 EcoScreen", en: "Enter EcoScreen", target: "ecoScreen" },
    ],
  },
  {
    id: "transparent-scoring",
    number: "04",
    title: { zh: "透明评分", en: "Transparent Scoring" },
    purpose: {
      zh: "用透明权重和证据感知修正生成可解释候选排序。",
      en: "Use transparent weights and evidence-aware adjustment to produce explainable ranking.",
    },
    input: {
      zh: "已整理描述符、场景权重、专家先验、证据等级",
      en: "Curated descriptors, scenario weights, expert priors, evidence levels",
    },
    process: {
      zh: "使用透明权重和证据修正计算候选评分。",
      en: "Calculate candidate scores using transparent weighting and evidence-aware adjustment.",
    },
    output: {
      zh: "输出带分数拆解的候选排序。",
      en: "Ranked candidates with score breakdown.",
    },
    visual: "weight-bars",
    shortcut: { zh: "查看评分方法", en: "View scoring method", target: "methodology" },
  },
  {
    id: "recommendation-explanation",
    number: "05",
    title: { zh: "推荐解释", en: "Recommendation Explanation" },
    purpose: {
      zh: "把排序结果转成可质疑的优势、风险和不确定性说明。",
      en: "Translate ranking into inspectable strengths, risks, and uncertainty notes.",
    },
    input: {
      zh: "候选排序、分数拆解、描述符状态、风险标记",
      en: "Candidate ranking, score breakdown, descriptor status, risk flags",
    },
    process: {
      zh: "将分数转化为可读的推荐原因、优势、短板和不确定性说明。",
      en: "Translate scores into human-readable reasons, strengths, weaknesses, and uncertainty notes.",
    },
    output: {
      zh: "生成“为什么是这个结果？”解释卡片。",
      en: "A Why this result explanation card.",
    },
    visual: "explanation-card",
    shortcut: { zh: "查看原因", en: "View reason", target: "ecoScreen" },
  },
  {
    id: "evidence-validation-loop",
    number: "06",
    title: { zh: "证据与验证闭环", en: "Evidence & Validation Loop" },
    purpose: {
      zh: "把推荐结果、证据核查、适用边界和验证动作合并为一个科研闭环。",
      en: "Join recommendation, evidence review, applicability boundary, and validation actions into one research loop.",
    },
    input: {
      zh: "来源记录、引用信息、数据类型、证据等级、适用限制、缺失字段",
      en: "Source records, citations, data type, evidence level, limitations, missing fields",
    },
    process: {
      zh: "核查来源，划分证据强度，识别不确定性，并生成验证动作。",
      en: "Review provenance, classify evidence strength, identify uncertainty, and generate validation actions.",
    },
    output: {
      zh: "证据等级、限制说明和验证路线。",
      en: "Evidence level, limitation notes, and validation roadmap.",
    },
    visual: "evidence-loop",
    shortcut: { zh: "查看验证", en: "View validation", target: "validation-evidence" },
  },
]

export const workflowOutputs = [
  { zh: "候选排序", en: "Candidate ranking", target: "ecoScreen" },
  { zh: "描述符完整度", en: "Descriptor completeness", target: "data-quality-provenance" },
  { zh: "推荐解释", en: "Why this result", target: "ecoScreen" },
  { zh: "证据等级", en: "Evidence level", target: "methodology" },
  { zh: "风险提示", en: "Risk notes", target: "performance" },
  { zh: "验证路线", en: "Validation roadmap", target: "validation-evidence" },
]
