// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatPercent, MiniMetric, Panel, StatusBadge, text } from "./FinalScreeningShared"

function CountChips({ counts, t }) {
  const entries = Object.entries(counts || {})
  if (!entries.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {entries.map(([key, value]) => (
        <span key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.textStrong, fontSize: 11, fontWeight: 850, padding: "6px 9px" }}>
          <ChemicalText value={`${key}: ${value}`} />
        </span>
      ))}
    </div>
  )
}

export function DataStatusAndProvenancePanel({ coverage, curatedRealResult, lang, t, isMobile }) {
  const curatedReport = curatedRealResult?.mappingReport || null
  return (
    <Panel
      id="organic-acid-final-data-status-provenance"
      eyebrow={text(lang, "数据状态", "Data status")}
      title={text(lang, "数据状态与溯源覆盖", "Data Status & Provenance Coverage")}
      t={t}
      actions={<StatusBadge tone={coverage?.noFakeDoiPolicyActive ? "pass" : "fail"} t={t}>{text(lang, "禁止伪造 DOI 策略已启用", "No fake DOI policy active")}</StatusBadge>}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MiniMetric label={text(lang, "结构化数值", "Structured values")} value={formatPercent(coverage?.structuredValueCoverage)} t={t} />
        <MiniMetric label={text(lang, "来源依据", "Source basis")} value={formatPercent(coverage?.sourceBasisCoverage)} t={t} />
        <MiniMetric label={text(lang, "置信度", "Confidence")} value={formatPercent(coverage?.confidenceCoverage)} t={t} />
        <MiniMetric label={text(lang, "DOI 覆盖率", "DOI coverage")} value={formatPercent(coverage?.doiCoverage)} t={t} tone="warn" />
        <MiniMetric label={text(lang, "伪 DOI", "Fake DOI")} value={coverage?.fakeDoiCount ?? 0} t={t} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "描述符溯源覆盖", "Descriptor provenance coverage")}</strong>
          <CountChips counts={coverage?.bySourceBasis} t={t} />
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "DOI / 证据状态", "DOI / evidence status")}</strong>
          <CountChips counts={coverage?.byConfidence} t={t} />
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              `DOI 覆盖率 ${Math.round((coverage?.doiCoverage || 0) * 100)}%；证据待补 ${coverage?.pendingDoiCount || 0}；伪 DOI ${coverage?.fakeDoiCount || 0}。`,
              `DOI coverage ${Math.round((coverage?.doiCoverage || 0) * 100)}%; evidence pending ${coverage?.pendingDoiCount || 0}; fake DOI ${coverage?.fakeDoiCount || 0}.`
            )} />
          </span>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "解释边界", "Interpretation boundary")}</strong>
          <CountChips counts={coverage?.dataStatusCounts} t={t} />
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "评分适合用于流程展示和假设生成，不代表最终材料发现结论。",
              "Scores are suitable for workflow demonstration and hypothesis generation, not final material discovery."
            )} />
          </span>
        </article>
      </div>

      <div style={{ background: coverage?.noFakeDoiPolicyActive ? t.badgeInfoBg : t.badgeWarnBg, border: `1px solid ${coverage?.noFakeDoiPolicyActive ? t.accent : t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.4, lineHeight: 1.55, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          `当前金属矩阵 ${coverage?.descriptorFieldCount || 0} 个描述符字段全部保留来源依据与置信度；无 DOI 的字段显示为证据待补，不伪造 DOI。`,
          `The current metal matrix keeps sourceBasis and confidence for ${coverage?.descriptorFieldCount || 0} descriptor fields. Fields without DOI are shown as evidence pending; DOI values are not fabricated.`
        )} />
      </div>

      {curatedReport ? (
        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 11 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "V1.6 真实样例映射报告", "V1.6 Curated real examples mapping report")}</strong>
            <StatusBadge tone="warn" t={t}>{text(lang, "仅小样本", "small sample only")}</StatusBadge>
          </div>
          <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
            <MiniMetric label={text(lang, "样例数", "Framework records")} value={curatedReport.frameworkRecords} t={t} />
            <MiniMetric label={text(lang, "可评分", "Ready")} value={curatedReport.readyForScoring} t={t} tone="info" />
            <MiniMetric label={text(lang, "需复核", "Needs review")} value={curatedReport.needsReview} t={t} tone="warn" />
            <MiniMetric label={text(lang, "拒绝", "Rejected")} value={curatedReport.rejected} t={t} tone="warn" />
            <MiniMetric label={text(lang, "DOI 覆盖率", "DOI coverage")} value={formatPercent(curatedReport.doiCoverage)} t={t} tone="warn" />
            <MiniMetric label={text(lang, "字段来源", "Field provenance")} value={formatPercent(curatedReport.fieldProvenanceCoverage)} t={t} />
          </div>
          <div style={{ color: t.muted, display: "grid", fontSize: 12.1, gap: 7, lineHeight: 1.5 }}>
            <ChemicalText value={text(lang, curatedReport.boundaryZh, curatedReport.boundary)} />
            <ChemicalText value={text(
              lang,
              "缺失来源字段在界面中显示为溯源待补；需复核与已拒绝记录保持可审计，但不会进入最终推荐。",
              "Missing field sources are shown as Pending provenance. Needs-review and rejected records remain auditable but cannot enter final recommendation."
            )} />
          </div>
        </section>
      ) : null}
    </Panel>
  )
}
