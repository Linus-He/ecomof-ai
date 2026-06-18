// @ts-nocheck
export const BASE_PATH = "/ecomof-ai/"

export const HASH_TO_TAB = {
  overview: "home",
  ecoscreen: "ecoscreen",
  performance: "performance",
  gassep: "gassep",
  "gas-separation": "gassep",
  catalysis: "catalysis",
  "catalysis-organic-acid": "catalysis",
  "catalysis-organic-acid-final-screening": "catalysis",
  "organic-acid-graph-explorer": "catalysis",
  library: "library",
  "research-reports": "researchReports",
  "research-reports-generator": "researchReports",
  "research-reports-snapshot": "researchReports",
  "research-reports-citation-package": "researchReports",
  "research-reports-localization-audit": "researchReports",
  "project-evolution": "projectEvolution",
  "project-evolution-overview": "projectEvolution",
  "project-evolution-version-timeline": "projectEvolution",
  "project-evolution-release-notes": "projectEvolution",
  "project-evolution-scientific": "projectEvolution",
  "project-evolution-database": "projectEvolution",
  "project-evolution-algorithm": "projectEvolution",
  "project-evolution-validation": "projectEvolution",
  "project-evolution-ui": "projectEvolution",
  "project-evolution-milestones": "projectEvolution",
  "project-evolution-roadmap": "projectEvolution",
  methodology: "about",
  "methodology-algorithm-validation": "about",
  "algval-figure": "about",
  "algval-database": "about",
  "algval-descriptor": "about",
  "algval-feature-selection": "about",
  "algval-evidence": "about",
  "algval-ranking": "about",
  "algval-validation": "about",
  "algval-future-ml": "about",
  "algval-experimental": "about",
  "methodology-gassep": "about",
  "methodology-organic-acid": "about",
  "graph-informed-descriptor-integration": "about",
  "data-quality-provenance": "library",
  "validation-evidence": "about",
  "benchmark-references": "about",
}

export const TAB_TO_HASH = {
  home: "overview",
  ecoscreen: "ecoscreen",
  performance: "performance",
  gassep: "gassep",
  catalysis: "catalysis",
  library: "library",
  projectEvolution: "project-evolution",
  researchReports: "research-reports",
  about: "methodology",
}

export const HASH_META = {
  default: {
    title: "EcoMOF-AI | MOF AI 原型研究平台",
    description: "EcoMOF-AI 是面向 MOF 候选筛选、可持续性评价、描述符整理、催化探索和字段级数据来源追踪的早期研究原型。",
  },
  overview: {
    title: "EcoMOF-AI | 透明 MOF 筛选原型",
    description: "EcoMOF-AI 是面向 MOF 候选筛选、可持续性评价、描述符整理、催化探索和字段级数据来源追踪的早期研究原型。",
  },
  ecoscreen: {
    title: "EcoScreen | MOF 候选可持续性筛选",
    description: "查看可持续性导向的 MOF 候选优先级、透明假设、候选评分和使用限制。",
  },
  performance: {
    title: "性能优先级 | MOF 候选排序",
    description: "查看基于规则的 MOF 候选优先级、描述符整理状态和字段级来源信息。",
  },
  gassep: {
    title: "GasSep | 条件语境气体分离记录",
    description: "查看 MOF 候选的气体吸附与分离记录，包括气体比例、温度、压力、方法、来源状态和等温线状态。",
  },
  "gas-separation": {
    title: "GasSep | 条件语境气体分离记录",
    description: "查看 MOF 候选的气体吸附与分离记录，包括气体比例、温度、压力、方法、来源状态和等温线状态。",
  },
  catalysis: {
    title: "CatalysisLab | 催化导向 MOF 探索",
    description: "以早期研究原型方式查看催化导向 MOF 候选优先级，不作为最终催化性能预测。",
  },
  "catalysis-organic-acid": {
    title: "Organic Acid Workspace | EcoMOF-AI",
    description: "进入有机酸路径工作台，查看前端访问入口、算法追踪器、路径图、图论网络、证据矩阵、优先级矩阵和候选物队列。",
  },
  "catalysis-organic-acid-final-screening": {
    title: "Organic Acid Final Screening | EcoMOF-AI",
    description: "查看 170°C 水相 CO₂ 到甲酸 / 有机酸的 Al-MOF 稳定骨架筛选、第二金属推荐、Why Mo、敏感性分析和 EXAFS 可证伪预测。",
  },
  "organic-acid-graph-explorer": {
    title: "Organic Acid Graph Explorer | EcoMOF-AI",
    description: "查看 glucose / HCO₃⁻ 到 formic acid 和竞争有机酸路径的图论演示器，以及可能的 MOF influence hypothesis。",
  },
  library: {
    title: "MOF 候选库 | 描述符整理与来源追踪",
    description: "查看 MOF 描述符、整理状态、来源记录和数据质量与来源摘要。",
  },
  "research-reports": {
    title: "研究报告 | EcoMOF-AI",
    description: "生成候选报告、对比报告、筛选报告和验证报告，并导出运行快照、引用包和字段级溯源。",
  },
  "research-reports-generator": {
    title: "研究报告生成器 | EcoMOF-AI",
    description: "生成科研展示报告，包含研究目标、数据库版本、筛选条件、候选数量、筛选路径、CRITIC 权重、证据状态、数据缺口、字段来源、验证状态和局限性。",
  },
  "research-reports-snapshot": {
    title: "运行快照 | EcoMOF-AI",
    description: "查看 Run ID、数据库版本、方法版本、验证版本、时间戳、候选数量和已核验元数据数量。",
  },
  "research-reports-citation-package": {
    title: "引用包 | EcoMOF-AI",
    description: "查看引用来源、数据来源、字段来源、来源链接和引用状态。",
  },
  "research-reports-localization-audit": {
    title: "汉化质量审计 | EcoMOF-AI",
    description: "查看汉化覆盖率、术语一致性和科研表达一致性。",
  },
  "project-evolution": {
    title: "Project Evolution | EcoMOF-AI",
    description: "查看 EcoMOF-AI 的版本时间线、Release Notes、数据库成长、算法演化、验证体系、里程碑和路线图。",
  },
  "project-evolution-overview": {
    title: "Project Evolution Overview | EcoMOF-AI",
    description: "查看 EcoMOF-AI 当前版本、数据库规模、verified metadata、字段级溯源覆盖率和项目状态。",
  },
  "project-evolution-version-timeline": {
    title: "Version Timeline | EcoMOF-AI",
    description: "查看 EcoMOF-AI 的统一版本历史，这是版本时间线、Release Notes、Roadmap 和 Milestones 的唯一权威数据源。",
  },
  "project-evolution-release-notes": {
    title: "Release Notes Center | EcoMOF-AI",
    description: "按版本、模块、时间和分类查看 EcoMOF-AI 的更新记录。",
  },
  "project-evolution-scientific": {
    title: "Scientific Evolution | EcoMOF-AI",
    description: "查看 EcoMOF-AI 从 raw screening 到 verified metadata 和未来 experimental validation 的科学能力演化。",
  },
  "project-evolution-database": {
    title: "Database Evolution | EcoMOF-AI",
    description: "查看 EcoMOF-AI 数据库规模、verified metadata 和字段级溯源覆盖率的演化。",
  },
  "project-evolution-algorithm": {
    title: "Algorithm Evolution | EcoMOF-AI",
    description: "查看 EcoMOF-AI 从描述符评分、CRITIC、证据调整到模型验证框架的算法演化。",
  },
  "project-evolution-validation": {
    title: "Validation Evolution | EcoMOF-AI",
    description: "查看 source confirmed、citation ready、verified metadata、external validation 和 experimental validation 的边界。",
  },
  "project-evolution-ui": {
    title: "UI Evolution | EcoMOF-AI",
    description: "查看 EcoMOF-AI 主要工作区和导航结构的界面演化。",
  },
  "project-evolution-milestones": {
    title: "Milestone Center | EcoMOF-AI",
    description: "查看 EcoMOF-AI 的关键里程碑和对应版本。",
  },
  "project-evolution-roadmap": {
    title: "Roadmap | EcoMOF-AI",
    description: "查看 EcoMOF-AI V2.4 到 V3.0 的规划、目标和风险边界。",
  },
  methodology: {
    title: "方法与证据 | EcoMOF-AI",
    description: "了解 EcoMOF-AI 的评分方法、证据等级、数据来源、基准语境、验证状态、引用边界和使用限制。",
  },
  "methodology-algorithm-validation": {
    title: "Algorithm Validation Center | EcoMOF-AI",
    description: "进入算法验证中心：以交互式科研主图为唯一核心入口，串联数据库、描述符、特征选择、证据与统计、候选排序、算法验证、未来机器学习与实验验证；未来机器学习只显示 Pending，不显示虚假 Accuracy。",
  },
  "algval-figure": {
    title: "Interactive Scientific Figure | EcoMOF-AI",
    description: "查看从数据库到实验验证的交互式科研主图，每个节点可点击并在图节点检视器中查看输入、输出、算法、权重、字段来源、数据质量与下一步。",
  },
  "methodology-gassep": {
    title: "GasSep 方法 | EcoMOF-AI",
    description: "查看条件化气体分离数据记录、可比性规则、字段级来源和当前 curated literature data 边界。",
  },
  "methodology-organic-acid": {
    title: "Organic Acid 方法 | EcoMOF-AI",
    description: "查看 Organic Acid Workspace 的三路径网络、规则证据图、候选优先级矩阵和算法追踪解释方法。",
  },
  "methodology-organic-acid-final-screening": {
    title: "Organic Acid Final Screening 方法 | EcoMOF-AI",
    description: "查看 Al-MOF 水热硬阈值、OACS、DMRS、CRITIC+AHP、敏感性分析、盲测基线、EXAFS 和复现声明。",
  },
  "graph-informed-descriptor-integration": {
    title: "图论辅助描述符整合 | EcoMOF-AI",
    description: "查看 EcoMOF-AI 如何用图论解释传统描述符、结构基元、证据等级和最终评分之间的关系。",
  },
  "data-quality-provenance": {
    title: "数据质量与来源 | EcoMOF-AI",
    description: "查看 EcoMOF-AI 如何区分演示数据、真实种子整理记录、字段级来源和待复核状态。",
  },
  contact: {
    title: "联系与合作 | EcoMOF-AI",
    description: "联系 EcoMOF-AI 维护者，讨论研究合作、数据集接入或反馈。",
  },
  acknowledgements: {
    title: "致谢 | EcoMOF-AI",
    description: "EcoMOF-AI 早期研究原型的致谢与维护者信息。",
  },
  disclaimer: {
    title: "声明与使用边界 | EcoMOF-AI",
    description: "集中说明 EcoMOF-AI 的原型状态、数据解释、评分、可持续性信号、催化记录、机器学习和合作方保密数据边界。",
  },
  "validation-evidence": {
    title: "验证与证据 | EcoMOF-AI",
    description: "查看 EcoMOF-AI 当前验证状态、已明确检查的内容、未来验证计划和非验证声明。",
  },
  "benchmark-references": {
    title: "基准参考 | EcoMOF-AI",
    description: "查看用于解释候选记录的 MOF 基准参考，不宣称已验证的预测优越性。",
  },
}

export function normalizeHash(hash) {
  const cleaned = String(hash || "").replace(/^#/, "").trim()
  return cleaned || "overview"
}

export function tabToHash(tab) {
  return TAB_TO_HASH[tab] || "overview"
}

export function buildDeepLink(hash = "overview") {
  const normalized = normalizeHash(hash)
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL || BASE_PATH
    return `${window.location.origin}${base}#${normalized}`
  }
  return `https://linus-he.github.io${BASE_PATH}#${normalized}`
}

export function getHashMeta(hash) {
  return HASH_META[String(hash || "").replace(/^#/, "").trim()] || HASH_META[normalizeHash(hash)] || HASH_META.default
}
