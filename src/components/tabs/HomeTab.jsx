import { useT, useLang, useViewport } from "../../contexts"
import { FONT_MONO } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { BasisBadge } from "../ui/index.jsx"

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const sectionStyle = { padding: isMobile ? "56px 0" : "76px 0" }
  const sectionTitleStyle = { margin: 0, color: t.textStrong, fontSize: isMobile ? 26 : 34, lineHeight: 1.12, letterSpacing: 0 }
  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)" }
  const heroStages = lang === "zh" ? [
    {
      stage: "Stage 1",
      title: "科学筛选",
      accent: t.performance,
      items: ["性能", "稳定性 / 化学线索", "结果解释"],
    },
    {
      stage: "Stage 2-3",
      title: "后续决策层",
      accent: t.lccAccent,
      items: ["成本合理性检查", "生命周期比较", "稳健性"],
    },
  ] : [
    {
      stage: "Stage 1",
      title: "Scientific screening",
      accent: t.performance,
      items: ["Performance", "Stability / chemistry cues", "Interpretation"],
    },
    {
      stage: "Stage 2-3",
      title: "Decision layers",
      accent: t.lccAccent,
      items: ["Cost sanity", "Lifecycle comparison", "Robustness"],
    },
  ]
  const capabilities = [
    { key: "performance", badge: "Primary screening", title: c.home.predict, body: c.home.predictBody, accent: t.performance },
    { key: "impact", badge: "Feasibility boundary", title: c.home.evaluate, body: c.home.evaluateBody, featured: true, accent: t.lccAccent },
    { key: "robustness", badge: "Shortlist comparison", title: c.home.robustness, body: c.home.robustnessBody, accent: t.sensitivityAccent },
  ]
  const workflow = lang === "zh" ? [
    ["01", "筛选性能与稳定性", "以吸附性能、化学合理性和适用域作为第一过滤器。"],
    ["02", "检查粗略可行性边界", "查看成本、可得性和供应风险是否明显阻断。"],
    ["03", "比较入围候选", "对入围候选做初步 LCA/LCC 和稳健性比较。"],
    ["04", "进入工程评估", "后续再做工艺路线、放大经济性和正式工业 LCA。"],
  ] : [
    ["01", "Screen for performance and stability", "Use adsorption performance, chemistry, and applicability as the first filter."],
    ["02", "Check rough feasibility boundaries", "Flag cost, availability, and supply risks that may block practical use."],
    ["03", "Compare shortlisted candidates", "Run preliminary LCA/LCC and robustness comparisons after shortlist formation."],
    ["04", "Move toward engineering evaluation", "Reserve process-route design, scale-up economics, and formal industrial LCA for the future stage."],
  ]
  const benchmarks = lang === "zh" ? [
    ["UiO-66", "用于解释结构-性能权衡的稳定参考案例。", "Benchmark-backed", "大卡"],
    ["HKUST-1", "具有开放金属位点的经典吸附相关基准。", "Canonical case", "小卡"],
    ["ZIF-8", "用于比较选择性和孔道可及趋势的轻量参考材料。", "Reference material", "小卡"],
  ] : [
    ["UiO-66", "A stable reference case for interpreting structure-performance trade-offs.", "Benchmark-backed", "large"],
    ["HKUST-1", "Open metal site benchmark with strong adsorption relevance.", "Canonical case", "small"],
    ["ZIF-8", "A lightweight comparison point for selectivity and pore-access trends.", "Reference material", "small"],
  ]
  const trustBlocks = [
    [lang === "zh" ? "验证" : "Validation", c.home.trustValidation],
    [lang === "zh" ? "数据来源" : "Data Sources", c.home.trustData],
    [lang === "zh" ? "范围与限制" : "Scope and limits", c.home.trustLimits],
  ]
  const scrollToBenchmarks = () => {
    document.getElementById("home-benchmarks")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <section style={{
        minHeight: isNarrow ? "auto" : "calc(100vh - 104px)",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.42fr) minmax(0, 0.58fr)",
        gap: isNarrow ? 28 : 46,
        alignItems: "center",
        padding: isMobile ? "42px 0 64px" : "62px 0 86px",
      }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 12, fontWeight: 800, letterSpacing: 0, marginBottom: 18 }}>
            {c.home.heroLabel}
          </div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 42 : isNarrow ? 54 : 70, lineHeight: 0.96, letterSpacing: 0 }}>
            {c.home.title}
          </h1>
          <p style={{ color: t.muted, fontSize: isMobile ? 16 : 18, lineHeight: 1.55, maxWidth: 560, margin: "24px 0 26px" }}>
            {c.home.subtitle}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setActiveTab("screening")} style={{ ...toolbarBtn(t), background: t.accent, color: "#fff", borderColor: t.accent, padding: "10px 16px", boxShadow: t.shadowSm }}>
              {c.home.start}
            </button>
            <button onClick={() => setActiveTab("comparison")} style={{ ...toolbarBtn(t), padding: "10px 16px" }}>
              {lang === "zh" ? "查看比较层" : "View Comparison Layers"}
            </button>
          </div>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${t.panel}, ${t.glassStrong})`,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 18,
          padding: isMobile ? 22 : 34,
          boxShadow: t.shadowMd,
          minHeight: isMobile ? 380 : 500,
          display: "flex",
          alignItems: "stretch",
          backdropFilter: "blur(20px) saturate(145%)",
        }}>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: isMobile ? 14 : 18, width: "100%", flex: 1 }}>
            {heroStages.map(stage => (
              <div key={stage.stage} style={{
                padding: isMobile ? 18 : 24,
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                background: t.glass,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "160px 1fr",
                gap: 16,
                alignItems: "center",
              }}>
                <div>
                  <BasisBadge tone={stage.stage === "Stage 1" ? "info" : "proxy"}>{stage.stage}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: isMobile ? 24 : 32, fontWeight: 880, lineHeight: 1.08, marginTop: 12 }}>{stage.title}</div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {stage.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: stage.accent, flex: "0 0 auto" }} />
                      <span style={{ color: t.muted, fontSize: 13, fontWeight: 750 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.capabilityTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 26, alignItems: "stretch" }}>
          {capabilities.map(item => (
            <div key={item.key} style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              minHeight: item.featured && !isNarrow ? 156 : 144,
              transform: item.featured && !isNarrow ? "translateY(-4px)" : "none",
              borderColor: item.featured ? t.borderStrong : t.border,
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: item.accent }} />
              <div style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.borderStrong}`, color: item.accent,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 850, marginBottom: 14 }}>
                {item.key === "performance" ? "P" : item.key === "impact" ? "L" : "S"}
              </div>
              <BasisBadge tone={item.key === "performance" ? "info" : item.key === "impact" ? "proxy" : "user"}>{item.badge}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, lineHeight: 1.2, marginTop: 12 }}>{item.title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.45, marginTop: 7 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.workflowTitle}</h2>
        <div style={{ marginTop: 34, position: "relative" }}>
          {!isNarrow && (
            <div style={{ position: "absolute", left: "8%", right: "8%", top: 23, height: 1, background: t.borderStrong }} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: isNarrow ? 22 : 24 }}>
            {workflow.map(([num, title, body]) => (
              <div key={num} style={{ position: "relative", paddingTop: isNarrow ? 0 : 54 }}>
                {!isNarrow && (
                  <div style={{ position: "absolute", top: 13, left: 0, width: 22, height: 22, borderRadius: "50%", background: t.bg, border: `2px solid ${t.accent}` }} />
                )}
                <div style={{ color: t.accentText, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 850 }}>{num}</div>
                <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, marginTop: 8 }}>{title}</div>
                <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8, maxWidth: 260 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="home-benchmarks" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.benchmarkTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.08fr 0.92fr", gap: 16, marginTop: 26 }}>
          <div style={{ ...cardStyle, minHeight: isNarrow ? 260 : 360, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <BasisBadge tone="calc">{benchmarks[0][2]}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 34 : 48, fontWeight: 880, letterSpacing: 0, marginTop: 22 }}>{benchmarks[0][0]}</div>
              <div style={{ color: t.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 540, marginTop: 14 }}>{benchmarks[0][1]}</div>
            </div>
            <button type="button" onClick={() => setActiveTab("literature")} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
              {c.home.viewCase}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateRows: isNarrow ? "auto auto" : "1fr 1fr", gap: 16 }}>
            {benchmarks.slice(1).map(([name, body, tag]) => (
              <div key={name} style={{ ...cardStyle, minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <BasisBadge tone="info">{tag}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: 28, fontWeight: 860, marginTop: 16 }}>{name}</div>
                  <div style={{ color: t.subtle, fontSize: 13, lineHeight: 1.55, marginTop: 10 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingBottom: isMobile ? 40 : 56 }}>
        <h2 style={sectionTitleStyle}>{c.home.trustTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 24 }}>
          {trustBlocks.map(([title, body]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
