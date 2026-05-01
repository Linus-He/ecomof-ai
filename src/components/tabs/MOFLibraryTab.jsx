import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  LITERATURE_DB, fetchDataJson, buildDatabaseRecords, downloadTextFile, toolbarBtn,
  BasisBadge, PageHeader, ResultLayer, Callout,
} from "../../shared"

export function MOFLibraryTab({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const [query, setQuery] = useState("")
  const [metal, setMetal] = useState("all")
  const [source, setSource] = useState("all")
  const [oms, setOms] = useState("all")
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    Promise.all([fetchDataJson("mof_structures.json"), fetchDataJson("adsorption_labels.json")])
      .then(([structures, labels]) => {
        if (!active) return
        setStructureRows(structures)
        setLabelRows(labels)
        setStatus("loaded")
      })
      .catch(() => {
        if (!active) return
        setStatus("fallback")
      })
    return () => { active = false }
  }, [])

  const records = useMemo(() => {
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return loaded.length ? loaded : LITERATURE_DB
  }, [structureRows, labelRows])

  const metals = useMemo(() => Array.from(new Set(records.map(item => item.metal).filter(Boolean))).sort(), [records])
  const sources = useMemo(() => Array.from(new Set(records.map(item => item.sourceDatabase || item.sourceType || "local seed"))).sort(), [records])
  const displaySource = (value) => {
    if (lang !== "zh") return value || "local seed"
    if (!value || value === "local seed") return "本地种子库"
    if (value === "seed") return "种子数据"
    return value
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter(item => !q || [item.name, item.metal, item.linker, item.topology, item.sourceDatabase, item.sourceType].some(value => String(value || "").toLowerCase().includes(q)))
      .filter(item => metal === "all" || item.metal === metal)
      .filter(item => source === "all" || (item.sourceDatabase || item.sourceType || "local seed") === source)
      .filter(item => oms === "all" || Boolean(item.oms) === (oms === "yes"))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [records, query, metal, source, oms])

  const exportCsv = () => {
    const header = ["MOF name", "Metal", "Linker", "Topology", "PLD A", "LCD A", "BET m2/g", "Pore volume cm3/g", "OMS", "Structure source", "Descriptor method", "Label source", "Quality flag", "DOI or URL", "License note"]
    const rows = filtered.map(item => [
      item.name, item.metal, item.linker, item.topology || "", item.pd || "", item.lcd || "", item.bet || "", item.pv || "", item.oms ? "yes" : "no",
      item.sourceDatabase || "local seed", item.descriptorMethod || "", item.labelSource || item.sourceType || "", item.qualityFlag || "", item.doi || "", item.licenseNote || "",
    ])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    downloadTextFile("ecomof_mof_library.csv", csv, "text/csv")
  }

  const controlStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 11px", color: t.text, fontSize: 12, width: "100%" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "MOF 库" : "MOF Library"}
        subtitle={lang === "zh"
          ? "浏览所有 MOF 基础数据、来源字段和标签覆盖情况。该页面展示数据库记录，不直接把数据库数值等同于科研结论。"
          : "Browse MOF baseline data, source fields, and label coverage. This page displays database records; it does not turn database values into scientific conclusions."}
        meta={lang === "zh" ? "搜索 · 基础筛选 · 数据来源 · 记录表" : "Search · basic filters · source fields · records"}
        action={<BasisBadge tone={status === "loaded" ? "calc" : "proxy"}>{status === "loaded" ? "public/data" : (lang === "zh" ? "种子数据" : "fallback seed")}</BasisBadge>}
      />

      <Callout tone="info">
        {lang === "zh"
          ? "Library 是证据入口，不是结果页。结构库、描述符、吸附标签和 LCA 清单应分开审计。"
          : "Library is an evidence entry point, not a result page. Structure sources, descriptors, adsorption labels, and LCA inventory should be audited separately."}
      </Callout>

      <ResultLayer number="01" title={lang === "zh" ? "搜索与基础筛选" : "Search and Basic Filters"}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(260px, 1.4fr) repeat(3, minmax(150px, 0.7fr)) auto", gap: 10, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "搜索" : "Search"}
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === "zh" ? "按 MOF、金属、连接体、来源搜索..." : "Search MOF, metal, linker, source..."} style={controlStyle} />
          </label>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "金属" : "Metal"}
            <select value={metal} onChange={e => setMetal(e.target.value)} style={controlStyle}>
              <option value="all">{lang === "zh" ? "全部" : "all"}</option>
              {metals.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            {lang === "zh" ? "数据来源" : "Source"}
            <select value={source} onChange={e => setSource(e.target.value)} style={controlStyle}>
              <option value="all">{lang === "zh" ? "全部来源" : "all sources"}</option>
              {sources.map(item => <option key={item} value={item}>{displaySource(item)}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase" }}>
            OMS
            <select value={oms} onChange={e => setOms(e.target.value)} style={controlStyle}>
              <option value="all">{lang === "zh" ? "全部" : "all"}</option>
              <option value="yes">{lang === "zh" ? "有开放金属位点" : "has OMS"}</option>
              <option value="no">{lang === "zh" ? "无 / 未标注" : "no / unmarked"}</option>
            </select>
          </label>
          <button type="button" onClick={exportCsv} style={{ ...toolbarBtn(t), height: 38 }}>↓ CSV</button>
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "基础数据概览" : "Baseline Data Overview"} subtitle={lang === "zh" ? "卡片展示基础字段和来源，不作最终科研判断。" : "Cards show baseline fields and sources without final scientific judgment."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "当前显示" : "Showing", `${filtered.length} / ${records.length}`],
            [lang === "zh" ? "结构来源" : "Structure sources", sources.length],
            [lang === "zh" ? "金属类型" : "Metal types", metals.length],
            [lang === "zh" ? "OMS 标注" : "OMS marked", records.filter(item => item.oms).length],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 850, marginTop: 6 }}>{value}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "MOF 记录" : "MOF Records"} subtitle={lang === "zh" ? "数据来源字段必须保留在表格中，便于后续审计。" : "Source fields are retained in the table for later audit."}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {(lang === "zh"
                    ? ["MOF 名称", "金属", "连接体", "拓扑", "PLD/LCD", "BET/孔体积", "OMS", "结构来源", "描述符方法", "标签来源", "质量标记"]
                    : ["MOF name", "Metal", "Linker", "Topology", "PLD/LCD", "BET/PV", "OMS", "Structure source", "Descriptor method", "Label source", "Quality flag"]).map(head => (
                    <th key={head} style={{ padding: "10px 12px", color: t.subtle, fontSize: 11, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={`${item.name}-${index}`} style={{ background: index % 2 === 0 ? "transparent" : t.surface, borderBottom: `1px solid ${t.divider}` }}>
                    <td style={{ padding: "10px 12px", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", color: t.muted, fontSize: 12 }}>{item.metal}</td>
                    <td style={{ padding: "10px 12px", color: t.muted, fontSize: 12 }}>{item.linker}</td>
                    <td style={{ padding: "10px 12px", color: t.muted, fontSize: 12 }}>{item.topology || "—"}</td>
                    <td style={{ padding: "10px 12px", color: t.muted, fontSize: 12 }}>{item.pd || "—"} / {item.lcd || "—"}</td>
                    <td style={{ padding: "10px 12px", color: t.muted, fontSize: 12 }}>{Number(item.bet || 0).toLocaleString()} / {item.pv || "—"}</td>
                    <td style={{ padding: "10px 12px" }}><BasisBadge tone={item.oms ? "info" : "proxy"}>{item.oms ? "OMS" : "—"}</BasisBadge></td>
                    <td style={{ padding: "10px 12px", color: t.subtle, fontSize: 11 }}>{displaySource(item.sourceDatabase)}<br />{item.sourceRecord || ""}</td>
                    <td style={{ padding: "10px 12px", color: t.subtle, fontSize: 11 }}>{item.descriptorMethod || "—"}</td>
                    <td style={{ padding: "10px 12px", color: t.subtle, fontSize: 11 }}>{item.labelSource || item.sourceType || "—"}<br />{item.doi || ""}</td>
                    <td style={{ padding: "10px 12px", color: t.warn, fontSize: 11 }}>{item.qualityFlag || "screening_seed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${t.border}`, color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
            {lang === "zh"
              ? "说明：吸附量、选择性或描述符字段是记录属性；科研结论需要任务规则、误差评估和实验验证。"
              : "Note: uptake, selectivity, or descriptor fields are record attributes; scientific conclusions need task rules, error assessment, and experimental validation."}
          </div>
        </div>
      </ResultLayer>

      {results && !results.unavailable && (
        <ResultLayer number="04" title={lang === "zh" ? "当前输入记录提示" : "Current Input Note"}>
          <Callout tone="success">
            {lang === "zh"
              ? `当前输入 ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} 可在 EcoScreen 或 CatalysisLab 中作为候选解释对象；Library 只负责展示来源字段。`
              : `Current input ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} can be interpreted as a candidate in EcoScreen or CatalysisLab; Library only exposes source fields.`}
          </Callout>
        </ResultLayer>
      )}
    </div>
  )
}
