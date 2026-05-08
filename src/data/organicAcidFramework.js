export const organicAcidCaseSummary = {
  titleEn: "Organic Acid Case Study",
  titleZh: "有机酸案例研究",
  pathwayEn: "Biomass-assisted CO₂/HCO₃⁻ conversion toward organic acids",
  pathwayZh: "生物质辅助 CO₂/HCO₃⁻ 转化制有机酸",
}

export const organicAcidPathwayLayers = [
  {
    key: "carbon",
    en: "Carbon input",
    zh: "碳源输入",
    nodesEn: ["CO₂ / HCO₃⁻", "biomass-derived substrates"],
    nodesZh: ["CO₂ / HCO₃⁻", "生物质衍生底物"],
  },
  {
    key: "oxygenates",
    en: "Oxygenate family",
    zh: "含氧产物族",
    nodesEn: ["C1 oxygenates", "C2 oxygenates", "C3 oxygenates"],
    nodesZh: ["C1 含氧产物", "C2 含氧产物", "C3 含氧产物"],
  },
  {
    key: "products",
    en: "Organic acid targets",
    zh: "有机酸目标产物",
    nodesEn: ["formic acid / formate", "acetic acid", "lactic acid", "glycolic acid"],
    nodesZh: ["甲酸 / 甲酸盐", "乙酸", "乳酸", "乙醇酸"],
  },
]

export const organicAcidProductFamilies = [
  {
    key: "formic",
    en: "Formic acid / formate",
    zh: "甲酸 / 甲酸盐",
    carbon: "C1",
    routeEn: "CO₂ / HCO₃⁻ reduction or biomass-assisted C1 oxygenate formation",
    routeZh: "CO₂ / HCO₃⁻ 还原或生物质辅助 C1 含氧产物形成",
    metricsEn: "yield, selectivity, carbon efficiency, formation rate",
    metricsZh: "产率、选择性、碳效率、生成速率",
    evidenceEn: "quantification method, carbon source tracing, carbon balance",
    evidenceZh: "定量方法、碳源追踪、碳平衡",
  },
  {
    key: "acetic",
    en: "Acetic acid",
    zh: "乙酸",
    carbon: "C2",
    routeEn: "C-C coupling or biomass-derived oxygenate conversion context",
    routeZh: "C-C 偶联或生物质衍生含氧产物转化语境",
    metricsEn: "yield, selectivity, product distribution, unit consistency",
    metricsZh: "产率、选择性、产物分布、单位一致性",
    evidenceEn: "product separation, calibration curve, source record",
    evidenceZh: "产物分离、标准曲线、来源记录",
  },
  {
    key: "lactic",
    en: "Lactic acid",
    zh: "乳酸",
    carbon: "C3",
    routeEn: "biomass-derived substrate conversion under thermal or assisted catalytic context",
    routeZh: "热催或辅助催化语境下的生物质衍生底物转化",
    metricsEn: "yield, selectivity, substrate conversion, condition severity",
    metricsZh: "产率、选择性、底物转化率、条件严苛度",
    evidenceEn: "substrate accounting, HPLC / NMR confirmation, reaction condition record",
    evidenceZh: "底物核算、HPLC / NMR 确认、反应条件记录",
  },
  {
    key: "glycolic",
    en: "Glycolic acid",
    zh: "乙醇酸",
    carbon: "C2",
    routeEn: "oxygenate rearrangement or selective oxidation context",
    routeZh: "含氧产物重排或选择性氧化语境",
    metricsEn: "yield, selectivity, formation rate, carbon efficiency",
    metricsZh: "产率、选择性、生成速率、碳效率",
    evidenceEn: "LC-MS / HPLC assignment, carbon balance, source DOI",
    evidenceZh: "LC-MS / HPLC 指认、碳平衡、来源 DOI",
  },
]

export const organicAcidSchemaGroups = [
  {
    key: "catalyst",
    en: "Catalyst information",
    zh: "催化剂信息",
    fieldsEn: ["catalyst name", "composition", "active site", "support / MOF structure", "preparation method"],
    fieldsZh: ["催化剂名称", "组成", "活性位点", "载体 / MOF 结构", "制备方法"],
  },
  {
    key: "conditions",
    en: "Reaction conditions",
    zh: "反应条件",
    fieldsEn: ["CO₂ source", "HCO₃⁻ source", "biomass substrate", "solvent", "temperature", "pressure", "reaction time", "pH", "light / voltage / thermal input"],
    fieldsZh: ["CO₂ 来源", "HCO₃⁻ 来源", "生物质底物", "溶剂", "温度", "压力", "反应时间", "pH", "光 / 电压 / 热输入"],
  },
  {
    key: "metrics",
    en: "Product metrics",
    zh: "产物指标",
    fieldsEn: ["yield", "selectivity", "carbon efficiency", "formation rate", "energy input", "unit"],
    fieldsZh: ["产率", "选择性", "碳效率", "生成速率", "能量输入", "单位"],
  },
  {
    key: "evidence",
    en: "Evidence records",
    zh: "证据记录",
    fieldsEn: ["quantification method", "GC / HPLC / NMR / LC-MS", "isotope labeling", "carbon balance", "DOI / source", "evidence level"],
    fieldsZh: ["定量方法", "GC / HPLC / NMR / LC-MS", "同位素标记", "碳平衡", "DOI / 来源", "证据等级"],
  },
]

export const organicAcidComparabilityRules = [
  {
    en: "Feedstocks may differ across CO₂, HCO₃⁻, glucose, and other biomass-derived substrates.",
    zh: "CO₂、HCO₃⁻、葡萄糖和其他生物质衍生底物之间的原料不同。",
  },
  {
    en: "Yield, selectivity, formation rate, and carbon efficiency may use incompatible units.",
    zh: "产率、选择性、生成速率和碳效率可能使用不兼容的单位。",
  },
  {
    en: "Quantification methods differ across GC, HPLC, NMR, LC-MS, or mixed analytical workflows.",
    zh: "GC、HPLC、NMR、LC-MS 或混合分析流程之间的定量方法不同。",
  },
  {
    en: "Carbon source tracing, carbon balance, and energy input are often missing.",
    zh: "碳源追踪、碳平衡和能量输入信息经常缺失。",
  },
  {
    en: "Condition severity can differ across thermal, photo, electrochemical, and photothermal contexts.",
    zh: "热催、光催、电催和光热催化语境下的条件严苛度可能不同。",
  },
]

export const organicAcidEvidenceChecklist = [
  { key: "carbonSource", en: "carbon source traced", zh: "碳源已追踪" },
  { key: "quantification", en: "product quantification method reported", zh: "产物定量方法已报告" },
  { key: "carbonBalance", en: "carbon balance available", zh: "碳平衡可用" },
  { key: "units", en: "comparable yield/selectivity units", zh: "产率 / 选择性单位可比较" },
  { key: "energy", en: "energy input available", zh: "能量输入可用" },
  { key: "severity", en: "condition severity computable", zh: "条件严苛度可计算" },
  { key: "doi", en: "source DOI available", zh: "来源 DOI 可用" },
]
