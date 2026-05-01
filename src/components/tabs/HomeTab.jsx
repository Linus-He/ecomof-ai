import { useT, useLang, useViewport, BasisBadge, PageHeader } from "../../shared"
import { toolbarBtn } from "../../utils/styles"

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  const modules = [
    {
      id: "ecoscreen",
      name: "EcoScreen",
      eyebrow: lang === "zh" ? "可持续性筛选" : "Sustainability screening",
      body: lang === "zh"
        ? "面向低环境负担和可行性边界的 MOF 候选优先级排序，保留现有 Eco Score、LCA/LCC 和解释逻辑。"
        : "Prioritize MOF candidates by environmental burden and feasibility boundaries while preserving Eco Score, LCA/LCC, and explanation logic.",
      badge: lang === "zh" ? "候选优先级" : "Candidate priority",
    },
    {
      id: "catalysis",
      name: "CatalysisLab",
      eyebrow: lang === "zh" ? "催化任务筛选" : "Catalysis task screening",
      body: lang === "zh"
        ? "第一版使用模拟数据，对催化潜力、任务适配和证据等级进行候选级展示；所有结果仍需实验验证。"
        : "A mock-data first version for catalysis potential, task fit, and evidence levels; all outputs require validation.",
      badge: lang === "zh" ? "潜力候选 / 需要验证" : "potential / needs validation",
    },
  ]

  const workflow = lang === "zh"
    ? ["数据库", "特征提取", "任务规则", "评分", "候选排序", "实验验证"]
    : ["Database", "Feature Extraction", "Task Rules", "Scoring", "Candidate Ranking", "Experimental Validation"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 26 : 34 }}>
      <section style={{
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.62fr) minmax(320px, 0.38fr)",
        gap: isNarrow ? 22 : 42,
        alignItems: "end",
        padding: isMobile ? "28px 0 10px" : "46px 0 18px",
      }}>
        <PageHeader
          title={lang === "zh" ? "任务导向的 MOF 筛选平台" : "Task-oriented MOF screening platform"}
          subtitle={lang === "zh"
            ? "ecomof 将材料数据库、结构特征、任务规则和评分解释组织成面向任务的候选优先级系统。平台输出用于形成候选清单，不替代实验验证或完整科研结论。"
            : "ecomof organizes material databases, descriptors, task rules, and scoring explanations into a task-oriented candidate-prioritization system. Outputs form shortlists; they do not replace experimental validation."}
          meta={lang === "zh" ? "总览 · EcoScreen · CatalysisLab · MOF 库 · 方法学" : "Overview · EcoScreen · CatalysisLab · MOF Library · Methodology"}
        />
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            {lang === "zh" ? "平台定位" : "Platform scope"}
          </div>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>
            {lang === "zh" ? "以任务筛选组织信息，而不是把数据库数值直接包装成科研结论。" : "Information is organized by screening task, not by treating database values as final scientific conclusions."}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        {modules.map(module => (
          <article key={module.id} className="content-card" style={{
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: isMobile ? 18 : 22,
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 18,
          }}>
            <div>
              <BasisBadge tone={module.id === "ecoscreen" ? "info" : "proxy"}>{module.badge}</BasisBadge>
              <div style={{ color: t.faint, fontSize: 11, fontWeight: 850, textTransform: "uppercase", marginTop: 16 }}>{module.eyebrow}</div>
              <h2 style={{ margin: "8px 0 0", color: t.textStrong, fontSize: isMobile ? 28 : 34, letterSpacing: 0, lineHeight: 1.05 }}>{module.name}</h2>
              <p style={{ margin: "14px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 620 }}>{module.body}</p>
            </div>
            <button type="button" onClick={() => setActiveTab(module.id)} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
              {lang === "zh" ? "进入模块" : "Open module"}
            </button>
          </article>
        ))}
      </section>

      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: isMobile ? 16 : 20 }}>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 850, marginBottom: 14 }}>
          {lang === "zh" ? "统一筛选工作流" : "Unified Screening Workflow"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(6, minmax(0, 1fr))", gap: 10 }}>
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
    </div>
  )
}
