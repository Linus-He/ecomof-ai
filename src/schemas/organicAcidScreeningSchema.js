// @ts-nocheck

export const ORGANIC_ACID_FRAMEWORK_SCHEMA = {
  id: "organicAcidFramework",
  label: "Organic Acid framework schema",
  labelZh: "有机酸骨架 schema",
  description: "Normalized Al-MOF scaffold record used before OACS scoring.",
  fields: [
    { path: "candidateId", type: "string", required: true },
    { path: "sourceRecordId", type: "string", required: true },
    { path: "sourceType", type: "enum", required: true, values: ["core_like_fixture", "manual_seed", "literature_curated", "curated_real_example"] },
    { path: "displayName", type: "string", required: true },
    { path: "formula", type: "string", required: true },
    { path: "metalNode", type: "string", required: true },
    { path: "linkerFamily", type: "string", required: true },
    { path: "topology", type: "string", required: true },
    { path: "poreMetrics", type: "object", required: true },
    { path: "poreMetrics.pldA", type: "number", required: true, min: 0 },
    { path: "poreMetrics.lcdA", type: "number", required: true, min: 0 },
    { path: "poreMetrics.surfaceAreaM2G", type: "number", required: true, min: 0 },
    { path: "poreMetrics.poreVolumeCm3G", type: "number", required: true, min: 0 },
    { path: "waterStability", type: "object", required: true },
    { path: "waterStability.maxTestedTempC", type: "number", required: true },
    { path: "waterStability.postTreatmentPxrdRetained", type: "boolean", required: true },
    { path: "waterStability.sourceStatus", type: "enum", required: true, values: ["verified", "literature_proxy", "pending_metadata", "demo_proxy", "curated_real_example"] },
    { path: "organicAcidDescriptors", type: "object", required: true },
    { path: "organicAcidDescriptors.hydrothermalEvidenceStrength", type: "number", required: true, min: 0, max: 1 },
    { path: "organicAcidDescriptors.c1IntermediateAccessibility", type: "number", required: true, min: 0, max: 1 },
    { path: "organicAcidDescriptors.collapseRisk", type: "number", required: true, min: 0, max: 1 },
    { path: "mappingStatus", type: "enum", required: true, values: ["mapped_fixture", "curated_real_example", "needs_review", "blocked"] },
    { path: "evidenceBoundary", type: "string", required: true },
    { path: "sourceMapping", type: "array", required: true },
  ],
}

export const ELECTRONIC_DESCRIPTOR_SCHEMA = {
  id: "electronicDescriptor",
  label: "QMOF-like electronic descriptor schema",
  labelZh: "QMOF-like 电子描述符 schema",
  description: "Normalized electronic-descriptor record used before DMRS scoring.",
  fields: [
    { path: "candidateId", type: "string", required: true },
    { path: "sourceRecordId", type: "string", required: true },
    { path: "sourceType", type: "enum", required: true, values: ["qmof_like_fixture", "manual_seed", "literature_proxy", "qmof_curated_example"] },
    { path: "metal", type: "string", required: true },
    { path: "descriptors", type: "object", required: true },
    { path: "descriptors.bandGapEv", type: "number", required: true, min: 0 },
    { path: "descriptors.partialChargeMetal", type: "number", required: true },
    { path: "descriptors.oxoAffinityProxy", type: "number", required: true, min: 0, max: 1 },
    { path: "descriptors.formateAffinityProxy", type: "number", required: true, min: 0, max: 1 },
    { path: "descriptors.redoxWindowProxy", type: "number", required: true, min: 0, max: 1 },
    { path: "descriptorConfidence", type: "enum", required: true, values: ["high", "medium", "low", "pending"] },
    { path: "mappingStatus", type: "enum", required: true, values: ["mapped_fixture", "curated_real_example", "needs_review", "blocked"] },
    { path: "evidenceBoundary", type: "string", required: true },
    { path: "sourceMapping", type: "array", required: true },
  ],
}

export const LITERATURE_EVIDENCE_SCHEMA = {
  id: "literatureEvidence",
  label: "Literature evidence record schema",
  labelZh: "文献证据记录 schema",
  description: "Normalized evidence record used by the evidence layer and version docs.",
  fields: [
    { path: "id", type: "string", required: true },
    { path: "sourceType", type: "enum", required: true, values: ["uploaded_paper", "previous_uploaded_reference", "manual_note", "method_practice", "curated_real_example", "field_provenance"] },
    { path: "status", type: "enum", required: true, values: ["verified_from_uploaded_file", "pending_metadata", "literature_proxy", "demo_proxy", "pending_verification"] },
    { path: "sourceTitle", type: "string", required: true },
    { path: "sourceDoi", type: "string", required: false, allowNull: true, format: "doi" },
    { path: "fieldTargets", type: "array", required: true },
    { path: "inspiredModules", type: "array", required: true },
    { path: "coreIdea", type: "string", required: true },
    { path: "adaptationBoundary", type: "string", required: true },
    { path: "evidenceBoundary", type: "string", required: true },
  ],
}

export const ORGANIC_ACID_SCHEMA_REGISTRY = {
  organicAcidFramework: ORGANIC_ACID_FRAMEWORK_SCHEMA,
  electronicDescriptor: ELECTRONIC_DESCRIPTOR_SCHEMA,
  literatureEvidence: LITERATURE_EVIDENCE_SCHEMA,
}

export function getOrganicAcidSchema(schemaId) {
  return ORGANIC_ACID_SCHEMA_REGISTRY[schemaId] || null
}
