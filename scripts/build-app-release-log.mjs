// Builds public/data/app_release_log.json — the single unified App release log.
//
// One App version manages the whole platform; each release lists ONLY the
// modules it changed. Historical per-module version numbers (Organic Acid
// V3.9.x, Database V2.2, Gas v2.1, ...) are NOT renumbered — they are the
// pre-1.0 modular-development era and are preserved verbatim, regrouped by
// module from the existing per-module impact fields in
// version_evolution_records.json so no history is lost.
//
// Run: node scripts/build-app-release-log.mjs
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, "public", "data")
const GENERATED_AT = process.env.ECOMOF_RETRIEVED_AT || "2026-06-29"

const MODULE_CATALOG = {
  organicAcid: {
    label: { zh: "有机酸", en: "Organic Acid" },
    blurb: {
      zh: "数据驱动白盒主客体催化路线筛选（HGCPS + 不确定度）。",
      en: "Data-driven white-box host-guest catalytic route screening (HGCPS + uncertainty).",
    },
    target: "catalysisLab",
    hash: "catalysis-organic-acid",
  },
  gasSep: {
    label: { zh: "气体分离", en: "GasSep" },
    blurb: {
      zh: "气体分离 / 容量筛选（ISODB 真实等温线 + IAST 选择性）。",
      en: "Gas separation / capacity screening (real ISODB isotherms + IAST selectivity).",
    },
    target: "gassep",
    hash: "gassep",
  },
  database: {
    label: { zh: "数据库", en: "Database" },
    blurb: {
      zh: "统一 MOF 身份层与跨模块结构 / 气体 / 催化数据打通。",
      en: "Unified MOF identity layer linking structure / gas / catalysis records.",
    },
    target: "mofLibrary",
    hash: "library",
  },
  validation: {
    label: { zh: "验证", en: "Validation" },
    blurb: {
      zh: "白盒可解释、稳健性验证与字段级溯源。",
      en: "White-box explainability, robustness validation, and field-level provenance.",
    },
    target: "about",
    hash: "methodology-algorithm-validation",
  },
  ui: {
    label: { zh: "界面与体验", en: "UI & Experience" },
    blurb: {
      zh: "统一版本、按模块讲能力、收敛的研究报告与交互可视化。",
      en: "Unified versioning, module-first capabilities, focused reports, interactive visuals.",
    },
    target: "home",
    hash: "overview",
  },
}

// Keyword routing for regrouping historical versions by module.
const MODULE_MATCHERS = {
  organicAcid: /organic acid|host-guest|host guest|hgcps|reaction|cataly|有机酸|主客体/i,
  gasSep: /\bgas\b|iast|adsorption|separation|isotherm|气体|分离|等温线/i,
  database: /core|qmof|database|record|candidate|ingestion|identity|数据库|结构库|身份/i,
  validation: /validation|benchmark|robust|credibility|provenance|sensitivity|audit|验证|稳健|可信|溯源|审计/i,
  ui: /ui|home|dashboard|tab|report|界面|首页|报告|可视化/i,
}

function isMeaningful(value) {
  if (!value) return false
  const text = String(value).trim().toLowerCase()
  if (!text || text === "pending" || text === "none." || text === "none") return false
  if (/^(demo|validation roadmap only|manual validation roadmap)/.test(text)) return false
  return true
}

function classifyVersion(version) {
  const haystack = [
    version.summary,
    (version.categories || []).join(" "),
    version.scientificImpact,
    version.algorithmImpact,
    version.databaseImpact,
    version.validationImpact,
    version.uiImpact,
  ].join(" ")
  const impactByModule = {
    organicAcid: version.algorithmImpact || version.scientificImpact,
    gasSep: version.databaseImpact || version.summary,
    database: version.databaseImpact,
    validation: version.validationImpact,
    ui: version.uiImpact,
  }
  const modules = {}
  for (const [moduleKey, matcher] of Object.entries(MODULE_MATCHERS)) {
    const note = impactByModule[moduleKey]
    if (matcher.test(haystack) && isMeaningful(note)) {
      modules[moduleKey] = String(note).trim()
    }
  }
  return modules
}

// The unified v1.0.0 release: integrates the formerly separate modules into a
// single platform version. Each module entry describes only what this release
// touched, in plain user-facing language.
const V1_RELEASE = {
  appVersion: "v1.0.0",
  date: GENERATED_AT,
  stage: "unified-platform",
  headline: {
    zh: "首个统一平台版本：把有机酸、气体分离、数据库与验证整合到单一 App 版本号下。",
    en: "First unified platform release: organic-acid, gas separation, database, and validation now ship under one App version.",
  },
  summary: {
    zh: "整合此前各模块为成熟 App 的统一版本；此前为模块化开发期，原始版本号（有机酸 V3.9.x / 数据库 V2.2 / 气体 v2.1 等）见下方历史沿革，一律未改。自 v1.0.0 起，每次发布只列出本次有更新的模块。",
    en: "Integrates the previously separate modules into one mature App version. Earlier work was the modular-development era; original module version numbers (Organic Acid V3.9.x, Database V2.2, Gas v2.1, ...) are preserved unchanged in the history below. From v1.0.0, each release lists only the modules it changed.",
  },
  modules: {
    organicAcid: {
      summary: {
        zh: "白盒主客体催化路线筛选，八因子加权几何 HGCPS 加不确定度。",
        en: "White-box host-guest route screening with eight-factor weighted-geometric HGCPS plus uncertainty.",
      },
      changes: [
        { zh: "HGCPS 八因子加权几何评分方法论作为独立模块呈现。", en: "Eight-factor weighted-geometric HGCPS methodology surfaced as a standalone module." },
        { zh: "描述符消融与敏感度分析，标注高优先级实验假设而非最终结论。", en: "Descriptor ablation and sensitivity analysis, marked as a high-priority hypothesis, not a final conclusion." },
        { zh: "B2 分数引入 Monte-Carlo 不确定度误差条。", en: "B2 scores now carry Monte-Carlo uncertainty error bars." },
      ],
    },
    gasSep: {
      summary: {
        zh: "气体分离与容量筛选，基于真实单组分等温线计算 IAST 选择性。",
        en: "Gas separation and capacity screening with IAST selectivity computed from real pure-component isotherms.",
      },
      changes: [
        { zh: "Gas Adsorption v2.1：对成对真实等温线计算 69 个 computed-IAST 选择性值。", en: "Gas Adsorption v2.1: 69 computed-IAST selectivity values from paired real isotherms." },
        { zh: "把 79 条气体记录保守链接到 CoRE/QMOF 结构候选。", en: "Linked 79 gas records to CoRE/QMOF structure candidates under explicit confidence labels." },
        { zh: "首页新增「进入 GasSep」入口，与其它模块同级。", en: "Added a peer-level 'Enter GasSep' entry on the homepage." },
        { zh: "GasSep、MOF Library、Data Sources 同步展示真实覆盖度。", en: "Coverage surfaced consistently across GasSep, MOF Library, and Data Sources." },
      ],
    },
    database: {
      summary: {
        zh: "统一 MOF 身份层，把结构、气体与催化记录打通为可浏览的全貌。",
        en: "Unified MOF identity layer linking structure, gas, and catalysis records into one browsable view.",
      },
      changes: [
        { zh: "MOF Library 重做为统一 MOF 浏览器：分面检索 + 结构/气体/催化三类完整度 + 详情聚合。", en: "MOF Library rebuilt as a unified browser: faceted search + structure/gas/catalysis completeness + aggregated detail panel." },
        { zh: "经 mofIdentity 聚合各来源 provenance，给出覆盖度统计。", en: "Provenance aggregated via mofIdentity with coverage statistics." },
        { zh: "保留 CoRE/QMOF 结构导入与 gas 吸附 v2.1 记录层。", en: "Preserves CoRE/QMOF structural imports and the gas-adsorption v2.1 record layer." },
      ],
    },
    validation: {
      summary: {
        zh: "白盒可解释加稳健性验证，所有派生量都标注边界。",
        en: "White-box explainability plus robustness validation, with every derived value bounded.",
      },
      changes: [
        { zh: "结构代理与真实 uptake 做 Spearman 指示性审计，低相关标 low-validity-indicative。", en: "Structure proxies audited against real uptake via Spearman, low correlations flagged low-validity-indicative." },
        { zh: "新增 provenance 与反防伪测试。", en: "Added provenance and anti-fabrication tests." },
        { zh: "保留模型可信度 v2（78.87 / Grade B）与高过拟合风险的诚实披露。", en: "Keeps credibility v2 (78.87 / Grade B) and the honest High Overfitting Risk disclosure." },
      ],
    },
    ui: {
      summary: {
        zh: "成熟 App 体验：统一版本、按模块讲能力、收敛的研究报告与交互可视化。",
        en: "Mature App experience: unified versioning, module-first capabilities, focused reports, interactive visuals.",
      },
      changes: [
        { zh: "统一 App 版本号 + 二级（分模块）更新日志，历史散版收进折叠区。", en: "Single App version + secondary per-module changelog; legacy versions folded into a collapsed history." },
        { zh: "首页能力区改为按模块讲能力（EcoScreen / MOF Library / Organic Acid / GasSep）。", en: "Homepage capabilities restated module-by-module (EcoScreen / MOF Library / Organic Acid / GasSep)." },
        { zh: "研究报告收敛为候选/筛选子 tab + 四块紧凑叙事。", en: "Research reports converged into candidate/round sub-tabs with a four-block compact narrative." },
        { zh: "首页新增可交互 3D MOF 描述符散点图（移动端降级为 2D）。", en: "Added an interactive 3D MOF descriptor scatter on the homepage (2D fallback on mobile)." },
      ],
    },
  },
}

async function main() {
  const versionRecords = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "version_evolution_records.json"), "utf8"),
  )
  const versions = Array.isArray(versionRecords.versions) ? versionRecords.versions : []

  const historyByModule = { organicAcid: [], gasSep: [], database: [], validation: [], ui: [] }
  for (const version of versions) {
    const modules = classifyVersion(version)
    for (const [moduleKey, note] of Object.entries(modules)) {
      historyByModule[moduleKey].push({
        version: version.version,
        date: version.date,
        note,
      })
    }
  }

  const payload = {
    schemaVersion: "1.0",
    currentAppVersion: V1_RELEASE.appVersion,
    generatedAt: GENERATED_AT,
    authority:
      "Single unified EcoMOF-AI App release log. One App version manages the whole platform; each release lists only the modules it changed. Historical module version numbers are preserved verbatim in history (pre-1.0 modular-development era).",
    provenance: {
      derivedFrom: "public/data/version_evolution_records.json",
      generatingScript: "scripts/build-app-release-log.mjs",
      note:
        "v1.0.0 module changes are authored from the integration work in this release; history is regrouped by module from existing per-module impact fields without altering any original version number.",
    },
    moduleCatalog: MODULE_CATALOG,
    releases: [V1_RELEASE],
    history: {
      label: {
        zh: "历史沿革（pre-1.0 模块化开发期）",
        en: "History (pre-1.0 modular-development era)",
      },
      note: {
        zh: "v1.0.0 之前 EcoMOF-AI 按模块分别迭代，原始版本号与真实 commit 绑定，全部原样保留并按模块归类展示。",
        en: "Before v1.0.0, EcoMOF-AI iterated module by module. Original version numbers are bound to real commits and are kept verbatim, regrouped here by module.",
      },
      versionCount: versions.length,
      byModule: historyByModule,
    },
  }

  await fs.writeFile(
    path.join(DATA_DIR, "app_release_log.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  )
  const counts = Object.entries(historyByModule)
    .map(([key, rows]) => `${key}=${rows.length}`)
    .join(", ")
  console.log(`Wrote app_release_log.json · v1.0.0 + history (${counts})`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
