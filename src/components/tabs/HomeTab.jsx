import { useT, useLang, useViewport, BasisBadge, PageHeader, Callout } from "../../shared"
import { toolbarBtn } from "../../utils/styles"

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  const position = {
    en: "ecomof-ai is a research-oriented MOF AI prototype platform for early-stage candidate screening, sustainability evaluation, and task-oriented application exploration.",
    zh: "ecomof-ai 是一个面向科研合作的 MOF AI 原型平台，用于早期候选材料筛选、可持续性评价和任务导向应用探索。",
  }
  const modules = [
    {
      id: "performance",
      name: "Performance",
      eyebrow: lang === "zh" ? "吸附与热力学筛选" : "Adsorption and thermodynamic screening",
      body: lang === "zh"
        ? "围绕 CO₂ uptake、选择性和热力学解释，形成早期候选材料的性能优先级。"
        : "Prioritize early-stage candidates through CO₂ uptake, selectivity, and thermodynamic interpretation.",
      badge: lang === "zh" ? "吸附候选排序" : "Adsorption candidate ranking",
    },
    {
      id: "ecoscreen",
      name: "EcoScreen",
      eyebrow: lang === "zh" ? "可持续性与可行性评价" : "Sustainability and feasibility evaluation",
      body: lang === "zh"
        ? "整理 LCA、LCC、毒性、成本和稳健性线索，用于候选材料的可持续性优先级判断。"
        : "Organize LCA, LCC, toxicity, cost, and robustness cues for sustainability-oriented prioritization.",
      badge: lang === "zh" ? "可持续性优先级" : "Sustainability priority",
    },
    {
      id: "catalysis",
      name: "CatalysisLab",
      eyebrow: lang === "zh" ? "任务导向应用探索" : "Task-oriented application exploration",
      body: lang === "zh"
        ? "使用 Rule-based Model 对催化候选材料进行优先级筛选，当前仅作为潜力与假设生成工具。"
        : "Use a Rule-based Model for catalysis candidate prioritization as a potential and hypothesis-generation tool.",
      badge: lang === "zh" ? "规则评分 / 需要验证" : "Rule-based / needs validation",
    },
  ]
  const workflow = lang === "zh"
    ? ["数据库", "特征提取", "任务规则", "Rule-based Scoring", "Candidate Ranking", "结果解释", "实验验证"]
    : ["Database", "Feature Extraction", "Task Rules", "Rule-based Scoring", "Candidate Ranking", "Results Interpretation", "Experimental Validation"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
      <section style={{
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.66fr) minmax(300px, 0.34fr)",
        gap: isNarrow ? 20 : 38,
        alignItems: "end",
        padding: isMobile ? "24px 0 8px" : "42px 0 16px",
      }}>
        <PageHeader
          title={lang === "zh" ? "面向科研合作的 MOF AI 原型平台" : "Research-oriented MOF AI prototype platform"}
          subtitle={lang === "zh" ? position.zh : position.en}
          meta={lang === "zh" ? "总览 · Performance · EcoScreen · CatalysisLab · MOF 库 · 方法学" : "Overview · Performance · EcoScreen · CatalysisLab · MOF Library · Methodology"}
        />
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            {lang === "zh" ? "平台边界" : "Platform boundary"}
          </div>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 820, lineHeight: 1.55 }}>
            {lang === "zh"
              ? "结果用于 Early-stage Screening、假设生成和决策支持，不替代实验验证、GCMC、严格 IAST 或完整工业 LCA。"
              : "Outputs support early-stage screening, hypothesis generation, and decision support. They do not replace experimental validation, GCMC, strict IAST, or full industrial LCA."}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        {modules.map(module => (
          <article key={module.id} className="content-card" style={{
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: isMobile ? 16 : 20,
            minHeight: 224,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 16,
          }}>
            <div>
              <BasisBadge tone={module.id === "performance" ? "calc" : module.id === "ecoscreen" ? "info" : "proxy"}>{module.badge}</BasisBadge>
              <div style={{ color: t.faint, fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginTop: 14 }}>{module.eyebrow}</div>
              <h2 style={{ margin: "8px 0 0", color: t.textStrong, fontSize: isMobile ? 26 : 31, letterSpacing: 0, lineHeight: 1.08 }}>{module.name}</h2>
              <p style={{ margin: "12px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65 }}>{module.body}</p>
            </div>
            <button type="button" onClick={() => setActiveTab(module.id)} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
              {lang === "zh" ? "进入模块" : "Open module"}
            </button>
          </article>
        ))}
      </section>

      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: isMobile ? 16 : 20 }}>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 850, marginBottom: 14 }}>
          {lang === "zh" ? "简洁工作流" : "Screening Workflow"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(7, minmax(0, 1fr))", gap: 10 }}>
          {workflow.map((step, index) => (
            <div key={step} style={{ display: "grid", gridTemplateColumns: isNarrow ? "34px 1fr" : "1fr", gap: 8, alignItems: "center" }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: t.badgeInfoBg,
                border: `1px solid ${t.borderStrong}`,
                color: t.accentText,
                fontSize: 11,
                fontWeight: 900,
              }}>
                {index + 1}
              </div>
              <div style={{ color: t.muted, fontSize: 12, fontWeight: 780, lineHeight: 1.35 }}>{step}</div>
            </div>
          ))}
        </div>
      </section>

      <Callout tone="warn">
        {lang === "zh"
          ? "使用提示：平台评分表达 candidate priority / potential / needs validation。任何吸附、催化或环境结论都必须经过独立数据和实验验证。"
          : "Use note: scores express candidate priority / potential / needs validation. Any adsorption, catalysis, or sustainability claim requires independent data and experimental validation."}
      </Callout>
    </div>
  )
}
