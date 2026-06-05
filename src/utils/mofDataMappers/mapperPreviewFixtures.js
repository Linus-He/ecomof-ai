// @ts-nocheck
import coreFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/core_mof_mapping_examples.json"
import qmofFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/qmof_mapping_examples.json"
import literatureFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/literature_evidence_mapping_examples.json"
import curatedFrameworkExamples from "../../../public/data/organic_acid_final_screening/curated_real_examples/real_al_mof_framework_examples.json"
import curatedQmofExamples from "../../../public/data/organic_acid_final_screening/curated_real_examples/real_qmof_descriptor_examples.json"
import curatedEvidenceRecords from "../../../public/data/organic_acid_final_screening/curated_real_examples/real_literature_evidence_records.json"
import curatedMappingReport from "../../../public/data/organic_acid_final_screening/curated_real_examples/real_data_mapping_report.json"
import { buildDataQualityGate, summarizeQualityGates } from "./dataQualityGate"
import { mapCoreMofRecord } from "./coreMofMapper"
import { mapLiteratureEvidenceRecord } from "./literatureEvidenceMapper"
import { mapQmofRecord } from "./qmofMapper"
import { validateAgainstSchema } from "./schemaValidator"

const PREVIEW_CONFIG = [
  {
    id: "core-like-framework",
    title: "CoRE-like data -> Organic Acid framework schema",
    titleZh: "CoRE-like 数据 -> 有机酸骨架 schema",
    schemaId: "organicAcidFramework",
    raw: coreFixtures[0],
    mapper: mapCoreMofRecord,
  },
  {
    id: "qmof-like-electronic",
    title: "QMOF-like data -> electronic descriptor schema",
    titleZh: "QMOF-like 数据 -> 电子描述符 schema",
    schemaId: "electronicDescriptor",
    raw: qmofFixtures[0],
    mapper: mapQmofRecord,
  },
  {
    id: "literature-evidence",
    title: "Literature evidence -> evidence record schema",
    titleZh: "文献证据 -> evidence record schema",
    schemaId: "literatureEvidence",
    raw: literatureFixtures[0],
    mapper: mapLiteratureEvidenceRecord,
  },
]

export function buildMapperPreviewRows() {
  const rows = PREVIEW_CONFIG.map(config => {
    const mapped = config.mapper(config.raw)
    const validation = validateAgainstSchema(mapped, config.schemaId)
    const qualityGate = buildDataQualityGate(validation)
    return {
      id: config.id,
      title: config.title,
      titleZh: config.titleZh,
      schemaId: config.schemaId,
      raw: config.raw,
      mapped,
      validation,
      qualityGate,
    }
  })
  return {
    rows,
    summary: summarizeQualityGates(rows.map(row => row.qualityGate)),
    boundary: "Mapper preview uses small fixtures only. It does not load full CoRE, QMOF, or literature databases.",
  }
}

export function loadCuratedRealExamples() {
  return {
    frameworks: curatedFrameworkExamples,
    qmofDescriptors: curatedQmofExamples,
    evidenceRecords: curatedEvidenceRecords,
    mappingReport: curatedMappingReport,
    boundary: curatedMappingReport.boundary,
    boundaryZh: curatedMappingReport.boundaryZh,
  }
}

export function buildRealDataMappingReport(mappedFrameworks = [], qmofRecords = [], evidenceRecords = [], baseReport = curatedMappingReport, unmatchedRecords = []) {
  const frameworks = Array.isArray(mappedFrameworks) ? mappedFrameworks : []
  const readyForScoring = frameworks.filter(row => row.dataQualityGate?.status === "ready_for_scoring").length
  const needsReview = frameworks.filter(row => row.dataQualityGate?.status === "needs_review").length
  const rejected = frameworks.filter(row => row.dataQualityGate?.status === "rejected").length
  const fieldSources = frameworks.flatMap(row => Object.values(row.fieldSources || {}))
  const populatedFieldSources = fieldSources.filter(source => source?.sourceType && source.sourceType !== "pending_provenance")
  const fieldProvenanceCoverage = fieldSources.length
    ? Number((populatedFieldSources.length / fieldSources.length).toFixed(2))
    : 0
  const doiCandidates = [
    ...frameworks.map(row => row.sourceDoi),
    ...frameworks.flatMap(row => Object.values(row.fieldSources || {}).map(source => source?.sourceDoi)),
    ...(Array.isArray(evidenceRecords) ? evidenceRecords : []).map(row => row.sourceDoi),
    ...(Array.isArray(qmofRecords) ? qmofRecords : []).map(row => row.sourceDoi),
  ]
  const doiCoverage = doiCandidates.length
    ? Number((doiCandidates.filter(Boolean).length / doiCandidates.length).toFixed(2))
    : 0

  return {
    ...baseReport,
    datasetMode: "curated_real_examples",
    version: "V1.6",
    frameworkRecords: frameworks.length || baseReport.frameworkRecords || 0,
    qmofDescriptorRecords: Array.isArray(qmofRecords) ? qmofRecords.length : baseReport.qmofDescriptorRecords || 0,
    evidenceRecords: Array.isArray(evidenceRecords) ? evidenceRecords.length : baseReport.evidenceRecords || 0,
    readyForScoring,
    needsReview,
    rejected,
    unmatchedQmofDescriptorRecords: Array.isArray(unmatchedRecords) ? unmatchedRecords.length : baseReport.unmatchedQmofDescriptorRecords || 0,
    unmatchedQmofRecords: unmatchedRecords,
    doiCoverage,
    fieldProvenanceCoverage,
    hotSpotProjectionStatus: frameworks.length ? "projected_with_quality_gate_roles" : "pending",
    notes: "Small curated real examples for mapper validation, not full database screening.",
    notesZh: "小规模人工整理真实样例用于验证 mapper、schema、quality gate 与热区投影，不代表全量数据库筛选。",
    boundary: "V1.6 introduces curated real examples for validating the data mapping and screening workflow. It is not full-scale CoRE/QMOF database screening.",
    boundaryZh: "V1.6 引入小规模人工整理真实样例，用于验证数据映射与筛选流程；这不是全量 CoRE/QMOF 数据库筛选。",
  }
}
