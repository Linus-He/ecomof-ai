import { useEffect, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, SectionTitle, Callout, PageHeader, CopyLinkButton, fetchDataJson,
} from "../../shared"

const PROJECT_CITATION_EN = "He, W. EcoMOF-AI: An early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/"
const PROJECT_CITATION_ZH = "何文浩. EcoMOF-AI：面向 MOF 候选筛选、可持续性评价、催化任务探索和字段级数据溯源的早期科研原型. GitHub Pages, 2026. https://linus-he.github.io/ecomof-ai/"
const PROJECT_BIBTEX = `@misc{he2026ecomofai,
  author = {He, Wenhao},
  title = {EcoMOF-AI: An Early-Stage Research Prototype for MOF Candidate Screening, Sustainability Evaluation, Catalysis-Oriented Exploration, and Field-Level Data Provenance},
  year = {2026},
  url = {https://linus-he.github.io/ecomof-ai/},
  note = {Early-stage research prototype}
}`

function FormulaLine({ children }) {
  return (
    <div style={{ whiteSpace: "nowrap" }}>
      {children}
    </div>
  )
}

function FormulaStrip({ formula, t }) {
  return (
    <div style={{
      padding: "10px 12px",
      overflowX: "auto",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      color: t.accentText,
      fontFamily: FONT_MONO,
      fontSize: 12,
      lineHeight: 1.6,
      scrollbarWidth: "thin",
    }}>
      {formula}
    </div>
  )
}

function CompactFormulaCard({ title, formula, note, t }) {
  return (
    <article style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 12,
      minHeight: 0,
    }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 8 }}>{title}</div>
      <FormulaStrip formula={formula} t={t} />
      {note && <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{note}</div>}
    </article>
  )
}

function FormulaDetails({ title, formula, variables, interpretation, limitation, t, zh, defaultOpen = false }) {
  return (
    <details open={defaultOpen} style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 12,
    }}>
      <summary style={{
        cursor: "pointer",
        color: t.textStrong,
        fontSize: 12,
        fontWeight: 850,
        listStylePosition: "outside",
      }}>
        <span style={{ marginLeft: 4 }}>{title}</span>
      </summary>
      <div style={{ marginTop: 10 }}>
        <FormulaStrip formula={formula} t={t} />
      </div>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "变量说明" : "Variables"}
          </div>
          <div style={{ display: "grid", gap: 4, marginTop: 5 }}>
            {variables.map(([symbol, desc]) => (
              <div key={symbol} style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>
                <span style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{symbol}</span>: {desc}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "公式含义" : "Interpretation"}
          </div>
          <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{interpretation}</div>
        </div>
        <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {zh ? "使用限制" : "Limitation"}
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{limitation}</div>
        </div>
      </div>
    </details>
  )
}

function CompactCard({ title, body, tone = "info", t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
      <BasisBadge tone={tone}>{title}</BasisBadge>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{body}</div>
    </div>
  )
}

function MethodSection({ id, title, body, children, t }) {
  return (
    <section id={id} className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 18,
      scrollMarginTop: 120,
    }}>
      <SectionTitle>{title}</SectionTitle>
      {body && <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, margin: "8px 0 0" }}>{body}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  )
}

export function MethodsLimitationsTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const [references, setReferences] = useState([])

  useEffect(() => {
    let active = true
    fetchDataJson("references.json")
      .then(data => {
        if (active) setReferences(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setReferences([])
      })
    return () => { active = false }
  }, [])

  const handleViewDataQuality = () => {
    if (onNavigate) {
      onNavigate("data-quality-provenance")
      let attempts = 0
      const tryScroll = () => {
        const el = document.getElementById("data-quality-provenance")
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        } else if (attempts < 12) {
          attempts++
          setTimeout(tryScroll, 100)
        }
      }
      setTimeout(tryScroll, 150)
    }
  }

  const toc = zh
    ? [
      ["method-workflow", "工作流"],
      ["method-data", "数据层"],
      ["method-scoring", "评分模型"],
      ["method-formulas", "公式参考"],
      ["method-provenance", "证据与溯源"],
      ["benchmark-references", "标杆参考"],
      ["method-limitations", "限制说明"],
      ["method-references", "参考与引用"],
      ["validation-evidence", "验证与证据"],
    ]
    : [
      ["method-workflow", "Workflow"],
      ["method-data", "Data Layer"],
      ["method-scoring", "Scoring Model"],
      ["method-formulas", "Formula Reference"],
      ["method-provenance", "Evidence & Provenance"],
      ["benchmark-references", "Benchmark References"],
      ["method-limitations", "Limitations"],
      ["method-references", "References & Citation"],
      ["validation-evidence", "Validation & Evidence"],
    ]

  const workflow = zh
    ? ["数据库 / 种子数据", "描述符提取", "规则评分", "候选排序", "结果解释", "实验验证"]
    : ["Database / Seed Data", "Descriptor Extraction", "Rule-based Scoring", "Candidate Ranking", "Results Interpretation", "Experimental Validation"]

  const dataCards = zh
    ? [
      ["演示数据集", "用于展示工作流和交互逻辑，不应被当作真实科研结论。", "proxy"],
      ["真实种子数据集", "真实种子数据集（Real Seed Dataset）是公开数据库和文献记录的接入框架；当前不是完整 MOF 数据库。", "info"],
      ["催化数据模板", "定义后续催化数据接入所需的最小字段；模板本身不代表一定能训练机器学习模型。", "warn"],
      ["后续数据接入", "真实建模需要结构化实验或文献数据，包括条件、标签、来源和限制。", "info"],
    ]
    : [
      ["Demo Dataset", "Used for workflow demonstration and interaction testing, not as final scientific evidence.", "proxy"],
      ["Real Seed Dataset", "Provides a framework for curated public database and literature records. It is not a complete MOF database.", "info"],
      ["Catalysis Data Template", "Defines minimum fields for future catalysis data ingestion. The template alone does not guarantee machine learning readiness.", "warn"],
      ["Future Data Ingestion", "Real modeling requires structured experimental or literature data with conditions, labels, sources, and limitations.", "info"],
    ]

  const scoreCards = zh
    ? [
      ["规则评分模型", "当前模型把描述符、任务适配、证据置信度和权重组合成候选优先级。", "info"],
      ["Eco Score", "用于可持续性优先级比较，不替代完整工业 LCA。", "proxy"],
      ["Performance Score", "用于吸附相关候选排序，不替代严格 GCMC 或 IAST。", "proxy"],
      ["催化潜力评分", "用于催化潜力筛选，不声称准确预测转化率、选择性或 TOF。", "warn"],
      ["分数拆解", "展示单个候选的维度分数组成。", "info"],
      ["权重贡献", "解释权重和归一化描述符如何影响分数。", "info"],
      ["敏感性分析", "检查关键权重变化后候选排序是否稳定。", "info"],
    ]
    : [
      ["Rule-based Scoring Model", "Combines descriptors, task fit, evidence confidence, and weights into candidate priority.", "info"],
      ["Eco Score", "Supports sustainability-priority comparison and does not replace full industrial LCA.", "proxy"],
      ["Performance Score", "Supports adsorption-related candidate ranking and does not replace rigorous GCMC or IAST.", "proxy"],
      ["Catalysis Potential Score", "Screens catalysis potential without claiming accurate conversion, selectivity, or TOF prediction.", "warn"],
      ["Score Breakdown", "Shows dimension-level score composition for a candidate.", "info"],
      ["Weight Contribution", "Explains how weights and normalized descriptors affect the score.", "info"],
      ["Sensitivity Analysis", "Checks whether ranking remains stable when key weights change.", "info"],
    ]

  const formulaCards = [
    {
      title: zh ? "表观选择性" : "Apparent selectivity",
      formula: <FormulaLine>S<sub>A/B</sub> = q<sub>A</sub> / q<sub>B</sub></FormulaLine>,
      variables: zh
        ? [["q_A", "组分 A 的吸附量"], ["q_B", "组分 B 的吸附量"]]
        : [["q_A", "uptake of component A"], ["q_B", "uptake of component B"]],
      interpretation: zh ? "用于快速比较两个组分的吸附量比例。" : "Quickly compares uptake ratio between two components.",
      limitation: zh ? "这是简化的表观选择性，不替代严格混合气吸附建模。" : "This is a simplified apparent selectivity and does not replace rigorous mixture adsorption modeling.",
    },
    {
      title: zh ? "Henry 选择性" : "Henry selectivity",
      formula: <FormulaLine>S<sub>H,A/B</sub> = K<sub>H,A</sub> / K<sub>H,B</sub></FormulaLine>,
      variables: zh
        ? [["K_H,A", "组分 A 的 Henry 常数 (mmol g⁻¹ bar⁻¹)"], ["K_H,B", "组分 B 的 Henry 常数 (mmol g⁻¹ bar⁻¹)"]]
        : [["K_H,A", "Henry constant of component A (mmol g⁻¹ bar⁻¹)"], ["K_H,B", "Henry constant of component B (mmol g⁻¹ bar⁻¹)"]],
      interpretation: zh
        ? "Henry 选择性用于比较材料在低压区域对组分 A 相对于组分 B 的初始吸附亲和力。适用于低压或稀释吸附区域。示例：如果 K_H,CO₂ = 2.0 mmol g⁻¹ bar⁻¹，K_H,N₂ = 0.1 mmol g⁻¹ bar⁻¹，则 S_H,CO₂/N₂ = 20。"
        : "Henry selectivity compares the low-pressure adsorption affinity of component A relative to component B. Applies to low-pressure or dilute adsorption regimes. Example: if K_H,CO₂ = 2.0 mmol g⁻¹ bar⁻¹ and K_H,N₂ = 0.1 mmol g⁻¹ bar⁻¹, then S_H,CO₂/N₂ = 20.",
      limitation: zh
        ? "它不替代严格 IAST、穿透实验或完整混合气吸附分析。主要适用于稀释或低压区域。"
        : "It does not replace rigorous IAST, breakthrough experiments, or full mixture adsorption analysis. Useful for dilute or low-pressure regimes only.",
    },
    {
      title: zh ? "IAST 选择性" : "IAST selectivity",
      formula: <FormulaLine>S<sub>A/B</sub> = (x<sub>A</sub> / y<sub>A</sub>) / (x<sub>B</sub> / y<sub>B</sub>)</FormulaLine>,
      variables: zh
        ? [["x_A, x_B", "吸附相摩尔分数"], ["y_A, y_B", "气相摩尔分数"]]
        : [["x_A, x_B", "adsorbed phase mole fractions"], ["y_A, y_B", "gas phase mole fractions"]],
      interpretation: zh ? "用于说明严格混合气选择性计算所需的相组成关系。" : "Describes phase-composition ratios used in rigorous mixture selectivity analysis.",
      limitation: zh ? "当前平台不执行严格 IAST，该公式仅作为方法参考。" : "Current platform does not perform rigorous IAST. This is a formula reference only.",
    },
    {
      title: zh ? "等量吸附热 Qst" : "Isosteric heat Qst",
      formula: <FormulaLine>Q<sub>st</sub> = -R × d(ln P) / d(1/T)</FormulaLine>,
      variables: zh
        ? [["R", "气体常数"], ["P", "压力"], ["T", "温度"]]
        : [["R", "gas constant"], ["P", "pressure"], ["T", "temperature"]],
      interpretation: zh ? "用于解释吸附强度和温度响应。" : "Interprets adsorption strength and temperature response.",
      limitation: zh
        ? "Qst 估算需要可靠的多温度等温线数据。当前 Qst 输出应作为解释性参考，不应视为最终热力学证据。"
        : "Qst estimation requires reliable multi-temperature isotherm data. Current Qst outputs should be treated as interpretive guidance, not final thermodynamic evidence.",
    },
    {
      title: zh ? "规则评分公式" : "Rule-based score formula",
      formula: (
        <FormulaLine>
          Final Score = w<sub>1</sub> × Performance + w<sub>2</sub> × Stability + w<sub>3</sub> × Sustainability + w<sub>4</sub> × Application Fit + w<sub>5</sub> × Evidence Confidence
        </FormulaLine>
      ),
      variables: zh
        ? [["w₁…w₅", "可审计的规则权重"], ["Final Score", "候选优先级分数"]]
        : [["w₁…w₅", "auditable rule weights"], ["Final Score", "candidate-priority score"]],
      interpretation: zh ? "把多维筛选指标组合为候选优先级。" : "Combines multiple screening dimensions into candidate priority.",
      limitation: zh ? "分数表示候选优先级，不表示最终材料性能。" : "The score indicates candidate priority, not final material performance.",
    },
    {
      title: zh ? "催化潜力评分" : "Catalysis Potential Score",
      formula: (
        <FormulaLine>
          Catalysis Potential Score = w<sub>1</sub> × CO<sub>2</sub> Affinity + w<sub>2</sub> × Active Site Potential + w<sub>3</sub> × Pore Accessibility + w<sub>4</sub> × Stability + w<sub>5</sub> × Electronic Property + w<sub>6</sub> × Sustainability + w<sub>7</sub> × Evidence Confidence
        </FormulaLine>
      ),
      variables: zh
        ? [["w₁…w₇", "催化任务规则权重"], ["CO₂ Affinity", "CO₂ 相关亲和力描述符"]]
        : [["w₁…w₇", "catalysis task rule weights"], ["CO₂ Affinity", "CO₂-related affinity descriptor"]],
      interpretation: zh ? "用于催化候选材料优先级筛选。" : "Used for catalysis candidate prioritization.",
      limitation: zh ? "不声称准确预测催化性能，仍需实验验证。" : "It does not claim accurate catalytic performance prediction and still requires experimental validation.",
    },
  ]

  const provenanceCards = zh
    ? [
      ["字段级数据溯源", "字段级数据溯源（Field-level Provenance）说明每个描述符的来源类型、数据库或文献引用、测量条件、证据等级、整理说明和限制。", "info"],
      ["fieldSources", "字段级来源映射，说明某个描述符的来源和整理状态。", "proxy"],
      ["sourceRecords", "来源记录可包含 DOI、URL、测量条件、限制和整理说明。", "info"],
      ["待整理", "缺失来源显示为待整理，不应被理解为已经核实。", "warn"],
    ]
    : [
      ["Field-level Provenance", "Each curated descriptor can be linked to field-level provenance, including source type, database or literature reference, measurement condition, evidence level, curation note, and limitations.", "info"],
      ["fieldSources", "Field-level source mapping that describes where a descriptor comes from and its curation state.", "proxy"],
      ["sourceRecords", "Source records can include DOI, URL, condition, limitations, and curation note.", "info"],
      ["Pending curation", "Missing provenance is shown as pending curation and should not be read as verified.", "warn"],
    ]

  const limitations = zh
    ? [
      "结果表示候选优先级，不代表最终材料性能；",
      "催化性能高度依赖反应条件；",
      "可持续性评分不替代完整工业 LCA；",
      "吸附相关结果不替代严格 GCMC 或 IAST 分析；",
      "机器学习评估需要带标签的实验或文献数据；",
      "Real Seed Dataset 不是完整 MOF 数据库；",
      "仍需实验验证。",
    ]
    : [
      "Results indicate candidate priority, not final material performance.",
      "Catalytic performance depends strongly on reaction conditions.",
      "Sustainability scores do not replace full industrial LCA.",
      "Adsorption-related results do not replace rigorous GCMC or IAST analysis.",
      "ML evaluation requires labeled experimental or literature data.",
      "Real Seed Dataset is not a complete MOF database.",
      "Experimental validation is required.",
    ]

  const suggestedUse = zh
    ? {
      appropriate: ["早期候选优先级筛选", "描述符整理", "数据来源查看", "科研假设生成", "教学或作品集展示", "合作讨论"],
      notFor: ["最终材料性能结论", "替代实验", "完整 LCA 结论", "替代 GCMC / IAST", "已验证机器学习预测", "工业部署决策"],
    }
    : {
      appropriate: ["Early-stage candidate prioritization", "Descriptor organization", "Data provenance inspection", "Research hypothesis generation", "Teaching or portfolio demonstration", "Collaboration discussion"],
      notFor: ["Final material performance conclusion", "Experimental replacement", "Complete LCA claim", "GCMC / IAST replacement", "Validated ML prediction", "Industrial deployment decision"],
    }

  const benchmarkReferences = zh
    ? [
      {
        name: "UiO-66",
        role: "稳定性参考",
        why: "常见的锆基金属有机框架，经常用于稳定性相关讨论的参照点。",
        strengths: ["常被用于讨论相对较强的热稳定性和化学稳定性", "可作为框架稳健性的参考"],
        limitations: ["性能依赖合成、缺陷、功能化和测试条件", "不是所有应用的通用 benchmark"],
      },
      {
        name: "ZIF-8",
        role: "经典 ZIF 参考",
        why: "广为人知的沸石咪唑酯骨架，常见于 MOF 文献和教学语境。",
        strengths: ["结构家族辨识度高", "常作为熟悉的比较参照"],
        limitations: ["稳定性和性能依赖条件", "仅靠它不足以作为可持续性或生命周期影响 benchmark"],
      },
      {
        name: "MIL-53(Al)",
        role: "柔性框架参考",
        why: "代表性柔性 MOF，常用于讨论 breathing 行为和吸附条件依赖性。",
        strengths: ["有助于解释框架柔性", "可作为吸附行为的语境参考"],
        limitations: ["性能强烈依赖客体分子、活化和测量条件", "不是所有筛选任务的通用标准"],
      },
    ]
    : [
      {
        name: "UiO-66",
        role: "Stability-oriented reference",
        why: "A widely discussed zirconium-based MOF often used as a reference point for stability-related discussions.",
        strengths: ["Often discussed for relatively strong thermal and chemical stability", "Useful reference for framework robustness"],
        limitations: ["Performance depends on synthesis, defects, functionalization, and test conditions", "Not a universal benchmark for all applications"],
      },
      {
        name: "ZIF-8",
        role: "Classical ZIF reference",
        why: "A widely known zeolitic imidazolate framework frequently used in MOF literature and teaching contexts.",
        strengths: ["Well-known structure family", "Commonly used as a familiar comparison point"],
        limitations: ["Stability and performance are condition-dependent", "Not sufficient as a benchmark for sustainability or lifecycle impact alone"],
      },
      {
        name: "MIL-53(Al)",
        role: "Flexible framework reference",
        why: "A representative flexible MOF often discussed in relation to breathing behavior and adsorption-condition dependence.",
        strengths: ["Useful for explaining framework flexibility", "Helpful as a context reference for adsorption behavior"],
        limitations: ["Performance can strongly depend on guest molecules, activation, and measurement conditions", "Not a universal standard for all screening tasks"],
      },
    ]

  const scaleUpFields = zh
    ? [
      "前驱体可获得性",
      "配体成本等级",
      "溶剂风险",
      "合成温度",
      "活化条件",
      "能耗强度说明",
      "放大风险",
    ]
    : [
      "precursor availability",
      "ligand cost class",
      "solvent concern",
      "synthesis temperature",
      "activation condition",
      "energy-intensity notes",
      "scale-up concern",
    ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={zh ? "方法学与可信度说明" : "Methodology and Trust Notes"}
        subtitle={zh
          ? "说明 ecomof-ai 如何工作、数据从哪里来、分数怎么算、证据如何追踪，以及哪些结果不能过度解读。"
          : "How ecomof-ai works, where data come from, how scores are calculated, how evidence is traced, and where interpretation must stay cautious."}
        meta={zh ? "工作流 · 数据层 · 评分模型 · 公式参考 · 证据与溯源 · 限制说明 · 参考与引用" : "Workflow · Data Layer · Scoring Model · Formula Reference · Evidence & Provenance · Limitations · References"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "候选优先级" : "candidate priority"}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={zh ? "复制 Methodology 链接" : "Copy Methodology link"} />
          </>
        }
      />

      <Callout tone="warn">
        {zh
          ? "页面中的分数表示候选优先级（candidate priority），用于早期筛选和研究假设生成，不代表最终材料性能。"
          : "Scores indicate candidate priority for early-stage screening and research hypothesis generation, not final material performance."}
      </Callout>

      <nav aria-label={zh ? "方法学目录" : "Methodology contents"}
        style={{ display: "flex", gap: 6, flexWrap: "wrap", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px" }}>
        {toc.map(([href, label], index) => (
          <span key={href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <a href={`#${href}`}
              style={{ color: t.accentText, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>
              {label}
            </a>
            {index < toc.length - 1 && <span style={{ color: t.faint, fontSize: 11 }}>|</span>}
          </span>
        ))}
      </nav>

      <MethodSection
        id="method-workflow"
        title={zh ? "Workflow / 工作流" : "Workflow"}
        body={zh
          ? "平台将公开或示例数据整理为描述符，再通过规则评分形成候选排序。结果用于早期筛选和研究假设生成，不替代实验验证。"
          : "The platform turns public or demo records into descriptors, then uses rule-based scoring to form candidate rankings. Results support early-stage screening and hypothesis generation, not experimental validation replacement."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(6, minmax(0, 1fr))", gap: 8 }}>
          {workflow.map((step, index) => (
            <div key={step} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, minHeight: 88 }}>
              <div style={{ color: t.accentText, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 820, lineHeight: 1.35, marginTop: 8 }}>{step}</div>
            </div>
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-data"
        title={zh ? "Data Layer / 数据层" : "Data Layer"}
        body={zh
          ? "演示数据集用于展示工作流；真实种子数据集用于承载未来整理的公开数据库和文献记录；催化数据模板定义后续催化数据接入所需的最小字段。"
          : "Demo Dataset is used for workflow demonstration. Real Seed Dataset provides a framework for curated public database and literature records. Catalysis Data Template defines the minimum fields for future catalysis data ingestion."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {dataCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
        <div style={{ marginTop: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <BasisBadge tone="info">{zh ? "未来放大与产业化字段" : "Future Scale-up Fields"}</BasisBadge>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
              {zh ? "planned / future curation target" : "planned / future curation target"}
            </span>
          </div>
          <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, margin: "9px 0 0" }}>
            {zh
              ? "未来版本可能加入面向放大与产业化判断的描述符，例如前驱体可获得性、配体成本等级、溶剂风险、合成温度、活化条件和能耗强度说明。这些字段目前仅作为后续整理目标，并不代表当前原型已完整接入。"
              : "Future versions may add scale-up-oriented descriptors such as precursor availability, ligand cost class, solvent concern, synthesis temperature, activation condition, and energy-intensity notes. These fields are planned as curation targets and are not complete in the current prototype."}
          </p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
            {scaleUpFields.map(item => (
              <span key={item} style={{ color: t.muted, fontSize: 10, lineHeight: 1.3, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", background: t.panel }}>
                {item}
              </span>
            ))}
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 10, borderTop: `1px solid ${t.divider}`, paddingTop: 10 }}>
            {zh
              ? "未来版本可能探索 MOFTransformer 等面向 MOF 的结构表征模型，用于离线特征提取或候选优先级辅助。任何模型输出在作为科研证据使用前，都需要任务特定验证、适用域检查和不确定性说明。"
              : "Future versions may explore MOF-specific representation models such as MOFTransformer for offline feature extraction or candidate-prioritization support. Any model-based output would require task-specific validation, applicability-domain checks, and uncertainty reporting before being used as research evidence."}
          </div>
        </div>
      </MethodSection>

      <MethodSection
        id="method-scoring"
        title={zh ? "Scoring Model / 评分模型" : "Scoring Model"}
        body={zh
          ? "当前是规则评分模型，不是训练完成的真实预测模型。所有分数都表示候选优先级，不表示最终材料性能。"
          : "The current model is rule based, not a trained predictive model. Every score indicates candidate priority, not final material performance."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {scoreCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 10, marginTop: 12 }}>
          {formulaCards.slice(4).map(card => (
            <CompactFormulaCard
              key={card.title}
              title={card.title}
              formula={card.formula}
              note={card.limitation}
              t={t}
            />
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-formulas"
        title={zh ? "Compact Formula Reference / 紧凑公式参考" : "Compact Formula Reference"}
        body={zh
          ? "公式参考默认只展开规则评分公式；吸附相关公式按需展开，避免页面被变量说明占满。"
          : "The reference opens rule-based scoring by default and keeps adsorption formulas collapsed until needed."}
        t={t}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <details open style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 12,
          }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
              {zh ? "Rule-based score formulas / 规则评分公式" : "Rule-based score formulas"}
            </summary>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 10, marginTop: 10 }}>
              {formulaCards.slice(4).map(card => (
                <CompactFormulaCard
                  key={card.title}
                  title={card.title}
                  formula={card.formula}
                  note={card.limitation}
                  t={t}
                />
              ))}
            </div>
          </details>
          {formulaCards.slice(0, 4).map(card => (
            <FormulaDetails
              key={card.title}
              {...card}
              t={t}
              zh={zh}
            />
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-provenance"
        title={zh ? "Evidence & Provenance / 证据与溯源" : "Evidence & Provenance"}
        body={zh
          ? "证据追踪用于说明字段来源和整理状态。证据等级（Evidence Level）和待整理状态需要一起解读。"
          : "Evidence tracking clarifies field sources and curation state. Data without verified provenance should not be over-interpreted."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {provenanceCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
        <div style={{ marginTop: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
            {zh ? "Descriptor Conditions Matter / 描述符条件很重要" : "Descriptor Conditions Matter"}
          </div>
          <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, margin: "8px 0 0" }}>
            {zh
              ? "CO₂ 吸附量、水稳定性、比表面积、孔体积等 MOF 描述符依赖具体测试或报道条件。只有当数值、单位、必要测试条件、证据等级和字段级来源记录同时存在时，才应将该描述符视为已整理字段。缺少条件的字段应显示为条件待补充。"
              : "MOF descriptors such as CO₂ uptake, water stability, surface area, and pore volume depend on measurement or reporting conditions. A descriptor should not be interpreted as fully curated unless value, unit, condition when applicable, evidence level, and field-level source record are available. Fields without condition metadata should remain condition pending."}
          </p>
        </div>
        <div style={{ marginTop: 12, color: t.muted, fontSize: 11, lineHeight: 1.65, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          {zh
            ? "在 MOF Library 展开记录后，以及 Performance 和 CatalysisLab 真实种子模式下的候选卡片中，可通过字段级数据溯源查看来源详情。该功能必须与 fieldSources 和 sourceRecords 一起理解；没有核实来源的数据不应被过度解读。"
            : "In expanded MOF Library records and in Performance / CatalysisLab real-seed candidate cards, Field-level Provenance exposes source details. Interpret it together with fieldSources and sourceRecords."}
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={handleViewDataQuality}
            style={{
              marginTop: 12,
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 7,
              background: t.badgeInfoBg, border: `1px solid ${t.border}`,
              color: t.accentText, fontSize: 12, fontWeight: 800,
              cursor: "pointer", fontFamily: FONT_MONO,
            }}
          >
            <span style={{ fontSize: 14 }}>📊</span>
            {zh ? "查看数据质量图表" : "View Data Quality Dashboard"}
          </button>
        )}
      </MethodSection>

      <MethodSection
        id="benchmark-references"
        title={zh ? "Benchmark References / 标杆材料参考" : "Benchmark References"}
        body={zh
          ? "这些标杆材料用于帮助理解 MOF 候选记录的研究语境，并不代表平台已完成严格预测对标，也不代表 EcoMOF-AI 声称候选材料性能优于这些材料。"
          : "These benchmark references provide research context for interpreting MOF candidate records. They are not direct prediction baselines, and EcoMOF-AI does not claim validated performance superiority over these materials."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {benchmarkReferences.map(item => (
            <article key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 880 }}>{item.name}</div>
                <BasisBadge tone="proxy">{item.role}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{item.why}</div>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                <div>
                  <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
                    {zh ? "典型优势" : "Typical strengths"}
                  </div>
                  <ul style={{ margin: "5px 0 0", paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                    {item.strengths.map(entry => <li key={entry}>{entry}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
                    {zh ? "已知限制" : "Known limitations"}
                  </div>
                  <ul style={{ margin: "5px 0 0", paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                    {item.limitations.map(entry => <li key={entry}>{entry}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <CopyLinkButton hash="benchmark-references" label={zh ? "复制标杆参考链接" : "Copy Benchmark link"} copiedLabel={zh ? "链接已复制" : "Link copied"} ariaLabel={zh ? "复制标杆材料参考链接" : "Copy Benchmark References link"} />
        </div>
      </MethodSection>

      <MethodSection
        id="method-limitations"
        title={zh ? "Limitations / 限制说明" : "Limitations"}
        body={zh
          ? "这些限制用于把科研原型的边界说清楚，语气应严谨但不制造不必要的阻碍。"
          : "These limitations define the boundary of the research prototype with a cautious but practical tone."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {limitations.map(item => (
            <div key={item} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <span style={{ color: t.warn, fontSize: 13, lineHeight: 1.4 }}>!</span>
              <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[
            [zh ? "适合用途" : "Appropriate use", suggestedUse.appropriate, "info"],
            [zh ? "不适合用途" : "Not appropriate for", suggestedUse.notFor, "warn"],
          ].map(([title, items, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={tone}>{title}</BasisBadge>
              <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
                {items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </MethodSection>

      <MethodSection
        id="method-references"
        title={zh ? "References & Citation / 参考与引用" : "References & Citation"}
        body={zh
          ? "引用本项目时请引用仓库和网站；本平台不应被引用为已验证的科学数据库或最终预测工具。"
          : "When referencing this project, cite the repository and website; the platform should not be cited as a validated scientific database or final prediction engine."}
        t={t}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <details open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
              {zh ? "如何引用 EcoMOF-AI" : "How to cite EcoMOF-AI"}
            </summary>
            <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "10px 0 0" }}>
              {zh
                ? "EcoMOF-AI 是一个早期科研原型。如果你在展示、作品集评审或非正式科研讨论中引用本项目，请引用项目仓库和网站。本平台不应被引用为已验证的科学数据库或最终预测工具。"
                : "EcoMOF-AI is an early-stage research prototype. If you reference this project in a presentation, portfolio review, or informal research discussion, please cite the project repository and website. The platform should not be cited as a validated scientific database or final prediction engine."}
            </p>
          </details>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{zh ? "项目引用" : "Project citation"}</div>
            <div style={{ marginTop: 9, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: 10, color: t.muted, fontSize: 11, lineHeight: 1.6 }}>
              {zh ? PROJECT_CITATION_ZH : PROJECT_CITATION_EN}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <CopyLinkButton value={zh ? PROJECT_CITATION_ZH : PROJECT_CITATION_EN} label={zh ? "复制引用" : "Copy citation"} copiedLabel={zh ? "引用已复制" : "Citation copied"} ariaLabel={zh ? "复制项目引用" : "Copy project citation"} />
              <CopyLinkButton value={PROJECT_BIBTEX} label={zh ? "复制 BibTeX" : "Copy BibTeX"} copiedLabel={zh ? "BibTeX 已复制" : "BibTeX copied"} ariaLabel={zh ? "复制 BibTeX" : "Copy BibTeX"} />
            </div>
          </div>

          <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
              {zh ? "数据与方法参考" : "Data and method references"}
            </summary>
            <p style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, margin: "10px 0" }}>
              {zh
                ? "部分参考来源用于方法说明或未来数据接入规划，不代表当前已完整接入。"
                : "Some references are planned or contextual references, not necessarily fully ingested data sources."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {references.map(item => (
                <div key={item.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 820 }}>{item.title}</div>
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 4 }}>{item.category} · {item.type}</div>
                  <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{item.note}</div>
                </div>
              ))}
            </div>
          </details>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <CopyLinkButton value="https://linus-he.github.io/ecomof-ai/" label={zh ? "复制项目链接" : "Copy project link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
            <CopyLinkButton hash="methodology" label={zh ? "复制方法学链接" : "Copy Methodology link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
            <CopyLinkButton hash="data-quality-provenance" label={zh ? "复制数据质量链接" : "Copy Data Quality link"} copiedLabel={zh ? "链接已复制" : "Link copied"} />
          </div>
        </div>
      </MethodSection>

      <MethodSection
        id="validation-evidence"
        title={zh ? "Validation & Evidence / 验证与证据" : "Validation & Evidence"}
        body={zh
          ? "EcoMOF-AI 是一个早期科研原型，不是已验证的预测工具。本节说明当前的验证状态、已检查的内容和未来计划。"
          : "EcoMOF-AI is an early-stage research prototype, not a validated prediction engine. This section documents the current validation status, what is explicitly checked, and future plans."}
        t={t}
      >
        <div style={{ display: "grid", gap: 12 }}>

          {/* A. Current status */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "A. 当前状态" : "A. Current status"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {(zh ? [
                ["规则评分模型", "评分由可审计的规则和权重生成，不是训练完成的机器学习模型。"],
                ["描述符完整性追踪", "已整理字段标注证据等级；待整理字段明确标注，不静默遗漏。"],
                ["字段级数据溯源", "每个已整理的描述符可关联来源类型、文献引用、测量条件和整理说明。"],
                ["数据模式分离", "演示数据和真实种子数据明确分离；演示数据不用于科研结论。"],
              ] : [
                ["Rule-based scoring model", "Scores are generated by auditable rules and weights, not a trained machine learning model."],
                ["Descriptor completeness tracking", "Curated fields carry evidence levels; pending fields are explicitly labeled, not silently omitted."],
                ["Field-level provenance", "Each curated descriptor can be linked to source type, literature reference, measurement condition, and curation note."],
                ["Data mode separation", "Demo data and real-seed data are explicitly separated; demo data is not presented as scientific evidence."],
              ]).map(([title, body]) => (
                <div key={title} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "9px 11px" }}>
                  <span style={{ color: t.accentText, fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <div>
                    <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 820, marginBottom: 3 }}>{title}</div>
                    <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. What is checked */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "B. 已检查内容" : "B. What is checked"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 7 }}>
              {(zh ? [
                "描述符字段完整性（值、单位/条件、证据等级、来源记录）",
                "数据模式分离——演示数据不与真实种子数据混用",
                "字段级来源类型一致性（文献、数据库、估算、待整理）",
                "评分公式透明度——所有权重和维度可审计",
                "每个描述符的证据等级标注",
                "整理状态——待整理字段明确标注，不静默遗漏",
              ] : [
                "Descriptor field completeness (value, unit/condition, evidence level, source record)",
                "Data mode separation — demo data is not mixed with real-seed data",
                "Field-level source type consistency (literature, database, estimated, pending)",
                "Scoring formula transparency — all weights and dimensions are auditable",
                "Evidence level tagging per descriptor",
                "Curation state — pending fields are explicitly labeled, not silently omitted",
              ]).map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 10px" }}>
                  <span style={{ color: t.accentText, fontSize: 11, lineHeight: 1.6, flexShrink: 0 }}>·</span>
                  <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* C. Future validation work */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
              {zh ? "C. 未来验证工作" : "C. Future validation work"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 7 }}>
              {(zh ? [
                "将评分输出与文献报道的筛选结果进行基准对比",
                "将顶级候选材料的排序与 GCMC 模拟结果交叉验证",
                "将 Eco Score 各分项与已发表的 LCA 数据对比",
                "随实验验证数据的获取持续纳入",
                "针对不同任务配置对评分权重进行敏感性分析",
                "对描述符整理框架进行独立评审",
              ] : [
                "Benchmark scoring output against literature-reported screening results",
                "Cross-validate top-ranked candidate rankings with GCMC simulation results",
                "Compare Eco Score components with published LCA data",
                "Integrate experimental validation data as it becomes available",
                "Sensitivity analysis for scoring weights across different task configurations",
                "Independent review of the descriptor curation framework",
              ]).map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 10px" }}>
                  <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, flexShrink: 0 }}>→</span>
                  <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* D. Non-validation disclaimer */}
          <div style={{ background: t.surface, border: `1px solid ${t.warn}`, borderRadius: 8, padding: 12, borderWidth: 1, borderStyle: "solid" }}>
            <div style={{ color: t.warn, fontSize: 11, fontWeight: 850, marginBottom: 6 }}>
              {zh ? "D. 未验证声明" : "D. Non-validation disclaimer"}
            </div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
              {zh
                ? "EcoMOF-AI 尚未经过同行评审或独立科学验证。平台评分和排序不应被引用为已验证的计算预测结果。所有结果在用于科学结论之前，都需要独立的实验和计算验证。"
                : "EcoMOF-AI has not undergone peer review or independent scientific validation. Scores and rankings should not be cited as validated computational predictions. All results require independent experimental and computational verification before use in scientific conclusions."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <CopyLinkButton hash="validation-evidence" label={zh ? "复制验证与证据链接" : "Copy Validation & Evidence link"} copiedLabel={zh ? "链接已复制" : "Link copied"} ariaLabel={zh ? "复制验证与证据链接" : "Copy Validation & Evidence link"} />
          </div>
        </div>
      </MethodSection>
    </div>
  )
}
