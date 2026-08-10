// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildCandidateComparison } from "../../utils/screeningTrace/buildCandidateComparison"
import { FieldProvenanceButton } from "../ui"

function renderValue(v, lang) {
  if (v === null || v === undefined || v === "") return text(lang, "待补", "—")
  if (typeof v === "boolean") return v ? text(lang, "是", "yes") : text(lang, "否", "no")
  return String(v)
}

export function CandidateCompareMode({ candidates = [], lang, t, isMobile }) {
  const selectable = candidates
    .filter(c => Number(c.G) !== 0 && !c.quarantined && !c.verification?.quarantined && !(c.ambiguityWarnings || c.verification?.ambiguityWarnings || []).length)
    .slice(0, 10)
  const [selected, setSelected] = useState(selectable.slice(0, 2).map(c => c.id || c.candidateId))
  const chosen = selectable.filter(c => selected.includes(c.id || c.candidateId)).slice(0, 3)
  const comparison = useMemo(() => buildCandidateComparison(chosen), [chosen])

  useEffect(() => {
    if (!selected.length && selectable.length >= 2) {
      setSelected(selectable.slice(0, 2).map(c => c.id || c.candidateId))
    }
  }, [selectable, selected.length])

  const toggle = id => setSelected(cur => cur.includes(id) ? cur.filter(x => x !== id) : (cur.length >= 3 ? cur : [...cur, id]))

  return (
    <section id="candidate-compare" data-testid="candidate-compare-mode" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "候选比较", "Candidate Compare")}</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selectable.map(c => {
          const id = c.id || c.candidateId
          const on = selected.includes(id)
          return (
            <button key={id} type="button" onClick={() => toggle(id)} style={{ background: on ? t.badgeInfoBg : t.surface, border: `1px solid ${on ? t.accentText : t.border}`, borderRadius: 6, color: t.textStrong, cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "5px 9px" }}>
              {c.displayName || c.name || id}
            </button>
          )
        })}
      </div>
      {chosen.length >= 2 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 360, width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.4, padding: "5px 6px", textAlign: "left", textTransform: "uppercase" }}>{text(lang, "维度", "Dimension")}</th>
                  {chosen.map(c => <th key={c.id || c.candidateId} style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11, padding: "5px 6px", textAlign: "left", overflowWrap: "anywhere" }}>{c.displayName || c.name || c.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {comparison.dimensions.map(dim => (
                  <tr key={dim.key}>
                    <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "5px 6px" }}>{text(lang, dim.labelZh, dim.labelEn)}</td>
                    {dim.values.map((v, i) => {
                      const fieldSource = chosen[i]?.fieldSources?.[dim.key]
                      return (
                        <td key={i} style={{ borderTop: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11, padding: "5px 6px" }}>
                          <span style={{ alignItems: "center", display: "inline-flex", maxWidth: "100%" }}>
                            <span style={{ overflowWrap: "anywhere" }}>{renderValue(v, lang)}</span>
                            <FieldProvenanceButton fieldKey={dim.key} fieldLabel={text(lang, dim.labelZh, dim.labelEn)} source={fieldSource} lang={lang} />
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gap: 5 }}>
            {comparison.comparisons.map(cmp => (
              <p key={`${cmp.higherId}-${cmp.lowerId}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.4, lineHeight: 1.45, margin: 0, overflowWrap: "anywhere", padding: 9 }}>
                {text(lang, cmp.summaryZh, cmp.summaryEn)}
              </p>
            ))}
          </div>
        </>
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "候选比较需要选择 2—3 项记录。", "Select 2–3 candidates to compare.")}</span>
      )}
    </section>
  )
}

export default CandidateCompareMode
