import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import katex from 'katex'

const api = 'https://api.nobelprize.org/v1/prize.json?category=chemistry'
const snapshot = new URL('./official-prizes.json', import.meta.url)
if (process.argv.includes('--live')) {
  const response = await fetch(api)
  if (!response.ok) throw new Error(`Official API: ${response.status}`)
  const text = await response.text()
  if (!Array.isArray(JSON.parse(text).prizes)) throw new Error('Invalid official API response')
  await writeFile(snapshot, text)
}
const { prizes } = JSON.parse(await readFile(snapshot, 'utf8'))
const relevant = prizes.filter(prize => prize.category === 'chemistry')
const latestYear = Math.max(...relevant.map(prize => Number(prize.year)))
const sourceAudit = JSON.parse(await readFile(new URL('./source-audit.json', import.meta.url), 'utf8'))
const sourceByYear = new Map(sourceAudit.map(source => [source.year, source]))
const rows = (await readFile(new URL('./historical-readings.tsv', import.meta.url), 'utf8')).trim().split('\n')
const enhancedEditions = new Map()
const catalog = JSON.parse(await readFile(new URL('./research-catalog.json', import.meta.url), 'utf8'))
const industryCases = JSON.parse(await readFile(new URL('./industry-cases.json', import.meta.url), 'utf8'))
const personProfiles = JSON.parse(await readFile(new URL('./laureate-profiles.json', import.meta.url), 'utf8'))
const annualResearch = (await readFile(new URL('./annual-research.tsv', import.meta.url), 'utf8')).trim().split('\n')
for (const line of annualResearch) {
  const [yearText, studyIds, connection, ...extra] = line.split('\t')
  if (extra.length || !connection) throw new Error(`Invalid annual research record: ${yearText}`)
  const year = Number(yearText)
  if (enhancedEditions.has(year)) throw new Error(`Duplicate annual research: ${year}`)
  const researchCases = studyIds.split(',').map(id => {
    if (!catalog.studies[id]) throw new Error(`Unknown study ${id}: ${year}`)
    return catalog.studies[id]
  })
  const companyCases = [...new Map(researchCases.flatMap(study => study.relatedCompanyIds.map(id => [id, {...(industryCases[`${id}-${study.id}`] || industryCases[id] || study.companyOverride || catalog.companies[id]), relation: study.relation}]))).values()]
  const ids = new Set(researchCases.flatMap(study => [...study.organizationIds, ...study.relatedCompanyIds]))
  enhancedEditions.set(year, { year, sectionOverrides: { development: { body: connection } }, organizations: catalog.organizations.filter(org => ids.has(org.id)), researchCases, companyCases })
}
const mofEditorial = JSON.parse(await readFile(new URL('./2025-editorial.json', import.meta.url), 'utf8'))
for (const company of mofEditorial.companyCases) {
  const detail = industryCases[`${company.organizationId}-mof`] || industryCases[company.organizationId]
  if (detail) Object.assign(company, detail)
  else company.products = company.sources.map(source => ({name: company.role, application: company.paragraphs[0], url: source.url}))
}
enhancedEditions.set(mofEditorial.year, mofEditorial)
for (const editorial of enhancedEditions.values()) {
const organizationIds = new Set(editorial.organizations.map(item => item.id))
for (const organization of editorial.organizations) {
  await access(new URL(`../../public/${organization.logo}`, import.meta.url))
  if (!organization.url.startsWith('https://')) throw new Error(`Invalid organization link: ${organization.id}`)
}
for (const paper of editorial.researchCases) {
  for (const id of [...paper.organizationIds, ...paper.relatedCompanyIds]) if (!organizationIds.has(id)) throw new Error(`Unknown research organization: ${id}`)
  if (!paper.paperUrl.startsWith('https://doi.org/') || !paper.sources.length) throw new Error(`Missing research citation: ${paper.id}`)
}
for (const company of editorial.companyCases) if (!organizationIds.has(company.organizationId) || !company.sources.length) throw new Error('Missing company provenance')
}
const learning = JSON.parse(await readFile(new URL('./learning-guides.json',import.meta.url),'utf8'))
const readings = new Map()
for (const line of rows) {
  const columns = line.split('\t')
  if (columns.length !== 10) throw new Error(`Expected ten editorial fields: ${columns[0]}`)
  const [yearText, title, background, principle, equation, equationNote, uses, significance, development, relatedYear] = columns
  const year = Number(yearText)
  if (readings.has(year)) throw new Error(`Duplicate editorial year: ${year}`)
  if (columns.some(column => !column.trim())) throw new Error(`Empty editorial field: ${year}`)
  katex.renderToString(equation, { throwOnError: true, strict: 'error', displayMode: true })
  const supplementalEquations = year === 2025 ? [{
    math: String.raw`\mathrm{Zn_4O(BDC)_3};\quad \mathrm{BDC^{2-}=terephthalate}`,
    sourceUrl: 'https://www.nobelprize.org/uploads/2025/10/advanced-chemistryprize2025-1.pdf',
    note: 'MOF-5 的理想框架组成；Zn₄O 节点与对苯二甲酸根连接体组织网络。它描述组成，不是配平的溶剂热合成式，也不说明材料在水中必然稳定。',
  }] : year === 2026 ? [{
    math: String.raw`\mathrm{ArCHO+Zn(iPr)_2\longrightarrow ArCH(iPr)OZn(iPr)\xrightarrow{workup}ArCH(iPr)OH}`,
    sourceUrl: 'https://www.nature.com/articles/s41467-025-62591-3',
    note: 'Soai 类反应的有机锌加成与后处理简图，Ar 指相应杂芳基，iPr 指异丙基；省略聚集体、其他配位物种和后处理副产物。催化反馈主要在醇盐/有机锌体系中讨论，不能把游离醇与实际催化聚集体混同。',
  }] : []
  for (const equation of supplementalEquations) katex.renderToString(equation.math, { throwOnError: true, strict: 'error' })
  const source = sourceByYear.get(year)
  const relatedSource = sourceByYear.get(Number(relatedYear))
  if (!source || !relatedSource) throw new Error(`Missing verified source: ${year}`)
  const enhanced = enhancedEditions.get(year)
  if (!enhanced) throw new Error(`Missing university and company research: ${year}`)
  const baseSections = [
      { id: 'background', title: ['研究背景', 'Background'], body: background },
      { id: 'principle', title: ['原理与机理', 'Principles and mechanisms'], body: principle, equation, equationNote, supplementalEquations },
      { id: 'uses', title: ['应用', 'Applications'], body: uses },
      { id: 'significance', title: ['科学意义', 'Significance'], body: significance },
      { id: 'development', title: ['研究与产业进展', 'Research and industrial progress'], body: development, ...(enhanced ? {} : { relatedYear: Number(relatedYear), relatedSource: relatedSource.url }) },
    ]
  readings.set(year, {
    title,
    learningGuide: (()=>{const key=learning.years[year];if(!learning.concepts[key])throw new Error(`Missing concept for ${year}`);return {topic:key,...learning.concepts[key]}})(),
    summary: `${title}。${significance}`,
    sections: baseSections.map(section => ({ ...section, ...enhanced?.sectionOverrides?.[section.id] })),
    ...(enhanced?.summary ? { summary: enhanced.summary } : {}),
    developments: { organizations: enhanced.organizations, researchCases: enhanced.researchCases, companyCases: enhanced.companyCases },
    officialSource: { url: source.url, kind: source.kind, checked: source.checked },
    language: 'zh',
    reviewed: source.checked,
  })
}
const richSource = (await readFile(new URL('../../src/data/nobelChemistry.ts', import.meta.url), 'utf8'))
  .replace('export const nobelChemistry =', 'const nobelChemistry =').replace(/as const\s*$/, '')
const richEditions = new Function(`${richSource}; return nobelChemistry`)()
const output = new URL('../../public/data/nobel-chemistry/', import.meta.url)
await mkdir(output, { recursive: true })
const years = []
const portraits = JSON.parse(await readFile(new URL('./portraits.json', import.meta.url), 'utf8'))
for (let year = 1901; year <= latestYear; year++) {
  const prize = relevant.find(prize => Number(prize.year) === year)
  if (!prize) throw new Error(`Missing official record: ${year}`)
  const awarded = Boolean(prize.laureates?.length)
  const reading = readings.get(year)
  if (awarded && !reading) throw new Error(`Write and source the six-part reading before publishing new award year ${year}`)
  if (!awarded && reading) throw new Error(`Non-awarded year cannot contain award commentary: ${year}`)
  const rich = richEditions.find(edition => edition.year === year)
  const record = {
    year,
    status: awarded ? 'awarded' : 'not-awarded',
    names: (prize.laureates || []).map(person => [person.firstname, person.surname].filter(Boolean).join(' ')),
    personUrls: (prize.laureates || []).map(person => `https://www.nobelprize.org/laureate/${person.id}`),
    motivations: (prize.laureates || []).map(person => person.motivation?.replace(/^"|"$/g, '') || ''),
    overallMotivation: prize.overallMotivation || '',
    ...rich,
    ...(awarded ? { portraits: portraits[year], people: prize.laureates.map(person => {
      const profile=personProfiles[`${year}:${person.id}`]
      if (!profile) throw new Error(`Missing annual person profile ${year}:${person.id}`)
      return {...profile,id:person.id,image:portraits[year].find(p => p.id===person.id)?.image}
    }) } : {}),
    ...(rich ? { image: `images/nobel/chemistry-${year}.jpg` } : {}),
    ...(reading ? { reading } : {}),
    source: api,
    checked: reading?.officialSource.checked || '2026-10-07',
  }
  if (awarded && record.portraits?.length !== record.names.length) throw new Error(`Incomplete portraits: ${year}`)
  await writeFile(new URL(`${year}.json`, output), JSON.stringify(record, null, 2)+'\n')
  years.push({ year, status: record.status, editorial: Boolean(reading) })
}
if (readings.size !== relevant.filter(prize => prize.laureates?.length).length) throw new Error('Editorial and official award counts differ')
await writeFile(new URL('index.json', output), JSON.stringify({ firstYear: 1901, latestYear, years, source: api }, null, 2)+'\n')
const latestRich = richEditions.find(edition => edition.year === latestYear)
await writeFile(new URL('../../src/data/nobelLatest.json', import.meta.url), JSON.stringify({year:latestYear, theme:latestRich?.theme || [readings.get(latestYear).title, 'Latest annual award record'], imageYear:latestRich ? latestYear : null},null,2)+'\n')
console.log(`Nobel Chemistry: ${years.length} annual records, ${readings.size} six-part readings, ${years.filter(y => y.status === 'not-awarded').length} non-awarded years`)
