// Builds public/data/app_release_log.json — the single unified Web release log.
//
// One Web version manages the whole platform; each release lists ONLY the
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
const GENERATED_AT = process.env.ECOMOF_RETRIEVED_AT || "2026-07-21"

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
  date: "2026-06-29",
  stage: "unified-platform",
  headline: {
    zh: "首个统一平台版本：把有机酸、气体分离、数据库与验证整合到单一 Web 版本号下。",
    en: "First unified platform release: organic-acid, gas separation, database, and validation now ship under one Web version.",
  },
  summary: {
    zh: "整合此前各模块为成熟 Web 的统一版本；此前为模块化开发期，原始版本号（有机酸 V3.9.x / 数据库 V2.2 / 气体 v2.1 等）见下方历史沿革，一律未改。自 v1.0.0 起，每次发布只列出本次有更新的模块。",
    en: "Integrates the previously separate modules into one mature Web version. Earlier work was the modular-development era; original module version numbers (Organic Acid V3.9.x, Database V2.2, Gas v2.1, ...) are preserved unchanged in the history below. From v1.0.0, each release lists only the modules it changed.",
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
        zh: "成熟 Web 体验：统一版本、按模块讲能力、收敛的研究报告与交互可视化。",
        en: "Mature Web experience: unified versioning, module-first capabilities, focused reports, interactive visuals.",
      },
      changes: [
        { zh: "统一 Web 版本号 + 二级（分模块）更新日志，历史散版收进折叠区。", en: "Single Web version + secondary per-module changelog; legacy versions folded into a collapsed history." },
        { zh: "首页能力区改为按模块讲能力（EcoScreen / MOF Library / Organic Acid / GasSep）。", en: "Homepage capabilities restated module-by-module (EcoScreen / MOF Library / Organic Acid / GasSep)." },
        { zh: "研究报告收敛为候选/筛选子 tab + 四块紧凑叙事。", en: "Research reports converged into candidate/round sub-tabs with a four-block compact narrative." },
        { zh: "首页新增可交互 3D MOF 描述符散点图（移动端降级为 2D）。", en: "Added an interactive 3D MOF descriptor scatter on the homepage (2D fallback on mobile)." },
      ],
    },
  },
}

// v1.0.2: interaction, GasSep, MOF Library, and localization maintenance.
const V1_0_2_RELEASE = {
  appVersion: "v1.0.2",
  date: GENERATED_AT,
  stage: "unified-platform",
  headline: {
    zh: "v1.0.2：首页动态图、GasSep 数据联动、MOF Library 浏览体验与全局汉化审查。",
    en: "v1.0.2: homepage interactive charts, GasSep data linkage, MOF Library browsing experience, and global localization audit.",
  },
  summary: {
    zh: "继续沿用 v1.0.2，不改 Organic Acid 排名算法、底层评分或源数据：修复首页入口按钮的玻璃反光异常，保留真实数据驱动的首页统计分布、金属筛选和相关性动态图；GasSep 候选排序、对比、验证队列与方法说明改为随气体对、筛选漏斗和字段覆盖实时变化；MOF Library 浏览区展示结构、气体与身份映射覆盖；新增高频界面汉化审查，覆盖中英文、深浅色和移动端。",
    en: "v1.0.2 continues without changing Organic Acid ranking algorithms, scores, or source data: fixed the homepage entry-button glare, kept real-data-driven homepage distribution, metal filtering, and correlation visuals; made GasSep ranking, comparison, validation queue, and method context update from the selected gas pair, funnel, and field coverage; shows structure, gas, and identity-link coverage in the MOF Library; and adds high-traffic localization QA across Chinese/English, light/dark, and mobile.",
  },
  modules: {
    ui: {
      summary: {
        zh: "首页入口按钮、真实数据图表、移动端展示和全局中文文案审查。",
        en: "Homepage entry buttons, real-data charts, mobile presentation, and global Chinese localization QA.",
      },
      changes: [
        { zh: "统一数字、版本号、指标、计数、步骤号与表格数值的显示风格；化学式继续使用独立的专业排版。", en: "Unifies the display style for numbers, versions, metrics, counts, step labels, and table values, while chemistry formulas keep dedicated scientific typography." },
        { zh: "建立统一 Web 版本来源，当前 Web 徽章显示 Web v1.0.2；历史 V3.x / 数据集 v2.x 版本按模块历史原样保留。", en: "Adds a unified Web version source; current Web badges show Web v1.0.2 while historical V3.x / dataset v2.x labels remain unchanged in module history." },
        { zh: "首页 MOF 描述符三维分布改用更大的 CoRE/QMOF 样本，补充轴刻度、真实值悬停、金属 / 数据等级着色切换和孔径点大小图例。", en: "The homepage MOF descriptor 3D view now uses a larger CoRE/QMOF sample with axis ticks, real-value hover, metal / data-grade color modes, and pore-size point-size legend." },
        { zh: "首页新增气体分离帕累托图，基于同时具备选择性与工作容量的真实记录，按气对切换并标注 IAST/实验/计算覆盖。", en: "Added a homepage gas-separation Pareto chart from real records that have both selectivity and working capacity, with gas-pair switching and IAST/experimental/computed coverage." },
        { zh: "首页入口按钮去掉异常玻璃折射和蓝色实心态，改为中性按钮、清晰 hover 反馈和更稳定的移动端布局。", en: "Removed abnormal glass refraction and blue filled state from homepage entry buttons, replacing them with neutral buttons, clear hover feedback, and steadier mobile layout." },
        { zh: "首页相关性图从密集矩阵改为可点击相关性网络，边宽由 Pearson |r| 决定，节点、说明和排行全部来自当前筛选数据。", en: "Reworked the homepage correlation chart from a dense matrix into an interactive network where edge width is driven by Pearson |r| and nodes, notes, and ranking all come from the current filtered data." },
        { zh: "新增高频界面汉化审查，拒绝中文模式下的机械式中英拼接；保留 CRITIC、Hybrid、IAST 等必要算法名。", en: "Added high-traffic localization QA that rejects machine-like mixed Chinese/English labels in Chinese mode while preserving necessary terms such as CRITIC, Hybrid, and IAST." },
      ],
    },
    gasSep: {
      summary: {
        zh: "气体筛选从静态概览改为数据联动工作台。",
        en: "GasSep now behaves as a data-linked screening workbench instead of a static overview.",
      },
      changes: [
        { zh: "保留 Pareto + APS、APS×R%、CRITIC 和历史 GasScore 的方法依据，但所有候选排序、漏斗、对比和解释面板都随当前气体对与筛选结果实时更新。", en: "Kept Pareto + APS, APS×R%, CRITIC, and Legacy GasScore method context while ensuring ranking, funnel, comparison, and explanation panels update from the current gas pair and filtered rows." },
        { zh: "候选材料排序表改为紧凑列 + 单行展开详情，解决过多字段同时展开导致的拥挤、换行和可读性问题。", en: "Converted the candidate ranking table to compact columns with single-row expandable details, fixing overcrowding, wrapping, and readability issues from too many always-visible fields." },
        { zh: "移除无数据联动意义的概览卡和固定验证路线，改为由字段覆盖、Pareto 前沿、当前候选和筛选漏斗生成的验证队列。", en: "Removed non-data-linked overview cards and fixed validation roadmap, replacing them with a validation queue generated from field coverage, Pareto frontier, selected candidate, and funnel state." },
        { zh: "中英文、深浅色主题和移动端单列布局均保持可读；方法卡、筛选漏斗和性能图保持可交互。", en: "Chinese/English copy, light/dark themes, and the mobile single-column layout remain readable; method cards, funnel, and performance map remain interactive." },
      ],
    },
    database: {
      summary: {
        zh: "MOF Library 统一浏览器更聚焦结构、气体与身份映射覆盖。",
        en: "MOF Library unified browsing now focuses on structure, gas, and identity-link coverage.",
      },
      changes: [
        { zh: "统一 MOF 浏览器集中展示结构记录、气体吸附记录和身份映射数量，用户展开后可进行跨数据检索。", en: "The unified MOF browser highlights structure records, gas adsorption records, and identity links, then lets users search across linked datasets after opening it." },
        { zh: "候选库顶部状态从大提示框改为轻量状态条，保留 Open MOF Seed、记录数和来源说明。", en: "The library header status changed from large callouts to a lightweight status strip that keeps Open MOF Seed, record counts, and source context visible." },
        { zh: "数据库索引提示和候选对比字段同步汉化，避免候选库中文模式出现明显英文残留。", en: "Localized database-index prompts and candidate-comparison fields to avoid obvious English remnants in Chinese mode." },
      ],
    },
  },
}

// v1.0.1: presentation-layer cleanup release.
const V1_0_1_RELEASE = {
  appVersion: "v1.0.1",
  date: "2026-06-29",
  stage: "unified-platform",
  headline: {
    zh: "体验打磨：全站字体统一、修掉旧版本区块、修复首页 3D 散点。",
    en: "Experience polish: site-wide font unification, legacy version block removed, homepage 3D scatter fixed.",
  },
  summary: {
    zh: "纯呈现层维护，不改算法/分数/数据：统一字体 token，数字归一为同一 sans 字族并 tabular-nums 对齐；衬线仅保留给化学式；移除与 Web v1.0.0 矛盾的旧版本区块；修复 3D 描述符散点的切顶、挤团与空白。",
    en: "Presentation-only maintenance with no algorithm/score/data changes: unified font tokens with numbers on one sans family (tabular-nums), serif reserved for chemistry formulas, removal of the legacy version block that conflicted with Web v1.0.0, and fixes to the 3D descriptor scatter (clipping, clustering, empty space).",
  },
  modules: {
    ui: {
      summary: {
        zh: "字体统一 + 版本区块修复 + 3D 散点修复。",
        en: "Font unification + version-block fix + 3D scatter fix.",
      },
      changes: [
        { zh: "建立字体 token（--font-body / --font-formula）：所有文本与数字用同一 sans 字族，数字以 tabular-nums 对齐，不再用固定宽度数字字体。", en: "Added font tokens (--font-body / --font-formula): all text and numbers share one sans family with tabular-nums; decorative fixed-width numerals removed." },
        { zh: "衬线仅保留给化学式 / 数学公式；清除散落的旧式 sans 与 ad-hoc 固定宽度字体。", en: "Serif reserved for chemistry / math formulas only; scattered legacy sans and ad-hoc fixed-width declarations removed." },
        { zh: "移除首页与 Web v1.0.0 矛盾的「近期进展 V3.4–V3.6」区块，旧版只在折叠的 pre-1.0 历史中出现。", en: "Removed the homepage 'Recent Progress V3.4–V3.6' block that conflicted with Web v1.0.0; legacy versions stay in the collapsed pre-1.0 history." },
        { zh: "修复 3D 描述符散点：标题不再切顶，按数据自适应填满视图（不再挤团/留白），新增方向指示器。", en: "Fixed the 3D descriptor scatter: title no longer clipped, data auto-fits to fill the view (no clustering/empty space), added an orientation gizmo." },
      ],
    },
  },
}

async function main() {
  const releaseLogPath = path.join(DATA_DIR, "app_release_log.json")
  const existingReleaseLog = await fs.readFile(releaseLogPath, "utf8")
    .then(content => JSON.parse(content))
    .catch(() => null)
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

  const authoredReleases = [V1_0_2_RELEASE, V1_0_1_RELEASE, V1_RELEASE]
  const authoredVersions = new Set(authoredReleases.map(release => release.appVersion))
  const preservedNewerReleases = (existingReleaseLog?.releases || [])
    .filter(release => !authoredVersions.has(release.appVersion))
  const releaseWeight = value => String(value || "")
    .replace(/^v/i, "")
    .split(".")
    .reduce((sum, part) => sum * 1000 + (Number(part) || 0), 0)
  const releases = [...preservedNewerReleases, ...authoredReleases]
    .sort((left, right) => releaseWeight(right.appVersion) - releaseWeight(left.appVersion))
  const payload = {
    schemaVersion: "1.0",
    currentAppVersion: releases[0].appVersion,
    generatedAt: existingReleaseLog?.generatedAt || GENERATED_AT,
    authority:
      "Single unified EcoMOF-AI Web release log. One Web version manages the whole platform; each release lists only the modules it changed. Historical module version numbers are preserved verbatim in history (pre-1.0 modular-development era).",
    provenance: {
      derivedFrom: "public/data/version_evolution_records.json",
      generatingScript: "scripts/build-app-release-log.mjs",
      note:
        "v1.0.0 module changes are authored from the integration work in this release; history is regrouped by module from existing per-module impact fields without altering any original version number.",
    },
    ...(existingReleaseLog?.developmentLog ? { developmentLog: existingReleaseLog.developmentLog } : {}),
    ...(existingReleaseLog?.previousDevelopmentLog ? { previousDevelopmentLog: existingReleaseLog.previousDevelopmentLog } : {}),
    moduleCatalog: {
      ...MODULE_CATALOG,
      ...(existingReleaseLog?.moduleCatalog || {}),
    },
    releases,
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
    releaseLogPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  )
  const counts = Object.entries(historyByModule)
    .map(([key, rows]) => `${key}=${rows.length}`)
    .join(", ")
  console.log(`Wrote app_release_log.json · ${payload.currentAppVersion} + history (${counts})`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
