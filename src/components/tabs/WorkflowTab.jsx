import {
  useT, useLang, useViewport,
  DEFAULT_INPUTS, toolbarBtn,
  BasisBadge, PageHeader, Callout, StageStrip, StickySummaryBar,
} from "../../shared"

export function WorkflowTab({ setActiveTab, inputs, results }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const stages = lang === "zh" ? [
    ["第 1 阶段 — 科学筛选", "性能、化学合理性、结构解释和筛选置信度是最早的过滤器。", "主要筛选", t.performance],
    ["第 2 阶段 — 可行性边界", "检查可得性、粗略成本、供应风险和实践过程约束，缩小搜索空间。", "可行性边界", t.lccAccent],
    ["第 3 阶段 — 次级比较", "只对入围候选做初步 LCA/LCC 与敏感性稳健性比较。", "入围候选比较", t.sensitivityAccent],
    ["未来第 4 阶段 — 工程评估", "正式工艺路线、放大经济性和工业级 LCA/LCC 属于后续工程工作。", "未来工程评估", t.validationAccent],
  ] : [
    ["Stage 1 — Scientific Screening", "Performance, chemistry, interpretation, and screening confidence are the earliest filter.", "Primary screening", t.performance],
    ["Stage 2 — Feasibility Boundaries", "Check availability, rough cost, supply risk, and practical process constraints to narrow the search space.", "Feasibility boundary", t.lccAccent],
    ["Stage 3 — Secondary Comparison", "Run preliminary LCA/LCC and sensitivity only for shortlisted candidates.", "Shortlist comparison", t.sensitivityAccent],
    ["Future Stage 4 — Engineering Evaluation", "Formal process routes, scale-up economics, and industrial-grade LCA/LCC belong to later engineering work.", "Future engineering evaluation", t.validationAccent],
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "工作流" : "Workflow"}
        subtitle={lang === "zh"
          ? "MOF 候选筛选、可行性边界与入围后比较的分阶段路径。"
          : "A staged path for MOF screening, feasibility boundaries, and shortlist comparison."}
        meta={lang === "zh" ? "不是扁平工具箱" : "Not a flat toolbox"}
        action={<BasisBadge tone="info">{lang === "zh" ? "分阶段原型" : "Staged prototype"}</BasisBadge>}
      />
      <StageStrip current="screening" onNavigate={setActiveTab} />
      <StickySummaryBar inputs={inputs || DEFAULT_INPUTS} results={results} stage={lang === "zh" ? "工作流总览" : "Workflow overview"} />
      <Callout tone="info">
        {lang === "zh"
          ? "核心原则：不要把 LCA/LCC/敏感性当作与性能筛选同等早期的主要命中识别。它们是科学筛选之后的次级比较层。"
          : "Core rule: do not treat LCA/LCC/sensitivity as equally early primary hit identification. They are secondary comparison layers after scientific screening."}
      </Callout>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {stages.map(([title, body, chip, accent], index) => (
          <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${accent}` }}>
            <BasisBadge tone={index === 0 ? "info" : index === 1 ? "proxy" : index === 2 ? "user" : "calc"}>{chip}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 12, lineHeight: 1.3 }}>{title}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setActiveTab("screening")} style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff" }}>
          {lang === "zh" ? "进入科学筛选" : "Go to Screening"}
        </button>
        <button type="button" onClick={() => setActiveTab("comparison")} style={toolbarBtn(t)}>
          {lang === "zh" ? "查看比较层" : "View Comparison Layers"}
        </button>
      </div>
    </div>
  )
}
