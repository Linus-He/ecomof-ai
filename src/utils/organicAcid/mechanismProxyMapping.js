// @ts-nocheck
// V2.0-G Mechanism Proxy Layer.
//
// Rule-based mapping from MOF descriptors to CO2 -> organic acid (formate)
// mechanism proxy indicators. This is NOT a trained model. Method analogy only:
// the idea of multi-view, mechanism-informed features and ensemble/synergy
// descriptors is inspired by Han et al., Nature Communications 2024
// (10.1038/s41467-024-52550-9). We do NOT reproduce that paper's Li-S model,
// do NOT use Li-S target variables (Li2S adsorption energy, Li-S bond breaking,
// Li+ migration barrier), and do NOT train XGBoost / any black-box model.
//
// Every proxy is explainable and rule-based. When evidence is missing, the proxy
// is null ("insufficient evidence") instead of a guessed number. Proxies are
// mechanism hypotheses only — not DFT or experimental conclusions, and not a
// final recommendation.

const PROXY_KEYS = [
  "co2ActivationProxy",
  "formatePathwayProxy",
  "hydrothermalStabilityProxy",
  "poreTransportProxy",
  "metalSiteSynergyProxy",
  "competitionRiskProxy",
  "evidenceConfidenceProxy",
]

const ACTIVE_METALS = ["Cu", "Zr", "Fe", "Mo", "Zn", "Ni", "Co"]

function num(record = {}, key) {
  const descriptors = record.descriptors || {}
  const value = record[key] ?? descriptors[key]
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function round(value) {
  return value === null ? null : Math.round(value * 1000) / 1000
}

function normalizeProxyInput(value, lo, hi) {
  if (value === null) return null
  return clamp01((value - lo) / (hi - lo))
}

// Bell-shaped score: highest near `ideal`, falling off over `spread`.
function windowScore(value, ideal, spread) {
  if (value === null) return null
  return clamp01(1 - Math.abs(value - ideal) / spread)
}

function metalText(record) {
  return String(record.metalNode || (Array.isArray(record.metals) ? record.metals.join(" ") : "") || "")
}

export function buildMechanismProxies(record = {}) {
  const explanationsEn = {}
  const explanationsZh = {}
  const proxies = {}
  const missing = []

  const openMetalSite = num(record, "openMetalSiteProxy")
  const bandGap = num(record, "bandGap")
  const stability = num(record, "stabilityProxy")
  const hydrophilicity = num(record, "hydrophilicityProxy")
  const pld = num(record, "pldA") ?? num(record, "poreSizeA")
  const lcd = num(record, "lcdA")
  const poreVolume = num(record, "poreVolume")
  const voidFraction = num(record, "voidFraction")
  const metals = metalText(record)
  const hasActiveMetal = ACTIVE_METALS.some(metal => new RegExp(`(^|[^A-Za-z])${metal}([^a-z]|$)`).test(metals))

  // CO2 activation: open metal sites + redox-active metal node + moderate band gap.
  if (openMetalSite !== null || hasActiveMetal) {
    const base = openMetalSite !== null ? openMetalSite : 0.4
    const metalBonus = hasActiveMetal ? 0.15 : 0
    const gapTerm = bandGap !== null ? windowScore(bandGap, 2.5, 3) * 0.2 : 0
    proxies.co2ActivationProxy = round(clamp01(base * 0.7 + metalBonus + gapTerm))
    explanationsEn.co2ActivationProxy = "Open metal sites and a redox-active metal node favor CO2 binding/activation."
    explanationsZh.co2ActivationProxy = "开放金属位点与具氧化还原活性的金属节点有利于 CO2 结合/活化。"
  } else {
    proxies.co2ActivationProxy = null
    missing.push("co2ActivationProxy")
    explanationsEn.co2ActivationProxy = "Insufficient evidence: no open-metal-site proxy or active metal node."
    explanationsZh.co2ActivationProxy = "证据不足：缺少开放金属位点代理或活性金属节点。"
  }

  // Hydrothermal stability proxy: directly from documented stability proxy.
  if (stability !== null) {
    proxies.hydrothermalStabilityProxy = round(clamp01(stability))
    explanationsEn.hydrothermalStabilityProxy = "Derived from the documented framework stability proxy."
    explanationsZh.hydrothermalStabilityProxy = "来自已记录的骨架稳定性代理。"
  } else {
    proxies.hydrothermalStabilityProxy = null
    missing.push("hydrothermalStabilityProxy")
    explanationsEn.hydrothermalStabilityProxy = "Insufficient evidence: no stability proxy available."
    explanationsZh.hydrothermalStabilityProxy = "证据不足：缺少稳定性代理。"
  }

  // Pore transport proxy: pore window in a transport-friendly range + accessible volume.
  if (pld !== null) {
    const windowTerm = windowScore(pld, 9, 8)
    const volumeTerm = poreVolume !== null ? normalizeProxyInput(poreVolume, 0.2, 1.2) : (voidFraction !== null ? clamp01(voidFraction) : 0.5)
    proxies.poreTransportProxy = round(clamp01(windowTerm * 0.6 + volumeTerm * 0.4))
    explanationsEn.poreTransportProxy = "A moderate pore window plus accessible pore volume favors reactant/product transport."
    explanationsZh.poreTransportProxy = "适中的孔径窗口与可达孔体积有利于反应物/产物传质。"
  } else {
    proxies.poreTransportProxy = null
    missing.push("poreTransportProxy")
    explanationsEn.poreTransportProxy = "Insufficient evidence: no pore-size descriptor."
    explanationsZh.poreTransportProxy = "证据不足：缺少孔径描述符。"
  }

  // Metal-site synergy proxy (ensemble-effect analogy): Al-type scaffold node + a
  // second active metal site / open metal site working together.
  const hasScaffoldNode = /Al|Zr/.test(metals)
  if (openMetalSite !== null && (hasScaffoldNode || hasActiveMetal)) {
    const synergy = openMetalSite * 0.6 + (hasScaffoldNode ? 0.2 : 0) + (hasActiveMetal ? 0.2 : 0)
    proxies.metalSiteSynergyProxy = round(clamp01(synergy))
    explanationsEn.metalSiteSynergyProxy = "Scaffold metal node combined with an open / second active metal site suggests a cooperative site ensemble."
    explanationsZh.metalSiteSynergyProxy = "骨架金属节点与开放/第二活性金属位点结合，提示协同位点集合效应。"
  } else {
    proxies.metalSiteSynergyProxy = null
    missing.push("metalSiteSynergyProxy")
    explanationsEn.metalSiteSynergyProxy = "Insufficient evidence: needs an open-metal-site proxy plus a metal node."
    explanationsZh.metalSiteSynergyProxy = "证据不足：需要开放金属位点代理与金属节点。"
  }

  // Formate pathway proxy: builds on CO2 activation + moderate hydrophilicity, which
  // helps formate intermediate stabilization/desorption.
  if (proxies.co2ActivationProxy !== null && hydrophilicity !== null) {
    const hydroTerm = windowScore(hydrophilicity, 0.5, 0.6)
    proxies.formatePathwayProxy = round(clamp01(proxies.co2ActivationProxy * 0.6 + hydroTerm * 0.4))
    explanationsEn.formatePathwayProxy = "CO2 activation potential with moderate hydrophilicity supports a formate-type pathway hypothesis."
    explanationsZh.formatePathwayProxy = "CO2 活化潜力配合适中亲水性，支持甲酸型路径假设。"
  } else {
    proxies.formatePathwayProxy = null
    missing.push("formatePathwayProxy")
    explanationsEn.formatePathwayProxy = "Insufficient evidence: needs CO2 activation proxy and a hydrophilicity proxy."
    explanationsZh.formatePathwayProxy = "证据不足：需要 CO2 活化代理与亲水性代理。"
  }

  // Competition risk proxy: very large cavities / channels raise the risk of competing
  // pathways and poor selectivity. Higher value = higher risk.
  if (lcd !== null || poreVolume !== null) {
    const lcdTerm = lcd !== null ? normalizeProxyInput(lcd, 8, 30) : null
    const volTerm = poreVolume !== null ? normalizeProxyInput(poreVolume, 0.6, 2) : null
    const terms = [lcdTerm, volTerm].filter(value => value !== null)
    proxies.competitionRiskProxy = round(clamp01(terms.reduce((sum, value) => sum + value, 0) / terms.length))
    explanationsEn.competitionRiskProxy = "Large cavities / high accessible volume raise the risk of competing pathways and weaker selectivity."
    explanationsZh.competitionRiskProxy = "较大的空腔/可达体积会提高竞争路径风险并削弱选择性。"
  } else {
    proxies.competitionRiskProxy = null
    missing.push("competitionRiskProxy")
    explanationsEn.competitionRiskProxy = "Insufficient evidence: no cavity / pore-volume descriptor."
    explanationsZh.competitionRiskProxy = "证据不足：缺少空腔/孔体积描述符。"
  }

  // Evidence confidence proxy: from metadata verification level + descriptor provenance.
  const level = record.metadataVerification?.verificationLevel || "preview_only"
  const levelScore = { verified_metadata: 0.9, partial_metadata: 0.6, preview_only: 0.35, blocked: 0.1 }[level] ?? 0.35
  const provenanceSource = record.descriptorProvenance?.source || "unknown"
  const provenanceBonus = { database: 0.05, literature: 0.05, computed: 0.02, curated: 0.05, unknown: -0.05 }[provenanceSource] ?? 0
  proxies.evidenceConfidenceProxy = round(clamp01(levelScore + provenanceBonus))
  explanationsEn.evidenceConfidenceProxy = `Confidence reflects metadata level "${level}" and descriptor provenance "${provenanceSource}".`
  explanationsZh.evidenceConfidenceProxy = `置信度反映 metadata 等级“${level}”与描述符溯源“${provenanceSource}”。`

  const availableCount = PROXY_KEYS.filter(key => proxies[key] !== null).length

  // V2.0-H mechanism evidence backfill: classify the evidence behind each proxy.
  const evidence = buildProxyEvidence(record, proxies)

  return {
    proxies,
    proxyKeys: PROXY_KEYS,
    availableCount,
    missingProxies: missing,
    evidence,
    explanationsEn,
    explanationsZh,
    boundary: "Mechanism proxy only. Not DFT, not experimental proof, not a final recommendation. Rule-based mapping inspired by Han et al. 2024 multi-view feature engineering; not a reproduction of their Li-S model.",
    boundaryZh: "仅机制代理。不是 DFT、不是实验证据、也不是最终推荐。规则型映射受 Han et al. 2024 多视角特征工程启发，并非复现其 Li-S 模型。",
    notFinalRecommendation: true,
  }
}

// Each proxy's dominant input source. "descriptor" = measured/database descriptors;
// "computed_proxy" = rule-derived proxy descriptors; "metadata" = verification status.
const PROXY_PRIMARY_SOURCE = {
  co2ActivationProxy: "computed_proxy",
  formatePathwayProxy: "computed_proxy",
  hydrothermalStabilityProxy: "computed_proxy",
  poreTransportProxy: "descriptor",
  metalSiteSynergyProxy: "computed_proxy",
  competitionRiskProxy: "descriptor",
  evidenceConfidenceProxy: "metadata",
}

const EVIDENCE_STATUS_COPY = {
  literature_supported: { en: "Literature supported", zh: "文献支持" },
  descriptor_inferred: { en: "Descriptor inferred", zh: "描述符推断" },
  weak_proxy: { en: "Weak proxy", zh: "弱代理" },
  insufficient_evidence: { en: "Insufficient evidence", zh: "证据不足" },
}

export function mechanismEvidenceStatusLabel(statusKey, lang) {
  const row = EVIDENCE_STATUS_COPY[statusKey] || EVIDENCE_STATUS_COPY.insufficient_evidence
  return lang === "zh" ? row.zh : row.en
}

export function mechanismEvidenceTone(statusKey) {
  if (statusKey === "literature_supported") return "pass"
  if (statusKey === "descriptor_inferred") return "proxy"
  if (statusKey === "weak_proxy") return "warn"
  return "warn"
}

function hasLiteratureSupport(record) {
  return Boolean(record?.doi || record?.sourceDoi || record?.citation)
}

// Classify the evidence behind each proxy. Honest by construction: rule-derived
// proxies are labeled weak_proxy, database-descriptor proxies are descriptor_inferred,
// and only real DOI/citation support yields literature_supported.
export function buildProxyEvidence(record = {}, proxies = {}) {
  const literature = hasLiteratureSupport(record)
  const evidence = {}
  for (const key of PROXY_KEYS) {
    const value = proxies[key]
    if (value === null || value === undefined) {
      evidence[key] = {
        evidenceStatus: "insufficient_evidence",
        evidenceSource: "missing",
        confidence: "insufficient",
        warnings: ["missing_input_descriptors"],
      }
      continue
    }
    const primary = PROXY_PRIMARY_SOURCE[key] || "computed_proxy"
    if (literature) {
      evidence[key] = { evidenceStatus: "literature_supported", evidenceSource: "literature", confidence: "high", warnings: [] }
    } else if (primary === "descriptor") {
      evidence[key] = { evidenceStatus: "descriptor_inferred", evidenceSource: "descriptor", confidence: "medium", warnings: [] }
    } else if (primary === "metadata") {
      evidence[key] = { evidenceStatus: "descriptor_inferred", evidenceSource: "descriptor", confidence: "medium", warnings: [] }
    } else {
      evidence[key] = { evidenceStatus: "weak_proxy", evidenceSource: "computed_proxy", confidence: "low", warnings: ["relies_on_computed_proxy"] }
    }
  }
  return evidence
}

export function summarizeMechanismEvidence(records = []) {
  const rows = Array.isArray(records) ? records : []
  const statusCounts = { literature_supported: 0, descriptor_inferred: 0, weak_proxy: 0, insufficient_evidence: 0 }
  for (const record of rows) {
    const { evidence } = buildMechanismProxies(record)
    for (const key of PROXY_KEYS) {
      const status = evidence[key]?.evidenceStatus || "insufficient_evidence"
      statusCounts[status] = (statusCounts[status] || 0) + 1
    }
  }
  return {
    recordCount: rows.length,
    proxyKeys: PROXY_KEYS,
    statusCounts,
    notFinalRecommendation: true,
  }
}

export function summarizeMechanismProxyAvailability(records = []) {
  const rows = Array.isArray(records) ? records : []
  const counts = {}
  for (const key of PROXY_KEYS) counts[key] = 0
  for (const record of rows) {
    const { proxies } = buildMechanismProxies(record)
    for (const key of PROXY_KEYS) {
      if (proxies[key] !== null) counts[key] += 1
    }
  }
  return {
    recordCount: rows.length,
    proxyKeys: PROXY_KEYS,
    availableByProxy: counts,
    notFinalRecommendation: true,
  }
}

export const MECHANISM_PROXY_KEYS = PROXY_KEYS
