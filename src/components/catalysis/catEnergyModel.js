// @ts-nocheck
export const CAT_MOF_OPTIONS = [
  { id: "none", labelZh: "No MOF", labelEn: "No MOF", eaShift: 0, deltaEShift: 0, priorityBoost: 0, risk: 0, evidenceLevel: "A" },
  { id: "uio66nh2", labelZh: "UiO-66-NH2", labelEn: "UiO-66-NH2", eaShift: -7, deltaEShift: -1, priorityBoost: 10, risk: -4, evidenceLevel: "C" },
  { id: "mil101", labelZh: "MIL-101", labelEn: "MIL-101", eaShift: -5, deltaEShift: -2, priorityBoost: 7, risk: 2, evidenceLevel: "C" },
  { id: "hkust1", labelZh: "HKUST-1", labelEn: "HKUST-1", eaShift: -6, deltaEShift: -1, priorityBoost: 6, risk: 10, evidenceLevel: "D" },
  { id: "current", labelZh: "Current candidate", labelEn: "Current candidate", eaShift: -4, deltaEShift: -1, priorityBoost: 5, risk: 4, evidenceLevel: "C" },
]

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function zoneForProgress(progress, lang = "en") {
  if (progress < 34) return { id: "adsorption", labelZh: "吸附区", labelEn: "Adsorption zone" }
  if (progress < 70) return { id: "transition", labelZh: "过渡态区", labelEn: "Transition-state zone" }
  return { id: "product", labelZh: "产物释放区", labelEn: "Product-release zone" }
}

export function catScienceZoneForPoint(point = {}) {
  const x = Number(point.x)
  const y = Number(point.y)
  if (Number.isFinite(y) && y < 134) {
    return {
      id: "hot-spot-map",
      reactionZoneId: "transition",
      labelZh: "热区图",
      labelEn: "Hot Spot Map",
      metric: "OACS x DMRS synergy",
      metricZh: "OACS x DMRS 协同得分",
      insight: "The hot spot shows coupled scaffold robustness and metal-oxo active-site value, not final catalytic proof.",
      insightZh: "热区图展示骨架稳健性与金属氧活性位点价值的耦合关系，不是最终催化证明。",
      actionLabel: "View hot spot map",
      actionLabelZh: "查看热区图",
      actionId: "organic-acid-final-hot-spot-map",
    }
  }
  if (x < 220) {
    return {
      id: "hydrothermal-gate",
      reactionZoneId: "adsorption",
      labelZh: "水热硬阈值",
      labelEn: "Hydrothermal Gate",
      metric: ">=150 C water evidence",
      metricZh: ">=150 C 水相证据",
      insight: "Hydrothermal gate comes before high surface area. A candidate without >=150 C evidence should not enter final ranking.",
      insightZh: "水热硬阈值优先于高比表面积。缺少 >=150 C 证据的候选不应进入最终推荐。",
      actionLabel: "View framework gate",
      actionLabelZh: "查看骨架硬阈值",
      actionId: "organic-acid-final-framework-ranking",
    }
  }
  if (x < 356) {
    return {
      id: "oacs-ranking",
      reactionZoneId: "adsorption",
      labelZh: "OACS 排序",
      labelEn: "OACS Ranking",
      metric: "OACS descriptor balance",
      metricZh: "OACS 描述符平衡",
      insight: "OACS balances hydrothermal evidence, pore accessibility, C1 intermediate access, and collapse risk.",
      insightZh: "OACS 平衡水热证据、孔道可及性、C1 中间体可达性和坍塌风险。",
      actionLabel: "View OACS ranking",
      actionLabelZh: "查看 OACS 排序",
      actionId: "organic-acid-final-framework-ranking",
    }
  }
  if (x < 500) {
    return {
      id: "dmrs-recommendation",
      reactionZoneId: "transition",
      labelZh: "DMRS 第二金属",
      labelEn: "DMRS / Metal Recommendation",
      metric: "DMRS metal-oxo value",
      metricZh: "DMRS 金属氧活性价值",
      insight: "Mo is a primary hypothesis, while W remains a strong backup. Both need validation.",
      insightZh: "Mo 是主要假设，W 仍是强备选；两者都需要验证。",
      actionLabel: "View Mo vs W",
      actionLabelZh: "查看 Mo vs W",
      actionId: "organic-acid-final-mo-vs-w",
    }
  }
  if (x < 620) {
    return {
      id: "exafs",
      reactionZoneId: "transition",
      labelZh: "EXAFS 证伪",
      labelEn: "EXAFS Falsification",
      metric: "Mo-O / Mo-Mo scattering",
      metricZh: "Mo-O / Mo-Mo 散射",
      insight: "Strong Mo-Mo scattering would falsify the isolated Mo-oxo anchoring hypothesis.",
      insightZh: "强 Mo-Mo 散射会证伪孤立 Mo-oxo 锚定假设。",
      actionLabel: "View EXAFS hypothesis",
      actionLabelZh: "查看 EXAFS 假设",
      actionId: "organic-acid-final-exafs",
    }
  }
  return {
    id: "candidate-trace",
    reactionZoneId: "product",
    labelZh: "候选报告追踪",
    labelEn: "Candidate Report Trace",
    metric: "Evidence boundary",
    metricZh: "证据边界",
    insight: "Trace output keeps demo/proxy status visible before any experimental claim.",
    insightZh: "报告追踪会在任何实验结论前保留 demo/proxy 状态。",
    actionLabel: "View validation roadmap",
    actionLabelZh: "查看验证路线",
    actionId: "organic-acid-final-validation-roadmap",
  }
}

export function evidenceRank(level) {
  return { A: 4, B: 3, C: 2, D: 1 }[level] || 2
}

function weighted(descriptor, pathway, field) {
  const weight = pathway?.descriptorWeights?.[descriptor.id] ?? 1
  return Number(descriptor[field] || 0) * weight
}

export function computeCatEnergyState({ pathway, descriptors = [], selectedDescriptorIds = [], mof, catProgress = 52, catScienceZone = null }) {
  const active = descriptors.filter(item => selectedDescriptorIds.includes(item.id))
  const zone = catScienceZone || zoneForProgress(catProgress)
  const reactionZoneId = zone.reactionZoneId || zone.id
  const zoneEa = reactionZoneId === "transition" ? -6 : reactionZoneId === "adsorption" ? -2 : 1
  const zoneDeltaE = reactionZoneId === "product" ? -3 : 0
  const descriptorEa = active.reduce((sum, item) => sum + weighted(item, pathway, "activationEnergyDelta"), 0)
  const descriptorDeltaE = active.reduce((sum, item) => sum + weighted(item, pathway, "reactionEnergyDelta"), 0)
  const tsStabilization = active.reduce((sum, item) => sum + weighted(item, pathway, "transitionStateStabilization"), 0) + (reactionZoneId === "transition" ? 16 : 0)
  const reactantAdsorption = active.reduce((sum, item) => sum + weighted(item, pathway, "reactantStabilization"), 0) + (reactionZoneId === "adsorption" ? 12 : 0)
  const productStabilization = active.reduce((sum, item) => sum + weighted(item, pathway, "productStabilization"), 0) + (reactionZoneId === "product" ? 8 : 0)
  const riskPenalty = clamp(active.reduce((sum, item) => sum + weighted(item, pathway, "riskPenalty"), 0) + Number(mof?.risk || 0), 0, 60)
  const evidenceLevel = active.reduce((lowest, item) => evidenceRank(item.evidenceLevel) < evidenceRank(lowest) ? item.evidenceLevel : lowest, mof?.evidenceLevel || pathway?.evidenceLevel || "C")
  const baselineEa = Number(pathway?.baselineEa || 72)
  const mofEa = clamp(baselineEa + Number(mof?.eaShift || 0) + descriptorEa + zoneEa + riskPenalty * 0.08, 32, 96)
  const baselineDeltaE = Number(pathway?.baselineDeltaE || -6)
  const mofDeltaE = baselineDeltaE + Number(mof?.deltaEShift || 0) + descriptorDeltaE + zoneDeltaE + productStabilization * 0.04
  const activationEnergyDelta = mofEa - baselineEa
  const priorityScore = clamp(58 + Number(mof?.priorityBoost || 0) + Math.abs(Math.min(0, activationEnergyDelta)) * 1.2 + tsStabilization * 0.22 - riskPenalty * 0.85 - (evidenceLevel === "D" ? 10 : 0), 0, 100)
  const priority = priorityScore >= 74 ? "high" : priorityScore >= 52 ? "medium" : "low"
  const productReleaseRisk = riskPenalty >= 24 || productStabilization >= 16 ? "high" : riskPenalty >= 12 || productStabilization >= 9 ? "medium" : "low"
  const mood = evidenceLevel === "D" ? "confused" : riskPenalty >= 24 ? "warning" : activationEnergyDelta > 0 ? "frown" : priority === "high" && activationEnergyDelta <= -14 ? "stars" : "happy"
  return {
    activeDescriptors: active,
    zone,
    baselineEa,
    mofEa: Math.round(mofEa),
    baselineDeltaE,
    mofDeltaE: Math.round(mofDeltaE),
    activationEnergyDelta: Math.round(activationEnergyDelta),
    reactionEnergyDelta: Math.round(mofDeltaE - baselineDeltaE),
    tsStabilization: Math.round(tsStabilization),
    reactantAdsorption: Math.round(reactantAdsorption),
    productReleaseRisk,
    priorityScore: Math.round(priorityScore),
    priority,
    riskPenalty: Math.round(riskPenalty),
    evidenceLevel,
    mood,
    contributions: [
      ...active.map(item => ({
        id: item.id,
        labelZh: item.labelZh,
        labelEn: item.labelEn,
        activationEnergyDelta: Math.round(weighted(item, pathway, "activationEnergyDelta")),
        reactionEnergyDelta: Math.round(weighted(item, pathway, "reactionEnergyDelta")),
        riskPenalty: Math.round(weighted(item, pathway, "riskPenalty")),
        evidenceLevel: item.evidenceLevel,
        mechanismNoteZh: item.mechanismNoteZh,
        mechanismNoteEn: item.mechanismNoteEn,
        validationSuggestionZh: item.validationSuggestionZh,
        validationSuggestionEn: item.validationSuggestionEn,
      })),
      {
        id: `zone-${zone.id}`,
        labelZh: zone.labelZh,
        labelEn: zone.labelEn,
        activationEnergyDelta: zoneEa,
        reactionEnergyDelta: zoneDeltaE,
        riskPenalty: 0,
        evidenceLevel,
        mechanismNoteZh: "小猫位置用于解释当前反应坐标区域的关注重点。",
        mechanismNoteEn: "The cat position explains which reaction-coordinate zone is currently emphasized.",
        validationSuggestionZh: "结合路径节点、同条件实验和过渡态计算复核。",
        validationSuggestionEn: "Check against pathway nodes, same-condition experiments, and transition-state calculations.",
      },
    ],
  }
}
