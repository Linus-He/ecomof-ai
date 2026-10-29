import crypto from 'node:crypto'
const sourceFields=['id','topicId','source','currency','url','originalTitle','status','resolution','resolutionProbability','snapshotProbability','volume','participants','createdTime','closeTime','resolutionTime','observedAt','historyCutoff','points','historyComplete','lastTradeProbability','lastTradeAt','sourceApi','provenance']
export const marketSnapshotDigest=record=>crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(sourceFields.map(key=>[key,record[key]])))).digest('hex')
/** Enforce reviewed, source-backed curve admission before publishing any files. */
export function validateCurveAdmission(records, topics, review) {
 const accepted = new Map(review.markets.map(m => [m.id, m]))
 const preserved = new Set(review.preservedMarketIds)
 const preservedHashes = new Map(review.preservedSnapshots.map(m=>[m.id,m.sha256]))
 const ids = new Set()
 if (preservedHashes.size !== preserved.size || accepted.size !== review.markets.length || accepted.size !== review.acceptedNewMarkets || review.markets.reduce((n,m) => n + m.points, 0) !== review.newTradePoints) throw Error('Curve admission count mismatch')
 for (const record of records) {
  if (ids.has(record.id)) throw Error('Duplicate curve: ' + record.id)
  ids.add(record.id)
  if (!preserved.has(record.id) && !accepted.has(record.id)) throw Error('Unreviewed curve: ' + record.id)
  const pages = record.provenance?.historyPages
  if (record.historyComplete !== true || !Array.isArray(record.points) || record.points.length < 2 || !pages?.length || pages.some((p,i)=>!Number.isInteger(p.rows)||p.rows<0||(i<pages.length-1?p.rows!==1000:p.rows>=1000))) throw Error('A forecast requires a complete genuine trade curve: ' + record.id)
  if (!Number.isFinite(record.historyCutoff) || !Number.isInteger(record.provenance.acceptedTradeRows) || record.provenance.acceptedTradeRows < record.points.length) throw Error('Invalid trade provenance: ' + record.id)
  let previous = -Infinity
  for (const p of record.points) {
   if (!Number.isFinite(p.t) || p.t <= previous || p.t >= record.historyCutoff || !Number.isFinite(p.p) || p.p < 0 || p.p > 1) throw Error('Invalid pre-cutoff curve: ' + record.id)
   previous = p.t
  }
  const match = accepted.get(record.id)
  if (preserved.has(record.id) && marketSnapshotDigest(record)!==preservedHashes.get(record.id)) throw Error('Preserved source snapshot changed: ' + record.id)
  if (match && (match.topicId !== record.topicId || match.points !== record.points.length || match.sourceApi !== record.sourceApi || match.historyPages !== pages.length || JSON.stringify(match.first) !== JSON.stringify(record.points[0]) || JSON.stringify(match.last) !== JSON.stringify(record.points.at(-1)))) throw Error('Curve admission/source mismatch: ' + record.id)
 }
 for (const id of [...preserved, ...accepted.keys()]) if (!ids.has(id)) throw Error('Reviewed market missing: ' + id)
 for (const topic of topics) {
  if (topic.mode === 'literature') throw Error('New topics require genuine trade curves: ' + topic.id)
  else if (topic.id !== 'nobel' && !records.some(r => r.topicId === topic.id)) throw Error('Forecast topic without a trade curve: ' + topic.id)
 }
}
