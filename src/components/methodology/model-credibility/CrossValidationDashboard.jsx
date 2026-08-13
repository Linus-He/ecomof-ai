// @ts-nocheck
// V3.5 Cross Validation Dashboard — per-model 5-fold / 10-fold tables with
// per-fold Accuracy / ROC / F1 and the Mean / Std summary + stability score.
// Reads the frozen model-credibility report; computes nothing in the browser.
import { useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const fmt = v => (v == null ? "—" : typeof v === "number" ? v.toFixed(3) : String(v))

export function CrossValidationDashboard({ credibility = null, lang = "en", t, isMobile = false }) {
  const [foldMode, setFoldMode] = useState("fiveFold")
  if (!credibility?.crossValidation) return null
  const cv = credibility.crossValidation[foldMode]
  const stability = credibility.stability?.[foldMode]
  if (!cv) return null

  return (
    <section
      id="algval-cross-validation"
      data-testid="algval-cross-validation"
      className="algorithm-validation-section"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Cross Validation Dashboard</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "交叉验证仪表板", "Cross Validation Dashboard")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
          {text(lang, `${cv.datasetSize} 条内部整理标签上的 ${cv.k}-fold 交叉验证；这是模型稳定性诊断，不提升标签证据等级。`, `${cv.k}-fold cross-validation over ${cv.datasetSize} internally curated labels; this diagnoses model stability without upgrading label evidence.`)}
        </p>
      </header>

      <div style={{ display: "flex", gap: 7 }}>
        {[["fiveFold", "5-fold"], ["tenFold", "10-fold"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`cv-fold-${key}`}
            aria-pressed={foldMode === key}
            onClick={() => setFoldMode(key)}
            style={{ background: foldMode === key ? t.badgeInfoBg : t.surface, border: `1px solid ${foldMode === key ? t.accent : t.border}`, borderRadius: 7, color: foldMode === key ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 30, padding: "5px 12px" }}
          >
            {label}
          </button>
        ))}
      </div>

      {cv.models.map(m => {
        const stabRow = stability?.rows?.find(r => r.model === m.model)
        return (
          <div key={m.model} data-testid={`cv-model-${m.model.replace(/\s+/g, "-")}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{m.model}</strong>
              <span style={{ color: stabRow?.stability === "Stable" ? t.success : t.warn, fontSize: 11, fontWeight: 800 }}>{stabRow?.stability || "—"} · stability {m.stabilityScore}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, minWidth: isMobile ? 360 : "100%", width: "100%" }}>
                <thead>
                  <tr>{["Fold", "Accuracy", "ROC", "F1"].map(h => <th key={h} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 9.5, fontWeight: 900, padding: "4px 6px", textAlign: "left", textTransform: "uppercase" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {m.folds.map(f => (
                    <tr key={f.fold}>
                      <td style={{ borderBottom: `1px solid ${t.border}`, color: t.muted, padding: "4px 6px" }}>{f.fold}</td>
                      <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "4px 6px" }}>{fmt(f.accuracy)}</td>
                      <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "4px 6px" }}>{fmt(f.roc)}</td>
                      <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "4px 6px" }}>{fmt(f.f1)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ color: t.textStrong, fontWeight: 800, padding: "5px 6px" }}>Mean ± Std</td>
                    <td style={{ color: t.textStrong, fontWeight: 800, padding: "5px 6px" }}>{fmt(m.accuracyMean)} ± {fmt(m.accuracyStd)}</td>
                    <td style={{ color: t.textStrong, fontWeight: 800, padding: "5px 6px" }}>{fmt(m.rocMean)} ± {fmt(m.rocStd)}</td>
                    <td style={{ color: t.textStrong, fontWeight: 800, padding: "5px 6px" }}>{fmt(m.f1Mean)} ± {fmt(m.f1Std)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default CrossValidationDashboard
