// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { formatCount, safeText } from "../../utils/databaseIndex/databaseIndexFormatters"
import {
  buildMetadataVerificationSummary,
  metadataLevelLabel,
  metadataLevelTone,
  metadataStatusTone,
  metadataStatusValueLabel,
  summarizeMetadataVerification,
} from "../../utils/databaseIndex/metadataVerification"

const STATUS_ROWS = [
  ["doiStatus", "DOI status", "DOI 状态"],
  ["sourceUrlStatus", "Source URL status", "来源链接状态"],
  ["licenseStatus", "License status", "license 状态"],
  ["citationStatus", "Citation status", "引用状态"],
  ["descriptorProvenanceStatus", "Descriptor provenance", "描述符溯源"],
  ["retrievedAtStatus", "Retrieved at", "抓取时间"],
]

const LEVELS = ["verified_metadata", "partial_metadata", "preview_only", "blocked"]

function ScopeCounts({ label, records, lang, t }) {
  const summary = useMemo(() => summarizeMetadataVerification(records), [records])
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 9 }}>
      <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, "记录数", "records")}: {formatCount(summary.total)}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {LEVELS.map(level => (
          <StatusBadge key={level} tone={metadataLevelTone(level)} t={t}>{`${metadataLevelLabel(level, lang)}: ${formatCount(summary[level])}`}</StatusBadge>
        ))}
      </div>
    </article>
  )
}

function CandidateDetail({ candidate, lang, t }) {
  const summary = useMemo(() => buildMetadataVerificationSummary(candidate, lang), [candidate, lang])
  return (
    <section style={{ background: t.panel, border: `1px solid ${summary.eligible ? t.border : t.warn}`, borderRadius: 9, display: "grid", gap: 9, padding: 10 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{dbText(lang, "currentCandidate")}</span>
          <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}><ChemicalText value={safeText(candidate.displayName || candidate.name || candidate.frameworkId || candidate.id)} /></strong>
        </div>
        <StatusBadge tone={metadataLevelTone(summary.level)} t={t}>{metadataLevelLabel(summary.level, lang)}</StatusBadge>
      </header>
      <div style={{ display: "grid", gap: 6 }}>
        {STATUS_ROWS.map(([key, en, zh]) => (
          <div key={key} style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
            <span style={{ color: t.muted, fontSize: 11.6 }}>{text(lang, zh, en)}</span>
            <StatusBadge tone={metadataStatusTone(summary.status[key])} t={t}>{metadataStatusValueLabel(summary.status[key], lang)}</StatusBadge>
          </div>
        ))}
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        <StatusBadge tone={summary.eligible ? "pass" : "warn"} t={t}>
          {summary.eligible ? dbText(lang, "eligibleForVerifiedRecommendation") : dbText(lang, "previewOnly")}
        </StatusBadge>
      </div>
      {summary.blockingReasons.length ? (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{dbText(lang, "blockingReasons")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {summary.blockingReasons.map(reason => <StatusBadge key={reason} tone="warn" t={t}>{reason}</StatusBadge>)}
          </div>
        </div>
      ) : null}
      {summary.warnings.length ? (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{dbText(lang, "warnings")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {summary.warnings.map(warning => <StatusBadge key={warning} tone="proxy" t={t}>{warning}</StatusBadge>)}
          </div>
        </div>
      ) : null}
      {!summary.eligible ? (
        <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
          <ChemicalText value={dbText(lang, "cannotSupportFinalRecommendation")} />
        </p>
      ) : null}
    </section>
  )
}

export function MetadataVerificationPanel({ topCandidates = [], selectedPartRecords = [], selectedCandidate = null, lang, t, isMobile }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{dbText(lang, "metadataVerificationGate")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "对当前已加载的候选建模 metadata 核验状态：缺 DOI、缺来源链接、缺 license 或缺描述符溯源的候选只能停留在仅限预览，不能进入经核验推荐；该门控不修改 OACS/DMRS 公式。",
              "Models metadata verification status for currently loaded candidates: candidates missing DOI, source link, license, or descriptor provenance stay preview only and cannot enter verified recommendation; this gate does not modify OACS/DMRS formulas."
            )} />
          </span>
        </div>
        <StatusBadge tone="warn" t={t}>{dbText(lang, "notFinalRecommendation")}</StatusBadge>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <ScopeCounts label={text(lang, "Top-N 预览范围", "Top-N preview scope")} records={topCandidates} lang={lang} t={t} />
        <ScopeCounts label={text(lang, "当前选定索引分片", "Selected index part")} records={selectedPartRecords} lang={lang} t={t} />
      </div>
      {selectedCandidate ? (
        <CandidateDetail candidate={selectedCandidate} lang={lang} t={t} />
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>
          {text(lang, "选择一个候选（详情、对比或分片记录）查看其 metadata 核验详情。", "Select a candidate (detail, compare, or part record) to inspect its metadata verification detail.")}
        </span>
      )}
    </section>
  )
}

export default MetadataVerificationPanel
