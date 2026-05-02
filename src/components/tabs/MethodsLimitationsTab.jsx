import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, SectionTitle, Callout, PageHeader,
} from "../../shared"

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

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"

  const toc = zh
    ? [
      ["method-workflow", "工作流"],
      ["method-data", "数据层"],
      ["method-scoring", "评分模型"],
      ["method-formulas", "公式参考"],
      ["method-provenance", "证据与溯源"],
      ["method-limitations", "限制说明"],
    ]
    : [
      ["method-workflow", "Workflow"],
      ["method-data", "Data Layer"],
      ["method-scoring", "Scoring Model"],
      ["method-formulas", "Formula Reference"],
      ["method-provenance", "Evidence & Provenance"],
      ["method-limitations", "Limitations"],
    ]

  const workflow = zh
    ? ["数据库 / 种子数据", "描述符提取", "规则评分", "候选排序", "结果解释", "实验验证"]
    : ["Database / Seed Data", "Descriptor Extraction", "Rule-based Scoring", "Candidate Ranking", "Results Interpretation", "Experimental Validation"]

  const dataCards = zh
    ? [
      ["Demo Dataset", "用于展示工作流和交互逻辑，不应被当作真实科研结论。", "proxy"],
      ["Real Seed Dataset", "用于承载未来整理的公开数据库和文献记录；当前不是完整 MOF 数据库。", "info"],
      ["Catalysis Data Template", "定义后续催化数据接入所需的最小字段；模板本身不代表一定能训练机器学习模型。", "warn"],
      ["Future Data Ingestion", "真实建模需要结构化 experimental or literature data，包括条件、标签、来源和限制。", "info"],
    ]
    : [
      ["Demo Dataset", "Used for workflow demonstration and interaction testing, not as final scientific evidence.", "proxy"],
      ["Real Seed Dataset", "Provides a framework for curated public database and literature records. It is not a complete MOF database.", "info"],
      ["Catalysis Data Template", "Defines minimum fields for future catalysis data ingestion. The template alone does not guarantee machine learning readiness.", "warn"],
      ["Future Data Ingestion", "Real modeling requires structured experimental or literature data with conditions, labels, sources, and limitations.", "info"],
    ]

  const scoreCards = zh
    ? [
      ["Rule-based Scoring Model", "当前模型把描述符、任务适配、证据置信度和权重组合成 candidate priority。", "info"],
      ["Eco Score", "用于可持续性优先级比较，不替代完整工业 LCA。", "proxy"],
      ["Performance Score", "用于吸附相关候选排序，不替代严格 GCMC 或 IAST。", "proxy"],
      ["Catalysis Potential Score", "用于催化潜力筛选，不声称准确预测转化率、选择性或 TOF。", "warn"],
      ["Score Breakdown", "展示单个候选的维度分数组成。", "info"],
      ["Weight Contribution", "解释权重和归一化描述符如何影响分数。", "info"],
      ["Sensitivity Analysis", "检查关键权重变化后候选排序是否稳定。", "info"],
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
      formula: <FormulaLine>S<sub>H</sub> = K<sub>H,A</sub> / K<sub>H,B</sub></FormulaLine>,
      variables: zh
        ? [["K_H,A", "组分 A 的 Henry 常数"], ["K_H,B", "组分 B 的 Henry 常数"]]
        : [["K_H,A", "Henry constant of component A"], ["K_H,B", "Henry constant of component B"]],
      interpretation: zh ? "用于低压极限下比较吸附亲和力。" : "Compares adsorption affinity in the low-pressure limit.",
      limitation: zh ? "主要适用于稀释或低压区域。" : "Useful for dilute or low-pressure regimes only.",
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
      limitation: zh ? "score 表示 candidate priority，不表示最终材料性能。" : "The score indicates candidate priority, not final material performance.",
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
      ["Field-level Provenance", "每个经过整理的描述符都可以关联字段级来源，包括来源类型、数据库或文献引用、测量条件、证据等级、整理说明和限制。", "info"],
      ["fieldSources", "字段级来源映射，说明某个 descriptor 的来源和整理状态。", "proxy"],
      ["sourceRecords", "来源记录可包含 DOI、URL、condition、limitations 和 curation note。", "info"],
      ["Pending curation", "缺失来源显示为待整理，不应被理解为已经核实。", "warn"],
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={zh ? "方法学与可信度说明" : "Methodology and Trust Notes"}
        subtitle={zh
          ? "说明 ecomof-ai 如何工作、数据从哪里来、分数怎么算、证据如何追踪，以及哪些结果不能过度解读。"
          : "How ecomof-ai works, where data come from, how scores are calculated, how evidence is traced, and where interpretation must stay cautious."}
        meta={zh ? "工作流 · 数据层 · 评分模型 · 公式参考 · 证据与溯源 · 限制说明" : "Workflow · Data Layer · Scoring Model · Formula Reference · Evidence & Provenance · Limitations"}
        action={<BasisBadge tone="proxy">{zh ? "候选优先级" : "candidate priority"}</BasisBadge>}
      />

      <Callout tone="warn">
        <strong>{c.methods.noticeTitle}</strong> {c.methods.noticeBody}
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
          ? "平台将公开或示例数据整理为描述符，再通过规则评分形成候选排序。结果用于 early-stage screening 和 hypothesis generation，不替代实验验证。"
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
          ? "Demo Dataset 用于展示工作流；Real Seed Dataset 用于承载未来整理的公开数据库和文献记录；Catalysis Data Template 定义后续催化数据接入所需的最小字段。"
          : "Demo Dataset is used for workflow demonstration. Real Seed Dataset provides a framework for curated public database and literature records. Catalysis Data Template defines the minimum fields for future catalysis data ingestion."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {dataCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
      </MethodSection>

      <MethodSection
        id="method-scoring"
        title={zh ? "Scoring Model / 评分模型" : "Scoring Model"}
        body={zh
          ? "当前是规则评分模型，不是训练完成的真实预测模型。所有 score 都表示 candidate priority，不表示 final material performance。"
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
          ? "证据追踪用于说明字段来源和整理状态。没有核实来源的数据不应被过度解读。"
          : "Evidence tracking clarifies field sources and curation state. Data without verified provenance should not be over-interpreted."}
        t={t}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {provenanceCards.map(([title, body, tone]) => <CompactCard key={title} title={title} body={body} tone={tone} t={t} />)}
        </div>
        <div style={{ marginTop: 12, color: t.muted, fontSize: 11, lineHeight: 1.65, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          {zh
            ? "在 MOF Library 展开记录后，以及 Performance 和 CatalysisLab 真实种子模式下的候选卡片中，可通过 Field-level Provenance 查看来源详情。该功能必须与 fieldSources 和 sourceRecords 一起理解。"
            : "In expanded MOF Library records and in Performance / CatalysisLab real-seed candidate cards, Field-level Provenance exposes source details. Interpret it together with fieldSources and sourceRecords."}
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
      </MethodSection>
    </div>
  )
}
