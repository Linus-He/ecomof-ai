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
it('locates a paginated trade on the plot and keeps the selected timestamp visible',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'scrollIntoView'),scroll=vi.fn()
 Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{value:scroll,configurable:true})
 try{
  const observed=Array.from({length:13},(_,i)=>({t:day(i+1),p:(i+1)/100}))
  const {rerender}=render(<ForecastHistoryChart id="pagination" points={observed} cutoff={day(31)} snapshot={null} zh sourceUrl="https://manifold.markets/" apiUrl="https://api.manifold.markets/" onDownload={vi.fn()}/>)
  fireEvent.click(screen.getByText(/逐笔历史明细/))
  fireEvent.click(screen.getByRole('button',{name:'下一页'}))
  fireEvent.click(screen.getAllByRole('button',{name:'查看此笔'})[1])
  expect(screen.getByRole('status')).toHaveTextContent('2026-01-02 00:00:00 UTC · Yes 2.00% · 2/13')
  expect(document.querySelector('.forecast-location-target')).toHaveAttribute('data-selected-time',String(day(2)))
  expect(scroll).toHaveBeenCalledWith(expect.objectContaining({block:'start'}))
  rerender(<ForecastHistoryChart id="pagination" points={observed.map(p=>({...p}))} cutoff={day(31)} snapshot={null} zh sourceUrl="https://manifold.markets/" apiUrl="https://api.manifold.markets/" onDownload={vi.fn()}/>)
  expect(screen.getByRole('status')).toHaveTextContent('2026-01-02 00:00:00 UTC')
  expect(screen.getAllByRole('button',{name:'查看此笔'})[1]).toHaveAttribute('aria-pressed','true')
  fireEvent.click(screen.getByRole('button',{name:'取消固定'}))
  expect(screen.queryByRole('status')).toBeNull()
 }finally{if(descriptor)Object.defineProperty(HTMLElement.prototype,'scrollIntoView',descriptor);else Reflect.deleteProperty(HTMLElement.prototype,'scrollIntoView')}
})
