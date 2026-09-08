// @ts-nocheck
import { useLang } from "../../contexts"
import { interfaceText } from "../../utils/interfaceLocale"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { useT } from "../../shared"
import { fetchDataJson, getCsdMofPublicCatalog } from "../../services/dataService"
import { searchMaterials } from "../../utils/unifiedMaterialSearch"

const Structure = lazy(() => import("../mof-structure/MofStructureWorkbench").then(m => ({ default: m.MofStructureWorkbench })))

function InlineStructure({ record, lang }) {
  const { locale } = useLang()
  const l = (en, zh) => interfaceText(locale, en, zh)
  const t = useT()
  const [catalog, setCatalog] = useState(null)
  const [status, setStatus] = useState("loading")
  useEffect(() => {
    let active = true
    getCsdMofPublicCatalog({ throwOnError: true }).then(data => { if (active) { setCatalog(data); setStatus("ready") } }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])
  if (status === "loading") return <p role="status">{l("Loading crystal structure…", "正在加载晶体结构…")}</p>
  // Only permit the exact refcode: never render an unrelated default structure.
  const match = catalog?.structures?.find(item => item.refcode === record.csdRefcode)
  if (!match) return <p>{l("No loadable 3D structure for this record. Consult the source database for its CIF.", "此记录暂未提供可加载的三维结构，请通过下方数据库来源查阅原始 CIF。")}</p>
  return <Suspense fallback={<p>Loading…</p>}><Structure item={record} publicCatalog={{ ...catalog, structures: [match] }} catalogStatus="ready" lang={lang} t={t} isMobile={window.innerWidth < 720} /></Suspense>
}

export function MaterialSearchResults({ query, lang }) {
  const { locale } = useLang()
  const l = (en, zh = en) => interfaceText(locale, en, zh)
  const zh = lang === "zh"
  const [records, setRecords] = useState([])
  const [aliases, setAliases] = useState([])
  const [status, setStatus] = useState("loading")
  const [structureId, setStructureId] = useState(null)
  const [limit, setLimit] = useState(4)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      fetchDataJson("core_mof_2024/cr_search_index.json", [], { throwOnError: true }),
      fetchDataJson("mof_name_aliases.json", [], { throwOnError: true }),
      fetchDataJson("fair_mofs_property_index_v1.json", { records: [] }, { throwOnError: true }),
    ]).then(([rows, names, fair]) => { if (active) {
      const extra = fair.records.map(r => ({ id:r.id, name:r.csdRefcode, displayName:r.csdRefcode, csdRefcode:r.csdRefcode, aliases:r.aliases, doi:r.doi, metalNode:r.inferredMetals?.join(", "), topology:r.physicalProperties?.topology, pldA:r.physicalProperties?.pldA, lcdA:r.physicalProperties?.lcdA, voidFraction:r.physicalProperties?.voidFraction, volumetricSurfaceArea:r.physicalProperties?.asaM2Cm3, sourceDatabase:"FAIR-MOFs", sourceUrl:"https://zenodo.org/records/13254307", structureVariant:"FAIR" }))
      setRecords([...rows, ...extra]); setAliases(names); setStatus("ready")
    } }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [retry])
  useEffect(() => { setLimit(4); setStructureId(null) }, [query])
  const matches = useMemo(() => searchMaterials(records, aliases, query), [records, aliases, query])
  const value = (v, unit = "") => v === null || v === undefined || v === "" ? (l("Not provided", "未提供")) : `${typeof v === "number" ? Number(v.toFixed(3)) : v}${unit}`
  return <section className="material-search-results" aria-label={l("Material search results", "材料搜索结果")}>
    {status === "loading" && <p role="status">{l("Loading material index…", "正在检索材料数据…")}</p>}
    {status === "error" && <p role="alert">{l("Material index could not load.", "材料索引加载失败。")}<button onClick={() => setRetry(n => n + 1)}>{l("Retry", "重试")}</button></p>}
    {status === "ready" && <p className="search-result-count">{l("Material search results", "材料搜索结果")} · {matches.length}</p>}
    {matches.slice(0, limit).map(({ record }) => <article key={record.id} className="material-search-record">
      <h3>{record.displayName || record.name}<span>{record.csdRefcode} · {record.structureVariant}</span></h3>
      <dl>{[
        [l("Surface area", "比表面积"), value(record.surfaceArea, " m²/g")],
        [l("Pore volume", "孔体积"), value(record.poreVolume, " cm³/g")],
        [l("Density", "密度"), value(record.density, " g/cm³")],
        ["PLD / LCD", `${value(record.pldA)} / ${value(record.lcdA)} Å`],
        [l("Void fraction", "孔隙率"), value(record.voidFraction)],
        [l("Metal / topology", "金属 / 拓扑"), `${value(record.metalNode)} / ${value(record.topology)}`],
        ...(record.volumetricSurfaceArea !== undefined ? [[l("Volumetric surface area", "体积比表面积"), value(record.volumetricSurfaceArea, " m²/cm³")]] : []),
      ].map(([label, val]) => <div key={label}><dt>{label}</dt><dd>{val}</dd></div>)}</dl>
      <p className="material-provenance">{record.sourceDatabase} · {l("Curated structural descriptors; values can vary across records with the same name.", "整理后的结构描述符；同名不同记录的数值可能不同。")}</p>
      <div className="material-search-actions">
        {record.doi && <a href={`https://doi.org/${record.doi}`} target="_blank" rel="noreferrer">{l("Paper", "文献")} · {record.doi} ↗</a>}
        <a href={record.sourceUrl} target="_blank" rel="noreferrer">{l("Source / CIF", "数据库来源 / CIF")} ↗</a>
        <button aria-expanded={structureId === record.id} onClick={() => setStructureId(id => id === record.id ? null : record.id)}>{l("3D structure", "空间结构")}</button>
        <a href={`#mof-record-${record.structureVariant === "FAIR" ? record.csdRefcode : record.id}`}>{l("Full record", "完整记录")} ↗</a>
      </div>
      {structureId === record.id && <InlineStructure key={record.id} record={record} lang={lang} />}
    </article>)}
    {matches.length > limit && <button className="search-more" onClick={() => setLimit(n => n + 8)}>{l("More materials", "显示更多材料")}</button>}
  </section>
}
