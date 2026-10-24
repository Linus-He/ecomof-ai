import { describe, it, expect } from 'vitest'
import katex from 'katex'
import snapshot from '../../../scripts/nobel/official-prizes.json'
import index from '../../../public/data/nobel-chemistry/index.json'
const editions = import.meta.glob('../../../public/data/nobel-chemistry/[0-9]*.json', { eager: true, import: 'default' }) as Record<string, any>
const official = snapshot.prizes
const readEdition = (year: number) => editions[`../../../public/data/nobel-chemistry/${year}.json`]

describe('Nobel Chemistry published annual archive', () => {
  it('covers every official award and no-award year, with no unpublished editorial gaps', () => {
    const awarded = official.filter((prize: any) => prize.laureates?.length).map((prize: any) => Number(prize.year))
    const published = index.years.filter((year: any) => year.editorial).map((year: any) => year.year)
    expect(published.sort()).toEqual(awarded.sort())
    expect(index.years).toHaveLength(index.latestYear-index.firstYear+1)
    for (const item of index.years) {
      const edition = readEdition(item.year)
      expect(edition.year).toBe(item.year)
      if (item.status === 'not-awarded') {
        expect(edition.reading).toBeUndefined()
        expect(edition.names).toEqual([])
      } else {
        expect(edition.names.length).toBeGreaterThan(0)
        expect(edition.reading.summary.length).toBeGreaterThan(15)
        expect(edition.reading.sections.map((s: any) => s.id)).toEqual(['background','principle','uses','significance','development'])
        for (const section of edition.reading.sections) expect(section.body.length).toBeGreaterThan(12)
        expect(edition.reading.officialSource.url).toMatch(new RegExp(`/chemistry/${item.year}/`))
        const mechanism = edition.reading.sections.find((s: any) => s.id === 'principle')
        expect(mechanism.equationNote.length).toBeGreaterThan(10)
        expect(() => katex.renderToString(mechanism.equation,{throwOnError:true,strict:'error'})).not.toThrow()
      }
    }
  })
  it('keeps reaction categories and model limits explicit for mixed or simplified awards', () => {
    const readYear = (year: number) => readEdition(year).reading.sections.find((s: any) => s.id === 'principle')
    expect(readYear(1968).equationNote).toContain('线性响应')
    expect(readYear(1997).equationNote).toContain('并非同一机器')
    expect(readYear(2012).equationNote).toContain('不是 GDP')
    expect(readYear(2026).equationNote).toContain('教学反馈模型')
  })
})
