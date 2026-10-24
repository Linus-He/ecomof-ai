import { describe, expect, it } from 'vitest'
import market from '../../../public/data/nobel-odds/2026.json'
import { preAnnouncementCandidates } from '../../components/pages/PredictionMarketsPage'
const editions = import.meta.glob('../../../public/data/nobel-chemistry/[0-9]*.json', { eager: true, import: 'default' }) as Record<string, any>
describe('published science evidence', () => {
  it('includes sourced university research, company links and portraits for every awarded year', () => {
    for (const edition of Object.values(editions).filter(e => e.status === 'awarded')) {
      expect(edition.portraits).toHaveLength(edition.names.length)
      expect(edition.people).toHaveLength(edition.names.length)
      expect(edition.reading.learningGuide.definition).toHaveLength(2)
      expect(edition.reading.learningGuide.example[0].length).toBeGreaterThan(40)
      for (const person of edition.people) expect(person.url).toMatch(/^https:\/\/www.nobelprize.org\/prizes\/chemistry\//)
      expect(edition.reading.developments.researchCases.length).toBeGreaterThan(0)
      expect(edition.reading.developments.companyCases.length).toBeGreaterThan(0)
      for (const paper of edition.reading.developments.researchCases) {
        expect(paper.paperUrl).toMatch(/^https:\/\/doi.org\//)
        expect(paper.organizationIds.length).toBeGreaterThan(0)
        expect(paper.sources.length).toBeGreaterThan(0)
      }
      for (const company of edition.reading.developments.companyCases) {
        expect(company.introduction).toHaveLength(2)
        expect(company.en.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(company.products.length).toBeGreaterThanOrEqual(2)
        expect(company.en.products).toHaveLength(company.products.length)
        for (const product of company.products) expect(product.url).toMatch(/^https:\/\//)
      }
      for (const org of edition.reading.developments.organizations) expect(org.logo).toMatch(/^images\/nobel\/organizations\//)
    }
  })
  it('uses only prices strictly before the announcement cutoff and preserves independent market probabilities', () => {
    const candidates = preAnnouncementCandidates(market)
    expect(candidates).toHaveLength(30)
    expect(candidates.reduce((n, c) => n + c.probability!, 0)).toBeGreaterThan(1)
    for (const candidate of candidates) {
      expect(candidate.quoteAt).toBeLessThan(market.cutoff)
      expect(candidate.probability).toBe(candidate.points[candidate.points.length - 1].p)
    }
    const changed = structuredClone(market)
    changed.candidates[0].points.push({ t: market.cutoff, p: 1 }, { t: market.cutoff + 1, p: 0 })
    expect(preAnnouncementCandidates(changed)[0].probability).toBe(candidates[0].probability)
    expect(market.unlistedWinners).toHaveLength(2)
    expect(market.winnerDetails.map(person => person.name)).toEqual(['Henri B. Kagan', 'Kenso Soai'])
    for (const candidate of market.candidates) {
      expect(candidate.researchFocus).toHaveLength(2)
      expect(candidate.researchFocus[0].length).toBeGreaterThan(4)
      expect(candidate.profileUrl).toMatch(/^https:\/\//)
      expect(candidate.institution.name.length).toBeGreaterThan(1)
      expect(candidate.institution.sourceUrl).toMatch(/^https:\/\//)
      expect(candidate.institution.logo).toMatch(/^images\/nobel\/organizations\//)
    }
  })
})
