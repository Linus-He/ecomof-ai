// @ts-nocheck
import { useMemo } from "react"
import { useLang, useT, useViewport } from "../../contexts"
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function safeText(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  return String(value).replace(/_/g, " ")
}

function isAvailable(value) {
  if (value === null || value === undefined || value === "") return false
  const normalized = String(value).toLowerCase()
  return normalized !== "pending" && normalized !== "null" && normalized !== "undefined" && normalized !== "nan"
}

function isPendingCandidate(candidate) {
  return String(candidate?.organicAcidRelevance?.scoreStatus || candidate?.dataStatus || "").toLowerCase().includes("pending")
}

function candidateName(candidate) {
  return candidate?.displayName || candidate?.commonName || candidate?.name || candidate?.id || "MOF source record"
}

function sourceDatabase(candidate) {
  return candidate?.sourceDatabase || candidate?.provenance?.sourceDatabase || candidate?.provenance?.database || "pending"
}

function availableDescriptors(candidate, lang) {
  const rows = [
    ["surfaceArea", text(lang, "比表面积", "surfaceArea")],
    ["poreSizeA", text(lang, "孔径", "poreSizeA")],
    ["poreVolume", text(lang, "孔体积", "poreVolume")],
    ["bandGap", text(lang, "带隙", "bandGap")],
    ["density", text(lang, "密度", "density")],
  ]
  const labels = rows.filter(([key]) => isAvailable(candidate?.[key])).map(([, label]) => label)
  return labels.length ? labels : [text(lang, "结构字段待整理", "structural fields pending")]
}

function missingEvidence(candidate, lang) {
  const source = sourceDatabase(candidate).toLowerCase()
  if (source.includes("qmof")) {
    return [text(lang, "几何描述符", "geometry"), text(lang, "水稳定性", "water stability"), "HCOO- / HCO3- evidence"]
  }
  return [text(lang, "水稳定性", "water stability"), "HCOO- / HCO3- evidence", text(lang, "产物分布", "product distribution")]
}

function nextTask(candidate, lang) {
  const source = sourceDatabase(candidate).toLowerCase()
  if (source.includes("qmof")) {
    return text(lang, "作为电子描述符种子保留；不要推断甲酸路径相关性。", "Use as an electronic descriptor seed; do not infer formic-acid relevance.")
  }
  return text(lang, "进行文献整理，或标记为 structural-only seed。", "Run literature curation or mark as a structural-only seed.")
}

function nameStatus(candidate, lang) {
  if (candidate?.displayNameType === "recognized_mof_name") {
    return text(lang, "已识别通用名", "recognized common name")
  }
  if (candidate?.displayNameType === "explicit_name") {
    return text(lang, "已整理名称", "curated name")
  }
  if (candidate?.displayNameType === "source_record_id_only") {
    return text(lang, "待解析通用名", "pending common-name resolution")
  }
  if (candidate?.nameCuration?.needsManualNameCuration) {
    return text(lang, "需要人工整理", "manual name curation needed")
  }
  return text(lang, "名称状态待整理", "name status pending")
}

export function OrganicAcidCurationQueue({
  candidates = [],
  lang: forcedLang,
  t: tone,
  isMobile: forcedMobile,
}) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile

  const grouped = useMemo(() => {
    const rows = (Array.isArray(candidates) ? candidates : []).filter(isPendingCandidate)
    return rows.reduce((acc, candidate) => {
      const source = sourceDatabase(candidate)
      if (!acc[source]) acc[source] = []
      acc[source].push(candidate)
      return acc
    }, {})
  }, [candidates])

  const sources = Object.keys(grouped)

  return (
    <section id="organic-acid-curation-queue" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 12 : 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900 }}>
          Organic Acid Curation Queue
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 23, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "有机酸待整理候选物队列", "Organic Acid Curation Queue")}
        </h2>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, maxWidth: 920 }}>
          {text(
            lang,
            "把 pending records 转化为可执行的整理任务，不给待整理候选物赋予有机酸活性结论。",
            "Pending records are converted into actionable curation tasks without assigning organic-acid activity."
          )}
        </div>
      </div>

      {sources.length ? sources.map(source => (
        <section key={source} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{safeText(source)}</strong>
            <span style={{ color: t.faint, fontSize: 11 }}>{grouped[source].length} records</span>
          </div>
          <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
            {grouped[source].slice(0, 8).map(candidate => (
              <article key={candidate.id || candidate.name} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
                <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.3, overflowWrap: "anywhere" }}>{safeText(candidateName(candidate))}</strong>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  {text(lang, "可用", "Available")}: {availableDescriptors(candidate, lang).join(", ")}
                </span>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  {text(lang, "缺口", "Missing")}: <ChemicalText value={missingEvidence(candidate, lang).join(", ")} />
                </span>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  {text(lang, "名称状态", "Name status")}: {nameStatus(candidate, lang)}
                </span>
                <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
                  {text(lang, "下一步", "Next")}: {nextTask(candidate, lang)}
                </span>
              </article>
            ))}
          </div>
        </section>
      )) : (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 12 }}>
          {text(lang, "当前没有 pending 候选物。", "No pending candidates in the current dataset.")}
        </div>
      )}
    </section>
  )
}
