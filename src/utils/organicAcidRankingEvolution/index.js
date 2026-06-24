function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeNumber(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

function bestAlRow(stage = {}) {
  return asArray(stage.routeRankings)
    .filter(row => row.hostMof === "Al-MOF")
    .sort((a, b) => safeNumber(a.rank, 999) - safeNumber(b.rank, 999))[0]
}

function routeAt(stage = {}, routeId = "") {
  return asArray(stage.routeRankings).find(row => row.routeId === routeId)
}

function stageByVersion(stages, version) {
  return stages.find(stage => stage.version === version) || {}
}

function topGuest(stage = {}) {
  return asArray(stage.top5Routes)[0]?.guestMetal || asArray(stage.routeRankings)[0]?.guestMetal || "pending"
}

function topHost(stage = {}) {
  return asArray(stage.top5Routes)[0]?.hostMof || asArray(stage.routeRankings)[0]?.hostMof || "pending"
}

function buildRouteSeries(stages) {
  const routeIds = []
  for (const stage of stages) {
    for (const row of asArray(stage.top5Routes)) {
      if (row.routeId && !routeIds.includes(row.routeId)) routeIds.push(row.routeId)
    }
  }
  return routeIds.map(routeId => {
    const first = stages.map(stage => routeAt(stage, routeId)).find(Boolean) || {}
    return {
      routeId,
      routeName: first.route || routeId,
      points: stages.map(stage => {
        const row = routeAt(stage, routeId)
        return {
          stage: stage.stage,
          version: stage.version,
          rank: row?.rank ?? asArray(stage.routeRankings).length + 1,
          score: row?.score ?? 0,
          present: Boolean(row),
        }
      }),
    }
  })
}

export function buildDescriptorEvolutionReport(log = {}, audit = {}, priceTable = {}) {
  const stages = asArray(log.stages)
  if (!stages.length) return null
  const currentStage = stages.at(-1) || {}
  const v397 = stageByVersion(stages, "V3.9.7")
  const topGuests = stages.map(topGuest)
  const stableGuest = topGuests.every(value => value === topGuests[0]) ? topGuests[0] : null
  const winningHosts = Array.from(new Set(stages.map(topHost)))
  const al397 = bestAlRow(v397)
  const candidatesAheadOfAl = asArray(v397.routeRankings)
    .filter(row => safeNumber(row.rank, 999) < safeNumber(al397?.rank, 999))
    .map(row => row.route)
  const placeholderLeader = asArray(v397.routeRankings)[0]
  const realPriceSameRoute = routeAt(currentStage, placeholderLeader?.routeId)
  const priceRows = asArray(priceTable.records)
  const confidenceCounts = priceRows.reduce((acc, row) => {
    const key = row.confidence || "unknown"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const fallbackPriceCount = priceRows.filter(row => row.dataGrade === "fallback").length
  const impact = log.descriptorAblation?.impactSummary || {}
  const proxy = audit.proxyValidity || {}
  const family = audit.familyFairness || {}
  const sensitivity = audit.rankingSensitivity?.summary || {}
  const analyses = [
    {
      id: "robust",
      titleZh: "稳健结论",
      titleEn: "Robust conclusion",
      bodyZh: stableGuest
        ? `${stableGuest} 作为客体 / 掺杂金属在 ${stages.length} 个阶段的榜首路线中持续出现，因此“客体选择”比主体名次更稳健。`
        : `榜首客体在 ${stages.length} 个阶段并不一致，客体选择仍需视为敏感结论。`,
      bodyEn: stableGuest
        ? `${stableGuest} remains the guest/dopant metal in the top route across all ${stages.length} stages, so guest selection is more robust than host rank.`
        : `The top-route guest changes across ${stages.length} stages, so guest selection remains sensitive.`,
    },
    {
      id: "sensitive",
      titleZh: "敏感结论",
      titleEn: "Sensitive conclusion",
      bodyZh: `${stages.length} 个阶段出现 ${winningHosts.length} 个不同榜首主体（${winningHosts.join("、")}）；主体名次对数据来源、描述符集合与聚合模型高度敏感，不宜作为硬结论。`,
      bodyEn: `${stages.length} stages produce ${winningHosts.length} distinct winning hosts (${winningHosts.join(", ")}); host rank is highly sensitive to data source, descriptor set, and aggregation model.`,
    },
    {
      id: "economics",
      titleZh: "经济性效应",
      titleEn: "Economic effect",
      bodyZh: `${impact.summaryZh || "经济性消融结果待补充。"} V3.9.7 榜首路线在真实价格下由 #${placeholderLeader?.rank ?? "?"} 变为 #${realPriceSameRoute?.rank ?? "?"}，HGCPS ${placeholderLeader?.score ?? "?"} → ${realPriceSameRoute?.score ?? "?"}。`,
      bodyEn: `${impact.summaryEn || "Economic ablation is pending."} The V3.9.7 leader moves from #${placeholderLeader?.rank ?? "?"} to #${realPriceSameRoute?.rank ?? "?"} under real prices, with HGCPS ${placeholderLeader?.score ?? "?"} -> ${realPriceSameRoute?.score ?? "?"}.`,
    },
    {
      id: "honesty",
      titleZh: "诚实性背书",
      titleEn: "Integrity check",
      bodyZh: `预注册新描述符加入后，Al-MOF 最佳路线为 #${al397?.rank ?? v397.alMofRank ?? "?"}；其前仍有 ${candidatesAheadOfAl.join("、") || "其他候选"}。结果没有被事后调权以迁就预设答案。`,
      bodyEn: `After preregistered descriptors were added, the best Al-MOF route is #${al397?.rank ?? v397.alMofRank ?? "?"}, with ${candidatesAheadOfAl.join(", ") || "other candidates"} still ahead. No post-hoc tuning restores a preset answer.`,
    },
    {
      id: "limitation",
      titleZh: "当前局限",
      titleEn: "Current limitation",
      bodyZh: `V3.9.8 已替换十项指定价格，但仍是筛选级输入：high / medium / low 置信分别为 ${confidenceCounts.high || 0} / ${confidenceCounts.medium || 0} / ${confidenceCounts.low || 0} 条，另有 ${fallbackPriceCount} 条未提供金属价格保持 fallback；正式发表前仍需核验取价来源与日期。`,
      bodyEn: `V3.9.8 replaces the ten specified prices, but they remain screening inputs: high/medium/low confidence counts are ${confidenceCounts.high || 0}/${confidenceCounts.medium || 0}/${confidenceCounts.low || 0}, with ${fallbackPriceCount} unprovided metal prices still marked fallback. Publication requires source and price-date verification.`,
    },
  ]
  return {
    version: log.version || currentStage.version || "V3.9.8",
    stages,
    currentStage,
    routeSeries: buildRouteSeries(stages),
    analyses,
    audit: {
      compositeSpearman: proxy.composite?.spearmanRho ?? null,
      compositeValidity: proxy.composite?.validity || "pending",
      lowValidityDescriptors: asArray(proxy.lowValidityDescriptors),
      lowConfidenceFamilies: asArray(family.lowConfidenceFamilies),
      sensitivityScenarioCount: safeNumber(sensitivity.scenarioCount, 0),
      topRouteFlipFrequency: round(sensitivity.topRouteFlipFrequency, 3),
      fragility: sensitivity.fragility || "pending",
      mostSensitiveFactor: sensitivity.mostSensitiveFactor || "pending",
    },
    boundary: log.boundary || "Ranking evolution is methodological evidence, not experimental proof.",
  }
}
