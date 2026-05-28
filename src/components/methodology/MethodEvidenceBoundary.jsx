const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodEvidenceBoundary({ item, lang, t }) {
  const evidence = lang === "zh" ? item.evidenceBoundaryZh : item.evidenceBoundary
  const roadmap = lang === "zh" ? item.validationRoadmapZh : item.validationRoadmap
  return (
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, display: "grid", gap: 7, padding: 11 }}>
        <strong style={{ color: t.warn, fontSize: 12.5 }}>{text(lang, "证据边界", "Evidence boundary")}</strong>
        {(evidence || []).map(row => (
          <div key={row} style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{row}</div>
        ))}
      </article>
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "验证路线", "Validation roadmap")}</strong>
        {(roadmap || []).map(row => (
          <div key={row} style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{row}</div>
        ))}
      </article>
    </div>
  )
}
