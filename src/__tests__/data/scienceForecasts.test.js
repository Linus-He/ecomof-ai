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
