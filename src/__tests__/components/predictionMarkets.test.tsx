import {act, render, screen, fireEvent} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {PredictionMarketsPage, preAnnouncementCandidates} from '../../components/pages/PredictionMarketsPage'
import index from '../../../public/data/nobel-odds/index.json'
import history2025 from '../../../public/data/nobel-odds/2025.json'
import history2026 from '../../../public/data/nobel-odds/2026.json'
import history2023 from '../../../public/data/nobel-odds/2023.json'
vi.mock('../../contexts',()=>({useLang:()=>({lang:'zh'})}))
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{})})
afterEach(()=>{vi.restoreAllMocks()})
afterEach(()=>{vi.unstubAllGlobals();window.location.hash=''})
it('keeps field markets source-labelled and searchable without dollar-price labels',async()=>{
 vi.stubGlobal('fetch',vi.fn(async (url:string)=>({ok:true,json:async()=>url.endsWith('index.json')?index:history2025})))
 render(<PredictionMarketsPage hash="prediction-markets-2025"/> )
 await screen.findByRole('heading',{name:'The Nobel Prize in Chemistry 2025'})
 expect(screen.getByText(/Manifold 虚拟积分市场/)).toBeTruthy()
 expect(screen.getAllByRole('link',{name:/Yes/})[0].textContent).toContain('%')
 expect(document.querySelectorAll('.prediction-candidate')).toHaveLength(14)
 fireEvent.change(screen.getByPlaceholderText('姓名、机构或研究方向'),{target:{value:'Catalysis'}})
 expect(document.querySelectorAll('.prediction-candidate')).toHaveLength(1)
 fireEvent.click(screen.getByRole('button',{name:'最后 1 小时'}))
 expect(await screen.findByText(/这个时间范围没有可核实成交/)).toBeTruthy()
})
it('preserves actual sparse trades and excludes 2023 disclosure leakage',()=>{
 const candidates=preAnnouncementCandidates(history2023)
 expect(candidates.length).toBeGreaterThan(1)
 expect(history2023.cutoffNote).toContain('leaked')
 for(const c of candidates){expect(c.quoteAt).toBeLessThan(history2023.cutoff);expect(c.profileUrl || c.kind==='other').toBeTruthy()}
 const fixture={...history2023,candidates:[{...history2023.candidates[0],points:[{t:history2023.cutoff-10,p:.23},{t:history2023.cutoff,p:1}]}]}
 expect(preAnnouncementCandidates(fixture)[0].probability).toBe(.23)
})

it('opens the bare entry at the newest indexed market and resets inherited scroll',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,json:async()=>url.endsWith('index.json')?index:history2026})))
 const {rerender}=render(<PredictionMarketsPage hash="prediction-markets"/> )
 expect(screen.queryByText(/这个年份尚无/)).toBeNull()
 await screen.findByRole('heading',{name:'The Nobel Prize in Chemistry 2026'})
 expect(window.scrollTo).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'})
 expect(document.querySelectorAll('.prediction-candidate')).toHaveLength(30)
 rerender(<PredictionMarketsPage hash="prediction-markets-2026-polymarket"/> )
 expect(window.scrollTo).toHaveBeenCalledTimes(2)
})
it('retries a failed index request instead of leaving the entry stuck',async()=>{
 let indexCalls=0
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
   if(url.endsWith('index.json') && ++indexCalls===1) throw Error('offline')
   return {ok:true,json:async()=>url.endsWith('index.json')?index:history2026}
 }))
 render(<PredictionMarketsPage hash="prediction-markets"/> )
 await screen.findByRole('alert')
 fireEvent.click(screen.getByRole('button',{name:'重试'}))
 await screen.findByRole('heading',{name:'The Nobel Prize in Chemistry 2026'})
 expect(indexCalls).toBe(2)
})
it('turns a stalled index request into a retryable error',async()=>{
 vi.useFakeTimers()
 try {
  vi.stubGlobal('fetch',vi.fn((_url:string,{signal}:{signal:AbortSignal})=>new Promise((_resolve,reject)=>{
   signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')))
  })))
  render(<PredictionMarketsPage hash="prediction-markets"/> )
  await act(async()=>{await vi.advanceTimersByTimeAsync(15000)})
  expect(screen.getByRole('alert')).toBeTruthy()
  expect(screen.getByRole('button',{name:'重试'})).toBeTruthy()
 } finally {vi.useRealTimers()}
})
