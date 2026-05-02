import { useT, useLang, useViewport, BasisBadge, BrandMark, Callout } from "../../shared"
import { toolbarBtn } from "../../utils/styles"

export function HomeTab({ setActiveTab, onContactOpen }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  const position = {
    en: "ecomof-ai is a research-oriented MOF AI prototype platform for early-stage candidate screening, sustainability evaluation, performance comparison, and task-oriented application exploration.",
    zh: "ecomof-ai 是一个面向科研合作的 MOF AI 原型平台，用于早期候选材料筛选、可持续性评价、性能比较和任务导向应用探索。",
  }
  const modules = [
    {
      id: "performance",
      name: "Performance",
      eyebrow: lang === "zh" ? "吸附与热力学筛选" : "Adsorption and thermodynamic screening",
      body: lang === "zh"
        ? "CO₂ 吸附量、选择性、热力学解释和吸附相关候选材料比较。"
        : "CO₂ uptake, selectivity, thermodynamic interpretation, and adsorption-related candidate comparison.",
      badge: lang === "zh" ? "吸附候选排序" : "Adsorption candidate ranking",
    },
    {
      id: "ecoscreen",
      name: "EcoScreen",
      eyebrow: lang === "zh" ? "可持续性与可行性评价" : "Sustainability and feasibility evaluation",
      body: lang === "zh"
        ? "面向可持续性的 MOF 筛选，结合 LCA、LCC、毒性、成本、稳定性和鲁棒性指标。"
        : "Sustainability-oriented MOF screening with LCA, LCC, toxicity, cost, stability, and robustness indicators.",
      badge: lang === "zh" ? "可持续性优先级" : "Sustainability priority",
    },
    {
      id: "catalysis",
      name: "CatalysisLab",
      eyebrow: lang === "zh" ? "任务导向应用探索" : "Task-oriented application exploration",
      body: lang === "zh"
        ? "基于规则的催化候选材料优先级筛选，面向 CO₂ 转化、生物质转化、光催化和电催化等任务。"
        : "Rule-based catalysis candidate prioritization for CO₂ conversion, biomass conversion, photocatalysis, and electrocatalysis.",
      badge: lang === "zh" ? "候选优先级筛选" : "Candidate prioritization",
    },
  ]
  const workflow = lang === "zh"
    ? ["数据输入", "描述符整理", "任务规则", "综合评分", "候选排序", "结果解释", "实验验证"]
    : ["Data input", "Descriptor curation", "Task rules", "Scoring", "Candidate ranking", "Interpretation", "Validation"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
      <section style={{
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.66fr) minmax(300px, 0.34fr)",
        gap: isNarrow ? 20 : 38,
        alignItems: "end",
        padding: isMobile ? "24px 0 8px" : "42px 0 16px",
      }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "flex-start",
          gap: isMobile ? 14 : 18,
        }}>
          <BrandMark
            size={isMobile ? 56 : 68}
            radius={isMobile ? 14 : 16}
            style={{
              marginTop: isMobile ? 0 : 2,
              boxShadow: t.shadowSm,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: 32, fontWeight: 700, letterSpacing: 0, lineHeight: 1.15 }}>
              {lang === "zh" ? "面向科研合作的 MOF AI 原型平台" : "Research-oriented MOF AI prototype platform"}
            </h1>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 880 }}>
              {lang === "zh" ? position.zh : position.en}
            </p>
            <div style={{ marginTop: 10, color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
              {lang === "zh" ? "总览 · Performance · EcoScreen · CatalysisLab · MOF 库 · 方法学" : "Overview · Performance · EcoScreen · CatalysisLab · MOF Library · Methodology"}
            </div>
          </div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginBottom: 10 }}>
            {lang === "zh" ? "平台边界" : "Platform boundary"}
          </div>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 820, lineHeight: 1.55 }}>
            {lang === "zh"
              ? "平台结果用于早期筛选、决策支持和研究假设生成，不替代实验验证、严格 GCMC 模拟、IAST 分析或完整工业 LCA。"
              : "The platform provides decision-support results for early-stage screening and hypothesis generation. It does not replace experimental validation, rigorous GCMC simulation, IAST analysis, or full industrial LCA."}
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
            {module.id === "performance" ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("performance")}
                  style={{ ...toolbarBtn(t), padding: "9px 13px" }}
                >
                  {lang === "zh" ? "查看结果" : "View results"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { sessionStorage.setItem("ecomof_perf_init_view", "advanced") } catch {}
                    setActiveTab("performance")
                  }}
                  style={{ ...toolbarBtn(t), padding: "9px 13px", border: `1px solid ${t.accent}`, color: t.accentText }}
                >
                  {lang === "zh" ? "高级筛选" : "Advanced screening"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setActiveTab(module.id)} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
                {module.id === "ecoscreen"
                  ? (lang === "zh" ? "查看可持续性评价" : "Explore EcoScreen")
                  : (lang === "zh" ? "进入催化筛选" : "Open CatalysisLab")}
              </button>
            )}
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
          ? "使用提示：平台评分表达候选优先级、潜力和待验证状态。任何吸附、催化或环境结论都必须经过独立数据和实验验证。"
          : "Use note: scores express candidate priority / potential / needs validation. Any adsorption, catalysis, or sustainability claim requires independent data and experimental validation."}
      </Callout>

      {/* ── Contact / Collaboration CTA ─────────────────────────────────── */}
      <section style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: isMobile ? "20px 16px" : "26px 30px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            {lang === "zh" ? "合作联系" : "Collaboration"}
          </div>
          <div style={{ color: t.textStrong, fontSize: isMobile ? 17 : 20, fontWeight: 850, lineHeight: 1.2, marginBottom: 10 }}>
            {lang === "zh" ? "联系 / 合作" : "Contact / Collaboration"}
          </div>
          <p style={{ margin: 0, color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 540 }}>
            {lang === "zh"
              ? "如果你希望将 ecomof-ai 用于 MOF 筛选、催化数据整理、LCA 评价或科研合作，可以留下联系方式，并简要说明你的数据或研究问题。"
              : "Interested in using ecomof-ai for MOF screening, catalysis data curation, LCA evaluation, or research collaboration? Send a short message and describe your dataset or research question."}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            type="button"
            onClick={onContactOpen}
            style={{
              ...toolbarBtn(t),
              padding: "11px 22px",
              border: `1px solid ${t.accent}`,
              color: t.accentText,
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {lang === "zh" ? "联系 / 合作 →" : "Contact / Collaboration →"}
          </button>
        </div>
      </section>
    </div>
  )
}
