import { useState } from "react"
import { asArray, EmptyState, palette, text } from "./shared"

const EVIDENCE_TONE = { proxy: palette.accent, "literature / inferred": palette.mixed || palette.accent, missing: palette.risk }

export function DescriptorMappingExplanationPanel({ model, summary, lang = "zh", withTestId = true }) {
  const groups = asArray(model?.descriptorGroups)
  const [open, setOpen] = useState(null)
  if (!groups.length) {
    return <div data-testid={withTestId ? "descriptor-mapping-explanation" : undefined} data-row-count={0} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}><EmptyState lang={lang} /></div>
  }
  return (
    <div data-testid={withTestId ? "descriptor-mapping-explanation" : undefined} data-row-count={groups.length} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, minWidth: 0, padding: 12 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        {summary ? <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, summary.oneLineConclusionZh, summary.oneLineConclusionEn)}</span> : null}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {groups.map(group => {
          const isOpen = open === group.id
          const tone = group.missingCount > 0 ? palette.risk : (EVIDENCE_TONE[group.evidenceType] || palette.accent)
          return (
            <div key={group.id} style={{ background: palette.surface, border: `1px solid ${isOpen ? palette.accent : palette.border}`, borderRadius: 8 }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : group.id)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "grid", gap: 6, padding: 9, textAlign: "left", width: "100%" }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <span style={{ color: palette.faint, fontSize: 10.5 }}>{group.stepName} →</span>
                  <strong style={{ color: palette.text, fontSize: 12 }}>{group.descriptorGroup}</strong>
                  {group.missingCount > 0 ? (
                    <span style={{ background: palette.riskSoft, border: `1px solid ${palette.risk}`, borderRadius: 6, color: palette.risk, fontSize: 9.5, fontWeight: 900, padding: "2px 7px" }}>
                      {text(lang, `缺 ${group.missingCount} 项描述符`, `${group.missingCount} missing`)}
                    </span>
                  ) : null}
                  <span style={{ color: palette.muted, fontSize: 9.5 }}>{group.evidenceType} · {group.confidenceLevel}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {asArray(group.visibleDescriptors).map(d => (
                    <span key={d} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.text, fontSize: 10, padding: "2px 7px" }}>{d}</span>
                  ))}
                  {group.overflowCount > 0 ? (
                    <span style={{ color: palette.accent, fontSize: 10, fontWeight: 800 }}>{text(lang, `更多描述符 (${group.overflowCount})`, `more descriptors (${group.overflowCount})`)}</span>
                  ) : null}
                </div>
              </button>
              {isOpen ? (
                <div style={{ borderTop: `1px solid ${palette.border}`, color: palette.muted, display: "grid", fontSize: 10.8, gap: 4, lineHeight: 1.45, padding: 9 }}>
                  <span style={{ color: palette.text }}>{text(lang, "全部描述符", "All descriptors")}: {asArray(group.descriptors).join("、") || "—"}</span>
                  <span>{text(lang, "方向", "Direction")}: {group.descriptorDirection}</span>
                  {group.missingCount > 0 ? <span style={{ color: palette.risk }}>{text(lang, "待补描述符", "Missing")}: {asArray(group.missingDescriptors).join("、")}</span> : null}
                  <span style={{ color: palette.faint }}>{text(lang, "来源字段", "Source fields")}: {asArray(group.sourceFields).join(" · ")} · {text(lang, "链接步骤", "step")} {group.stepId}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <p style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.4, margin: 0 }}>{text(lang, model.headerNoteZh, model.headerNoteEn)}</p>
    </div>
  )
}

export default DescriptorMappingExplanationPanel
