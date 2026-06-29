// @ts-nocheck

export function normalizeMofName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)])
    .replace(/\bmetal organic framework\b/g, "mof")
    .replace(/\bcu\s*3?\s*\(?btc\)?\s*2?\b/g, "cu-btc")
    .replace(/\s+/g, " ")
    .replace(/[\[\]{}()'"]/g, "")
    .replace(/[–—−_]/g, "-")
    .replace(/[^a-z0-9+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function createMofIdentityIndex(registry = {}) {
  const records = Array.isArray(registry.records) ? registry.records : Array.isArray(registry) ? registry : []
  const byCanonicalId = new Map()
  const byAlias = new Map()
  for (const record of records) {
    if (!record?.canonicalId) continue
    byCanonicalId.set(record.canonicalId, record)
    const aliases = [record.primaryName, ...(record.aliases || []), ...(record.normalizedAliases || [])]
    for (const alias of aliases) {
      const normalized = normalizeMofName(alias)
      if (normalized && !byAlias.has(normalized)) byAlias.set(normalized, record.canonicalId)
    }
  }
  const highConfidenceGroups = [
    ["HKUST-1", "HKUST1", "Cu-BTC", "Cu3(BTC)2", "MOF-199", "mof199"],
    ["MOF-74", "MOF74", "CPO-27", "CPO27", "Mg-MOF-74", "Ni-MOF-74", "Co-MOF-74"],
    ["ZIF-8", "ZIF8", "zeolitic imidazolate framework-8"],
    ["IRMOF-1", "IRMOF1", "MOF-5", "MOF5"],
  ]
  for (const group of highConfidenceGroups) {
    const canonicalId = group.map(alias => byAlias.get(normalizeMofName(alias))).find(Boolean)
    if (!canonicalId) continue
    for (const alias of group) byAlias.set(normalizeMofName(alias), canonicalId)
  }
  return { records, byCanonicalId, byAlias }
}

export function resolveMof(name, registry = {}) {
  const index = createMofIdentityIndex(registry)
  const normalized = normalizeMofName(name)
  if (!normalized) return null
  return index.byAlias.get(normalized) || null
}

export function getLinkedRecords(canonicalId, registry = {}) {
  const index = createMofIdentityIndex(registry)
  const record = index.byCanonicalId.get(canonicalId)
  return record?.links || { structural: [], gas: [], catalysis: [] }
}

export function isUnresolvedMof(name, registry = {}) {
  return !resolveMof(name, registry)
}
