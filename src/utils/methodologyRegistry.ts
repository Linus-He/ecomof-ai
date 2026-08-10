// @ts-nocheck

const VERIFIED_SOURCE_STATUSES = new Set([
  "validated_literature",
  "official_standard",
  "official_reference",
  "uploaded_verified",
])

const MODULE_REGISTRY_META = {
  "platform-overview": {
    boundary: "governance",
    functionHash: "overview",
    functionLabel: "Research overview",
    functionLabelZh: "研究全景",
    databaseLabel: "Cross-module data contracts and field provenance",
    databaseLabelZh: "跨模块数据契约与字段级溯源",
    sourceCategoryIds: ["platform-method", "data-quality-validation"],
  },
  "mof-library": {
    boundary: "evidence_governed",
    functionHash: "library",
    functionLabel: "MOF Library",
    functionLabelZh: "MOF库",
    databaseLabel: "MOF identity index, descriptors, and source fields",
    databaseLabelZh: "MOF 身份索引、描述符与来源字段",
    sourceCategoryIds: ["mof-library-data"],
  },
  ecoscreen: {
    boundary: "decision_support",
    functionHash: "ecoscreen",
    functionLabel: "EcoScreen workbench",
    functionLabelZh: "EcoScreen 工作台",
    databaseLabel: "MOF descriptors, sustainability factors, and evidence weights",
    databaseLabelZh: "MOF 描述符、可持续性因子与证据权重",
    sourceCategoryIds: ["ecoscreen-sustainability"],
  },
  gassep: {
    boundary: "condition_gated",
    functionHash: "gassep",
    functionLabel: "GasSep workbench",
    functionLabelZh: "GasSep 工作台",
    databaseLabel: "Adsorption records, isotherms, temperature, pressure, and gas composition",
    databaseLabelZh: "吸附记录、等温线、温度、压力与气体组成",
    sourceCategoryIds: ["gassep-process"],
  },
  "catalysis-lab": {
    boundary: "evidence_governed",
    functionHash: "catalysis",
    functionLabel: "Catalysis workbench",
    functionLabelZh: "催化工作台",
    databaseLabel: "DOI-verified reaction records and catalyst condition fields",
    databaseLabelZh: "DOI 核验反应记录与催化条件字段",
    sourceCategoryIds: ["organic-acid-catalysis"],
  },
  "organic-acid": {
    boundary: "experimental_pending",
    functionHash: "catalysis-organic-acid",
    functionLabel: "Organic Acid workspace",
    functionLabelZh: "有机酸工作台",
    databaseLabel: "Candidate, pathway, host-guest, audit, and experimental-feedback records",
    databaseLabelZh: "候选物、路径、主客体、审计与实验反馈记录",
    sourceCategoryIds: ["organic-acid-catalysis", "data-quality-validation"],
  },
  "shared-evidence": {
    boundary: "governance",
    functionHash: "data-quality-provenance",
    functionLabel: "Data quality and provenance",
    functionLabelZh: "数据质量与来源",
    databaseLabel: "Shared source objects, field mappings, and review states",
    databaseLabelZh: "共享来源对象、字段映射与核查状态",
    sourceCategoryIds: ["platform-method", "data-quality-validation"],
  },
  "limitations-validation": {
    boundary: "experimental_pending",
    functionHash: "methodology-algorithm-validation",
    functionLabel: "Algorithm validation center",
    functionLabelZh: "算法验证中心",
    databaseLabel: "Benchmarks, experimental labels, validation gaps, and version records",
    databaseLabelZh: "基准、实验标签、验证缺口与版本记录",
    sourceCategoryIds: ["data-quality-validation"],
  },
}

export const METHODOLOGY_BOUNDARY_LABELS = {
  governance: { en: "Governance framework", zh: "治理框架", tone: "info" },
  evidence_governed: { en: "Evidence governed", zh: "证据治理", tone: "reviewed" },
  decision_support: { en: "Decision support", zh: "决策支持", tone: "info" },
  condition_gated: { en: "Condition gated", zh: "条件门控", tone: "conditional" },
  experimental_pending: { en: "Experimental validation required", zh: "待实验验证", tone: "pending" },
}

function array(value) {
  return Array.isArray(value) ? value : []
}

function uniqueBy(items, key) {
  const seen = new Set()
  return items.filter(item => {
    const value = item?.[key]
    if (!value || seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function buildMethodologyRegistry(modules: any[] = [], literatureRecords: any = {}) {
  const sourceById = new Map(array(literatureRecords?.sources).map(source => [source.id, source]))
  const categoryById = new Map(array(literatureRecords?.categories).map(category => [category.id, category]))

  const cards = array(modules).map((module, index) => {
    const groups = array(module?.methodGroups)
    const formulas = groups.flatMap(group => array(group?.formulas))
    const references = groups.flatMap(group => array(group?.references))
    const limitations = groups.flatMap(group => array(group?.limitations))
    const limitationsZh = groups.flatMap(group => array(group?.limitationsZh))
    const meta = MODULE_REGISTRY_META[module?.id] || {
      boundary: "experimental_pending",
      functionHash: `methodology-${module?.id}`,
      functionLabel: "Related function",
      functionLabelZh: "相关功能",
      databaseLabel: "Module data contract",
      databaseLabelZh: "模块数据契约",
      sourceCategoryIds: [],
    }
    const categoryIds = array(meta.sourceCategoryIds)
    const categorySources = categoryIds.flatMap(categoryId => {
      const category = categoryById.get(categoryId)
      return array(category?.sourceIds).map(sourceId => sourceById.get(sourceId)).filter(Boolean)
    })
    const literatureSources = uniqueBy(categorySources, "id")
    const verifiedLiteratureCount = literatureSources.filter(source => VERIFIED_SOURCE_STATUSES.has(source.status)).length
    const pendingLiteratureCount = literatureSources.filter(source => !VERIFIED_SOURCE_STATUSES.has(source.status)).length

    return {
      id: module.id,
      sequence: index + 1,
      title: module.module,
      titleZh: module.moduleZh,
      summary: module.summary,
      summaryZh: module.summaryZh,
      methodHash: `methodology-${module.id}`,
      groups,
      formulas,
      references,
      limitations,
      limitationsZh,
      inputs: array(module.inputs),
      inputsZh: array(module.inputsZh),
      outputs: array(module.outputs),
      outputsZh: array(module.outputsZh),
      workflow: array(module.methodWorkflow),
      databaseLabel: meta.databaseLabel,
      databaseLabelZh: meta.databaseLabelZh,
      functionHash: meta.functionHash,
      functionLabel: meta.functionLabel,
      functionLabelZh: meta.functionLabelZh,
      boundary: meta.boundary,
      sourceCategoryIds: categoryIds,
      literatureSources,
      verifiedLiteratureCount,
      pendingLiteratureCount,
    }
  })

  return {
    cards,
    metrics: {
      moduleCount: cards.length,
      groupCount: cards.reduce((sum, card) => sum + card.groups.length, 0),
      formulaCount: cards.reduce((sum, card) => sum + card.formulas.length, 0),
      referenceCount: cards.reduce((sum, card) => sum + card.references.length, 0),
      limitationCount: cards.reduce((sum, card) => sum + card.limitations.length, 0),
      sourceCount: array(literatureRecords?.sources).length,
      verifiedSourceCount: array(literatureRecords?.sources).filter(source => VERIFIED_SOURCE_STATUSES.has(source.status)).length,
    },
  }
}
