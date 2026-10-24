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
for (const year of index.years) {
 const file=new URL(`${year}.json`,root);const market=JSON.parse(await readFile(file,'utf8'))
 const award=JSON.parse(await readFile(new URL(`../../public/data/nobel-chemistry/${year}.json`,import.meta.url),'utf8'))
 market.winners=award.names
 market.winnerDetails=award.names.map((name,i)=>({name,url:award.personUrls[i],image:award.portraits?.[i]?.image}))
 market.candidates=market.candidates.map(candidate=>{
  if (!profiles.has(candidate.name)) throw new Error(`Author a sourced research focus for ${candidate.name}`)
  const institution=affiliations.get(`${year}:${candidate.name}`)
  if (!institution) throw new Error(`Verify an annual institution for ${year}: ${candidate.name}`)
  return {...candidate,...profiles.get(candidate.name),institution}
 })
 await writeFile(file,JSON.stringify(market,null,2)+'\n')
}
console.log('Enriched prediction candidates and verified annual laureates')
