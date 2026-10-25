import {render,screen,fireEvent} from '@testing-library/react'
import {it,expect,vi} from 'vitest'
import {ForecastHistoryChart} from '../../components/pages/ForecastHistoryChart'
const day=(n:number)=>Date.UTC(2026,0,n)
const points=[{t:day(1),p:.2},{t:day(3),p:.4},{t:day(4),p:.3},{t:day(10),p:.5}]
it('keeps inspection, date filters, empty state and exports on the same observed rows',()=>{
 const download=vi.fn()
 render(<ForecastHistoryChart id="test" points={points} cutoff={day(31)} snapshot={.7} zh sourceUrl="https://manifold.markets/" apiUrl="https://api.manifold.markets/" onDownload={download}/> )
 expect(screen.getByText('20.00% → 50.00%')).toBeTruthy()
 expect(screen.getByText(/平台快照 70.00%，历史末笔 50.00%/)).toBeTruthy()
 fireEvent.change(screen.getByRole('slider'),{target:{value:'0'}})
 expect(screen.getByText('2026-01-01 00:00:00 UTC')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'近一天'}))
 expect(screen.getByText('逐笔查看 · 1 / 1')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'下载当前窗口数据'}));expect(download).toHaveBeenLastCalledWith([points[3]])
 fireEvent.change(screen.getByLabelText('时间窗口基准'),{target:{value:'archive'}})
 expect(screen.getByText(/这个范围没有真实成交采样/)).toBeTruthy()
 fireEvent.change(screen.getByLabelText('起始日期（UTC）'),{target:{value:'2026-01-03'}})
 fireEvent.change(screen.getByLabelText('结束日期（UTC）'),{target:{value:'2026-01-04'}})
 expect(screen.getByText('40.00% → 30.00%')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'下载当前窗口数据'}));expect(download).toHaveBeenLastCalledWith(points.slice(1,3))
 fireEvent.click(screen.getByText(/逐笔历史明细/))
 expect(screen.getByRole('table')).toBeTruthy()
})
