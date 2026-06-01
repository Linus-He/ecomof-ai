// @ts-nocheck
export function CatEffectContributionPanel({ contributions = [], lang, t }) {
  const zh = lang === "zh"
  return (
    <section className="cat-contribution-panel" style={{ background: t.surface, borderColor: t.border }}>
      <div>
        <strong style={{ color: t.textStrong }}>{zh ? "Effect Contribution Panel / 效应贡献面板" : "Effect Contribution Panel"}</strong>
        <p style={{ color: t.muted }}>{zh ? "所有数值均为估算 / proxy contribution，用于解释曲线变化来源。" : "All values are estimated proxy contributions explaining the curve shift."}</p>
      </div>
      <div className="cat-contribution-grid">
        {contributions.length ? contributions.map(item => (
          <article key={item.id} style={{ background: t.panel, borderColor: t.border }}>
            <strong style={{ color: t.textStrong }}>{zh ? item.labelZh : item.labelEn}</strong>
            <span style={{ color: item.activationEnergyDelta > 0 ? t.warn : t.accentText }}>ΔEa {item.activationEnergyDelta > 0 ? "+" : ""}{item.activationEnergyDelta} kJ/mol</span>
            <span style={{ color: t.muted }}>ΔE {item.reactionEnergyDelta > 0 ? "+" : ""}{item.reactionEnergyDelta} kJ/mol · risk {item.riskPenalty > 0 ? "+" : ""}{item.riskPenalty}%</span>
            <small style={{ color: t.subtle }}>{zh ? item.mechanismNoteZh : item.mechanismNoteEn}</small>
            <small style={{ color: t.subtle }}>{zh ? item.validationSuggestionZh : item.validationSuggestionEn}</small>
          </article>
        )) : (
          <div style={{ color: t.muted, fontSize: 12 }}>{zh ? "尚未选择描述符；当前只显示小猫位置贡献。" : "No descriptor selected yet; only cat-position contribution is active."}</div>
        )}
      </div>
    </section>
  )
}
