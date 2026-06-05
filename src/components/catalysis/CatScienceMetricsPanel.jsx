// @ts-nocheck
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Metric({ label, value, note, tone, t }) {
  return (
    <article className="energy-playground-metric-card" style={{ background: t.panel, borderColor: t.border }}>
      <span style={{ color: t.faint }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : tone === "accent" ? t.accentText : t.textStrong }}>{value}</strong>
      {note ? <small style={{ color: t.subtle }}>{note}</small> : null}
    </article>
  )
}

export function CatScienceMetricsPanel({ state, pathway, mof, lang, t }) {
  const zh = lang === "zh"
  return (
    <aside className="energy-playground-panel" style={{ background: t.surface, borderColor: t.border }}>
      <div>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{zh ? "当前催化状态" : "Current Catalysis State"}</div>
        <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2, margin: "5px 0 0" }}>{zh ? pathway.labelZh : pathway.labelEn}</h3>
        <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: "6px 0 0" }}>{zh ? pathway.notesZh : pathway.notesEn}</p>
      </div>
      <div className="energy-playground-metrics">
        <Metric label={zh ? "活化能变化" : "ΔEa change"} value={`${state.activationEnergyDelta} kJ/mol`} note="MOF - baseline" tone={state.activationEnergyDelta > 0 ? "warn" : "accent"} t={t} />
        <Metric label={zh ? "反应能变化" : "ΔE change"} value={`${state.reactionEnergyDelta} kJ/mol`} note="proxy" t={t} />
        <Metric label={zh ? "过渡态稳定" : "Transition-state stabilization"} value={state.tsStabilization >= 22 ? "high" : state.tsStabilization >= 10 ? "medium" : "low"} note={`${state.tsStabilization} proxy`} t={t} />
        <Metric label={zh ? "反应物吸附" : "Reactant adsorption"} value={state.reactantAdsorption >= 20 ? "strong" : state.reactantAdsorption >= 8 ? "moderate" : "weak"} note={`${state.reactantAdsorption} proxy`} t={t} />
        <Metric label={zh ? "产物释放风险" : "Product release risk"} value={state.productReleaseRisk} note={`risk ${state.riskPenalty}%`} tone={state.productReleaseRisk === "high" ? "warn" : undefined} t={t} />
        <Metric label={zh ? "路径优先级" : "Pathway priority"} value={`${state.priorityScore}/100`} note={state.priority} tone="accent" t={t} />
        <Metric label={zh ? "证据等级" : "Evidence level"} value={state.evidenceLevel} note={mof?.labelEn || "selected MOF"} t={t} />
        <Metric label={zh ? "小猫区域指标" : "Cat zone metric"} value={zh ? state.zone.metricZh || state.zone.labelZh : state.zone.metric || state.zone.labelEn} note={zh ? state.zone.labelZh : state.zone.labelEn} tone="accent" t={t} />
        <Metric label={zh ? "验证需求" : "Validation need"} value={state.evidenceLevel === "D" || state.riskPenalty > 18 ? text(lang, "高", "high") : text(lang, "中", "medium")} note={zh ? "DFT / 同条件实验" : "DFT / same-condition tests"} tone="warn" t={t} />
      </div>
      <div className="energy-playground-note">
        {zh ? "演示 / 假设驱动可视化。数值为 proxy contribution，不代表真实 DFT 或实验产率。" : "Demo / hypothesis-based visualization. Values are proxy contributions, not DFT or experimental yield predictions."}
      </div>
    </aside>
  )
}
