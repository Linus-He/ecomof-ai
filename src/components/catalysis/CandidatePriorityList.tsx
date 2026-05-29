// @ts-nocheck
import { formatScore, pct } from "./evidenceScoring"

function statusColor(status, t) {
  if (status === "matched") return t.success || "#15803d"
  if (status === "partial") return t.warn || "#b45309"
  return t.faint
}

function readableRisk(value, lang) {
  if (lang !== "zh") return value
  const map = {
    "Missing long-term stability data": "缺少长期稳定性数据",
    "Yield is inferred and isotope tracing is missing": "收率为推算值，缺少同位素示踪",
    "Kinetic data and stability are incomplete": "动力学和稳定性证据不完整",
    "Unclear product and carbon basis": "产物和碳基准不清",
    "Demo-only source and missing carbon efficiency": "仅 demo 来源，缺少碳效率",
  }
  return map[value] || value
}

export function CandidatePriorityList({ candidates, selectedCandidateId, onSelectCandidate, t, lang }) {
  const zh = lang === "zh"
  if (!candidates?.length) {
    return <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55 }}>{zh ? "暂无有机酸候选物。" : "No organic-acid candidates available."}</div>
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {candidates.map(candidate => {
        const selected = candidate.candidateId === selectedCandidateId
        const matchedRules = (candidate.rules || []).filter(rule => rule.status === "matched").length
        return (
          <button
            key={candidate.candidateId}
            type="button"
            onClick={() => onSelectCandidate(candidate.candidateId)}
            style={{
              background: selected ? t.bg : t.surface,
              border: `1px solid ${selected ? t.accent : t.border}`,
              borderRadius: 8,
              color: t.textStrong,
              cursor: "pointer",
              display: "grid",
              gap: 7,
              padding: 10,
              textAlign: "left",
            }}
          >
            <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, fontWeight: 920, lineHeight: 1.25 }}>{candidate.candidateName || candidate.displayName || candidate.candidateId}</span>
              <span style={{ color: t.accentText, fontSize: 11.5, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{formatScore(candidate.priorityScore)}</span>
            </div>
            <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.45 }}>
              {zh ? "规则匹配" : "Matched rules"} {matchedRules}/{(candidate.rules || []).length || 0} · {zh ? "证据就绪" : "readiness"} {pct(candidate.evidenceReadiness)}
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div style={{ background: statusColor(matchedRules ? "matched" : "missing", t), height: "100%", width: pct(candidate.priorityScore) }} />
            </div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.4 }}>
              {readableRisk(candidate.mainRisk, lang) || (zh ? "主要风险待整理" : "main risk pending")}
            </div>
          </button>
        )
      })}
    </div>
  )
}
