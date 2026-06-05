// @ts-nocheck
import { describe, expect, it } from "vitest"
import coreFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/core_mof_mapping_examples.json"
import literatureFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/literature_evidence_mapping_examples.json"
import qmofFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/qmof_mapping_examples.json"
import { buildDataQualityGate } from "../../utils/mofDataMappers/dataQualityGate"
import { mapCoreMofRecord } from "../../utils/mofDataMappers/coreMofMapper"
import { mapLiteratureEvidenceRecord } from "../../utils/mofDataMappers/literatureEvidenceMapper"
import { buildMapperPreviewRows } from "../../utils/mofDataMappers/mapperPreviewFixtures"
import { mapQmofRecord } from "../../utils/mofDataMappers/qmofMapper"
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
})
