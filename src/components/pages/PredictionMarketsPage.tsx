import { useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, ArrowLeft, DownloadSimple, Flask, LinkSimple } from '@phosphor-icons/react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLang } from '../../contexts'
import './predictionMarkets.css'

type Point = { t: number; p: number }
type Candidate = { id: string; name: string; winner: boolean; url: string; probability: number; quoteAt: number; points: Point[]; kind?: string; image?: string; researchFocus?: string[]; profileUrl?: string; institution?: { name: string; englishName: string; logo: string; url: string; sourceUrl: string } }
type MarketEdition = { year: number; source?: string; marketKind?: string; sparseHistory?: boolean; excluded?: {answer:string;reason:string}[]; eventUrl: string; windowStart: number; cutoff: number; winners?: string[]; winnerDetails?: { name: string; url: string; image?: string; affiliations?: string[] }[]; unlistedWinners: string[]; candidates: Candidate[] }
const colors = ['#ff5757', '#2156ff', '#a063d8', '#13a37c', '#e89a22', '#147ea3']
export function preAnnouncementCandidates(edition: MarketEdition) {
  return edition.candidates.map(candidate => {
    const points = candidate.points.filter(point => Number.isFinite(point.p) && point.p >= 0 && point.p <= 1 && point.t >= edition.windowStart && point.t < edition.cutoff).sort((a, b) => a.t - b.t)
    return { ...candidate, points, probability: points[points.length - 1]?.p, quoteAt: points[points.length - 1]?.t }
  }).filter(candidate => candidate.points.length > 0 && candidate.probability !== undefined)
}
const percent = (value: number) => `${(value * 100).toFixed(value >= .1 ? 1 : 2).replace(/\.0$/, '')}%`
const cents = (value: number) => `${(value * 100).toFixed(1).replace(/\.0$/, '')}¢`

export function PredictionMarketsPage({ hash }: { hash: string }) {
  const { lang } = useLang(); const zh = lang === 'zh'
  const suffix=hash.match(/-(polymarket|manifold|kalshi)$/)?.[1]
  const platformFromHash=suffix ? suffix[0].toUpperCase()+suffix.slice(1) : 'all'
  const [editions, setEditions] = useState<{year:number;source:string;file?:string}[]>([])
  const [platform, setPlatform] = useState(platformFromHash)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('probability')
  const [years, setYears] = useState<number[]>([])
  const [edition, setEdition] = useState<MarketEdition | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [range, setRange] = useState(24)
  const [attempt, setAttempt] = useState(0)
  const [copied, setCopied] = useState(false)
  const requestedYear = Number(hash.match(/prediction-markets-(\d{4})(?:-(?:polymarket|manifold|kalshi))?$/)?.[1]) || null
  const year = requestedYear || years[years.length - 1]
  useEffect(()=>setPlatform(platformFromHash),[platformFromHash])
  const editionFile=editions.find(e=>e.year===year && (platform==='all' ? !e.file || e.file===`${year}.json` : e.source===platform))?.file || (platform==='all' ? `${year}.json` : editions.find(e=>e.year===year && e.source===platform) ? `${year}.json` : null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-odds/index.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(data => {setYears(data.years); setEditions(data.editions || data.years.map((year:number)=>({year,source:'Polymarket'})))}).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    setEdition(null); setError(false); setSelected([]); setRange(24); setQuery('')
    if (!year || !years.includes(year) || !editionFile) return
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/nobel-odds/${editionFile}`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json() }).then(data => { if(data.year!==year) throw Error('Wrong market year'); if (!controller.signal.aborted) { setEdition(data); if(data.sparseHistory) setRange(Math.max(24,Math.ceil((data.cutoff-data.windowStart)/3600))); setSelected(preAnnouncementCandidates(data).slice(0, 4).map(c => c.id)) } }).catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [year, years, editionFile, attempt])
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
  const availableYears = platform==='all' ? years : [...new Set(editions.filter(e=>e.source===platform).map(e=>e.year))]
  const currentIndex = availableYears.indexOf(year || 0)
  const rows = [...candidates].filter(c=>`${c.name} ${c.institution?.name || ''} ${c.institution?.englishName || ''} ${c.researchFocus?.join(' ') || ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>sort==='name' ? a.name.localeCompare(b.name) : (b.probability ?? 0)-(a.probability ?? 0))
  const source = edition?.source || 'Polymarket'
  const allHours = edition ? Math.max(24,Math.ceil((edition.cutoff-edition.windowStart)/3600)) : 24
  const download = () => {
    if (!edition) return
    const esc=(v:unknown)=>`"${String(v).replace(/"/g,'""')}"`
    const csv=[['Year','Platform','Option','Institution','Probability','Hours before cutoff','Market URL'],...rows.map(c=>[edition.year,source,c.name,c.institution?.englishName || '',c.probability,((edition.cutoff-c.quoteAt!)/3600).toFixed(2),c.url])].map(row=>row.map(esc).join(',')).join('\r\n')
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`chemistry-market-${edition.year}-${source.toLowerCase()}.csv`;anchor.click();URL.revokeObjectURL(url)
  }
  const navigate = (next: number, selectedPlatform=platform) => { window.location.hash = `prediction-markets-${next}${selectedPlatform==='all'?'':`-${selectedPlatform.toLowerCase()}`}` }
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { setCopied(false) } }
  return <main className="prediction-page">
    <a className="prediction-back" href="#unified-search"><ArrowLeft size={14} /> {zh ? '返回首页' : 'Back to home'}</a>
    <div className="prediction-page-intro"><div><span className="prediction-eyebrow">PREDICTION MARKETS</span><h1>{zh ? '开奖前的市场判断' : 'Before the announcement'}</h1><p>{zh ? '从历史报价，回看市场如何预测科学发现。' : 'Explore the market’s view before the discoveries were announced.'}</p></div>
      <div className="prediction-year" aria-label={zh ? '切换市场年份' : 'Market year'}><button disabled={currentIndex <= 0} onClick={() => navigate(availableYears[currentIndex - 1])} aria-label={zh ? '上一年' : 'Previous year'}>−</button><select aria-label={zh ? '市场年份' : 'Market year'} value={year || ''} onChange={e => navigate(Number(e.target.value))}>{year && !availableYears.includes(year) && <option disabled value={year}>{year}</option>}{availableYears.map(y => <option key={y}>{y}</option>)}</select><button disabled={currentIndex < 0 || currentIndex >= availableYears.length - 1} onClick={() => navigate(availableYears[currentIndex + 1])} aria-label={zh ? '下一年' : 'Next year'}>+</button></div>
    </div>
    <div className="prediction-platforms" aria-label={zh ? '数据来源平台' : 'Data platform'}>{['all',...['Polymarket','Kalshi','Manifold'].filter(name=>editions.some(e=>e.source===name))].map(value=><button key={value} aria-pressed={platform===value} onClick={()=>{setPlatform(value);const next=[...new Set(editions.filter(e=>value==='all'||e.source===value).map(e=>e.year))];navigate(next.includes(year)?year:next[next.length-1],value)}}>{value==='all' ? (zh?'全部平台':'All platforms') : value}</button>)}</div>
    {error ? <div className="prediction-state" role="alert"><p>{zh ? '历史市场暂时无法加载。' : 'The historical market could not be loaded.'}</p><button onClick={() => setAttempt(a => a + 1)}>{zh ? '重试' : 'Retry'}</button></div> : !year ? <p role="status">{zh ? '正在加载可用年份…' : 'Loading available years…'}</p> : (!years.includes(year) || !editionFile) ? <div className="prediction-state"><h2>{year}</h2><p>{zh ? '这个年份尚无可核验的 Chemistry 市场历史。请从上方选择已有数据的年份。' : 'No verified Chemistry market history is available for this year. Select an available year above.'}</p></div> : !edition ? <p role="status">{zh ? '正在加载历史报价…' : 'Loading historical prices…'}</p> : <section className="prediction-market" aria-labelledby="prediction-event-title">
      <header className="prediction-market-header"><div className="prediction-category-icon"><Flask size={34} weight="duotone" /></div><div><p>{zh ? '科学 · 年度获奖预测' : 'Science · Annual award predictions'}</p><h2 id="prediction-event-title">The Nobel Prize in Chemistry {edition.year}</h2></div><div className="prediction-actions"><button onClick={copyLink} aria-label={zh ? '复制本页链接' : 'Copy page link'} title={copied ? (zh ? '已复制' : 'Copied') : (zh ? '复制链接' : 'Copy link')}><LinkSimple size={23} /></button><a href={edition.eventUrl} target="_blank" rel="noreferrer" aria-label={`Open event on ${source}`}><ArrowSquareOut size={23} /></a></div></header>
      <div className="prediction-winners" aria-label={zh ? '本年度实际得主' : 'Actual laureates'}><span>{zh ? '实际获奖者' : 'ACTUAL LAUREATES'}</span><div>{edition.winnerDetails?.map(person => <a key={person.name} href={person.url} target="_blank" rel="noreferrer">{person.image && <img src={`${import.meta.env.BASE_URL}${person.image}`} alt="" loading="lazy" />}<span><strong>{person.name}</strong>{person.affiliations?.length ? <small>{person.affiliations.join(' · ')}</small> : null}</span><ArrowSquareOut size={13} /></a>) || edition.winners?.map(name => <strong key={name}>{name}</strong>)}</div><a className="prediction-winner-source" href={`https://www.nobelprize.org/prizes/chemistry/${edition.year}/summary/`} target="_blank" rel="noreferrer">NobelPrize.org ↗</a></div>
      {source==='Kalshi' && <p className="prediction-coverage">{zh ? 'Kalshi · 使用有真实成交的一分钟柱收盘价，空柱与前值填充不计入；停盘后的空白时段不补画报价。柱的结束时刻是统计边界，不是精确成交时刻；官方市场记录入口保留规则原文。没有可核实成交的候选人未填入零概率。' : 'Kalshi · One-minute closes with positive traded volume. Empty candles and carried previous prices are excluded. Candle boundaries are not exact trade timestamps; the source record retains the rules.'}</p>}
      <div className="prediction-chart-brand"><a href={edition.eventUrl} target="_blank" rel="noreferrer">{source}</a></div>
      {source==='Manifold' && <p className="prediction-coverage">{zh ? `Manifold 虚拟积分市场 · ${edition.marketKind==='field' ? '预测获奖领域，不是候选人概率' : '预测候选人或其他选项'}。显示各选项最后可核实的成交后概率，不是同一时刻的完整报价。` : 'Manifold play-money market. Values are the last directly recorded trade probabilities, not a synchronized snapshot.'} {edition.year===2023 && (zh ? '本年按获奖信息提前公开前截断，排除泄露后的成交。' : 'This edition excludes trades after the early disclosure.')} {edition.excluded?.length ? (zh ? '无法核对身份或缺少公布前成交的选项已排除；完整选项见原市场。' : 'Unverified identities and options without pre-cutoff trades are excluded.') : ''}</p>}
      <div className="prediction-legend" aria-label={zh ? '曲线图例' : 'Chart legend'}>{displayed.map((candidate, index) => <button key={candidate.id} style={{ color: colors[index % colors.length] }} onClick={() => setSelected(ids => ids.filter(id => id !== candidate.id))}><span aria-hidden="true">●</span> {candidate.name} <strong>{percent(candidate.probability!)}</strong>{candidate.institution && <small className="prediction-legend-institution">{zh?candidate.institution.name:candidate.institution.englishName}</small>}</button>)}</div>
      <div className="prediction-chart" role="img" aria-label={zh ? '开奖前历史隐含概率曲线；各候选人的最后报价见下表' : 'Historical pre-announcement probabilities; final available quotes are listed below'}>
        {selected.length === 0 || chartData.length === 0 ? <div className="prediction-empty-chart">{selected.length===0 ? (zh ? '勾选下方选项，查看概率曲线。' : 'Select an option below to show history.') : (zh ? '这个时间范围没有可核实成交。可切换至可用历史。' : 'No verified trades in this range. Select available history.')}</div> : <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 16, right: 0, left: 4, bottom: 12 }}><CartesianGrid stroke="#d8dde5" strokeDasharray="2 6" vertical={false} /><XAxis dataKey="x" type="number" domain={[-range * 3600, 0]} ticks={[-range * 3600, -range * 1800, 0]} axisLine={false} tickLine={false} tick={{ fill: '#777f8e', fontSize: 12 }} tickFormatter={x => x === 0 ? (zh ? '公布前' : 'Before announcement') : x === -range * 3600 ? (zh ? '观察窗口起点' : 'Window start') : (zh ? '观察窗口中段' : 'Mid-window')} /><YAxis orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} width={48} tick={{ fill: '#777f8e', fontSize: 13 }} tickFormatter={v => `${v}%`} /><Tooltip labelFormatter={() => zh ? '公布前历史报价' : 'Historical pre-announcement quote'} formatter={(value: number, name: string) => [`${Number(value).toFixed(2)}%`, candidates.find(c => c.id === name)?.name || name]} contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13 }} />{displayed.map((candidate, index) => <Line key={candidate.id} name={candidate.id} dataKey={candidate.id} type="linear" stroke={colors[index % colors.length]} strokeWidth={2.3} dot={candidate.points.length===1 ? {r:4} : false} connectNulls isAnimationActive={false} />)}</LineChart></ResponsiveContainer>}
      </div>
      <div className="prediction-chart-toolbar"><a href={edition.eventUrl} target="_blank" rel="noreferrer">{zh ? `来源：${source}` : `Source: ${source}`}</a><div className="prediction-ranges" aria-label={zh ? '历史范围' : 'History range'}>{[...new Set([1, 6, 24,...(edition.sparseHistory ? [allHours] : [])])].map(hours => <button key={hours} aria-pressed={range === hours} onClick={() => setRange(hours)}>{hours === allHours && hours>24 ? (zh ? '可用历史' : 'Available history') : hours === 24 ? (zh ? '最后一天' : 'Final day') : zh ? `最后 ${hours} 小时` : `Final ${hours}h`}</button>)}</div></div>
      <p className="prediction-method">{source==='Manifold' ? (zh ? '仅展示截止前真实成交记录中的概率。不同选项的最后成交可能相隔很久，不合计为共同时间点的预测；没有成交的时段保留空白。' : 'Only actual pre-cutoff trade probabilities are shown. Last trades may be far apart; gaps are not filled and these values are not a simultaneous distribution.') : zh ? '采用官方预定最早公布时刻之前的历史 Yes 报价，排除结算后的价格。每个人是独立市场，可以多人获奖，概率合计不必为 100%。' : 'Historical Yes prices before the earliest scheduled announcement, excluding settlement. Candidates have independent markets; several may win, so probabilities need not total 100%.'}</p>
      {edition.unlistedWinners.length > 0 && <p className="prediction-coverage">{zh ? '实际得主未被单独开设市场：' : 'The eventual laureates had no individual markets: '}{edition.unlistedWinners.join(' · ')}{zh ? '。下方保留当时已开盘的候选市场。' : '. Listed candidates reflect the markets that existed.'}</p>}
      <div className="prediction-list-controls"><label>{zh ? '查找选项' : 'Find an option'}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={zh ? '姓名、机构或研究方向' : 'Name, institution or research'} /></label><label>{zh ? '排序' : 'Sort'}<select value={sort} onChange={e=>setSort(e.target.value)}><option value="probability">{zh ? '概率从高到低' : 'Highest probability'}</option><option value="name">{zh ? '名称 A–Z' : 'Name A–Z'}</option></select></label><button onClick={()=>setSelected(candidates.slice(0,4).map(c=>c.id))}>{zh ? '恢复默认曲线' : 'Reset chart'}</button><button onClick={download}><DownloadSimple size={16}/>{zh ? '下载数据' : 'Download CSV'}</button></div>
      <p className="prediction-list-status" aria-live="polite">{zh ? `显示 ${rows.length} / ${candidates.length} 项 · 可比较最多 6 条曲线` : `${rows.length} of ${candidates.length} options · compare up to 6 curves`}{copied && (zh ? ' · 链接已复制' : ' · Link copied')}</p>
      {rows.length===0 && <p className="prediction-state">{zh ? '没有匹配项，请换个关键词。' : 'No matches. Try another search.'}</p>}
      <div className="prediction-candidates" aria-label={zh ? '候选人历史报价' : 'Candidate historical quotes'}>{rows.map(candidate => { const index = displayed.findIndex(c => c.id === candidate.id); return <article className="prediction-candidate" key={candidate.id}><div className="prediction-candidate-name"><input id={`candidate-${candidate.id}`} type="checkbox" checked={selected.includes(candidate.id)} disabled={!selected.includes(candidate.id) && selected.length >= 6} onChange={() => setSelected(ids => ids.includes(candidate.id) ? ids.filter(id => id !== candidate.id) : [...ids, candidate.id])} aria-label={`${zh ? '显示' : 'Show'} ${candidate.name}`} style={{ accentColor: index >= 0 ? colors[index % colors.length] : '#2156ff' }} />{candidate.image && <img src={`${import.meta.env.BASE_URL}${candidate.image}`} alt="" loading="lazy" />}<span><span className="prediction-name-line"><label htmlFor={`candidate-${candidate.id}`}><strong>{candidate.name}</strong></label>{candidate.institution && <a className="prediction-affiliation" href={candidate.institution.sourceUrl} target="_blank" rel="noreferrer" title={candidate.institution.englishName}><img src={`${import.meta.env.BASE_URL}${candidate.institution.logo}`} alt="" loading="lazy" /><span>{zh ? candidate.institution.name : candidate.institution.englishName}</span></a>}</span><small className="prediction-research-focus">{candidate.researchFocus?.[zh ? 0 : 1] || (zh ? '候选人市场' : 'Candidate market')}{candidate.profileUrl && <> <a href={candidate.profileUrl} target="_blank" rel="noreferrer" aria-label={`${candidate.name} · ${zh ? '研究方向来源' : 'Research profile'}`}>↗</a></>}</small></span></div><div className="prediction-probability"><strong>{percent(candidate.probability!)}</strong><small>{candidate.quoteAt! < edition.cutoff-86400 ? (zh ? '较早的最后成交' : 'Older last trade') : (zh ? '最后可用报价' : 'Last available quote')}</small></div><div className="prediction-quotes"><a className="prediction-yes" href={candidate.url} target="_blank" rel="noreferrer">Yes {source==='Manifold' ? percent(candidate.probability!) : cents(candidate.probability!)}</a><a className="prediction-no" href={candidate.url} target="_blank" rel="noreferrer">No {source==='Manifold' ? percent(1-candidate.probability!) : cents(1 - candidate.probability!)}</a></div></article>})}</div>
      <p className="prediction-method">{source==='Manifold' ? (zh ? 'Manifold 使用虚拟积分；Yes / No 是成交概率及其互补值，不是美元合约价格。列表保留成交稀疏提示，原市场规则和完整选项请访问来源。' : 'Manifold uses play money. Yes / No are the recorded probability and its complement, not dollar prices. Consult the original market for rules and complete options.') : zh ? 'Yes / No 显示历史互补价格；点击可查看原始市场。曲线为历史价格采样，各候选人的最后可用采样点可能不同。' : 'Yes / No show historical complementary prices and link to the source market. Curves use price-history samples; the final available sample may differ by candidate.'} <a href={source==='Manifold' ? 'https://docs.manifold.markets/api' : source==='Kalshi' ? 'https://docs.kalshi.com/api-reference/market/get-market-candlesticks' : 'https://docs.polymarket.com/api-reference/markets/get-prices-history'} target="_blank" rel="noreferrer">{zh ? '数据口径' : 'Data method'} ↗</a></p>
    </section>}
  </main>
}
