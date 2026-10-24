import {render, screen, fireEvent} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'
import {PredictionMarketsPage, preAnnouncementCandidates} from '../../components/pages/PredictionMarketsPage'
import index from '../../../public/data/nobel-odds/index.json'
import history2025 from '../../../public/data/nobel-odds/2025.json'
import history2023 from '../../../public/data/nobel-odds/2023.json'
vi.mock('../../contexts',()=>({useLang:()=>({lang:'zh'})}))
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
