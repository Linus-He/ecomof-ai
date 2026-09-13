import fs from "node:fs"

const read = path => JSON.parse(fs.readFileSync(path, "utf8"))
const database = read("public/data/catalysis_v2/catalysis_reaction_database_v2.json")
const queue = read("public/data/catalysis_v2/catalysis_candidate_queue_v1.json")
const additions = read("data/curation/catalysis/literature-additions-v1.json")
const entries = new Map()
function add(source, layer, extra = {}) {
  const doi = source.doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi.org\//, "").trim()
  if (entries.has(doi)) return
  if (!/^10\.\d{4,9}\/\S+$/.test(doi) || !source.title || !source.journal || !source.year) throw new Error(`Incomplete literature metadata: ${doi}`)
  entries.set(doi, {
    id: `catlit-${doi}`, doi, doiUrl: `https://doi.org/${doi}`,
    title: source.title, journal: source.journal, year: source.year,
    sourceUrl: source.sourceUrl || source.landingPage || `https://doi.org/${doi}`,
    layer, ...extra,
  })
}
for (const source of database.tables.sourceDocuments) {
  const reactions = database.tables.reactionRecords.filter(row => row.sourceDocumentId === source.id)
  const states = database.tables.catalystStates.filter(row => reactions.some(reaction => reaction.id === row.reactionRecordId))
  const subjects = [...new Set(states.flatMap(row => [row.catalystName, row.precursorMofName]).filter(Boolean))].join(" / ")
  const products = [...new Set(reactions.map(row => row.reaction?.targetProduct).filter(Boolean))].join(" / ")
  add(source, "curated", {
    summaryZh: `研究体系：${subjects}；目标产物：${products}。已有反应记录，数值、条件与活性相证据请在反应记录和来源核验视图逐项查阅。`,
    summaryEn: `System: ${subjects}; target products: ${products}. Reaction records are available; inspect individual claims, conditions and active-phase evidence in the record and verification views.`,
    keywords: [subjects, products, ...reactions.map(row => row.reaction?.family)].join(" "),
    verificationBasis: "curated-reaction-database", checkedAt: database.generatedAt,
  })
}
for (const source of [...queue.candidates, ...(queue.navigationCandidates || [])]) {
  const family = queue.families.find(row => row.id === source.familyId)
  add(source, "candidate", {
    summaryZh: `检索主题：${family?.titleZh || source.title}。依据题名与元数据纳入文献导航，全文、运行条件与活性相尚待核对。`,
    summaryEn: `Discovery topic: ${family?.titleEn || source.title}. Indexed from title and metadata; full text, operating conditions and active phase await review.`,
    keywords: [family?.titleZh, family?.titleEn, source.documentRole].join(" "),
    verificationBasis: source.metadataVerification, checkedAt: source.doiVerification?.checkedAt || queue.generatedAt,
  })
}
for (const source of additions.records) add(source, "addition", source)
const records = [...entries.values()].sort((a, b) => b.year - a.year || a.doi.localeCompare(b.doi))
fs.writeFileSync("public/data/catalysis_v2/catalysis_literature_catalog_v1.json", JSON.stringify({ schemaVersion: "catalysis-literature-catalog-v1", records }, null, 2) + "\n")
console.log(`Catalysis literature catalog: ${records.length} unique DOI entries`)
