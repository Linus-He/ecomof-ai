import {render,screen,fireEvent,within} from '@testing-library/react'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import {ScienceForecastsPage,forecastState,forecastValue} from '../../components/pages/ScienceForecastsPage'
import index from '../../../public/data/science-forecasts/index.json'
import cancelled from '../../../public/data/science-forecasts/events/xsHh9WCTD1PRuvZwTYqA.json'
vi.mock('../../contexts',()=>({useLang:()=>({lang:'zh'})}))
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});localStorage.removeItem('ecomof-science-watchlist');vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,json:async()=>url.includes('/events/')?({...cancelled,id:url.split('/').pop()?.replace('.json','')}):index})))})
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()})
it('opens the source-backed topics under the new umbrella and keeps the Nobel archive as a topic',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts"/> )
 await screen.findByRole('heading',{name:'科学预测'})
 expect(document.querySelectorAll('.science-topics>a')).toHaveLength(index.topics.length)
 expect(screen.getByRole('link',{name:/The Nobel Prize in Chemistry/})).toHaveAttribute('href','#science-forecasts-nobel')
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(index.events.length)
 expect(document.querySelectorAll('.science-market-row a[href*="science-forecasts-event-"]')).toHaveLength(index.events.length)
})
it('filters by scientific stage, searches institutions and persists a local watchlist',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts"/> )
 await screen.findByRole('heading',{name:'科学预测'})
 fireEvent.change(screen.getByLabelText('观察角度'),{target:{value:'validation'}})
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(index.events.filter(e=>e.stage==='validation').length)
 fireEvent.change(screen.getByPlaceholderText('技术、事件或机构'),{target:{value:'VTT'}})
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(1)
 fireEvent.click(screen.getByRole('button',{name:/^关注 Donut/}))
 expect(JSON.parse(localStorage.getItem('ecomof-science-watchlist')!)).toEqual(['SAIUNdCI8U'])
 fireEvent.click(screen.getByRole('button',{name:'只看关注'}))
 expect(screen.getByText('显示 1 个事件')).toBeTruthy()
})
it('separates related carbon markets from verified MOF industry evidence',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts-carbon-capture"/> )
 await screen.findByRole('heading',{name:'碳捕集与 MOF'})
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(index.events.filter(e=>e.topicId==='carbon-capture').length)
 expect(screen.getByText(/不被标成 MOF 赔率/)).toBeTruthy()
 expect(screen.getByRole('link',{name:/CALF-20：从吸附材料到供应合作/})).toHaveAttribute('href',expect.stringContaining('svanteinc.com'))
})
it('does not turn cancellation into No or a zero historical probability',async()=>{
 render(<ScienceForecastsPage hash={`science-forecasts-event-${cancelled.id}`}/> )
 await screen.findByRole('heading',{name:cancelled.title[0]})
 expect(forecastState(cancelled,true)).toBe('已取消')
 expect(forecastValue(cancelled)).toBe(cancelled.lastTradeProbability)
 expect(forecastValue(cancelled)).toBeGreaterThan(0)
 fireEvent.change(screen.getByLabelText('时间窗口基准'),{target:{value:'archive'}})
 fireEvent.click(screen.getByRole('button',{name:'近一天'}))
 await screen.findByText(/这个范围没有真实成交采样/)
 expect(screen.getByRole('link',{name:'查看平台完整规则'})).toHaveAttribute('href',cancelled.url)
})
it('renders invalid event routes as recoverable empty states',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts-event-invalid"/> )
 await screen.findByRole('heading',{name:'没有收录这个事件'})
 expect(screen.getByRole('link',{name:'返回科学预测'})).toHaveAttribute('href','#science-forecasts')
})

it('places topic history ahead of the guide and retains related reading',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts-fusion-energy"/>)
 await screen.findByRole('heading',{name:'聚变发电'})
 const history=screen.getByRole('region',{name:'专题市场曲线'})
 const guide=document.querySelector('.science-topic-intro')!
 expect(history.compareDocumentPosition(guide)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
 expect(screen.getByRole('combobox',{name:'选择市场'}).querySelectorAll('option')).toHaveLength(index.events.filter(e=>e.topicId==='fusion-energy').length)
 expect(screen.getByRole('heading',{name:'专题解读'})).toBeTruthy()
})
it('orders event history, criteria, announcements, references and related events consistently',async()=>{
 render(<ScienceForecastsPage hash={`science-forecasts-event-${cancelled.id}`}/>)
 await screen.findByRole('heading',{name:cancelled.title[0]})
 const ids=['forecast-history','forecast-technology','forecast-industry','forecast-references','forecast-related']
 for(let i=1;i<ids.length;i++)expect(document.getElementById(ids[i-1])!.compareDocumentPosition(document.getElementById(ids[i])!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
 expect(screen.getByRole('heading',{name:'相关预测事件'})).toBeTruthy()
 const nav=screen.getByRole('navigation',{name:'事件阅读目录'})
 expect(nav.querySelector('button')).toHaveTextContent('市场曲线')
 expect(document.querySelector('.science-country-flag')).toHaveAttribute('role','img')
})

it('filters battery topics without hiding chemical battery coverage',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts"/>)
 await screen.findByRole('heading',{name:'科学预测'})
 fireEvent.click(screen.getByRole('button',{name:'电池与储能'}))
 expect(document.querySelectorAll('.science-topics>a')).toHaveLength(3)
 expect(within(screen.getByRole('region',{name:'科学预测专题'})).getByRole('link',{name:/钠离子电池/})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'化学与材料'}))
 expect(document.querySelectorAll('.science-topics>a')).toHaveLength(index.topics.filter(t=>['battery','chemistry'].includes(t.family)).length)
 expect(within(screen.getByRole('region',{name:'科学预测专题'})).getByRole('link',{name:/AI 药物研发与临床验证/})).toBeTruthy()
})
it('shows scoped source data and labels development targets separately',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts-clean-hydrogen"/>)
 await screen.findByRole('heading',{name:'清洁制氢与电解水'})
 expect(screen.getByRole('heading',{name:'关键数据与条件'})).toBeTruthy()
 expect(screen.getByRole('rowheader',{name:/Hydrogen Shot 成本目标/})).toHaveTextContent('研发目标')
 expect(screen.getByText('目标 2031；2023-12-05 资料')).toBeTruthy()
 const table=screen.getByRole('table',{name:'关键数据与条件'})
 expect(table.querySelectorAll('tbody tr')).toHaveLength(index.topics.find(t=>t.id==='clean-hydrogen')!.metrics!.length)
 expect(table.querySelectorAll('tbody a[href^="https://"]')).toHaveLength(index.topics.find(t=>t.id==='clean-hydrogen')!.metrics!.length)
 expect(screen.getByRole('button',{name:'下载指标与来源'})).toBeTruthy()
})

it('shows organic literature cases without an empty or fabricated market panel',async()=>{
 const fetcher=vi.mocked(fetch)
 render(<ScienceForecastsPage hash="science-forecasts-asymmetric-organocatalysis"/>)
 await screen.findByRole('heading',{name:'不对称有机催化'})
 expect(screen.getByRole('heading',{name:'代表反应与实验条件'})).toBeTruthy()
 expect(document.querySelectorAll('.science-reaction-cases>article')).toHaveLength(2)
 expect(document.querySelectorAll('.science-topic-data tbody tr')).toHaveLength(9)
 expect(screen.queryByRole('heading',{name:'具体事件'})).toBeNull()
 expect(screen.queryByText('没有匹配事件。')).toBeNull()
 expect(document.querySelector('.forecast-probability-chart')).toBeNull()
 expect(fetcher.mock.calls.some(([url])=>String(url).includes('/events/'))).toBe(false)
 expect(screen.getByRole('button',{name:'下载反应与来源'})).toBeTruthy()
})
it('filters organic chemistry topics and preserves their literature entry links',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts"/>)
 await screen.findByRole('heading',{name:'科学预测'})
 fireEvent.click(screen.getByRole('button',{name:'有机化学'}))
 expect(document.querySelectorAll('.science-topics>a')).toHaveLength(5)
 expect(within(screen.getByRole('region',{name:'科学预测专题'})).getByRole('link',{name:/点击与生物正交化学/})).toHaveAttribute('href','#science-forecasts-click-bioorthogonal')
})

it('replaces topic sections cleanly when navigating and rerendering',async()=>{
 const {rerender}=render(<ScienceForecastsPage hash="science-forecasts"/>)
 await screen.findByRole('heading',{name:'科学预测'})
 for(const id of ['asymmetric-organocatalysis','visible-light-organic','click-bioorthogonal','pet-enzymatic-recycling','asymmetric-organocatalysis']){
  rerender(<ScienceForecastsPage hash={`science-forecasts-${id}`}/>)
  const topic=index.topics.find(t=>t.id===id)!
  await screen.findByRole('heading',{name:topic.title[0]})
  expect(document.querySelectorAll('.science-reaction-cases')).toHaveLength(1)
  expect(document.querySelectorAll('.science-reaction-cases>article')).toHaveLength(topic.reactionCases?.length||0)
  expect(document.querySelectorAll('.science-topic-data')).toHaveLength(1)
 }
 rerender(<ScienceForecastsPage hash="science-forecasts-asymmetric-organocatalysis"/>)
 expect(document.querySelectorAll('.science-reaction-cases')).toHaveLength(1)
})
