import historicalEdition from '../../../public/data/nobel-chemistry/1901.json'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NobelChemistryPage } from '../../components/pages/NobelChemistryPage'
import { resolveTabForHash } from '../../config/navigationRegistry'
vi.mock('../../contexts', () => ({ useLang: () => ({ lang: 'zh' }) }))
afterEach(() => { vi.unstubAllGlobals(); window.location.hash = '' })
describe('Nobel annual exploration', () => {
  it('waits for Explore instead of fetching on year edits', async () => {
    const fetcher = vi.fn(async (url: string) => ({ ok: true, json: async () => url.endsWith('index.json') ? { firstYear: 1901, latestYear: 2026 } : { year: 2026, names: ['Henri Kagan'], motivations: ['Official motivation'], status: 'awarded' } }))
    vi.stubGlobal('fetch', fetcher)
    render(<NobelChemistryPage hash="nobel-chemistry-2026" />)
    await screen.findByText('Henri Kagan')
    const before = fetcher.mock.calls.length
    fireEvent.change(screen.getByRole('textbox', { name: '年份' }), { target: { value: '2012' } })
    expect(fetcher).toHaveBeenCalledTimes(before)
    expect(screen.getByText('Henri Kagan')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }))
    expect(window.location.hash).toBe('#nobel-chemistry-2012')
    expect(resolveTabForHash('nobel-chemistry-2012')).toBe('nobelChemistry')
  })
  it('shows non-awarded years and enforces the official range', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => url.endsWith('index.json') ? { firstYear: 1901, latestYear: 2026 } : { year: 1916, names: [], status: 'not-awarded' } })))
    render(<NobelChemistryPage hash="nobel-chemistry-1916" />)
    await screen.findByText('这一年未颁发诺贝尔化学奖。')
    fireEvent.change(screen.getByRole('textbox', { name: '年份' }), { target: { value: '2027' } })
    await waitFor(() => expect((screen.getByRole('button', { name: 'Explore' }) as HTMLButtonElement).disabled).toBe(true))
  })
})

it('renders the same six-part reading and verified original for an early historical award', async () => {
  const edition = historicalEdition
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok:true, json:async () => url.endsWith('index.json') ? {firstYear:1901,latestYear:2026} : edition })))
  render(<NobelChemistryPage hash="nobel-chemistry-1901" />)
  await screen.findByRole('heading',{name:'研究概述'})
  for (const section of edition.reading.sections) expect(screen.getByRole('heading',{name:section.id==='uses' ? '应用与产业' : section.id==='development' ? '研究进展' : section.title[0]})).toBeTruthy()
  const original = screen.getByRole('complementary',{name:'官网原文 · 继续阅读'})
  expect(original.querySelector('a')?.getAttribute('href')).toBe(edition.reading.officialSource.url)
  expect(document.querySelector('.katex')).toBeTruthy()
  expect(document.querySelector('[data-reading-section=uses] .nobel-company-list')).toBeTruthy()
  expect(document.querySelector('[data-reading-section=development] .nobel-company-list')).toBeNull()
  expect(document.querySelector('[data-reading-section=development] .nobel-paper-list')).toBeTruthy()
})

it('ignores a slow previous-year response after navigating to another edition', async () => {
  let oldResponse: (value: any) => void = () => {}
  const oldRequest = new Promise(resolve => { oldResponse = resolve })
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('index.json')
    ? Promise.resolve({ok:true,json:async () => ({firstYear:1901,latestYear:2026})})
    : url.endsWith('2012.json') ? oldRequest
    : Promise.resolve({ok:true,json:async () => ({year:2003,status:'awarded',names:['Peter Agre'],motivations:[]})})))
  const view = render(<NobelChemistryPage hash="nobel-chemistry-2012" />)
  view.rerender(<NobelChemistryPage hash="nobel-chemistry-2003" />)
  await screen.findByText('Peter Agre')
  oldResponse({ok:true,json:async () => ({year:2012,status:'awarded',names:['Robert J. Lefkowitz'],motivations:[]})})
  await waitFor(() => expect(screen.getByText('Peter Agre')).toBeTruthy())
  expect(screen.queryByText('Robert J. Lefkowitz')).toBeNull()
})
