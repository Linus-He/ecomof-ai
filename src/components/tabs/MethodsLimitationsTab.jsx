import {
  BasisBadge,
  Callout,
  CopyLinkButton,
  DescriptorRegistryViewer,
  FONT_MONO,
  PageHeader,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import {
  CatalysisWorkflowDiagram,
  CriticWeightingDiagram,
  DescriptorRegistryDiagram,
  ExplanationLayerDiagram,
  ScoringPipelineDiagram,
  scrollToMethodTarget,
} from "../methods"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const sectionIds = [
  ["method-overview", "Overview", "总览"],
  ["scoring-pipeline", "Scoring Pipeline", "评分管线"],
  ["descriptor-registry", "Descriptor Registry", "描述符注册"],
  ["weighting-algorithms", "Weighting Algorithms", "权重算法"],
  ["organic-acid-rgfa", "Organic Acid RGFA", "有机酸 RGFA"],
  ["algorithm-traceability", "Algorithm Traceability", "算法可追踪性"],
  ["explanation-evidence", "Explanation & Evidence", "解释与证据"],
  ["organic-evidence-matrix", "Evidence Matrix", "证据矩阵"],
  ["organic-catalysis-workflow", "Organic Acid Workflow", "有机酸工作流"],
  ["organic-acid-limitations", "Organic Acid Limits", "有机酸限制"],
  ["method-limitations", "Limitations", "限制说明"],
  ["catalysis-data-workflow", "Catalysis Workflow", "催化数据工作流"],
]

function sectionLabel(item, lang) {
  return lang === "zh" ? item[2] : item[1]
}

function Section({ id, eyebrow, title, subtitle, children, t }) {
  return (
    <section
      id={id}
      className="content-card"
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: 18,
        scrollMarginTop: 118,
        display: "grid",
        gap: 14,
        minWidth: 0,
      }}
    >
      <div>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
          {eyebrow}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: "5px 0 0", fontWeight: 930 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: t.subtle, fontSize: 12.5, lineHeight: 1.65, margin: "7px 0 0", maxWidth: 840 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function TextBlock({ children, t }) {
  return <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.75, margin: 0 }}>{children}</p>
}

function MethodCard({ title, body, t, tone = "info" }) {
  const palette = {
    info: { bg: t.surface, border: t.border, label: t.accentText },
    warn: { bg: t.badgeWarnBg, border: t.warn, label: t.badgeWarnText },
    note: { bg: t.panel, border: t.borderStrong, label: t.faint },
  }[tone]
  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, padding: 13, minWidth: 0 }}>
      <div style={{ color: palette.label, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
        {title}
      </div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>
        {body}
      </div>
    </article>
  )
}

function Sub({ children }) {
  return <sub style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sub>
}

function Sup({ children }) {
  return <sup style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sup>
}

function VarLabel({ id }) {
  const labels = {
    Y_FA: <>Y<Sub>FA</Sub></>,
    S_FA_C: <>S<Sub>FA,C</Sub></>,
    Y_lactic: <>Y<Sub>lactic</Sub></>,
    Y_acetic: <>Y<Sub>acetic</Sub></>,
    Y_glycolic: <>Y<Sub>glycolic</Sub></>,
    Y_pyruvic: <>Y<Sub>pyruvic</Sub></>,
    Y_solid: <>Y<Sub>solid</Sub></>,
    w_lactic: <>w<Sub>lactic</Sub></>,
    w_acetic: <>w<Sub>acetic</Sub></>,
    w_glycolic: <>w<Sub>glycolic</Sub></>,
    w_pyruvic: <>w<Sub>pyruvic</Sub></>,
    w_solid: <>w<Sub>solid</Sub></>,
    sigma_j: <>σ<Sub>j</Sub></>,
    r_ij: <>r<Sub>ij</Sub></>,
    C_j: <>C<Sub>j</Sub></>,
    w_j: <>w<Sub>j</Sub></>,
  }
  return labels[id] || id
}

function ChemFormula({ kind }) {
  if (kind === "bicarbonate") return <>HCO<Sub>3</Sub><Sup>−</Sup></>
  if (kind === "isotopeBicarbonate") return <>NaH<Sup>13</Sup>CO<Sub>3</Sub></>
  if (kind === "sodiumBicarbonate") return <>NaHCO<Sub>3</Sub></>
  return null
}

function FormulaCard({ title, children, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12, minWidth: 0 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: t.textStrong, display: "flex", flexWrap: "wrap", fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 900, gap: "4px 7px", lineHeight: 1.65, marginTop: 8, minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

function MiniFlow({ rows, t, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${rows.length}, minmax(0, 1fr))`, gap: 9 }}>
      {rows.map((row, index) => (
        <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 11, minWidth: 0 }}>
          <div style={{ color: t.accentText, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 950 }}>{String(index + 1).padStart(2, "0")}</div>
          <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35, marginTop: 5 }}>{row.title}</div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>{row.body}</div>
        </article>
      ))}
    </div>
  )
}

function OrganicAcidRgfaMethod({ t, isMobile }) {
  const pathwayRows = [
    ["Formaldehyde → Formic acid", "甲醛 → 甲酸，主正路径，主要影响 A3 和 SelectivityFactor。"],
    ["Glyceraldehyde → Formic / Glycolic / Acetic acid", "甘油醛路径属于混合路径；正向分支影响 A2/A3，C2 副产物提高 B1。"],
    ["Pyruvaldehyde → Lactic / Pyruvic / Acetic acid", "丙酮醛路径属于风险主导路径；提高 B1，降低 SelectivityFactor。"],
  ]
  const steps = [
    ["A1", "葡萄糖活化/异构化能力"],
    ["A2", "甲酸前体生成能力"],
    ["A3", "中间体转甲酸能力"],
    ["A4", "甲酸/甲酸盐释放与稳定能力"],
    ["B1", "副产物路径风险"],
  ]
  const descriptorRows = [
    ["稳定性描述符 Stability descriptors", "water stability, hydrothermal stability, metal leaching risk, post-reaction PXRD retention"],
    ["可及性描述符 Accessibility descriptors", "PLD, LCD, pore volume, hydrophilic pore environment"],
    ["活性位点描述符 Active-site descriptors", "metal type, valence state, Lewis acidity, basic sites, open metal sites"],
    ["官能团描述符 Functional-group descriptors", <>-NH<Sub>2</Sub>, -OH, -COOH, defects, Zr-OH, Fe-OH</>],
    ["反应描述符 Reaction descriptors", <><span>E</span><Sub>ads</Sub>(<ChemFormula kind="bicarbonate" />), <span>E</span><Sub>ads</Sub>(formaldehyde), <span>E</span><Sub>ads</Sub>(glyceraldehyde), <span>E</span><Sub>ads</Sub>(pyruvaldehyde), <span>E</span><Sub>ads</Sub>(formate)</>],
    ["产物描述符 Product descriptors", <><VarLabel id="Y_FA" />, <VarLabel id="S_FA_C" />, <VarLabel id="Y_lactic" />, <VarLabel id="Y_acetic" />, <VarLabel id="Y_glycolic" />, <VarLabel id="Y_pyruvic" />, <VarLabel id="Y_solid" /></>],
  ]
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TextBlock t={t}>
        有机酸项目不采用纯描述符排名，也不采用纯 CRITIC 权重，而是采用反应主导型评分框架。机理先验定义主要催化步骤，CRITIC 用作数据驱动的权重校正层：Mechanism prior + CRITIC adjustment + RGFA Score。
      </TextBlock>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {pathwayRows.map(([title, body]) => <MethodCard key={title} title={title} body={body} t={t} tone="note" />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 9 }}>
        {steps.map(([term, body]) => <MethodCard key={term} title={term} body={body} t={t} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {descriptorRows.map(([title, body]) => <MethodCard key={title} title={title} body={body} t={t} tone="note" />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <FormulaCard title="Gate" t={t}>
          <span>Gate</span><span>=</span><span>waterStabilityScore</span><span>×</span><span>accessibilityScore</span><span>×</span><span>activeSiteConfidence</span>
        </FormulaCard>
        <FormulaCard title="StepScore" t={t}>
          <span>StepScore</span><span>=</span><span>0.15A1</span><span>+</span><span>0.20A2</span><span>+</span><span>0.35A3</span><span>+</span><span>0.15A4</span><span>−</span><span>0.15B1</span>
        </FormulaCard>
        <FormulaCard title="SelectivityFactor" t={t}>
          <span>(</span><VarLabel id="Y_FA" /><span>×</span><VarLabel id="S_FA_C" /><span>)</span><span>/</span><span>(1 +</span><VarLabel id="w_lactic" /><VarLabel id="Y_lactic" /><span>+</span><VarLabel id="w_acetic" /><VarLabel id="Y_acetic" /><span>+</span><VarLabel id="w_glycolic" /><VarLabel id="Y_glycolic" /><span>+</span><VarLabel id="w_pyruvic" /><VarLabel id="Y_pyruvic" /><span>+</span><VarLabel id="w_solid" /><VarLabel id="Y_solid" /><span>)</span>
        </FormulaCard>
        <FormulaCard title="RGFA Score" t={t}>
          <span>RGFA Score</span><span>=</span><span>Gate</span><span>×</span><span>StepScore</span><span>×</span><span>SelectivityFactor</span>
        </FormulaCard>
        <FormulaCard title="CRITIC" t={t}>
          <VarLabel id="C_j" /><span>=</span><VarLabel id="sigma_j" /><span>×</span><span>Σ(1 −</span><VarLabel id="r_ij" /><span>)</span><span>;</span><VarLabel id="w_j" /><span>=</span><VarLabel id="C_j" /><span>/ Σ</span><VarLabel id="C_j" />
        </FormulaCard>
        <FormulaCard title="Blended weight" t={t}>
          <span>Final weight</span><span>=</span><span>0.7 × mechanism prior</span><span>+</span><span>0.3 × CRITIC weight</span>
        </FormulaCard>
      </div>
      <Callout tone="info">
        CRITIC 可以反映指标的信息量、离散度和冲突性，但它不理解反应机理。因此在本项目中，CRITIC 只用于校正描述符层或副产物惩罚项权重，而不取代机理先验。
      </Callout>
    </div>
  )
}

function AlgorithmTraceabilityMethod({ t, isMobile }) {
  const rows = [
    { title: "原始输入 Raw Input", body: "产物分布、步骤能力、Gate 输入和路径分数。" },
    { title: "Gate 初筛", body: "水相稳定性、可及性、活性位点可信度。" },
    { title: "路径指纹", body: "甲醛、甘油醛、丙酮醛三路径的正向和风险分支。" },
    { title: "步骤贡献", body: "A1/A2/A3/A4 正贡献与 B1 惩罚。" },
    { title: "选择性惩罚", body: "甲酸目标项与副产物分母惩罚。" },
    { title: "CRITIC 校正", body: "原型数据离散度和冲突度对副产物权重的校正。" },
    { title: "RGFA Score", body: "Gate × StepScore × SelectivityFactor。" },
    { title: "排名影响", body: "Yield-only ranking 与 RGFA ranking 的差异。" },
    { title: "下一步验证", body: "投料实验、时间序列、碳平衡和同位素示踪建议。" },
  ]
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TextBlock t={t}>
        系统不仅返回最终分数，还展示每个输入如何进入计算过程。这使用户不仅能看到哪个 MOF 排名靠前，还能看到它为什么靠前，以及哪些数据导致了这个推荐结果。
      </TextBlock>
      <MiniFlow rows={rows} t={t} isMobile={isMobile} />
    </div>
  )
}

function OrganicAcidWorkflowMethod({ t, isMobile }) {
  const rows = [
    { title: "原始实验记录 Raw experiment records", body: <>catalyst, substrate, <ChemFormula kind="sodiumBicarbonate" /> concentration, temperature, time, product yields.</> },
    { title: "产物归一化 Product normalization", body: <><VarLabel id="Y_FA" />, <VarLabel id="S_FA_C" />, <VarLabel id="Y_lactic" />, <VarLabel id="Y_acetic" />, <VarLabel id="Y_glycolic" />, <VarLabel id="Y_pyruvic" />, <VarLabel id="Y_solid" />。</> },
    { title: "路径标注 Pathway labeling", body: "formaldehyde route, glyceraldehyde route, pyruvaldehyde route." },
    { title: "描述符整理 Descriptor curation", body: "stability, accessibility, active-site, functional-group, reaction descriptors." },
    { title: "分数计算 Score computation", body: "Gate, StepScore, SelectivityFactor, RGFA Score." },
    { title: "证据标注 Evidence assignment", body: "demo, literature, experimental, DFT, isotope pending." },
    { title: "候选决策 Candidate decision", body: "priority validation, optimization, mechanistic, control, not recommended." },
  ]
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Callout tone="info">当前有机酸筛选数据统一标注为演示数据 / Demo data 或原型数据 / Prototype data，不作为真实实验结论。</Callout>
      <MiniFlow rows={rows} t={t} isMobile={isMobile} />
    </div>
  )
}

function EvidenceMatrixMethod({ t, isMobile }) {
  const rows = [
    ["产物证据 Product evidence", "HPLC / IC / GC-MS / NMR product quantification", "可用 / 部分可用 / 待验证"],
    ["路径证据 Pathway evidence", "formaldehyde, glyceraldehyde, pyruvaldehyde feeding tests", "待验证"],
    ["描述符证据 Descriptor evidence", "literature, database, post-reaction characterization, DFT pending", "部分可用"],
    ["算法证据 Algorithm evidence", "RGFA trace, CRITIC adjustment, ranking impact, data completeness", "可用"],
    ["机理证据 Mechanistic evidence", <><ChemFormula kind="isotopeBicarbonate" /> isotope tracing, time-series product analysis, carbon balance, DFT adsorption descriptors</>, "待验证"],
  ]
  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: isMobile ? 680 : 0, width: "100%" }}>
        <thead>
          <tr>
            {["证据类型 Evidence type", "证据内容 Evidence content", "状态 Status"].map(head => (
              <th key={head} style={{ borderBottom: `1px solid ${t.borderStrong}`, color: t.faint, fontSize: 11, padding: "9px 10px", textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([type, evidence, status]) => (
            <tr key={type}>
              <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontSize: 12.5, fontWeight: 900, padding: "10px" }}>{type}</td>
              <td style={{ borderBottom: `1px solid ${t.border}`, color: t.muted, fontSize: 12, lineHeight: 1.55, padding: "10px" }}>{evidence}</td>
              <td style={{ borderBottom: `1px solid ${t.border}`, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "10px" }}>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrganicAcidLimitationsMethod({ t, isMobile }) {
  const rows = [
    ["演示数据限制 Demo data limitation", "当前数据为 demo / prototype data，不代表真实实验结论。"],
    ["小样本 CRITIC 限制 Small-sample CRITIC limitation", "CRITIC 权重对小样本敏感，真实实验数据增加后需要重新计算。"],
    ["机理先验限制 Mechanism prior limitation", "A1/A2/A3/A4/B1 权重为机理先验，应随实验验证更新。"],
    ["结构式展示限制 Molecular structure display limitation", "结构式主要用于路径沟通，论文级结构图应由校验过的化学绘图工具生成。"],
    ["DFT 限制 DFT limitation", <><span>E</span><Sub>ads</Sub>(<ChemFormula kind="bicarbonate" />)、Bader charge、反应自由能目前属于后续验证描述符。</>],
    ["同位素示踪限制 Isotope tracing limitation", <><ChemFormula kind="isotopeBicarbonate" /> 示踪用于 Top 候选机理验证，不作为第一轮筛选必要条件。</>],
    ["催化剂稳定性限制 Catalyst stability limitation", "MOF 稳定性需要反应后 PXRD、ICP、FTIR、SEM/TEM 等表征确认。"],
    ["碳平衡限制 Carbon balance limitation", "碳平衡不足的数据应标记为低可信度，不应作为高质量机器学习标签。"],
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {rows.map(([title, body]) => <MethodCard key={title} title={title} body={body} t={t} tone="warn" />)}
    </div>
  )
}

function AlgorithmGrid({ lang, t, isMobile }) {
  const rows = text(
    lang,
    [
      ["Manual", "由研究者设定权重，适合已有专家假设或特定项目目标。"],
      ["Equal", "每个描述符权重相同，适合做 neutral baseline。"],
      ["CRITIC", "基于当前候选集的差异度和冲突度生成 exploratory objective weights。"],
      ["Hybrid", "把 CRITIC reference 与 manual preference 按 alpha 混合，用于避免完全依赖小样本相关结构。"],
    ],
    [
      ["Manual", "Weights are set by a researcher when a project has explicit expert assumptions."],
      ["Equal", "All descriptors receive the same weight; useful as a neutral baseline."],
      ["CRITIC", "Generates exploratory objective weights from current-set contrast and conflict."],
      ["Hybrid", "Blends CRITIC reference with manual preference through alpha to reduce small-sample dependence."],
    ]
  )
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
      {rows.map(([title, body]) => (
        <MethodCard key={title} title={title} body={body} t={t} tone={title === "CRITIC" ? "info" : "note"} />
      ))}
    </div>
  )
}

function LimitationGrid({ lang, t, isMobile }) {
  const rows = text(
    lang,
    [
      ["小样本", "CRITIC 的标准差和相关性会受当前候选集影响，不能读成普适物理权重。"],
      ["缺失值", "缺失描述符进入 completeness、warning 和解释层；缺失不是材料失败。"],
      ["证据等级", "实验、文献、DFT、模拟和 demo evidence 不能混作同等证据。"],
      ["实验条件不可比", "文献条件、活化流程、压力温度和检测方法差异会限制横向排名。"],
      ["不是 GCMC / IAST", "当前评分不能替代严格吸附模拟、IAST 混合气计算或实测等温线。"],
      ["不是实验结论", "Decision-support output 只用于候选优先级和下一步验证讨论。"],
    ],
    [
      ["Small sample", "CRITIC standard deviation and correlation depend on the current candidate set, not universal physical weight."],
      ["Missing values", "Missing descriptors enter completeness, warnings, and explanation; missing does not mean material failure."],
      ["Evidence level", "Experimental, literature, DFT, simulated, and demo evidence are not equivalent."],
      ["Condition comparability", "Different literature conditions, activation, temperature, pressure, and assay protocols limit direct ranking."],
      ["Not GCMC / IAST", "Current scoring does not replace rigorous adsorption simulation, IAST mixture calculation, or measured isotherms."],
      ["Not experimental conclusion", "Decision-support output is for candidate priority and validation planning only."],
    ]
  )
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {rows.map(([title, body], index) => (
        <MethodCard key={title} title={title} body={body} t={t} tone={index >= 4 ? "warn" : "note"} />
      ))}
    </div>
  )
}

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "方法与证据 / Methods & Evidence", "Methods & Evidence / 方法与证据")}
        subtitle={text(
          lang,
          "以系统架构图说明 EcoMOF-AI 的输入、分层模块、中间处理、解释输出与限制边界。",
          "Architecture diagrams for EcoMOF-AI inputs, layered modules, intermediate processing, explanation output, and method boundaries."
        )}
        meta={text(lang, "decision-support prototype · descriptor registry · CRITIC reference · evidence limits", "decision-support prototype · descriptor registry · CRITIC reference · evidence limits")}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "原型边界", "prototype boundary")}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={text(lang, "复制方法论链接", "Copy methodology link")} />
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "220px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <aside style={{
          position: isNarrow ? "static" : "sticky",
          top: 92,
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 10,
          maxHeight: isNarrow ? "none" : "calc(100vh - 120px)",
          overflow: "auto",
        }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
            {text(lang, "页面结构", "Contents")}
          </div>
          <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
            {sectionIds.map(item => (
              <button
                key={item[0]}
                type="button"
                onClick={() => scrollToMethodTarget(item[0])}
                style={{
                  color: t.accentText,
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: "7px 8px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 820,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontFamily: FONT_MONO,
                }}
              >
                {sectionLabel(item, lang)}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Section
            id="method-overview"
            eyebrow="01"
            title={text(lang, "Overview", "Overview")}
            subtitle={text(lang, "先说明平台角色，再展示方法架构。", "The page starts with platform role, then shows method architecture.")}
            t={t}
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(260px, 0.85fr)", gap: 12 }}>
              <TextBlock t={t}>
                {text(
                  lang,
                  "EcoMOF-AI 是面向 MOF 候选筛选、描述符整理、证据追踪和绿色评价的 decision-support prototype。它帮助研究者检查“为什么某个候选被排在前面”，但不声称当前分数是已验证预测器，也不替代实验、GCMC、IAST 或完整机理研究。",
                  "EcoMOF-AI is a decision-support prototype for MOF candidate screening, descriptor curation, evidence tracking, and sustainability-oriented evaluation. It helps researchers inspect why a candidate is prioritized, but the score is not a validated predictor and does not replace experiments, GCMC, IAST, or full mechanistic studies."
                )}
              </TextBlock>
              <MethodCard
                t={t}
                tone="warn"
                title={text(lang, "使用边界", "Boundary")}
                body={text(
                  lang,
                  "当前输出应读作 candidate priority / research discussion，不应读作最终催化性能、吸附性能或 LCA 结论。",
                  "Current output should be read as candidate priority / research discussion, not final catalysis, adsorption, or LCA conclusion."
                )}
              />
            </div>
          </Section>

          <Section
            id="scoring-pipeline"
            eyebrow="02"
            title="EcoMOF-AI Scoring Pipeline"
            subtitle={text(lang, "Methods 页面最重要的总图：输入、模块、旁路数据质量、解释输出都在同一链路中。", "The main Methods diagram: input, modules, side data quality, and explanation output are shown in one chain.")}
            t={t}
          >
            <ScoringPipelineDiagram t={t} lang={lang} />
          </Section>

          <Section
            id="descriptor-registry"
            eyebrow="03"
            title={text(lang, "Descriptor Registry", "Descriptor Registry")}
            subtitle={text(lang, "说明全局描述符注册中心如何管理单位、方向、normalizer、缺失策略和证据要求。", "How the global descriptor registry manages units, direction, normalizer, missing policy, and evidence requirements.")}
            t={t}
          >
            <DescriptorRegistryDiagram t={t} lang={lang} />
            <div id="registry-viewer" style={{ scrollMarginTop: 118 }}>
              <DescriptorRegistryViewer t={t} lang={lang} isMobile={isMobile} />
            </div>
          </Section>

          <Section
            id="weighting-algorithms"
            eyebrow="04"
            title={text(lang, "Weighting Algorithms", "Weighting Algorithms")}
            subtitle={text(lang, "Manual / Equal / CRITIC / Hybrid 使用同一 scoring engine 接口；CRITIC 只是探索性参考，不是证明。", "Manual / Equal / CRITIC / Hybrid use the same scoring-engine interface; CRITIC is an exploratory reference, not proof.")}
            t={t}
          >
            <AlgorithmGrid lang={lang} t={t} isMobile={isMobile} />
            <div id="critic-weighting" style={{ scrollMarginTop: 118 }}>
              <CriticWeightingDiagram t={t} lang={lang} />
            </div>
          </Section>

          <Section
            id="organic-acid-rgfa"
            eyebrow="05"
            title="有机酸筛选的反应主导型权重算法 / Reaction-Guided Weighting"
            subtitle="Organic Acid Project 使用机理先验 + CRITIC 校正 + RGFA Score，而不是纯描述符排名。"
            t={t}
          >
            <OrganicAcidRgfaMethod t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="algorithm-traceability"
            eyebrow="06"
            title="算法可追踪性 / Algorithm Traceability"
            subtitle="从原始输入到推荐实验，展示候选 MOF 为什么靠前以及哪些数据导致了该推荐。"
            t={t}
          >
            <AlgorithmTraceabilityMethod t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="explanation-evidence"
            eyebrow="07"
            title={text(lang, "Explanation & Evidence", "Explanation & Evidence")}
            subtitle={text(lang, "把“为什么是这个结果”的用户入口，拆成更专业的评分依据、结果解释和排序解释。", "The “Why this result?” entry is structured into scoring basis, result explanation, and ranking explanation.")}
            t={t}
          >
            <ExplanationLayerDiagram t={t} lang={lang} />
            <div id="why-this-result-ui" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, scrollMarginTop: 118 }}>
              <MethodCard
                t={t}
                title={text(lang, "评分依据", "Scoring basis")}
                body={text(lang, "展示分数、主导描述符、descriptor completeness 与缺失字段处理。", "Shows score, main descriptors, descriptor completeness, and missing-field handling.")}
              />
              <MethodCard
                t={t}
                title={text(lang, "结果解释", "Result explanation")}
                body={text(lang, "解释候选为什么靠前、为什么靠后，以及哪些数据限制影响判断。", "Explains why a candidate ranks higher or lower and which data limits affect the judgment.")}
              />
              <MethodCard
                t={t}
                title={text(lang, "排序解释", "Ranking explanation")}
                body={text(lang, "连接权重模式、CRITIC reference、evidence warning 与下一步验证建议。", "Connects weighting mode, CRITIC reference, evidence warnings, and next validation steps.")}
              />
            </div>
            <Callout tone="info">
              {text(
                lang,
                "中文入口“为什么是这个结果”可以保留为用户按钮；方法页内部用“评分依据 / 结果解释 / 排序解释”来组织信息。",
                "The Chinese user-facing entry “为什么是这个结果” can remain on buttons; the method page organizes the content as scoring basis / result explanation / ranking explanation."
              )}
            </Callout>
          </Section>

          <Section
            id="organic-evidence-matrix"
            eyebrow="08"
            title="证据与解释矩阵 / Evidence & Explanation Matrix"
            subtitle="统一产品证据、路径证据、描述符证据、算法证据和机理证据的状态标注。"
            t={t}
          >
            <EvidenceMatrixMethod t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="organic-catalysis-workflow"
            eyebrow="09"
            title="有机酸筛选的催化数据工作流 / Catalysis Data Workflow"
            subtitle="把原始实验记录转化为路径标签、描述符、RGFA 分数、证据等级和候选决策。"
            t={t}
          >
            <OrganicAcidWorkflowMethod t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="organic-acid-limitations"
            eyebrow="10"
            title="有机酸筛选模块的限制说明 / Organic Acid Screening Limitations"
            subtitle="限制说明用于界定原型筛选结果的使用边界，不削弱项目价值，也不把原型分数误读为已验证结论。"
            t={t}
          >
            <OrganicAcidLimitationsMethod t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="method-limitations"
            eyebrow="11"
            title={text(lang, "Limitations", "Limitations")}
            subtitle={text(lang, "限制说明和架构图同等重要，避免把原型输出误读为已验证科研结论。", "Limitations are part of the method architecture and prevent prototype output from being misread as validated scientific conclusion.")}
            t={t}
          >
            <LimitationGrid lang={lang} t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="catalysis-data-workflow"
            eyebrow="12"
            title={text(lang, "Catalysis Data Workflow", "Catalysis Data Workflow")}
            subtitle={text(lang, "说明 CatalysisLab 是通用催化记录工作台，而不是只有有机酸 case。", "Shows that CatalysisLab is a general catalysis-record workbench, not only the organic-acid case.")}
            t={t}
          >
            <CatalysisWorkflowDiagram t={t} lang={lang} />
          </Section>
        </main>
      </div>
    </div>
  )
}
