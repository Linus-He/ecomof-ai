export const normalizeMaterialQuery = (value: unknown) => String(value ?? "").normalize("NFKC").toLowerCase().replace(/[\s_–—−-]+/g, "")

export function searchMaterials(records: any[], aliases: any[], query: string) {
  const key = normalizeMaterialQuery(query)
  if (!key) return []
  const alias = aliases.find(item => [item.canonicalName, ...(item.aliases || [])].some(name => normalizeMaterialQuery(name) === key))
  const keys = [...new Set([key, ...(alias ? [alias.canonicalName, ...alias.aliases].map(normalizeMaterialQuery) : [])])]
  return records.map(record => {
    const names = [record.name, record.displayName, record.commonName, record.csdRefcode, ...(record.aliases || [])].filter(Boolean).map(normalizeMaterialQuery)
    const terms = [record.id, record.metalNode, record.topology, record.doi].filter(Boolean).map(normalizeMaterialQuery)
    const score = names.some(name => keys.includes(name)) ? 100 : names.some(name => keys.some(k => name.includes(k))) ? 60 : terms.some(term => term.includes(key)) ? 30 : 0
    return { record, score }
  }).filter(item => item.score).sort((a, b) => b.score - a.score || String(a.record.id).localeCompare(String(b.record.id)))
}
