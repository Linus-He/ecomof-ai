// @ts-nocheck
import { useMemo } from "react"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildReadinessMatrix } from "../../utils/screeningTrace/buildReadinessMatrix"

const plot = { left: 44, top: 16, width: 320, height: 240 }

export function CandidateReadinessMatrix({ candidates = [], onSelect, lang, t }) {
  const matrix = useMemo(() => buildReadinessMatrix(candidates), [candidates])
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
          {matrix.points.map(p => (
            <g key={p.candidateId} onClick={() => onSelect?.(p.candidateId)} style={{ cursor: onSelect ? "pointer" : "default" }}>
              <title>{`${p.displayName} · ${p.quadrantLabelEn}${p.tags.length ? ` · ${p.tags.join(", ")}` : ""}`}</title>
              <circle cx={px(p.evidenceConfidence)} cy={py(p.score)} r="6" fill={t.accent} stroke={t.textStrong} strokeWidth="1" opacity="0.9" />
            </g>
          ))}
        </svg>
      </div>
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "象限用于优先级判断，不是最终推荐；歧义/license 待补的候选会被标注。", "Quadrants guide prioritization, not final recommendation; ambiguity / license-pending candidates are tagged.")}</span>
    </section>
  )
}

export default CandidateReadinessMatrix
