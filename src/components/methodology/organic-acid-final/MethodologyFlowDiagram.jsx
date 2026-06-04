// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologyFlowDiagram({ flow = [], lang, t }) {
  const [activeId, setActiveId] = useState(flow[0]?.id || null)
  const active = useMemo(() => flow.find(node => node.id === activeId) || flow[0], [activeId, flow])

  return (
    <section id="methodology-oafs-flow" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Two-Stage Algorithm Flow</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "两阶段算法流程图", "Two-Stage Algorithm Flow Diagram")}
        </h3>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        {flow.map((node, index) => {
          const isActive = node.id === active?.id
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveId(node.id)}
              style={{ background: isActive ? t.badgeInfoBg : t.surface, border: `1px solid ${isActive ? t.accentText : t.border}`, borderRadius: 10, color: t.textStrong, cursor: "pointer", display: "grid", gap: 7, minHeight: 128, minWidth: 0, padding: 11, textAlign: "left" }}
            >
              <span style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, fontSize: 10.5, fontWeight: 900, padding: "4px 7px" }}>{String(index + 1).padStart(2, "0")}</span>
                {index < flow.length - 1 ? <span aria-hidden style={{ color: t.faint, fontSize: 18, lineHeight: 1 }}>→</span> : null}
              </span>
              <strong style={{ fontSize: 13.2, lineHeight: 1.2 }}><ChemicalText value={text(lang, node.titleZh, node.title)} /></strong>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35 }}><ChemicalText value={text(lang, node.outputZh, node.output)} /></span>
              <span style={{ color: t.warn, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{node.evidenceStatus}</span>
            </button>
          )
        })}
      </div>

      {active ? (
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
          <strong style={{ color: t.textStrong, fontSize: 14.5 }}><ChemicalText value={text(lang, active.titleZh, active.title)} /></strong>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {[
              [text(lang, "输入", "Input"), text(lang, active.inputZh, active.input)],
              [text(lang, "决策规则", "Decision rule"), text(lang, active.ruleZh, active.rule)],
              [text(lang, "输出", "Output"), text(lang, active.outputZh, active.output)],
              [text(lang, "证据状态", "Evidence status"), active.evidenceStatus],
            ].map(([label, value]) => (
              <div key={label} style={{ borderLeft: `3px solid ${t.accentText}`, display: "grid", gap: 3, paddingLeft: 9 }}>
                <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                <span style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.45 }}><ChemicalText value={value} /></span>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}
