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
  ["explanation-evidence", "Explanation & Evidence", "解释与证据"],
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
            id="explanation-evidence"
            eyebrow="05"
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
            id="method-limitations"
            eyebrow="06"
            title={text(lang, "Limitations", "Limitations")}
            subtitle={text(lang, "限制说明和架构图同等重要，避免把原型输出误读为已验证科研结论。", "Limitations are part of the method architecture and prevent prototype output from being misread as validated scientific conclusion.")}
            t={t}
          >
            <LimitationGrid lang={lang} t={t} isMobile={isMobile} />
          </Section>

          <Section
            id="catalysis-data-workflow"
            eyebrow="07"
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
