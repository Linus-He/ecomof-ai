import {fireEvent,render,screen} from '@testing-library/react'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import {MethodologyReader} from '../../components/methodology/MethodologyReader'
beforeEach(()=>vi.spyOn(window,'scrollTo').mockImplementation(()=>{}))
afterEach(()=>vi.restoreAllMocks())
it('explains missing inputs and navigates to the existing complete method',()=>{
 const jump=vi.fn()
 render(<MethodologyReader lang="zh" onJump={jump}/> )
 expect(screen.getAllByRole('tab')).toHaveLength(8)
 fireEvent.click(screen.getByRole('tab',{name:/气体分离/}))
 expect(screen.getByRole('tabpanel').textContent).toContain('0.779')
 fireEvent.click(screen.getByRole('button',{name:'如果缺少关键条件'}))
 expect(screen.getByRole('tabpanel').textContent).toContain('低压范围不足')
 fireEvent.click(screen.getByRole('button',{name:/在完整方法中继续/}))
 expect(jump).toHaveBeenCalledWith('methodology-gassep')
})
it('recalculates the teaching score and supports keyboard chapter selection',()=>{
 render(<MethodologyReader lang="en" onJump={vi.fn()}/> )
 fireEvent.click(screen.getByRole('tab',{name:/Scoring/}))
 const input=screen.getByRole('slider',{name:/Evidence factor Q/})
 fireEvent.change(input,{target:{value:'50'}})
 expect(screen.getByRole('status').textContent).toContain('0.316')
 fireEvent.keyDown(screen.getByRole('tab',{name:/Scoring/}),{key:'ArrowRight'})
 expect(screen.getByRole('tab',{name:/Gas separation/})).toHaveAttribute('aria-selected','true')
 expect(document.querySelectorAll('[data-testid="katex-block"]')).toHaveLength(1)
})

it('renders every example formula and preserves teaching boundaries in both languages',()=>{
 const {rerender}=render(<MethodologyReader lang="zh" onJump={vi.fn()}/> )
 for(const tab of screen.getAllByRole('tab')){
   fireEvent.click(tab)
   expect(document.querySelectorAll('[data-testid="katex-block"]')).toHaveLength(1)
   fireEvent.click(screen.getByRole('button',{name:'如果缺少关键条件'}))
   expect(screen.getByRole('heading',{name:'停在哪里'})).toBeTruthy()
 }
 rerender(<MethodologyReader lang="en" onJump={vi.fn()}/> )
 expect(screen.getByRole('heading',{name:'Methods & evidence'})).toBeTruthy()
 expect(screen.getByText('Teaching examples · not measurements')).toBeTruthy()
})
