// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchIndexPart } from "../../utils/databaseIndex/databaseIndexClient"
import { formatCount, normalizeIndexParts } from "../../utils/databaseIndex/databaseIndexFormatters"

const PAGE_SIZE = 50

function qualityMatches(row, filter) {
  if (filter === "all") return true
  const status = String(row.dataQualityStatus || "").toLowerCase()
  if (filter === "ready") return status.includes("ready")
  return status.includes(filter)
}

export function IndexPartBrowser({ manifest = {}, onOpenDetail, lang, t, isMobile }) {
  const parts = normalizeIndexParts(manifest)
  const [selectedPath, setSelectedPath] = useState("")
  const [partCache, setPartCache] = useState({})
  const [loadingPath, setLoadingPath] = useState("")
  const [qualityFilter, setQualityFilter] = useState("all")
  const [alOnly, setAlOnly] = useState(false)
  const [page, setPage] = useState(0)
  const selectedPart = selectedPath ? partCache[selectedPath]?.data : null
  const selectedError = selectedPath ? partCache[selectedPath]?.error : null

  const loadPart = async partPath => {
    setSelectedPath(partPath)
    setPage(0)
    if (partCache[partPath]?.data) return
    setLoadingPath(partPath)
    const result = await fetchIndexPart(partPath)
    setPartCache(cache => ({ ...cache, [partPath]: result }))
    setLoadingPath("")
  }

  const filteredRecords = useMemo(() => {
    const records = Array.isArray(selectedPart?.records) ? selectedPart.records : []
    return records.filter(row => qualityMatches(row, qualityFilter)).filter(row => !alOnly || row.hasAlNode || (row.metals || []).includes("Al"))
  }, [selectedPart, qualityFilter, alOnly])
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const visible = filteredRecords.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "Index Part Browser", "Index Part Browser")}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
          {text(lang, "索引分片只有在点击后才加载；每次只加载一个 part。", "Index parts load only after clicking; only one selected part is fetched at a time.")}
        </span>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {parts.map(part => (
          <button key={part.path} type="button" onClick={() => loadPart(part.path)} style={{ background: selectedPath === part.path ? t.badgeInfoBg : t.panel, border: `1px solid ${selectedPath === part.path ? t.accentText : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 9px" }}>
            {part.label}
          </button>
        ))}
      </div>
      {selectedPath ? (
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {["all", "ready", "needs_review", "rejected"].map(filter => (
              <button key={filter} type="button" onClick={() => { setQualityFilter(filter); setPage(0) }} style={{ background: qualityFilter === filter ? t.accent : t.panel, border: `1px solid ${qualityFilter === filter ? t.accent : t.border}`, borderRadius: 999, color: qualityFilter === filter ? t.buttonText || "#fff" : t.textStrong, cursor: "pointer", fontSize: 11.5, fontWeight: 900, padding: "6px 9px" }}>
                {filter}
              </button>
            ))}
            <label style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 12, gap: 6 }}>
              <input type="checkbox" checked={alOnly} onChange={event => { setAlOnly(event.target.checked); setPage(0) }} />
              {text(lang, "只看 Al-containing / hasAlNode", "Al-containing / hasAlNode only")}
            </label>
          </div>
          <StatusPill tone="proxy" t={t}>{formatCount(filteredRecords.length)} / {formatCount(selectedPart?.recordCount || selectedPart?.records?.length || 0)}</StatusPill>
        </div>
      ) : null}
      {loadingPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "正在加载选定分片...", "Loading selected part...")}</span> : null}
      {selectedError ? <span style={{ color: t.warn, fontSize: 12, fontWeight: 850 }}>{displayValue(selectedError.message)}</span> : null}
      {!selectedPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "请选择一个 index part 开始浏览。", "Select an index part to browse records.")}</span> : null}
      {visible.length ? (
        <div style={{ display: "grid", gap: 7 }}>
          {visible.map(row => (
            <article key={row.id} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.1fr) 110px 86px auto", paddingTop: 8 }}>
              <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}><ChemicalText value={displayValue(row.displayName || row.id)} /></strong>
                <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.4 }}><ChemicalText value={`${displayValue(row.sourceDatabase)} · ${displayValue(row.sourceRecordId)} · ${displayValue(row.detailRef, "detail pending")}`} /></span>
              </div>
              <StatusPill tone={String(row.dataQualityStatus).includes("ready") ? "pass" : String(row.dataQualityStatus).includes("reject") ? "fail" : "warn"} t={t}>{displayValue(row.dataQualityStatus)}</StatusPill>
              <span style={{ color: row.hasAlNode ? t.accentText : t.muted, fontSize: 12, fontWeight: 900 }}>{row.hasAlNode ? "Al node" : "no Al node"}</span>
              <button type="button" onClick={() => onOpenDetail?.(row)} disabled={!row.detailRef} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: row.detailRef ? t.accentText : t.faint, cursor: row.detailRef ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                {text(lang, "详情", "Detail")}
              </button>
            </article>
          ))}
          <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" disabled={page <= 0} onClick={() => setPage(value => Math.max(0, value - 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: page <= 0 ? t.faint : t.accentText, cursor: page <= 0 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>Prev</button>
            <span style={{ color: t.muted, fontSize: 12 }}>{page + 1} / {pageCount}</span>
            <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: page + 1 >= pageCount ? t.faint : t.accentText, cursor: page + 1 >= pageCount ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>Next</button>
          </div>
        </div>
      ) : selectedPath && !loadingPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "当前筛选下没有记录。", "No records in the current filter.")}</span> : null}
    </section>
  )
}
