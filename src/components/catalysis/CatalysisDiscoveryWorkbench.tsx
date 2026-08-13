// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  ArrowSquareOut,
  CheckCircle,
  FunnelSimple,
  MagnifyingGlass,
  Robot,
  ShieldWarning,
} from "@phosphor-icons/react"
import {
  BasisBadge,
  getCatalysisCandidateQueueV1,
  getCatalysisDiscoveryBatchesV1,
  getCatalysisExtractionSuggestionsV1,
} from "../../shared"
import {
  buildCatalysisDiscoveryView,
  catalysisCandidateGate,
  filterCatalysisDiscoveryCandidates,
  validateCatalysisSuggestionIsolation,
} from "../../utils/catalysisDiscoveryP2"
import { localizeCatalysisText } from "../../utils/catalysisDisplayText"

const FIELD_LABELS = {
  "reaction.substrate": ["底物", "Substrate"],
  "reaction.targetProduct": ["目标产物", "Target product"],
  "catalystState.stateType": ["催化剂状态", "Catalyst state"],
  "reaction.mode": ["反应模式", "Reaction mode"],
}

const CHECKS = [
  ["publisher-or-repository-fulltext", "出版方或机构全文", "Publisher or repository full text"],
  ["primary-experimental-document-type", "原始实验论文类型", "Primary experimental document"],
  ["claim-level-source-location", "声明级图表或章节位置", "Claim-level source location"],
  ["condition-tuple", "完整条件组合", "Complete condition tuple"],
  ["catalyst-state-and-active-phase", "催化剂状态与活性相", "Catalyst state and active phase"],
  ["exact-structure-identity", "精确结构身份", "Exact structure identity"],
  ["reuse-license", "数据再利用许可", "Reuse license"],
]

function Funnel({ summary, t, zh, isMobile }) {
  const items = [
    [zh ? "双来源检索命中" : "Two-source hits", summary.rawHitCount || 0, t.info],
    [zh ? "去重后 DOI" : "Unique DOIs", summary.uniqueDoiCount || 0, t.violet],
    [zh ? "待全文核对" : "Full-text queue", summary.candidateQueueCount || 0, t.accent],
    [zh ? "已有正式记录" : "Formal library", summary.formalLibrarySourceCount || 0, t.success],
    [zh ? "未经人工核验直接入库" : "Auto-promoted", summary.automaticPromotionCount || 0, t.warn],
  ]
  const max = Math.max(...items.map(([, value]) => Number(value || 0)), 1)
  return (
    <div data-testid="catalysis-discovery-funnel" style={{ borderBottom: `1px solid ${t.border}`, borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
      {items.map(([label, value, color], index) => (
        <div key={label} style={{ boxShadow: !isMobile && index ? `-1px 0 0 ${t.border}` : "none", display: "grid", gap: 6, padding: "10px 11px" }}>
          <div style={{ alignItems: "baseline", display: "flex", gap: 6, justifyContent: "space-between" }}>
            <span style={{ color: t.muted, fontSize: 9.7 }}>{label}</span>
            <strong style={{ color, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
          </div>
          <span aria-hidden style={{ background: t.surface, display: "block", height: 3, overflow: "hidden" }}><span style={{ background: color, display: "block", height: "100%", width: `${Math.max((Number(value || 0) / max) * 100, value ? 4 : 0)}%` }} /></span>
        </div>
      ))}
    </div>
  )
}

function FamilyTabs({ families, active, onChange, t, zh }) {
  return (
    <div aria-label={zh ? "反应家族筛选" : "Reaction family filter"} role="tablist" style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 3 }}>
      <button onClick={() => onChange("all")} role="tab" aria-selected={active === "all"} style={{ background: active === "all" ? t.accentSoft : t.surface, border: `1px solid ${active === "all" ? t.accent : t.border}`, borderRadius: 6, color: active === "all" ? t.accentText : t.muted, cursor: "pointer", flex: "0 0 auto", fontSize: 10, fontWeight: 800, minHeight: 32, padding: "6px 9px" }}>{zh ? "全部候选" : "All candidates"}</button>
      {families.map(family => (
        <button key={family.id} onClick={() => onChange(family.id)} role="tab" aria-selected={active === family.id} style={{ background: active === family.id ? t.accentSoft : t.surface, border: `1px solid ${active === family.id ? t.accent : t.border}`, borderRadius: 6, color: active === family.id ? t.accentText : t.muted, cursor: "pointer", flex: "0 0 auto", fontSize: 10, fontWeight: 800, minHeight: 32, padding: "6px 9px" }}>
          {zh ? family.titleZh.replace(/^CO2 电还原制/, "") : family.titleEn.replace(/^CO2 electroreduction to /, "")} · {family.queuedCandidateCount}
        </button>
      ))}
    </div>
  )
}

function CandidateList({ candidates, selectedId, onSelect, t, zh }) {
  return (
    <div data-testid="catalysis-discovery-candidate-list" style={{ border: `1px solid ${t.border}`, display: "grid", maxHeight: 470, overflowY: "auto" }}>
      {candidates.map(candidate => {
        const selected = candidate.id === selectedId
        return (
          <button key={candidate.id} onClick={() => onSelect(candidate.id)} style={{ background: selected ? t.accentSoft : "transparent", border: 0, borderBottom: `1px solid ${t.divider}`, color: t.text, cursor: "pointer", display: "grid", gap: 5, padding: "10px 11px", textAlign: "left", width: "100%" }}>
            <span style={{ color: t.textStrong, fontSize: 11.2, fontWeight: 800, lineHeight: 1.45 }}>{localizeCatalysisText(candidate.title, zh)}</span>
            {zh ? <span style={{ color: t.subtle, fontSize: 9.3, lineHeight: 1.4 }}>{candidate.title}</span> : null}
            <span style={{ alignItems: "center", color: t.muted, display: "flex", flexWrap: "wrap", fontSize: 9.5, gap: 6 }}>
              <span>{candidate.year || "-"}</span><span>{candidate.journal || "-"}</span><span style={{ color: t.accentText }}>{candidate.doi}</span>
            </span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <BasisBadge tone="info">DOI {candidate.doiVerification?.metadataMatch?.status === "matched" ? (zh ? "题录已匹配" : "matched") : (zh ? "题录待核对" : "pending")}</BasisBadge>
              <BasisBadge tone="warn">{zh ? "全文待核对" : "full text pending"}</BasisBadge>
              <BasisBadge tone="proxy">{zh ? `题名筛选分：${candidate.relevanceScore}` : `relevance ${candidate.relevanceScore}`}</BasisBadge>
            </span>
          </button>
        )
      })}
      {!candidates.length ? <span style={{ color: t.muted, fontSize: 10.5, padding: 14 }}>{zh ? "当前反应类别中没有题名与研究范围相符的候选文献。" : "No candidate passes the strict title gate for this family."}</span> : null}
    </div>
  )
}

function CandidateInspector({ candidate, t, zh }) {
  if (!candidate) return null
  const gate = catalysisCandidateGate(candidate)
  const suggestion = candidate.suggestion
  const fields = suggestion?.suggestedFields || []
  return (
    <div data-testid="catalysis-discovery-inspector" style={{ border: `1px solid ${t.border}`, display: "grid", minWidth: 0 }}>
      <header style={{ display: "grid", gap: 7, padding: "11px 12px" }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{zh ? "候选文献核对状态" : "Candidate evidence check"}</strong>
          <a href={candidate.doiUrl} rel="noreferrer" target="_blank" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10, gap: 4, overflowWrap: "anywhere", textDecoration: "none" }}>{candidate.doi}<ArrowSquareOut size={12} /></a>
        </div>
        <p style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{localizeCatalysisText(candidate.title, zh)}</p>
        {zh ? <p style={{ color: t.subtle, fontSize: 9.5, lineHeight: 1.45, margin: 0 }}>{candidate.title}</p> : null}
        <div role="status" style={{ background: gate.doiMatched ? t.badgeCalcBg : t.badgeWarnBg, border: `1px solid ${gate.doiMatched ? t.success : t.warn}`, color: t.muted, fontSize: 10.2, lineHeight: 1.5, padding: "7px 9px" }}>{zh ? gate.reasonZh : gate.reasonEn}</div>
        {candidate.manualReview?.noteZh ? <div style={{ color: t.muted, fontSize: 10, lineHeight: 1.45 }}>{zh ? candidate.manualReview.noteZh : candidate.manualReview.noteEn}</div> : null}
      </header>
      <section style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, padding: "10px 12px" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}><Robot color={t.violet} size={16} weight="fill" /><strong style={{ color: t.textStrong, fontSize: 11.5 }}>{zh ? "题名初步识别" : "Machine-assisted field suggestions"}</strong><BasisBadge tone="warn">{zh ? "待全文核对" : "unverified"}</BasisBadge></div>
        <p style={{ color: t.muted, fontSize: 9.8, lineHeight: 1.45, margin: 0 }}>{zh ? "以下内容仅依据题名中的明确术语初步归类，用于安排全文核对；核对完成前不写入正式记录。" : "Generated only from bibliographic title signals; it cannot write to the formal library or become verified automatically."}</p>
        <div style={{ display: "grid" }}>
          {fields.map(field => <div key={field.field} style={{ alignItems: "start", borderTop: `1px solid ${t.divider}`, display: "grid", gap: 5, gridTemplateColumns: "minmax(90px, .7fr) minmax(0, 1fr) auto", padding: "7px 0" }}><span style={{ color: t.subtle, fontSize: 9.5 }}>{FIELD_LABELS[field.field]?.[zh ? 0 : 1] || field.field}</span><strong style={{ color: t.textStrong, fontSize: 10.5, overflowWrap: "anywhere" }}>{localizeCatalysisText(field.value || (zh ? "未识别" : "Not suggested"), zh)}</strong><BasisBadge tone="proxy">{zh ? `把握度：${localizeCatalysisText(field.confidence, true)}` : field.confidence}</BasisBadge></div>)}
        </div>
      </section>
      <section style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 7, padding: "10px 12px" }}>
        <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{zh ? "写入正式记录前须核对" : "Human admission checks"}</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 5 }}>
          {CHECKS.map(([id, labelZh, labelEn]) => <div key={id} style={{ alignItems: "center", color: id === "publisher-or-repository-fulltext" ? t.warn : t.muted, display: "flex", fontSize: 9.5, gap: 5, lineHeight: 1.35 }}><ShieldWarning size={12} weight="fill" />{zh ? labelZh : labelEn}</div>)}
        </div>
      </section>
    </div>
  )
}

export function CatalysisDiscoveryWorkbench({ queueDataset: queueProp = null, suggestionDataset: suggestionsProp = null, batchDataset: batchProp = null, t, lang = "zh", isMobile = false }) {
  const zh = lang === "zh"
  const [queue, setQueue] = useState(queueProp)
  const [suggestions, setSuggestions] = useState(suggestionsProp)
  const [batches, setBatches] = useState(batchProp)
  const [status, setStatus] = useState(queueProp ? "loaded" : "loading")
  const [familyId, setFamilyId] = useState("all")
  const [selectedId, setSelectedId] = useState("")
  useEffect(() => {
    if (queueProp) return
    let active = true
    Promise.all([
      getCatalysisCandidateQueueV1({ throwOnError: true }),
      getCatalysisExtractionSuggestionsV1({ throwOnError: true }),
      getCatalysisDiscoveryBatchesV1({ throwOnError: true }),
    ]).then(([nextQueue, nextSuggestions, nextBatches]) => {
      if (!active) return
      setQueue(nextQueue); setSuggestions(nextSuggestions); setBatches(nextBatches); setStatus("loaded")
    }).catch(() => { if (active) setStatus("error") })
    return () => { active = false }
  }, [queueProp])
  const view = useMemo(() => buildCatalysisDiscoveryView(queue, suggestions, batches), [queue, suggestions, batches])
  const visible = useMemo(() => filterCatalysisDiscoveryCandidates(view.candidates, familyId), [view.candidates, familyId])
  useEffect(() => {
    if (!visible.some(candidate => candidate.id === selectedId)) setSelectedId(visible[0]?.id || "")
  }, [visible, selectedId])
  const selected = visible.find(candidate => candidate.id === selectedId) || visible[0]
  const isolationPassed = validateCatalysisSuggestionIsolation(suggestions?.suggestions || [])

  return (
    <section id="catalysis-literature-discovery" data-testid="catalysis-discovery-workbench" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 13, padding: isMobile ? 12 : 16 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, maxWidth: 850 }}>
          <span style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}><MagnifyingGlass size={15} weight="bold" />{zh ? "候选文献检索" : "Reproducible literature discovery"}</span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, margin: 0 }}>{zh ? "催化文献候选与全文核对" : "Catalysis DOI discovery and extraction quarantine"}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{zh ? "按预设检索式扩展反应家族，分别记录 DOI 身份、全文证据与入库资格。仅完成题录核对的文献保留在候选区，须经人工核对后才能写入正式记录。" : "Versioned queries expand reaction-family coverage while DOI resolution, full-text verification, and formal admission remain separate. Machine suggestions can never self-promote."}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><BasisBadge tone="info">Crossref + OpenAlex</BasisBadge><BasisBadge tone={isolationPassed ? "calc" : "warn"}>{isolationPassed ? (zh ? "候选与正式记录已分离" : "Isolation passed") : (zh ? "数据分层异常" : "Isolation failed")}</BasisBadge><BasisBadge tone="warn">{zh ? "未经人工核验入库：0" : "Auto-promotion 0"}</BasisBadge></div>
      </header>
      {status === "loading" ? <span style={{ color: t.muted, fontSize: 11, padding: 10 }}>{zh ? "正在读取候选文献…" : "Loading literature batches…"}</span> : null}
      {status === "error" ? <span role="alert" style={{ color: t.warn, fontSize: 11, padding: 10 }}>{zh ? "候选文献加载失败。" : "Literature data failed to load."}</span> : null}
      {status === "loaded" ? <>
        <Funnel isMobile={isMobile} summary={view.summary} t={t} zh={zh} />
        <FamilyTabs active={familyId} families={view.families} onChange={setFamilyId} t={t} zh={zh} />
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, .95fr) minmax(0, 1.05fr)" }}>
          <CandidateList candidates={visible} onSelect={setSelectedId} selectedId={selected?.id} t={t} zh={zh} />
          <CandidateInspector candidate={selected} t={t} zh={zh} />
        </div>
        <div style={{ alignItems: "center", borderTop: `1px solid ${t.border}`, color: t.muted, display: "flex", flexWrap: "wrap", fontSize: 9.8, gap: 7, justifyContent: "space-between", paddingTop: 10 }}>
          <span style={{ alignItems: "center", display: "inline-flex", gap: 5 }}><FunnelSimple size={13} />{zh ? `${view.summary.excludedCount || 0} 条记录因主题或证据边界不符而排除；${view.summary.navigationCandidateCount || 0} 篇综述仅用于追溯相关原始论文。` : `${view.summary.excludedCount || 0} noisy or out-of-bound records are quarantined; ${view.summary.navigationCandidateCount || 0} review is navigation-only.`}</span>
          <a href="https://www.crossref.org/documentation/retrieve-metadata/rest-api/" rel="noreferrer" target="_blank" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", gap: 4, textDecoration: "none" }}>{zh ? "查看 Crossref 检索说明" : "Crossref official method"}<ArrowSquareOut size={11} /></a>
        </div>
      </> : null}
    </section>
  )
}

export default CatalysisDiscoveryWorkbench
