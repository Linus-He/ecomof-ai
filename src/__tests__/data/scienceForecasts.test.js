import {readFileSync,existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {describe,expect,it} from 'vitest'
import index from '../../../public/data/science-forecasts/index.json'
import audit from '../../../scripts/science-forecasts/source-audit.json'
import nobel from '../../../public/data/nobel-odds/index.json'
const load=(file)=>JSON.parse(readFileSync(resolve('public/data/science-forecasts',file),'utf8'))
describe('source-backed science forecasts',()=>{
 it('keeps source-market grain, distinct outcomes and the original Nobel archive',()=>{
  expect(new Set(index.events.map(e=>e.id)).size).toBe(index.events.length)
  expect(index.nobel.editions).toEqual(nobel.editions)
  expect(index.events.every(e=>e.source==='Manifold'&&e.currency==='MANA')).toBe(true)
  expect(index.events.some(e=>e.resolution==='CANCEL')).toBe(true)
  expect(index.events.some(e=>e.resolution==='YES')).toBe(true)
  expect(index.events.some(e=>e.resolution==='NO')).toBe(true)
 })
 it('retains only bounded genuine history with complete source pagination and no user identities',()=>{
  let count=0
  for(const summary of index.events){
   const event=load(summary.detailFile)
   expect(event.points.length).toBe(summary.tradePoints)
   expect(event.provenance.historyPages[event.provenance.historyPages.length-1].rows).toBeLessThan(1000)
   expect(event.provenance.acceptedTradeRows).toBeGreaterThanOrEqual(event.points.length)
   for(let i=0;i<event.points.length;i++){
    const point=event.points[i];expect(point.p).toBeGreaterThanOrEqual(0);expect(point.p).toBeLessThanOrEqual(1)
    expect(point.t).toBeLessThan(event.historyCutoff)
    if(i)expect(point.t).toBeGreaterThan(event.points[i-1].t)
   }
   if(event.status==='resolved')expect(event.snapshotProbability).toBeNull()
   expect(JSON.stringify(event)).not.toMatch(/"(?:userId|userName|creatorId|creatorName|creatorUsername)"/)
   expect(event.sourceApi).toBe(`https://api.manifold.markets/v0/market/${event.id}`)
   count+=event.points.length
  }
  expect(count).toBe(index.method.points);expect(audit.pointCount).toBe(count)
 })
 it('labels rule conflicts and prevents broken topic, institution and evidence joins',()=>{
  expect(index.events.find(e=>e.id==='Shc85pllS8')?.quality.some(q=>q.code==='rules')).toBe(true)
  for(const e of index.events){expect(index.topics.some(t=>t.id===e.topicId)).toBe(true);expect(e.rules.length).toBeGreaterThan(0);expect(e.title).toHaveLength(2);expect(e.interpretation).toHaveLength(2)
   for(const id of e.entities)expect(index.entities.some(o=>o.id===id)).toBe(true)
   for(const id of e.evidence)expect(index.evidence.some(o=>o.id===id)).toBe(true)
  }
  for(const t of index.topics)expect(t.marketCount).toBe(index.events.filter(e=>e.topicId===t.id).length)
  for(const e of index.entities){const p=resolve('public',e.logo);expect(existsSync(p)).toBe(true);expect(createHash('sha256').update(readFileSync(p)).digest('hex')).toBe(e.sha256)}
 })
})

it('gives every event a specific brief, technology explanation, industry pathway and complete source joins',()=>{
 for(const summary of index.events){
  const event=load(summary.detailFile)
  expect(event.briefing.summary.every(s=>s.length>25)).toBe(true)
  expect(event.briefing.checklist).toHaveLength(3)
  expect(event.context.principle).toHaveLength(2);expect(event.context.example).toHaveLength(2)
  expect(event.industry.impact.every(s=>s.length>60)).toBe(true)
  expect(event.industry.gap.every(s=>s.trim().length>0)).toBe(true)
  expect(event.evidence.length).toBeGreaterThan(0)
  for(const id of [...event.context.evidence,...event.industry.evidence])expect(event.evidence).toContain(id)
  for(const id of event.industry.entities)expect(index.entities.some(e=>e.id===id)).toBe(true)
  for(const id of event.relatedIds){expect(id).not.toBe(event.id);expect(index.events.some(e=>e.id===id)).toBe(true)}
 }
 const report=index.evidence.find(e=>e.id==='donut-energy')
 expect(report.documentDate).toBe('2026-09-01');expect(report.publishedDate).toBeUndefined()
 expect(index.evidence.find(e=>e.id==='donut-elements').publishedDate).toBe('2026-09-23')
})

it('keeps new topics source-backed with country basis and no synthetic resolution',()=>{
 for(const id of ['fusion-energy','quantum-computing','perovskite-solar']){
  const topic=index.topics.find(t=>t.id===id)
  expect(topic.marketCount).toBeGreaterThanOrEqual(3)
  expect(topic.sections.length).toBeGreaterThanOrEqual(3)
  expect(topic.evidenceIds.length).toBeGreaterThanOrEqual(2)
 }
 for(const entity of index.entities){
  expect(entity.country.code).toMatch(/^[A-Z]{2}$/)
  expect(entity.country.name).toHaveLength(2)
  expect(entity.country.basis).toHaveLength(2)
  expect(entity.country.source).toMatch(/^https:/)
 }
 expect(index.entities.find(e=>e.id==='oxfordpv').country.code).toBe('GB')
 expect(index.events.find(e=>e.id==='oocJB7zxHwURka0HYfbo').status).toBe('closed')
 expect(index.events.find(e=>e.id==='oocJB7zxHwURka0HYfbo').resolution).toBeNull()
})

it('verifies indicator types, source scope and topic coverage against actual histories',()=>{
 const ids=new Set()
 for(const topic of index.topics){
  const events=index.events.filter(e=>e.topicId===topic.id)
  expect(topic.coverage.historyPoints).toBe(events.reduce((sum,e)=>sum+e.tradePoints,0))
  expect(topic.coverage.marketsWithHistory).toBe(events.filter(e=>e.historySummary).length)
  expect(topic.coverage.thinMarkets).toBe(events.filter(e=>e.quality.some(q=>q.code==='thin')).length)
  for(const metric of topic.metrics||[]){
   expect(ids.has(metric.id)).toBe(false);ids.add(metric.id)
   expect(['measurement','reported','company','model','target','pipeline']).toContain(metric.kind)
   for(const field of ['label','value','period','scope'])expect(metric[field].length===2&&metric[field].every(s=>s.trim().length>0)).toBe(true)
   const source=index.evidence.find(e=>e.id===metric.evidenceId)
   expect(source?.topics).toContain(topic.id)
  }
 }
 expect(ids.size).toBe(71)
 expect(index.events.filter(e=>['solid-state-batteries','sodium-ion-batteries','battery-scale-storage'].includes(e.topicId))).toHaveLength(23)
 expect(index.events.find(e=>e.id==='S2ghII2gLd').quality.some(q=>q.code==='rules')).toBe(true)
 expect(index.events.find(e=>e.id==='jcYZt1lNCMgX4LHHqgoq').quality.some(q=>q.code==='rules')).toBe(true)
 const hydrogen=index.topics.find(t=>t.id==='clean-hydrogen')
 expect(hydrogen.metrics.find(m=>m.id==='hydrogen-shot-goal').kind).toBe('target')
 expect(index.topics.find(t=>t.id==='battery-scale-storage').metrics.find(m=>m.id==='eia-bess-power').value[0]).toContain('GW')
})

it('keeps organic literature separate from forecasts and joins every reported reaction to its sources',()=>{
 const literature=index.topics.filter(t=>t.mode==='literature')
 expect(literature).toHaveLength(4)
 const seen=new Set()
 for(const topic of literature){
  expect(topic.marketCount).toBe(0)
  expect(topic.coverage.historyPoints).toBe(0)
  expect(topic.marketNote).toHaveLength(2)
  expect(topic.metrics.length).toBeGreaterThan(0)
  for(const reaction of topic.reactionCases){
   expect(seen.has(reaction.id)).toBe(false);seen.add(reaction.id)
   for(const key of ['title','transformation','catalyst','conditions','outcome','limits','locator'])expect(reaction[key].length===2&&reaction[key].every(s=>s.trim())).toBe(true)
   for(const id of reaction.evidenceIds)expect(index.evidence.find(e=>e.id===id)?.topics).toContain(topic.id)
  }
 }
 expect(seen.size).toBe(9)
 expect(index.events).toHaveLength(54)
 expect(index.method.points).toBe(12793)
 const da=literature.find(t=>t.id==='asymmetric-organocatalysis').reactionCases.find(c=>c.id==='iminium-diels-alder')
 expect(da.outcome[0]).toContain('exo:endo 1.3:1');expect(da.outcome[0]).toContain('exo 为 93% ee')
 expect(audit.organicDiscoveryReview.acceptedNewMarkets).toBe(0)
 expect(audit.organicDiscoveryReview.queries).toHaveLength(8)
})
