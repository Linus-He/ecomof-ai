import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=path.resolve(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname),'../..')
const arg=process.argv.indexOf('--input')
if(arg<0) throw Error('Use --input with the public API projection produced by collect-manifold.py')
const input=JSON.parse(fs.readFileSync(process.argv[arg+1],'utf8'))
const curation=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/curation.json'),'utf8'))
const editorial=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/topics.json'),'utf8'))
const assets=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/assets.json'),'utf8'))
const previous=JSON.parse(fs.readFileSync(path.join(root,'scripts/nobel/candidate-organizations.json'),'utf8'))
const catalog=JSON.parse(fs.readFileSync(path.join(root,'scripts/nobel/research-catalog.json'),'utf8'))
const orgs=[...(Array.isArray(previous)?previous:Object.values(previous)),...(Array.isArray(catalog.organizations)?catalog.organizations:Object.values(catalog.organizations))]
const localAssets={basf:'images/nobel/organizations/basf.svg',svante:'images/nobel/organizations/svante.svg',manchester:'images/nobel/organizations/manchester.ico',deepmind:'images/nobel/organizations/DeepMind.ico'}
const urls={basf:'https://www.basf.com/',svante:'https://www.svanteinc.com/',manchester:'https://www.manchester.ac.uk/',deepmind:'https://deepmind.google/science/alphafold/'}
const entities=Object.entries(editorial.entities).map(([id,copy])=>{
 const a=assets.find(x=>x.id===id && !x.error)
 const logo=a?.logo || localAssets[id]
 if(!logo || !fs.existsSync(path.join(root,'public',logo)))throw Error('Missing official logo '+id)
 const existing=orgs.find(x=>x?.id===id)
 return {id,...copy,url:a?.url||urls[id],logo,assetSource:a?.assetSource||existing?.assetSource||existing?.logoSource||urls[id],sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',logo))).digest('hex')}
})
const output=path.join(root,'public/data/science-forecasts');fs.mkdirSync(path.join(output,'events'),{recursive:true})
const ids=new Set();let pointCount=0
const events=input.map(record=>{
 if(ids.has(record.id))throw Error('Duplicate market '+record.id);ids.add(record.id)
 const copy=curation.markets.find(x=>x.id===record.id);if(!copy)throw Error('Missing authored rule summary '+record.id)
 if(!editorial.topics.some(x=>x.id===record.topicId))throw Error('Unknown topic')
 let previousT=-Infinity
 for(const point of record.points){if(!Number.isFinite(point.p)||point.p<0||point.p>1||point.t>=record.historyCutoff||point.t<=previousT)throw Error('Invalid or post-cutoff history '+record.id);previousT=point.t}
 for(const key of copy.entities)if(!entities.some(x=>x.id===key))throw Error('Unknown institution '+key)
 const quality=[]
 if(curation.quality[record.id])quality.push({code:'rules',label:curation.quality[record.id][0],detail:curation.quality[record.id][1]})
 if(record.participants<10)quality.push({code:'thin',label:['参与较少','Few participants'],detail:['概率来自少量参与者；查看成交数量与原始规则。','Few participants contribute; review activity and source rules.']})
 const event={...record,...copy,quality,tradePoints:record.points.length,detailFile:`events/${record.id}.json`}
 fs.writeFileSync(path.join(output,event.detailFile),JSON.stringify(event,null,2)+'\n');pointCount+=event.points.length
 const {points,provenance,...summary}=event
 return summary
})
const nobel=JSON.parse(fs.readFileSync(path.join(root,'public/data/nobel-odds/index.json'),'utf8'))
const topics=editorial.topics.map(t=>({...t,marketCount:events.filter(e=>e.topicId===t.id).length,evidenceIds:editorial.evidence.filter(e=>e.topics.includes(t.id)).map(e=>e.id)}))
const searches=['solid state battery','LK-99','superconductor','metal organic framework','direct air capture','MOF','carbon capture','carbon removal','Svante','Atoco','room temperature superconductor commercial','room temperature superconductors before 2033']
const index={schemaVersion:'1.0',snapshot:true,topics,events,entities,evidence:editorial.evidence,nobel:{years:nobel.years,editions:nobel.editions,sources:[...new Set(nobel.editions.map(e=>e.source))]},method:{source:'Manifold',currency:'MANA',apiDocs:'https://docs.manifold.markets/api',history:'actual-trades-before-close-and-resolution',points:pointCount,counts:{markets:events.length,resolved:events.filter(e=>e.status==='resolved').length,cancelled:events.filter(e=>e.resolution==='CANCEL').length,ruleFlags:events.filter(e=>e.quality.some(q=>q.code==='rules')).length},discoveryQueries:searches}}
fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(index,null,2)+'\n')
const audit={schemaVersion:'1.0',grain:'one source market; one observation per distinct actual-trade timestamp',marketCount:events.length,pointCount,checks:['unique market ids','strictly increasing timestamps','finite probabilities in [0,1]','trades strictly before close/resolution/capture boundary','no resolved price substituted for history','cancelled outcomes kept distinct from No','only curated topic joins','logo checksums','no account identities in public projection'],sourceProjectionSha256:crypto.createHash('sha256').update(fs.readFileSync(process.argv[arg+1])).digest('hex'),markets:input.map(m=>({id:m.id,sourceApi:m.sourceApi,status:m.status,resolution:m.resolution,historyCutoff:m.historyCutoff,observedAt:m.observedAt,points:m.points.length,...m.provenance})),discovery:searches.map(q=>({query:q,source:'Manifold',url:`https://api.manifold.markets/v0/search-markets?term=${encodeURIComponent(q)}&limit=30&sort=liquidity&filter=all`}))}
fs.writeFileSync(path.join(root,'scripts/science-forecasts/source-audit.json'),JSON.stringify(audit,null,2)+'\n')
console.log(`Published ${events.length} source-labelled technical markets, ${pointCount} genuine history points and ${nobel.editions.length} preserved Nobel editions.`)
