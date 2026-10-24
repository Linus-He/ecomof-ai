import { readFile, writeFile } from 'node:fs/promises'
const root = new URL('../../public/data/nobel-odds/',import.meta.url)
const profiles = new Map((await readFile(new URL('./candidate-profiles.tsv',import.meta.url),'utf8')).trim().split('\n').map(line => {
 const [name,zh,en,url,...extra]=line.split('\t')
 if (!name || !zh || !en || !url?.startsWith('https://') || extra.length) throw new Error(`Invalid candidate profile: ${name}`)
 return [name,{researchFocus:[zh,en],profileUrl:url}]
}))
// Affiliations belong to a market year; never reuse a current profile across past editions.
const organizations = new Map(JSON.parse(await readFile(new URL('./candidate-organizations.json',import.meta.url),'utf8')).map(org => [org.id,org]))
const affiliations = new Map((await readFile(new URL('./candidate-affiliations.tsv',import.meta.url),'utf8')).trim().split('\n').map(line => {
 const [year,name,organizationId,sourceUrl,...extra]=line.split('\t')
 if (!/^\d{4}$/.test(year) || !organizations.has(organizationId) || !sourceUrl?.startsWith('https://') || extra.length) throw new Error(`Invalid annual affiliation: ${line}`)
 return [`${year}:${name}`,{...organizations.get(organizationId),sourceUrl}]
}))
const index=JSON.parse(await readFile(new URL('index.json',root),'utf8'))
for (const edition of index.editions || index.years.map(year=>({year,file:`${year}.json`}))) {
 const year=edition.year
 const file=new URL(edition.file || `${year}.json`,root);const market=JSON.parse(await readFile(file,'utf8'))
 const award=JSON.parse(await readFile(new URL(`../../public/data/nobel-chemistry/${year}.json`,import.meta.url),'utf8'))
 market.winners=award.names
 market.winnerDetails=award.names.map((name,i)=>({name,url:award.people?.[i]?.url || award.personUrls[i],image:award.portraits?.[i]?.image,affiliations:award.people?.[i]?.affiliations || []}))
 market.candidates=market.candidates.map(candidate=>{
  if (candidate.kind === 'field' || candidate.kind === 'other') return {...candidate,researchFocus: candidate.kind === 'field' ? ['研究领域预测，非个人获奖概率','Field prediction, not an individual forecast'] : ['原市场的其他选项','Other option in the original market']}
  if (!profiles.has(candidate.name)) throw new Error(`Author a sourced research focus for ${candidate.name}`)
  const institution=affiliations.get(`${year}:${candidate.name}`)
  if (!institution) throw new Error(`Verify an annual institution for ${year}: ${candidate.name}`)
  return {...candidate,...profiles.get(candidate.name),institution}
 })
 await writeFile(file,JSON.stringify(market,null,2)+'\n')
}
console.log('Enriched prediction candidates and verified annual laureates')
