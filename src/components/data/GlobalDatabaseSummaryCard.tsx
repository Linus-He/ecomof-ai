// @ts-nocheck
// V3.9 — presentational Global Database Summary. Receives ONLY the summary built
// by buildGlobalDatabaseSummary; it never reads raw data. Renders database-scale
// metrics, the category/mode breakdown, provenance coverage, the dataMode badge,
// and a missing-data notice when sources fell back.
import { DataMetricCard } from "./DataMetricCard"
import { DatasetModeBadge } from "./DatasetModeBadge"
import { MissingDataNotice } from "./MissingDataNotice"
import { safePercent } from "../../utils/fallback/safePercent"
import { APP_VERSION_LABEL } from "../../constants/appVersion"

export function GlobalDatabaseSummaryCard({ summary = null, lang = "en", t, isMobile = false }: any) {
  if (!summary) return null
  const zh = lang === "zh"
  const categories = Array.isArray(summary.categories) ? summary.categories : []

  return (
    <section
      id="global-database-summary"
      data-testid="global-database-summary"
      style={{ background: t?.panel || "#FFF", border: `1px solid ${t?.border || "#E2E8F0"}`, borderRadius: 12, display: "grid", gap: 12, minWidth: 0, padding: 15 }}
    >
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <span style={{ color: t?.accentText || "#1A6DB5", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Global Database Summary</span>
          <h3 style={{ color: t?.textStrong || "#0A1628", fontSize: 17, lineHeight: 1.2, margin: 0 }}>{zh ? "全局数据库摘要" : "Global Database Summary"}</h3>
          <p style={{ color: t?.muted || "#475569", fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
            {zh ? `仅汇总当前参与检索、计算或验证的数据层（${summary.dataVersion}）；同一材料可能出现在多个数据层。` : `Only layers used for search, calculation, or validation are summarized (${summary.dataVersion}); one material can appear in multiple layers.`}
          </p>
        </div>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-end" }}>
          <span style={{ background: t?.badgeInfoBg || "#EFF6FF", border: `1px solid ${t?.border || "#E2E8F0"}`, borderRadius: 6, color: t?.accentText || "#1A6DB5", fontSize: 10.2, fontWeight: 850, padding: "2px 8px" }}>
            {APP_VERSION_LABEL}
          </span>
          <DatasetModeBadge mode={summary.dataMode} t={t} />
        </div>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <DataMetricCard label={zh ? "数据源" : "Data Sources"} value={summary.totalSources} type="count" tone="pass" t={t} />
        <DataMetricCard label={zh ? "已加载" : "Loaded"} value={summary.loadedSources} type="count" t={t} />
        <DataMetricCard label={zh ? "记录层合计" : "Layer Records"} value={summary.totalRecords} type="count" t={t} />
        <DataMetricCard label={zh ? "溯源覆盖" : "Provenance Coverage"} value={summary.provenanceShare} type="ratio" tone="pass" t={t} />
      </div>

      <div data-testid="global-db-categories" style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {categories.map((c: any) => (
          <DataMetricCard key={c.category} label={`${c.category} (${c.sources})`} value={c.records} type="count" fallbackKind="generic" t={t} />
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {Object.entries(summary.byMode || {}).map(([mode, count]) => (
          <span key={mode} style={{ color: t?.muted || "#475569", fontSize: 10.8 }}><DatasetModeBadge mode={mode} t={t} /> {String(count)}</span>
        ))}
      </div>

      {summary.fallbackApplied ? (
        <MissingDataNotice count={summary.totalSources - summary.loadedSources} t={t} />
      ) : null}

      <span style={{ color: t?.faint || "#64748B", fontSize: 10 }}>
        {zh ? "生成时间" : "generatedAt"}: {summary.generatedAt} · provenance share {safePercent(summary.provenanceShare)}
      </span>
    </section>
  )
}

export default GlobalDatabaseSummaryCard
