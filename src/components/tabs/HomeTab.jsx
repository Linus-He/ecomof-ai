import { useEffect, useRef, useState } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_MONO } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { BasisBadge } from "../ui/index.jsx"

function RevealBlock({ children, delay = 0, style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="scroll-reveal"
      data-visible={visible ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms`, ...style }}
    >
      {children}
    </div>
  )
}

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const sectionStyle = { padding: isMobile ? "30px 0" : "36px 0" }
  const sectionTitleStyle = { margin: 0, color: t.textStrong, fontSize: isMobile ? 26 : 32, lineHeight: 1.12, letterSpacing: 0, fontWeight: 700 }
  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: "20px 24px", boxShadow: "none" }
  const heroStages = lang === "zh" ? [
    {
      stage: "阶段 1",
      title: "科学筛选",
      accent: t.performance,
      items: ["性能", "稳定性 / 化学指标", "结果解释"],
    },
    {
      stage: "阶段 2-3",
      title: "后续决策层",
      accent: t.lccAccent,
      items: ["成本初筛", "生命周期比较", "稳健性"],
    },
  ] : [
    {
      stage: "Stage 1",
      title: "Scientific screening",
      accent: t.performance,
      items: ["Performance", "Stability / chemistry indicators", "Interpretation"],
    },
    {
      stage: "Stage 2-3",
      title: "Decision layers",
      accent: t.lccAccent,
      items: ["Cost feasibility", "Lifecycle comparison", "Robustness"],
    },
  ]
  const capabilities = [
    { key: "performance", badge: "Primary screening", title: c.home.predict, body: c.home.predictBody, accent: t.performance },
    { key: "impact", badge: "Feasibility boundary", title: c.home.evaluate, body: c.home.evaluateBody, featured: true, accent: t.lccAccent },
    { key: "robustness", badge: "Shortlist comparison", title: c.home.robustness, body: c.home.robustnessBody, accent: t.sensitivityAccent },
  ]
  const workflow = lang === "zh" ? [
    ["01", "筛选性能与稳定性", "以吸附性能、化学合理性和适用域作为第一过滤器。"],
    ["02", "评估初步可行性边界", "利用粗略成本和可得性约束排除明显不可行路线。"],
    ["03", "比较入围候选", "对入围候选做初步 LCA/LCC 和稳健性比较。"],
    ["04", "进入工程评估", "后续再做工艺路线、放大经济性和正式工业 LCA。"],
  ] : [
    ["01", "Screen for performance and stability", "Use adsorption performance, chemistry, and applicability as the first filter."],
    ["02", "Assess preliminary feasibility boundaries", "Identify cost, availability, and supply risks that may block practical use."],
    ["03", "Compare shortlisted candidates", "Run preliminary LCA/LCC and robustness comparisons after shortlist formation."],
    ["04", "Advance to engineering-stage evaluation", "Reserve process-route design, scale-up economics, and formal industrial LCA for the future stage."],
  ]
  const benchmarks = lang === "zh" ? [
    ["UiO-66", "解读结构与性能权衡关系的稳定参考体系。", "基准支持", [["金属节点", "Zr6"], ["孔径", "8.5 A"], ["BET", "1850 m2/g"]]],
    ["HKUST-1", "具有开放金属位点的经典吸附相关基准。", "经典案例", [["金属节点", "Cu"], ["孔径", "9.0 A"]]],
    ["ZIF-8", "选择性与孔道通达性趋势的轻量参考材料。", "参考材料", [["金属节点", "Zn"], ["孔径", "3.4 A"]]],
  ] : [
    ["UiO-66", "A stable reference case for interpreting structure-performance trade-offs.", "Benchmark-backed", [["Metal node", "Zr6"], ["Pore size", "8.5 A"], ["BET", "1850 m2/g"]]],
    ["HKUST-1", "Open metal site benchmark with strong adsorption relevance.", "Canonical case", [["Metal node", "Cu"], ["Pore size", "9.0 A"]]],
    ["ZIF-8", "A lightweight comparison point for selectivity and pore-access trends.", "Reference material", [["Metal node", "Zn"], ["Pore size", "3.4 A"]]],
  ]
  const trustBlocks = [
    [lang === "zh" ? "验证" : "Validation", c.home.trustValidation],
    [lang === "zh" ? "数据来源" : "Data Sources", c.home.trustData],
    [lang === "zh" ? "范围与限制" : "Scope and limits", c.home.trustLimits],
  ]
  const scrollToBenchmarks = () => {
    document.getElementById("home-benchmarks")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const heroTitleLines = lang === "zh"
    ? [
        ["性能优先。", t.textStrong],
        ["决策支持", t.accentText],
        ["随后扩展。", t.textStrong],
      ]
    : [
        ["Performance first.", t.textStrong],
        ["Broader decision", t.accentText],
        ["support next.", t.textStrong],
      ]
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <section style={{
        minHeight: "auto",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.55fr) minmax(0, 0.45fr)",
        gap: isNarrow ? 28 : 42,
        alignItems: "center",
        padding: isMobile ? "28px 0 28px" : "36px 0 28px",
      }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 18 }}>
            {c.home.heroLabel}
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 42 : isNarrow ? 54 : 70, lineHeight: 0.98, letterSpacing: 0, fontWeight: 800 }}>
            {heroTitleLines.map(([text, color]) => (
              <span key={text} style={{ display: "block", color }}>{text}</span>
            ))}
          </h1>
          <p style={{ color: t.muted, fontSize: isMobile ? 16 : 18, lineHeight: 1.55, maxWidth: 560, margin: "24px 0 26px" }}>
            {c.home.subtitle}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setActiveTab("screening")} style={{ ...toolbarBtn(t), background: t.accent, color: "#fff", borderColor: t.accent, padding: "10px 16px", boxShadow: "0 8px 18px rgba(26,109,181,0.16)" }}>
              {c.home.start}
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab("comparison")} style={{ ...toolbarBtn(t), padding: "10px 16px", background: "transparent" }}>
              {lang === "zh" ? "查看比较层" : "View Comparison Layers"}
            </button>
          </div>
        </div>

        <div style={{
          minHeight: isMobile ? 360 : 430,
          display: "grid",
          alignItems: "stretch",
        }}>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: isMobile ? 14 : 18, width: "100%", flex: 1 }}>
            {heroStages.map(stage => (
              <div key={stage.stage} className="content-card" style={{
                padding: isMobile ? 18 : 24,
                border: `1px solid ${t.border}`,
                borderLeft: `3px solid ${stage.accent}`,
                borderRadius: 0,
                background: t.panel,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "160px 1fr",
                gap: 16,
                alignItems: "center",
              }}>
                <div>
                  <BasisBadge tone={stage.stage.includes("1") ? "info" : "proxy"}>{stage.stage}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: isMobile ? 24 : 32, fontWeight: 880, lineHeight: 1.08, marginTop: 12 }}>{stage.title}</div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {stage.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${t.border}` }}>
                      <span style={{ width: 18, height: 2, borderRadius: 999, background: stage.accent, flex: "0 0 auto" }} />
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
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 20, alignItems: "stretch" }}>
          {capabilities.map((item, index) => (
            <RevealBlock key={item.key} delay={index * 100} style={{ height: "100%" }}>
            <div className="content-card" style={{
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
                S{index + 1}
              </div>
              <BasisBadge tone={item.key === "performance" ? "info" : item.key === "impact" ? "proxy" : "user"}>{item.badge}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, lineHeight: 1.2, marginTop: 12 }}>{item.title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.45, marginTop: 7 }}>{item.body}</div>
            </div>
            </RevealBlock>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.workflowTitle}</h2>
        <div style={{ marginTop: 24, position: "relative" }}>
          {!isNarrow && (
            <div style={{ position: "absolute", left: "8%", right: "8%", top: 23, height: 1, background: t.borderStrong }} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: isNarrow ? 22 : 24 }}>
            {workflow.map(([num, title, body]) => {
              const color = num === "01" ? t.performance : num === "02" ? t.lccAccent : num === "03" ? t.sensitivityAccent : t.validationAccent
              return (
              <RevealBlock key={num} delay={(Number(num) - 1) * 100} style={{ position: "relative", paddingTop: isNarrow ? 0 : 54 }}>
                {!isNarrow && (
                  <div style={{ position: "absolute", top: 13, left: 0, width: 22, height: 22, borderRadius: "50%", background: t.bg, border: `2px solid ${color}` }} />
                )}
                <div style={{ color, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 850 }}>{num}</div>
                <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, marginTop: 8 }}>{title}</div>
                <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8, maxWidth: 260 }}>{body}</div>
              </RevealBlock>
            )})}
          </div>
        </div>
      </section>

      <section id="home-benchmarks" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.benchmarkTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.08fr 0.92fr", gap: 16, marginTop: 20 }}>
          <RevealBlock delay={0} style={{ minHeight: isNarrow ? 240 : 270 }}>
          <div className="content-card" style={{ ...cardStyle, minHeight: isNarrow ? 240 : 270, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <BasisBadge tone="calc">{benchmarks[0][2]}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 34 : 44, fontWeight: 880, letterSpacing: 0, marginTop: 18 }}>{benchmarks[0][0]}</div>
              <div style={{ color: t.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 540, marginTop: 10 }}>{benchmarks[0][1]}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                {benchmarks[0][3].map(([label, value]) => (
                  <div key={label} style={{ border: `1px solid ${t.border}`, borderRadius: 6, padding: "7px 9px", background: t.surface }}>
                    <div style={{ color: t.subtle, fontSize: 10, fontWeight: 750, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setActiveTab("literature")} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
              {c.home.viewCase}
            </button>
          </div>
          </RevealBlock>
          <div style={{ display: "grid", gridTemplateRows: isNarrow ? "auto auto" : "1fr 1fr", gap: 16 }}>
            {benchmarks.slice(1).map(([name, body, tag, metrics], index) => (
              <RevealBlock key={name} delay={(index + 1) * 100} style={{ minHeight: 170 }}>
              <div className="content-card" style={{ ...cardStyle, minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <BasisBadge tone="info">{tag}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: 28, fontWeight: 860, marginTop: 16 }}>{name}</div>
                  <div style={{ color: t.subtle, fontSize: 13, lineHeight: 1.55, marginTop: 10 }}>{body}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                    {metrics.map(([label, value]) => (
                      <span key={label} style={{ color: t.muted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 7px", fontSize: 10, fontWeight: 750 }}>
                        {label}: {value}
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("literature")} style={{ ...toolbarBtn(t), width: "fit-content", padding: "7px 10px", marginTop: 12 }}>
                  {c.home.viewCase}
                </button>
              </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingBottom: isMobile ? 40 : 56 }}>
        <h2 style={sectionTitleStyle}>{c.home.trustTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 20 }}>
          {trustBlocks.map(([title, body]) => (
            <div key={title} className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
