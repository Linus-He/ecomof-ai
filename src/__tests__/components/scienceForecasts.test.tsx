import {render,screen,fireEvent} from '@testing-library/react'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import {ScienceForecastsPage,forecastState,forecastValue} from '../../components/pages/ScienceForecastsPage'
import index from '../../../public/data/science-forecasts/index.json'
import cancelled from '../../../public/data/science-forecasts/events/xsHh9WCTD1PRuvZwTYqA.json'
vi.mock('../../contexts',()=>({useLang:()=>({lang:'zh'})}))
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});localStorage.removeItem('ecomof-science-watchlist');vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,json:async()=>url.includes('/events/')?cancelled:index})))})
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()})
it('opens four topics under the new umbrella and keeps the Nobel archive as a topic',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts"/> )
 await screen.findByRole('heading',{name:'科学预测'})
 expect(document.querySelectorAll('.science-topics>a')).toHaveLength(4)
 expect(screen.getByRole('link',{name:/The Nobel Prize in Chemistry/})).toHaveAttribute('href','#science-forecasts-nobel')
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(19)
 expect(document.querySelectorAll('.science-market-row a[href*="science-forecasts-event-"]')).toHaveLength(19)
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
 expect(document.querySelectorAll('.science-market-row')).toHaveLength(2)
 expect(screen.getByText(/不被标成 MOF 赔率/)).toBeTruthy()
 expect(screen.getByRole('link',{name:/CALF-20：从吸附材料到供应合作/})).toHaveAttribute('href',expect.stringContaining('svanteinc.com'))
})
it('does not turn cancellation into No or a zero historical probability',async()=>{
 render(<ScienceForecastsPage hash={`science-forecasts-event-${cancelled.id}`}/> )
 await screen.findByRole('heading',{name:cancelled.title[0]})
 expect(forecastState(cancelled,true)).toBe('已取消')
 expect(forecastValue(cancelled)).toBe(cancelled.lastTradeProbability)
 expect(forecastValue(cancelled)).toBeGreaterThan(0)
 fireEvent.click(screen.getByRole('button',{name:'近一天'}))
 await screen.findByText(/这个范围没有真实成交采样/)
 expect(screen.getByRole('link',{name:'查看平台完整规则'})).toHaveAttribute('href',cancelled.url)
})
it('renders invalid event routes as recoverable empty states',async()=>{
 render(<ScienceForecastsPage hash="science-forecasts-event-invalid"/> )
 await screen.findByRole('heading',{name:'没有收录这个事件'})
 expect(screen.getByRole('link',{name:'返回科学预测'})).toHaveAttribute('href','#science-forecasts')
})
