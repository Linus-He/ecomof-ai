// @ts-nocheck
import { toolbarBtn } from "../../shared"
import { OrganicAcidProject } from "./OrganicAcidProject"

const navItems = [
  ["access", "访问入口", "Access"],
  ["algorithm", "算法追踪", "Algorithm"],
  ["pathway-map", "路径图", "Pathway map"],
  ["organic-acid-graph-explorer", "图论网络", "Graph network"],
  ["organic-acid-reaction-rule-explorer", "规则与证据", "Rules & evidence"],
  ["priority", "优先级矩阵", "Priority"],
  ["candidates", "候选队列", "Candidates"],
  ["validation", "验证路线", "Validation"],
]

export function OrganicAcidWorkspace({ lang, t, isMobile, onBack }) {
  const zh = lang === "zh"
  const scrollToSection = (id) => {
    const target = document.getElementById(id)
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
        <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "auto minmax(0, 1fr)" }}>
          <button
            type="button"
            onClick={onBack}
            style={{ ...toolbarBtn(t), justifyContent: "center", minHeight: 36, padding: "8px 11px", width: isMobile ? "100%" : "auto" }}
          >
            {zh ? "返回催化实验室总览" : "Back to Catalysis Lab"}
          </button>
          <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>
              {zh ? "独立专题工作台" : "Focused workspace"}
            </div>
            <h1 style={{ color: t.textStrong, fontSize: isMobile ? 24 : 30, fontWeight: 940, lineHeight: 1.12, margin: 0 }}>
              {zh ? "有机酸路径工作台" : "Organic Acid Workspace"}
            </h1>
            <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.55, margin: 0, maxWidth: 940 }}>
              {zh
                ? "该工作台保留有机酸方向的完整研究链条：前端访问入口、算法追踪器、路径显示图、图论网络、反应规则与证据矩阵、优先级矩阵、候选物队列和验证路线。"
                : "This workspace keeps the full organic-acid research chain: access gate, algorithm tracker, pathway maps, graph reasoning, reaction-rule evidence matrix, priority matrix, candidate queue, and validation plan."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {navItems.map(([id, zhLabel, enLabel]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              style={{ ...toolbarBtn(t), minHeight: 32, padding: "6px 9px" }}
            >
              {zh ? zhLabel : enLabel}
            </button>
          ))}
        </div>
      </section>

      <section id="access" style={{ scrollMarginTop: 118 }}>
        <OrganicAcidProject lang={lang} t={t} />
      </section>
    </div>
  )
}
