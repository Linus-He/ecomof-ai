// @ts-nocheck
// V3.9 version history summary — turns version_evolution_records into a clean IA:
// the current release is expanded, the previous three minors are collapsed, and
// V3.5-and-earlier is archived. Also exposes the category filter set. Technical
// field names are mapped to friendly labels by the UI, not rendered raw.
import { normalizeMissingValue } from "../fallback/normalizeMissingValue"

const ARCHIVE_AT = 3.5 // V3.5 and earlier -> Archive

export function parseVersionKey(version: string): number {
  const m = String(version || "").match(/V?(\d+)\.(\d+)/i)
  if (!m) return 0
  return Number(m[1]) + Number(m[2]) / 10
}

export function buildVersionHistorySummary({ versionEvolution = {}, generatedAt = "" } = {}) {
  const ts = generatedAt || new Date().toISOString()
  const versions = Array.isArray(versionEvolution?.versions) ? [...versionEvolution.versions] : []
  const currentVersion = versionEvolution?.currentVersion || versions[versions.length - 1]?.version || "unknown"
  const currentKey = parseVersionKey(currentVersion)

  const withKeys = versions.map(v => ({ ...v, _key: parseVersionKey(v.version) })).sort((a, b) => b._key - a._key)

  const groups = { expanded: [], collapsed: [], archived: [] as any[] }
  for (const v of withKeys) {
    const entry = { version: v.version, date: v.date || "unknown", summary: normalizeMissingValue(v.summary, "generic"), categories: Array.isArray(v.categories) ? v.categories : [] }
    if (v.version === currentVersion || v._key === currentKey) groups.expanded.push(entry)
    else if (v._key > ARCHIVE_AT) groups.collapsed.push(entry)
    else groups.archived.push(entry)
  }

  const categories = Array.from(new Set(versions.flatMap(v => (Array.isArray(v.categories) ? v.categories : [])))).sort()

  return {
    summaryId: "version-history-summary-v1",
    generatedAt: ts,
    currentVersion,
    totalVersions: versions.length,
    groups,
    categories,
    archiveThreshold: `V${ARCHIVE_AT.toFixed(1)} and earlier`,
    milestoneCount: Array.isArray(versionEvolution?.milestones) ? versionEvolution.milestones.length : 0,
  }
}

export default buildVersionHistorySummary
