// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchIndexPart } from "../../utils/databaseIndex/databaseIndexClient"
import { dbFallback, dbStatusLabel, dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import {
  descriptorCompletenessPercent,
  extractMetals,
  formatCount,
  formatPercentValue,
  matchesDatabaseIndexFilters,
  normalizeIndexParts,
  provenanceCompletenessPercent,
  qualityTone,
  sortDatabaseIndexRecords,
  summarizeIndexPartRecords,
} from "../../utils/databaseIndex/databaseIndexFormatters"

const PAGE_SIZE = 20

const SORT_OPTIONS = [
  ["descriptorCompleteness", "descriptor completeness", "descriptor completeness"],
  ["provenanceCompleteness", "provenance completeness", "provenance completeness"],
  ["qualityStatus", "quality status", "quality status"],
]

function searchMatches(row, searchText) {
  const query = String(searchText || "").trim().toLowerCase()
  if (!query) return true
  const haystack = [
    row.id,
    row.frameworkId,
    row.sourceDatabase,
    row.sourceRecordId,
    row.displayName,
    ...(extractMetals(row) || []),
  ].map(value => displayValue(value, "")).join(" ").toLowerCase()
  return haystack.includes(query)
}

function Stat({ label, value, t }) {
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
      <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={displayValue(value)} /></strong>
    </article>
  )
}

export function IndexPartBrowser({ manifest = {}, filters = {}, onOpenDetail, onAddCompare, onSelectedPartRecordsChange, compareCount = 0, lang, t, isMobile }) {
  const parts = normalizeIndexParts(manifest)
  const [selectedPath, setSelectedPath] = useState("")
  const [partCache, setPartCache] = useState({})
  const [loadingPath, setLoadingPath] = useState("")
  const [searchText, setSearchText] = useState("")
  const [sortKey, setSortKey] = useState("descriptorCompleteness")
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

  useEffect(() => {
    setPage(0)
  }, [selectedPath, filters, searchText, sortKey])

  const selectedRecords = useMemo(() => Array.isArray(selectedPart?.records) ? selectedPart.records : [], [selectedPart])
  const stats = useMemo(() => summarizeIndexPartRecords(selectedRecords), [selectedRecords])
  const filteredRecords = useMemo(() => {
    return sortDatabaseIndexRecords(selectedRecords.filter(row => matchesDatabaseIndexFilters(row, filters)).filter(row => searchMatches(row, searchText)), sortKey)
  }, [selectedRecords, filters, searchText, sortKey])
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const visible = filteredRecords.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    onSelectedPartRecordsChange?.({
      path: selectedPath,
      records: selectedRecords,
      filteredRecords,
      recordCount: selectedRecords.length,
    })
  }, [filteredRecords, onSelectedPartRecordsChange, selectedPath, selectedRecords])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{dbText(lang, "indexPartBrowser")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            {text(lang, "索引分片只有在点击后才加载；每次只加载一个 part。", "Index parts load only after clicking; only one selected part is fetched at a time.")}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusPill tone="proxy" t={t}>{dbText(lang, "selectedIndexPartOnly")}</StatusPill>
          <StatusPill tone="warn" t={t}>{dbText(lang, "detailOnDemand")}</StatusPill>
        </div>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {parts.map(part => (
          <button key={part.path} type="button" onClick={() => loadPart(part.path)} style={{ background: selectedPath === part.path ? t.badgeInfoBg : t.panel, border: `1px solid ${selectedPath === part.path ? t.accentText : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 9px" }}>
            {part.label}
          </button>
        ))}
      </div>
      {selectedPath ? (
        <div style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))" }}>
            <Stat label={text(lang, "记录数", "record count")} value={formatCount(stats.recordCount)} t={t} />
            <Stat label={text(lang, "可评分", "ready")} value={formatCount(stats.ready)} t={t} />
            <Stat label={text(lang, "需复核", "needs review")} value={formatCount(stats.needsReview)} t={t} />
            <Stat label={text(lang, "已拒绝", "rejected")} value={formatCount(stats.rejected)} t={t} />
            <Stat label={text(lang, "描述符覆盖摘要", "descriptor coverage summary")} value={formatPercentValue(stats.descriptorPercent)} t={t} />
            <Stat label={text(lang, "来源覆盖摘要", "provenance coverage summary")} value={formatPercentValue(stats.provenancePercent)} t={t} />
          </div>
          <div style={{ alignItems: "end", display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 190px auto" }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "搜索", "Search")}</span>
              <input aria-label="Search index part records" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={text(lang, "record id / display name / source database / metal node", "record id / display name / source database / metal node")} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "6px 8px" }} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "排序", "Sort")}</span>
              <select aria-label="Sort index part records" value={sortKey} onChange={event => setSortKey(event.target.value)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, fontWeight: 850, minHeight: 34, padding: "6px 8px" }}>
                {SORT_OPTIONS.map(([value, en, zh]) => <option key={value} value={value}>{text(lang, zh, en)}</option>)}
              </select>
            </label>
            <StatusPill tone="proxy" t={t}>{`${formatCount(filteredRecords.length)} / ${formatCount(selectedPart?.recordCount || selectedPart?.records?.length || 0)}`}</StatusPill>
          </div>
        </div>
      ) : null}
      {loadingPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "正在加载选定分片...", "Loading selected part...")}</span> : null}
      {selectedError ? <span style={{ color: t.warn, fontSize: 12, fontWeight: 850 }}>{displayValue(selectedError.message)}</span> : null}
      {!selectedPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "尚未选择索引分片。", "Select an index part to browse records.")}</span> : null}
      {visible.length ? (
        <div style={{ display: "grid", gap: 7 }}>
          {visible.map(row => (
            <article key={row.id} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.1fr) 110px 130px 100px auto", paddingTop: 8 }}>
              <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}><ChemicalText value={displayValue(row.displayName || row.id)} /></strong>
                <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.4 }}><ChemicalText value={`${displayValue(row.sourceDatabase)} · ${displayValue(row.sourceRecordId)} · ${displayValue(row.detailRef, dbFallback(lang))}`} /></span>
              </div>
              <StatusPill tone={qualityTone(row.dataQualityStatus)} t={t}>{dbStatusLabel(row.dataQualityStatus, lang)}</StatusPill>
              <span style={{ color: row.hasAlNode || extractMetals(row).includes("Al") ? t.accentText : t.muted, fontSize: 12, fontWeight: 900 }}>{extractMetals(row).length ? extractMetals(row).join(", ") : text(lang, "金属待核验", "metal pending")}</span>
              <span style={{ color: t.muted, fontSize: 11.7, fontWeight: 850 }}>{`D ${formatPercentValue(descriptorCompletenessPercent(row))} · P ${formatPercentValue(provenanceCompletenessPercent(row))}`}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => onAddCompare?.(row)} disabled={compareCount >= 3} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: compareCount >= 3 ? t.faint : t.accentText, cursor: compareCount >= 3 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                  {text(lang, "对比", "Compare")}
                </button>
                <button type="button" onClick={() => onOpenDetail?.(row)} disabled={!row.detailRef} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: row.detailRef ? t.accentText : t.faint, cursor: row.detailRef ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
                  {text(lang, "详情", "Detail")}
                </button>
              </div>
            </article>
          ))}
          <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" disabled={page <= 0} onClick={() => setPage(value => Math.max(0, value - 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: page <= 0 ? t.faint : t.accentText, cursor: page <= 0 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>{text(lang, "上一页", "Prev")}</button>
            <span style={{ color: t.muted, fontSize: 12 }}>{page + 1} / {pageCount}</span>
            <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: page + 1 >= pageCount ? t.faint : t.accentText, cursor: page + 1 >= pageCount ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>{text(lang, "下一页", "Next")}</button>
          </div>
        </div>
      ) : selectedPath && !loadingPath ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "当前筛选下没有记录。", "No records in the current filter.")}</span> : null}
    </section>
  )
}
