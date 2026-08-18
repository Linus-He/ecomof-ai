// @ts-nocheck

const meta = (title, description) => ({ title, description })
const label = (zh, en) => ({ zh, en })

export const DEFAULT_ROUTE_META = meta(
  "EcoMOF-AI | MOF AI 原型研究平台",
  "EcoMOF-AI 是面向 MOF 候选筛选、可持续性评价、描述符整理、催化探索和字段级数据来源追踪的早期研究原型。",
)

export const NAVIGATION_ROUTES = [
  {
    id: "home",
    tabId: "home",
    primary: true,
    order: 0,
    copyKey: "overview",
    domainId: "research",
    hash: "overview",
    label: label("总览", "Overview"),
    meta: meta(
      "EcoMOF-AI | 透明 MOF 筛选原型",
      "EcoMOF-AI 是面向 MOF 候选筛选、可持续性评价、描述符整理、催化探索和字段级数据来源追踪的早期研究原型。",
    ),
    component: {
      strategy: "eager",
      exportName: "HomeTab",
    },
  },
  {
    id: "ecoscreen",
    tabId: "ecoscreen",
    primary: true,
    order: 1,
    copyKey: "ecoScreen",
    domainId: "research",
    hash: "ecoscreen",
    label: label("生态筛选", "EcoScreen"),
    meta: meta(
      "生态筛选 | EcoMOF-AI",
      "查看可持续性导向的 MOF 候选优先级、透明假设、候选评分和使用限制。",
    ),
    component: {
      strategy: "lazy",
      exportName: "EcoScreenTab",
      load: () => import("../components/tabs/EcoScreenTab"),
    },
  },
  {
    id: "performance",
    tabId: "performance",
    primary: false,
    domainId: "research",
    hash: "performance",
    label: label("早期性能筛选", "Performance"),
    meta: meta(
      "早期性能筛选 | EcoMOF-AI",
      "查看基于规则的 MOF 候选排序、描述符整理状态和字段级溯源信息。",
    ),
    component: {
      strategy: "lazy",
      exportName: "PerformanceTab",
      load: () => import("../components/tabs/PerformanceTab"),
    },
  },
  {
    id: "gassep",
    tabId: "gassep",
    primary: true,
    order: 2,
    copyKey: "gasSep",
    domainId: "research",
    hash: "gassep",
    aliases: ["gas-separation"],
    label: label("气体分离", "GasSep"),
    meta: meta(
      "气体分离 | EcoMOF-AI",
      "查看 MOF 候选的气体吸附与分离记录，包括气体比例、温度、压力、方法、来源状态和等温线状态。",
    ),
    component: {
      strategy: "lazy",
      exportName: "GasSepTab",
      load: () => import("../components/tabs/GasSepTab"),
    },
  },
  {
    id: "catalysis",
    tabId: "catalysis",
    primary: true,
    order: 3,
    copyKey: "catalysisLab",
    domainId: "research",
    hash: "catalysis",
    label: label("催化", "Catalysis"),
    meta: meta(
      "催化 | EcoMOF-AI",
      "以早期研究原型方式查看催化导向 MOF 候选优先级，不作为最终催化性能预测。",
    ),
    component: {
      strategy: "lazy",
      exportName: "CatalysisLabTab",
      load: () => import("../components/tabs/CatalysisLabTab"),
    },
    children: [
      {
        id: "catalysis-organic-acid-final-screening",
        hash: "catalysis-organic-acid-final-screening",
        label: label("有机酸最终筛选", "Organic Acid Final Screening"),
        meta: meta(
          "Organic Acid Final Screening | EcoMOF-AI",
          "查看 170°C 水相 CO₂ 到甲酸 / 有机酸的 Al-MOF 稳定骨架筛选、第二金属推荐、Why Mo、敏感性分析和 EXAFS 可证伪预测。",
        ),
      },
    ],
  },
  {
    id: "catalysisLiterature",
    tabId: "catalysisLiterature",
    primary: false,
    domainId: "research",
    hash: "catalysis-literature-verification",
    aliases: ["catalysis-literature-record-center"],
    label: label("催化文献核验中心", "Catalysis Literature Verification"),
    meta: meta(
      "催化文献核验中心 | EcoMOF-AI",
      "集中核对催化文献 DOI、反应条件、数值声明位置、活性相证据、许可范围与数据使用资格。",
    ),
    component: {
      strategy: "lazy",
      exportName: "CatalysisLiteratureVerificationPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
  },
  {
    id: "organicAcid",
    tabId: "organicAcid",
    primary: false,
    domainId: "research",
    hash: "catalysis-organic-acid",
    aliases: ["organic-acid-workbench"],
    label: label("有机酸研究工作区", "Organic Acid Research Workspace"),
    meta: meta(
      "有机酸研究工作区 | EcoMOF-AI",
      "查看有机酸方向的主客体算法、路径图、图论网络、规则证据、候选队列与验证路线。",
    ),
    component: {
      strategy: "lazy",
      exportName: "OrganicAcidResearchPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
    children: [
      {
        id: "organic-acid-graph-explorer",
        hash: "organic-acid-graph-explorer",
        scrollTarget: true,
        label: label("有机酸路径图", "Organic Acid Graph Explorer"),
        meta: meta(
          "Organic Acid Graph Explorer | EcoMOF-AI",
          "查看 glucose / HCO₃⁻ 到 formic acid 和竞争有机酸路径的图论演示器，以及可能的 MOF influence hypothesis。",
        ),
      },
    ],
  },
  {
    id: "library",
    tabId: "library",
    primary: true,
    order: 4,
    copyKey: "mofLibrary",
    domainId: "data",
    hash: "library",
    label: label("MOF库", "MOF Library"),
    meta: meta(
      "MOF库 | EcoMOF-AI",
      "查看 MOF 描述符、整理状态、来源记录和数据质量与来源摘要。",
    ),
    component: {
      strategy: "lazy",
      exportName: "MOFLibraryTab",
      load: () => import("../components/tabs/MOFLibraryTab"),
    },
  },
  {
    id: "dataQuality",
    tabId: "dataQuality",
    primary: false,
    domainId: "data",
    hash: "data-quality-provenance",
    label: label("数据质量与来源中心", "Data Quality & Provenance"),
    meta: meta(
      "数据质量与来源中心 | EcoMOF-AI",
      "审计真实 CoRE MOF 2024 CR 记录的字段覆盖、来源完整度、核验阻断项与数据库健康状态。",
    ),
    component: {
      strategy: "lazy",
      exportName: "DataQualityProvenancePage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
  },
  {
    id: "mofRecord",
    tabId: "mofRecord",
    primary: false,
    domainId: "data",
    hash: "mof-record",
    label: label("MOF 记录详情", "MOF Record Detail"),
    meta: meta(
      "MOF 记录详情 | EcoMOF-AI",
      "按 CoRE MOF 记录 ID、CSD Refcode 或名称查看结构描述符、身份与字段级来源。",
    ),
    component: {
      strategy: "lazy",
      exportName: "MofRecordPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
  },
  {
    id: "literatureRecord",
    tabId: "literatureRecord",
    primary: false,
    domainId: "data",
    hash: "literature-record",
    label: label("DOI 文献详情", "DOI Literature Detail"),
    meta: meta(
      "DOI 文献详情 | EcoMOF-AI",
      "查看已登记 DOI 的元数据核验、来源页面、许可证据、反应记录关联与使用边界。",
    ),
    component: {
      strategy: "lazy",
      exportName: "LiteratureRecordPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
  },
  {
    id: "about",
    tabId: "about",
    primary: true,
    order: 5,
    copyKey: "methodology",
    domainId: "methodology",
    hash: "methodology",
    label: label("方法论", "Methodology"),
    meta: meta(
      "方法论 | EcoMOF-AI",
      "了解 EcoMOF-AI 的评分方法、证据等级、数据来源、基准语境、验证状态、引用边界和使用限制。",
    ),
    component: {
      strategy: "lazy",
      exportName: "MethodsLimitationsTab",
      load: () => import("../components/tabs/MethodsLimitationsTab"),
    },
    children: [
      {
        id: "methodology-gassep",
        hash: "methodology-gassep",
        scrollTarget: true,
        label: label("GasSep 方法", "GasSep Method"),
        meta: meta(
          "GasSep 方法 | EcoMOF-AI",
          "查看带条件的气体分离记录、可比性规则、字段级溯源和当前文献整理数据的适用边界。",
        ),
      },
      {
        id: "methodology-organic-acid",
        hash: "methodology-organic-acid",
        scrollTarget: true,
        label: label("有机酸方法", "Organic Acid Method"),
        meta: meta(
          "Organic Acid 方法 | EcoMOF-AI",
          "查看 Organic Acid Workspace 的三路径网络、规则证据图、候选优先级矩阵和算法追踪解释方法。",
        ),
      },
      {
        id: "graph-informed-descriptor-integration",
        hash: "graph-informed-descriptor-integration",
        scrollTarget: true,
        label: label("图论辅助描述符整合", "Graph-informed Descriptor Integration"),
        meta: meta(
          "图论辅助描述符整合 | EcoMOF-AI",
          "查看 EcoMOF-AI 如何用图论解释传统描述符、结构基元、证据等级和最终评分之间的关系。",
        ),
      },
      {
        id: "validation-evidence",
        hash: "validation-evidence",
        scrollTarget: true,
        label: label("验证与证据", "Validation and Evidence"),
        meta: meta(
          "验证与证据 | EcoMOF-AI",
          "查看 EcoMOF-AI 当前验证状态、已明确检查的内容、未来验证计划和非验证声明。",
        ),
      },
    ],
  },
  {
    id: "benchmarkReferences",
    tabId: "benchmarkReferences",
    primary: false,
    domainId: "methodology",
    hash: "benchmark-references",
    label: label("基准参考", "Benchmark References"),
    meta: meta(
      "基准参考 | EcoMOF-AI",
      "集中查看生态、结构与数据、气体分离、催化和算法验证采用的标准、数据集、方法文献与内部协议，以及各自的适用边界。",
    ),
    component: {
      strategy: "lazy",
      exportName: "BenchmarkReferencesPage",
      load: () => import("../components/pages/BenchmarkReferencesPage"),
    },
  },
  {
    id: "algorithmValidation",
    tabId: "algorithmValidation",
    primary: false,
    domainId: "methodology",
    hash: "methodology-algorithm-validation",
    label: label("算法验证中心", "Algorithm Validation Center"),
    meta: meta(
      "算法验证中心 | EcoMOF-AI",
      "串联真实数据库、描述符、特征选择、数据审计、基准结果、模型可信度、稳健性与实验验证边界。",
    ),
    component: {
      strategy: "lazy",
      exportName: "AlgorithmValidationPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
    children: [
      { id: "algval-figure", hash: "algval-figure", scrollTarget: true, label: label("交互式科研主图", "Interactive Scientific Figure") },
      { id: "algval-data-audit", hash: "algval-data-audit", scrollTarget: true, label: label("数据审计中心", "Data Audit Center") },
      { id: "algval-first-benchmark", hash: "algval-first-benchmark", scrollTarget: true, label: label("内部协议基准", "Internal Protocol Benchmark") },
      { id: "algval-database", hash: "algval-database", scrollTarget: true, label: label("数据库层", "Database Layer") },
      { id: "algval-descriptor", hash: "algval-descriptor", scrollTarget: true, label: label("描述符层", "Descriptor Layer") },
      { id: "algval-feature-selection", hash: "algval-feature-selection", scrollTarget: true, label: label("特征选择", "Feature Selection") },
      { id: "algval-evidence", hash: "algval-evidence", scrollTarget: true, label: label("证据与统计", "Evidence and Statistics") },
      { id: "algval-ranking", hash: "algval-ranking", scrollTarget: true, label: label("候选排序", "Candidate Ranking") },
      { id: "algval-validation", hash: "algval-validation", scrollTarget: true, label: label("算法验证", "Algorithm Validation") },
      { id: "algval-future-ml", hash: "algval-future-ml", scrollTarget: true, label: label("机器学习就绪度", "ML Readiness") },
      { id: "algval-experimental", hash: "algval-experimental", scrollTarget: true, label: label("实验验证", "Experimental Validation") },
    ],
  },
  {
    id: "releaseNotes",
    tabId: "releaseNotes",
    primary: false,
    domainId: "project",
    hash: "release-notes",
    aliases: ["project-evolution-release-notes"],
    label: label("更新日志", "Changelog"),
    meta: meta(
      "更新日志 | EcoMOF-AI",
      "按统一 Web 版本查看 EcoMOF-AI 已完成的功能、方法、数据与界面更新。",
    ),
    component: {
      strategy: "lazy",
      exportName: "ReleaseNotesPage",
      load: () => import("../components/pages/ReleaseNotesPage"),
    },
  },
  {
    id: "projectEvolution",
    tabId: "projectEvolution",
    primary: true,
    order: 6,
    copyKey: "projectEvolution",
    domainId: "project",
    hash: "project-evolution",
    aliases: ["project-evolution-version-timeline"],
    label: label("项目演化", "Project Evolution"),
    meta: meta(
      "项目演化 | EcoMOF-AI",
      "查看 EcoMOF-AI 的项目状态、数据库演化、算法演化、验证体系、关键里程碑和发展路线图。",
    ),
    component: {
      strategy: "lazy",
      exportName: "ProjectEvolutionTab",
      load: () => import("../components/tabs/ProjectEvolutionTab"),
    },
    children: [
      { id: "project-evolution-overview", hash: "project-evolution-overview", scrollTarget: true, label: label("项目概览", "Project Overview"), meta: meta("Project Evolution Overview | EcoMOF-AI", "查看 EcoMOF-AI 当前版本、数据库规模、verified metadata、字段级溯源覆盖率和项目状态。") },
      { id: "project-evolution-scientific", hash: "project-evolution-scientific", scrollTarget: true, label: label("科学演化", "Scientific Evolution"), meta: meta("Scientific Evolution | EcoMOF-AI", "查看 EcoMOF-AI 从 raw screening 到 verified metadata 和未来 experimental validation 的科学能力演化。") },
      { id: "project-evolution-database", hash: "project-evolution-database", scrollTarget: true, label: label("数据库演化", "Database Evolution"), meta: meta("Database Evolution | EcoMOF-AI", "查看 EcoMOF-AI 数据库规模、verified metadata 和字段级溯源覆盖率的演化。") },
      { id: "project-evolution-algorithm", hash: "project-evolution-algorithm", scrollTarget: true, label: label("算法演化", "Algorithm Evolution"), meta: meta("Algorithm Evolution | EcoMOF-AI", "查看 EcoMOF-AI 从描述符评分、CRITIC、证据调整到模型验证框架的算法演化。") },
      { id: "project-evolution-validation", hash: "project-evolution-validation", scrollTarget: true, label: label("验证演化", "Validation Evolution"), meta: meta("Validation Evolution | EcoMOF-AI", "查看 source confirmed、citation ready、verified metadata、external validation 和 experimental validation 的边界。") },
      { id: "project-evolution-ui", hash: "project-evolution-ui", scrollTarget: true, label: label("界面演化", "UI Evolution"), meta: meta("UI Evolution | EcoMOF-AI", "查看 EcoMOF-AI 主要工作区和导航结构的界面演化。") },
      { id: "project-evolution-milestones", hash: "project-evolution-milestones", scrollTarget: true, label: label("科学里程碑", "Milestones"), meta: meta("Milestone Center | EcoMOF-AI", "查看 EcoMOF-AI 的关键里程碑和对应版本。") },
      { id: "project-evolution-roadmap", hash: "project-evolution-roadmap", scrollTarget: true, label: label("路线图", "Roadmap"), meta: meta("Roadmap | EcoMOF-AI", "查看 EcoMOF-AI V2.4 到 V3.0 的规划、目标和风险边界。") },
    ],
  },
  {
    id: "charter",
    tabId: "charter",
    primary: false,
    domainId: "about",
    hash: "research-charter",
    label: label("研究宪章", "Research Charter"),
    meta: meta(
      "研究宪章 | EcoMOF-AI",
      "查看 EcoMOF-AI 的使命、广泛研究收益、长期科学可靠性、技术与证据领导力以及开放合作原则。",
    ),
    component: {
      strategy: "lazy",
      exportName: "ResearchCharterPage",
      load: () => import("../components/pages/PriorityResearchPages"),
    },
  },
  {
    id: "creatorStatement",
    tabId: "creatorStatement",
    primary: false,
    domainId: "about",
    hash: "creator-statement",
    label: label("创建者说明", "Creator Statement"),
    meta: meta(
      "为什么建立 EcoMOF-AI | 创建者说明",
      "了解 EcoMOF-AI 的创建原因、学生与独立项目身份、非商业运行方式、纠错态度和顾问邀请。",
    ),
    component: {
      strategy: "lazy",
      exportName: "CreatorStatementPage",
      load: () => import("../components/pages/CreatorStatementPage"),
    },
  },
  {
    id: "contact",
    tabId: "contact",
    primary: false,
    domainId: "about",
    hash: "contact",
    label: label("联系与合作", "Contact"),
    meta: meta("联系与合作 | EcoMOF-AI", "联系 EcoMOF-AI，讨论研究合作、数据接入、方法复核或界面问题。"),
    component: {
      strategy: "lazy",
      exportName: "ContactPage",
      load: () => import("../components/pages/ContactPage"),
    },
  },
  {
    id: "openSourceLicenses",
    tabId: "openSourceLicenses",
    primary: false,
    domainId: "about",
    hash: "open-source-licenses",
    label: label("开源许可", "Open Source Licenses"),
    meta: meta(
      "开源许可 | EcoMOF-AI",
      "集中说明 EcoMOF-AI 自有代码、前端依赖、测试工具、字体、图标、Swift 生态和第三方数据的许可边界。",
    ),
    component: {
      strategy: "lazy",
      exportName: "OpenSourceLicensesPage",
      load: () => import("../components/pages/OpenSourceLicensesPage"),
    },
  },
  {
    id: "acknowledgements",
    tabId: "acknowledgements",
    primary: false,
    domainId: "about",
    hash: "acknowledgements",
    label: label("致谢", "Acknowledgements"),
    meta: meta("致谢 | EcoMOF-AI", "查看 EcoMOF-AI 对个人支持者、CCDC、开放数据集和科研工具维护者的致谢。"),
    component: {
      strategy: "lazy",
      exportName: "AcknowledgementsPage",
      load: () => import("../components/pages/AcknowledgementsPage"),
    },
  },
  {
    id: "dataCompliance",
    tabId: "dataCompliance",
    primary: true,
    order: 7,
    copyKey: "dataCompliance",
    domainId: "about",
    hash: "database-compliance",
    label: label("条款与政策", "Terms & Policies"),
    meta: meta(
      "条款与政策 | EcoMOF-AI",
      "查看 EcoMOF-AI 的数据来源、许可边界、平台承诺、用户责任与官方条款链接。",
    ),
    component: {
      strategy: "lazy",
      exportName: "DatabaseComplianceTab",
      load: () => import("../components/tabs/DatabaseComplianceTab"),
    },
    children: [
      {
        id: "compliance-hosting-notice",
        hash: "compliance-hosting-notice",
        scrollTarget: true,
        label: label("数据托管与跨境访问", "Data hosting & cross-border access"),
        meta: meta(
          "数据托管与跨境访问 | EcoMOF-AI",
          "了解 EcoMOF-AI 的数据托管位置、跨境访问条件与适用边界。",
        ),
      },
    ],
  },
]

export const OVERLAY_NAVIGATION_ITEMS = [
  { id: "disclaimer", hash: "disclaimer", domainId: "about", label: label("声明与使用边界", "Disclaimer"), meta: meta("声明与使用边界 | EcoMOF-AI", "集中说明 EcoMOF-AI 的原型状态、数据解释、评分、可持续性信号、催化记录、机器学习和合作方保密数据边界。") },
]

export const NAVIGATION_DOMAINS = [
  {
    id: "research",
    order: 1,
    label: label("研究", "Research"),
    groups: [
      { id: "research-workspaces", label: label("研究工作区", "Research workspaces"), itemIds: ["ecoscreen", "gassep", "catalysis", "organicAcid"] },
      { id: "research-focus", label: label("专题与工具", "Focused tools"), itemIds: ["catalysisLiterature", "catalysis-organic-acid-final-screening", "organic-acid-graph-explorer"] },
    ],
  },
  {
    id: "data",
    order: 2,
    label: label("数据", "Data"),
    groups: [
      { id: "data-libraries", label: label("数据库", "Libraries"), itemIds: ["library", "mofRecord", "literatureRecord"] },
      { id: "data-governance", label: label("数据治理", "Data governance"), itemIds: ["dataQuality"] },
    ],
  },
  {
    id: "methodology",
    order: 3,
    label: label("方法与验证", "Methods & validation"),
    groups: [
      { id: "method-index", label: label("方法索引", "Method index"), itemIds: ["about", "methodology-gassep", "methodology-organic-acid"] },
      { id: "method-validation", label: label("验证与边界", "Validation & boundaries"), itemIds: ["algorithmValidation", "validation-evidence", "benchmarkReferences"] },
    ],
  },
  {
    id: "project",
    order: 4,
    label: label("项目", "Project"),
    groups: [
      { id: "project-progress", label: label("进展", "Progress"), itemIds: ["projectEvolution", "releaseNotes"] },
      { id: "project-planning", label: label("规划", "Planning"), itemIds: ["project-evolution-milestones", "project-evolution-roadmap"] },
    ],
  },
  {
    id: "about",
    order: 5,
    label: label("关于", "About"),
    groups: [
      { id: "about-governance", label: label("项目治理", "Governance"), itemIds: ["creatorStatement", "charter", "dataCompliance", "openSourceLicenses"] },
      { id: "about-contact", label: label("联系", "Contact"), itemIds: ["contact", "acknowledgements"] },
    ],
  },
]

export const NAVIGATION_ITEMS = NAVIGATION_ROUTES.flatMap(route => [
  route,
  ...(route.children || []).map(child => ({ ...child, tabId: route.tabId, parentId: route.id, domainId: child.domainId || route.domainId })),
]).concat(OVERLAY_NAVIGATION_ITEMS)

export const NAVIGATION_ITEM_BY_ID = Object.fromEntries(NAVIGATION_ITEMS.map(item => [item.id, item]))
export const NAVIGATION_ITEM_BY_HASH = Object.fromEntries(NAVIGATION_ITEMS.flatMap(item => [
  [item.hash, item],
  ...(item.aliases || []).map(alias => [alias, item]),
]))
export const NAVIGATION_ROUTE_BY_TAB = Object.fromEntries(NAVIGATION_ROUTES.map(route => [route.tabId, route]))

export const HASH_TO_TAB = Object.fromEntries(
  Object.entries(NAVIGATION_ITEM_BY_HASH)
    .filter(([, item]) => item.tabId)
    .map(([hash, item]) => [hash, item.tabId]),
)

export const TAB_TO_HASH = Object.fromEntries(NAVIGATION_ROUTES.map(route => [route.tabId, route.hash]))

export const HASH_META = {
  default: DEFAULT_ROUTE_META,
  ...Object.fromEntries(Object.entries(NAVIGATION_ITEM_BY_HASH).map(([hash, item]) => [hash, item.meta || DEFAULT_ROUTE_META])),
}

export function getPrimaryNavigationItems() {
  return NAVIGATION_ROUTES.filter(route => route.primary).sort((a, b) => a.order - b.order)
}

export function getNavigationLabel(item, lang = "zh") {
  return item?.label?.[lang === "en" ? "en" : "zh"] || item?.label?.zh || item?.id || ""
}

export function getNavigationRoute(tabId) {
  return NAVIGATION_ROUTE_BY_TAB[tabId] || null
}

export function getNavigationItem(hashOrId) {
  return NAVIGATION_ITEM_BY_HASH[hashOrId] || NAVIGATION_ITEM_BY_ID[hashOrId] || null
}

export function resolveTabForHash(hash) {
  const normalized = String(hash || "").replace(/^#/, "").trim() || "overview"
  if (HASH_TO_TAB[normalized]) return HASH_TO_TAB[normalized]
  if (normalized.startsWith("mof-record-")) return "mofRecord"
  if (normalized.startsWith("literature-doi-")) return "literatureRecord"
  if (normalized.startsWith("algval-")) return "algorithmValidation"
  if (normalized.startsWith("methodology-")) return "about"
  if (normalized.startsWith("project-evolution-")) return "projectEvolution"
  return null
}

export function getScrollTargetForHash(hash) {
  const normalized = String(hash || "").replace(/^#/, "").trim() || "overview"
  const item = NAVIGATION_ITEM_BY_HASH[normalized]
  if (item?.scrollTarget === true) return normalized
  if (typeof item?.scrollTarget === "string") return item.scrollTarget
  if (item) return null
  if (normalized.startsWith("methodology-") || normalized.startsWith("project-evolution-")) return normalized
  return null
}

export function getNavigationMeta(hash) {
  const normalized = String(hash || "").replace(/^#/, "").trim() || "overview"
  if (normalized.startsWith("mof-record-")) return NAVIGATION_ROUTE_BY_TAB.mofRecord.meta
  if (normalized.startsWith("literature-doi-")) return NAVIGATION_ROUTE_BY_TAB.literatureRecord.meta
  const item = NAVIGATION_ITEM_BY_HASH[normalized]
  if (item?.meta) return item.meta
  if (item?.label) {
    return {
      title: `${item.label.zh || item.label.en} | EcoMOF-AI`,
      description: NAVIGATION_ROUTE_BY_TAB[item.tabId]?.meta?.description || DEFAULT_ROUTE_META.description,
    }
  }
  return HASH_META[normalized] || DEFAULT_ROUTE_META
}

export function preloadNavigationRoutes(tabIds = []) {
  return Promise.allSettled(tabIds.map(tabId => NAVIGATION_ROUTE_BY_TAB[tabId]?.component?.load?.()).filter(Boolean))
}
