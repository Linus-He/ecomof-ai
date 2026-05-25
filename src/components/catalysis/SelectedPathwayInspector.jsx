import { formatScore, pct } from "./evidenceScoring"

function SafeValue({ children }) {
  return children === null || children === undefined || children === "" ? "pending" : children
}

function ScoreLine({ label, value, t }) {
  const safe = value === null || value === undefined || Number.isNaN(Number(value)) ? 0 : Math.max(0, Math.min(1, Number(value)))
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span style={{ color: t.muted, fontSize: 11.5, fontWeight: 800 }}>{label}</span>
        <span style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{formatScore(value)}</span>
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <div style={{ background: t.accent, height: "100%", width: `${Math.round(safe * 100)}%` }} />
      </div>
    </div>
  )
}

function DetailBlock({ title, children, t }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
      {children}
    </section>
  )
}

function placementReasons(record, lang) {
  if (!record) return []
  const zh = lang === "zh"
  const reasons = []
  if (Number(record.selectivity) >= 0.7 || Number(record.yield) >= 0.45) {
    reasons.push(zh ? "较高选择性或收率提高了性能潜力分数。" : "High selectivity or yield increases the performance-potential score.")
  } else if (record.performancePotential !== null) {
    reasons.push(zh ? "性能指标中等或不完整，使点位落在中等潜力区域。" : "Moderate or incomplete product metrics keep performance potential in the middle range.")
  } else {
    reasons.push(zh ? "缺少产物指标，无法形成可靠性能潜力分数。" : "Missing product metrics prevent a reliable performance-potential score.")
  }
  if (["literature", "real_seed", "validated", "experimental"].includes(record.evidenceLevel)) {
    reasons.push(zh ? "较好的证据等级和条件元数据提升了证据成熟度。" : "Curated evidence level and condition metadata lift evidence readiness.")
  } else {
    reasons.push(zh ? "demo、derived 或 hypothesis 证据使成熟度低于验证记录。" : "Demo, derived, or hypothesis evidence keeps readiness below validated records.")
  }
  if (record.comparabilityStatus !== "comparable") {
    reasons.push(zh ? "可比性限制和缺失字段降低了证据成熟度位置。" : "Comparability limits and missing fields reduce the readiness position.")
  }
  if (record.missingFields?.length) {
    reasons.push(zh
      ? `缺失 ${record.missingFields.slice(0, 3).join(", ")} 会影响覆盖率和下一步验证优先级。`
      : `Missing ${record.missingFields.slice(0, 3).join(", ")} affects coverage and next validation priority.`)
  }
  return reasons
}

export function SelectedPathwayInspector({ record, t, isMobile, lang = "en" }) {
  const zh = lang === "zh"
  if (!record) {
    return (
      <section style={{ background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 8, padding: 16 }}>
        <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900 }}>{zh ? "选中路径详情" : "Selected Pathway Inspector"}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
          {zh ? "请选择图中的路径点，查看反应指标、证据状态和可比性说明。" : "Select a pathway point in the map to inspect reaction metrics, evidence status, and comparability notes."}
        </div>
      </section>
    )
  }

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>{zh ? "选中路径详情" : "Selected Pathway Inspector"}</div>
        <h3 style={{ color: t.textStrong, fontSize: 18, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>{record.pathwayName || record.pathwayId}</h3>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.45 }}>
          {record.mainProduct || "pending product"} · {record.catalyst || "pending catalyst"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)" }}>
        <DetailBlock title={zh ? "记录摘要" : "Selected record summary"} t={t}>
          <div style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.65 }}>
            <div>{zh ? "候选物 / 催化剂" : "Candidate / catalyst"}: <SafeValue>{record.catalyst}</SafeValue></div>
            <div>{zh ? "主要产物" : "Main product"}: <SafeValue>{record.mainProduct}</SafeValue></div>
            <div>{zh ? "路径类别" : "Pathway category"}: <SafeValue>{record.pathwayCategory}</SafeValue></div>
            <div>{zh ? "来源类型" : "Source type"}: <SafeValue>{record.sourceType}</SafeValue></div>
          </div>
        </DetailBlock>

        <DetailBlock title={zh ? "指标与分数" : "Metrics and scores"} t={t}>
          <div style={{ display: "grid", gap: 9 }}>
            <ScoreLine label={zh ? "性能潜力" : "Performance potential"} value={record.performancePotential} t={t} />
            <ScoreLine label={zh ? "证据成熟度" : "Evidence readiness"} value={record.evidenceReadiness} t={t} />
            <ScoreLine label={zh ? "数据覆盖率" : "Data coverage"} value={record.dataCoverage} t={t} />
          </div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            conversion <SafeValue>{record.conversion}</SafeValue> · selectivity <SafeValue>{record.selectivity}</SafeValue> · yield <SafeValue>{record.yieldInferred ? `${record.inferredYield?.toFixed?.(2) || record.inferredYield} (inferred)` : record.yield}</SafeValue>
          </div>
        </DetailBlock>

        <DetailBlock title={zh ? "缺口与可比性" : "Gaps and comparability"} t={t}>
          <div style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.6 }}>
            <div>{zh ? "证据等级" : "Evidence level"}: <SafeValue>{record.evidenceLevel}</SafeValue></div>
            <div>{zh ? "可比性" : "Comparability"}: <SafeValue>{record.comparabilityStatus}</SafeValue></div>
            <div>{zh ? "覆盖率" : "Coverage"}: {pct(record.dataCoverage)} ({record.dataCoverageAvailable}/{record.dataCoverageTotal})</div>
          </div>
          <div style={{ color: record.missingFields?.length ? t.warn : t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
            {record.missingFields?.length ? record.missingFields.join(", ") : (zh ? "未记录必需字段缺口。" : "No missing required fields recorded.")}
          </div>
        </DetailBlock>
      </div>

      <DetailBlock title={zh ? "为什么位于这里？" : "Why placed here?"} t={t}>
        <div style={{ color: t.muted, display: "grid", fontSize: 12.5, gap: 5, lineHeight: 1.5 }}>
          {placementReasons(record, lang).map(reason => (
            <div key={reason}>- {reason}</div>
          ))}
        </div>
      </DetailBlock>
    </section>
  )
}
