// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { FONT_MONO } from "../../constants/theme"
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
      <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 18, fontWeight: 930, lineHeight: 1.15, marginTop: 6 }}>{value}</div>
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
        <Card t={t} title="Demo records" value={stats.demoCount} />
        <Card t={t} title="Real seed records" value={stats.realSeedCount} />
        <Card t={t} title="Open MOF seed" value={stats.openSeedCount} />
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
    getGlobalMofCandidates({ mode: "open-mof-seed" }).then(rows => {
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
  const sourceRows = Object.entries(stats.sources).map(([source, count]) => [source, count, text(lang, "已接入 seed 子集", "Included in seed subset")])
  const mappingRows = [
    ["CoRE filename / refcode", "id, name, sourceRecordId, cifFile", "mapped", "CoRE ASR filename is retained as the source record identifier."],
    ["CoRE PLD / QMOF info.pld", "pldA, poreSizeA", "mapped", "Used as pore accessibility descriptor; unit: A."],
    ["CoRE LCD / QMOF info.lcd", "lcdA", "mapped", "Largest cavity diameter; unit: A."],
    ["CoRE ASA_m2_g", "surfaceArea", "mapped", "Available for CoRE-derived records; QMOF rows remain pending."],
    ["CoRE AV_cm3_g", "poreVolume", "mapped", "Mapped only when source provides accessible volume per gram."],
    ["CoRE cm3_g", "density", "mapped / derived", "Density is derived as 1 / cm3_g and noted in provenance."],
    ["QMOF qmof_id", "sourceRecordId, cifFile", "mapped", "QMOF ID is retained and paired with a CIF filename placeholder from the public archive."],
    ["QMOF outputs.pbe.bandgap", "bandGap", "mapped", "DFT-derived electronic descriptor; not organic-acid evidence."],
    ["QMOF info.mofid.*", "mofid, linker, topology", "mapped / needs parsing", "MOFid fields are retained when present; complex strings are not over-interpreted."],
    ["ARC-MOF adsorption descriptors", "co2Uptake, adsorption fields", "future source", "Allowed source, not loaded in this seed file yet."],
    ["MOSAEC experimental metadata", "waterStability, synthesis notes", "future source", "Allowed source, requires separate curation before assignment."],
    ["Literature / collaboration data", "organicAcidRelevance, experiment record", "not available", "Requires literature, DFT, or experiment support before assigning pathway roles."],
  ]
  const limitationRows = [
    text(
      lang,
	      "Open MOF seed 记录主要提供结构、几何或电子描述符，不能直接证明甲酸选择性、HCO3- / HCOO- 结合能力或 MOF 辅助有机酸转化能力。",
	      "Open MOF seed records provide structural, geometric, or electronic descriptors; they do not directly validate formic acid selectivity, HCO3- / HCOO- binding, or MOF-assisted organic acid conversion."
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
  const nextRows = [
    ["QMOF", "band gap / electronic descriptors", "Already represented in the first multi-source seed subset."],
    ["ARC-MOF", "large-scale structural diversity / charges / adsorption descriptors", "Allowed next source; process offline before JSON export."],
    ["MOSAEC", "experimental MOF data expansion", "Useful for measured stability or synthesis-side metadata after review."],
    ["Literature curation", "water stability / thermal stability / toxicity notes", "Manual extraction with citation and curation status."],
    ["Collaboration experiments", "product distribution and post-reaction stability", "Captured through organic_acid_experiment_records.json."],
  ]

  return (
    <section id="open-mof-integration-report" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 14, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Open MOF Database Integration Report</div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, lineHeight: 1.16, margin: 0, fontWeight: 940 }}>
          {text(lang, "开源 MOF 数据库接入报告", "Open MOF Database Integration Report")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 920 }}>
          {text(
            lang,
            "大型 MOF 数据库不会直接在浏览器端全量加载。EcoMOF-AI 只读取经过离线筛选、字段标准化和 provenance 保留的轻量 seed JSON。",
            "Full-scale MOF databases are not loaded directly in the browser. EcoMOF-AI only reads lightweight seed JSON files after offline filtering, field normalization, and provenance retention."
          )}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 9 }}>
        <Card t={t} title="Total open seed records" value={stats.openSeedCount} note={text(lang, "当前轻量 JSON 记录数", "Current lightweight JSON records")} />
        <Card t={t} title="Records with PLD" value={stats.withPld} />
        <Card t={t} title="Records with surface area" value={stats.withSurfaceArea} />
        <Card t={t} title="Pending organic-acid relevance" value={stats.pendingOrganicAcid} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "来源构成", "Source Composition")}</h3>
        <MiniTable headers={["Source database", "Records", "Status"]} rows={sourceRows.length ? sourceRows : [["pending", 0, "pending"]]} t={t} isMobile={isMobile} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "多源字段映射表", "Multi-source Field Mapping Table")}</h3>
        <MiniTable headers={["Source field", "EcoMOF-AI field", "Status", "Notes"]} rows={mappingRows} t={t} isMobile={isMobile} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 9 }}>
        {limitationRows.map((body, index) => (
          <article key={body} style={{ background: index === 0 ? t.badgeWarnBg : t.surface, border: `1px solid ${index === 0 ? t.warn : t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.6, padding: 11 }}>
            <ChemicalText value={body} />
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "后续数据源", "Next Data Sources")}</h3>
        <MiniTable headers={["Data source", "Expected contribution", "Handling rule"]} rows={nextRows} t={t} isMobile={isMobile} />
      </div>
    </section>
  )
}
