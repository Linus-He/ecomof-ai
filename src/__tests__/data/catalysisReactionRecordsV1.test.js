import { describe, expect, it } from "vitest"
import dataset from "../../../public/data/catalysis_reaction_records_v1.json"
import schema from "../../../public/data/catalysis_reaction_records_schema_v1.json"
import methodologyModules from "../../../public/data/methodology_modules_demo.json"

const DOI_PATTERN = /^10\.\d{4,9}\/[\w.()/:;-]+$/i
const VERIFIED_SOURCE_STATUSES = new Set([
  "doi-and-publisher-page-verified",
  "doi-and-institutional-page-verified",
])
const EXTRACTED_METRIC_STATUSES = new Set(["source-extracted", "source-reported-range"])

describe("Catalysis reaction records v1", () => {
  const sourceById = new Map(dataset.sources.map(source => [source.id, source]))

  it("registers a DOI-verified literature seed at the documented grain", () => {
    expect(dataset.schemaVersion).toBe("catalysis-reaction-records-v1")
    expect(dataset.status).toBe("doi-verified-literature-seed")
    expect(dataset.sources).toHaveLength(10)
    expect(dataset.records).toHaveLength(10)
    expect(new Set(dataset.sources.map(source => source.id)).size).toBe(dataset.sources.length)
    expect(new Set(dataset.records.map(record => record.id)).size).toBe(dataset.records.length)
    expect(dataset.audit).toMatchObject({
      sourceCount: dataset.sources.length,
      recordCount: dataset.records.length,
      doiVerifiedSourceCount: dataset.sources.length,
      identityRegistryLinkedCount: 0,
      sameConditionRankingEligibleCount: 0,
    })
  })

  it("keeps source identity, DOI, and verification metadata internally consistent", () => {
    for (const source of dataset.sources) {
      expect(source.title.length).toBeGreaterThan(20)
      expect(source.journal.length).toBeGreaterThan(3)
      expect(source.year).toBeGreaterThanOrEqual(2020)
      expect(source.year).toBeLessThanOrEqual(2025)
      expect(source.doi).toMatch(DOI_PATTERN)
      expect(source.doiUrl).toBe(`https://doi.org/${source.doi}`)
      expect(source.sourceUrl).toMatch(/^https:\/\//)
      expect(VERIFIED_SOURCE_STATUSES.has(source.verification.status)).toBe(true)
      expect(source.verification.checkedAt).toBe(dataset.updatedAt)
      expect(source.verification.verifiedFields.length).toBeGreaterThanOrEqual(6)
    }

    expect(dataset.sources.map(source => source.doi)).toEqual(expect.arrayContaining([
      "10.1039/D2TA04485D",
      "10.1016/j.jcou.2022.101937",
      "10.1002/celc.202001613",
      "10.1002/aenm.202001709",
      "10.1002/adfm.201910408",
      "10.1039/D4MH01153H",
      "10.1039/D3SC01876H",
      "10.1039/D2TA01727J",
      "10.1016/j.apcatb.2021.120571",
      "10.1016/j.apcatb.2020.119241",
    ]))
  })

  it("enforces the reusable record contract and safe identity-join boundary", () => {
    for (const record of dataset.records) {
      for (const field of schema.recordContract.requiredTopLevelFields) {
        expect(record).toHaveProperty(field)
      }

      const source = sourceById.get(record.sourceId)
      expect(source).toBeTruthy()
      expect(record.dataMode).toBe("literature-curated")
      expect(record.recordType).toBe("electrocatalytic-co2rr")
      expect(record.identity.identityLink).toMatchObject({ canonicalId: null })
      expect(record.identity.identityLink.status).not.toBe("linked-to-mof-identity-registry")
      expect(record.identity.identityLink.joinRule.length).toBeGreaterThan(30)
      expect(record.reaction.substrate).toBe("CO2")
      expect(record.comparability).toMatchObject({
        normalizationReady: false,
        sameConditionComparable: false,
        doNotUseAsPerformanceRanking: true,
      })
      expect(record.comparability.reason.length).toBeGreaterThan(20)
      expect(record.recordProvenance).toMatchObject({
        sourceId: source.id,
        doi: source.doi,
        doiUrl: source.doiUrl,
        sourceUrl: source.sourceUrl,
        verificationStatus: source.verification.status,
        checkedAt: dataset.updatedAt,
      })
    }
  })

  it("requires field-level sources for curated claims and never fabricates unavailable metrics", () => {
    let notExtractedMetricCount = 0

    for (const record of dataset.records) {
      const source = sourceById.get(record.sourceId)

      for (const [fieldPath, fieldSource] of Object.entries(record.fieldSources)) {
        expect(fieldPath.length).toBeGreaterThan(4)
        expect(fieldSource.sourceId).toBe(source.id)
        expect(fieldSource.doi).toBe(source.doi)
        expect(fieldSource.sourceLocation.length).toBeGreaterThan(4)
        expect(["source-extracted", "source-reported-range"]).toContain(fieldSource.curationStatus)
      }

      for (const metric of record.performanceMetrics) {
        expect(metric.id.length).toBeGreaterThan(3)
        expect(metric.metric.length).toBeGreaterThan(3)
        expect(metric.sourceId).toBe(source.id)
        expect(metric.doi).toBe(source.doi)
        expect(metric.sourceLocation.length).toBeGreaterThan(8)

        if (metric.value === null) {
          notExtractedMetricCount += 1
          expect(metric.status).toBe("not-extracted")
          continue
        }

        expect(Number.isFinite(metric.value)).toBe(true)
        expect(metric.unit.length).toBeGreaterThan(0)
        expect(EXTRACTED_METRIC_STATUSES.has(metric.status)).toBe(true)
        if (metric.metric.includes("faradaic_efficiency")) {
          expect(metric.value).toBeGreaterThanOrEqual(0)
          expect(metric.value).toBeLessThanOrEqual(100)
        }
      }
    }

    expect(notExtractedMetricCount).toBeGreaterThanOrEqual(2)
    expect(dataset.audit.recordsWithExplicitNotExtractedMetrics).toBe(notExtractedMetricCount)
  })

  it("documents normalization, comparability, and active-phase non-claims", () => {
    expect(schema.recordContract.criticalMetricPolicy).toMatch(/null|omitted|not-extracted/)
    expect(schema.normalizationRules.map(rule => rule.id)).toEqual(expect.arrayContaining([
      "potential-reference",
      "partial-current-density",
      "condition-comparability",
      "active-phase-boundary",
    ]))
    expect(schema.identityJoinRules.map(rule => rule.id)).toEqual(expect.arrayContaining([
      "exact-structure-link",
      "doi-not-structure",
    ]))
    expect(JSON.stringify(schema.nonClaims)).toMatch(/does not rank catalysts/)
  })

  it("replaces the removed pathway map with the DOI reaction-record methodology", () => {
    const catalysis = methodologyModules.find(module => module.id === "catalysis-lab")
    const serialized = JSON.stringify(catalysis)
    const standard = catalysis.methodGroups.find(group => group.id === "catalysis-reaction-record-standard")

    expect(serialized).not.toMatch(/Pathway evidence map|Catalytic pathway evidence map|催化路径证据图|路径证据图/)
    expect(standard).toBeTruthy()
    const literatureReferences = standard.references.filter(reference => reference.id.startsWith("cat-"))
    expect(literatureReferences).toHaveLength(dataset.sources.length)
    expect(literatureReferences.every(reference => reference.label.includes("DOI"))).toBe(true)
    expect(standard.references.map(reference => reference.id)).toEqual(expect.arrayContaining(["crossref-rest-api", "crossref-crossmark"]))
    expect(standard.formulas.map(formula => formula.id)).toEqual(expect.arrayContaining([
      "catalysis-product-partial-current",
      "catalysis-comparability-gate",
    ]))
    expect(JSON.stringify(standard.limitationsZh)).toMatch(/不.*跨论文性能排名|没有记录具备跨论文性能排名资格/)
  })
})
