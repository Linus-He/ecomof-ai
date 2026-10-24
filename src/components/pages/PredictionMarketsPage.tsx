import { useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, Flask, LinkSimple } from '@phosphor-icons/react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLang } from '../../contexts'
import './predictionMarkets.css'

type Point = { t: number; p: number }
type Candidate = { id: string; name: string; winner: boolean; url: string; probability: number; quoteAt: number; points: Point[]; image?: string; researchFocus?: string[]; profileUrl?: string; institution?: { name: string; englishName: string; logo: string; url: string; sourceUrl: string } }
type MarketEdition = { year: number; eventUrl: string; windowStart: number; cutoff: number; winners?: string[]; winnerDetails?: { name: string; url: string; image?: string }[]; unlistedWinners: string[]; candidates: Candidate[] }
const colors = ['#ff5757', '#2156ff', '#a063d8', '#13a37c', '#e89a22', '#147ea3']
export function preAnnouncementCandidates(edition: MarketEdition) {
  return edition.candidates.map(candidate => {
    const points = candidate.points.filter(point => Number.isFinite(point.p) && point.p >= 0 && point.p <= 1 && point.t >= edition.windowStart && point.t < edition.cutoff).sort((a, b) => a.t - b.t)
    return { ...candidate, points, probability: points[points.length - 1]?.p, quoteAt: points[points.length - 1]?.t }
  }).filter(candidate => candidate.points.length > 1 && candidate.probability !== undefined)
}
const percent = (value: number) => `${(value * 100).toFixed(value >= .1 ? 1 : 2).replace(/\.0$/, '')}%`
const cents = (value: number) => `${(value * 100).toFixed(1).replace(/\.0$/, '')}¢`

export function PredictionMarketsPage({ hash }: { hash: string }) {
  const { lang } = useLang(); const zh = lang === 'zh'
  const [years, setYears] = useState<number[]>([])
  const [edition, setEdition] = useState<MarketEdition | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [range, setRange] = useState(24)
  const [attempt, setAttempt] = useState(0)
  const [copied, setCopied] = useState(false)
  const requestedYear = Number(hash.match(/prediction-markets-(\d{4})$/)?.[1]) || null
  const year = requestedYear || years[years.length - 1]
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-odds/index.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(data => setYears(data.years)).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    setEdition(null); setError(false); setSelected([]); setRange(24)
    if (!year || !years.includes(year)) return
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-odds/${year}.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(data => { if (!controller.signal.aborted) { setEdition(data); setSelected(preAnnouncementCandidates(data).slice(0, 4).map(c => c.id)) } }).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [year, years, attempt])
  const candidates = useMemo(() => edition ? preAnnouncementCandidates(edition) : [], [edition])
  const displayed = candidates.filter(candidate => selected.includes(candidate.id))
  const chartData = useMemo(() => {
    if (!edition) return []
    const rows = new Map<number, Record<string, number>>()
    for (const candidate of displayed) for (const point of candidate.points) {
      if (point.t < edition.cutoff - range * 3600) continue
      if (!rows.has(point.t)) rows.set(point.t, { x: point.t - edition.cutoff })
      rows.get(point.t)![candidate.id] = point.p * 100
    }
    return [...rows].sort((a, b) => a[0] - b[0]).map(([, row]) => row)
  }, [edition, selected, range, candidates])
  const currentIndex = years.indexOf(year || 0)
  const navigate = (next: number) => { window.location.hash = `prediction-markets-${next}` }
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { setCopied(false) } }
  return <main className="prediction-page">
    <a className="prediction-back" href="#unified-search">{zh ? '返回首页' : 'Back to home'} <ArrowSquareOut size={14} /></a>
    <div className="prediction-page-intro"><div><span className="prediction-eyebrow">PREDICTION MARKETS</span><h1>{zh ? '开奖前的市场判断' : 'Before the announcement'}</h1><p>{zh ? '从历史报价，回看市场如何预测科学发现。' : 'Explore the market’s view before the discoveries were announced.'}</p></div>
      <div className="prediction-year" aria-label={zh ? '切换市场年份' : 'Market year'}><button disabled={currentIndex <= 0} onClick={() => navigate(years[currentIndex - 1])} aria-label={zh ? '上一年' : 'Previous year'}>−</button><select aria-label={zh ? '市场年份' : 'Market year'} value={year || ''} onChange={e => navigate(Number(e.target.value))}>{years.map(y => <option key={y}>{y}</option>)}</select><button disabled={currentIndex < 0 || currentIndex >= years.length - 1} onClick={() => navigate(years[currentIndex + 1])} aria-label={zh ? '下一年' : 'Next year'}>+</button></div>
    </div>
    {error ? <div className="prediction-state" role="alert"><p>{zh ? '历史市场暂时无法加载。' : 'The historical market could not be loaded.'}</p><button onClick={() => setAttempt(a => a + 1)}>{zh ? '重试' : 'Retry'}</button></div> : !year ? <p role="status">{zh ? '正在加载可用年份…' : 'Loading available years…'}</p> : !years.includes(year) ? <div className="prediction-state"><h2>{year}</h2><p>{zh ? '这个年份尚无可核验的 Chemistry 市场历史。请从上方选择已有数据的年份。' : 'No verified Chemistry market history is available for this year. Select an available year above.'}</p></div> : !edition ? <p role="status">{zh ? '正在加载历史报价…' : 'Loading historical prices…'}</p> : <section className="prediction-market" aria-labelledby="prediction-event-title">
      <header className="prediction-market-header"><div className="prediction-category-icon"><Flask size={34} weight="duotone" /></div><div><p>{zh ? '科学 · 年度获奖预测' : 'Science · Annual award predictions'}</p><h2 id="prediction-event-title">The Nobel Prize in Chemistry {edition.year}</h2></div><div className="prediction-actions"><button onClick={copyLink} aria-label={zh ? '复制本页链接' : 'Copy page link'} title={copied ? (zh ? '已复制' : 'Copied') : (zh ? '复制链接' : 'Copy link')}><LinkSimple size={23} /></button><a href={edition.eventUrl} target="_blank" rel="noreferrer" aria-label="Open event on Polymarket"><ArrowSquareOut size={23} /></a></div></header>
      <div className="prediction-winners" aria-label={zh ? '本年度实际得主' : 'Actual laureates'}><span>{zh ? '实际获奖者' : 'ACTUAL LAUREATES'}</span><div>{edition.winnerDetails?.map(person => <a key={person.name} href={person.url} target="_blank" rel="noreferrer">{person.image && <img src={`${import.meta.env.BASE_URL}${person.image}`} alt="" loading="lazy" />}<strong>{person.name}</strong><ArrowSquareOut size={13} /></a>) || edition.winners?.map(name => <strong key={name}>{name}</strong>)}</div><a className="prediction-winner-source" href={`https://www.nobelprize.org/prizes/chemistry/${edition.year}/summary/`} target="_blank" rel="noreferrer">NobelPrize.org ↗</a></div>
      <div className="prediction-chart-brand"><a href={edition.eventUrl} target="_blank" rel="noreferrer">Polymarket</a></div>
      <div className="prediction-legend" aria-label={zh ? '曲线图例' : 'Chart legend'}>{displayed.map((candidate, index) => <button key={candidate.id} style={{ color: colors[index % colors.length] }} onClick={() => setSelected(ids => ids.filter(id => id !== candidate.id))}><span aria-hidden="true">●</span> {candidate.name} <strong>{percent(candidate.probability!)}</strong></button>)}</div>
      <div className="prediction-chart" role="img" aria-label={zh ? '开奖前历史隐含概率曲线；各候选人的最后报价见下表' : 'Historical pre-announcement probabilities; final available quotes are listed below'}>
        {selected.length === 0 ? <div className="prediction-empty-chart">{zh ? '勾选下方候选人，查看概率曲线。' : 'Select a candidate below to show a price history.'}</div> : <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 16, right: 0, left: 4, bottom: 12 }}><CartesianGrid stroke="#d8dde5" strokeDasharray="2 6" vertical={false} /><XAxis dataKey="x" type="number" domain={[-range * 3600, 0]} ticks={[-range * 3600, -range * 1800, 0]} axisLine={false} tickLine={false} tick={{ fill: '#777f8e', fontSize: 12 }} tickFormatter={x => x === 0 ? (zh ? '公布前' : 'Before announcement') : x === -range * 3600 ? (zh ? '观察窗口起点' : 'Window start') : (zh ? '观察窗口中段' : 'Mid-window')} /><YAxis orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} width={48} tick={{ fill: '#777f8e', fontSize: 13 }} tickFormatter={v => `${v}%`} /><Tooltip labelFormatter={() => zh ? '公布前历史报价' : 'Historical pre-announcement quote'} formatter={(value: number, name: string) => [`${Number(value).toFixed(2)}%`, candidates.find(c => c.id === name)?.name || name]} contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13 }} />{displayed.map((candidate, index) => <Line key={candidate.id} name={candidate.id} dataKey={candidate.id} type="linear" stroke={colors[index % colors.length]} strokeWidth={2.3} dot={false} connectNulls isAnimationActive={false} />)}</LineChart></ResponsiveContainer>}
      </div>
      <div className="prediction-chart-toolbar"><a href={edition.eventUrl} target="_blank" rel="noreferrer">{zh ? '来源：Polymarket.com' : 'Source: Polymarket.com'}</a><div className="prediction-ranges" aria-label={zh ? '历史范围' : 'History range'}>{[1, 6, 24].map(hours => <button key={hours} aria-pressed={range === hours} onClick={() => setRange(hours)}>{hours === 24 ? (zh ? '最后一天' : 'Final day') : zh ? `最后 ${hours} 小时` : `Final ${hours}h`}</button>)}</div></div>
      <p className="prediction-method">{zh ? '采用官方预定最早公布时刻之前的历史 Yes 报价，排除结算后的价格。每个人是独立市场，可以多人获奖，概率合计不必为 100%。' : 'Historical Yes prices before the earliest scheduled announcement, excluding settlement. Candidates have independent markets; several may win, so probabilities need not total 100%.'}</p>
      {edition.unlistedWinners.length > 0 && <p className="prediction-coverage">{zh ? '实际得主未被单独开设市场：' : 'The eventual laureates had no individual markets: '}{edition.unlistedWinners.join(' · ')}{zh ? '。下方保留当时已开盘的候选市场。' : '. Listed candidates reflect the markets that existed.'}</p>}
      <div className="prediction-candidates" aria-label={zh ? '候选人历史报价' : 'Candidate historical quotes'}>{candidates.map(candidate => { const index = displayed.findIndex(c => c.id === candidate.id); return <article className="prediction-candidate" key={candidate.id}><div className="prediction-candidate-name"><input id={`candidate-${candidate.id}`} type="checkbox" checked={selected.includes(candidate.id)} disabled={!selected.includes(candidate.id) && selected.length >= 6} onChange={() => setSelected(ids => ids.includes(candidate.id) ? ids.filter(id => id !== candidate.id) : [...ids, candidate.id])} aria-label={`${zh ? '显示' : 'Show'} ${candidate.name}`} style={{ accentColor: index >= 0 ? colors[index % colors.length] : '#2156ff' }} />{candidate.image && <img src={`${import.meta.env.BASE_URL}${candidate.image}`} alt="" loading="lazy" />}<span><span className="prediction-name-line"><label htmlFor={`candidate-${candidate.id}`}><strong>{candidate.name}</strong></label>{candidate.institution && <a className="prediction-affiliation" href={candidate.institution.sourceUrl} target="_blank" rel="noreferrer" title={candidate.institution.englishName}><img src={`${import.meta.env.BASE_URL}${candidate.institution.logo}`} alt="" loading="lazy" /><span>{zh ? candidate.institution.name : candidate.institution.englishName}</span></a>}</span><small className="prediction-research-focus">{candidate.researchFocus?.[zh ? 0 : 1] || (zh ? '候选人市场' : 'Candidate market')}{candidate.profileUrl && <> <a href={candidate.profileUrl} target="_blank" rel="noreferrer" aria-label={`${candidate.name} · ${zh ? '研究方向来源' : 'Research profile'}`}>↗</a></>}</small></span></div><div className="prediction-probability"><strong>{percent(candidate.probability!)}</strong><small>{zh ? '最后可用报价' : 'Last available quote'}</small></div><div className="prediction-quotes"><a className="prediction-yes" href={candidate.url} target="_blank" rel="noreferrer">Yes {cents(candidate.probability!)}</a><a className="prediction-no" href={candidate.url} target="_blank" rel="noreferrer">No {cents(1 - candidate.probability!)}</a></div></article>})}</div>
      <p className="prediction-method">{zh ? 'Yes / No 显示历史互补价格；点击可查看原始市场。曲线为历史价格采样，各候选人的最后可用采样点可能不同。' : 'Yes / No show historical complementary prices and link to the source market. Curves use price-history samples; the final available sample may differ by candidate.'} <a href="https://docs.polymarket.com/api-reference/markets/get-prices-history" target="_blank" rel="noreferrer">{zh ? '数据口径' : 'Data method'} ↗</a></p>
    </section>}
  </main>
}
