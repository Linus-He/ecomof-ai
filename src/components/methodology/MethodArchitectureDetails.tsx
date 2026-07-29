// @ts-nocheck
const text = (lang, zh, en) => lang === "zh" ? zh : en

const MODULE_ARCHITECTURE = {
  "mof-library": {
    titleZh: "MOF 库如何完成检索、身份解析与性质展示",
    titleEn: "How the MOF Library resolves identity, search, and properties",
    introZh: "MOF 库不是把多个数据库简单拼在一起。名称、晶体结构、物化性质和文献身份分别保存，只有满足明确连接条件时才在界面上合并。",
    introEn: "The MOF Library does not simply concatenate databases. Names, structures, properties, and literature identities remain separate and are joined only when explicit identity conditions are met.",
    blocks: [
      {
        titleZh: "名称与标识符索引",
        titleEn: "Name and identifier index",
        implementationZh: "查询先统一全角字符、破折号、空格和大小写，再同时检索通用名、别名、CSD Refcode、CCDC 编号和 DOI。常用名登记与结构索引分开保存，避免把同名材料直接视为同一晶体。",
        implementationEn: "Queries normalize Unicode width, dash variants, spacing, and case, then search common names, aliases, CSD Refcodes, CCDC numbers, and DOIs. Common-name records remain separate from the structure index so a shared name does not imply crystal identity.",
        inputsZh: "用户查询；MOF Anatomy 事实身份索引；人工核验别名；CSD 公共目录。",
        inputsEn: "User query; MOF Anatomy factual identity index; reviewed aliases; public CSD catalogue.",
        outputsZh: "性质记录、已连接身份记录、仅身份与文献记录，三类结果明确区分。",
        outputsEn: "Property records, identity-linked records, and identity-plus-paper-only records are shown as distinct result types.",
        boundaryZh: "DOI 相同只表示来自同一篇论文；没有 Refcode 或 CCDC 的精确连接时，不合并结构和性质。",
        boundaryEn: "A shared DOI only identifies an article. Structure and properties are not merged without an exact Refcode or CCDC link.",
      },
      {
        titleZh: "CoRE 主性质索引",
        titleEn: "CoRE primary-property index",
        implementationZh: "页面从 cr_search_index.json 读取 9,835 条经过标准化的 CoRE MOF 2024 CSD-modified CR 记录。数据服务对静态 JSON 请求做 Promise 缓存，再由 normalizeMofCandidate 统一名称、单位、来源和描述符字段。",
        implementationEn: "The page reads 9,835 standardized CoRE MOF 2024 CSD-modified CR records from cr_search_index.json. The data service caches static JSON promises, then normalizeMofCandidate aligns names, units, provenance, and descriptor fields.",
        inputsZh: "表面积、孔体积、PLD、LCD、密度、空隙率、拓扑和来源字段。",
        inputsEn: "Surface area, pore volume, PLD, LCD, density, void fraction, topology, and provenance fields.",
        outputsZh: "可检索的轻量性质记录，以及每个字段对应的来源对象。",
        outputsEn: "Searchable lightweight property records with a provenance object for each field.",
        boundaryZh: "缺失字段保持缺失；不会根据同系列材料、拓扑或论文平均值进行填补。",
        boundaryEn: "Missing fields remain missing; family, topology, or article averages are not used as replacements.",
      },
      {
        titleZh: "晶体结构目录与结构查看器",
        titleEn: "Structure catalogue and viewer",
        implementationZh: "CSD 公共目录单独加载结构清单和 CIF。结构搜索使用精确别名、Refcode 前缀和身份词项分级排序；选中记录后再按需读取 CIF，重建周期边界邻接并计算用于显示的配位多面体。",
        implementationEn: "The public CSD catalogue loads its structure manifest and CIF files separately. Search ranks exact aliases, Refcode prefixes, and identity terms; the selected CIF is loaded on demand, periodic neighbours are reconstructed, and coordination polyhedra are derived for display.",
        inputsZh: "公共结构清单、CIF、元素坐标、晶胞参数和身份登记。",
        inputsEn: "Public structure manifest, CIF, atomic coordinates, cell parameters, and identity registry.",
        outputsZh: "结构卡、三维晶胞、配位多面体和结构来源说明。",
        outputsEn: "Structure card, 3D unit cell, coordination polyhedra, and structure-source notes.",
        boundaryZh: "自动配位多面体是显示层派生结果，不是 CCDC 原始字段；没有可核验 CIF 时保持空态。",
        boundaryEn: "Automatic coordination polyhedra are display derivatives, not original CCDC fields; the viewer remains empty without a verifiable CIF.",
      },
      {
        titleZh: "统一浏览器的连接规则",
        titleEn: "Unified-browser join rules",
        implementationZh: "buildUnifiedMofRows 以结构记录为主键入口，分别挂接气体吸附、电子性质和催化证据。连接结果保留 structuralLinkCount、identityStatus 和字段覆盖率，不能确认的记录仍独立存在。",
        implementationEn: "buildUnifiedMofRows uses structure records as the identity entry point and attaches gas, electronic, and catalysis evidence separately. Joins retain structuralLinkCount, identityStatus, and field coverage; unresolved records remain independent.",
        inputsZh: "结构 Refcode、来源记录号、已核验别名、气体记录和催化证据。",
        inputsEn: "Structure Refcodes, source record IDs, reviewed aliases, gas records, and catalysis evidence.",
        outputsZh: "一条记录的跨数据库概览，以及每个连接的证据状态。",
        outputsEn: "A cross-database record overview with evidence status for every join.",
        boundaryZh: "不使用模糊名称或 DOI 单独建立结构级连接。",
        boundaryEn: "Fuzzy names and DOI-only matches never create structure-level joins.",
      },
    ],
  },
  ecoscreen: {
    titleZh: "生态筛选如何从原始描述符得到可解释结果",
    titleEn: "How EcoScreen turns source descriptors into explainable results",
    introZh: "生态筛选分为任务筛选、字段校验、归一化、客观赋权、证据修正和结果解释六个阶段。任一阶段缺少必要字段时，记录会被降级或阻断，而不是静默补齐。",
    introEn: "EcoScreen runs task filtering, field checks, normalization, objective weighting, evidence correction, and explanation. Missing required fields downgrade or block a record rather than being silently filled.",
    blocks: [
      {
        titleZh: "任务与候选范围",
        titleEn: "Task and candidate scope",
        implementationZh: "界面先读取任务配置中的目标气体、稳定性要求、材料范围和排除条件，再从统一 MOF 记录中建立本次运行的候选集合。筛选条件发生变化时重新计算，不复用上一轮结果。",
        implementationEn: "The UI reads target gas, stability requirements, material scope, and exclusions from task configuration, then builds the run-specific candidate set from unified MOF records. Changed conditions trigger a new calculation.",
        inputsZh: "任务配置、候选记录、稳定性与安全字段。",
        inputsEn: "Task configuration, candidate records, stability and safety fields.",
        outputsZh: "明确记录纳入、排除和待核验原因的候选集合。",
        outputsEn: "A candidate set with explicit inclusion, exclusion, and pending-review reasons.",
        boundaryZh: "来源未明、关键单位异常或必要字段缺失时不进入正式评分。",
        boundaryEn: "Records with unresolved provenance, invalid units, or missing required fields do not enter formal scoring.",
      },
      {
        titleZh: "方向统一与归一化",
        titleEn: "Direction alignment and normalization",
        implementationZh: "收益型和成本型指标分别处理。数值先按当前候选集合的有效范围转换到 0–1；稳定性等级和风险标记通过登记规则映射，不把文字标签直接当连续数值。",
        implementationEn: "Benefit and cost indicators are handled separately. Numeric values are mapped to 0–1 within the valid candidate range; stability tiers and risk labels use registered rules rather than being treated as continuous values.",
        inputsZh: "有效数值、指标方向、单位和分类规则。",
        inputsEn: "Valid values, indicator direction, units, and category rules.",
        outputsZh: "方向一致的描述符矩阵和每一项的转换说明。",
        outputsEn: "A direction-aligned descriptor matrix and transformation notes for each field.",
        boundaryZh: "常数列、有效样本过少和单位不一致会触发警告并停止该指标参与赋权。",
        boundaryEn: "Constant columns, insufficient samples, and unit conflicts warn and exclude the indicator from weighting.",
      },
      {
        titleZh: "CRITIC 客观赋权",
        titleEn: "CRITIC objective weighting",
        implementationZh: "算法分别计算每个指标的标准差和指标间相关性冲突，信息量为 Cj=σjΣ(1−rjk)，再归一化为权重 wj=Cj/ΣCj。权重来自当前候选矩阵，不由页面预先写死。",
        implementationEn: "The algorithm calculates standard deviation and correlation conflict for each indicator: Cj=σjΣ(1−rjk), then wj=Cj/ΣCj. Weights come from the current candidate matrix rather than fixed UI values.",
        inputsZh: "归一化描述符矩阵。",
        inputsEn: "Normalized descriptor matrix.",
        outputsZh: "权重、信息量、相关性矩阵和不可用指标说明。",
        outputsEn: "Weights, information content, correlation matrix, and unavailable-indicator notes.",
        boundaryZh: "CRITIC 只描述当前候选集合的区分度与冗余，不代表科学因果。",
        boundaryEn: "CRITIC measures contrast and redundancy in the current set; it does not establish scientific causality.",
      },
      {
        titleZh: "证据修正与 LCA 边界",
        titleEn: "Evidence correction and LCA boundary",
        implementationZh: "综合分先按加权几何方式聚合，再乘字段来源覆盖度、身份确定性和证据等级组成的 Q。材料级 LCA 只在存在可核查清单、功能单位和边界时显示；代理值与来源值分开。",
        implementationEn: "The aggregate score uses a weighted geometric form, then applies Q from provenance coverage, identity certainty, and evidence level. Material-level LCA is shown only with a reviewable inventory, functional unit, and boundary; proxies remain separate from source values.",
        inputsZh: "权重、描述符得分、fieldSources、身份状态、LCA 清单。",
        inputsEn: "Weights, descriptor scores, fieldSources, identity status, and LCA inventory.",
        outputsZh: "证据修正分、驱动因素、风险项和需要补充的数据。",
        outputsEn: "Evidence-adjusted score, drivers, risks, and data gaps.",
        boundaryZh: "结果用于形成研究假设，不等于材料已通过环境、安全或工程验证。",
        boundaryEn: "Results support research hypotheses and do not mean a material has passed environmental, safety, or engineering validation.",
      },
    ],
  },
  gassep: {
    titleZh: "气体分离如何处理条件、等温线和热力学",
    titleEn: "How GasSep handles conditions, isotherms, and thermodynamics",
    introZh: "气体模块把来源实测、来源报告、本站计算和代理指标分开。材料名称相同但温度、压力、气体组分或样品状态不同的记录不会被直接比较。",
    introEn: "GasSep separates source measurements, source-reported values, site calculations, and proxies. Records sharing a material name are not directly compared when temperature, pressure, composition, or sample state differs.",
    blocks: [
      {
        titleZh: "吸附记录与字段来源",
        titleEn: "Adsorption records and field provenance",
        implementationZh: "gas_adsorption_records_v2 以记录为单位保存材料身份、气体、温度、压力、吸附量、单位、方法和 DOI；fieldSources 为每个关键字段保留原始字段、换算状态和来源位置。",
        implementationEn: "gas_adsorption_records_v2 stores identity, gas, temperature, pressure, uptake, units, method, and DOI per record; fieldSources retains source field, conversion status, and location for each key value.",
        inputsZh: "等温线点、单点吸附、来源表格、实验条件和 DOI。",
        inputsEn: "Isotherm points, single-point uptake, source tables, experimental conditions, and DOI.",
        outputsZh: "条件化记录、等温线和字段来源弹窗。",
        outputsEn: "Conditioned records, isotherms, and field-provenance views.",
        boundaryZh: "缺少温度、压力或单位时，记录只能浏览，不能进入条件化比较。",
        boundaryEn: "Records missing temperature, pressure, or units remain browse-only and cannot enter conditioned comparisons.",
      },
      {
        titleZh: "选择性类型判定",
        titleEn: "Selectivity-type classification",
        implementationZh: "模块优先显示来源报告的 IAST 或实验选择性；若只有两种气体的吸附量，则标记为吸附量比代理。来源值、本站计算值和代理值使用不同状态，不互相覆盖。",
        implementationEn: "Source-reported IAST or experimental selectivity is preferred. If only two uptakes exist, the result is labelled an uptake-ratio proxy. Source, computed, and proxy values keep distinct states and never overwrite each other.",
        inputsZh: "气体对、组成、压力、吸附量、来源选择性和计算状态。",
        inputsEn: "Gas pair, composition, pressure, uptake, source selectivity, and computation state.",
        outputsZh: "来源选择性、计算 IAST 或代理值及其适用条件。",
        outputsEn: "Source selectivity, computed IAST, or proxy with applicable conditions.",
        boundaryZh: "界面不把吸附量比写成 IAST，也不把不同条件下的选择性放在同一基准上。",
        boundaryEn: "An uptake ratio is never labelled IAST, and selectivities from incompatible conditions are not benchmarked together.",
      },
      {
        titleZh: "IAST 计算资格",
        titleEn: "IAST eligibility",
        implementationZh: "只有两种纯组分等温线都能识别、温度一致、压力范围有重叠并且拟合满足检查时，才允许执行 IAST。若生成脚本已经写入计算结果，前端读取并标记 alreadyComputedIast，避免重复计算或重复计数。",
        implementationEn: "IAST runs only when both pure-component isotherms are identified, temperatures match, pressure ranges overlap, and fitted models pass checks. Precomputed results carry alreadyComputedIast so the UI does not recalculate or inflate completeness.",
        inputsZh: "成对纯组分等温线、温度、压力范围、气相组成和拟合参数。",
        inputsEn: "Paired pure-component isotherms, temperature, pressure range, gas composition, and fit parameters.",
        outputsZh: "满足边界时的混合物吸附与 IAST 选择性；否则给出明确阻断原因。",
        outputsEn: "Mixture loading and IAST selectivity within the valid boundary, or an explicit blocking reason.",
        boundaryZh: "单点数据、不同温度或无重叠压力区间不会执行 IAST。",
        boundaryEn: "Single points, mismatched temperatures, or non-overlapping pressure ranges cannot produce IAST.",
      },
      {
        titleZh: "吸附热与亨利区解释",
        titleEn: "Heat of adsorption and Henry-region interpretation",
        implementationZh: "Qst 优先读取来源值。等量吸附热计算只在同一材料和气体存在可比的多温等温线时开放；亨利亲和性只使用明确的低压区拟合，并把拟合区间和误差一同展示。",
        implementationEn: "Source Qst is preferred. Isosteric heat calculation requires comparable multi-temperature isotherms for the same material and gas; Henry affinity uses an explicit low-pressure fit with range and error shown.",
        inputsZh: "多温等温线、低压数据点、来源 Qst 和材料身份。",
        inputsEn: "Multi-temperature isotherms, low-pressure points, source Qst, and material identity.",
        outputsZh: "来源 Qst、可计算 Qst、亨利亲和性或不可用原因。",
        outputsEn: "Source Qst, computable Qst, Henry affinity, or an unavailable reason.",
        boundaryZh: "结构描述符、单点吸附量和经验代理不能替代热力学计算。",
        boundaryEn: "Structural descriptors, single-point uptake, and empirical proxies cannot replace thermodynamic calculations.",
      },
    ],
  },
  "catalysis-lab": {
    titleZh: "催化工作区如何组织反应、证据和决策",
    titleEn: "How the catalysis workspace organizes reactions, evidence, and decisions",
    introZh: "催化模块把反应事实、机理假设、材料描述符和验证任务分层保存。界面展示的是证据支持下的研究路线，不把规则分数写成实验性能。",
    introEn: "Catalysis stores reaction facts, mechanistic hypotheses, material descriptors, and validation tasks in separate layers. The UI presents evidence-supported research routes, not experimental performance disguised as rule scores.",
    blocks: [
      {
        titleZh: "反应数据标准化",
        titleEn: "Reaction-data normalization",
        implementationZh: "normalizeOrganicAcidRecord 和反应映射器把底物、产物、催化剂、溶剂、温度、时间、产率、选择性和来源字段转换为统一记录。原始文本、标准化字段和派生字段保持分层。",
        implementationEn: "normalizeOrganicAcidRecord and reaction mappers align substrate, product, catalyst, solvent, temperature, time, yield, selectivity, and provenance. Raw text, normalized fields, and derived fields remain separate.",
        inputsZh: "论文记录、实验条件、反应物/产物身份和字段来源。",
        inputsEn: "Literature records, experimental conditions, reactant/product identity, and field provenance.",
        outputsZh: "可比较的反应记录和字段级证据。",
        outputsEn: "Comparable reaction records with field-level evidence.",
        boundaryZh: "条件缺失或产物身份不明确时，不进入定量基准。",
        boundaryEn: "Records with missing conditions or ambiguous product identity do not enter quantitative benchmarking.",
      },
      {
        titleZh: "反应指纹与路径图",
        titleEn: "Reaction fingerprints and pathway graph",
        implementationZh: "反应指纹把键变化、官能团变化、氧化态线索和条件特征编码为可追踪字段；路径图使用明确节点和有向边表达转化假设，每条边保存证据、规则和验证状态。",
        implementationEn: "Reaction fingerprints encode bond changes, functional-group changes, oxidation-state cues, and conditions as traceable fields. The pathway graph represents transformation hypotheses with explicit nodes and directed edges carrying evidence, rules, and validation status.",
        inputsZh: "标准化反应、机理文献、路径节点和证据记录。",
        inputsEn: "Normalized reactions, mechanism literature, pathway nodes, and evidence records.",
        outputsZh: "反应指纹、路径边、证据等级和待证伪假设。",
        outputsEn: "Reaction fingerprints, pathway edges, evidence levels, and falsifiable hypotheses.",
        boundaryZh: "路径图是机理组织工具，不等于动力学模型或势能面。",
        boundaryEn: "The graph organizes mechanistic evidence; it is not a kinetic model or potential-energy surface.",
      },
      {
        titleZh: "候选筛选与解释",
        titleEn: "Candidate screening and explanation",
        implementationZh: "材料描述符先通过反应任务所需的硬条件，再按路径相关性、证据完整度、材料可行性和验证价值生成优先队列。解释抽屉直接读取本次运行的贡献项和阻断项。",
        implementationEn: "Material descriptors pass task-specific hard conditions before route relevance, evidence completeness, material feasibility, and validation value form a priority queue. Explanation drawers read contribution and blocking items from the current run.",
        inputsZh: "材料描述符、反应指纹、路径规则、证据等级和验证缺口。",
        inputsEn: "Material descriptors, reaction fingerprints, pathway rules, evidence levels, and validation gaps.",
        outputsZh: "候选队列、选择理由、排除理由和下一步验证任务。",
        outputsEn: "Candidate queue, inclusion reasons, exclusion reasons, and next validation tasks.",
        boundaryZh: "候选顺序用于安排实验与数据补全，不表示已测得更高产率或选择性。",
        boundaryEn: "Candidate order plans experiments and data completion; it does not claim higher measured yield or selectivity.",
      },
    ],
  },
  "organic-acid": {
    titleZh: "有机酸路线如何执行丰度中性评分",
    titleEn: "How the Organic Acid route applies abundance-neutral scoring",
    introZh: "现行 V3.9.10 是固定规则的白盒评分。原始记录数量不会直接提高得分；数量只影响经验贝叶斯收缩、置信度和不确定性。",
    introEn: "Current V3.9.10 is a fixed-rule white-box score. Raw record count never directly raises a score; it affects only empirical-Bayes shrinkage, confidence, and uncertainty.",
    blocks: [
      {
        titleZh: "身份和条件连接",
        titleEn: "Identity and condition linkage",
        implementationZh: "结构级连接只接受精确或基础 CSD Refcode；DOI 只用于定位论文。反应记录还要通过底物、产物、温度、溶剂和催化体系的条件核对，才能用于路线因子。",
        implementationEn: "Structure-level joins accept exact or base CSD Refcodes; DOI only locates an article. Reaction records must also pass substrate, product, temperature, solvent, and catalyst-system checks before contributing route factors.",
        inputsZh: "结构 Refcode、论文 DOI、反应条件和来源位置。",
        inputsEn: "Structure Refcode, paper DOI, reaction conditions, and source location.",
        outputsZh: "已连接记录或明确的未映射状态。",
        outputsEn: "A linked record or an explicit unmapped state.",
        boundaryZh: "同论文、同家族或近似名称都不足以建立结构级连接。",
        boundaryEn: "A shared paper, family, or similar name is insufficient for a structure-level join.",
      },
      {
        titleZh: "经验贝叶斯丰度校正",
        titleEn: "Empirical-Bayes abundance correction",
        implementationZh: "每个家族的性质中位数向描述符对应的全局先验收缩，形式为 θ̂=(n_eff·θ_family+k·θ_prior)/(n_eff+k)。n_eff 只反映有效唯一条件，不使用重复行数量。",
        implementationEn: "Each family median shrinks toward the descriptor-specific global prior: θ̂=(n_eff·θ_family+k·θ_prior)/(n_eff+k). n_eff counts effective unique conditions rather than duplicated rows.",
        inputsZh: "家族中位数、全局先验、有效唯一条件数和收缩常数。",
        inputsEn: "Family median, global prior, effective unique-condition count, and shrinkage constant.",
        outputsZh: "收缩后的因子、置信度和不确定性。",
        outputsEn: "Shrunk factor, confidence, and uncertainty.",
        boundaryZh: "复制同一条数据不会改变点估计；小样本家族保持接近先验。",
        boundaryEn: "Duplicating a row cannot change the point estimate; sparse families remain close to the prior.",
      },
      {
        titleZh: "八因子 HGCPS",
        titleEn: "Eight-factor HGCPS",
        implementationZh: "主体稳定性、主体路径支持、客体活性补偿、主客体互补性、证据置信度、风险保留、合成条件可达性和经济性按锁定权重进入 HGCPS=Πmax(fk,0.001)^wk。权重从评分规范读取，和为 1。",
        implementationEn: "Host stability, host pathway support, guest activity compensation, complementarity, evidence, risk retention, synthesis-condition accessibility, and economics enter HGCPS=Πmax(fk,0.001)^wk with locked weights read from the scoring specification.",
        inputsZh: "八个 0–1 因子、锁定权重和数值下限。",
        inputsEn: "Eight 0–1 factors, locked weights, and numerical floor.",
        outputsZh: "路线 HGCPS、逐因子贡献、派生层级、记录数和 fallback 原因。",
        outputsEn: "Route HGCPS, factor trace, derivation level, record count, and fallback reason.",
        boundaryZh: "0.001 只用于避免数值问题，不表示存在最低证据；fallback 必须保持可见。",
        boundaryEn: "The 0.001 floor is numerical only and does not imply minimum evidence; fallback states remain visible.",
      },
      {
        titleZh: "重复性与敏感性审计",
        titleEn: "Reproducibility and sensitivity audit",
        implementationZh: "生成脚本对评分规范哈希、重复行不变性、逐因子消融、允许范围内的参数扰动和排名变化进行审计。页面读取审计产物，不在浏览器里修改正式结果。",
        implementationEn: "Build scripts audit scoring-spec hashes, duplicate-row invariance, leave-one-factor-out ablation, permitted parameter perturbations, and ranking changes. The page reads audit artifacts and does not mutate formal results in the browser.",
        inputsZh: "锁定规范、重跑产物、消融产物和审计报告。",
        inputsEn: "Locked specification, rerun artifact, ablation artifact, and audit report.",
        outputsZh: "审计通过/失败、脆弱因子、名次变化和下一步实验。",
        outputsEn: "Audit pass/fail, fragile factors, rank changes, and next experiments.",
        boundaryZh: "软件审计通过不等于化学因果或实验重复性已经验证。",
        boundaryEn: "Passing software audits does not establish chemical causality or experimental reproducibility.",
      },
    ],
  },
  "shared-evidence": {
    titleZh: "字段级溯源如何保存、校验和展示",
    titleEn: "How field-level provenance is stored, checked, and displayed",
    introZh: "来源不是记录底部的一条总备注，而是跟随每个数值字段。这样可以区分同一记录中哪些值来自原文、哪些经过换算、哪些是派生结果、哪些仍然缺失。",
    introEn: "Provenance is attached to each value rather than stored as one note at record level. This distinguishes source values, conversions, derivatives, and missing fields within the same record.",
    blocks: [
      {
        titleZh: "fieldSources 数据结构",
        titleEn: "fieldSources schema",
        implementationZh: "每个重要字段对应一个来源对象，保存 sourceDatabase、sourceRecordId、sourceVersion、sourceUrl、citation、原始字段、单位、换算状态、派生状态、人工整理状态、歧义标记和可评分状态。",
        implementationEn: "Each important field has a source object containing sourceDatabase, sourceRecordId, sourceVersion, sourceUrl, citation, original field, unit, conversion, derivation, manual-curation, ambiguity, and scoring-eligibility states.",
        inputsZh: "原始数据字段、来源清单、映射规则和单位规则。",
        inputsEn: "Source fields, source registry, mapping rules, and unit rules.",
        outputsZh: "可由任一页面调用的统一字段来源对象。",
        outputsEn: "A shared field-provenance object usable by every page.",
        boundaryZh: "记录级 DOI 不能自动成为所有字段的来源；每个关键字段都要单独说明。",
        boundaryEn: "A record-level DOI does not automatically source every field; each key field needs its own account.",
      },
      {
        titleZh: "映射与单位校验",
        titleEn: "Mapping and unit validation",
        implementationZh: "mofDataMappers 把不同数据库字段映射到统一描述符；validateProvenance 检查来源对象，validateUnits 检查单位和换算。歧义、缺失和 pending 状态通过 dataValidation 保留。",
        implementationEn: "mofDataMappers map source-specific fields into common descriptors; validateProvenance checks source objects and validateUnits checks units and conversions. Ambiguous, missing, and pending states remain visible through dataValidation.",
        inputsZh: "数据库原字段、目标字段、单位和映射说明。",
        inputsEn: "Source field, target field, unit, and mapping note.",
        outputsZh: "confirmed、ambiguous、missing 或 pending 状态。",
        outputsEn: "confirmed, ambiguous, missing, or pending state.",
        boundaryZh: "校验失败的字段不能静默进入评分或基准比较。",
        boundaryEn: "A failed field cannot silently enter scoring or benchmarking.",
      },
      {
        titleZh: "页面弹窗与关闭逻辑",
        titleEn: "Provenance panel and close behavior",
        implementationZh: "FieldProvenanceButton 读取当前字段的来源对象，在锚定弹窗中显示当前值、原始字段、换算、派生、整理、歧义、来源记录和许可。标题与关闭按钮固定在弹窗顶部，正文独立滚动。",
        implementationEn: "FieldProvenanceButton reads the current field source and shows value, source field, conversion, derivation, curation, ambiguity, source record, and licence in an anchored panel. The title and close control stay fixed while the body scrolls.",
        inputsZh: "字段键、显示名称、当前值和 fieldSources 对象。",
        inputsEn: "Field key, display label, current value, and fieldSources object.",
        outputsZh: "字段级来源说明和原始链接。",
        outputsEn: "Field-level provenance with source links.",
        boundaryZh: "没有来源对象时不伪造弹窗内容，页面显示待整理或缺失。",
        boundaryEn: "When no source object exists, the UI shows pending or missing rather than fabricated provenance.",
      },
      {
        titleZh: "来源登记与合规连接",
        titleEn: "Source registry and compliance linkage",
        implementationZh: "source_registry.json 登记发布方、数据版本、许可、获取方式、是否允许再分发和当前接入状态。字段来源通过 sourceId 连接到来源登记，合规页面保留原文链接和授权缺口。",
        implementationEn: "source_registry.json records publisher, version, licence, acquisition route, redistribution boundary, and ingestion status. Field provenance links to the source registry through sourceId, while the compliance page keeps publisher terms and authorization gaps.",
        inputsZh: "来源条目、许可链接、版本、记录范围和处理状态。",
        inputsEn: "Source entry, licence link, version, record scope, and handling status.",
        outputsZh: "来源登记、合规说明和可追踪的数据处理链。",
        outputsEn: "Source registry, compliance explanation, and traceable handling chain.",
        boundaryZh: "来源登记证明本站如何处理，不等于发布方授权证书。",
        boundaryEn: "The registry evidences site handling and is not a publisher-issued licence certificate.",
      },
    ],
  },
  "limitations-validation": {
    titleZh: "限制、验证和失败处理如何落到代码中",
    titleEn: "How limitations, validation, and failures are implemented",
    introZh: "验证不是页面末尾的免责声明，而是贯穿数据接入、映射、评分、展示和发布。校验失败时保留原因，并尽量把记录降级为可浏览状态，而不是生成一个看似完整的结果。",
    introEn: "Validation is not an end-of-page disclaimer; it spans ingestion, mapping, scoring, presentation, and release. Failures retain reasons and normally downgrade a record to browse-only rather than produce a complete-looking result.",
    blocks: [
      {
        titleZh: "接入校验",
        titleEn: "Ingestion validation",
        implementationZh: "构建脚本检查 JSON 结构、记录主键、重复记录、单位、来源字段、许可登记和计数一致性。生成产物与摘要由同一次运行写出，测试再核对总数和关键样本。",
        implementationEn: "Build scripts check JSON shape, record keys, duplicates, units, provenance, licence registry, and count consistency. Records and summaries come from the same run, then tests verify totals and key samples.",
        inputsZh: "原始或整理后的数据、schema、来源登记和构建配置。",
        inputsEn: "Raw or curated data, schema, source registry, and build configuration.",
        outputsZh: "版本化数据产物、摘要、重复报告和错误日志。",
        outputsEn: "Versioned artifacts, summaries, duplicate reports, and error logs.",
        boundaryZh: "构建失败时不更新正式产物；旧版本继续可读。",
        boundaryEn: "A failed build does not replace formal artifacts; the previous version remains readable.",
      },
      {
        titleZh: "运行时失败与空态",
        titleEn: "Runtime failures and empty states",
        implementationZh: "dataService 对静态请求缓存 Promise；请求失败时按调用方约定抛错或返回明确 fallback。页面分别显示加载、空结果、来源不可用和条件不满足，不预填示例材料冒充用户查询。",
        implementationEn: "dataService caches static requests. Failures either throw or return an explicit fallback according to the caller. Pages distinguish loading, empty, unavailable-source, and unmet-condition states and do not prefill examples as user results.",
        inputsZh: "数据请求、fallback 约定和页面状态。",
        inputsEn: "Data request, fallback contract, and page state.",
        outputsZh: "可解释的加载、空态、阻断或降级界面。",
        outputsEn: "Explainable loading, empty, blocked, or degraded UI states.",
        boundaryZh: "fallback 只能维持界面可用，不能被标记为来源实测值。",
        boundaryEn: "A fallback can preserve UI function but cannot be labelled as a source measurement.",
      },
      {
        titleZh: "基准资格与审计",
        titleEn: "Benchmark eligibility and audit",
        implementationZh: "benchmarkEligibilityAudit 检查身份、条件、字段来源覆盖度和任务输出；provenanceAudit 计算 DOI、引用、来源和字段级覆盖率。只有满足阈值的记录才进入定量基准。",
        implementationEn: "benchmarkEligibilityAudit checks identity, conditions, field provenance coverage, and task output; provenanceAudit measures DOI, citation, source, and field-level coverage. Only qualifying records enter quantitative benchmarks.",
        inputsZh: "标准化记录、fieldSources、任务条件和输出字段。",
        inputsEn: "Normalized records, fieldSources, task conditions, and outputs.",
        outputsZh: "可进入基准、仅可浏览或需要补证的状态。",
        outputsEn: "Benchmark-eligible, browse-only, or evidence-required state.",
        boundaryZh: "数据量大不等于证据完整；覆盖度不足时不会仅凭记录数放宽标准。",
        boundaryEn: "Large volume does not imply complete evidence; record count does not relax eligibility thresholds.",
      },
      {
        titleZh: "发布前检查",
        titleEn: "Pre-release checks",
        implementationZh: "提交前运行重点测试、全量 Vitest、TypeScript 类型检查、生产构建、git diff 检查和浏览器交互/控制台核查。版本日志和历史沿革由生成脚本更新并通过测试核对。",
        implementationEn: "Before commit, focused tests, full Vitest, TypeScript, production build, git diff checks, and browser interaction/console checks run. Release notes and history are generated and validated by tests.",
        inputsZh: "代码、数据产物、版本元数据和浏览器页面。",
        inputsEn: "Code, data artifacts, version metadata, and browser pages.",
        outputsZh: "可提交状态、失败项及其复测证据。",
        outputsEn: "Commit-ready state, failures, and rerun evidence.",
        boundaryZh: "本地构建通过不等于已经推送、部署或公开可访问。",
        boundaryEn: "A passing local build does not mean the change was pushed, deployed, or publicly available.",
      },
    ],
  },
}

export function MethodArchitectureOverview({ lang, t }) {
  const layers = [
    {
      titleZh: "来源层：保留数据库自己的身份和许可",
      titleEn: "Source layer: preserve source identity and licence",
      bodyZh: "原始下载、整理数据和事实身份登记按来源分开保存。source_registry.json 记录发布方、版本、许可、记录范围和接入状态；受限来源不会因为进入仓库而改变授权。",
      bodyEn: "Raw downloads, curated data, and factual identity registries remain source-separated. source_registry.json records publisher, version, licence, scope, and ingestion status; repository inclusion never changes source rights.",
    },
    {
      titleZh: "索引层：为不同检索目标建立轻量索引",
      titleEn: "Index layer: lightweight indexes for different searches",
      bodyZh: "CoRE 性质索引面向描述符检索，CSD 公共目录面向结构，MOF Anatomy 索引面向名称、DOI 与 CCDC，气体记录索引面向材料—气体—条件。索引不复制不具备授权的原始资产。",
      bodyEn: "The CoRE index serves descriptors, the CSD catalogue serves structures, the MOF Anatomy index serves names/DOIs/CCDC numbers, and gas indexes serve material-gas-condition records. Indexes do not copy unlicensed source assets.",
    },
    {
      titleZh: "标准化层：统一字段，但不抹平来源差异",
      titleEn: "Normalization layer: common fields without erasing source differences",
      bodyZh: "dataService 负责读取与缓存，mofDataMappers 和 normalizeMofCandidate 统一字段名、单位和状态。每个值仍通过 fieldSources 指回原字段、记录、版本、引用和换算说明。",
      bodyEn: "dataService handles reading and caching; mappers and normalizeMofCandidate align fields, units, and states. Each value still points back to its source field, record, version, citation, and conversion through fieldSources.",
    },
    {
      titleZh: "任务层：按模块建立派生结果与审计产物",
      titleEn: "Task layer: module-specific derivatives and audit artifacts",
      bodyZh: "生态筛选、气体分离和有机酸路线分别读取标准化记录，应用自己的资格条件、算法和证据边界。正式派生结果由脚本或明确运行生成，页面只读取，不用演示交互改写。",
      bodyEn: "EcoScreen, GasSep, and Organic Acid read normalized records and apply task-specific eligibility, algorithms, and evidence boundaries. Formal derivatives come from explicit runs; explanatory UI controls do not rewrite them.",
    },
  ]
  return (
    <section id="methodology-data-architecture" style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 16, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{text(lang, "数据与数据库架构", "Data and database architecture")}</span>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.25, margin: 0 }}>{text(lang, "四层结构：来源、索引、标准化、任务", "Four layers: source, index, normalization, and task")}</h2>
        <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.72, margin: 0 }}>{text(lang, "这套架构的重点不是把记录合成一个更大的表，而是让每次连接都有身份依据、字段来源和失败边界。", "The architecture does not aim to make one larger table; every join needs identity evidence, field provenance, and a failure boundary.")}</p>
      </header>
      {layers.map((layer, index) => (
        <article key={layer.titleEn} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 6, gridTemplateColumns: "48px minmax(0, 1fr)", paddingTop: 12 }}>
          <strong style={{ color: t.accentText, fontSize: 12.3 }}>{index + 1}</strong>
          <div style={{ display: "grid", gap: 5 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.2 }}>{text(lang, layer.titleZh, layer.titleEn)}</strong>
            <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.7, margin: 0 }}>{text(lang, layer.bodyZh, layer.bodyEn)}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

export function MethodArchitectureDetails({ moduleId, lang, t }) {
  const section = MODULE_ARCHITECTURE[moduleId]
  if (!section) return null
  return (
    <section id={`methodology-${moduleId}-architecture`} style={{ background: t.surface, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 16, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10.8, fontWeight: 900 }}>{text(lang, "实现方式与架构", "Implementation and architecture")}</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.3, margin: 0 }}>{text(lang, section.titleZh, section.titleEn)}</h3>
        <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.72, margin: 0 }}>{text(lang, section.introZh, section.introEn)}</p>
      </header>
      {section.blocks.map((block, index) => (
        <article key={block.titleEn} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, paddingTop: 13 }}>
          <h4 style={{ color: t.textStrong, fontSize: 14.2, lineHeight: 1.45, margin: 0 }}>
            <span style={{ color: t.accentText, marginRight: 9 }}>{index + 1}</span>
            {text(lang, block.titleZh, block.titleEn)}
          </h4>
          <p style={{ color: t.muted, fontSize: 11.9, lineHeight: 1.75, margin: 0 }}>{text(lang, block.implementationZh, block.implementationEn)}</p>
          <div style={{ background: t.panel, borderLeft: `3px solid ${t.accent}`, display: "grid", gap: 6, padding: "10px 12px" }}>
            <p style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "输入：", "Input: ")}</strong>{text(lang, block.inputsZh, block.inputsEn)}
            </p>
            <p style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "输出：", "Output: ")}</strong>{text(lang, block.outputsZh, block.outputsEn)}
            </p>
            <p style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: t.warn }}>{text(lang, "边界与失败处理：", "Boundary and failure handling: ")}</strong>{text(lang, block.boundaryZh, block.boundaryEn)}
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}
