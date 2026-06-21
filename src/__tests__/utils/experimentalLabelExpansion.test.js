// @ts-nocheck
import { describe, expect, it } from "vitest"
import v1 from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import v2 from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import provenance from "../../../public/data/experimental_labels/experimental_label_provenance_audit.json"
import { auditLabelProvenance } from "../../utils/dataAudit/labelProvenanceAudit"
import { buildExperimentalLabelDataset } from "../../utils/dataIngestion/experimentalLabelDataset"

describe("Experimental Label Expansion", () => {
  it("expands the corpus to >= 100 labels (target 150) and stays a superset of v1", () => {
    expect(v2.labels.length).toBeGreaterThanOrEqual(100)
    const v1Ids = new Set(v1.labels.map(l => l.labelId))
    const v2Ids = new Set(v2.labels.map(l => l.labelId))
    for (const id of v1Ids) expect(v2Ids.has(id)).toBe(true)
  })

  it("every expanded label is valid and non-forbidden", () => {
    const built = buildExperimentalLabelDataset(v2.labels)
    expect(built.invalid.length).toBe(0)
    expect(built.summary.syntheticCount).toBe(0)
  })

  it("provenance audit enforces Derived = 0 and Synthetic = 0", () => {
    const audit = auditLabelProvenance(v2.labels)
    expect(audit.derivedLabels).toBe(0)
    expect(audit.syntheticLabels).toBe(0)
    expect(audit.status).toBe("Pass")
    expect(audit.experimentalTotal).toBe(v2.labels.length)
    expect(provenance.derivedLabels).toBe(0)
    expect(provenance.syntheticLabels).toBe(0)
  })
})
