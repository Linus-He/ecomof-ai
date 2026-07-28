// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { FONT_SANS } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { getGlobalMofCandidates, getOrganicAcidExperimentRecords } from "../../services/dataService"
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value)
}

function hasValue(value) {
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  const normalized = String(value).trim().toLowerCase()
  return normalized !== "" && normalized !== "pending" && normalized !== "null" && normalized !== "undefined"
}

function Card({ title, value, note, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 11 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 18, fontWeight: 930, lineHeight: 1.15, marginTop: 6 }}>{value}</div>
      {note ? <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}><ChemicalText value={note} /></div> : null}
    </article>
  )
}

function MiniTable({ rows, headers, t, isMobile }) {
  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: isMobile ? 720 : 0, width: "100%" }}>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} style={{ borderBottom: `1px solid ${t.borderStrong}`, color: t.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`} style={{ borderBottom: `1px solid ${t.border}`, color: cellIndex === 0 ? t.textStrong : t.muted, fontSize: 12, fontWeight: cellIndex === 0 ? 850 : 500, lineHeight: 1.55, padding: "9px" }}>
                  <ChemicalText value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function buildOpenMofDataStats(seedRecords = [], experimentRecords = [], demoCount = 0, realSeedCount = 0) {
  const rows = Array.isArray(seedRecords) ? seedRecords : []
  const experiments = Array.isArray(experimentRecords) ? experimentRecords : []
  return {
    demoCount,
    realSeedCount,
    openSeedCount: rows.length,
    experimentCount: experiments.length,
    withSurfaceArea: rows.filter(row => hasValue(row.surfaceArea)).length,
    withPld: rows.filter(row => hasValue(row.pldA || row.poreSizeA)).length,
    withPoreVolume: rows.filter(row => hasValue(row.poreVolume)).length,
    withCif: rows.filter(row => hasValue(row.cifFile || row.cifUrl)).length,
    pendingOrganicAcid: rows.filter(row => !hasValue(row.organicAcidRelevance?.pathwayPriorityScore) || String(row.organicAcidRelevance?.scoreStatus || "").toLowerCase().includes("pending")).length,
    pendingGraph: rows.filter(row => String(row.graphMetadata?.graphStatus || row.graphMetadata?.graphConfidence || "").toLowerCase().includes("pending")).length,
    experimentSupported: rows.filter(row => String(row.organicAcidRelevance?.scoreStatus || "").toLowerCase().includes("experimental")).length,
    sources: rows.reduce((counts, row) => {
      const key = safeText(row.provenance?.sourceDatabase || row.sourceDatabase || row.provenance?.database)
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {}),
  }
}

export function DataStatusSummary({ seedRecords = [], experimentRecords = [], demoCount = 0, realSeedCount = 0, lang: forcedLang, t: tone, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const stats = useMemo(() => buildOpenMofDataStats(seedRecords, experimentRecords, demoCount, realSeedCount), [seedRecords, experimentRecords, demoCount, realSeedCount])
  const sourceText = Object.entries(stats.sources).map(([source, count]) => `${source}: ${count}`).join(" · ") || "pending"

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, minWidth: 0, padding: 13 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Data Status Summary</div>
        <h2 style={{ color: t.textStrong, fontSize: 19, lineHeight: 1.18, margin: 0 }}>{text(lang, "数据状态摘要", "Data Status Summary")}</h2>
        <div style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55 }}>{sourceText}</div>
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(7, minmax(0, 1fr))" }}>
        <Card t={t} title="Isolated demo records" value={stats.demoCount} />
        <Card t={t} title="Legacy seed records" value={stats.realSeedCount} />
        <Card t={t} title="CoRE 2024 CR records" value={stats.openSeedCount} />
        <Card t={t} title="Experiment records" value={stats.experimentCount} />
        <Card t={t} title="Pending organic-acid" value={stats.pendingOrganicAcid} />
        <Card t={t} title="Pending graph metadata" value={stats.pendingGraph} />
        <Card t={t} title="Experiment-supported" value={stats.experimentSupported} />
      </div>
    </section>
  )
}

export function OpenMofIntegrationReport({ seedRecords: providedSeedRecords, experimentRecords: providedExperimentRecords, lang: forcedLang, t: tone, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const [seedRecords, setSeedRecords] = useState(Array.isArray(providedSeedRecords) ? providedSeedRecords : [])
  const [experimentRecords, setExperimentRecords] = useState(Array.isArray(providedExperimentRecords) ? providedExperimentRecords : [])

  useEffect(() => {
    if (Array.isArray(providedSeedRecords)) return
    let live = true
    getGlobalMofCandidates().then(rows => {
      if (live) setSeedRecords(Array.isArray(rows) ? rows : [])
    })
    return () => {
      live = false
    }
  }, [providedSeedRecords])

  useEffect(() => {
    if (Array.isArray(providedExperimentRecords)) return
    let live = true
    getOrganicAcidExperimentRecords().then(rows => {
      if (live) setExperimentRecords(Array.isArray(rows) ? rows : [])
    })
    return () => {
      live = false
    }
  }, [providedExperimentRecords])

  const stats = useMemo(() => buildOpenMofDataStats(seedRecords, experimentRecords), [seedRecords, experimentRecords])
  const sourceRows = Object.entries(stats.sources).map(([source, count]) => [source, count, text(lang, "真实 CR 来源记录", "Real CR source records")])
  const mappingRows = [
    ["CSD refcode", "csdRefcode, displayName", "mapped", "CSD refcode remains the fallback display identity when no literature common name is available."],
    ["CoRE MOF ID", "coreId, sourceRecordId", "mapped", "The year / metal / topology / variant identity is retained without inventing a platform name."],
    ["PLD / LCD", "pldA, poreSizeA, lcdA", "mapped", "Pore limiting and largest cavity diameters; unit: Å."],
    ["ASA_m2_g", "surfaceArea", "mapped", "Accessible surface area from the CSD-modified CR source row."],
    ["AV_cm3_g", "poreVolume", "mapped", "Accessible pore volume per gram from the source row."],
    ["density / void fraction", "density, voidFraction", "mapped", "Record-level structural descriptors retained with source provenance."],
    ["CR extension", "structureVariant, computationReadiness", "mapped", "ASR / FSR / ION is retained; only CR records enter the active corpus."],
    ["DOI / citation / license", "doi, citation, license", "mapped", "Record-level DOI and CoRE citation are preserved under CC-BY-NC-SA-4.0."],
    ["Literature / collaboration data", "organicAcidRelevance, experiment record", "not available", "Requires literature, DFT, or experiment support before assigning pathway roles."],
  ]
  const limitationRows = [
    text(
      lang,
	      "CoRE 2024 CR 记录提供真实结构与几何描述符，但不能直接证明甲酸选择性、HCO3- / HCOO- 结合能力或 MOF 辅助有机酸转化能力。",
	      "CoRE 2024 CR rows provide real structures and geometric descriptors; they do not directly validate formic-acid selectivity, HCO3- / HCOO- binding, or MOF-assisted organic-acid conversion."
    ),
    text(
      lang,
      "有机酸相关性必须在人工整理、DFT、文献或实验数据支持后才能赋值；默认状态保持 pending。",
      "Organic-acid relevance must remain pending until supported by manual curation, DFT, literature, or experiment."
    ),
    text(
      lang,
      "不同来源的字段不能混作同一证据等级；每条记录的 provenance 必须保留 sourceDatabase、sourceRecordId、sourceVersion、sourceUrl、citation、license、retrievedAt 和 curationStatus。",
      "Fields from different sources are not treated as the same evidence level; every record provenance keeps sourceDatabase, sourceRecordId, sourceVersion, sourceUrl, citation, license, retrievedAt, and curationStatus."
    ),
  ]
  return (
    <section id="open-mof-integration-report" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 14, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>CoRE MOF 2024 Data Integration Report</div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, lineHeight: 1.16, margin: 0, fontWeight: 940 }}>
          {text(lang, "CoRE MOF 2024 真实数据接入报告", "CoRE MOF 2024 Real-data Integration Report")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>
          {text(
            lang,
            "全部 9,835 条 CSD-modified CR 来源记录已进入轻量搜索与结构索引；浏览器按需加载索引分片和少量内置 CIF，不会把 405 MB 原始 CIF 包整体塞入首屏。",
            "All 9,835 CSD-modified CR source rows are present in the lightweight search and structure index. The browser loads index parts and selected bundled CIFs on demand rather than placing the full 405 MB raw CIF corpus in the initial page."
          )}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 9 }}>
        <Card t={t} title="Total CoRE 2024 CR records" value={stats.openSeedCount} note={text(lang, "真实来源记录数", "Real source-record count")} />
        <Card t={t} title="Records with PLD" value={stats.withPld} />
        <Card t={t} title="Records with surface area" value={stats.withSurfaceArea} />
        <Card t={t} title="Pending organic-acid relevance" value={stats.pendingOrganicAcid} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "来源构成", "Source Composition")}</h3>
        <MiniTable headers={["Source database", "Records", "Status"]} rows={sourceRows.length ? sourceRows : [["pending", 0, "pending"]]} t={t} isMobile={isMobile} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "CoRE 来源字段映射表", "CoRE Source-field Mapping Table")}</h3>
        <MiniTable headers={["Source field", "EcoMOF-AI field", "Status", "Notes"]} rows={mappingRows} t={t} isMobile={isMobile} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 9 }}>
        {limitationRows.map((body, index) => (
          <article key={body} style={{ background: index === 0 ? t.badgeWarnBg : t.surface, border: `1px solid ${index === 0 ? t.warn : t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.6, padding: 11 }}>
            <ChemicalText value={body} />
          </article>
        ))}
      </div>

    </section>
  )
}
