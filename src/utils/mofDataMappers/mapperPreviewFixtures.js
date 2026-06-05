// @ts-nocheck
import coreFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/core_mof_mapping_examples.json"
import qmofFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/qmof_mapping_examples.json"
import literatureFixtures from "../../../public/data/organic_acid_final_screening/mapping_fixtures/literature_evidence_mapping_examples.json"
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
