// @ts-nocheck
// V2.0-H shared preview ranking for audits.
//
// This is a transparent, deterministic PREVIEW ranking used only by the sensitivity
// and feature-ablation audits to test whether candidate ordering is stable. It is
// NOT the OACS/DMRS score and does NOT modify any scoring formula. It is never a
// final recommendation.
import { buildMechanismProxies } from "../organicAcid/mechanismProxyMapping.js"
import { getMetadataVerificationLevel } from "./metadataVerification.js"

// Positive features are rewarded; competitionRiskProxy is a penalty.
export const PREVIEW_FEATURE_KEYS = [
  "surfaceArea",
  "poreVolume",
  "voidFraction",
  "pldA",
  "co2ActivationProxy",
  "poreTransportProxy",
  "metalSiteSynergyProxy",
  "hydrothermalStabilityProxy",
  "competitionRiskProxy",
]

const DESCRIPTOR_FEATURES = new Set(["surfaceArea", "poreVolume", "voidFraction", "pldA"])
const PROXY_FEATURES = new Set(["co2ActivationProxy", "poreTransportProxy", "metalSiteSynergyProxy", "hydrothermalStabilityProxy", "competitionRiskProxy"])

export function defaultPreviewWeights() {
  const weights = {}
  for (const key of PREVIEW_FEATURE_KEYS) weights[key] = 1
  weights.competitionRiskProxy = -0.6
  return weights
}

function rawDescriptor(record, key) {
  const descriptors = record.descriptors || {}
  const value = record[key] ?? descriptors[key]
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

// Build a 0-1 normalized feature matrix across the record set. Missing values map
// to a neutral 0.5 so they neither reward nor punish the candidate.
export function buildPreviewFeatureMatrix(records = []) {
  const rows = Array.isArray(records) ? records : []
  const proxyByRecord = rows.map(record => buildMechanismProxies(record).proxies)

  const descriptorRanges = {}
  for (const key of DESCRIPTOR_FEATURES) {
    const values = rows.map(record => rawDescriptor(record, key)).filter(v => v !== null)
    descriptorRanges[key] = values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 1 }
  }

  return rows.map((record, index) => {
    const features = {}
    for (const key of PREVIEW_FEATURE_KEYS) {
      if (DESCRIPTOR_FEATURES.has(key)) {
        const value = rawDescriptor(record, key)
        const { min, max } = descriptorRanges[key]
        features[key] = value === null || max === min ? 0.5 : (value - min) / (max - min)
      } else if (PROXY_FEATURES.has(key)) {
        const value = proxyByRecord[index][key]
        features[key] = value === null || value === undefined ? 0.5 : value
      } else {
        features[key] = 0.5
      }
    }
    return {
      recordId: record.recordId || record.frameworkId || record.id || `record-${index + 1}`,
      displayName: record.displayName || record.recordId || `Candidate ${index + 1}`,
      metadataLevel: getMetadataVerificationLevel(record),
      features,
    }
  })
}

export function scoreFeatureRow(featureRow, weights, options = {}) {
  const includeProxies = options.includeProxies !== false
  const includeDescriptors = options.includeDescriptors !== false
  const skip = new Set(options.skipFeatures || [])
  let score = 0
  for (const key of PREVIEW_FEATURE_KEYS) {
    if (skip.has(key)) continue
    if (!includeProxies && PROXY_FEATURES.has(key)) continue
    if (!includeDescriptors && DESCRIPTOR_FEATURES.has(key)) continue
    score += (weights[key] ?? 0) * (featureRow.features[key] ?? 0.5)
  }
  return Math.round(score * 1e6) / 1e6
}

// Deterministic ranking (ties broken by recordId) -> ordered recordId list.
export function rankRecords(matrix = [], weights = defaultPreviewWeights(), options = {}) {
  return [...matrix]
    .map(row => ({ recordId: row.recordId, score: scoreFeatureRow(row, weights, options) }))
    .sort((a, b) => (b.score - a.score) || String(a.recordId).localeCompare(String(b.recordId)))
    .map(row => row.recordId)
}

export function topNOverlap(baseTopN = [], variantTopN = []) {
  if (!baseTopN.length) return 1
  const variantSet = new Set(variantTopN)
  const retained = baseTopN.filter(id => variantSet.has(id)).length
  return Math.round((retained / baseTopN.length) * 1000) / 1000
}

// Deterministic seeded PRNG (mulberry32) so audits are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
