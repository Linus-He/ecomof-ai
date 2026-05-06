import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  getCatalysisRecords, getCatalysisTasks, getMofCandidates, getScoringWeights, BasisBadge, BrandMark, PageHeader, ResultLayer, Callout, MethodDrawer, UnifiedCandidateCard, CopyLinkButton,
  calculateCatalysisScore, getScoreBreakdown, getWeightContribution, DEFAULT_SCORING_WEIGHTS, evidenceDistribution, scoreDistribution, sensitivityRows,
  RankingBarChart, ScoreBreakdownRadar, WeightContributionChart, EvidenceDistributionChart, ScoreDistributionChart, SensitivityAnalysisChart,
  DataModeToggle, RealSeedCallout, DemoModeBanner, safeVal, toolbarBtn, SectionTitle, FieldProvenanceButton,
} from "../../shared"

// ── Catalysis Data Template helpers ──────────────────────────────────────────

const CATALYSIS_TEMPLATE_FIELDS = [
  // MOF information
  { key: "mof_name",               label: "MOF name",                       category: "MOF information",        required: true,  example: "UiO-66-NH2",          note: "Standard or IUPAC name" },
  { key: "formula",                label: "Formula",                        category: "MOF information",        required: false, example: "Zr6O4(OH)4(BDC)6",   note: "Hill notation preferred" },
  { key: "metal_nodes",            label: "Metal nodes",                    category: "MOF information",        required: true,  example: "Zr",                  note: "Comma-separated if multiple" },
  { key: "bimetallic_system",      label: "Bimetallic system",              category: "MOF information",        required: false, example: "No / Yes / Possible",  note: "" },
  { key: "linker",                 label: "Linker",                         category: "MOF information",        required: true,  example: "BDC",                 note: "Abbreviation + full name recommended" },
  { key: "topology",               label: "Topology",                       category: "MOF information",        required: false, example: "fcu",                 note: "RCSR code preferred" },
  // Structural properties
  { key: "pore_size_a",            label: "Pore size (Å)",                  category: "Structural properties", required: false, example: "8.5",                 note: "PLD or LCD; specify which" },
  { key: "surface_area_m2g",       label: "BET surface area (m²/g)",        category: "Structural properties", required: false, example: "1050",                note: "Measured by N2 adsorption" },
  { key: "pore_volume_cm3g",       label: "Pore volume (cm³/g)",            category: "Structural properties", required: false, example: "0.46",                note: "" },
  // Catalysis task
  { key: "reaction_type",          label: "Reaction type",                  category: "Catalysis task",        required: true,  example: "CO2 photoreduction",  note: "Match to a known reaction class" },
  { key: "substrate",              label: "Substrate",                      category: "Catalysis task",        required: true,  example: "CO2",                 note: "Include concentration if relevant" },
  { key: "product",                label: "Product",                        category: "Catalysis task",        required: true,  example: "CO, CH4",             note: "List all detected products" },
  // Reaction conditions
  { key: "temperature_c",          label: "Temperature (°C)",               category: "Reaction conditions",   required: true,  example: "pending",             note: "" },
  { key: "pressure_bar",           label: "Pressure (bar)",                 category: "Reaction conditions",   required: true,  example: "pending",             note: "CO2 partial pressure if mixture" },
  { key: "solvent",                label: "Solvent",                        category: "Reaction conditions",   required: false, example: "pending",             note: "" },
  { key: "reaction_time_h",        label: "Reaction time (h)",              category: "Reaction conditions",   required: true,  example: "pending",             note: "" },
  { key: "catalyst_loading_mg",    label: "Catalyst loading (mg)",          category: "Reaction conditions",   required: true,  example: "pending",             note: "Per mL or per reaction volume" },
  { key: "light_or_electrochemical_condition", label: "Light / electrochemical condition", category: "Reaction conditions", required: false, example: "pending", note: "Include filter if relevant" },
  // Performance metrics
  { key: "conversion_percent",     label: "Conversion (%)",                 category: "Performance metrics",   required: false, example: "pending",             note: "Substrate conversion" },
  { key: "selectivity_percent",    label: "Selectivity (%)",                category: "Performance metrics",   required: false, example: "pending",             note: "Product selectivity" },
  { key: "yield_percent",          label: "Yield (%)",                      category: "Performance metrics",   required: false, example: "pending",             note: "" },
  { key: "tof",                    label: "TOF (h⁻¹)",                      category: "Performance metrics",   required: false, example: "pending",             note: "Turnover frequency" },
  { key: "ton",                    label: "TON",                            category: "Performance metrics",   required: false, example: "pending",             note: "Turnover number" },
  { key: "cycle_stability",        label: "Cycle stability",                category: "Performance metrics",   required: false, example: "pending",             note: "Include regeneration conditions" },
  // Evidence and metadata
  { key: "evidence_level",         label: "Evidence level",                 category: "Evidence & metadata",   required: true,  example: "experimental / literature-supported", note: "" },
  { key: "data_source",            label: "Data source",                    category: "Evidence & metadata",   required: true,  example: "own experiment / CoRE MOF / MOFX-DB", note: "" },
  { key: "doi_or_reference",       label: "DOI or reference",               category: "Evidence & metadata",   required: true,  example: "pending",             note: "" },
  { key: "limitations",            label: "Limitations",                    category: "Evidence & metadata",   required: true,  example: "single-run, no blank control", note: "Known issues with this record" },
  { key: "uncertainty_notes",      label: "Uncertainty notes",              category: "Evidence & metadata",   required: false, example: "yield not corrected for blank", note: "" },
  { key: "recommended_next_validation", label: "Recommended next validation", category: "Evidence & metadata", required: false, example: "repeat under inert atmosphere", note: "" },
]

const TEMPLATE_CATEGORIES = [...new Set(CATALYSIS_TEMPLATE_FIELDS.map(f => f.category))]

const CSV_HEADER = CATALYSIS_TEMPLATE_FIELDS.map(f => f.key).join(",")

function downloadCatalysisTemplate() {
  const blob = new Blob([CSV_HEADER + "\n"], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "catalysis_data_template.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function CatalysisDataTemplate({ lang, t, isNarrow, isMobile }) {
  const [open, setOpen] = useState(false)
  const categories = TEMPLATE_CATEGORIES

  return (
    <details open={open} onToggle={e => setOpen(e.currentTarget.open)}
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <summary style={{ cursor: "pointer", userSelect: "none" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, verticalAlign: "middle" }}>
          <BrandMark size={isMobile ? 28 : 32} radius={8} style={{ boxShadow: t.shadowSm }} />
          <span style={{ color: t.accentText, fontSize: 14, fontWeight: 800 }}>
            {lang === "zh" ? "催化数据模板" : "Catalysis Data Template"}
          </span>
        </span>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
          {lang === "zh"
            ? "该模板定义了后续接入真实催化数据所需的最小字段。当前 CatalysisLab 结果为基于规则的候选材料优先级排序，仍需实验验证。"
            : "This template defines the minimum fields needed for future catalysis data ingestion. Current CatalysisLab results are rule-based candidate prioritization and require experimental validation."}
        </div>

        <button type="button" onClick={downloadCatalysisTemplate}
          style={{ ...toolbarBtn(t), alignSelf: "flex-start", fontWeight: 700 }}>
          ↓ {lang === "zh" ? "下载 CSV 模板" : "Download CSV template"}
        </button>

        {categories.map(cat => {
          const fields = CATALYSIS_TEMPLATE_FIELDS.filter(f => f.category === cat)
          return (
            <div key={cat}>
              <SectionTitle>{cat}</SectionTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: t.surface }}>
                      {[lang === "zh" ? "字段" : "Field", lang === "zh" ? "标签" : "Label", lang === "zh" ? "必填" : "Required", lang === "zh" ? "示例" : "Example", lang === "zh" ? "说明" : "Note"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: t.subtle, fontWeight: 700, borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f, i) => (
                      <tr key={f.key} style={{ background: i % 2 === 0 ? t.surface : "transparent" }}>
                        <td style={{ padding: "5px 10px", color: t.accentSoft, fontFamily: "monospace", whiteSpace: "nowrap" }}>{f.key}</td>
                        <td style={{ padding: "5px 10px", color: t.textStrong, whiteSpace: "nowrap" }}>{f.label}</td>
                        <td style={{ padding: "5px 10px", color: f.required ? t.accentText : t.faint, whiteSpace: "nowrap" }}>
                          {f.required ? (lang === "zh" ? "必填" : "required") : (lang === "zh" ? "可选" : "optional")}
                        </td>
                        <td style={{ padding: "5px 10px", color: t.subtle }}>{f.example}</td>
                        <td style={{ padding: "5px 10px", color: t.faint }}>{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
          {lang === "zh"
            ? "提供这些字段并不意味着一定可以训练机器学习模型。是否适合建模取决于数据量、标签质量、描述符一致性和实验条件可比性。"
            : "Providing these fields does not guarantee that a machine learning model can be trained. Model selection depends on data volume, label quality, descriptor consistency, and experimental comparability."}
        </div>
      </div>
    </details>
  )
}

const NORMALIZATION_TEMPLATE = `{
  "catalyst_records": [
    {
      "catalystId": "",
      "catalystName": "",
      "mofScaffold": "",
      "metalNode": "",
      "modifierMetal": "",
      "functionalGroup": "",
      "metallicity": "single-metal | bimetal | unknown",
      "batchId": "",
      "curationStatus": "curated | needs-review | pending",
      "confidentialityStatus": "public-literature | collaborator-private | anonymized-demo | schema-only"
    }
  ],
  "reaction_conditions": [
    {
      "runId": "",
      "catalystId": "",
      "temperatureC": null,
      "timeH": null,
      "substrate": "",
      "substrateAmountMg": null,
      "co2Source": "CO2 | NaHCO3 | HCO3- | pending",
      "NaHCO3Mg": null,
      "waterMl": null,
      "catalystMg": null,
      "solvent": "water",
      "conditionStatus": "complete | partial | pending"
    }
  ],
  "product_metrics": [
    {
      "productMetricId": "",
      "runId": "",
      "product": "formic acid | lactic acid | acetic acid | glycolic acid | other",
      "peakArea": null,
      "concentration": null,
      "yieldPercent": null,
      "unit": "percent | wt% | mmol | mg | pending",
      "calculationMethod": "",
      "validityStatus": "valid | needs-review | missing | abnormal"
    }
  ],
  "evidence_records": [
    {
      "evidenceId": "",
      "relatedCatalystId": "",
      "relatedRunId": "",
      "evidenceType": "characterization | product-analysis | mechanism | stability",
      "method": "XRD | BET | XPS | FTIR | ICP | SEM/TEM | HPLC | GC-MS | LC-MS | NMR | isotope tracing | other",
      "fileStatus": "available | private | pending",
      "sourceStatus": "public-literature | collaborator-private | pending",
      "evidenceLevel": "high | medium | low | pending",
      "reviewStatus": "reviewed | needs-review | pending"
    }
  ]
}`

const NORMALIZED_TABLES = [
  {
    key: "catalyst_records",
    en: "catalyst_records",
    zh: "catalyst_records",
    bodyEn: "One row per catalyst or catalyst batch.",
    bodyZh: "每种催化剂或每个催化剂批次一行。",
    fields: ["catalystId", "catalystName", "MOF scaffold", "metal node", "modifier metal", "functional group", "single / bimetal status", "batchId", "curationStatus", "confidentialityStatus"],
  },
  {
    key: "reaction_conditions",
    en: "reaction_conditions",
    zh: "reaction_conditions",
    bodyEn: "One row per experimental run.",
    bodyZh: "每组反应实验一行。",
    fields: ["runId", "catalystId", "temperatureC", "timeH", "substrate", "substrateAmountMg", "CO₂/HCO₃⁻ source", "NaHCO₃Mg", "waterMl", "catalystMg", "solvent", "conditionStatus"],
  },
  {
    key: "product_metrics",
    en: "product_metrics",
    zh: "product_metrics",
    bodyEn: "One row per product per run.",
    bodyZh: "每个实验 run 中的每种产物单独一行。",
    fields: ["productMetricId", "runId", "product", "peakArea", "concentration", "yieldPercent", "unit", "calculationMethod", "validityStatus"],
    examplesEn: "formic acid, lactic acid, acetic acid, glycolic acid",
    examplesZh: "甲酸、乳酸、乙酸、乙醇酸",
  },
  {
    key: "evidence_records",
    en: "evidence_records",
    zh: "evidence_records",
    bodyEn: "One row per characterization or mechanism evidence item.",
    bodyZh: "每条表征或机理证据单独一行。",
    fields: ["evidenceId", "relatedCatalystId", "relatedRunId", "evidenceType", "method", "fileStatus", "sourceStatus", "evidenceLevel", "reviewStatus"],
    examplesEn: "XRD, BET, XPS, FTIR, ICP, SEM/TEM, HPLC, GC-MS, LC-MS, NMR, isotope tracing",
    examplesZh: "XRD、BET、XPS、FTIR、ICP、SEM/TEM、HPLC、GC-MS、LC-MS、NMR、同位素示踪",
  },
]

const NORMALIZATION_QUALITY_CHECKS = [
  { en: "Complete reaction condition", zh: "反应条件完整" },
  { en: "Catalyst naming standardized", zh: "催化剂命名统一" },
  { en: "Product metrics traceable to peak area or calculation method", zh: "产物指标可追溯至峰面积或计算方法" },
  { en: "Batch and source clearly labeled", zh: "批次与来源清楚标记" },
  { en: "Confidentiality status confirmed", zh: "保密状态已确认" },
  { en: "Replicates or uncertainty noted", zh: "重复实验或不确定性已标注" },
  { en: "Abnormal / negative / missing values flagged", zh: "异常值、负值或缺失值已标记" },
  { en: "Evidence linked to catalyst or run", zh: "表征或机理证据已关联到催化剂或实验记录" },
]

const TASKS = [
  { id: "co2_conversion", en: "CO₂ conversion", zh: "CO₂ 转化", emphasis: ["co2Affinity", "activeSite", "stability"] },
  { id: "biomass_conversion", en: "Biomass conversion", zh: "生物质转化", emphasis: ["activeSite", "poreAccessibility", "waterStability"] },
  { id: "photocatalysis", en: "Photocatalysis", zh: "光催化", emphasis: ["electronicProperty", "stability", "evidenceConfidence"] },
  { id: "electrocatalysis", en: "Electrocatalysis", zh: "电催化", emphasis: ["electronicProperty", "activeSite", "stability"] },
  { id: "custom_task", en: "Custom task", zh: "自定义任务", emphasis: ["activeSite", "poreAccessibility", "sustainability"] },
]

const TASK_FAMILIES = [
  {
    id: "co2_conversion",
    en: "CO₂ Conversion",
    zh: "CO₂ 转化",
    badgeEn: "Priority task",
    badgeZh: "重点任务",
    bodyEn: "Organize MOF-related CO₂ conversion records across reduction products, C1/C2+ products, cyclic carbonates, organic-acid-related products, and CO₂-assisted upgrading pathways.",
    bodyZh: "整理 MOF 相关的 CO₂ 转化记录，覆盖还原产物、C1/C2+ 产物、环状碳酸酯、有机酸相关产物以及 CO₂ 参与的升级转化路径。",
  },
  {
    id: "photocatalysis",
    en: "Photocatalysis",
    zh: "光催化",
    bodyEn: "Track light-driven catalytic tasks, reaction conditions, product targets, and evidence status.",
    bodyZh: "整理光驱动催化任务、反应条件、目标产物和证据状态。",
  },
  {
    id: "electrocatalysis",
    en: "Electrocatalysis",
    zh: "电催化",
    bodyEn: "Track potential-dependent catalytic reactions, electrolyte context, Faradaic efficiency, and activity metrics.",
    bodyZh: "整理电位相关催化反应、电解液条件、法拉第效率和活性指标。",
  },
  {
    id: "biomass_conversion",
    en: "Biomass Conversion",
    zh: "生物质转化",
    bodyEn: "Track biomass-derived substrates, product selectivity, conversion metrics, and stability notes.",
    bodyZh: "整理生物质来源底物、产物选择性、转化率指标和稳定性说明。",
  },
]

const CO2_CONVERSION_CHECKLIST = [
  { key: "reactionTask", en: "reaction task", zh: "反应任务", status: "needs-review" },
  { key: "targetProduct", en: "product pathway + target product", zh: "产物路径 + 目标产物", status: "needs-review" },
  { key: "catalystRole", en: "catalyst role", zh: "催化剂角色", status: "pending" },
  { key: "activeSiteHypothesis", en: "active-site hypothesis", zh: "活性位点假设", status: "pending" },
  { key: "reactionCondition", en: "condition context", zh: "条件语境", status: "pending" },
  { key: "activityMetric", en: "activity metric", zh: "活性指标", status: "pending" },
  { key: "selectivityMetric", en: "selectivity metric", zh: "选择性指标", status: "pending" },
  { key: "stabilityRecyclability", en: "stability / recyclability", zh: "稳定性 / 循环性能", status: "pending" },
]

const CO2_CONVERSION_PATHWAYS = [
  {
    id: "c1-reduction",
    en: "C1 reduction products",
    zh: "C1 还原产物",
    tagEn: "C1 products",
    tagZh: "C1 产物",
    selectorProductsEn: ["CO", "formate", "methanol"],
    selectorProductsZh: ["CO", "甲酸盐", "甲醇"],
    overviewEn: "Single-carbon CO₂ conversion pathways where product identity, reaction mode, and quantification method drive interpretation.",
    overviewZh: "单碳 CO₂ 转化路径，解读时需要同时看产物身份、反应模式和定量方法。",
    productsEn: ["CO", "formate / formic acid", "methanol", "methane"],
    productsZh: ["CO", "甲酸盐 / 甲酸", "甲醇", "甲烷"],
    modesEn: ["electrocatalysis", "photocatalysis", "photoelectrocatalysis"],
    modesZh: ["电催化", "光催化", "光电催化"],
    metricsEn: ["Faradaic efficiency", "partial current density", "TON/TOF", "product selectivity"],
    metricsZh: ["法拉第效率", "分电流密度", "TON/TOF", "产物选择性"],
    mofRelevanceEn: ["metal nodes", "porphyrinic linkers", "single-atom sites", "conductive composites"],
    mofRelevanceZh: ["金属节点", "卟啉型配体", "单原子位点", "导电复合结构"],
    curationFocusEn: ["potential", "electrolyte", "pH", "light source", "catalyst loading", "product quantification method"],
    curationFocusZh: ["电位", "电解液", "pH", "光源", "催化剂负载量", "产物定量方法"],
    cautionEn: "C1 products should be interpreted with product distribution and condition context, not only total CO₂ conversion.",
    cautionZh: "C1 产物应结合产物分布和条件语境解读，不能只看总 CO₂ 转化率。",
  },
  {
    id: "c2-plus",
    en: "C2+ products",
    zh: "C2+ 产物",
    tagEn: "C-C coupling",
    tagZh: "C-C 偶联",
    selectorProductsEn: ["ethylene", "ethanol", "acetate"],
    selectorProductsZh: ["乙烯", "乙醇", "乙酸盐"],
    overviewEn: "Multi-carbon product pathways where C-C coupling context matters as much as headline selectivity.",
    overviewZh: "多碳产物路径，C-C 偶联语境与选择性数值同样重要。",
    productsEn: ["ethylene", "ethanol", "acetate", "propanol"],
    productsZh: ["乙烯", "乙醇", "乙酸盐", "丙醇"],
    modesEn: ["electrocatalysis", "tandem catalysis", "composite catalysis"],
    modesZh: ["电催化", "串联催化", "复合催化"],
    metricsEn: ["C2+ Faradaic efficiency", "C-C coupling selectivity", "product distribution", "current density"],
    metricsZh: ["C2+ 法拉第效率", "C-C 偶联选择性", "产物分布", "电流密度"],
    mofRelevanceEn: ["confined microenvironment", "Cu sites", "tandem interfaces", "CO intermediate enrichment"],
    mofRelevanceZh: ["限域微环境", "铜位点", "串联界面", "CO 中间体富集"],
    curationFocusEn: ["CO intermediate source", "local pH", "electrolyte", "applied potential", "carbon balance"],
    curationFocusZh: ["CO 中间体来源", "局部 pH", "电解液", "施加电位", "碳平衡"],
    cautionEn: "C2+ formation often involves C-C coupling and should not be compared directly with single-carbon products without reaction-mode context.",
    cautionZh: "C2+ 产物通常涉及 C-C 偶联，缺少反应模式语境时不应与单碳产物直接比较。",
  },
  {
    id: "organic-acids",
    en: "Organic-acid products",
    zh: "有机酸相关产物",
    tagEn: "acid products",
    tagZh: "酸类产物",
    selectorProductsEn: ["formic acid", "oxalic acid", "carboxylates"],
    selectorProductsZh: ["甲酸", "草酸", "羧酸盐"],
    overviewEn: "Acid, formate, and carboxylate records where pH, electrolyte, solvent, and analytical method affect reporting.",
    overviewZh: "酸、甲酸盐和羧酸盐相关记录，pH、电解液、溶剂和分析方法都会影响报道形式。",
    productsEn: ["formic acid / formate", "oxalic acid", "acetate", "carboxylates"],
    productsZh: ["甲酸 / 甲酸盐", "草酸", "乙酸盐", "羧酸盐"],
    modesEn: ["electrocatalysis", "photocatalysis", "carboxylation", "thermal catalysis"],
    modesZh: ["电催化", "光催化", "羧化反应", "热催化"],
    metricsEn: ["acid/formate selectivity", "Faradaic efficiency", "yield", "product stability", "pH-dependent speciation"],
    metricsZh: ["酸类 / 甲酸盐选择性", "法拉第效率", "收率", "产物稳定性", "pH 依赖的物种形态"],
    mofRelevanceEn: ["basic sites", "metal nodes", "functional linkers", "CO₂ activation sites", "proton-transfer environment"],
    mofRelevanceZh: ["碱性位点", "金属节点", "功能化配体", "CO₂ 活化位点", "质子转移环境"],
    curationFocusEn: ["pH", "electrolyte / solvent", "reported product form", "acid/base speciation", "downstream separation"],
    curationFocusZh: ["pH", "电解液 / 溶剂", "报道产物形态", "酸碱物种分布", "后续分离"],
    cautionEn: "Acid, formate, and carboxylate forms should be distinguished because reporting depends on pH, electrolyte, and analytical method.",
    cautionZh: "酸、甲酸盐和羧酸盐形态需要区分，因为报道结果会受到 pH、电解液和分析方法影响。",
  },
  {
    id: "cyclic-carbonates",
    en: "Cyclic carbonates",
    zh: "环状碳酸酯",
    tagEn: "cycloaddition",
    tagZh: "环加成",
    selectorProductsEn: ["epoxide + CO₂"],
    selectorProductsZh: ["环氧化物 + CO₂"],
    overviewEn: "CO₂ cycloaddition records where substrate scope, co-catalyst use, pressure, and recyclability shape comparability.",
    overviewZh: "CO₂ 环加成记录，可比性取决于底物范围、助催化剂、压力和循环性能。",
    productsEn: ["cyclic carbonates from epoxides and CO₂"],
    productsZh: ["由环氧化物与 CO₂ 生成的环状碳酸酯"],
    modesEn: ["thermal catalysis", "Lewis acid/base cooperative catalysis", "co-catalyst-assisted conversion"],
    modesZh: ["热催化", "Lewis 酸/碱协同催化", "助催化剂辅助转化"],
    metricsEn: ["conversion", "yield", "selectivity", "reaction pressure", "temperature", "recyclability"],
    metricsZh: ["转化率", "收率", "选择性", "反应压力", "温度", "循环性能"],
    mofRelevanceEn: ["Lewis acidic metal nodes", "basic functional groups", "pore confinement", "bifunctional catalysis"],
    mofRelevanceZh: ["Lewis 酸性金属节点", "碱性官能团", "孔道限域", "双功能催化"],
    curationFocusEn: ["epoxide substrate", "co-catalyst", "CO₂ pressure", "solvent-free condition", "catalyst reuse"],
    curationFocusZh: ["环氧底物", "助催化剂", "CO₂ 压力", "无溶剂条件", "催化剂复用"],
    cautionEn: "High yield should be interpreted with substrate scope, co-catalyst use, CO₂ pressure, and recyclability.",
    cautionZh: "高收率需要结合底物范围、助催化剂使用、CO₂ 压力和循环性能共同解读。",
  },
  {
    id: "co2-biomass-upgrading",
    en: "CO₂-assisted biomass upgrading",
    zh: "CO₂ 参与的生物质升级转化",
    tagEn: "upgrading",
    tagZh: "升级转化",
    selectorProductsEn: ["biomass-derived oxygenates"],
    selectorProductsZh: ["生物质来源含氧化合物"],
    overviewEn: "CO₂-assisted upgrading pathways where carbon tracing and the role of CO₂ must be made explicit.",
    overviewZh: "CO₂ 参与的升级转化路径，需要明确碳源追踪以及 CO₂ 在反应中的实际角色。",
    productsEn: ["carbonate-mediated products", "carboxylation-related products", "biomass-derived oxygenates"],
    productsZh: ["碳酸盐介导产物", "羧化相关产物", "生物质来源含氧化合物"],
    modesEn: ["thermal catalysis", "tandem catalysis", "CO₂-assisted conversion"],
    modesZh: ["热催化", "串联催化", "CO₂ 辅助转化"],
    metricsEn: ["substrate conversion", "product selectivity", "carbon balance", "CO₂ incorporation evidence"],
    metricsZh: ["底物转化率", "产物选择性", "碳平衡", "CO₂ 固定或参与证据"],
    mofRelevanceEn: ["acid/base sites", "metal nodes", "confined pores", "bifunctional catalysis", "substrate adsorption"],
    mofRelevanceZh: ["酸/碱位点", "金属节点", "孔道限域", "双功能催化", "底物吸附"],
    curationFocusEn: ["substrate identity", "CO₂ incorporation proof", "carbon source tracing", "solvent", "catalyst stability"],
    curationFocusZh: ["底物身份", "CO₂ 参与或固定证据", "碳源追踪", "溶剂", "催化剂稳定性"],
    cautionEn: "This pathway should distinguish CO₂ as a reactant from CO₂ as a reaction-environment modifier.",
    cautionZh: "该路径需要区分 CO₂ 作为反应物被固定，还是仅作为反应环境调控因素。",
  },
]

const CO2_CURATION_DIMENSIONS = [
  {
    en: "Reaction mode",
    zh: "反应模式",
    items: "photocatalysis, electrocatalysis, thermal catalysis, cycloaddition, photoelectrocatalysis",
  },
  {
    en: "Product pathway",
    zh: "产物路径",
    items: "CO, formate, methanol, methane, C2+ products, cyclic carbonates, organic acids",
  },
  {
    en: "Active-site hypothesis",
    zh: "活性位点假设",
    items: "metal node, defect site, functional linker, single-atom site, composite interface",
  },
  {
    en: "Condition context",
    zh: "条件语境",
    items: "light source, applied potential, electrolyte, solvent, pressure, temperature, pH",
  },
  {
    en: "Activity & selectivity metrics",
    zh: "活性与选择性指标",
    items: "TON, TOF, yield, conversion, FE, current density, rate, product distribution",
  },
  {
    en: "Stability evidence",
    zh: "稳定性证据",
    items: "cycle count, duration, structure retention, leaching check, recyclability",
  },
]

const BIOMASS_CO2_CONTEXT = [
  {
    en: "Reaction family",
    zh: "反应家族",
    valueEn: "Hydrothermal synergistic conversion",
    valueZh: "水热协同转化",
  },
  {
    en: "Substrate",
    zh: "底物",
    valueEn: "glucose / biomass-derived carbohydrates",
    valueZh: "葡萄糖 / 生物质来源碳水化合物",
  },
  {
    en: "CO₂ source",
    zh: "CO₂ 来源",
    valueEn: "NaHCO₃ / HCO₃⁻ / captured CO₂ equivalent",
    valueZh: "NaHCO₃ / HCO₃⁻ / 捕集 CO₂ 等效来源",
  },
  {
    en: "Target products",
    zh: "目标产物",
    valueEn: "formic acid, formate, lactic acid, acetic acid, glycolic acid",
    valueZh: "甲酸、甲酸盐、乳酸、乙酸、乙醇酸",
  },
  {
    en: "Catalyst family",
    zh: "催化剂家族",
    valueEn: "Fe-MOFs, amino-functionalized MOFs, transition-metal-modified MOFs",
    valueZh: "Fe-MOFs、氨基功能化 MOFs、过渡金属改性 MOFs",
  },
]

const BIOMASS_BASELINE = [
  { en: "Temperature", zh: "温度", value: "170 ℃" },
  { en: "Glucose", zh: "葡萄糖", value: "90 mg" },
  { en: "NaHCO₃", zh: "NaHCO₃", value: "252 mg" },
  { en: "H₂O", zh: "H₂O", value: "10 mL" },
  { en: "Catalyst", zh: "催化剂", value: "200 mg" },
]

const BIOMASS_PATHWAY_STEPS = [
  { en: "Glucose", zh: "葡萄糖" },
  { en: "isomerization", zh: "异构化" },
  { en: "fructose / ketose intermediates", zh: "果糖 / 酮糖中间体" },
  { en: "retro-aldol cleavage", zh: "逆醛醇缩合" },
  { en: "C2/C3 aldehyde intermediates", zh: "C2/C3 醛类中间体" },
  { en: "redox with HCO₃⁻", zh: "与 HCO₃⁻ 氧化还原" },
  { en: "formic acid / formate", zh: "甲酸 / 甲酸盐" },
]

const BIOMASS_SIDE_PATHWAY = [
  { en: "dehydration / rearrangement", zh: "脱水 / 重排" },
  { en: "lactic acid, acetic acid, glycolic acid", zh: "乳酸、乙酸、乙醇酸" },
]

const BIOMASS_DATA_FIELDS = [
  { en: "Catalyst identity", zh: "催化剂身份", status: "needs-review" },
  { en: "MOF scaffold", zh: "MOF 骨架", status: "needs-review" },
  { en: "Metal node or modifier", zh: "金属节点或改性金属", status: "pending" },
  { en: "Functional group", zh: "官能团", status: "pending" },
  { en: "Reaction condition", zh: "反应条件", status: "needs-review" },
  { en: "Product yield profile", zh: "产物产率分布", status: "private" },
  { en: "Characterization evidence", zh: "表征证据", status: "pending" },
  { en: "Mechanism evidence", zh: "机理证据", status: "pending" },
  { en: "Stability evidence", zh: "稳定性证据", status: "pending" },
  { en: "Source / confidentiality status", zh: "来源与保密状态", status: "private" },
]

const CANDIDATES = [
  {
    id: "uio66nh2",
    name: "UiO-66-NH2",
    metalCenter: "Zr4+",
    bimetallic: "No",
    linker: "NH2-BDC",
    poreSizeA: 5.8,
    surfaceArea: 1050,
    co2Uptake: 3.4,
    bandGap: 3.2,
    waterStability: "High",
    thermalStability: "High",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "Zr cluster + amine functionality",
    reactionClasses: ["co2_conversion", "photocatalysis"],
  },
  {
    id: "pcn222",
    name: "PCN-222",
    metalCenter: "Zr4+",
    bimetallic: "Possible",
    linker: "TCPP",
    poreSizeA: 14.0,
    surfaceArea: 2200,
    co2Uptake: 4.1,
    bandGap: 2.1,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "porphyrinic linker, metalation handle",
    reactionClasses: ["photocatalysis", "electrocatalysis", "co2_conversion"],
  },
  {
    id: "hkust1",
    name: "HKUST-1",
    metalCenter: "Cu2+",
    bimetallic: "No",
    linker: "BTC",
    poreSizeA: 9.0,
    surfaceArea: 1850,
    co2Uptake: 4.82,
    bandGap: 2.8,
    waterStability: "Low",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "open Cu site",
    reactionClasses: ["biomass_conversion", "co2_conversion"],
  },
  {
    id: "fe_mil100",
    name: "Fe-MIL-100",
    metalCenter: "Fe3+",
    bimetallic: "No",
    linker: "BTC",
    poreSizeA: 25.0,
    surfaceArea: 2800,
    co2Uptake: 3.6,
    bandGap: 2.4,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "Fe oxo cluster",
    reactionClasses: ["biomass_conversion", "electrocatalysis"],
  },
  {
    id: "nu1000",
    name: "NU-1000",
    metalCenter: "Zr4+",
    bimetallic: "Possible",
    linker: "TBAPy",
    poreSizeA: 30.0,
    surfaceArea: 2320,
    co2Uptake: 2.7,
    bandGap: 2.6,
    waterStability: "High",
    thermalStability: "High",
    evidenceLevel: "Low-medium",
    sustainabilityRisk: "Medium",
    activeSiteHypothesis: "Zr node + pyrene linker, post-synthetic handle",
    reactionClasses: ["photocatalysis", "custom_task"],
  },
  {
    id: "mof74mg",
    name: "MOF-74-Mg",
    metalCenter: "Mg2+",
    bimetallic: "No",
    linker: "DOBDC",
    poreSizeA: 11.0,
    surfaceArea: 1495,
    co2Uptake: 8.61,
    bandGap: 4.0,
    waterStability: "Medium",
    thermalStability: "Medium",
    evidenceLevel: "Low-medium",
    sustainabilityRisk: "Low",
    activeSiteHypothesis: "open Mg site, strong CO₂ adsorption cue",
    reactionClasses: ["co2_conversion", "custom_task"],
  },
]

const WEIGHTS = DEFAULT_SCORING_WEIGHTS.catalysis

const LEGACY_WEIGHTS = {
  co2Affinity: 0.16,
  activeSite: 0.18,
  poreAccessibility: 0.14,
  stability: 0.16,
  electronicProperty: 0.13,
  sustainability: 0.11,
  evidenceConfidence: 0.12,
}

const zhTask = (task, lang) => lang === "zh" ? (task.nameZh || task.zh || task.labelZh || task.en || task.label || task.name) : (task.name || task.en || task.label || task.zh || task.labelZh)
const scoreMap = { High: 9, Medium: 6.4, Low: 3.8, "Low-medium": 5.2, Possible: 7.2, No: 5.6 }
const riskMap = { Low: 8.7, Medium: 6.2, High: 3.4 }
const evidenceMap = { High: 9, Medium: 7, "Low-medium": 5.3, Low: 3.8 }

function normalizeCandidate(item) {
  const metals = Array.isArray(item.metalNodes) ? item.metalNodes : item.metalCenter ? [item.metalCenter] : []
  return {
    ...item,
    metalCenter: item.metalCenter || metals.join(", ") || "unmarked",
    bimetallic: item.bimetallic === true ? "Yes" : item.bimetallic === false ? "No" : item.bimetallic || "No",
    activeSiteHypothesis: Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis,
    sustainabilityRisk: item.sustainabilityRisk || (item.costLevel === "High" || item.toxicityConcern === "High" ? "High" : item.costLevel === "Medium" || item.toxicityConcern === "Medium" ? "Medium" : "Low"),
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    fieldSources: item.fieldSources || undefined,
  }
}

function computeCatalysisScore(candidate, taskId, weights = WEIGHTS) {
  const taskMatch = candidate.reactionClasses.includes(taskId) ? 1 : taskId === "custom_task" ? 0.78 : 0.62
  const co2Affinity = Math.min(10, Number(candidate.co2Uptake || 0) / 0.9)
  const activeSite = Math.min(10, (candidate.activeSiteHypothesis.includes("open") ? 8.4 : 6.7) + (candidate.bimetallic === "Possible" ? 0.8 : 0))
  const poreAccessibility = Math.max(0, Math.min(10, 10 - Math.abs(Number(candidate.poreSizeA || 0) - 12) / 2.8 + Number(candidate.surfaceArea || 0) / 1800))
  const stability = ((scoreMap[candidate.waterStability] || 5) + (scoreMap[candidate.thermalStability] || 5)) / 2
  const electronicProperty = Math.max(0, Math.min(10, 10 - Math.abs(Number(candidate.bandGap || 0) - 2.4) * 2.1))
  const sustainability = riskMap[candidate.sustainabilityRisk] || 5
  const evidenceConfidence = evidenceMap[candidate.evidenceLevel] || 4
  const parts = { co2Affinity, activeSite, poreAccessibility, stability, electronicProperty, sustainability, evidenceConfidence }
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + parts[key] * weight, 0)
  const score = Math.max(0, Math.min(10, weighted * taskMatch))
  return { score: Number(score.toFixed(1)), parts }
}

function zhValue(value, lang) {
  if (lang !== "zh") return value
  return {
    High: "高",
    Medium: "中",
    Low: "低",
    "Low-medium": "低-中",
    Possible: "可能",
    No: "否",
  }[value] || value
}

function curationStatusLabel(status, lang) {
  const labels = {
    curated: lang === "zh" ? "已整理" : "curated",
    "needs-review": lang === "zh" ? "需复核" : "needs review",
    pending: lang === "zh" ? "待补充" : "pending",
    planned: lang === "zh" ? "计划整理" : "Planned curation",
    private: lang === "zh" ? "私有草稿" : "private",
    "schema-only": lang === "zh" ? "仅字段结构" : "schema only",
  }
  return labels[status] || labels.pending
}

function curationTone(status) {
  if (status === "curated") return "calc"
  if (status === "needs-review") return "proxy"
  return "warn"
}

function pendingCatalysisValue(value, lang) {
  if (value == null || value === "" || value === "pending") return lang === "zh" ? "待补充" : "Pending"
  if (value === "planned") return lang === "zh" ? "计划整理" : "Planned curation"
  return value
}

function metricStatus(metric, lang) {
  if (!metric || metric.value == null || metric.unit === "pending") return lang === "zh" ? "待补充" : "Pending"
  return `${metric.value} ${metric.unit || ""}`.trim()
}

function stabilityStatus(metric, lang) {
  if (!metric || metric.cycleCount == null || metric.durationH == null || metric.structureRetained === "pending") {
    return lang === "zh" ? "待补充" : "Pending"
  }
  return `${metric.cycleCount} cycles · ${metric.durationH} h`
}

function compactList(value, lang) {
  if (Array.isArray(value)) {
    if (!value.length || value.every(item => item == null || item === "" || item === "pending")) return lang === "zh" ? "待补充" : "Pending"
    return value.map(item => pendingCatalysisValue(item, lang)).join(", ")
  }
  return pendingCatalysisValue(value, lang)
}

function PathwayPills({ items, lang, t, tone = "default" }) {
  const values = Array.isArray(items) ? items : [items]
  const colors = tone === "accent"
    ? { bg: t.badgeInfoBg, border: t.borderStrong || t.border, text: t.accentText }
    : { bg: t.surface, border: t.border, text: t.muted }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {values.map(item => (
        <span key={item} style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 999,
          color: colors.text,
          fontSize: 10,
          fontWeight: 750,
          lineHeight: 1.25,
          padding: "5px 8px",
        }}>
          {pendingCatalysisValue(item, lang)}
        </span>
      ))}
    </div>
  )
}

function CatalysisRecordPreview({ records, status, lang, t }) {
  const headers = lang === "zh"
    ? ["路径", "目标产物", "相关模式", "关键指标", "MOF 相关作用", "整理重点", "证据", "来源"]
    : ["Pathway", "Target products", "Relevant modes", "Key metrics", "MOF relevance", "Curation focus", "Evidence", "Source"]

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Callout tone="info">
        {lang === "zh"
          ? "这些记录用于定义未来催化数据接入的整理结构，不是已验证性能记录。"
          : "These records define the curation schema for future catalysis data ingestion. They are not validated performance entries."}
      </Callout>
      {status === "loading" && <Callout tone="info">{lang === "zh" ? "正在加载催化记录结构…" : "Loading catalysis record schema..."}</Callout>}
      {status === "error" && <Callout tone="warn">{lang === "zh" ? "催化记录结构加载失败。请刷新页面或检查 GitHub Pages 网络访问。" : "Catalysis record schema could not be loaded. Please refresh or check GitHub Pages network access."}</Callout>}
      {status === "empty" && <Callout tone="warn">{lang === "zh" ? "暂无催化记录结构。" : "No catalysis record schema is available."}</Callout>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 1040, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {headers.map(head => (
                <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}`, textTransform: "uppercase" }}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.recordId}>
                {[
                  record.pathway,
                  compactList(record.targetProducts, lang),
                  compactList(record.relevantModes || record.reactionCondition?.mode, lang),
                  compactList(record.keyMetrics || record.activityMetric?.type, lang),
                  compactList(record.mofRelevance || record.activeSiteHypothesis, lang),
                  compactList(record.curationFocus, lang),
                  record.evidenceLevel,
                  record.sourceStatus,
                ].map((value, index) => (
                  <td key={`${record.recordId}-${index}`} style={{ padding: "9px 8px", borderBottom: `1px solid ${t.divider}`, color: index === 0 ? t.textStrong : t.muted, fontSize: 11, lineHeight: 1.45, verticalAlign: "top", fontWeight: index === 0 ? 850 : 600 }}>
                    {index === 7 && record.sourceStatus === "pending"
                      ? (lang === "zh" ? "来源待补充" : "Source pending")
                      : pendingCatalysisValue(value, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {records.map(record => (
          <BasisBadge key={record.recordId} tone={curationTone(record.curationStatus)}>
            {record.taskFamily}: {curationStatusLabel(record.curationStatus, lang)}
          </BasisBadge>
        ))}
      </div>
    </div>
  )
}

// ── Case Study: CO₂ Conversion Candidate Prioritization ──────────────────────

const CASE_DIMS = [
  { key: "co2Affinity",       labelEn: "CO₂ affinity",       labelZh: "CO₂ 亲和力" },
  { key: "activeSite",        labelEn: "Active site",         labelZh: "活性位点" },
  { key: "poreAccessibility", labelEn: "Pore accessibility",  labelZh: "孔道可及性" },
  { key: "stability",         labelEn: "Stability",           labelZh: "稳定性" },
  { key: "electronicProperty",labelEn: "Electronic property", labelZh: "电子性质" },
  { key: "evidenceConfidence",labelEn: "Evidence confidence", labelZh: "证据置信度" },
]

const WORKFLOW_STEPS = [
  { enLabel: "Task",        zhLabel: "任务",    enVal: "CO₂ conversion",           zhVal: "CO₂ 转化" },
  { enLabel: "Dataset",     zhLabel: "数据集",  enVal: "Real Seed / Demo fallback", zhVal: "真实种子 / 演示回退" },
  { enLabel: "Descriptors", zhLabel: "描述符",  enVal: "CO₂ uptake · metal nodes · pore size · surface area · stability · evidence level", zhVal: "CO₂ 吸附量 · 金属节点 · 孔径 · 比表面积 · 稳定性 · 证据等级" },
  { enLabel: "Scoring",     zhLabel: "评分",    enVal: "Rule-based Catalysis Potential Score", zhVal: "规则驱动催化潜力分" },
  { enLabel: "Output",      zhLabel: "输出",    enVal: "Candidate priority ranking", zhVal: "候选材料优先级排序" },
]

function pendingLabel(val, lang) {
  if (val == null || val === "" || val === "unknown" || val === "pending") {
    return lang === "zh" ? "待整理" : "Pending curation"
  }
  return val
}

function ScoreBar({ value, max = 10, color, t }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100))
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || t.accent, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ color: t.subtle, fontSize: 10, minWidth: 24, textAlign: "right" }}>{Number(value).toFixed(1)}</span>
    </div>
  )
}

function CaseStudyCO2({ lang, t, isNarrow, isMobile, realSeedCandidates, demoCandidates, weights }) {
  const [open, setOpen] = useState(true)

  // Prefer real seed; fall back to demo
  const sourceData = realSeedCandidates.length > 0 ? realSeedCandidates : demoCandidates
  const usingRealSeed = realSeedCandidates.length > 0
  const dataLabel = usingRealSeed
    ? (lang === "zh" ? "真实种子数据集" : "Real Seed Dataset")
    : (lang === "zh" ? "演示数据集（回退）" : "Demo Dataset (fallback)")

  // Score all candidates for CO₂ conversion task
  const TASK_ID = "co2_conversion"
  const scored = sourceData
    .map(c => {
      const norm = normalizeCandidate(c)
      const result = computeCatalysisScore(norm, TASK_ID, weights)
      return { ...norm, score: result.score, parts: result.parts }
    })
    .sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, 3)
  const RANK_COLORS = [t.accent, t.accentSoft || t.accent, t.subtle]
  const RANK_LABELS = ["#1", "#2", "#3"]

  const dimColor = (idx) => [t.accent, t.success || t.accent, t.warn || t.accent, t.validationAccent || t.accent, t.sensitivityAccent || t.accent, t.accentSoft || t.accent][idx % 6]

  return (
    <details open={open} onToggle={e => setOpen(e.currentTarget.open)}
      style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 10, padding: 16 }}>
      <summary style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: t.accentText, fontSize: 14, fontWeight: 800 }}>
          {lang === "zh" ? "案例研究：CO₂ 转化候选材料优先级排序" : "Case Study: CO₂ Conversion Candidate Prioritization"}
        </span>
        <span style={{ background: t.badgeInfoBg, color: t.accentText, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 7px", border: `1px solid ${t.border}` }}>
          {dataLabel}
        </span>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Disclaimer */}
        <div style={{ background: t.badgeWarnBg || "#fffbeb", border: `1px solid ${t.warn || "#f59e0b"}`, borderRadius: 8, padding: "9px 13px", fontSize: 12, color: t.warn || "#92400e", lineHeight: 1.65 }}>
          {lang === "zh"
            ? "该案例展示的是早期候选材料优先级排序，不是最终催化性能预测。"
            : "This case study demonstrates early-stage prioritization, not final catalytic performance prediction."}
        </div>

        {/* Workflow steps */}
        <div>
          <div style={{ color: t.subtle, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {lang === "zh" ? "工作流" : "Workflow"}
          </div>
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.enLabel} style={{ display: "flex", alignItems: "stretch", minWidth: 0 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 11px", minWidth: isMobile ? 120 : 0 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                    {lang === "zh" ? step.zhLabel : step.enLabel}
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 700, lineHeight: 1.45 }}>
                    {lang === "zh" ? step.zhVal : step.enVal}
                  </div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: t.faint, fontSize: 12 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top candidates */}
        <div>
          <div style={{ color: t.subtle, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {lang === "zh" ? `Top ${top3.length} 候选材料` : `Top ${top3.length} Candidates`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {top3.map((c, idx) => (
              <div key={c.id || c.name} style={{ background: t.surface, border: `1px solid ${idx === 0 ? (t.borderStrong || t.accent) : t.border}`, borderRadius: 9, padding: 13, display: "flex", flexDirection: "column", gap: 9 }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ background: RANK_COLORS[idx], color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 4, padding: "1px 6px" }}>{RANK_LABELS[idx]}</span>
                      <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{c.name}</span>
                    </div>
                    <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4 }}>
                      {pendingLabel(c.metalCenter, lang)} · {pendingLabel(c.linker, lang)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: t.accentText, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{c.score}</div>
                    <div style={{ color: t.faint, fontSize: 9 }}>{lang === "zh" ? "催化潜力分" : "Catalysis score"}</div>
                  </div>
                </div>

                {/* Key descriptors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {[
                    [lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", c.co2Uptake != null ? `${c.co2Uptake} mmol/g` : null],
                    [lang === "zh" ? "孔径" : "Pore size", c.poreSizeA != null ? `${c.poreSizeA} Å` : null],
                    [lang === "zh" ? "比表面积" : "Surface area", c.surfaceArea != null ? `${Number(c.surfaceArea).toLocaleString()} m²/g` : null],
                    [lang === "zh" ? "水稳定性" : "Water stability", zhValue(c.waterStability, lang)],
                    [lang === "zh" ? "证据等级" : "Evidence level", c.evidenceLevel],
                    [lang === "zh" ? "任务匹配" : "Task match", c.reactionClasses?.includes(TASK_ID) ? (lang === "zh" ? "✓ 匹配" : "✓ matched") : (lang === "zh" ? "○ 推断" : "○ inferred")],
                  ].map(([label, val]) => (
                    <div key={label} style={{ minWidth: 0 }}>
                      <div style={{ color: t.faint, fontSize: 9, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ color: val ? t.textStrong : t.faint, fontSize: 11, fontWeight: 600, fontStyle: val ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pendingLabel(val, lang)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score breakdown bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>
                    {lang === "zh" ? "评分维度" : "Score breakdown"}
                  </div>
                  {CASE_DIMS.map((dim, di) => (
                    <div key={dim.key} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 5, alignItems: "center" }}>
                      <div style={{ color: t.subtle, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lang === "zh" ? dim.labelZh : dim.labelEn}
                      </div>
                      <ScoreBar value={c.parts?.[dim.key] ?? 0} color={dimColor(di)} t={t} />
                    </div>
                  ))}
                </div>

                {/* Real-seed curation note */}
                {usingRealSeed && c.curationNote && (
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, fontStyle: "italic", borderTop: `1px solid ${t.border}`, paddingTop: 7 }}>
                    {c.curationNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shared limitations + recommended validation */}
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 10 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.warn || "#b45309", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              {lang === "zh" ? "当前局限" : "Current limitations"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {(lang === "zh" ? [
                "CO₂ 吸附量字段在 Real Seed Dataset 中暂为空值，评分基于活性位点和孔道假设。",
                "规则权重未经反应条件校准，不可等同于 GCMC 或 IAST 结果。",
                "pore accessibility 对 null 孔径输入默认评分，不反映实际孔道结构。",
              ] : [
                "CO₂ uptake is null in Real Seed records; scoring relies on active site and pore hypotheses.",
                "Rule weights are not calibrated to reaction conditions and cannot substitute GCMC or IAST results.",
                "Pore accessibility defaults to a mid-range score when poreSizeA is null.",
              ]).map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.accentSoft, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              {lang === "zh" ? "推荐验证步骤" : "Recommended validation"}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {(lang === "zh" ? [
                "补充 CO₂ 吸附等温线（BET + 低压 CO₂ 测量）。",
                "文献或 GCMC 验证 CO₂/N₂ 混合气选择性。",
                "在定义反应条件下测试催化活性（温度、溶剂、光/电化学）。",
                "将规则分排序结果与后续实验 TON/TOF 进行比较。",
              ] : [
                "Measure CO₂ adsorption isotherm (BET + low-pressure CO₂).",
                "Validate CO₂/N₂ mixture selectivity via literature or GCMC.",
                "Test catalytic activity under defined conditions (temperature, solvent, light/electrochemical).",
                "Compare rule-score ranking against future experimental TON/TOF.",
              ]).map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

      </div>
    </details>
  )
}

export function CatalysisLabTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("real-seed")
  const [taskId, setTaskId] = useState("co2_conversion")
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState(TASKS)
  const [catalysisRecords, setCatalysisRecords] = useState([])
  const [recordsStatus, setRecordsStatus] = useState("loading")
  const [demoCandidates, setDemoCandidates] = useState(CANDIDATES)
  const [realSeedCandidates, setRealSeedCandidates] = useState([])
  const [candidates, setCandidates] = useState(CANDIDATES)
  const [weights, setWeights] = useState(WEIGHTS)
  const [dataStatus, setDataStatus] = useState("loading")
  const [selectedPathwayId, setSelectedPathwayId] = useState(CO2_CONVERSION_PATHWAYS[0].id)
  const [hoveredPathwayId, setHoveredPathwayId] = useState(null)
  const [normalizationTemplateStatus, setNormalizationTemplateStatus] = useState("idle")
  const [filters, setFilters] = useState({
    metalCenter: "all",
    bimetallic: "all",
    poreMin: 3,
    poreMax: 35,
    areaMin: 0,
    areaMax: 5000,
    co2Min: 0,
    bandGapMin: 0,
    bandGapMax: 6,
    waterStability: "all",
    thermalStability: "all",
    evidenceLevel: "all",
    sustainabilityRisk: "all",
  })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let active = true
    setDataStatus("loading")
    Promise.all([
      getMofCandidates({ mode: "demo", throwOnError: true }),
      getMofCandidates({ mode: "real-seed", throwOnError: true }),
      getCatalysisTasks({ throwOnError: true }),
      getCatalysisRecords({ throwOnError: true }),
      getScoringWeights({ throwOnError: true }),
    ]).then(([candidateRows, realSeedRows, taskRows, recordRows, weightRows]) => {
      if (!active) return
      const demo = Array.isArray(candidateRows) && candidateRows.length ? candidateRows.map(normalizeCandidate) : CANDIDATES
      setDemoCandidates(demo)
      setCandidates(demo)
      if (Array.isArray(realSeedRows) && realSeedRows.length) setRealSeedCandidates(realSeedRows.map(normalizeCandidate))
      if (Array.isArray(taskRows) && taskRows.length) setTasks(taskRows)
      const nextRecords = Array.isArray(recordRows) ? recordRows : []
      setCatalysisRecords(nextRecords)
      setRecordsStatus(nextRecords.length ? "loaded" : "empty")
      if (weightRows?.CatalysisLab) setWeights(weightRows.CatalysisLab)
      else if (weightRows?.catalysisPotentialScore) setWeights(weightRows.catalysisPotentialScore)
      setDataStatus(demo.length || realSeedRows?.length || taskRows?.length ? "loaded" : "empty")
    }).catch((error) => {
      console.warn("CatalysisLab data load failed.", error)
      if (!active) return
      setDemoCandidates(CANDIDATES)
      setCandidates(CANDIDATES)
      setTasks(TASKS)
      setCatalysisRecords([])
      setRecordsStatus("error")
      setWeights(LEGACY_WEIGHTS)
      setDataStatus("error")
    })
    return () => { active = false }
  }, [])

  // Sync active candidates when dataMode changes
  useEffect(() => {
    setCandidates(dataMode === "real-seed" ? realSeedCandidates : demoCandidates)
    setSelected(null)
  }, [dataMode, demoCandidates, realSeedCandidates])

  const task = tasks.find(item => item.id === taskId) || tasks[0]
  const metals = Array.from(new Set(candidates.map(item => item.metalCenter))).sort()

  const ranked = useMemo(() => {
    return candidates
      .map(candidate => {
        const catalysis = calculateCatalysisScore(candidate, task, weights)
        return {
          ...candidate,
          catalysis,
          score: catalysis.score,
          scoreBreakdown: getScoreBreakdown(candidate, "catalysis", task),
          weightContribution: getWeightContribution(candidate, weights, "catalysis", task),
        }
      })
      .filter(item => filters.metalCenter === "all" || item.metalCenter === filters.metalCenter)
      .filter(item => filters.bimetallic === "all" || item.bimetallic === filters.bimetallic)
      // null-safe: real-seed records with null numeric fields pass through filters
      .filter(item => item.poreSizeA == null || (Number(item.poreSizeA) >= Number(filters.poreMin) && Number(item.poreSizeA) <= Number(filters.poreMax)))
      .filter(item => item.surfaceArea == null || (Number(item.surfaceArea) >= Number(filters.areaMin) && Number(item.surfaceArea) <= Number(filters.areaMax)))
      .filter(item => item.co2Uptake == null || Number(item.co2Uptake) >= Number(filters.co2Min))
      .filter(item => item.bandGap == null || (Number(item.bandGap) >= Number(filters.bandGapMin) && Number(item.bandGap) <= Number(filters.bandGapMax)))
      .filter(item => filters.waterStability === "all" || item.waterStability === filters.waterStability)
      .filter(item => filters.thermalStability === "all" || item.thermalStability === filters.thermalStability)
      .filter(item => filters.evidenceLevel === "all" || item.evidenceLevel === filters.evidenceLevel)
      .filter(item => filters.sustainabilityRisk === "all" || item.sustainabilityRisk === filters.sustainabilityRisk)
      .sort((a, b) => b.catalysis.score - a.catalysis.score)
  }, [candidates, taskId, filters, weights, task])

  const selectedPathway = useMemo(() => (
    CO2_CONVERSION_PATHWAYS.find(pathway => pathway.id === selectedPathwayId) || CO2_CONVERSION_PATHWAYS[0]
  ), [selectedPathwayId])

  const activeCandidate = selected || ranked[0]
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const copyNormalizationTemplate = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(NORMALIZATION_TEMPLATE)
        setNormalizationTemplateStatus("copied")
      } else {
        setNormalizationTemplateStatus("fallback")
      }
    } catch {
      setNormalizationTemplateStatus("fallback")
    }
  }
  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%" }
  const filterFields = (
    <>
      <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
        {lang === "zh" ? "金属中心" : "metal center"}
        <select value={filters.metalCenter} onChange={e => updateFilter("metalCenter", e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {metals.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
        {lang === "zh" ? "双金属体系" : "bimetallic system"}
        <select value={filters.bimetallic} onChange={e => updateFilter("bimetallic", e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          <option value="No">{zhValue("No", lang)}</option>
          <option value="Yes">{lang === "zh" ? "是" : "Yes"}</option>
          <option value="Possible">{zhValue("Possible", lang)}</option>
        </select>
      </label>
      {[
        ["poreMin", lang === "zh" ? "最小孔径 Å" : "pore min Å"],
        ["poreMax", lang === "zh" ? "最大孔径 Å" : "pore max Å"],
        ["areaMin", lang === "zh" ? "最小比表面积" : "surface area min"],
        ["areaMax", lang === "zh" ? "最大比表面积" : "surface area max"],
        ["co2Min", "CO₂ uptake min"],
        ["bandGapMin", lang === "zh" ? "最小 band gap" : "band gap min"],
        ["bandGapMax", lang === "zh" ? "最大 band gap" : "band gap max"],
      ].map(([key, label]) => (
        <label key={key} style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
          {label}
          <input type="number" value={filters[key]} onChange={e => updateFilter(key, e.target.value)} style={controlStyle} />
        </label>
      ))}
      {[
        ["waterStability", lang === "zh" ? "水稳定性" : "water stability", ["High", "Medium", "Low"]],
        ["thermalStability", lang === "zh" ? "热稳定性" : "thermal stability", ["High", "Medium", "Low"]],
        ["evidenceLevel", lang === "zh" ? "证据等级" : "evidence level", ["experimental", "literature-supported", "simulation-supported", "ML-predicted", "rule-based", "needs-validation", "Medium", "Low-medium", "Low"]],
        ["sustainabilityRisk", lang === "zh" ? "可持续性风险" : "sustainability risk", ["low", "medium", "high", "Low", "Medium", "High"]],
      ].map(([key, label, options]) => (
        <label key={key} style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
          {label}
          <select value={filters[key]} onChange={e => updateFilter(key, e.target.value)} style={controlStyle}>
            <option value="all">{lang === "zh" ? "全部" : "all"}</option>
            {options.map(option => <option key={option} value={option}>{zhValue(option, lang)}</option>)}
          </select>
        </label>
      ))}
    </>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="CatalysisLab"
        subtitle={lang === "zh"
          ? "面向 CO₂ 转化与可持续反应任务的 MOF 催化探索模块。"
          : "Task-oriented MOF catalysis exploration for CO₂ conversion and sustainability-related reactions."}
        meta={lang === "zh" ? "CO₂ 转化 · 任务家族 · 整理清单 · 记录结构 · 候选优先级" : "CO₂ conversion · task families · curation checklist · record schema · candidate priority"}
        action={
          <>
            <BasisBadge tone="warn">{lang === "zh" ? "planned curation / 需要验证" : "planned curation / needs validation"}</BasisBadge>
            <CopyLinkButton hash="catalysis" ariaLabel={lang === "zh" ? "复制 CatalysisLab 链接" : "Copy CatalysisLab link"} />
          </>
        }
      />
      <Callout tone="info">
        {lang === "zh"
          ? "本模块用于整理催化候选材料、反应任务、活性描述符、选择性信号、反应条件和证据状态，不代表已完成实验验证的催化性能结论。"
          : "This module organizes catalyst candidates, reaction tasks, activity descriptors, selectivity signals, reaction conditions, and evidence status. It does not claim experimentally validated catalytic performance."}
      </Callout>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <DataModeToggle value={dataMode} onChange={setDataMode} lang={lang} />
        <span style={{ color: t.faint, fontSize: 11 }}>
          {dataMode === "real-seed"
            ? (lang === "zh" ? `${realSeedCandidates.length} 条真实种子记录 — 缺失字段评分为 0` : `${realSeedCandidates.length} real seed records — null fields score as 0`)
            : (lang === "zh" ? `${demoCandidates.length} 条演示记录` : `${demoCandidates.length} demo records`)}
        </span>
      </div>

      {dataMode === "real-seed" && <RealSeedCallout lang={lang} />}
      {dataMode === "demo" && <DemoModeBanner lang={lang} />}
      {dataStatus === "loading" && (
        <Callout tone="info">{lang === "zh" ? "正在加载 CatalysisLab 数据…" : "Loading CatalysisLab data..."}</Callout>
      )}
      {dataStatus === "error" && (
        <Callout tone="warn">
          {lang === "zh"
            ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。当前页面会使用内置演示上下文继续展示。"
            : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages. This view continues with built-in demo context."}
        </Callout>
      )}
      {dataStatus === "empty" && (
        <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
      )}

      <ResultLayer number="01" title={lang === "zh" ? "催化任务家族" : "Catalysis task families"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {TASK_FAMILIES.map(family => {
            const priority = family.id === "co2_conversion"
            return (
              <button
                key={family.id}
                type="button"
                onClick={() => { setTaskId(family.id); setSelected(null) }}
                style={{
                  textAlign: "left",
                  background: priority ? t.badgeInfoBg : t.panel,
                  border: `1px solid ${priority ? t.borderStrong : t.border}`,
                  borderRadius: 8,
                  padding: 13,
                  color: t.text,
                  cursor: "pointer",
                  minHeight: 150,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 880 }}>{lang === "zh" ? family.zh : family.en}</div>
                  {priority && <BasisBadge tone="info">{lang === "zh" ? family.badgeZh : family.badgeEn}</BasisBadge>}
                </div>
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 9 }}>
                  {lang === "zh" ? family.bodyZh : family.bodyEn}
                </div>
              </button>
            )
          })}
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "CO₂ 转化路径探索器" : "CO₂ Conversion Pathway Explorer"}>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "0 0 12px", maxWidth: 820 }}>
          {lang === "zh"
            ? "按产物类型、反应模式、MOF 作用、关键指标和数据整理重点理解 CO₂ 转化路径。"
            : "Explore CO₂ conversion pathways by product family, reaction mode, MOF role, key metrics, and curation priorities."}
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(230px, 0.86fr) minmax(0, 2.14fr)",
          gap: isMobile ? 12 : 14,
          alignItems: "stretch",
        }}>
          <div
            role="tablist"
            aria-label={lang === "zh" ? "CO₂ 转化路径选择器" : "CO₂ conversion pathway selector"}
            style={{
              display: isMobile ? "flex" : "grid",
              gap: 8,
              overflowX: isMobile ? "auto" : "visible",
              paddingBottom: isMobile ? 4 : 0,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {CO2_CONVERSION_PATHWAYS.map(pathway => {
              const active = pathway.id === selectedPathway.id
              const hovered = hoveredPathwayId === pathway.id
              return (
                <button
                  key={pathway.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedPathwayId(pathway.id)}
                  onMouseEnter={() => setHoveredPathwayId(pathway.id)}
                  onMouseLeave={() => setHoveredPathwayId(null)}
                  style={{
                    textAlign: "left",
                    minWidth: isMobile ? 235 : "auto",
                    background: active ? t.badgeInfoBg : hovered ? t.surface : "transparent",
                    border: `1px solid ${active ? (t.borderStrong || t.accent) : t.border}`,
                    borderLeft: isMobile ? `1px solid ${active ? (t.borderStrong || t.accent) : t.border}` : `4px solid ${active ? t.accent : "transparent"}`,
                    borderRadius: 8,
                    padding: "10px 11px",
                    color: t.text,
                    cursor: "pointer",
                    transition: "background 160ms ease, border-color 160ms ease, transform 160ms ease",
                    transform: hovered && !active ? "translateY(-1px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880, lineHeight: 1.25 }}>
                        {pathway.en}
                      </div>
                      <div style={{ color: t.subtle, fontSize: 11, fontWeight: 750, lineHeight: 1.35, marginTop: 2 }}>
                        {pathway.zh}
                      </div>
                    </div>
                    <span style={{
                      background: active ? t.panel : t.surface,
                      border: `1px solid ${t.border}`,
                      borderRadius: 999,
                      color: active ? t.accentText : t.faint,
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "3px 6px",
                      whiteSpace: "nowrap",
                    }}>
                      {lang === "zh" ? pathway.tagZh : pathway.tagEn}
                    </span>
                  </div>
                  <div style={{ color: active ? t.accentText : t.faint, fontSize: 10, fontWeight: 700, lineHeight: 1.45, marginTop: 7 }}>
                    {(lang === "zh" ? pathway.selectorProductsZh : pathway.selectorProductsEn).join(" · ")}
                  </div>
                </button>
              )
            })}
          </div>

          <article style={{
            background: t.panel,
            border: `1px solid ${t.borderStrong || t.border}`,
            borderRadius: 10,
            boxShadow: t.shadowSm,
            minWidth: 0,
            padding: isMobile ? 14 : 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.textStrong, fontSize: isMobile ? 16 : 18, fontWeight: 920, lineHeight: 1.2 }}>
                  {lang === "zh" ? selectedPathway.zh : selectedPathway.en}
                </div>
                <div style={{ color: t.subtle, fontSize: 12, fontWeight: 760, marginTop: 4 }}>
                  {lang === "zh" ? selectedPathway.en : selectedPathway.zh}
                </div>
              </div>
              <BasisBadge tone="info">{lang === "zh" ? selectedPathway.tagZh : selectedPathway.tagEn}</BasisBadge>
            </div>

            <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "12px 0 0", maxWidth: 760 }}>
              {lang === "zh" ? selectedPathway.overviewZh : selectedPathway.overviewEn}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 10,
              marginTop: 14,
            }}>
              {[
                [lang === "zh" ? "典型产物" : "Typical products", lang === "zh" ? selectedPathway.productsZh : selectedPathway.productsEn, "accent"],
                [lang === "zh" ? "相关反应模式" : "Relevant modes", lang === "zh" ? selectedPathway.modesZh : selectedPathway.modesEn, "default"],
                [lang === "zh" ? "关键指标" : "Key metrics", lang === "zh" ? selectedPathway.metricsZh : selectedPathway.metricsEn, "default"],
                [lang === "zh" ? "MOF 相关作用" : "MOF relevance", lang === "zh" ? selectedPathway.mofRelevanceZh : selectedPathway.mofRelevanceEn, "default"],
                [lang === "zh" ? "数据整理重点" : "Curation focus", lang === "zh" ? selectedPathway.curationFocusZh : selectedPathway.curationFocusEn, "default"],
              ].map(([label, values, tone]) => (
                <section key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, letterSpacing: 0, textTransform: "uppercase", marginBottom: 8 }}>
                    {label}
                  </div>
                  <PathwayPills items={values} lang={lang} t={t} tone={tone} />
                </section>
              ))}
            </div>

            <div style={{ marginTop: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, textTransform: "uppercase" }}>
                {lang === "zh" ? "注意事项" : "Caution"}
              </div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 5 }}>
                {lang === "zh" ? selectedPathway.cautionZh : selectedPathway.cautionEn}
              </div>
            </div>
          </article>
        </div>

        <div style={{ marginTop: 12 }}>
          <Callout tone="info">
            <strong>{lang === "zh" ? "跨路径比较注意事项：" : "Cross-pathway comparison cautions: "}</strong>
            {lang === "zh"
              ? "不同 CO₂ 转化路径不应使用单一指标直接比较。电催化中的法拉第效率、光催化中的 TON/TOF、热催化中的转化率/收率，以及环加成反应中的产率，分别对应不同反应语境。"
              : "CO₂ conversion pathways should not be compared using a single metric. Electrocatalytic Faradaic efficiency, photocatalytic TON/TOF, thermal conversion/yield, and cycloaddition yield describe different reaction contexts."}
          </Callout>
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "生物质辅助 CO₂/HCO₃⁻ 转化" : "Biomass-assisted CO₂/HCO₃⁻ Conversion"}>
        <div style={{ display: "grid", gap: 12 }}>
          <Callout tone="info">
            {lang === "zh"
              ? "面向 MOF 催化葡萄糖或生物质衍生物与 CO₂/HCO₃⁻ 来源协同转化为甲酸及相关有机酸的可整理路径。本区块是数据整理框架；除非记录链接到公开文献或经合作者确认的数据，否则不代表已验证催化性能。"
              : "A curation-ready pathway for MOF-catalyzed glucose or biomass derivative conversion with CO₂/HCO₃⁻ sources toward formic acid and related organic acids. This section is a curation framework; it does not claim validated catalytic performance unless records are linked to public literature or confirmed collaborator data."}
          </Callout>

          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 12 }}>
            <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "反应语境" : "Reaction context"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 9, marginTop: 11 }}>
                {BIOMASS_CO2_CONTEXT.map(item => (
                  <div key={item.en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, textTransform: "uppercase" }}>
                      {lang === "zh" ? item.zh : item.en}
                    </div>
                    <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 750, lineHeight: 1.5, marginTop: 5 }}>
                      {lang === "zh" ? item.valueZh : item.valueEn}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                  {lang === "zh" ? "示例基准条件" : "Example baseline condition"}
                </div>
                <BasisBadge tone="proxy">{lang === "zh" ? "collaborator-context / 待复核" : "collaborator-context / pending review"}</BasisBadge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 11 }}>
                {BIOMASS_BASELINE.map(item => (
                  <div key={item.en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
                    <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, textTransform: "uppercase" }}>
                      {lang === "zh" ? item.zh : item.en}
                    </div>
                    <div style={{ color: t.accentText, fontSize: 12, fontWeight: 850, marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.55, marginTop: 10 }}>
                {lang === "zh"
                  ? "该基准条件来自合作者提供的当前反应语境，不应被视为所有 MOF 催化剂的通用最佳条件。"
                  : "This baseline reflects a collaborator-provided current reaction context and should not be treated as a universal optimum for all MOF catalysts."}
              </div>
            </article>
          </div>

          <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "反应路径框架" : "Reaction pathway map"}
              </div>
              <BasisBadge tone="warn">{lang === "zh" ? "机制假设" : "mechanism hypothesis"}</BasisBadge>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginTop: 11 }}>
              {BIOMASS_PATHWAY_STEPS.map((step, index) => (
                <div key={step.en} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: 999,
                    color: index === 0 || index === BIOMASS_PATHWAY_STEPS.length - 1 ? t.accentText : t.muted,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "6px 9px",
                  }}>
                    {lang === "zh" ? step.zh : step.en}
                  </span>
                  {index < BIOMASS_PATHWAY_STEPS.length - 1 && <span style={{ color: t.faint, fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
              <span style={{ color: t.faint, fontSize: 10, fontWeight: 850 }}>{lang === "zh" ? "副路径" : "Side pathways"}:</span>
              {BIOMASS_SIDE_PATHWAY.map((step, index) => (
                <div key={step.en} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.subtle, fontSize: 10, fontWeight: 750, padding: "6px 9px" }}>
                    {lang === "zh" ? step.zh : step.en}
                  </span>
                  {index < BIOMASS_SIDE_PATHWAY.length - 1 && <span style={{ color: t.faint, fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.55, marginTop: 10 }}>
              {lang === "zh"
                ? "该机制框架需要 HPLC、GC-MS/LC-MS、NMR、同位素追踪或 DFT 等证据支持，不应被视为已完全验证路径。"
                : "This mechanism framework requires evidence from HPLC, GC-MS/LC-MS, NMR, isotope tracing, or DFT and should not be treated as a fully validated pathway."}
            </div>
          </article>

          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.2fr 0.8fr", gap: 12 }}>
            <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "催化数据字段" : "Catalyst-data fields"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 11 }}>
                {BIOMASS_DATA_FIELDS.map(field => (
                  <div key={field.en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 820 }}>{lang === "zh" ? field.zh : field.en}</div>
                    <div style={{ marginTop: 7 }}>
                      <BasisBadge tone={curationTone(field.status)}>{curationStatusLabel(field.status, lang)}</BasisBadge>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "数据集成熟度说明" : "Dataset readiness note"}
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 8 }}>
                {lang === "zh"
                  ? "当前这类合作者实验记录更适合作为结构化实验数据，而不是可直接训练的机器学习数据集。可用于机器学习的数据集需要相对统一的条件、足够样本量、明确目标变量和实验验证闭环。"
                  : "Current collaborator-style records are better treated as structured experimental records rather than a ready-to-train machine learning dataset. A useful ML dataset would require consistent conditions, sufficient sample size, clear target variables, and experimental validation."}
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.("methodology")}
                style={{ ...toolbarBtn(t), marginTop: 10, fontSize: 11 }}
              >
                {lang === "zh" ? "查看方法与边界" : "View methods & boundaries"}
              </button>
            </article>
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={lang === "zh" ? "Excel 实验表格到结构化记录" : "Excel-to-Structured Records Workflow"}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, maxWidth: 820 }}>
                {lang === "zh"
                  ? "将催化实验表格转换为可用于对比、可视化、证据追踪和未来机器学习准备的结构化记录。"
                  : "Turn catalyst experiment spreadsheets into structured records for comparison, visualization, evidence tracking, and future ML readiness."}
              </div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.55, marginTop: 6, maxWidth: 820 }}>
                {lang === "zh"
                  ? "本工作流仅说明字段结构和标准化逻辑，不导入私密表格，也不公开合作者数据。"
                  : "This workflow describes schema and normalization logic only. It does not import private spreadsheets or publish collaborator data."}
              </div>
            </div>
            <button
              type="button"
              onClick={copyNormalizationTemplate}
              aria-label={lang === "zh" ? "复制标准化模板" : "Copy normalization template"}
              style={{ ...toolbarBtn(t), fontWeight: 850, whiteSpace: "nowrap" }}
            >
              {lang === "zh" ? "复制标准化模板" : "Copy normalization template"}
            </button>
          </div>

          {normalizationTemplateStatus === "copied" && (
            <Callout tone="info">{lang === "zh" ? "模板已复制" : "Template copied"}</Callout>
          )}
          {normalizationTemplateStatus === "fallback" && (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.55 }}>
                {lang === "zh" ? "无法访问剪贴板。可从下方查看模板。" : "Clipboard access failed. The template is shown below."}
              </div>
              <pre style={{ margin: "8px 0 0", maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", color: t.subtle, fontSize: 10, lineHeight: 1.45 }}>
                {NORMALIZATION_TEMPLATE}
              </pre>
            </div>
          )}

          <Callout tone="info">
            {lang === "zh"
              ? "原始催化实验表格通常会把催化剂名称、反应条件、产物峰面积、浓度、产率和备注混在同一张表中。为了进行对比、可视化和未来机器学习，每组实验都应转换为具有明确字段的标准化记录。"
              : "Raw catalyst spreadsheets often mix catalyst names, reaction conditions, product peak areas, concentrations, yields, and notes in the same sheet. For comparison, visualization, and future machine learning, each experiment should be converted into standardized records with explicit fields."}
          </Callout>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {NORMALIZED_TABLES.map(table => (
              <article key={table.key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 13 }}>
                <div style={{ color: t.accentText, fontFamily: "monospace", fontSize: 12, fontWeight: 850 }}>{table.key}</div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
                  {lang === "zh" ? table.bodyZh : table.bodyEn}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                  {table.fields.map(field => (
                    <span key={field} style={{
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      borderRadius: 999,
                      color: t.subtle,
                      fontFamily: "monospace",
                      fontSize: 9,
                      fontWeight: 750,
                      padding: "4px 7px",
                    }}>
                      {field}
                    </span>
                  ))}
                </div>
                {(table.examplesEn || table.examplesZh) && (
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 9 }}>
                    {lang === "zh" ? table.examplesZh : table.examplesEn}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
            <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "长表转换逻辑" : "Long-format conversion"}
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 7 }}>
                {lang === "zh"
                  ? "同一组实验可能产生多种产物指标。与其把甲酸、乳酸、乙酸和乙醇酸都放在同一行的多个宽列中，EcoMOF-AI 会将每种产物拆成单独的 product_metrics 记录，并通过 runId 关联。"
                  : "A single experimental run can produce multiple product metrics. Instead of storing formic acid, lactic acid, acetic acid, and glycolic acid as separate wide columns, EcoMOF-AI treats each product as a separate product_metrics record linked by runId."}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 9, marginTop: 11 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, textTransform: "uppercase" }}>
                    {lang === "zh" ? "原始表格风格" : "Raw spreadsheet style"}
                  </div>
                  <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.65, marginTop: 6 }}>
                    run A15<br />
                    formic acid yield = pending<br />
                    lactic acid yield = pending<br />
                    acetic acid yield = pending<br />
                    glycolic acid yield = pending
                  </div>
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ color: t.faint, fontSize: 9, fontWeight: 850, textTransform: "uppercase" }}>
                    {lang === "zh" ? "结构化长表" : "Structured long format"}
                  </div>
                  <div style={{ color: t.accentText, fontSize: 10, lineHeight: 1.65, marginTop: 6 }}>
                    A15 + formic acid<br />
                    A15 + lactic acid<br />
                    A15 + acetic acid<br />
                    A15 + glycolic acid
                  </div>
                </div>
              </div>
            </article>

            <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
                {lang === "zh" ? "复用前的数据质量检查" : "Data quality checks before reuse"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7, marginTop: 10 }}>
                {NORMALIZATION_QUALITY_CHECKS.map(item => (
                  <div key={item.en} style={{ display: "flex", gap: 7, alignItems: "flex-start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 8 }}>
                    <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>✓</span>
                    <span style={{ color: t.muted, fontSize: 10, lineHeight: 1.45 }}>{lang === "zh" ? item.zh : item.en}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>
              {lang === "zh" ? "机器学习准备度首先是数据质量问题" : "ML readiness is a data-quality question"}
            </div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 7 }}>
              {lang === "zh"
                ? "催化实验表格不能直接视为可训练的机器学习数据集。只有当反应条件、催化剂身份、目标变量、样本量和验证记录足够规范时，才适合进入模型训练。早期合作阶段，EcoMOF-AI 更关注数据结构化、规则辅助优先级和面向机器学习的字段设计，而不是声称已有训练好的预测模型。"
                : "Catalysis spreadsheets should not be treated as a ready-to-train ML dataset until reaction conditions, catalyst identities, target variables, sample size, and validation records are standardized. In early collaboration stages, EcoMOF-AI focuses on data structuring, rule-based prioritization, and ML-ready field design rather than claiming a trained predictive model."}
            </div>
          </article>
        </div>
      </ResultLayer>

      <ResultLayer number="05" title={lang === "zh" ? "CO₂ 转化整理维度" : "CO₂ Conversion Curation Dimensions"}>
        <Callout tone="info">
          {lang === "zh"
            ? "CO₂ 转化记录应结合产物路径和反应模式解读。不同路径的指标在缺少相近条件语境时不应直接比较。"
            : "CO₂ conversion records should be interpreted by pathway and reaction mode. Metrics from different pathways should not be directly compared without matching condition context."}
        </Callout>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {CO2_CURATION_DIMENSIONS.map(dimension => (
            <article key={dimension.en} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? dimension.zh : dimension.en}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, marginTop: 7 }}>{dimension.items}</div>
            </article>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="06" title={lang === "zh" ? "CO₂ 转化整理清单" : "CO₂ Conversion Checklist"}>
        <Callout tone="info">
          {lang === "zh"
            ? "只有当反应任务、产物路径与目标产物、催化剂角色、条件语境、活性/选择性指标、稳定性信息和来源证据较完整时，CO₂ 转化记录才应被视为已整理记录。"
            : "A CO₂ conversion record should only be treated as curated when task, product pathway and target product, catalyst role, condition context, activity/selectivity metrics, stability information, and source evidence are available."}
        </Callout>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 9, marginTop: 12 }}>
          {CO2_CONVERSION_CHECKLIST.map(item => (
            <div key={item.key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? item.zh : item.en}</div>
              <div style={{ marginTop: 8 }}>
                <BasisBadge tone={curationTone(item.status)}>{curationStatusLabel(item.status, lang)}</BasisBadge>
              </div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="07" title={lang === "zh" ? "催化记录结构预览" : "Catalysis record schema preview"}>
        <CatalysisRecordPreview records={catalysisRecords} status={recordsStatus} lang={lang} t={t} />
      </ResultLayer>

      <ResultLayer number="08" title={lang === "zh" ? "候选材料优先级工作区" : "Candidate prioritization workspace"}>
        <Callout tone="warn">
          {lang === "zh"
            ? "以下工作区保留规则评分和候选排序，用于讨论整理优先级；它不是 CO₂ 转化真实性能结论。"
            : "The workspace below keeps rule-based scoring and candidate ranking for discussing curation priority; it is not a CO₂ conversion performance conclusion."}
        </Callout>
      </ResultLayer>

      <ResultLayer number="09" title={lang === "zh" ? "催化任务选择器" : "Catalysis task selector"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          {tasks.map(item => (
            <button key={item.id} type="button" onClick={() => { setTaskId(item.id); setSelected(null) }} style={{
              textAlign: "left",
              background: taskId === item.id ? t.badgeInfoBg : t.panel,
              border: `1px solid ${taskId === item.id ? t.borderStrong : t.border}`,
              borderRadius: 8,
              padding: 12,
              color: t.text,
              cursor: "pointer",
            }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{zhTask(item, lang)}</div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{lang === "zh" ? "规则驱动模型" : "Rule-based Model"}</div>
            </button>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="10" title={lang === "zh" ? "催化筛选器" : "Catalysis filters"}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <button type="button" onClick={() => setExpanded(prev => !prev)} style={{ ...controlStyle, display: isMobile ? "block" : "none", marginBottom: expanded ? 10 : 0 }}>
            {expanded ? (lang === "zh" ? "收起筛选器" : "Collapse filters") : (lang === "zh" ? "展开筛选器" : "Expand filters")}
          </button>
          <div style={{ display: isMobile && !expanded ? "none" : "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
            {filterFields}
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="11" title={lang === "zh" ? "Rule-based Catalysis Potential Score 排名" : "Rule-based Catalysis Potential Score ranking"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
          {ranked.length === 0 && (
            <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
          )}
          {ranked.map(candidate => (
            <UnifiedCandidateCard
              key={candidate.id}
              name={candidate.name}
              score={candidate.catalysis.score}
              scoreLabel={lang === "zh" ? "催化潜力" : "Catalysis potential"}
              suitableTask={zhTask(task, lang)}
              scoreBreakdown={candidate.scoreBreakdown}
              keyReasons={[
                lang === "zh" ? "较高 CO₂ 亲和能力可能有利于反应物富集。" : "High CO₂ affinity may benefit reactant enrichment.",
                lang === "zh" ? "合适孔径可能有利于分子扩散。" : "Suitable pore size may support molecular diffusion.",
                lang === "zh" ? "金属节点可能提供 Lewis 酸位点或氧化还原活性位点。" : "Metal nodes may provide Lewis acidic or redox-active sites.",
                lang === "zh" ? "当前证据为规则推断，仍需实验验证。" : "Current evidence is rule-based and requires experimental validation.",
              ]}
              evidenceLevel={`${lang === "zh" ? "证据等级" : "Evidence Level"}: ${candidate.evidenceLevel || "rule-based"}`}
              limitations={lang === "zh" ? "Demo / placeholder / rule-based 数据；不代表真实催化活性或选择性。" : "Demo / placeholder / rule-based data; not real catalytic activity or selectivity."}
              recommendedNextStep={lang === "zh"
                ? ["定义反应条件与对照实验", "验证转化率、选择性和循环稳定性", "补充机理表征"]
                : ["Define reaction conditions and controls", "Validate conversion, selectivity, and cycling stability", "Add mechanistic characterization"]}
              fieldSources={candidate.fieldSources}
              dataStatus={candidate.dataMode || dataMode}
              onDetails={() => setSelected(candidate)}
            />
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="12" title={lang === "zh" ? "结果解释" : "Results Interpretation"}>
        <Callout tone="info">
          {lang === "zh"
            ? "Catalysis Potential Score 表示候选材料在特定催化任务下的潜力优先级，不等同于真实催化活性或产率。"
            : "Catalysis Potential Score indicates candidate priority for a selected catalysis task. It does not represent final catalytic activity or yield."}
        </Callout>
        {activeCandidate && (
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[
              [lang === "zh" ? "分数含义" : "What the score means", lang === "zh" ? "Catalysis Potential Score 表示候选优先级，不是最终催化性能预测。" : "Catalysis Potential Score indicates candidate priority, not final catalytic performance prediction."],
              [lang === "zh" ? "排序原因" : "Why this candidate is ranked high", `${activeCandidate.activeSiteHypothesis}; ${activeCandidate.poreSizeA} Å; ${activeCandidate.surfaceArea} m²/g.`],
              [lang === "zh" ? "支持数据" : "What data supports this result", lang === "zh" ? "当前支持来自 demo 描述符、任务规则、证据等级和占位字段。" : "Support comes from demo descriptors, task rules, evidence level, and placeholder fields."],
              [lang === "zh" ? "下一步验证" : "What should be validated next", lang === "zh" ? "验证反应条件、转化率、选择性、TOF、循环稳定性和机理表征。" : "Validate reaction conditions, conversion, selectivity, TOF, cycling stability, and mechanism characterization."],
            ].map(([title, body]) => (
              <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
                <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 7 }}>{body}</div>
              </div>
            ))}
          </div>
        )}
      </ResultLayer>

      <ResultLayer number="13" title={lang === "zh" ? "评分公式" : "Scoring formula"}>
        <MethodDrawer title="Catalysis Potential Score">
          Catalysis Potential Score = w1 × CO₂ Affinity + w2 × Active Site Potential + w3 × Pore Accessibility + w4 × Stability + w5 × Electronic Property + w6 × Sustainability + w7 × Evidence Confidence
        </MethodDrawer>
      </ResultLayer>

      <ResultLayer number="14" title={lang === "zh" ? "Model Results / 结果解释图表" : "Model Results / Results Interpretation"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
          <RankingBarChart data={ranked} scoreLabel={lang === "zh" ? "催化潜力评分" : "Catalysis Potential Score"} />
          <ScoreBreakdownRadar data={activeCandidate?.scoreBreakdown || []} title={activeCandidate ? `${activeCandidate.name} · ${lang === "zh" ? "评分拆解" : "Score Breakdown"}` : (lang === "zh" ? "评分拆解" : "Score Breakdown")} />
          <WeightContributionChart data={activeCandidate?.weightContribution || []} />
          <EvidenceDistributionChart data={evidenceDistribution(ranked)} />
          <ScoreDistributionChart data={scoreDistribution(ranked)} />
          <SensitivityAnalysisChart data={sensitivityRows(ranked, "catalysis", weights, task, "co2Affinity")} dimension="CO₂ Affinity" />
        </div>
      </ResultLayer>

      <ResultLayer number="15" title={lang === "zh" ? "Machine Learning Evaluation 占位" : "Machine Learning Evaluation Placeholder"}>
        <Callout tone="warn">
          {lang === "zh"
            ? "当前机器学习评估为占位展示。只有在积累足够带标签的实验或文献数据后，才会启用真实模型评估。"
            : "Machine learning evaluation is currently a placeholder. It will be activated when enough labeled experimental or literature data are available."}
        </Callout>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            ["Predicted vs Actual", lang === "zh" ? "需要带标签的实验或文献数据。" : "Requires labeled experimental or literature data."],
            ["Residual Plot", lang === "zh" ? "残差分析将在真实模型训练后启用。" : "Residual analysis will be available after model training."],
            ["Rule Contribution", lang === "zh" ? "当前展示规则贡献，不是 Feature Importance。" : "Current view shows rule contribution, not Feature Importance."],
            ["R²: pending · MAE: pending · RMSE: pending · Cross-validation: pending", lang === "zh" ? "不显示伪造模型指标。" : "No fabricated model metrics are shown."],
          ].map(([title, body]) => (
            <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone="proxy">Demo only / Placeholder</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 9 }}>{title}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <CaseStudyCO2
        lang={lang} t={t} isNarrow={isNarrow} isMobile={isMobile}
        realSeedCandidates={realSeedCandidates}
        demoCandidates={demoCandidates}
        weights={weights}
      />

      <Callout tone="warn">
        {lang === "zh"
          ? "催化性能高度依赖温度、溶剂、压力、底物、光/电化学环境和催化剂制备方式。当前评分用于候选材料优先级排序，不等同于最终催化性能预测。"
          : "Catalytic performance strongly depends on reaction conditions, including temperature, solvent, pressure, substrate, light/electrochemical environment, and catalyst preparation. The current score is intended for candidate prioritization, not final performance prediction."}
      </Callout>

      <CatalysisDataTemplate lang={lang} t={t} isNarrow={isNarrow} isMobile={isMobile} />

      <section className="content-card" style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: isMobile ? 16 : 20,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 14,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 880 }}>
            {lang === "zh" ? "有催化数据想整理？" : "Have catalyst data to structure?"}
          </div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 6, maxWidth: 720 }}>
            {lang === "zh"
              ? "可以先沟通数据范围；未发表或保密数据不会在未经明确同意的情况下公开展示。"
              : "Share the scope first; private or unpublished data will not be published without explicit permission."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("contact")}
          style={{ ...toolbarBtn(t), padding: "10px 16px", border: `1px solid ${t.accent}`, color: t.accentText, fontWeight: 850, whiteSpace: "nowrap" }}
        >
          {lang === "zh" ? "联系 / 合作" : "Contact / Collaboration"}
        </button>
      </section>
    </div>
  )
}
