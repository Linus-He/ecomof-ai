export const DESCRIPTOR_GROUPS = {
  porosity: { key: "porosity", label: "Porosity", labelZh: "孔结构" },
  adsorption: { key: "adsorption", label: "Adsorption", labelZh: "吸附" },
  stability: { key: "stability", label: "Stability", labelZh: "稳定性" },
  electronic: { key: "electronic", label: "Electronic", labelZh: "电子性质" },
  sustainability: { key: "sustainability", label: "Sustainability", labelZh: "可持续性" },
  synthesis: { key: "synthesis", label: "Synthesis / Planned", labelZh: "合成 / 预留" },
  catalysis: { key: "catalysis", label: "Catalysis case", labelZh: "催化案例" },
}

export const DESCRIPTOR_GROUP_ORDER = [
  "porosity",
  "adsorption",
  "stability",
  "electronic",
  "sustainability",
  "synthesis",
  "catalysis",
]

export function getDescriptorGroup(groupKey) {
  return DESCRIPTOR_GROUPS[groupKey] || { key: groupKey, label: groupKey, labelZh: groupKey }
}
