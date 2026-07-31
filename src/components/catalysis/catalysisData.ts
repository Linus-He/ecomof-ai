// @ts-nocheck
export const DOMAIN_COLORS = {
  "co2-conversion": "#2563eb",
  "biomass-conversion": "#0f766e",
  "co2-biomass-coupling": "#7c3aed",
  "organic-transformation": "#ca8a04",
  "environmental-catalysis": "#059669",
  "organic-acid-production": "#dc2626",
}

export const REACTION_DOMAINS = [
  { key: "all", en: "All domains", zh: "全部领域" },
  { key: "co2-conversion", en: "CO₂ conversion", zh: "CO₂ 转化" },
  { key: "biomass-conversion", en: "Biomass conversion", zh: "生物质转化" },
  { key: "co2-biomass-coupling", en: "CO₂ + biomass coupling", zh: "CO₂ 与生物质协同转化" },
  { key: "organic-transformation", en: "Organic transformation", zh: "有机转化" },
  { key: "environmental-catalysis", en: "Environmental catalysis", zh: "环境催化" },
  { key: "organic-acid-production", en: "Organic acid production", zh: "有机酸生成" },
]

export const CATALYTIC_MODES = [
  { key: "all", en: "All modes", zh: "全部方式" },
  { key: "electro", en: "Electrochemical", zh: "电催" },
  { key: "photo", en: "Photochemical", zh: "光催" },
  { key: "thermal", en: "Thermal", zh: "热催" },
  { key: "photothermal", en: "Photothermal", zh: "光热催化" },
]

export const FEEDSTOCKS = [
  { key: "all", en: "All feedstocks", zh: "全部原料" },
  { key: "co2-hco3", en: "CO₂ / HCO₃⁻", zh: "CO₂ / HCO₃⁻" },
  { key: "glucose-biomass", en: "glucose / biomass", zh: "葡萄糖 / 生物质" },
  { key: "organic-substrate", en: "organic substrates", zh: "有机底物" },
  { key: "pollutant-water", en: "pollutants / water", zh: "污染物 / 水体" },
]

export const PRODUCT_FAMILIES = [
  { key: "all", en: "All products", zh: "全部产物" },
  { key: "c1-products", en: "C1 products", zh: "C1 产物" },
  { key: "organic-acids", en: "organic acids", zh: "有机酸" },
  { key: "platform-chemicals", en: "platform chemicals", zh: "平台化合物" },
  { key: "oxidation-products", en: "oxidation products", zh: "氧化产物" },
  { key: "degradation-products", en: "degradation products", zh: "降解产物" },
]

export const DATA_STATUSES = [
  { key: "all", en: "All status", zh: "全部状态" },
  { key: "structured", en: "structured record format", zh: "结构化记录格式" },
  { key: "literature-pending", en: "literature curation pending", zh: "文献整理待补充" },
  { key: "collaborator-context", en: "collaborator context", zh: "合作语境" },
  { key: "curated", en: "curated", zh: "已整理" },
  { key: "future-scope", en: "future scope", zh: "后续方向" },
]

export const X_METRIC_OPTIONS = [
  { key: "conversion", en: "Conversion", zh: "转化率" },
  { key: "yield", en: "Yield", zh: "产率" },
  { key: "formationRate", en: "Formation rate", zh: "生成速率" },
]

export const Y_METRIC_OPTIONS = [
  { key: "selectivity", en: "Selectivity", zh: "选择性" },
  { key: "faradaicEfficiency", en: "Faradaic efficiency", zh: "法拉第效率" },
  { key: "tof", en: "TOF", zh: "TOF" },
  { key: "ton", en: "TON", zh: "TON" },
]

export const CATALYSIS_TASKS = [
  {
    id: "co2-formate-electro",
    taskEn: "CO₂ / HCO₃⁻ reduction to formate",
    taskZh: "CO₂ / HCO₃⁻ 还原制甲酸盐",
    domainKey: "co2-conversion",
    modeKey: "electro",
    feedstockKey: "co2-hco3",
    productFamilyKey: "c1-products",
    productEn: "formate / C1 products",
    productZh: "甲酸盐 / C1 产物",
    keyMetricsEn: ["FE", "current density", "selectivity", "energy input"],
    keyMetricsZh: ["法拉第效率", "电流密度", "选择性", "能量输入"],
    conditionContextEn: ["electrolyte", "electrode", "voltage", "CO₂ source"],
    conditionContextZh: ["电解液", "电极", "电压", "CO₂ 来源"],
    missingBridgeMetricsEn: ["energy per product", "carbon efficiency", "source completeness"],
    missingBridgeMetricsZh: ["单位产物能耗", "碳效率", "来源完整性"],
    dataStatusKey: "literature-pending",
    quantitativeStatus: "pending",
    conditionIntensity: 48,
    dataReadiness: 54,
    fieldCompleteness: 58,
    demoMetrics: { conversion: 44, yield: 34, formationRate: 42, selectivity: 62, faradaicEfficiency: 56, tof: 28, ton: 31 },
  },
  {
    id: "co2-co-photo",
    taskEn: "CO₂ photoreduction to CO",
    taskZh: "CO₂ 光还原制 CO",
    domainKey: "co2-conversion",
    modeKey: "photo",
    feedstockKey: "co2-hco3",
    productFamilyKey: "c1-products",
    productEn: "CO / C1 products",
    productZh: "CO / C1 产物",
    keyMetricsEn: ["product rate", "selectivity", "quantum yield", "light intensity"],
    keyMetricsZh: ["产物速率", "选择性", "量子效率", "光强"],
    conditionContextEn: ["light source", "wavelength", "reactor", "catalyst loading"],
    conditionContextZh: ["光源", "波长", "反应器", "催化剂负载"],
    missingBridgeMetricsEn: ["energy per product", "source completeness"],
    missingBridgeMetricsZh: ["单位产物能耗", "来源完整性"],
    dataStatusKey: "literature-pending",
    quantitativeStatus: "pending",
    conditionIntensity: 42,
    dataReadiness: 46,
    fieldCompleteness: 52,
    demoMetrics: { conversion: 36, yield: 24, formationRate: 48, selectivity: 58, faradaicEfficiency: null, tof: 35, ton: 34 },
  },
  {
    id: "biomass-platform-thermal",
    taskEn: "Biomass conversion to platform chemicals",
    taskZh: "生物质转化制平台化合物",
    domainKey: "biomass-conversion",
    modeKey: "thermal",
    feedstockKey: "glucose-biomass",
    productFamilyKey: "platform-chemicals",
    productEn: "platform chemicals",
    productZh: "平台化合物",
    keyMetricsEn: ["conversion", "selectivity", "yield", "condition severity"],
    keyMetricsZh: ["转化率", "选择性", "产率", "条件严苛度"],
    conditionContextEn: ["temperature", "solvent", "time", "substrate concentration"],
    conditionContextZh: ["温度", "溶剂", "时间", "底物浓度"],
    missingBridgeMetricsEn: ["condition severity", "product selectivity"],
    missingBridgeMetricsZh: ["条件严苛度", "目标产物选择性"],
    dataStatusKey: "structured",
    quantitativeStatus: "demo",
    conditionIntensity: 72,
    dataReadiness: 63,
    fieldCompleteness: 70,
    demoMetrics: { conversion: 68, yield: 46, formationRate: 38, selectivity: 52, faradaicEfficiency: null, tof: 41, ton: 44 },
  },
  {
    id: "glucose-hco3-formic-case",
    taskEn: "Biomass-assisted CO₂ / HCO₃⁻ conversion to formic acid",
    taskZh: "生物质辅助 CO₂ / HCO₃⁻ 转化制甲酸",
    domainKey: "co2-biomass-coupling",
    modeKey: "thermal",
    feedstockKey: "glucose-biomass",
    productFamilyKey: "organic-acids",
    productEn: "formic / organic acids",
    productZh: "甲酸 / 有机酸",
    keyMetricsEn: ["yield", "selectivity", "carbon efficiency", "condition severity"],
    keyMetricsZh: ["产率", "选择性", "碳效率", "条件严苛度"],
    conditionContextEn: ["temperature", "solvent", "reaction time", "carbon source", "catalyst identity"],
    conditionContextZh: ["温度", "溶剂", "反应时间", "碳源", "催化剂身份"],
    missingBridgeMetricsEn: ["energy per product", "carbon efficiency", "condition severity", "source completeness"],
    missingBridgeMetricsZh: ["单位产物能耗", "碳效率", "条件严苛度", "来源完整性"],
    dataStatusKey: "collaborator-context",
    quantitativeStatus: "pending",
    conditionIntensity: 78,
    dataReadiness: 48,
    fieldCompleteness: 61,
    demoMetrics: { conversion: 50, yield: 41, formationRate: 36, selectivity: 48, faradaicEfficiency: null, tof: 32, ton: 36 },
    caseStudy: true,
  },
  {
    id: "glucose-organic-acids-thermal",
    taskEn: "Glucose conversion toward organic acids",
    taskZh: "葡萄糖转化制有机酸",
    domainKey: "organic-acid-production",
    modeKey: "thermal",
    feedstockKey: "glucose-biomass",
    productFamilyKey: "organic-acids",
    productEn: "formic / lactic / acetic / glycolic acid",
    productZh: "甲酸 / 乳酸 / 乙酸 / 乙醇酸",
    keyMetricsEn: ["conversion", "selectivity", "yield", "acid distribution"],
    keyMetricsZh: ["转化率", "选择性", "产率", "酸产物分布"],
    conditionContextEn: ["temperature", "redox environment", "solvent", "time"],
    conditionContextZh: ["温度", "氧化还原环境", "溶剂", "时间"],
    missingBridgeMetricsEn: ["condition severity", "product selectivity", "source completeness"],
    missingBridgeMetricsZh: ["条件严苛度", "目标产物选择性", "来源完整性"],
    dataStatusKey: "structured",
    quantitativeStatus: "demo",
    conditionIntensity: 66,
    dataReadiness: 60,
    fieldCompleteness: 66,
    demoMetrics: { conversion: 57, yield: 39, formationRate: 33, selectivity: 46, faradaicEfficiency: null, tof: 34, ton: 37 },
    caseStudy: true,
  },
  {
    id: "organic-selective-oxidation",
    taskEn: "Organic selective oxidation",
    taskZh: "有机选择性氧化",
    domainKey: "organic-transformation",
    modeKey: "thermal",
    feedstockKey: "organic-substrate",
    productFamilyKey: "oxidation-products",
    productEn: "oxidation products",
    productZh: "氧化产物",
    keyMetricsEn: ["conversion", "selectivity", "yield", "recyclability"],
    keyMetricsZh: ["转化率", "选择性", "产率", "循环性能"],
    conditionContextEn: ["substrate scope", "oxidant", "solvent", "time"],
    conditionContextZh: ["底物范围", "氧化剂", "溶剂", "时间"],
    missingBridgeMetricsEn: ["condition severity", "source completeness"],
    missingBridgeMetricsZh: ["条件严苛度", "来源完整性"],
    dataStatusKey: "structured",
    quantitativeStatus: "demo",
    conditionIntensity: 58,
    dataReadiness: 68,
    fieldCompleteness: 72,
    demoMetrics: { conversion: 64, yield: 45, formationRate: 31, selectivity: 64, faradaicEfficiency: null, tof: 48, ton: 52 },
  },
  {
    id: "photocatalytic-degradation",
    taskEn: "Photocatalytic pollutant degradation",
    taskZh: "光催化污染物降解",
    domainKey: "environmental-catalysis",
    modeKey: "photo",
    feedstockKey: "pollutant-water",
    productFamilyKey: "degradation-products",
    productEn: "degradation products",
    productZh: "降解产物",
    keyMetricsEn: ["removal efficiency", "rate", "mineralization efficiency", "stability"],
    keyMetricsZh: ["去除效率", "速率", "矿化效率", "稳定性"],
    conditionContextEn: ["pollutant concentration", "water matrix", "light source", "analysis method"],
    conditionContextZh: ["污染物浓度", "水体基质", "光源", "分析方法"],
    missingBridgeMetricsEn: ["condition severity", "source completeness", "LCA/TEA indicators"],
    missingBridgeMetricsZh: ["条件严苛度", "来源完整性", "LCA/TEA 指标"],
    dataStatusKey: "literature-pending",
    quantitativeStatus: "pending",
    conditionIntensity: 38,
    dataReadiness: 42,
    fieldCompleteness: 47,
    demoMetrics: { conversion: 30, yield: 20, formationRate: 54, selectivity: 29, faradaicEfficiency: null, tof: 40, ton: 30 },
  },
  {
    id: "water-treatment-electro",
    taskEn: "Electrochemical water treatment catalysis",
    taskZh: "电化学水处理催化",
    domainKey: "environmental-catalysis",
    modeKey: "electro",
    feedstockKey: "pollutant-water",
    productFamilyKey: "degradation-products",
    productEn: "treated stream / degradation products",
    productZh: "处理后流体 / 降解产物",
    keyMetricsEn: ["removal efficiency", "energy input", "toxicity signal", "source completeness"],
    keyMetricsZh: ["去除效率", "能量输入", "毒性信号", "来源完整性"],
    conditionContextEn: ["water matrix", "voltage", "pollutant concentration", "analysis method"],
    conditionContextZh: ["水体基质", "电压", "污染物浓度", "分析方法"],
    missingBridgeMetricsEn: ["energy per product", "condition severity", "source completeness"],
    missingBridgeMetricsZh: ["单位产物能耗", "条件严苛度", "来源完整性"],
    dataStatusKey: "future-scope",
    quantitativeStatus: "pending",
    conditionIntensity: 52,
    dataReadiness: 34,
    fieldCompleteness: 42,
    demoMetrics: { conversion: 28, yield: 18, formationRate: 35, selectivity: 22, faradaicEfficiency: 40, tof: 24, ton: 23 },
  },
]

export function labelFor(options, key, lang) {
  const item = options.find(option => option.key === key)
  if (!item) return key
  return lang === "zh" ? item.zh : item.en
}

export function filterTasks(tasks, filters) {
  return tasks.filter(task => (
    (filters.domain === "all" || task.domainKey === filters.domain) &&
    (filters.mode === "all" || task.modeKey === filters.mode) &&
    (filters.feedstock === "all" || task.feedstockKey === filters.feedstock) &&
    (filters.productFamily === "all" || task.productFamilyKey === filters.productFamily) &&
    (filters.dataStatus === "all" || task.dataStatusKey === filters.dataStatus)
  ))
}

export function buildStats(tasks) {
  const domains = new Set(tasks.map(task => task.domainKey)).size
  const modes = new Set(tasks.map(task => task.modeKey)).size
  const productFamilies = new Set(tasks.map(task => task.productFamilyKey)).size
  const pending = tasks.filter(task => task.quantitativeStatus !== "curated").length
  return [
    { key: "domains", en: "reaction domains", zh: "反应领域", value: domains },
    { key: "modes", en: "catalytic modes", zh: "催化方式", value: modes },
    { key: "products", en: "product families", zh: "产物族", value: productFamilies },
    { key: "tasks", en: "task rows", zh: "任务行", value: tasks.length },
    { key: "pending", en: "pending curation", zh: "待整理", value: pending },
  ]
}

export function analyzeComparability(left, right, lang = "en") {
  if (!left || !right) {
    return {
      id: "empty",
      taskA: left,
      taskB: right,
      metricSimilarity: 20,
      conditionSimilarity: 20,
      statusKey: "not-comparable",
      statusEn: "Not directly comparable",
      statusZh: "不建议直接比较",
      reasonEn: "Select two catalysis tasks to assess comparability.",
      reasonZh: "可比性评估需要两个催化任务。",
      missingBridgeMetricsEn: [],
      missingBridgeMetricsZh: [],
    }
  }
  const sharedMetrics = left.keyMetricsEn.filter(metric => right.keyMetricsEn.map(item => item.toLowerCase()).includes(metric.toLowerCase()))
  const sameDomain = left.domainKey === right.domainKey
  const sameMode = left.modeKey === right.modeKey
  const sameProduct = left.productFamilyKey === right.productFamilyKey
  const metricSimilarity = Math.min(92, 25 + sharedMetrics.length * 16 + (sameDomain ? 16 : 0) + (sameProduct ? 10 : 0))
  const conditionSimilarity = Math.min(92, 24 + (sameMode ? 24 : 0) + (sameDomain ? 14 : 0) + Math.max(0, 18 - Math.abs(left.conditionIntensity - right.conditionIntensity) / 2))
  let statusKey = "metric-mismatch"
  if (metricSimilarity >= 60 && conditionSimilarity >= 60) statusKey = "comparable"
  else if (metricSimilarity >= 60 && conditionSimilarity < 60) statusKey = "condition-normalization"
  else if (metricSimilarity < 60 && conditionSimilarity >= 60) statusKey = "metric-mismatch"
  else statusKey = "not-comparable"
  const statusMap = {
    comparable: ["Comparable", "可比较"],
    "condition-normalization": ["Needs condition normalization", "需要条件归一化"],
    "metric-mismatch": ["Metric mismatch", "指标不匹配"],
    "not-comparable": ["Not directly comparable", "不建议直接比较"],
  }
  const missingBridgeMetricsEn = Array.from(new Set([...(left.missingBridgeMetricsEn || []), ...(right.missingBridgeMetricsEn || [])])).slice(0, 5)
  const missingBridgeMetricsZh = Array.from(new Set([...(left.missingBridgeMetricsZh || []), ...(right.missingBridgeMetricsZh || [])])).slice(0, 5)
  return {
    id: `${left.id}__${right.id}`,
    taskA: left,
    taskB: right,
    metricSimilarity,
    conditionSimilarity,
    statusKey,
    statusEn: statusMap[statusKey][0],
    statusZh: statusMap[statusKey][1],
    reasonEn: statusKey === "comparable"
      ? "Metric system and condition context are close enough for early-stage comparison after provenance review."
      : statusKey === "condition-normalization"
        ? "Metrics are related, but condition context needs normalization before comparison."
        : statusKey === "metric-mismatch"
          ? "Condition context is related, but metric systems need bridge metrics."
          : "Metric system and condition context are both too sparse or mismatched for direct comparison.",
    reasonZh: statusKey === "comparable"
      ? "指标体系和条件语境较接近，可在来源复核后进行早期比较。"
      : statusKey === "condition-normalization"
        ? "指标相关，但条件语境需要归一化后再比较。"
        : statusKey === "metric-mismatch"
          ? "条件语境相关，但指标体系需要桥梁指标。"
          : "指标体系和条件语境都不足或差异较大，不建议直接比较。",
    missingBridgeMetricsEn,
    missingBridgeMetricsZh,
  }
}

export function buildComparisonPoints(tasks) {
  const pairs = []
  for (let i = 0; i < tasks.length; i += 1) {
    for (let j = i + 1; j < tasks.length; j += 1) {
      pairs.push(analyzeComparability(tasks[i], tasks[j]))
    }
  }
  return pairs.slice(0, 18)
}

export function enrichTaskForCharts(task, lang = "en") {
  return {
    ...task,
    domainLabel: labelFor(REACTION_DOMAINS, task.domainKey, lang),
    modeLabel: labelFor(CATALYTIC_MODES, task.modeKey, lang),
    feedstockLabel: labelFor(FEEDSTOCKS, task.feedstockKey, lang),
    productFamilyLabel: labelFor(PRODUCT_FAMILIES, task.productFamilyKey, lang),
    dataStatusLabel: labelFor(DATA_STATUSES, task.dataStatusKey, lang),
    z: Math.max(48, task.fieldCompleteness),
  }
}
