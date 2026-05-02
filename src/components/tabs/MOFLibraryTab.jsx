import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  LITERATURE_DB, fetchDataJson, buildDatabaseRecords, downloadTextFile, toolbarBtn,
  BasisBadge, PageHeader, ResultLayer, Callout, DataModeToggle, RealSeedCallout, safeVal,
  FieldProvenanceButton,
} from "../../shared"

function normalizeDemoRecord(item) {
  const metalNodes = Array.isArray(item.metalNodes) ? item.metalNodes : item.metal ? [item.metal] : []
  const source = Array.isArray(item.source) ? item.source.join(" / ") : item.source
  const limitations = Array.isArray(item.limitations) ? item.limitations.join("; ") : item.limitations
  const activeSiteHypothesis = Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis
  return {
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes,
    metal: metalNodes.join(", ") || item.metal || "—",
    linker: item.linker || "—",
    topology: item.topology || "—",
    poreSizeA: Number(item.poreSizeA ?? item.pd ?? item.lcd ?? 0),
    surfaceArea: Number(item.surfaceArea ?? item.bet ?? 0),
    poreVolume: item.poreVolume ?? item.pv ?? "—",
    co2Uptake: item.co2Uptake ?? "—",
    bandGap: item.bandGap ?? "—",
    waterStability: item.waterStability || "—",
    thermalStability: item.thermalStability || "—",
    costLevel: item.costLevel || "—",
    toxicityConcern: item.toxicityConcern || "—",
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    activeSiteHypothesis: activeSiteHypothesis || "—",
    source: source || item.sourceDatabase || item.sourceType || "Demo seed",
    evidenceLevel: item.evidenceLevel || "Low",
    limitations: limitations || "Demo / placeholder record; needs validation.",
    dataStatus: item.dataStatus || "demo / placeholder / needs validation",
    fieldSources: item.fieldSources || undefined,
  }
}

function normalizeLegacyRecord(item) {
  return normalizeDemoRecord({
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes: item.metal ? [item.metal] : [],
    linker: item.linker,
    topology: item.topology,
    poreSizeA: item.pd || item.lcd || 0,
    surfaceArea: item.bet || 0,
    poreVolume: item.pv,
    co2Uptake: item.co2Uptake || item.co2_uptake_mmol_g,
    bandGap: item.bandGap || "—",
    waterStability: item.waterStability || "unmarked",
    thermalStability: item.thermalStability || "unmarked",
    costLevel: "unmarked",
    toxicityConcern: "unmarked",
    reactionClasses: [],
    activeSiteHypothesis: item.oms ? "Open metal site marked in structure record" : "Not specified",
    source: item.sourceDatabase || item.sourceType || "local seed",
    evidenceLevel: item.qualityFlag ? "Low-medium" : "Low",
    limitations: item.qualityFlag || "Legacy structure/label record; use as a data attribute, not a conclusion.",
    dataStatus: "local seed / needs validation",
  })
}

const zhValue = (value, lang) => {
  if (lang !== "zh") return value
  return {
    High: "高",
    Medium: "中",
    Low: "低",
    "Low-medium": "低-中",
    "unmarked": "未标注",
    "Demo seed": "演示种子数据",
    "local seed": "本地种子数据",
  }[value] || value
}

export function MOFLibraryTab({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("demo")
  const [query, setQuery] = useState("")
  const [metal, setMetal] = useState("all")
  const [source, setSource] = useState("all")
  const [evidence, setEvidence] = useState("all")
  const [poreMin, setPoreMin] = useState(0)
  const [poreMax, setPoreMax] = useState(40)
  const [areaMin, setAreaMin] = useState(0)
  const [areaMax, setAreaMax] = useState(5000)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [demoRows, setDemoRows] = useState([])
  const [realSeedRows, setRealSeedRows] = useState([])
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_structures.json"),
      fetchDataJson("adsorption_labels.json"),
      fetchDataJson("mof_candidates_demo.json"),
      fetchDataJson("mof_candidates_real_seed.json"),
    ])
      .then(([structures, labels, demo, realSeed]) => {
        if (!active) return
        setStructureRows(structures)
        setLabelRows(labels)
        setDemoRows(Array.isArray(demo) ? demo : [])
        setRealSeedRows(Array.isArray(realSeed) ? realSeed : [])
        setStatus("loaded")
      })
      .catch(() => {
        if (!active) return
        setStatus("fallback")
      })
    return () => { active = false }
  }, [])

  const records = useMemo(() => {
    if (dataMode === "real-seed" && realSeedRows.length) {
      return realSeedRows.map(item => normalizeDemoRecord({
        ...item,
        // Graceful fallback for null numeric fields
        poreSizeA: item.poreSizeA ?? "pending",
        surfaceArea: item.surfaceArea ?? "pending",
        poreVolume: item.poreVolume ?? "pending",
        co2Uptake: item.co2Uptake ?? "pending",
        bandGap: item.bandGap ?? "pending",
        dataStatus: item.curationNote || "real-seed / pending curation",
      }))
    }
    if (demoRows.length) return demoRows.map(normalizeDemoRecord)
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return (loaded.length ? loaded : LITERATURE_DB).map(normalizeLegacyRecord)
  }, [dataMode, demoRows, realSeedRows, structureRows, labelRows])

  const metals = useMemo(() => Array.from(new Set(records.flatMap(item => item.metalNodes).filter(Boolean))).sort(), [records])
  const sources = useMemo(() => Array.from(new Set(records.map(item => item.source || "local seed"))).sort(), [records])
  const evidenceLevels = useMemo(() => Array.from(new Set(records.map(item => item.evidenceLevel || "Low"))).sort(), [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter(item => !q || [item.name, item.formula, item.metal, item.linker, item.topology, item.source, item.evidenceLevel].some(value => String(value || "").toLowerCase().includes(q)))
      .filter(item => metal === "all" || item.metalNodes.includes(metal))
      .filter(item => source === "all" || item.source === source)
      .filter(item => evidence === "all" || item.evidenceLevel === evidence)
      .filter(item => Number(item.poreSizeA || 0) >= Number(poreMin) && Number(item.poreSizeA || 0) <= Number(poreMax))
      .filter(item => Number(item.surfaceArea || 0) >= Number(areaMin) && Number(item.surfaceArea || 0) <= Number(areaMax))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [records, query, metal, source, evidence, poreMin, poreMax, areaMin, areaMax])

  const exportCsv = () => {
    const header = ["MOF name", "Metal nodes", "Linker", "Pore size A", "Surface area m2/g", "CO2 uptake", "Band gap", "Stability", "Source", "Evidence level", "Limitations"]
    const rows = filtered.map(item => [
      item.name, item.metal, item.linker, item.poreSizeA, item.surfaceArea, item.co2Uptake, item.bandGap,
      `${item.waterStability}/${item.thermalStability}`, item.source, item.evidenceLevel, item.limitations,
    ])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    downloadTextFile("ecomof_mof_library.csv", csv, "text/csv")
  }

  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 11px", color: t.text, fontSize: 12, width: "100%" }
  const labelStyle = { display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }
  const detailBlock = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }
  const field = (label, value, fieldKey, fieldSources) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 4 }}>
        <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
        {fieldKey && <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={fieldSources?.[fieldKey]} lang={lang} />}
      </div>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 750, overflowWrap: "anywhere" }}>{value || "—"}</div>
    </div>
  )

  const filterFields = (
    <>
      <label style={{ ...labelStyle, gridColumn: isNarrow ? "1 / -1" : "auto" }}>
        {lang === "zh" ? "搜索 MOF 名称" : "Search MOF name"}
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === "zh" ? "输入 MOF、金属、连接体或来源..." : "Type MOF, metal, linker, or source..."} style={controlStyle} />
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "金属中心" : "Metal center"}
        <select value={metal} onChange={e => setMetal(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {metals.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "数据来源" : "Data source"}
        <select value={source} onChange={e => setSource(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部来源" : "all sources"}</option>
          {sources.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        Evidence Level
        <select value={evidence} onChange={e => setEvidence(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {evidenceLevels.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      {[
        [lang === "zh" ? "最小孔径 Å" : "Pore min Å", poreMin, setPoreMin],
        [lang === "zh" ? "最大孔径 Å" : "Pore max Å", poreMax, setPoreMax],
        [lang === "zh" ? "最小比表面积" : "Surface area min", areaMin, setAreaMin],
        [lang === "zh" ? "最大比表面积" : "Surface area max", areaMax, setAreaMax],
      ].map(([label, value, setter]) => (
        <label key={label} style={labelStyle}>
          {label}
          <input type="number" value={value} onChange={e => setter(e.target.value)} style={controlStyle} />
        </label>
      ))}
      <button type="button" onClick={exportCsv} style={{ ...toolbarBtn(t), height: 38, alignSelf: "end" }}>↓ CSV</button>
    </>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "MOF Library — 基础材料数据" : "MOF Library — Baseline material data"}
        subtitle={lang === "zh"
          ? "展示 MOF 基础字段、数据来源和证据等级。Library 是底层数据入口，不直接把数据库记录等同于科研结论。"
          : "Browse MOF baseline fields, data sources, and evidence levels. The Library is a data entry point and does not turn database records into scientific conclusions."}
        meta={lang === "zh" ? "搜索 · 金属筛选 · 孔结构 · 数据来源 · Evidence Level" : "Search · metal filter · pore descriptors · data source · Evidence Level"}
        action={<BasisBadge tone={status === "loaded" ? "calc" : "proxy"}>{status === "loaded" ? "public/data" : (lang === "zh" ? "种子数据" : "fallback seed")}</BasisBadge>}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <DataModeToggle value={dataMode} onChange={mode => { setDataMode(mode); setExpandedId(null) }} lang={lang} />
        <span style={{ color: t.faint, fontSize: 11 }}>
          {dataMode === "real-seed"
            ? (lang === "zh" ? `${realSeedRows.length} 条真实种子记录` : `${realSeedRows.length} real seed records`)
            : (lang === "zh" ? `${demoRows.length} 条演示记录` : `${demoRows.length} demo records`)}
        </span>
      </div>

      {dataMode === "real-seed" && <RealSeedCallout lang={lang} />}

      <Callout tone="info">
        {lang === "zh"
          ? "当前数据包含 demo / placeholder / seed records。字段用于 early-stage screening 的数据审计，不能直接解释为实验性能、催化结论或完整 LCA 结论。"
          : "Current data include demo / placeholder / seed records. Fields support data audit for early-stage screening and should not be read as experimental performance, catalysis conclusions, or complete LCA conclusions."}
      </Callout>

      <ResultLayer number="01" title={lang === "zh" ? "搜索与基础筛选" : "Search and Basic Filters"}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <button type="button" onClick={() => setFiltersOpen(prev => !prev)} style={{ ...controlStyle, display: isMobile ? "block" : "none", marginBottom: filtersOpen ? 10 : 0 }}>
            {filtersOpen ? (lang === "zh" ? "收起筛选器" : "Collapse filters") : (lang === "zh" ? "展开筛选器" : "Expand filters")}
          </button>
          <div style={{ display: isMobile && !filtersOpen ? "none" : "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "minmax(220px, 1.2fr) repeat(4, minmax(120px, 0.75fr)) auto", gap: 10, alignItems: "end" }}>
            {filterFields}
          </div>
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "基础数据概览" : "Baseline Data Overview"} subtitle={lang === "zh" ? "所有指标均为数据字段或筛选线索，不是最终科研判断。" : "All metrics are data fields or screening cues, not final scientific judgments."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "当前显示" : "Showing", `${filtered.length} / ${records.length}`],
            [lang === "zh" ? "数据来源" : "Data sources", sources.length],
            [lang === "zh" ? "金属中心" : "Metal centers", metals.length],
            ["Evidence Level", evidenceLevels.length],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 850, marginTop: 6 }}>{value}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "MOF 记录" : "MOF Records"} subtitle={lang === "zh" ? "单个记录可展开查看结构、孔性质、吸附/电子、Eco、Catalysis 和限制字段。" : "Expand each record to inspect structure, pore, adsorption/electronic, Eco, Catalysis, and limitations fields."}>
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{item.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>{item.formula}</div>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <BasisBadge tone="info">{zhValue(item.evidenceLevel, lang)}</BasisBadge>
                  <BasisBadge tone="proxy">{item.dataStatus}</BasisBadge>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(9, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
                {field(lang === "zh" ? "金属节点" : "metal nodes", item.metal)}
                {field(lang === "zh" ? "连接体" : "linker", item.linker)}
                {field(lang === "zh" ? "孔径" : "pore size",      item.poreSizeA  === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`,      "poreSizeA",  item.fieldSources)}
                {field(lang === "zh" ? "比表面积" : "surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                {field("CO₂ uptake",  item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`,     "co2Uptake",  item.fieldSources)}
                {field("band gap",    item.bandGap   === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap   === "—" ? "—" : `${item.bandGap} eV`,            "bandGap",    item.fieldSources)}
                {field(lang === "zh" ? "稳定性" : "stability", `${zhValue(item.waterStability, lang)} / ${zhValue(item.thermalStability, lang)}`)}
                {field(lang === "zh" ? "来源" : "source", zhValue(item.source, lang))}
                {field("Evidence Level", zhValue(item.evidenceLevel, lang))}
              </div>
              <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ ...toolbarBtn(t), marginTop: 12 }}>
                {expandedId === item.id ? (lang === "zh" ? "收起详情" : "Hide details") : (lang === "zh" ? "查看详情" : "View details")}
              </button>
              {expandedId === item.id && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
                  <div style={detailBlock}>{field(lang === "zh" ? "基础结构" : "Basic structure", `${item.topology}; ${item.formula}`)}</div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "孔径" : "Pore size (Å)", item.poreSizeA === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`, "poreSizeA", item.fieldSources)}
                      {field(lang === "zh" ? "比表面积" : "Surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                      {field(lang === "zh" ? "孔体积" : "Pore volume", item.poreVolume === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreVolume || "—"} cm³/g`, "poreVolume", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field("CO₂ uptake", item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`, "co2Uptake", item.fieldSources)}
                      {field("Band gap", item.bandGap === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap === "—" ? "—" : `${item.bandGap} eV`, "bandGap", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "水稳定性" : "Water stability", zhValue(item.waterStability, lang), "waterStability", item.fieldSources)}
                      {field(lang === "zh" ? "热稳定性" : "Thermal stability", zhValue(item.thermalStability, lang), "thermalStability", item.fieldSources)}
                      {field(lang === "zh" ? "毒性关注" : "Toxicity concern", zhValue(item.toxicityConcern, lang), "toxicityConcern", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>{field(lang === "zh" ? "催化潜力线索" : "Catalysis potential", `${item.reactionClasses.join(", ") || "—"}; ${item.activeSiteHypothesis}`)}</div>
                  <div style={detailBlock}>{field(lang === "zh" ? "数据来源 / 限制" : "Data source / Limitations", `${item.source}; ${item.limitations}`)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ResultLayer>

      {results && !results.unavailable && (
        <ResultLayer number="04" title={lang === "zh" ? "当前输入记录提示" : "Current Input Note"}>
          <Callout tone="success">
            {lang === "zh"
              ? `当前输入 ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} 可在 EcoScreen、Performance 或 CatalysisLab 中作为候选解释对象；Library 只负责展示来源字段。`
              : `Current input ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} can be interpreted as a candidate in EcoScreen, Performance, or CatalysisLab; Library only exposes source fields.`}
          </Callout>
        </ResultLayer>
      )}
    </div>
  )
}
