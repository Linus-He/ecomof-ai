import {readFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {expect,it} from 'vitest'
import index from '../../../public/data/science-forecasts/index.json'
import reviews from '../../../scripts/science-forecasts/event-date-review-2026-10-29.json'
it('reviews each event title and every market date against the source without refreshing archived dates',()=>{
 expect(reviews.markets).toHaveLength(54)
 for(const summary of index.events){
  const event=JSON.parse(readFileSync('public/data/science-forecasts/'+summary.detailFile,'utf8'))
  expect(event.dateReview.originalTitleMatches).toBe(true)
  expect(event.dateReview.dates).toHaveLength(3)
  for(const date of event.dateReview.dates){expect(date.matches).toBe(true);expect(event[date.field]).toBe(date.archived);expect(date.current).toBe(date.archived)}
 }
})
it('requires individual date classification, inspectable evidence and an authentic branded citation for all 50 sources',()=>{
 expect(index.evidence).toHaveLength(50)
 for(const e of index.evidence){
  expect(e.sourceReview.status).not.toBe('unreviewed')
  expect(e.sourceReview.basis).toHaveLength(2)
  expect(e.sourceReview.source).toMatch(/^https:/)
  const ids=[e.publisherId,...(e.newsSources||[]).map(s=>s.publisherId)]
  expect(ids.some(id=>index.publishers.some(p=>p.id===id&&p.logo))).toBe(true)
  if(e.sourceReview.status==='verified-date-only')expect(e.publishedDate).toBe(e.sourceReview.dateValue)
 }
 for(const p of index.publishers.filter(p=>p.logo)){const path='public/'+p.logo;expect(existsSync(path)).toBe(true);expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(p.sha256)}
 expect(index.evidence.find(e=>e.id==='bnetza-hydrogen-core').publishedDate).toBeUndefined()
 expect(index.evidence.find(e=>e.id==='lk99-replication').submissionDate).toBe('2023-08-07')
 expect(index.evidence.find(e=>e.id==='doe-carbon-negative-2032').sourceReview.status).toBe('updated-page')
})
