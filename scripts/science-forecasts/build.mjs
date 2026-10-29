import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {validateCurveAdmission} from './curveAdmission.mjs'
const root=path.resolve(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname),'../..')
const arg=process.argv.indexOf('--input')
if(arg<0) throw Error('Use --input with the public API projection produced by collect-manifold.py')
const input=JSON.parse(fs.readFileSync(process.argv[arg+1],'utf8'))
const curation=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/curation.json'),'utf8'))
const editorial=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/topics.json'),'utf8'))
const publisherRecords=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/publishers.json'),'utf8'))
const eventDateReview=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/event-date-review-2026-10-29.json'),'utf8'))
const contexts=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/contexts.json'),'utf8'))
const curveAdmission=JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/curve-admission-review.json'),'utf8'))
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
for(const publisher of publisherRecords){
 if(publisher.logo&&(!fs.existsSync(path.join(root,'public',publisher.logo))||crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',publisher.logo))).digest('hex')!==publisher.sha256))throw Error('Invalid publisher logo '+publisher.id)
}
for(const source of editorial.evidence){
 if(!source.sourceReview?.status||!source.sourceReview?.basis?.length)throw Error('Source date review missing '+source.id)
 if(!publisherRecords.some(p=>p.id===source.publisherId))throw Error('Unknown source publisher '+source.id)
 if(![source.publisherId,...(source.newsSources||[]).map(s=>s.publisherId)].some(id=>publisherRecords.some(p=>p.id===id&&p.logo)))throw Error('Source without a branded citation '+source.id)
}
validateCurveAdmission(input,editorial.topics,curveAdmission)
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
 if(!contexts[copy.briefing?.contextId])throw Error('Missing technical context '+record.id)
 for(const id of copy.evidence)if(!editorial.evidence.some(e=>e.id===id))throw Error('Missing primary evidence '+id)
 for(const id of copy.relatedIds)if(!curation.markets.some(m=>m.id===id)||id===record.id)throw Error('Broken related market '+id)
 const first=record.points[0],last=record.points[record.points.length-1]
 const historySummary=first&&last?{first,last,change:(last.p-first.p)*100,low:Math.min(...record.points.map(p=>p.p)),high:Math.max(...record.points.map(p=>p.p)),staleDays:(record.historyCutoff-last.t)/86400000}:null
 const dateReview=eventDateReview.markets.find(e=>e.id===record.id)
 if(!dateReview||!dateReview.originalTitleMatches||dateReview.dates.some(d=>!d.matches||record[d.field]!==d.archived))throw Error('Event/date review mismatch '+record.id)
 const event={...record,...copy,dateReview:{checkedAt:eventDateReview.checkedAt,...dateReview},context:contexts[copy.briefing.contextId],historySummary,quality,tradePoints:record.points.length,detailFile:`events/${record.id}.json`}
 fs.writeFileSync(path.join(output,event.detailFile),JSON.stringify(event,null,2)+'\n');pointCount+=event.points.length
 const {points,provenance,context,industry,...summary}=event
 return summary
})
const nobel=JSON.parse(fs.readFileSync(path.join(root,'public/data/nobel-odds/index.json'),'utf8'))
const indicatorIds=new Set(),reactionCaseIds=new Set()
const topics=editorial.topics.map(t=>{
 const rows=events.filter(e=>e.topicId===t.id)
 for(const metric of t.metrics||[]){
  if(indicatorIds.has(metric.id))throw Error('Duplicate indicator '+metric.id);indicatorIds.add(metric.id)
  const source=editorial.evidence.find(e=>e.id===metric.evidenceId)
  if(!source||!source.topics.includes(t.id))throw Error('Broken topic indicator source '+metric.id)
  if(!['measurement','reported','company','model','target','pipeline'].includes(metric.kind))throw Error('Unlabelled indicator type '+metric.id)
  for(const field of ['label','value','period','scope'])if(!Array.isArray(metric[field])||metric[field].length!==2||metric[field].some(s=>!s.trim()))throw Error('Incomplete bilingual indicator '+metric.id)
 }
 for(const reaction of t.reactionCases||[]){
  if(reactionCaseIds.has(reaction.id))throw Error('Duplicate reaction case '+reaction.id);reactionCaseIds.add(reaction.id)
  for(const field of ['title','transformation','catalyst','conditions','outcome','limits','locator'])if(!Array.isArray(reaction[field])||reaction[field].length!==2||reaction[field].some(s=>!s.trim()))throw Error('Incomplete bilingual reaction case '+reaction.id)
  if(!reaction.evidenceIds?.length)throw Error('Reaction without sources '+reaction.id)
  for(const id of reaction.evidenceIds)if(!editorial.evidence.some(e=>e.id===id&&e.topics.includes(t.id)))throw Error('Broken reaction source '+reaction.id)
 }
 if(t.mode==='literature'&&(rows.length||!t.reactionCases?.length||!t.metrics?.length||!t.marketNote))throw Error('Invalid literature topic '+t.id)
 for(const id of t.relatedTopicIds||[])if(id===t.id||!editorial.topics.some(x=>x.id===id))throw Error('Broken related topic '+id)
 const histories=rows.filter(e=>e.historySummary)
 return {...t,marketCount:rows.length,evidenceIds:editorial.evidence.filter(e=>e.topics.includes(t.id)).map(e=>e.id),coverage:{historyPoints:rows.reduce((sum,e)=>sum+e.tradePoints,0),marketsWithHistory:histories.length,thinMarkets:rows.filter(e=>e.quality.some(q=>q.code==='thin')).length,ruleFlagMarkets:rows.filter(e=>e.quality.some(q=>q.code==='rules')).length,firstTradeAt:histories.length?Math.min(...histories.map(e=>e.historySummary.first.t)):null,lastTradeAt:histories.length?Math.max(...histories.map(e=>e.historySummary.last.t)):null}}
})
const searches=['solid state battery','LK-99','superconductor','metal organic framework','direct air capture','MOF','carbon capture','carbon removal','Svante','Atoco','room temperature superconductor commercial','room temperature superconductors before 2033','fusion electricity','quantum error correction','perovskite','sodium ion','battery cost','battery price','batteries','battery energy density','battery storage','lithium sulfur','battery recycling','green hydrogen','hydrogen','electrolysis','plastic recycling','PFAS','AI drug','AI-designed drug','protein design','organic chemistry','chemical synthesis','retrosynthesis','organocatalysis','photoredox','PET recycling','biodegradable plastic','AI chemist']
const index={schemaVersion:'1.0',snapshot:true,topics,events,entities,publishers:publisherRecords,evidence:editorial.evidence,nobel:{years:nobel.years,editions:nobel.editions,sources:[...new Set(nobel.editions.map(e=>e.source))]},method:{source:'Manifold',currency:'MANA',apiDocs:'https://docs.manifold.markets/api',history:'actual-trades-before-close-and-resolution',points:pointCount,counts:{markets:events.length,resolved:events.filter(e=>e.status==='resolved').length,cancelled:events.filter(e=>e.resolution==='CANCEL').length,ruleFlags:events.filter(e=>e.quality.some(q=>q.code==='rules')).length},discoveryQueries:searches}}
index.method.curveAdmission={minimumTradePoints:2,requiresCompleteHistory:true,reviewedAt:curveAdmission.reviewedAt}
fs.writeFileSync(path.join(output,'index.json'),JSON.stringify(index,null,2)+'\n')
const audit={schemaVersion:'1.0',curveAdmissionReview:curveAdmission,editorialReview:{eventBriefs:events.length,industryCases:events.length,evidenceCount:editorial.evidence.length,contexts:Object.keys(contexts).length,literatureTopics:editorial.topics.filter(t=>t.mode==='literature').length,reactionCases:reactionCaseIds.size,topicIndicators:editorial.topics.reduce((sum,t)=>sum+(t.metrics?.length||0),0),sourceFiles:['scripts/science-forecasts/curation.json','scripts/science-forecasts/contexts.json','scripts/science-forecasts/topics.json','scripts/science-forecasts/publishers.json','scripts/science-forecasts/event-date-review-2026-10-29.json','scripts/science-forecasts/source-date-review-2026-10-29.json'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))},organicDiscoveryReview:JSON.parse(fs.readFileSync(path.join(root,'scripts/science-forecasts/organic-discovery-review.json'),'utf8')),grain:'one source market; one observation per distinct actual-trade timestamp',marketCount:events.length,pointCount,checks:['at least two genuine pre-cutoff trade timestamps per forecast','complete history pagination','no new literature-only topic admission','unique market ids','strictly increasing timestamps','finite probabilities in [0,1]','trades strictly before close/resolution/capture boundary','no resolved price substituted for history','cancelled outcomes kept distinct from No','only curated topic joins','logo checksums','no account identities in public projection'],sourceProjectionSha256:crypto.createHash('sha256').update(fs.readFileSync(process.argv[arg+1])).digest('hex'),markets:input.map(m=>({id:m.id,sourceApi:m.sourceApi,status:m.status,resolution:m.resolution,historyCutoff:m.historyCutoff,observedAt:m.observedAt,points:m.points.length,...m.provenance})),discovery:searches.map(q=>({query:q,source:'Manifold',url:`https://api.manifold.markets/v0/search-markets?term=${encodeURIComponent(q)}&limit=30&sort=liquidity&filter=all`}))}
fs.writeFileSync(path.join(root,'scripts/science-forecasts/source-audit.json'),JSON.stringify(audit,null,2)+'\n')
console.log(`Published ${events.length} source-labelled technical markets, ${pointCount} genuine history points and ${nobel.editions.length} preserved Nobel editions.`)
