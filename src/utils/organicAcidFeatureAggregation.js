import { clamp } from "./scoring"
import { mapEvidenceConfidence } from "./organicAcidScoring"

function normalizedText(value, fallback = "pending") {
  if (Array.isArray(value)) return normalizedText(value[0], fallback)
  return String(value || fallback).trim().toLowerCase()
}

function numericValue(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function stabilityPoints(value) {
  const text = normalizedText(value)
  if (text.includes("high")) return 34
  if (text.includes("medium")) return 22
  if (text.includes("low")) return 8
  if (text.includes("pending")) return 4
  return 10
}

function roleText(candidate) {
  const roles = candidate?.organicAcidRelevance?.possibleRoles
  if (!Array.isArray(roles)) return ""
  return roles
    .map(role => `${role.role || ""} ${role.label || ""} ${role.relatedFeature || ""} ${role.relatedPathwayNode || ""}`)
    .join(" ")
    .toLowerCase()
}

export function calculateStructureFeasibility(candidate = {}) {
  const water = stabilityPoints(candidate.waterStability)
  const thermal = stabilityPoints(candidate.thermalStability)
  const graphStatus = normalizedText(candidate.graphMetadata?.graphStatus || candidate.graphMetadata?.graphConfidence)
  const graphBonus = graphStatus.includes("pending") ? 4 : graphStatus.includes("literature") ? 18 : graphStatus.includes("demo") ? 10 : 12
  const toxicity = normalizedText(candidate.toxicityConcern).includes("high") ? 14 : normalizedText(candidate.toxicityConcern).includes("medium") ? 7 : 0
  return Math.round(clamp(water + thermal + graphBonus - toxicity))
}

export function calculatePoreAccessibility(candidate = {}) {
  const poreSize = numericValue(candidate.poreSizeA)
  const surfaceArea = numericValue(candidate.surfaceArea)
  const poreVolume = numericValue(candidate.poreVolume)
  const poreScore = poreSize > 0 ? clamp((poreSize / 30) * 36, 0, 36) : 6
  const areaScore = surfaceArea > 0 ? clamp((surfaceArea / 2800) * 34, 0, 34) : 6
  const volumeScore = poreVolume > 0 ? clamp((poreVolume / 1.5) * 30, 0, 30) : 4
  return Math.round(clamp(poreScore + areaScore + volumeScore))
}

export function calculateActiveMotifPotential(candidate = {}) {
  const motifs = candidate.graphMetadata?.activeMotifs
  const motifCount = Array.isArray(motifs) ? motifs.length : 0
  const graphMotifScore = numericValue(candidate.graphMetadata?.graphMotifScore)
  const roles = roleText(candidate)
  const roleBonus = /active|motif|metal|cluster|functional|linker/.test(roles) ? 18 : 0
  return Math.round(clamp(graphMotifScore * 7 + motifCount * 12 + roleBonus))
}

export function calculateFormateInteractionPotential(candidate = {}) {
  const roles = roleText(candidate)
  const roleScore = [
    /hcoo|formate/.test(roles) ? 34 : 0,
    /hco3|bicarbonate/.test(roles) ? 24 : 0,
    /c1_intermediate|c1 intermediate/.test(roles) ? 18 : 0,
    /formic_acid|formic acid/.test(roles) ? 12 : 0,
  ].reduce((sum, value) => sum + value, 0)
  const pathwayScore = numericValue(candidate.organicAcidRelevance?.pathwayPriorityScore)
  return Math.round(clamp(roleScore + pathwayScore * 0.25))
}

export function aggregateOrganicAcidFeatures(candidate = {}) {
  return {
    structureFeasibility: calculateStructureFeasibility(candidate),
    poreAccessibility: calculatePoreAccessibility(candidate),
    activeMotifPotential: calculateActiveMotifPotential(candidate),
    formateInteractionPotential: calculateFormateInteractionPotential(candidate),
    evidenceConfidence: mapEvidenceConfidence(
      candidate.organicAcidRelevance?.scoreStatus ||
      candidate.graphMetadata?.graphConfidence ||
      candidate.graphMetadata?.graphStatus ||
      candidate.evidenceLevel
    ),
  }
}
