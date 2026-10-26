import {readFileSync} from 'node:fs'
import {expect,it} from 'vitest'
import {validateCurveAdmission,marketSnapshotDigest} from '../../../scripts/science-forecasts/curveAdmission.mjs'
import index from '../../../public/data/science-forecasts/index.json'
import review from '../../../scripts/science-forecasts/curve-admission-review.json'
const records=index.events.map(e=>JSON.parse(readFileSync(`public/data/science-forecasts/${e.detailFile}`,'utf8')))
const validate=(rows,topics=index.topics)=>validateCurveAdmission(rows,topics,review)
it('admits only the 13 reviewed genuine curves and preserves all 41 original source snapshots',()=>{
 expect(()=>validate(records)).not.toThrow()
 expect(review.markets).toHaveLength(13)
 expect(review.newTradePoints).toBe(1782)
 for(const preserved of review.preservedSnapshots)expect(marketSnapshotDigest(records.find(e=>e.id===preserved.id))).toBe(preserved.sha256)
 for(const accepted of review.markets){const e=records.find(e=>e.id===accepted.id);expect(e.points.length).toBeGreaterThanOrEqual(2);expect(e.points[0].t).toBeLessThan(e.points.at(-1).t)}
})
it.each(['one-point','incomplete','unpaginated','same-time','settlement-time','unreviewed','changed-old-snapshot'])('rejects invalid admission: %s',kind=>{
 const rows=structuredClone(records),fresh=rows.find(e=>e.id===review.markets[0].id)
 if(kind==='one-point')fresh.points=fresh.points.slice(0,1)
 if(kind==='incomplete')fresh.historyComplete=false
 if(kind==='unpaginated')fresh.provenance.historyPages.at(-1).rows=1000
 if(kind==='same-time')fresh.points[1].t=fresh.points[0].t
 if(kind==='settlement-time')fresh.points.at(-1).t=fresh.historyCutoff
 if(kind==='unreviewed')fresh.id='not-reviewed'
 if(kind==='changed-old-snapshot')rows.find(e=>e.id===review.preservedMarketIds[0]).points[0].p=0.123456
 expect(()=>validate(rows)).toThrow()
})
it('rejects new literature-only or curve-free topics while retaining the four pre-existing literature archives',()=>{
 expect(()=>validate(records,[...index.topics,{id:'new-literature',mode:'literature'}])).toThrow(/New topics require/)
 expect(()=>validate(records,[...index.topics,{id:'new-forecast'}])).toThrow(/without a trade curve/)
 expect(index.topics.filter(t=>t.mode==='literature').map(t=>t.id)).toEqual(review.legacyLiteratureTopicIds)
})
