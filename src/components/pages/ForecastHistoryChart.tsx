import { useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, DownloadSimple } from '@phosphor-icons/react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DAY, formatHistoryDate, historyWindow, summarizeHistory, type ForecastPoint } from '../../utils/forecastHistory'

type Props = {
  id: string; points: ForecastPoint[]; cutoff: number; snapshot: number | null; zh: boolean
  sourceUrl: string; apiUrl: string
  onDownload: (points: ForecastPoint[]) => void
}
const percent = (p: number) => `${(p * 100).toFixed(2)}%`
export const percentagePoints = (delta: number, zh: boolean) => `${delta > 0 ? '+' : ''}${delta.toFixed(2)} ${zh ? '个百分点' : 'pp'}`
const duration = (ms: number, zh: boolean) => ms >= DAY ? `${(ms / DAY).toFixed(1)} ${zh ? '天' : 'days'}` : ms >= 3_600_000 ? `${(ms / 3_600_000).toFixed(1)} ${zh ? '小时' : 'hours'}` : `${Math.max(0, Math.round(ms / 60_000))} ${zh ? '分钟' : 'minutes'}`

export function ForecastHistoryChart({ id, points, cutoff, snapshot, zh, sourceUrl, apiUrl, onDownload }: Props) {
  const [hours, setHours] = useState(0)
  const [anchor, setAnchor] = useState<'trade' | 'archive'>('trade')
  const [from, setFrom] = useState(''), [to, setTo] = useState('')
  const [focused, setFocused] = useState(0), [zoom, setZoom] = useState(false), [page, setPage] = useState(0)
  useEffect(() => { setHours(0); setAnchor('trade'); setFrom(''); setTo(''); setFocused(0); setZoom(false); setPage(0) }, [id])
  const window = useMemo(() => historyWindow(points, cutoff, hours, anchor, from, to), [points, cutoff, hours, anchor, from, to])
  const rows = window.points
  const stats = useMemo(() => summarizeHistory(rows), [rows])
  const fullStats = useMemo(() => summarizeHistory(points), [points])
  useEffect(() => { setFocused(Math.max(0, rows.length - 1)); setPage(0) }, [rows])
  const selectedIndex = Math.min(focused, Math.max(0, rows.length - 1)), selected = rows[selectedIndex]
  const previous = selectedIndex ? rows[selectedIndex - 1] : null
  const data = useMemo(() => rows.map((point, i) => ({ t: point.t, p: point.p * 100, index: i })), [rows])
  const low = stats ? Math.max(0, Math.floor(stats.low.p * 100 - 2)) : 0
  const high = stats ? Math.min(100, Math.ceil(stats.high.p * 100 + 2)) : 100
  const domain: [number, number] = zoom && stats ? [low, Math.max(low + 1, high)] : [0, 100]
  // Calendar values remain at the actual observation positions, with no synthetic prices.
  const firstT = rows[0]?.t ?? window.start, lastT = rows[rows.length - 1]?.t ?? window.end
  const xEnd = anchor === 'archive' && !to ? window.end : lastT
  const xDomain: [number, number] = firstT === xEnd ? [firstT - 3_600_000, xEnd + 3_600_000] : [firstT, xEnd]
  const ticks = [...new Set([firstT, firstT + (xEnd - firstT) / 2, xEnd])]
  const dateWithTime = xEnd - firstT < 2 * DAY
  const dateTick = (t: number) => dateWithTime ? formatHistoryDate(t, true).slice(5, 16) : formatHistoryDate(t)
  const chooseRange = (n: number) => { setHours(n); setFrom(''); setTo('') }
  const visibleRows = [...rows].reverse().slice(page * 10, page * 10 + 10)
  const pages = Math.max(1, Math.ceil(rows.length / 10))

  return <section className="forecast-history" aria-label={zh ? '概率与成交历史' : 'Probability and trade history'}>
    <div className="science-section-heading"><div><span className="prediction-eyebrow">MARKET HISTORY</span><h2>{zh ? '市场概率与成交历史' : 'Market probability & trade history'}</h2></div><a className="forecast-source" href={sourceUrl} target="_blank" rel="noreferrer"><img src={`${import.meta.env.BASE_URL}images/nobel/organizations/manifold.ico`} alt=""/>Manifold <ArrowSquareOut size={12}/></a></div>
    <p className="forecast-history-intro">{zh ? '横轴是真实成交日期，纵轴是成交后 Yes 概率。先看所选窗口的变化，再逐点核对；平台存档概率和最后成交不一定相同。' : 'Dates locate actual trades; the vertical axis shows post-trade Yes probability. Inspect the selected window and individual observations. A platform snapshot may differ from the last trade.'}</p>
    <div className="forecast-plot-label"><span>{zh ? 'Yes 概率 · UTC 日期' : 'Yes probability · UTC dates'}</span><span>{zoom ? `${zh ? '局部纵轴' : 'Focused vertical scale'} ${domain[0]}–${domain[1]}%` : '0–100%'}</span></div>
    <div className="prediction-chart forecast-probability-chart" role="img" aria-label={zh ? '事件历史成交概率曲线，横轴为真实日期' : 'Historical probability by actual trade date'}>
      {rows.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 18, right: 0, left: 12, bottom: 18 }} onMouseMove={(state: any) => { const i = state?.activePayload?.[0]?.payload?.index; if (Number.isInteger(i)) setFocused(i) }}>
        <CartesianGrid stroke="#d8dde5" strokeDasharray="2 6" vertical={false}/>
        <XAxis dataKey="t" type="number" domain={xDomain} ticks={ticks} tickFormatter={dateTick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} tick={{ fill: '#667586', fontSize: 11 }}/>
        <YAxis orientation="right" domain={domain} allowDataOverflow tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} width={50} tick={{ fill: '#667586', fontSize: 12 }}/>
        <Tooltip labelFormatter={t => formatHistoryDate(Number(t), true)} formatter={(value: number) => [`${value.toFixed(2)}%`, 'Yes']} contentStyle={{ border: '1px solid #e1e5e9', borderRadius: 6, fontSize: 12 }}/>
        <Line dataKey="p" type="linear" stroke="#2156ff" strokeWidth={2.2} dot={rows.length < 20 ? { r: 3 } : false} isAnimationActive={false}/>
        {selected && <ReferenceDot x={selected.t} y={selected.p * 100} r={4} fill="#2156ff" stroke="#fff" isFront/>}
        {stats && <ReferenceLine y={stats.first.p * 100} stroke="#9ea7b1" strokeDasharray="4 5"/>}
      </LineChart></ResponsiveContainer> : <div className="prediction-empty-chart">{zh ? '这个范围没有真实成交采样。可改为“最后实际成交”基准，或查看“全部记录”。' : 'No actual trades in this range. Use the last-trade anchor or select all history.'}</div>}
    </div>
    <div className="forecast-chart-controls">
      <div className="prediction-ranges">{[[24, zh ? '近一天' : '1 day'], [168, zh ? '近一周' : '1 week'], [720, zh ? '近一月' : '1 month'], [2160, zh ? '近三月' : '3 months'], [0, zh ? '全部记录' : 'All history']].map(([n, label]) => <button key={n} aria-pressed={!from && !to && hours === n} onClick={() => chooseRange(Number(n))}>{label}</button>)}</div>
      <label>{zh ? '时间窗口基准' : 'Window anchor'}<select value={anchor} onChange={e => setAnchor(e.target.value as 'trade' | 'archive')}><option value="trade">{zh ? '最后实际成交' : 'Last actual trade'}</option><option value="archive">{zh ? '存档截止' : 'Archive boundary'}</option></select></label>
      <button aria-pressed={zoom} className="forecast-scale-toggle" onClick={() => setZoom(v => !v)}>{zoom ? (zh ? '恢复 0–100%' : 'Restore 0–100%') : (zh ? '放大概率波动' : 'Focus on variation')}</button>
    </div>
    <div className="forecast-custom-dates"><label>{zh ? '起始日期（UTC）' : 'From date (UTC)'}<input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>{zh ? '结束日期（UTC）' : 'To date (UTC)'}<input type="date" value={to} onChange={e => setTo(e.target.value)}/></label>{(from || to) && <button onClick={() => { setFrom(''); setTo('') }}>{zh ? '清除自定日期' : 'Clear dates'}</button>}<span>{zh ? '“近一天”等范围向所选基准回看；默认基准为最后一笔真实成交。' : 'Recent ranges look back from the selected anchor; the default is the last actual trade.'}</span></div>
    {window.invalid && <p role="alert">{zh ? '起始日期不能晚于结束日期。' : 'The start date must not follow the end date.'}</p>}
    {stats && <div className="forecast-window-stats" aria-label={zh ? '所选窗口统计' : 'Selected window statistics'}>
      <div><span>{zh ? '窗口首笔 → 末笔' : 'Window first → last'}</span><strong>{percent(stats.first.p)} → {percent(stats.last.p)}</strong><small>{percentagePoints(stats.change, zh)}</small></div>
      <div><span>{zh ? '窗口最低 / 最高' : 'Window low / high'}</span><strong>{percent(stats.low.p)} / {percent(stats.high.p)}</strong><small>{zh ? '实际成交后概率' : 'Observed post-trade values'}</small></div>
      <div><span>{zh ? '窗口成交采样' : 'Window observations'}</span><strong>{stats.count.toLocaleString()}</strong><small>{zh ? '不是独立参与人数' : 'Not unique participants'}</small></div>
      <div><span>{zh ? '最大无成交间隔' : 'Largest gap between trades'}</span><strong>{stats.count<2?'—':duration(stats.maxGap, zh)}</strong><small>{stats.count < 2 ? (zh ? '仅一笔，无法计算间隔' : 'One observation; no interval') : (zh ? '间隔期间没有新价格观测' : 'No intervening observations')}</small></div>
    </div>}
    <p className="forecast-chart-note">{zh ? '灰虚线为窗口首笔概率。相邻采样仅以直线连接，不能据此推断间隔中的报价；没有补造交易点。' : 'The grey dashed line marks the first trade. Straight connectors do not establish prices between observations; no trades are synthesized.'}</p>
    {selected && <div className="forecast-point-reader">
      <div className="forecast-selected-point" aria-live="polite"><div><span>{zh ? '选中成交时间' : 'Selected trade time'}</span><strong>{formatHistoryDate(selected.t, true)}</strong></div><div><span>Yes</span><strong>{percent(selected.p)}</strong></div><div><span>{zh ? '较窗口内前一笔' : 'Versus previous trade in window'}</span><strong>{previous ? percentagePoints((selected.p - previous.p) * 100, zh) : '—'}</strong></div></div>
      <label className="forecast-point-slider">{zh ? `逐笔查看 · ${selectedIndex + 1} / ${rows.length}` : `Inspect observation · ${selectedIndex + 1} / ${rows.length}`}<input aria-label={zh ? '选择历史成交点' : 'Select historical trade'} type="range" min="0" max={Math.max(0, rows.length - 1)} step="1" value={selectedIndex} onChange={e => setFocused(Number(e.target.value))}/></label>
    </div>}
    {fullStats && <p className="forecast-recency">{zh ? `末笔成交距存档截止 ${duration(cutoff - fullStats.last.t, true)}。` : `The last trade precedes the archive boundary by ${duration(cutoff - fullStats.last.t, false)}.`} {snapshot != null && <>{zh ? `平台快照 ${percent(snapshot)}，历史末笔 ${percent(fullStats.last.p)}；两者分别保留。` : `Platform snapshot ${percent(snapshot)}; last trade ${percent(fullStats.last.p)}. Both are retained separately.`}</>}</p>}
    {stats && stats.largestMoves.length > 0 && <details className="forecast-moves"><summary>{zh ? '查看窗口内最大的五次相邻成交变化' : 'Largest five consecutive-trade moves in this window'}</summary><p>{zh ? '只按两个相邻采样的差值排序，不代表由某条新闻引起。' : 'Ranked by differences between adjacent observations, without attributing a news cause.'}</p>{stats.largestMoves.map(move => <button key={move.after.t} onClick={() => setFocused(rows.findIndex(p => p.t === move.after.t))}><span>{formatHistoryDate(move.after.t, true)}</span><strong>{percentagePoints(move.delta, zh)}</strong><span>{percent(move.before.p)} → {percent(move.after.p)} · {duration(move.gap, zh)}</span></button>)}</details>}
    <details className="forecast-data-table"><summary>{zh ? `逐笔历史明细 · 当前窗口 ${rows.length.toLocaleString()} 条` : `Trade-level data · ${rows.length.toLocaleString()} observations in window`}</summary>
      <div className="forecast-table-scroll"><table><thead><tr><th>{zh ? '成交时间（UTC）' : 'Trade time (UTC)'}</th><th>Yes</th><th>{zh ? '较窗口内前笔' : 'Versus previous in window'}</th><th>{zh ? '定位' : 'Inspect'}</th></tr></thead><tbody>{visibleRows.map(point => { const i = rows.findIndex(p => p.t === point.t); return <tr key={point.t}><td>{formatHistoryDate(point.t, true).replace(' UTC', '')}</td><td>{percent(point.p)}</td><td>{i ? percentagePoints((point.p - rows[i - 1].p) * 100, zh) : '—'}</td><td><button onClick={() => setFocused(i)}>{zh ? '查看此笔' : 'Inspect trade'}</button></td></tr> })}</tbody></table></div>
      <div className="forecast-pagination"><button disabled={page === 0} onClick={() => setPage(n => n - 1)}>{zh ? '上一页' : 'Previous'}</button><span>{Math.min(page + 1, pages)} / {pages}</span><button disabled={page + 1 >= pages} onClick={() => setPage(n => n + 1)}>{zh ? '下一页' : 'Next'}</button></div>
    </details>
    <div className="science-event-tools"><button disabled={!rows.length} onClick={() => onDownload(rows)}><DownloadSimple size={16}/>{zh ? '下载当前窗口数据' : 'Download selected window'}</button><a href={apiUrl} target="_blank" rel="noreferrer">{zh ? '原始 API 记录' : 'Original API record'} <ArrowSquareOut size={12}/></a></div>
  </section>
}
