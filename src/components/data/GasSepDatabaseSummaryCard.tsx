// @ts-nocheck
// V3.9.1 — presentational GasSep database summary. Receives a built summary +
// export rows (never raw records). Shows record count, gas systems, condition /
// capacity / selectivity / dynamic-process coverage, source-type distribution,
// provenance, and benchmark suitability, with a provenance-bearing CSV export of
// the current set.
import { DataMetricCard } from "./DataMetricCard"
import { DatasetModeBadge } from "./DatasetModeBadge"
import { ExportButton } from "./ExportButton"
import { buildCsv } from "../../utils/export/exportCsv"
import { buildExportFileName } from "../../utils/export/buildExportFileName"
import { APP_VERSION, APP_VERSION_LABEL } from "../../constants/appVersion"

export function GasSepDatabaseSummaryCard({ summary = null, exportRows = [], lang = "en", t, isMobile = false }: any) {
  if (!summary) return null
  const zh = lang === "zh"
  const dist = summary.sourceTypeDistribution?.counts || {}

  return (
    <section
      id="gassep-database-summary"
      data-testid="gassep-database-summary"
      style={{ background: t?.panel || "#FFF", border: `1px solid ${t?.border || "#E2E8F0"}`, borderRadius: 12, display: "grid", gap: 11, minWidth: 0, padding: 15 }}
    >
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
          <span style={{ color: t?.accentText || "#1A6DB5", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>GasSep Data Summary</span>
          <h3 style={{ color: t?.textStrong || "#0A1628", fontSize: 16, margin: 0 }}>{zh ? "GasSep 数据摘要" : "GasSep Data Summary"}</h3>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 7 }}>
          <span style={{ background: t?.badgeInfoBg || "#EFF6FF", border: `1px solid ${t?.border || "#E2E8F0"}`, borderRadius: 6, color: t?.accentText || "#1A6DB5", fontSize: 10.2, fontWeight: 850, padding: "2px 8px" }}>
            {APP_VERSION_LABEL}
          </span>
          <DatasetModeBadge mode={summary.dataMode} t={t} />
          <ExportButton
            label={zh ? "导出 CSV" : "Export CSV"}
            data-testid="gassep-export-button"
            t={t}
            mime="text/csv"
            fileName={() => buildExportFileName({ base: "gassep-records", version: APP_VERSION, ext: "csv" })}
            build={() => buildCsv(exportRows, { includeMeta: true, meta: { appVersion: APP_VERSION, dataVersion: summary.dataVersion, generatedAt: summary.generatedAt, dataMode: summary.dataMode } })}
          />
        </div>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <DataMetricCard label={zh ? "吸附记录" : "Adsorption Records"} value={summary.adsorptionRecordCount} type="count" tone="pass" t={t} />
        <DataMetricCard label={zh ? "气体体系" : "Gas Systems"} value={summary.gasSystemCount} type="count" t={t} />
        <DataMetricCard label={zh ? "温度覆盖" : "Temp Coverage"} value={summary.conditionCoverage?.temperatureCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "压力覆盖" : "Pressure Coverage"} value={summary.conditionCoverage?.pressureCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "容量覆盖" : "Capacity Coverage"} value={summary.conditionCoverage?.capacityCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "选择性覆盖" : "Selectivity Coverage"} value={summary.conditionCoverage?.selectivityCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "穿透覆盖" : "Breakthrough Coverage"} value={summary.conditionCoverage?.breakthroughCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "湿度覆盖" : "Humidity Coverage"} value={summary.conditionCoverage?.humidityCoverage} type="ratio" t={t} />
        <DataMetricCard label={zh ? "溯源覆盖" : "Provenance Coverage"} value={summary.provenanceCoverage} type="ratio" tone="pass" t={t} />
        <DataMetricCard label={zh ? "可入 Benchmark" : "Benchmark Suitable"} value={summary.benchmarkSuitability?.ratio} type="ratio" t={t} />
      </div>

      <div data-testid="gassep-source-distribution" style={{ color: t?.muted || "#475569", fontSize: 11.3, lineHeight: 1.5 }}>
        {zh ? "来源分布" : "Source distribution"}: experimental {dist.experimental ?? 0} · literature {dist.literature ?? 0} · simulation {dist.simulation ?? 0} · inferred {dist.inferred ?? 0}
      </div>
      <span style={{ color: t?.faint || "#64748B", fontSize: 10 }}>generatedAt {summary.generatedAt} · {summary.gasPairCount} gas pairs</span>
    </section>
  )
}

export default GasSepDatabaseSummaryCard
