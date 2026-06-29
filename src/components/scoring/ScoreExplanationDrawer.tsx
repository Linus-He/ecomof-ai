// @ts-nocheck
import { createPortal } from "react-dom"
import { FONT_SANS } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { GraphDescriptorPanel } from "../mof/GraphDescriptorPanel"
import { BasisBadge } from "../ui"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`
const score = value => Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0"
const num = (value, digits = 3) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "0"

function findRow(model, candidateId, candidate) {
  const id = candidateId || candidate?.id || candidate?.name || candidate?.candidateId
  return candidate
    || model?.rankings?.find(row => row.id === id || row.name === id)
    || model?.scores?.find(row => row.id === id || row.name === id)
    || null
}

function findExplanation(model, row) {
  if (!row) return null
  return model?.explanations?.candidates?.find(item => item.id === row.id || item.name === row.name) || null
}

function rowWarnings(model, row, explanation) {
  const warnings = []
  if (row?.evidenceWarning) warnings.push(row.evidenceWarning)
  if (explanation?.warning) warnings.push(explanation.warning)
  if (model?.diagnostics?.smallSeedNotice) warnings.push(model.diagnostics.smallSeedNotice)
  ;(model?.warnings || []).forEach(warning => warnings.push(warning))
  return Array.from(new Set(warnings.filter(Boolean)))
}

export function ScoreExplanationDrawer({ open, onClose, model, candidateId, candidate, t, lang, isMobile, fallbackMessage }) {
  if (!open) return null
  const row = findRow(model, candidateId, candidate)
  const explanation = findExplanation(model, row)
  const contributions = row?.contributions || explanation?.contributions || []
  const missing = contributions.filter(item => item.missing)
  const drivers = row?.topDrivers || explanation?.topDrivers || contributions
    .filter(item => !item.missing)
    .sort((a, b) => Number(b.contribution || 0) - Number(a.contribution || 0))
    .slice(0, 3)
  const warnings = rowWarnings(model, row, explanation)
  const methodNote = row?.methodNote || explanation?.methodNote || model?.metadata?.methodSummary || ""
  const graphScore = row?.graphScore
  const graphMetadata = row?.candidate?.graphMetadata
  const hasFullExplanation = Boolean(row && (explanation || contributions.length))
  const message = fallbackMessage || text(
    lang,
    "当前数据不足，无法生成完整解释；以下为 fallback explanation。",
    "Current data is insufficient for a complete explanation; the following is a fallback explanation."
  )
  const descriptorCoverage = model?.descriptorCoverage?.coverage
  const fallbackWarning = !hasFullExplanation || model?.weightingDiagnostics?.fallbackUsed || model?.weightingDiagnostics?.critic?.fallbackUsed

  const drawer = (
    <>
      <button
        type="button"
        aria-label="Close score explanation backdrop"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,0.3)", border: 0 }}
      />
      <aside style={{
        position: "fixed",
        inset: isMobile ? "auto 0 0 0" : "0 0 0 auto",
        width: isMobile ? "100%" : 520,
        maxHeight: isMobile ? "88vh" : "100vh",
        overflow: "auto",
        zIndex: 40,
        background: t.panel,
        borderLeft: isMobile ? "none" : `1px solid ${t.border}`,
        borderTop: isMobile ? `1px solid ${t.border}` : "none",
        boxShadow: t.shadowLg || t.shadowSm,
        padding: 16,
        display: "grid",
        gap: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, color: t.textStrong, fontSize: 16, lineHeight: 1.25, fontWeight: 900 }}>
              {text(lang, "排序解释", "Ranking Explanation")}
            </h3>
            <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
              {row?.name || row?.id || text(lang, "未选择候选", "No candidate selected")}
            </div>
          </div>
          <button type="button" onClick={onClose} style={toolbarBtn(t)}>{text(lang, "关闭", "Close")}</button>
        </div>

        {!hasFullExplanation && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.muted, fontSize: 12.5, lineHeight: 1.6 }}>
            {message}
          </div>
        )}
        {fallbackWarning && hasFullExplanation && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, color: t.warn, fontSize: 12.5, lineHeight: 1.6 }}>
            {message}
          </div>
        )}

        {row && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "Total score", "Total score")}</div>
              <div style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 20, fontWeight: 900, marginTop: 5 }}>{score(row.score)}</div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "Rank", "Rank")}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 900, marginTop: 5 }}>#{row.rank || "—"}</div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "Confidence", "Confidence")}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 900, marginTop: 5 }}>{pct(row.confidence)}</div>
            </div>
          </div>
        )}

        {graphScore && (
          <section style={{ display: "grid", gap: 8 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
              {text(lang, "Evidence-adjusted score", "Evidence-adjusted score")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {[
                [text(lang, "Descriptor Score", "Descriptor Score"), graphScore.descriptorScore, ""],
                [text(lang, "Graph Motif Bonus", "Graph Motif Bonus"), graphScore.graphMotifScore, "+"],
                [text(lang, "Diversity Bonus", "Diversity Bonus"), graphScore.diversityBonus, "+"],
                [text(lang, "Evidence Penalty", "Evidence Penalty"), graphScore.evidencePenalty, "-"],
                [text(lang, "Final Score", "Final Score"), graphScore.finalScore, ""],
                [text(lang, "Graph status", "Graph status"), graphScore.confidence, ""],
              ].map(([label, value, prefix]) => (
                <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: label === "Final Score" ? t.textStrong : t.muted, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 900, marginTop: 5, overflowWrap: "anywhere" }}>
                    {Number.isFinite(Number(value)) ? `${prefix}${Number(value).toFixed(1)}` : value || "pending"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              {text(
                lang,
                "图论相关结果当前作为 demo / literature-derived / computed / pending validation 状态展示；它解释 active motif 和多样性线索，不声称已经完成经过验证的图模型预测。",
                "Graph-related results are shown with demo / literature-derived / computed / pending validation status; they explain active motifs and diversity cues, not validated GNN or adsorption-energy prediction."
              )}
            </div>
          </section>
        )}

        {drivers.length > 0 && (
          <section style={{ display: "grid", gap: 8 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "Main contributing descriptors", "Main contributing descriptors")}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {drivers.map(item => (
                <BasisBadge key={item.key} tone="calc">
                  {(lang === "zh" ? item.labelZh : item.label) || item.key} · {num((item.contribution || 0) * 100, 1)}
                </BasisBadge>
              ))}
            </div>
          </section>
        )}

        {contributions.length > 0 && (
          <section style={{ display: "grid", gap: 8 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "Descriptor contribution breakdown", "Descriptor contribution breakdown")}</div>
            <div style={{ display: "grid", gap: 7 }}>
              {contributions.map(item => (
                <div key={item.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, display: "grid", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{(lang === "zh" ? item.labelZh : item.label) || item.key}</span>
                    <span style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 11.5 }}>{num((item.contribution || 0) * 100, 2)}</span>
                  </div>
                  <div style={{ height: 7, border: `1px solid ${t.border}`, borderRadius: 999, background: t.panel, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct(item.contribution || 0), background: item.missing ? t.warn : t.accent }} />
                  </div>
                  <div style={{ color: t.faint, fontSize: 10.5 }}>
                    value {num(item.normalizedValue, 2)} · weight {num(item.weight, 3)}{item.missing ? ` · ${text(lang, "missing descriptor penalty", "missing descriptor penalty")}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {missing.length > 0 && (
          <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "Missing descriptor penalties", "Missing descriptor penalties")}: </strong>
            {missing.map(item => (lang === "zh" ? item.labelZh : item.label) || item.key).join(", ")}
          </section>
        )}

        {warnings.length > 0 && (
          <section style={{ display: "grid", gap: 7 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "Evidence warnings", "Evidence warnings")}</div>
            {warnings.map(warning => (
              <div key={warning} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.warn, fontSize: 11.5, lineHeight: 1.55 }}>
                {warning}
              </div>
            ))}
          </section>
        )}

        {graphMetadata && (
          <GraphDescriptorPanel graphMetadata={graphMetadata} t={t} lang={lang} isMobile={isMobile} />
        )}

        <section style={{ background: t.badgeInfoBg || t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
          <div><strong style={{ color: t.textStrong }}>{text(lang, "Weighting method used", "Weighting method used")}:</strong> {String(model?.algorithm || "legacy").toUpperCase()}</div>
          {methodNote && <div style={{ marginTop: 5 }}><strong style={{ color: t.textStrong }}>{text(lang, "Method note", "Method note")}:</strong> {methodNote}</div>}
        </section>

        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, marginBottom: 6 }}>{text(lang, "Scoring model metadata", "Scoring model metadata")}</div>
          <div>{text(lang, "Dataset", "Dataset")}: {lang === "zh" ? model?.preset?.datasetLabelZh : model?.preset?.datasetLabel || "—"}</div>
          <div>{text(lang, "Preset", "Preset")}: {lang === "zh" ? model?.preset?.labelZh : model?.preset?.label || "—"}</div>
          <div>{text(lang, "Descriptor preset", "Descriptor preset")}: {model?.metadata?.descriptorPreset || "—"}</div>
          <div>{text(lang, "Descriptors", "Descriptors")}: {model?.metadata?.descriptorCount || 0}/{model?.metadata?.requestedDescriptorCount || model?.metadata?.descriptorCount || 0}</div>
          <div>{text(lang, "Descriptor coverage", "Descriptor coverage")}: {Number.isFinite(Number(descriptorCoverage)) ? pct(descriptorCoverage) : "—"}</div>
          <div>{text(lang, "Missing strategy", "Missing strategy")}: {model?.missingValueStrategy || "—"} · alpha {num(model?.hybridAlpha, 2)}</div>
          <div>{text(lang, "Generated", "Generated")}: {model?.metadata?.generatedAt || "—"}</div>
        </section>
      </aside>
    </>
  )
  if (typeof document === "undefined") return drawer
  return createPortal(drawer, document.body)
}
