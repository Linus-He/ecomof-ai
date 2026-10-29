import {render,screen,fireEvent} from '@testing-library/react'
import {expect,it,vi} from 'vitest'
import {ScienceSourceCitation} from '../../components/pages/ScienceSourceCitation'
import index from '../../../public/data/science-forecasts/index.json'
it('keeps publisher, factual date and reference together while omitting the review timestamp',()=>{
 const source=index.evidence.find(e=>e.id==='rentosertib-phase2')!,inspect=vi.fn()
 render(<ScienceSourceCitation source={source} publishers={index.publishers} zh onInspect={inspect} referenceNumber={2}/>)
 const footer=screen.getByRole('contentinfo',{name:'来源与日期依据'})
 expect(footer).toHaveTextContent('2025-06-03')
 expect(footer).not.toHaveTextContent('2026-10-29')
 expect(screen.getByRole('img',{name:'PubMed · NLM logo'})).toBeTruthy()
 expect(footer.querySelector('details')).not.toHaveAttribute('open')
 fireEvent.click(screen.getByRole('button',{name:'查看完整来源条目 [2]'}));expect(inspect).toHaveBeenCalledOnce()
})
it('identifies a corroborating news outlet using its own logo and article link',()=>{
 render(<ScienceSourceCitation source={index.evidence.find(e=>e.id==='nea-storage-2024')!} publishers={index.publishers} zh/>)
 const news=screen.getByRole('link',{name:/第一财经/})
 expect(news).toHaveAttribute('href','https://www.yicai.com/brief/102751067.html')
 expect(screen.getByRole('img',{name:'第一财经 logo'})).toBeTruthy()
})
