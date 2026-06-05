// @ts-nocheck
import { describe, expect, it } from "vitest"
import coreFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/core_mof_mapping_examples.json"
import literatureFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/literature_evidence_mapping_examples.json"
import qmofFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/qmof_mapping_examples.json"
import { buildDataQualityGate } from "../../utils/mofDataMappers/dataQualityGate"
import { mapCoreMofRecord, mapCuratedFrameworkExamples } from "../../utils/mofDataMappers/coreMofMapper"
import { attachRealEvidenceRecords, mapLiteratureEvidenceRecord } from "../../utils/mofDataMappers/literatureEvidenceMapper"
import { buildMapperPreviewRows, buildRealDataMappingReport, loadCuratedRealExamples } from "../../utils/mofDataMappers/mapperPreviewFixtures"
import { mapQmofRecord, mergeQmofDescriptorsIntoFrameworks } from "../../utils/mofDataMappers/qmofMapper"
import { validateAgainstSchema } from "../../utils/mofDataMappers/schemaValidator"

describe("Organic Acid V1.5 data mappers", () => {
  it("maps CoRE-like fixture records into the Organic Acid framework schema", () => {
    const mapped = mapCoreMofRecord(coreFixtures[0])
    const validation = validateAgainstSchema(mapped, "organicAcidFramework")
    const gate = buildDataQualityGate(validation)

    expect(mapped.sourceType).toBe("core_like_fixture")
    expect(mapped.metalNode).toBe("Al")
    expect(mapped.organicAcidDescriptors.hydrothermalEvidenceStrength).toBeGreaterThan(0.8)
    expect(mapped.evidenceBoundary).toMatch(/not full CoRE database integration/)
    expect(validation.valid).toBe(true)
    expect(gate.status).toBe("pass")
  })

  it("maps QMOF-like fixture records into finite electronic descriptors", () => {
    const mapped = mapQmofRecord(qmofFixtures[0])
    const validation = validateAgainstSchema(mapped, "electronicDescriptor")

    expect(mapped.sourceType).toBe("qmof_like_fixture")
    expect(mapped.metal).toBe("Mo")
    expect(mapped.descriptors.oxoAffinityProxy).toBeGreaterThan(0.8)
    expect(Object.values(mapped.descriptors).every(Number.isFinite)).toBe(true)
    expect(validation.valid).toBe(true)
  })

  it("maps literature evidence without fabricating pending DOI metadata", () => {
    const verified = mapLiteratureEvidenceRecord(literatureFixtures[0])
    const pending = mapLiteratureEvidenceRecord(literatureFixtures[1])

    expect(verified.sourceDoi).toBe("10.1038/s41467-025-60170-0")
    expect(validateAgainstSchema(verified, "literatureEvidence").valid).toBe(true)
    expect(pending.sourceDoi).toBeNull()
    expect(pending.status).toBe("pending_metadata")
    expect(validateAgainstSchema(pending, "literatureEvidence").valid).toBe(true)
  })

  it("blocks invalid DOI and non-finite values before scoring", () => {
    const mapped = mapLiteratureEvidenceRecord({ ...literatureFixtures[0], doi: "not-a-doi" })
    const doiValidation = validateAgainstSchema({ ...mapped, sourceDoi: "not-a-doi" }, "literatureEvidence")
    const badElectronic = mapQmofRecord({ ...qmofFixtures[0], band_gap_eV: Number.NaN })
    const electronicValidation = validateAgainstSchema(badElectronic, "electronicDescriptor")

    expect(doiValidation.valid).toBe(false)
    expect(doiValidation.errors.map(row => row.path)).toContain("sourceDoi")
    expect(electronicValidation.valid).toBe(true)
    expect(badElectronic.descriptors.bandGapEv).toBe(0)
  })

  it("builds mapper preview rows with raw input, mapped schema, validation, and quality gate", () => {
    const preview = buildMapperPreviewRows()

    expect(preview.rows.map(row => row.id)).toEqual([
      "core-like-framework",
      "qmof-like-electronic",
      "literature-evidence",
    ])
    preview.rows.forEach(row => {
      expect(row.raw).toBeTruthy()
      expect(row.mapped).toBeTruthy()
      expect(row.validation.valid).toBe(true)
      expect(["pass", "needs_review"]).toContain(row.qualityGate.status)
    })
    expect(preview.summary.total).toBe(3)
    expect(preview.boundary).toMatch(/does not load full CoRE, QMOF/)
  })

  it("maps V1.6 curated real examples without fabricating DOI metadata", () => {
    const curated = loadCuratedRealExamples()
    const mapped = mapCuratedFrameworkExamples(curated.frameworks)
    const qmofMerge = mergeQmofDescriptorsIntoFrameworks(mapped, curated.qmofDescriptors)
    const attached = attachRealEvidenceRecords(qmofMerge.frameworks, curated.evidenceRecords)
    const report = buildRealDataMappingReport(attached.frameworks, curated.qmofDescriptors, attached.evidenceRecords, curated.mappingReport, qmofMerge.unmatchedRecords)

    expect(curated.frameworks).toHaveLength(12)
    expect(curated.qmofDescriptors).toHaveLength(12)
    expect(curated.evidenceRecords).toHaveLength(48)
    expect(mapped.every(row => row.sourceType === "curated_real_example")).toBe(true)
    expect(mapped.every(row => row.sourceDoi === null)).toBe(true)
    expect(mapped.every(row => Object.values(row.descriptorScores).every(Number.isFinite))).toBe(true)
    expect(mapped.filter(row => row.dataQualityGate.status === "ready_for_scoring")).toHaveLength(3)
    expect(mapped.filter(row => row.dataQualityGate.status === "needs_review")).toHaveLength(7)
    expect(mapped.filter(row => row.dataQualityGate.status === "rejected")).toHaveLength(2)
    expect(qmofMerge.matchedCount).toBe(10)
    expect(qmofMerge.unmatchedRecords).toHaveLength(2)
    expect(attached.frameworks.every(row => row.evidenceRecords.length > 0)).toBe(true)
    expect(report).toEqual(expect.objectContaining({
      datasetMode: "curated_real_examples",
      version: "V1.6",
      frameworkRecords: 12,
      qmofDescriptorRecords: 12,
      evidenceRecords: 48,
      readyForScoring: 3,
      needsReview: 7,
      rejected: 2,
      unmatchedQmofDescriptorRecords: 2,
      doiCoverage: 0,
    }))
    expect(report.boundary).toMatch(/not full-scale CoRE\/QMOF database screening/i)
  })
})
