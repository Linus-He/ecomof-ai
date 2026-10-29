import {describe,it,expect} from 'vitest'
import {DAY,historyWindow,summarizeHistory,publicationNeighbors,formatHistoryDate} from '../../utils/forecastHistory'
const day=(n:number)=>Date.UTC(2026,0,n)
const points=[{t:day(1),p:.2},{t:day(3),p:.4},{t:day(4),p:.3},{t:day(10),p:.5}]
describe('observable forecast history',()=>{
 it('calculates percentage-point change from observations, not settlement or the platform snapshot',()=>{
  const s=summarizeHistory(points)!
  expect(s.change).toBe(30);expect(s.low.p).toBe(.2);expect(s.high.p).toBe(.5);expect(s.count).toBe(4)
  expect(s.maxGap).toBe(6*DAY);expect(s.largestMoves[0].delta).toBeCloseTo(20)
  expect(summarizeHistory([])).toBeNull();expect(summarizeHistory([points[0]])?.count).toBe(1)
 })
 it('anchors recent history to real activity and preserves genuine empty archive windows',()=>{
  expect(historyWindow(points,day(31),24,'trade').points).toEqual([points[3]])
  expect(historyWindow(points,day(31),24,'archive').points).toEqual([])
  expect(historyWindow(points,day(10),0,'trade').points).not.toContain(points[3])
 })
 it('uses inclusive UTC date bounds without inventing boundary prices',()=>{
  expect(historyWindow(points,day(31),0,'trade','2026-01-03','2026-01-04').points).toEqual(points.slice(1,3))
  expect(historyWindow(points,day(31),0,'trade','2026-01-10','2026-01-01').invalid).toBe(true)
  expect(formatHistoryDate(points[0].t,true)).toBe('2026-01-01 00:00:00 UTC')
 })
 it('excludes the entire publication day, applies a bounded neighbor window and leaves missing prices null',()=>{
  const result=publicationNeighbors(points,'2026-01-03',day(31))!
  expect(result.before).toEqual(points[0]);expect(result.after).toEqual(points[3]);expect(result.delta).toBeCloseTo(30)
  expect(publicationNeighbors(points,'2026-01-25',day(31))?.delta).toBeNull()
  expect(publicationNeighbors(points,'2026-02-01',day(31))?.afterCutoff).toBe(true)
  expect(publicationNeighbors(points,'2025-12-01',day(31))?.beforeHistory).toBe(true)
 })
})

it('rejects impossible calendar dates and excludes timezone-ambiguous times and the eighth search day',()=>{
 expect(publicationNeighbors(points,'2026-02-30',day(31))).toBeNull()
 const end=day(3)+DAY+14*3600000
 const result=publicationNeighbors([{t:day(2)+20*3600000,p:.1},{t:day(4),p:.2},{t:end,p:.3},{t:end+7*DAY,p:.9}],'2026-01-03',day(31))!
 expect(result.before).toBeNull();expect(result.after?.p).toBe(.3);expect(result.delta).toBeNull()
})
