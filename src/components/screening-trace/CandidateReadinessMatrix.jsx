// @ts-nocheck
import { useMemo, useState } from "react"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildReadinessMatrix } from "../../utils/screeningTrace/buildReadinessMatrix"
import { FieldProvenanceButton } from "../ui"

const plot = { left: 44, top: 16, width: 320, height: 240 }

export function CandidateReadinessMatrix({ candidates = [], onSelect, lang, t, isMobile }) {
  const [selectedId, setSelectedId] = useState(null)
  const matrix = useMemo(() => buildReadinessMatrix(candidates), [candidates])
  const visiblePoints = matrix.points.slice(0, isMobile ? 24 : 60)
  const selectedPoint = matrix.points.find(p => p.candidateId === selectedId) || visiblePoints[0]
  const selectedCandidate = candidates.find(c => (c.id || c.candidateId) === selectedPoint?.candidateId)
  const px = v => plot.left + Math.max(0, Math.min(1, v)) * plot.width
  const py = v => plot.top + (1 - Math.max(0, Math.min(1, v))) * plot.height
  const midX = px(matrix.evidenceThreshold)
  const midY = py(matrix.scoreThreshold)

  return (
    <section id="candidate-readiness-matrix" data-testid="candidate-readiness-matrix" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
      <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "候选就绪度矩阵", "Candidate Readiness Matrix")}</strong>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox="0 0 400 300" role="img" aria-label="Candidate Readiness Matrix" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "block", maxWidth: "100%", width: "100%" }}>
          <rect x={plot.left} y={plot.top} width={plot.width} height={plot.height} fill={t.panel} stroke={t.border} />
          <rect x={midX} y={plot.top} width={plot.left + plot.width - midX} height={midY - plot.top} fill={t.badgeGoodBg || t.badgeInfoBg} opacity="0.5" />
          <line x1={midX} x2={midX} y1={plot.top} y2={plot.top + plot.height} stroke={t.border} strokeDasharray="3 4" />
          <line x1={plot.left} x2={plot.left + plot.width} y1={midY} y2={midY} stroke={t.border} strokeDasharray="3 4" />
          <text x={plot.left + plot.width - 6} y={plot.top + 14} fill={t.accentText} fontSize="9.5" fontWeight="800" textAnchor="end">{text(lang, "优先验证", "Priority validation")}</text>
          <text x={plot.left + 6} y={plot.top + 14} fill={t.warn} fontSize="9.5" fontWeight="800">{text(lang, "需补数据", "Data needed")}</text>
          <text x={plot.left + 6} y={plot.top + plot.height - 6} fill={t.faint} fontSize="9.5">{text(lang, "暂不推荐", "Not recommended")}</text>
          <text x={plot.left + plot.width - 6} y={plot.top + plot.height - 6} fill={t.faint} fontSize="9.5" textAnchor="end">{text(lang, "参考保留", "Keep as reference")}</text>
          <text x={plot.left + plot.width / 2} y={296} fill={t.muted} fontSize="10" fontWeight="800" textAnchor="middle">{text(lang, "证据置信度", "Evidence Confidence")}</text>
          <text x="12" y={plot.top + plot.height / 2} fill={t.muted} fontSize="10" fontWeight="800" textAnchor="middle" transform={`rotate(-90 12 ${plot.top + plot.height / 2})`}>{text(lang, "筛选得分", "Screening Score")}</text>
          {visiblePoints.map(p => (
            <g key={p.candidateId} onClick={() => { setSelectedId(p.candidateId); onSelect?.(p.candidateId) }} style={{ cursor: "pointer" }}>
              <title>{`${p.displayName} · ${p.quadrantLabelEn}${p.tags.length ? ` · ${p.tags.join(", ")}` : ""}`}</title>
              <circle cx={px(p.evidenceConfidence)} cy={py(p.score)} r={p.candidateId === selectedPoint?.candidateId ? "8" : "6"} fill={t.accent} stroke={t.textStrong} strokeWidth={p.candidateId === selectedPoint?.candidateId ? "2" : "1"} opacity="0.9" />
            </g>
          ))}
        </svg>
      </div>
      {selectedCandidate ? (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{selectedCandidate.displayName || selectedCandidate.name || selectedCandidate.id}</div>
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
            {[
              ["surfaceArea", text(lang, "比表面积", "Surface area")],
              ["poreSizeA", text(lang, "孔径", "Pore size")],
              ["density", text(lang, "密度", "Density")],
              ["bandGap", text(lang, "带隙", "Band gap")],
            ].map(([fieldKey, label]) => {
              const source = selectedCandidate.fieldSources?.[fieldKey]
              const value = selectedCandidate[fieldKey] ?? source?.value ?? "missing"
              return (
                <span key={fieldKey} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, display: "inline-flex", fontSize: 10.8, gap: 2, minWidth: 0, padding: "6px 7px" }}>
                  <span style={{ color: t.faint, fontWeight: 850 }}>{label}</span>
                  <span style={{ color: t.textStrong, fontFamily: "monospace", marginLeft: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value === null || value === undefined || value === "" ? "missing" : String(value)}</span>
                  <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={source} lang={lang} />
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "象限用于优先级判断，不是最终推荐；歧义/license 待补的候选会被标注。", "Quadrants guide prioritization, not final recommendation; ambiguity / license-pending candidates are tagged.")}</span>
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, `矩阵默认显示 ${visiblePoints.length}/${matrix.points.length} 个候选。`, `Matrix defaults to ${visiblePoints.length}/${matrix.points.length} candidates.`)}</span>
    </section>
  )
}

export default CandidateReadinessMatrix
