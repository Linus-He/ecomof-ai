export const DESCRIPTOR_PRESETS = {
  coreMof8: {
    key: "coreMof8",
    label: "Core MOF 8",
    labelZh: "核心 MOF 8 指标",
    descriptorKeys: [
      "surfaceArea",
      "poreSizeA",
      "poreVolume",
      "co2Uptake",
      "bandGap",
      "waterStability",
      "thermalStability",
      "toxicityConcern",
    ],
    description: "Default general MOF descriptor set for screening, performance summary, and library curation.",
    descriptionZh: "用于筛选、性能摘要和库整理的默认通用 MOF 描述符集。",
  },
  adsorptionFocused: {
    key: "adsorptionFocused",
    label: "Adsorption-focused",
    labelZh: "吸附导向",
    descriptorKeys: ["surfaceArea", "poreSizeA", "poreVolume", "co2Uptake", "selectivity"],
    description: "Adsorption-oriented descriptor set with planned selectivity support.",
    descriptionZh: "吸附导向描述符集，包含后续选择性支持。",
  },
  stabilityFocused: {
    key: "stabilityFocused",
    label: "Stability-focused",
    labelZh: "稳定性导向",
    descriptorKeys: ["waterStability", "thermalStability", "synthesisTemperature", "solventConcern"],
    description: "Stability and synthesis-context descriptor set for future expansion.",
    descriptionZh: "面向后续扩展的稳定性与合成上下文描述符集。",
  },
  sustainabilityFocused: {
    key: "sustainabilityFocused",
    label: "Sustainability-focused",
    labelZh: "可持续导向",
    descriptorKeys: ["toxicityConcern", "precursorCost", "solventConcern", "lifecycleGwp", "lifecyclePed"],
    description: "Sustainability and lifecycle descriptor set; several descriptors are planned placeholders.",
    descriptionZh: "可持续与生命周期描述符集；其中部分为预留字段。",
  },
  catalysisFormate3: {
    key: "catalysisFormate3",
    label: "Formate CRITIC 3",
    labelZh: "产甲酸 CRITIC 3 指标",
    descriptorKeys: ["d_stab", "d_barrier", "d_select"],
    description: "Existing catalysis formate CRITIC case descriptors.",
    descriptionZh: "现有产甲酸路径 CRITIC 案例描述符。",
  },
  custom: {
    key: "custom",
    label: "Custom",
    labelZh: "自定义",
    descriptorKeys: [],
    description: "User-selected descriptor set from the registry.",
    descriptionZh: "从注册中心选择的自定义描述符集。",
  },
}

export function getDescriptorPreset(presetKey = "coreMof8") {
  return DESCRIPTOR_PRESETS[presetKey] || DESCRIPTOR_PRESETS.coreMof8
}

export function getDescriptorPresetKeys() {
  return Object.keys(DESCRIPTOR_PRESETS)
}
