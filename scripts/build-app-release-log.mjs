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
const GENERATED_AT = process.env.ECOMOF_RETRIEVED_AT || "2026-08-13"

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
  dataCompliance: {
    label: { zh: "数据合规承诺", en: "Data Compliance" },
    blurb: {
      zh: "逐来源许可、授权凭证、责任边界与停止条件。",
      en: "Source-specific licences, authorization evidence, responsibilities, and stop conditions.",
    },
    target: "dataCompliance",
    hash: "database-compliance",
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

const RECENT_RELEASES = [
  {
    appVersion: "v1.0.14",
    date: "2026-08-13",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.14：建立全局研究导航与独立页面，收敛方法论配色，并将更新日志拆为独立版本记录页。",
      en: "v1.0.14: adds global research navigation and independent pages, neutralizes Methodology styling, and moves the changelog to a dedicated release-history page.",
    },
    summary: {
      zh: "本轮将总览、研究、数据、方法与验证、项目、关于重组为无底框的文字导航和全宽二级索引；研究宪章、催化文献核验、有机酸研究、算法验证、数据质量、MOF 记录和 DOI 文献记录均成为可直接访问的页面；方法论以黑色文字和中性选中态为主，删除面向用户的内部阶段标签；更新日志从项目演化页独立出来，并补充手机与 iPad 响应式检查。",
      en: "This release reorganizes Overview, Research, Data, Methods and Validation, Project, and About into an unframed text navigation with full-width secondary indexes. The Research Charter, Catalysis Literature Verification, Organic Acid Research, Algorithm Validation, Data Quality, MOF Record, and DOI Literature Record are directly addressable pages. Methodology now uses black-first typography and neutral selected states, removes user-facing internal phase labels, and moves the changelog out of Project Evolution with phone and iPad responsive checks.",
    },
    modules: {
      ui: {
        summary: {
          zh: "导航、独立页面与跨尺寸布局改为更直接的研究信息架构。",
          en: "Navigation, independent pages, and cross-device layouts now use a more direct research information architecture.",
        },
        changes: [
          { zh: "一级导航改为无底框文字栏，二级菜单改为全宽、分组式文字索引，并保留键盘关闭与焦点恢复。", en: "Replaces the framed primary rail with unframed text navigation and full-width grouped secondary indexes while retaining keyboard dismissal and focus restoration." },
          { zh: "将研究宪章及六个高优先级研究、数据和验证入口注册为独立可访问页面，旧链接继续兼容。", en: "Registers the Research Charter and six high-priority research, data, and validation destinations as independent pages while preserving legacy links." },
          { zh: "补充手机、iPad 竖屏与 iPad 横屏检查，限制长标题、导航、方法目录和更新日志的横向溢出。", en: "Adds phone, iPad portrait, and iPad landscape checks that guard long headings, navigation, methodology directories, and changelog content against horizontal overflow." },
        ],
      },
      validation: {
        summary: {
          zh: "方法论以中性文字层级为主，并清理内部阶段标签。",
          en: "Methodology now uses a neutral typographic hierarchy and removes internal phase labels from public copy.",
        },
        changes: [
          { zh: "方法论组件建立独立中性主题映射：正文、标题、步骤号和选中态以黑色为主，蓝色只保留给必要链接或数据系列。", en: "Adds a neutral Methodology theme mapping so body copy, headings, steps, and selected states are black-first, reserving blue for necessary links or data series." },
          { zh: "删除候选文献检索中的内部阶段标签，保留实际检索、隔离、人工核对和写入门禁逻辑。", en: "Removes visible internal phase labels from literature discovery while retaining retrieval, quarantine, human review, and admission-gate behavior." },
          { zh: "修复首页验证链指标与选中节点边框相交的问题，指标回到正常文档流，交互不再横向跳动。", en: "Fixes the homepage validation-chain metric intersecting selected-node borders by returning it to normal flow and removing lateral selection movement." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "发布记录成为独立、可扫读且数据驱动的更新日志。",
          en: "Release records now form an independent, scannable, data-driven changelog.",
        },
        changes: [
          { zh: "新增独立更新日志页面，采用版本与日期在左、完整更新内容在右的简单文字排版。", en: "Adds a dedicated changelog page with version and date on the left and complete release content on the right." },
          { zh: "项目演化页保留状态、演化图、模块历史与路线图，不再重复渲染完整发布日志。", en: "Keeps status, evolution charts, module history, and roadmap in Project Evolution without duplicating the full release log." },
          { zh: "更新日志继续读取统一发布数据，版本号、页头徽章和版本记录保持同源。", en: "Keeps the changelog on the unified release data source so version labels, header badges, and release records remain synchronized." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.13",
    date: "2026-07-30",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.13：首页转为连续研究画布，方法论恢复文献来源并逐项补全执行细节。",
      en: "v1.0.13: turns the homepage into a continuous research canvas and restores literature-backed, item-level methodology detail.",
    },
    summary: {
      zh: "本轮弱化首页外层区块和内部卡片的边界、缩短区块间距，并统一将文本按钮、筛选项和状态标签迁移到紧凑小圆角形态；方法论删除 GitHub 开放协作横幅，恢复 34 条文献灵感来源及六类采用边界，目录改为研究流程顺序，同时为每个方法分项补充研究目的、输入资格、执行状态、结果呈现、停止条件、字段审计与界面行为。",
      en: "This release softens homepage section and card boundaries, shortens section spacing, and moves text buttons, filters, and status labels to compact-corner geometry. Methodology removes the GitHub collaboration banner, restores 34 literature-inspiration sources across six adoption-boundary categories, reorders the directory by research flow, and adds purpose, eligibility, execution state, presentation, stopping conditions, field audit, and UI behaviour to every method item.",
    },
    modules: {
      ui: {
        summary: {
          zh: "首页区块连续化，并建立全站紧凑小圆角控件规范。",
          en: "Homepage sections now read continuously under a site-wide compact-corner control rule.",
        },
        changes: [
          { zh: "首页主要区块移除外层实体边框和阴影，内层卡片边界降至低对比度，缩短首屏到数据基础之间的空白。", en: "Removes solid outer borders and shadows from homepage stages, lowers inner-card contrast, and shortens the gap from the hero to Data Foundation." },
          { zh: "文本按钮、筛选项、状态标签和标签式计数统一使用 6 px 紧凑圆角；数据点、步骤圆点与进度轨道保留语义形状。", en: "Uses compact 6 px corners for text buttons, filters, status labels, and count tags while preserving semantic data marks, step circles, and progress tracks." },
          { zh: "方法目录改为扁平左导轨，使用 01–10 顺序号、低边框层级和可拉伸宽度，当前项仍保持清晰反馈。", en: "Rebuilds the methods directory as a flat left rail with 01–10 numbering, low-border hierarchy, resizable width, and clear active feedback." },
        ],
      },
      validation: {
        summary: {
          zh: "方法论从概览说明扩展为逐项可审查的实现文件。",
          en: "Methodology expands from summaries into item-level reviewable implementation documentation.",
        },
        changes: [
          { zh: "所有方法分组新增研究目的、输入与进入条件、执行顺序和中间状态、页面呈现、核查依据与停止条件五段说明。", en: "Adds five detailed notes to every method group: purpose, input and entry criteria, execution and intermediate state, presentation, and review/stop conditions." },
          { zh: "各模块架构条目补充执行链、字段分层审计和页面状态逻辑，明确加载、空态、仅浏览、可计算与阻断状态。", en: "Adds execution chain, layered field audit, and UI-state logic to each architecture item, distinguishing loading, empty, browse-only, computable, and blocked states." },
          { zh: "每个算法步骤补充身份、单位和来源前置约束；缺失或冲突状态停止向正式结果传递。", en: "Adds identity, unit, and provenance preconditions to every algorithm step so missing or conflicting states do not propagate into formal results." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "统一版本中心新增 v1.0.13，记录本轮首页与方法论重构。",
          en: "The unified release center adds v1.0.13 for the homepage and methodology revision.",
        },
        changes: [
          { zh: "恢复文献灵感来源：读取 34 条来源、六个分类及原文链接，并在方法目录中置于共享证据之后、限制与验证之前。", en: "Restores 34 literature-inspiration records, six categories, and source links, positioned after Shared Evidence and before Limitations and Validation." },
          { zh: "删除“把方法写清楚，方便别人核对”及 GitHub 仓库横幅，不再用宣言代替方法内容。", en: "Removes the methods-review declaration and GitHub repository banner so substantive method content leads the page." },
          { zh: "本轮只建立本地提交，不推送、不部署，也不把本地预览描述为公开版本。", en: "This release creates a local commit only, with no push, deployment, or claim of a public update." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.12",
    date: "2026-07-29",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.12：补全全站方法实现说明，并将数据合规页改为原文优先的编号式文件。",
      en: "v1.0.12: documents implementation architecture across the platform and recasts data compliance as a numbered, source-first document.",
    },
    summary: {
      zh: "本轮补全 MOF 库、生态筛选、气体分离、催化、有机酸、字段级溯源和验证路线的实现架构，明确各模块的数据输入、索引、算法、输出与停止条件；数据合规页删除六步控制图、内部等宽编号和表格，改为 1、1.1、1.1.1 的阅读结构，以发布方许可、免责声明和原文链接为主，同时保留来源登记与筛选。",
      en: "This release documents implementation architecture for the MOF Library, EcoScreen, Gas Separation, Catalysis, Organic Acid, field-level provenance, and validation, including inputs, indexes, algorithms, outputs, and stopping conditions. The compliance page removes the six-step diagram, internal monospace codes, and tables in favour of hierarchical numbering centred on publisher licences, disclaimers, and source links, while retaining the source registry and filters.",
    },
    modules: {
      validation: {
        summary: {
          zh: "方法论从流程概览扩展为可核对的模块实现说明。",
          en: "Methodology expands from workflow summaries to reviewable module implementation documentation.",
        },
        changes: [
          { zh: "新增来源、索引、标准化和任务派生四层数据库架构，说明不同数据库为何分层保存、何时允许连接。", en: "Adds a four-layer source, index, normalization, and task-derivative architecture explaining why databases remain separate and when joins are permitted." },
          { zh: "逐项补全名称与标识符索引、CoRE 性质索引、结构目录、CRITIC、IAST、Qst、反应路径图、经验贝叶斯丰度校正和 HGCPS 的实现边界。", en: "Documents implementation boundaries for identity and CoRE indexes, structure catalogues, CRITIC, IAST, Qst, pathway graphs, empirical-Bayes abundance correction, and HGCPS." },
          { zh: "每个功能统一说明何时触发、怎样处理、得到什么以及不能越过的边界，缺失字段不再由概括性流程掩盖。", en: "Every function now states its trigger, processing, output, and guard so missing fields are not hidden by generic workflow prose." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "合规页改为发布方原文优先的编号式责任与免责声明文件。",
          en: "Compliance becomes a numbered responsibilities and disclaimer document led by publisher sources.",
        },
        changes: [
          { zh: "删除六步控制流程图、CONTROL/CCDC 内部代码和全部表格，统一使用 1、1.1、1.1.1 分层编号。", en: "Removes the six-step control diagram, CONTROL/CCDC internal codes, and all tables, using hierarchical 1, 1.1, and 1.1.1 numbering instead." },
          { zh: "重写概括式文案，直接区分 CSD MOF Collection、modified CIF、unmodified CIF 与完整付费 CSD 的许可边界。", en: "Rewrites generic copy to distinguish the licence boundaries of the CSD MOF Collection, modified CIFs, unmodified CIFs, and the full paid CSD." },
          { zh: "43 项适用控制内容继续完整保留，但以自然语言标题、原文位置和发布方链接展示；来源登记功能及状态筛选不变。", en: "Retains all 43 applicable controls through natural-language headings, source locations, and publisher links, while preserving source registration and status filters." },
        ],
      },
      ui: {
        summary: {
          zh: "方法与合规长页面的阅读层级和窄屏呈现更清楚。",
          en: "Long methodology and compliance pages now have clearer hierarchy and compact layouts.",
        },
        changes: [
          { zh: "方法目录新增各模块“实现方式与架构”入口，桌面端继续支持 220–440 px 拖动调宽。", en: "Adds an Implementation and Architecture destination for each module while retaining the 220–440 px resizable desktop directory." },
          { zh: "原实现逻辑表格改为纵向编号说明，避免在长文本和窄屏中形成难以阅读的横向网格。", en: "Replaces the implementation-logic table with numbered vertical explanations for long copy and compact screens." },
          { zh: "移动端回到单列目录与正文，不显示桌面拖动柄，也不产生横向溢出。", en: "Compact screens use a single-column directory and body with no desktop resize handle or horizontal overflow." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "统一版本中心新增 v1.0.12，单独记录本轮方法论与合规重构。",
          en: "The unified release center adds v1.0.12 for this methodology and compliance revision.",
        },
        changes: [
          { zh: "版本选择器、当前徽章和模块更新统一读取 v1.0.12。", en: "The version selector, current badge, and module updates now read v1.0.12." },
          { zh: "开发日志只登记实际完成并通过检查的架构说明、编号式合规文件和响应式调整。", en: "The development log records only the completed and checked architecture documentation, numbered compliance document, and responsive changes." },
          { zh: "本轮仍只创建本地提交，不推送、不部署，也不宣称公开页面已经更新。", en: "This release remains a local commit only, with no push, deployment, or claim that the public site has changed." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.11",
    date: "2026-07-29",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.11：扩展 MOF 身份检索，固定弹窗操作区，并以现行 V3.9.10 重构方法论。",
      en: "v1.0.11: expands MOF identity search, fixes modal controls in place, and rebuilds methodology around current V3.9.10 rules.",
    },
    summary: {
      zh: "本轮将 MOF 库从单一 CoRE 性质索引扩展为“性质记录 + 名称／文献身份”双层检索：合规登记 MOF Anatomy 185 条事实性身份记录，并在缺少可授权结构或性质时展示 DOI、CCDC 号和明确缺失原因；全局长内容弹窗的关闭按钮固定在容器顶部；方法论移除已废止的旧模块，以可拉伸目录、左公式右交互敏感性图、逐功能实现逻辑和现行 V3.9.10 丰度中性 HGCPS 完整重构。",
      en: "This release extends the MOF Library from a CoRE-only property index to two-layer property plus name/literature identity search. It registers 185 factual MOF Anatomy identities under a conservative rights boundary and shows DOI, CCDC number, and explicit gap reasons where no licensed structure or property is available. Long-content dialogs keep their close controls fixed at the top. Methodology removes the obsolete module and is rebuilt with a resizable directory, formula-plus-interactive sensitivity layouts, per-function implementation logic, and the current abundance-neutral V3.9.10 HGCPS.",
    },
    modules: {
      database: {
        summary: {
          zh: "名称与文献身份覆盖扩展到 MOF Anatomy 目录，同时保持物化性质严格标识符连接。",
          en: "Name and literature identity coverage now includes the MOF Anatomy directory while physicochemical values retain exact-identifier linking.",
        },
        changes: [
          { zh: "生成 185 条 MOF Anatomy 事实性身份索引，其中 185 条含原论文入口、175 条含 CCDC 号；不复制图片、XYZ 或整理后结构。", en: "Builds a 185-record factual MOF Anatomy identity index with 185 source-paper links and 175 CCDC numbers, without copying images, XYZ, or cleaned structures." },
          { zh: "物化性质搜索新增确认按钮，可按名称、别名、CSD Refcode、CCDC 号和 DOI 查询，并消除系统蓝色焦点外框。", en: "Adds explicit property-search confirmation across names, aliases, CSD Refcodes, CCDC numbers, and DOIs, while removing the browser-blue focus frame." },
          { zh: "DUT‑68 等仅有身份映射的材料显示论文、CCDC 与缺失原因；NTU‑68 等独立整理条目继续进入同一回退逻辑，不按相似名称猜测数值。", en: "Identity-only materials such as DUT-68 show paper, CCDC, and gap reasons; independently curated entries such as NTU-68 use the same fallback without similarity-based value inference." },
        ],
      },
      validation: {
        summary: {
          zh: "方法论以当前数据产物和锁定规则为唯一事实源，并补齐交互解释与逐功能执行链。",
          en: "Methodology now uses current artifacts and locked rules as its sole truth source, with interactive explanations and per-function execution chains.",
        },
        changes: [
          { zh: "删除废止的方法模块和旧版有机酸叙述，改为 V3.9.10 八因子加权几何 HGCPS、丰度中性收缩与审计边界。", en: "Removes the obsolete method module and superseded Organic Acid narrative in favor of V3.9.10 eight-factor weighted-geometric HGCPS, abundance-neutral shrinkage, and audit boundaries." },
          { zh: "所有含公式的方法组采用左公式、右可调敏感性图，下方继续展示算法步骤、输入输出、来源、限制和实现逻辑。", en: "Formula-bearing method groups now pair formulas on the left with adjustable sensitivity plots on the right, followed by steps, inputs/outputs, sources, limits, and implementation logic." },
          { zh: "有机酸因子、示例路线、派生层级和记录数直接读取 V3.9.10 生成产物，不硬编码排名结论。", en: "Organic Acid factors, example route, derivation levels, and record counts are read from V3.9.10 artifacts rather than hardcoded ranking claims." },
        ],
      },
      ui: {
        summary: {
          zh: "长弹窗操作区和方法目录交互更稳定。",
          en: "Long-dialog controls and methodology navigation are more stable.",
        },
        changes: [
          { zh: "字段来源、物化性质、声明、联系、致谢和有机酸抽屉的关闭按钮固定在容器顶部，内容下滑时保持可见。", en: "Keeps close controls fixed at the top of provenance, properties, disclaimer, contact, acknowledgements, and Organic Acid drawers while their content scrolls." },
          { zh: "方法目录支持桌面端拖动调整 220–440 px 宽度，窄屏保持单列目录。", en: "Makes the desktop methods directory resizable from 220–440 px while retaining the compact single-column mobile layout." },
          { zh: "方法论顶部新增开放协作说明，明确开源展示不取消来源许可、数据责任和科研验证义务。", en: "Adds an open-collaboration statement clarifying that open implementation does not remove licensing, data-governance, or scientific-validation duties." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "新增 MOF Anatomy 的限制性来源登记、授权缺口与禁止复制边界。",
          en: "Adds a restricted MOF Anatomy source record, authorization gap, and no-copy boundary.",
        },
        changes: [
          { zh: "合规页新增 MOF Anatomy 授权凭证／缺口、官方说明入口和数据集处理记录，明确未发现站点统一再利用许可。", en: "Adds a MOF Anatomy authorization/gap record, official project link, and dataset handling record, explicitly noting that no site-wide reuse licence was located." },
          { zh: "只使用名称、年份、分类、DOI 与 CCDC 号等事实性元数据；站点图片、结构文件、页面文案和视觉设计不进入仓库。", en: "Uses factual metadata such as name, year, class, DOI, and CCDC number only; site images, structure files, page prose, and visual design do not enter the repository." },
          { zh: "搜索缺失回退与来源登记共用同一约束：未经独立许可和精确标识符，不把目录身份记录转写为结构或物化性质。", en: "Search fallback and source registration share one guard: without independent permission and an exact identifier, directory identities are not converted into structures or physicochemical properties." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "统一版本中心新增 v1.0.11 并记录本轮真实完成范围。",
          en: "The unified release center adds v1.0.11 with the actual completed scope.",
        },
        changes: [
          { zh: "版本选择器、当前徽章、模块更新与开发日志统一读取 v1.0.11。", en: "The version selector, current badge, module updates, and development log now read v1.0.11." },
          { zh: "本轮只创建本地提交，不推送或宣称公开部署。", en: "This release is committed locally only, without push or public-deployment claims." },
          { zh: "pre‑1.0 历史沿革继续按原始模块版本展示，既有 38 条历史记录保持可读且不重编号。", en: "The pre-1.0 history remains grouped by original module versions; all 38 existing history records stay readable and unrenumbered." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.10",
    date: "2026-07-29",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.10：接入 MOF 物化性质检索，重构导航、生态筛选确认逻辑与数据合规页面。",
      en: "v1.0.10: adds MOF physicochemical-property search and rebuilds navigation, EcoScreen confirmation logic, and data compliance.",
    },
    summary: {
      zh: "本轮按非商业研究边界接入 CoRE MOF 2024 CR 主性质层，并以 FAIR‑MOFs 的 CSD Refcode 完全一致记录作独立交叉证据；首页改为上三下三六入口，语言、主题和联系方式收纳到设置菜单；生态筛选只在确认材料后显示计算内容；MOF 库同步提供性质查询和结构侧栏；合规页删除非授权控制卡和 QMOF 展示，以 43 条条文、9 项授权凭证、来源登记和发布方原文链接构成正式说明。",
      en: "Under a non-commercial research boundary, this release adds the CoRE MOF 2024 CR primary property layer with exact CSD-Refcode FAIR-MOFs records as independent cross-evidence; changes the homepage to a six-entry three-by-two grid; collects language, theme, and contact controls in one settings menu; reveals EcoScreen calculations only after material confirmation; exposes property search in the MOF Library and structure sidebar; and replaces the non-authorizing control card and QMOF display with a formal compliance statement containing 43 clauses, 9 authorization records, source registration, and publisher-original links.",
    },
    modules: {
      ui: {
        summary: {
          zh: "首页、主导航和全局设置按统一的实体控件与中文居中规则重排。",
          en: "Reorganizes the homepage, primary navigation, and global settings with consistent solid controls and centered Chinese labels.",
        },
        changes: [
          { zh: "首页六个实体入口固定为“生态筛选、气体分离、催化、MOF库、数据合规承诺、联系我们”，桌面端上三下三排列。", en: "Fixes six solid homepage entries—EcoScreen, Gas Separation, Catalysis, MOF Library, Data Compliance, and Contact—in a desktop three-by-two grid." },
          { zh: "语言切换、深浅色模式和联系我们合并到单一齿轮设置菜单；邮箱只在联系弹窗中显示。", en: "Collects language, light/dark appearance, and Contact Us inside one gear settings menu; the email remains visible only in the contact dialog." },
          { zh: "桌面导航改为左右等宽轨道和固定中央栏，解决中文模式下导航整体偏移。", en: "Uses equal outer tracks and a fixed central rail to remove the Chinese-mode navigation offset." },
          { zh: "数据基础段落减弱上边框并补充过渡留白，保持与现有冷蓝研究界面的设计语言一致。", en: "Softens the data-foundation top border and adds transition space while retaining the existing cool-blue research design language." },
        ],
      },
      ecoScreen: {
        summary: {
          zh: "材料确认成为计算结果出现的明确前置条件，并新增同一材料的物化性质弹窗。",
          en: "Makes material confirmation an explicit prerequisite for calculations and adds a physicochemical-property dialog for the same material.",
        },
        changes: [
          { zh: "移除默认 UiO‑66 已计算假象；搜索框未确认时只显示待确认空状态，不预先渲染材料、公式或结论。", en: "Removes the precomputed UiO-66 illusion; before search confirmation, only an awaiting-confirmation state is shown, without material, formula, or conclusion content." },
          { zh: "在搜索确认区新增“查看物化性质”，只有确认有效 MOF 后才能打开，并提供显式关闭、Esc 和背景关闭。", en: "Adds View Physicochemical Properties to the confirmation bar, enabled only for a confirmed MOF, with explicit close, Escape, and backdrop dismissal." },
          { zh: "确认后的材料选择、物化档案与生态筛选计算共享同一条记录，修改输入会清除旧确认状态。", en: "The confirmed material, property record, and EcoScreen calculation share one record; editing the query clears the previous confirmation." },
        ],
      },
      database: {
        summary: {
          zh: "以 CoRE 主值和 FAIR 严格交叉层扩展 MOF 物化性质覆盖，并同步到 MOF 库。",
          en: "Expands MOF physicochemical-property coverage with CoRE primary values and a strict FAIR cross-layer, surfaced throughout the MOF Library.",
        },
        changes: [
          { zh: "建立 9,835 条 CoRE MOF 2024 CSD‑modified CR 物化索引，提供比表面积、孔体积、PLD、LCD、密度和空隙率。", en: "Builds a 9,835-record CoRE MOF 2024 CSD-modified CR physicochemical index with surface area, pore volume, PLD, LCD, density, and void fraction." },
          { zh: "审计 FAIR‑MOFs 37,452 条孔隙记录，仅保留 3,451 条与当前 CoRE 结构 CSD Refcode 完全一致的交叉记录，不进行模糊合并。", en: "Audits 37,452 FAIR-MOFs porosity records and retains only 3,451 exact CSD-Refcode cross-records against the current CoRE corpus, with no fuzzy merge." },
          { zh: "MOF 库结构工作台上方新增物化性质搜索，结构侧栏同步显示当前材料的六项 CoRE 主值和 FAIR 精确匹配状态。", en: "Adds physicochemical-property search above the MOF Library structure workbench and shows six CoRE primary values plus exact FAIR match status in the structure sidebar." },
          { zh: "删除“身份层与材料档案 / 数据库联通状态”展示模块，避免把覆盖统计包装成材料性质结论。", en: "Removes the Identity Layer / Database Linkage presentation block so coverage statistics are not presented as material-property conclusions." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "以非商业用途、逐来源许可和可核验原文为中心重新组织责任页面。",
          en: "Reorganizes the responsibility page around non-commercial use, source-specific licences, and verifiable primary terms.",
        },
        changes: [
          { zh: "保留并逐项列示 43 条适用条文、9 项授权凭证或缺口、六步使用核验、来源登记和争议响应程序。", en: "Retains and itemizes 43 applicable clauses, 9 authorization records or gaps, the six-step use review, source registration, and dispute-response procedure." },
          { zh: "删除 ECOMOF‑DCP‑001 非授权控制卡和 QMOF 展示，不以内部编号模拟权利人授权文件。", en: "Removes the ECOMOF-DCP-001 non-authorizing control card and QMOF display so an internal identifier cannot resemble a rightsholder authorization." },
          { zh: "登记 CoRE 9,835 条主性质记录和 FAIR 37,452 条原始孔隙记录 / 3,451 条精确交叉记录，并明确两层许可与数值优先级。", en: "Registers the 9,835 CoRE primary-property records and 37,452 FAIR source porosity records / 3,451 exact cross-records, with explicit licence and value-precedence boundaries." },
          { zh: "删除“截至某日已完成”等时点式自我认证；所有外部条款以发布方原文为准，商业用途必须另行取得授权。", en: "Removes dated self-certification language; publisher originals govern all external terms, and commercial use requires separate authorization." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "统一版本中心完整记录本轮已完成范围，历史沿革继续保留原始模块版本。",
          en: "The unified release center records the completed scope while preserving original module versions in project history.",
        },
        changes: [
          { zh: "新增 v1.0.10 的界面、生态筛选、数据库和合规变更明细。", en: "Adds detailed v1.0.10 UI, EcoScreen, database, and compliance changes." },
          { zh: "当前版本徽章、版本选择器、模块更新区和开发日志继续读取同一发布记录。", en: "Keeps the current-version badge, selector, module update area, and development log on the same release record." },
          { zh: "pre‑1.0 历史沿革继续按原始版本号和模块归类展示，不重编号、不留空白。", en: "Continues to show pre-1.0 history by original version and module without renumbering or blank content." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.9",
    date: "2026-07-29",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.9：恢复生态筛选响应，重构数据合规承诺，并补齐首页与项目沿革。",
      en: "v1.0.9: restores EcoScreen responsiveness, rebuilds data compliance, and completes the homepage and project history.",
    },
    summary: {
      zh: "本轮集中修复会阻断使用的交互缺陷，并把合规声明改造成可审计的控制文件：生态筛选主工作区不再因旧版全量评分而卡死；首页入口按三上二下排列，联系方式仅在弹窗中显示；合规页逐项列出 43 条控制条文和 10 项授权凭证或缺口；项目演化页恢复历史沿革，并补录 v1.0.6 至 v1.0.9 的真实发布范围。",
      en: "This release fixes blocking interaction failures and turns compliance into an auditable control document: EcoScreen no longer freezes on full legacy scoring; homepage entries use a three-plus-two layout and contact details appear only in a dialog; the compliance page itemizes 43 control clauses and 10 authorization-evidence or gap records; Project Evolution restores its history and records the actual v1.0.6-v1.0.9 release scope.",
    },
    modules: {
      ui: {
        summary: {
          zh: "首页入口、联系方式与中文总述按明确的信息架构重新收敛。",
          en: "Homepage entries, contact access, and the Chinese overview are tightened into a clear information architecture.",
        },
        changes: [
          { zh: "首页五个入口固定为“生态筛选、气体分离、催化、数据合规承诺、联系我们”，桌面端按上三下二等宽排列。", en: "Fixes the five homepage entries to EcoScreen, Gas Separation, Catalysis, Data Compliance, and Contact, using an equal-width three-plus-two desktop grid." },
          { zh: "联系邮箱不再直接显示在首页；仅点击“联系我们”后在可关闭弹窗中出现。", en: "Removes the email address from the homepage and reveals it only inside the dismissible Contact dialog." },
          { zh: "首页工作区总述改为纯中文短句，桌面端保持一行、窄屏不超过两行。", en: "Rewrites the workspace overview as concise Chinese-only copy that stays on one desktop line and no more than two lines at compact widths." },
          { zh: "统一主导航和页脚中的“数据合规承诺”命名，避免同一入口出现不同名称。", en: "Standardizes the Data Compliance label across primary navigation and the footer." },
        ],
      },
      ecoScreen: {
        summary: {
          zh: "解除旧版全量评分对主界面的阻塞，同时保留可追溯的兼容工具。",
          en: "Removes legacy full-dataset scoring from the critical render path while retaining traceable compatibility tools.",
        },
        changes: [
          { zh: "旧版描述符评分、反应筛选与文献覆盖工具改为按需挂载，默认不参与生态筛选主工作区初始化。", en: "Mounts legacy descriptor scoring, reaction filters, and literature coverage only on demand so they do not initialize with the main EcoScreen workspace." },
          { zh: "兼容视图使用 96 条等距确定性样本；主工作区仍保留 9,835 条 CoRE 2024 CR 结构记录和 4,168 条合成证据的完整统计。", en: "Uses a deterministic 96-record compatibility sample while the main workspace retains complete statistics for 9,835 CoRE 2024 CR structures and 4,168 synthesis-evidence records." },
          { zh: "评分模型的候选与证据关联由重复线性查找改为映射索引，避免记录规模增长时出现平方级渲染成本。", en: "Replaces repeated linear candidate/evidence lookups with indexed maps to avoid quadratic render cost as record volume grows." },
          { zh: "兼容工具展开后继续提供反应筛选、数据质量审计和评分解释，不改变 LCA 主结论的证据门槛。", en: "Keeps reaction filtering, data-quality audit, and score explanation available after expansion without changing the evidence gates for LCA conclusions." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "把概括性承诺重构为逐条控制、逐来源凭证和明确停止条件。",
          en: "Rebuilds a general pledge into clause-level controls, source-level evidence, and explicit stop conditions.",
        },
        changes: [
          { zh: "按 CCDC、CC BY-NC-SA 4.0、CC BY 4.0、NIST/文献逐记录边界和项目自有材料分组列出 43 条适用控制条文。", en: "Itemizes 43 applicable controls grouped by CCDC, CC BY-NC-SA 4.0, CC BY 4.0, NIST/literature record-level boundaries, and project-origin materials." },
          { zh: "登记 10 项授权凭证或缺口，逐项说明授权主体、覆盖对象、原始凭证、限制条件和是否阻断。", en: "Registers 10 authorization-evidence or gap records, each stating the grantor, covered object, original evidence, limitations, and blocking status." },
          { zh: "删除“截至某日已完成合规”等自我认证表述，明确本页是项目控制说明，不是 CCDC 或其他权利人出具的授权证书。", en: "Removes dated self-certification language and states that the page is a project control statement, not a certificate issued by CCDC or another rightsholder." },
          { zh: "保留来源登记、哈希、NOTICE、数据隔离和事件响应功能，并明确这些内部证据不能替代发布方许可。", en: "Retains source registration, hashes, NOTICE files, data quarantine, and incident response while stating that internal evidence cannot replace publisher authorization." },
          { zh: "每组条文和凭证均链接发布方原文；未取得覆盖性凭证的付费 CSD、开放种子未知许可和待确认数据继续阻断。", en: "Links each clause group and evidence record to publisher originals and keeps paid CSD, unknown-licence seed data, and pending sources blocked where blanket evidence is absent." },
        ],
      },
      projectEvolution: {
        summary: {
          zh: "修复历史沿革空白，并将近期真实发布记录补回统一版本中心。",
          en: "Fixes the blank history area and restores recent actual releases to the unified release center.",
        },
        changes: [
          { zh: "将档案页样式限制到直接子级，避免内嵌历史折叠面板被 34 像素档案索引列挤成逐字换行。", en: "Scopes archive styles to direct children so the nested history panel is no longer squeezed into the 34-pixel archive index column." },
          { zh: "历史沿革默认展开，显示原始版本总数、模块条目数、版本日期和最近六条原始记录。", en: "Opens history by default and shows the original-version count, module counts, dates, and six most recent original records." },
          { zh: "补录 v1.0.6 至 v1.0.9，并保持 pre-1.0 模块版本号原样不重编号。", en: "Adds v1.0.6 through v1.0.9 while preserving pre-1.0 module version labels without renumbering." },
          { zh: "统一版本选择器、模块页签和当前更新区继续由同一发布日志生成。", en: "Keeps the version selector, module tabs, and current-update area generated from the same release log." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.8",
    date: "2026-07-28",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.8：数据合规与有机酸研究工作区的严肃化重构。",
      en: "v1.0.8: a more rigorous data-compliance and Organic Acid research-workspace redesign.",
    },
    summary: {
      zh: "重做数据合规页面和有机酸研究界面的信息层级，收敛首页入口与专业图形；保留原评分、证据和来源登记，不把视觉重构误写为新实验结论。",
      en: "Reworks the information hierarchy of Data Compliance and the Organic Acid research workspace and tightens homepage entries and scientific charts, while preserving scoring, evidence, and source registration without presenting visual changes as new experimental conclusions.",
    },
    modules: {
      organicAcid: {
        summary: {
          zh: "重排研究目标、逐步执行、分数溯源和验证就绪度，提升白盒阅读性。",
          en: "Reorganizes research objectives, stepwise execution, score provenance, and validation readiness for clearer white-box review.",
        },
        changes: [
          { zh: "有机酸工作区按研究问题、候选筛选、主客体路线和验证边界重新组织。", en: "Reorganizes the Organic Acid workspace around the research question, candidate screening, host-guest routes, and validation boundaries." },
          { zh: "统一 HGCPS 因子玫瑰图、宿主因子图和验证就绪度图的刻度、标签与解释顺序。", en: "Aligns scales, labels, and explanation order across HGCPS, host-factor, and validation-readiness charts." },
          { zh: "逐步执行链和最终结果摘要继续从同一评分与溯源构建器派生。", en: "Keeps the stepwise execution chain and final summary derived from the same scoring and provenance builders." },
          { zh: "明确高优先级实验假设与已验证结论的边界，不因界面改版提升证据等级。", en: "Keeps high-priority experimental hypotheses distinct from validated conclusions and does not raise evidence levels through interface redesign." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "建立更完整的数据合规页面骨架和来源状态说明。",
          en: "Establishes a fuller compliance-page structure and source-status explanation.",
        },
        changes: [
          { zh: "将许可摘要、用户责任、平台责任、来源登记和限制条件集中到独立合规页面。", en: "Consolidates licence summaries, user responsibilities, platform responsibilities, source registration, and limitations into a dedicated compliance page." },
          { zh: "公开区分开放许可、需要机构许可、逐记录核验和待确认来源。", en: "Separates openly licensed, institution-licensed, record-reviewed, and pending sources." },
          { zh: "保留来源登记表和外部原文入口，为后续逐条控制重构建立基础。", en: "Retains the source registry and publisher links as the basis for later clause-level controls." },
        ],
      },
      ui: {
        summary: {
          zh: "首页和研究入口减少冗余，保持现有设计语言与响应式布局。",
          en: "Reduces redundancy in homepage and research entries while retaining the design language and responsive layout.",
        },
        changes: [
          { zh: "首页工作区入口改为更紧凑的研究导航，不复制模块内部的大段说明。", en: "Makes homepage workspace entries more compact instead of duplicating long module explanations." },
          { zh: "合规与有机酸页面沿用全站颜色、边框、圆角和排版层级。", en: "Keeps compliance and Organic Acid pages aligned with site-wide colors, borders, radii, and typography." },
          { zh: "完成桌面和响应式截图对照，修正过密卡片与图表信息层级。", en: "Completes desktop and responsive comparisons and corrects overly dense cards and chart hierarchy." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.7",
    date: "2026-07-28",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.7：CSD 结构图谱、CoRE 2024 CR、FAIR-MOFs 与有机酸数据层接入。",
      en: "v1.0.7: integrates the CSD structure atlas, CoRE 2024 CR, FAIR-MOFs, and Organic Acid data layers.",
    },
    summary: {
      zh: "以可追溯来源替换旧种子数据，建立可搜索、可调整的三维结构工作台，并把 CoRE 2024 CR、FAIR-MOFs 和有机酸重跑结果接入统一数据层；无法确认许可或身份的记录继续隔离。",
      en: "Replaces legacy seed data with traceable sources, builds a searchable and resizable 3D structure workbench, and integrates CoRE 2024 CR, FAIR-MOFs, and Organic Acid rerun outputs into the shared data layer while quarantining records with unresolved licence or identity.",
    },
    modules: {
      database: {
        summary: {
          zh: "建立真实结构索引、规范名称和可交互三维结构浏览。",
          en: "Establishes real structure indexing, canonical naming, and interactive 3D structure browsing.",
        },
        changes: [
          { zh: "新增 CSD MOF 公共结构图谱和可调整大小的三维结构工作台，支持索引搜索、结构详情与来源信息。", en: "Adds a public CSD MOF structure atlas and resizable 3D workbench with indexed search, structural details, and provenance." },
          { zh: "补充常用名称、别名和规范显示名；原始结构编号继续用于精确搜索和溯源。", en: "Adds common names, aliases, and canonical display names while preserving raw structure identifiers for exact search and provenance." },
          { zh: "接入 9,835 条 CoRE 2024 CR 结构索引、路线族结构样本和质量报告。", en: "Integrates a 9,835-record CoRE 2024 CR structure index, route-family structure samples, and quality reports." },
          { zh: "接入 FAIR-MOFs 性质索引、质量报告和家族合成证据，保持来源与派生字段分离。", en: "Integrates FAIR-MOFs property indexes, quality reports, and family synthesis evidence while separating source and derived fields." },
          { zh: "旧 CoRE/QMOF 种子条目进入隔离清单，不再冒充已核验真实记录。", en: "Moves legacy CoRE/QMOF seed entries into quarantine rather than presenting them as verified real records." },
        ],
      },
      ecoScreen: {
        summary: {
          zh: "生态筛选接入真实结构与合成证据，但仍执行候选级 LCI 门禁。",
          en: "Connects EcoScreen to real structural and synthesis evidence while retaining candidate-level LCI gates.",
        },
        changes: [
          { zh: "CoRE 2024 CR 和 FAIR-MOFs 进入候选结构、合成路线与字段覆盖层。", en: "Adds CoRE 2024 CR and FAIR-MOFs to candidate structure, synthesis-route, and field-coverage layers." },
          { zh: "来源证据、家族代理和项目计算结果分层显示，不把家族级证据当作候选级实测清单。", en: "Separates source evidence, family proxies, and project calculations so family evidence is not treated as candidate-level measured inventory." },
          { zh: "缺少产率、能耗、回收率或循环数据时继续阻断比较性 LCA 结论。", en: "Continues to block comparative LCA conclusions when yield, energy, recovery, or cycling data are missing." },
        ],
      },
      organicAcid: {
        summary: {
          zh: "完成 V3.9.10 可复跑数据、评分规范和方法展示产物。",
          en: "Completes rerunnable V3.9.10 data, scoring specifications, and methodology artifacts.",
        },
        changes: [
          { zh: "生成 V3.9.10 重跑、审计、评分规范和排名演化记录，保留原始与派生字段边界。", en: "Generates V3.9.10 rerun, audit, scoring-specification, and ranking-evolution records with source/derived boundaries." },
          { zh: "有机酸数据层统一文献、金标、反应记录和描述符派生缓存。", en: "Unifies literature, gold, reaction, and descriptor-derived cache layers for Organic Acid." },
          { zh: "路线结构证据接入可视化工作台，身份与许可无法确认的记录不参与正式结果。", en: "Adds route-structure evidence to the visual workbench and excludes records with unresolved identity or licence from formal outputs." },
        ],
      },
      dataCompliance: {
        summary: {
          zh: "为新增数据源建立首版许可与隔离登记。",
          en: "Establishes the first licence and quarantine registry for the new data sources.",
        },
        changes: [
          { zh: "新增数据库合规登记，记录 CCDC、CoRE、FAIR-MOFs、QMOF、NIST/ISODB 和文献来源。", en: "Adds a database-compliance registry covering CCDC, CoRE, FAIR-MOFs, QMOF, NIST/ISODB, and literature sources." },
          { zh: "未确认许可、认证下载和仅限机构许可的数据不进入公开应用数据包。", en: "Keeps unresolved-licence, authenticated-download, and institution-only data out of the public app bundle." },
          { zh: "数据质量报告、隔离清单和来源登记与应用展示同步。", en: "Keeps quality reports, quarantine lists, and source registration synchronized with app presentation." },
        ],
      },
    },
  },
  {
    appVersion: "v1.0.6",
    date: "2026-07-26",
    stage: "unified-platform",
    headline: {
      zh: "v1.0.6：气体分离热力学解释、配对等温线和适用性门禁。",
      en: "v1.0.6: thermodynamic interpretation, paired isotherms, and eligibility gates for gas separation.",
    },
    summary: {
      zh: "将气体分离从单一排序扩展为有条件边界的热力学解释：配对真实单组分等温线、IAST、亨利亲和、等量吸附热和工作容量分别说明来源、公式、适用条件与不可计算原因。",
      en: "Extends gas separation from a single ranking into bounded thermodynamic interpretation: paired real pure-component isotherms, IAST, Henry affinity, isosteric heat, and working capacity each state provenance, formulas, eligibility, and reasons for withholding.",
    },
    modules: {
      gasSep: {
        summary: {
          zh: "建立来源值、项目计算值和代理指标分离的热力学解释层。",
          en: "Adds a thermodynamic interpretation layer that separates source values, project computations, and proxies.",
        },
        changes: [
          { zh: "为同一材料和温度配对真实单组分等温线，双曲线同步显示压力、吸附量和数据来源。", en: "Pairs real pure-component isotherms for the same material and temperature and shows pressure, uptake, and provenance on synchronized curves." },
          { zh: "只有数据配对、拟合和工况满足条件时才计算 IAST；否则明确列出阻断原因。", en: "Computes IAST only when pairing, fitting, and operating conditions are eligible, otherwise listing the blocking reasons." },
          { zh: "区分来源报告选择性、项目计算 IAST、单点吸附量比和结构代理，避免混为一个指标。", en: "Separates source-reported selectivity, project-computed IAST, single-point uptake ratios, and structural proxies." },
          { zh: "补充亨利亲和、工作容量、再生性和等量吸附热解释；缺少多温度或低压数据时不输出伪精确结果。", en: "Adds Henry affinity, working capacity, regenerability, and isosteric-heat interpretation and withholds false precision when multi-temperature or low-pressure data are absent." },
        ],
      },
      methodsEvidence: {
        summary: {
          zh: "公开热力学公式、假设、单位和不可计算边界。",
          en: "Publishes thermodynamic formulas, assumptions, units, and non-computable boundaries.",
        },
        changes: [
          { zh: "方法论页面补充 IAST、亨利区、Clausius-Clapeyron 等量吸附热和工作容量公式。", en: "Adds IAST, Henry-region, Clausius-Clapeyron isosteric-heat, and working-capacity formulas to methodology." },
          { zh: "每个公式与实际字段和数据资格检查绑定，不以通用公式替代缺失数据。", en: "Binds each formula to implemented fields and eligibility checks instead of substituting a generic formula for missing data." },
          { zh: "新增公式一致性、真实数据审计和 GasSep 专项视觉检查。", en: "Adds formula-alignment, real-data-audit, and GasSep-specific visual checks." },
        ],
      },
      validation: {
        summary: {
          zh: "新增热力学数据资格和真实性回归检查。",
          en: "Adds thermodynamic data-eligibility and authenticity regression checks.",
        },
        changes: [
          { zh: "测试真实配对等温线、IAST 资格、等量吸附热资格和来源字段完整性。", en: "Tests real paired isotherms, IAST eligibility, isosteric-heat eligibility, and provenance-field completeness." },
          { zh: "保留已计算 IAST 标记，重复运行数据构建器不会重复计数或抬高完整度。", en: "Preserves the already-computed IAST marker so reruns do not double-count or inflate completeness." },
          { zh: "移动端和双曲线布局纳入专项视觉回归。", en: "Adds mobile and paired-curve layouts to focused visual regression." },
        ],
      },
    },
  },
]

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

  const authoredReleases = [...RECENT_RELEASES, V1_0_2_RELEASE, V1_0_1_RELEASE, V1_RELEASE]
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
    generatedAt: GENERATED_AT,
    authority:
      "Single unified EcoMOF-AI Web release log. One Web version manages the whole platform; each release lists only the modules it changed. Historical module version numbers are preserved verbatim in history (pre-1.0 modular-development era).",
    provenance: {
      derivedFrom: "public/data/version_evolution_records.json",
      generatingScript: "scripts/build-app-release-log.mjs",
      note:
        "v1.0.0 module changes are authored from the integration work in this release; history is regrouped by module from existing per-module impact fields without altering any original version number.",
    },
    developmentLog: {
      baseAppVersion: "v1.0.13",
      developmentVersion: "v1.0.14",
      recordedAt: GENERATED_AT,
      status: "archived",
      statusLabel: { zh: "已归档", en: "archived" },
      logPolicy: {
        zh: "v1.0.14 只记录本轮实际完成并通过检查的导航与独立页面、方法论中性化、验证链修复、独立更新日志和响应式适配，不把计划项写成已完成。",
        en: "v1.0.14 records only the navigation and independent pages, neutral Methodology styling, validation-chain fix, independent changelog, and responsive adaptation completed and checked in this release; planned work is not presented as complete.",
      },
      releaseBoundary: RECENT_RELEASES[0].summary,
      modules: RECENT_RELEASES[0].modules,
    },
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
