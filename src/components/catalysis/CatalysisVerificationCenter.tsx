// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  ArrowSquareOut,
  CheckCircle,
  CirclesThreePlus,
  Database,
  GitBranch,
  ListChecks,
  ShieldWarning,
} from "@phosphor-icons/react"
import { BasisBadge, getCatalysisEvidenceGraphV2, getCatalysisReactionDatabaseV2, getCatalysisVerificationTasksV2 } from "../../shared"
import { buildCatalysisVerificationView, catalysisTrainingGate, filterCatalysisVerificationTasks } from "../../utils/catalysisVerificationV2"
import { localizeCatalysisBlocker, localizeCatalysisText } from "../../utils/catalysisDisplayText"

const TASK_LABELS = {
  "claim-location-backfill": ["数值来源定位", "Claim location"],
  "condition-backfill": ["实验条件回填", "Condition backfill"],
  "identity-resolution": ["结构身份核验", "Identity resolution"],
  "active-phase-review": ["活性相核验", "Active-phase review"],
  "license-review": ["训练许可核验", "License review"],
}

function GateBadge({ enabled, children }) {
  return <BasisBadge tone={enabled ? "calc" : "warn"}>{children}</BasisBadge>
}

function VerificationKpis({ summary, t, zh, isMobile }) {
  const rows = [
    [zh ? "可查阅记录" : "Browse eligible", summary.browseEligibleCount || 0],
    [zh ? "已定位数值声明" : "Located claims", `${summary.claimLocatedCount || 0}/${summary.numericClaimCount || 0}`],
    [zh ? "结构身份连接" : "Identity linked", summary.identityLinkedCount || 0],
    [zh ? "可作同条件比较" : "Compare eligible", summary.compareEligibleCount || 0],
    [zh ? "可用于模型训练" : "Training eligible", summary.trainingEligibleCount || 0],
    [zh ? "待核事项" : "Open tasks", summary.openTaskCount || 0],
  ]
  return (
    <div data-testid="catalysis-verification-kpis" style={{ borderBottom: `1px solid ${t.border}`, borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))" }}>
      {rows.map(([label, value], index) => (
        <div key={label} style={{ boxShadow: index % (isMobile ? 2 : 6) ? `-1px 0 0 ${t.border}` : "none", display: "grid", gap: 3, minWidth: 0, padding: "10px 9px" }}>
          <strong style={{ color: index > 0 && index < 5 && (value === 0 || String(value).startsWith("0/")) ? t.warn : t.textStrong, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
          <span style={{ color: t.muted, fontSize: 9.8, lineHeight: 1.35 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function GateMatrix({ rows, t, zh }) {
  return (
    <div style={{ minWidth: 0, overflowX: "auto" }}>
      <table data-testid="catalysis-eligibility-matrix" style={{ borderCollapse: "collapse", minWidth: 850, width: "100%" }}>
        <thead><tr>{(zh ? ["催化记录", "论文", "已定位声明", "结构身份", "可浏览", "可比较", "可训练", "可推荐", "待核原因"] : ["Reaction record", "Article", "Claims", "Identity", "Browse", "Compare", "Train", "Recommend", "Main blockers"]).map(label => <th key={label} style={{ borderBottom: `1px solid ${t.border}`, color: t.subtle, fontSize: 9.5, padding: "7px", textAlign: "left" }}>{label}</th>)}</tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 10.5, fontWeight: 800, padding: "8px 7px" }}>{localizeCatalysisText(row.catalyst, zh)}</td>
              <td style={{ borderBottom: `1px solid ${t.divider}`, padding: "8px 7px" }}><a href={row.document.doiUrl} rel="noreferrer" target="_blank" style={{ color: t.accentText, fontSize: 10, textDecoration: "none" }}>{row.document.doi}</a></td>
              <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 10, padding: "8px 7px" }}>{row.claims.filter(claim => claim.value != null && claim.verificationLevel === "L4-claim-located").length}/{row.claims.filter(claim => claim.value != null).length}{zh ? " 条" : " L4"}</td>
              <td style={{ borderBottom: `1px solid ${t.divider}`, color: row.canonicalId ? t.success : t.warn, fontSize: 10, padding: "8px 7px" }}>{row.canonicalId || (zh ? "未解析" : "Unresolved")}</td>
              {["browseEligible", "compareEligible", "trainingEligible", "recommendationEligible"].map(field => <td key={field} style={{ borderBottom: `1px solid ${t.divider}`, padding: "8px 7px" }}>{row.decision[field] ? <CheckCircle aria-label="pass" color={t.success} size={16} weight="fill" /> : <ShieldWarning aria-label="blocked" color={t.warn} size={16} weight="fill" />}</td>)}
              <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 9.6, lineHeight: 1.4, maxWidth: 230, padding: "8px 7px" }}>{(row.decision.blockers || []).slice(0, 3).map(blocker => localizeCatalysisBlocker(blocker, zh)).join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EvidenceTrace({ rows, t, zh, isMobile }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id || "")
  useEffect(() => {
    if (!rows.some(row => row.id === selectedId)) setSelectedId(rows[0]?.id || "")
  }, [rows, selectedId])
  const selected = rows.find(row => row.id === selectedId) || rows[0]
  if (!selected) return null
  const openTasks = selected.tasks.filter(task => task.status === "open")
  const locatedClaims = selected.claims.filter(claim => claim.verificationLevel === "L4-claim-located")
  const stages = [
    {
      label: zh ? "论文" : "Article",
      value: selected.document.doi,
      status: selected.document.metadataVerification === "matched" ? (zh ? "身份已匹配" : "Identity matched") : (zh ? "待核验" : "Pending"),
      pass: selected.document.metadataVerification === "matched",
    },
    {
      label: zh ? "催化剂状态" : "Catalyst state",
      value: localizeCatalysisText(selected.catalyst, zh),
      status: selected.canonicalId || (zh ? "结构身份未解析" : "Structure unresolved"),
      pass: Boolean(selected.canonicalId),
    },
    {
      label: zh ? "反应记录" : "Reaction record",
      value: `${localizeCatalysisText(selected.reaction?.substrate || "?", zh)} → ${localizeCatalysisText(selected.reaction?.targetProduct || "?", zh)}`,
      status: zh ? "条件独立保存" : "Conditions stored separately",
      pass: selected.decision.conditionCompleteness?.missing?.length === 0,
    },
    {
      label: zh ? "数值声明" : "Numeric claims",
      value: `${locatedClaims.length}/${selected.claims.filter(claim => claim.value != null).length}${zh ? " 条" : " L4"}`,
      status: zh ? "图表/章节精确定位" : "Precise figure/section location",
      pass: locatedClaims.length > 0 && locatedClaims.length === selected.claims.filter(claim => claim.value != null).length,
    },
    {
      label: zh ? "待核事项" : "Verification tasks",
      value: String(openTasks.length),
      status: zh ? "未核清前不扩大使用范围" : "Unresolved work remains blocked",
      pass: openTasks.length === 0,
    },
  ]
  return (
    <section data-testid="catalysis-evidence-trace" style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 10, paddingTop: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{zh ? "来源与核验路径" : "Evidence trace"}</strong>
          <span style={{ color: t.muted, fontSize: 10.5 }}>{zh ? "逐条查看论文身份、催化剂状态、实验声明和待核事项。" : "Inspect how each article reaches an admission decision."}</span>
        </div>
        <select aria-label={zh ? "选择催化记录" : "Select catalysis record"} onChange={event => setSelectedId(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 5, color: t.text, fontSize: 10.5, minHeight: 32, padding: "0 8px" }} value={selected.id}>
          {rows.map(row => <option key={row.id} value={row.id}>{localizeCatalysisText(row.catalyst, zh)}</option>)}
        </select>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 0 }}>
        {stages.map((stage, index) => (
          <div key={stage.label} style={{ borderBottom: isMobile && index < stages.length - 1 ? `1px solid ${t.divider}` : "none", boxShadow: !isMobile && index ? `-1px 0 0 ${t.border}` : "none", display: "grid", gap: 5, minHeight: 92, padding: "9px 10px" }}>
            <span style={{ color: t.subtle, fontSize: 9.5, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")} · {stage.label}</span>
            <strong style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, overflowWrap: "anywhere" }}>{stage.value}</strong>
            <span style={{ alignItems: "center", color: stage.pass ? t.success : t.warn, display: "inline-flex", fontSize: 9.6, gap: 4 }}>
              {stage.pass ? <CheckCircle size={13} weight="fill" /> : <ShieldWarning size={13} weight="fill" />}{stage.status}
            </span>
          </div>
        ))}
      </div>
      <div data-testid="catalysis-l4-claim-ledger" style={{ borderTop: `1px solid ${t.divider}`, display: "grid" }}>
        <span style={{ color: t.subtle, fontSize: 9.5, fontWeight: 800, padding: "8px 10px 5px" }}>{zh ? "已精确定位的声明" : "Precisely located claims"}</span>
        {locatedClaims.length ? locatedClaims.map(claim => {
          const locatedEvidence = claim.evidence.find(item => item.reviewStatus === "verified") || claim.evidence[0]
          const metricLabel = localizeCatalysisText(String(claim.metric || "metric"), zh).replaceAll("_", " ")
          return (
            <div key={claim.id} style={{ alignItems: "start", borderTop: `1px solid ${t.divider}`, display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr" : "minmax(150px, .7fr) minmax(0, 1.5fr) auto", padding: "8px 10px" }}>
              <strong style={{ color: t.textStrong, fontSize: 10.5, textTransform: "capitalize" }}>{metricLabel} · {claim.operator || "="} {claim.value} {claim.unit || ""}</strong>
              <span style={{ color: t.muted, fontSize: 9.8, lineHeight: 1.45 }}>{localizeCatalysisText(locatedEvidence?.sourceLocation, zh)}</span>
              {locatedEvidence?.sourceUrl ? <a href={locatedEvidence.sourceUrl} rel="noreferrer" target="_blank" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 9.8, gap: 4, textDecoration: "none" }}>{zh ? "出版方证据" : "Publisher evidence"}<ArrowSquareOut size={11} /></a> : null}
            </div>
          )
        }) : <span style={{ color: t.muted, fontSize: 10, padding: "7px 10px 10px" }}>{zh ? "当前记录尚无精确定位到图表或章节的数值声明。" : "No L4 claim is available for this record."}</span>}
      </div>
    </section>
  )
}

function VerificationQueue({ tasks, t, zh }) {
  const [priority, setPriority] = useState("all")
  const [type, setType] = useState("all")
  const visible = useMemo(() => filterCatalysisVerificationTasks(tasks, { priority, type, status: "open" }), [tasks, priority, type])
  const types = [...new Set(tasks.map(task => task.type))]
  const control = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 5, color: t.text, fontSize: 10.5, minHeight: 31, padding: "0 8px" }
  return (
    <section data-testid="catalysis-verification-queue" style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 9, paddingTop: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3 }}><strong style={{ color: t.textStrong, fontSize: 13 }}>{zh ? "待核事项" : "Verification task queue"}</strong><span style={{ color: t.muted, fontSize: 10.5 }}>{zh ? "每项数据缺口均保留为待核事项，未查证的内容不作补填。" : "Missing evidence becomes an executable task; the frontend never guesses values."}</span></div>
        <div style={{ display: "flex", gap: 6 }}>
          <select aria-label={zh ? "任务优先级" : "Task priority"} onChange={event => setPriority(event.target.value)} style={control} value={priority}><option value="all">{zh ? "全部优先级" : "All priorities"}</option><option value="P0">P0</option><option value="P1">P1</option></select>
          <select aria-label={zh ? "任务类型" : "Task type"} onChange={event => setType(event.target.value)} style={control} value={type}><option value="all">{zh ? "全部任务" : "All tasks"}</option>{types.map(value => <option key={value} value={value}>{TASK_LABELS[value]?.[zh ? 0 : 1] || value}</option>)}</select>
        </div>
      </header>
      <div style={{ display: "grid", gap: 6, maxHeight: 310, overflow: "auto" }}>
        {visible.map(task => (
          <article key={task.id} style={{ alignItems: "start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 5, display: "grid", gap: 7, gridTemplateColumns: "auto minmax(0, 1fr) auto", padding: "8px 9px" }}>
            <BasisBadge tone={task.priority === "P0" ? "warn" : "proxy"}>{task.priority}</BasisBadge>
            <div style={{ display: "grid", gap: 3 }}><strong style={{ color: t.textStrong, fontSize: 10.8 }}>{zh ? localizeCatalysisText(task.titleZh, true) : task.titleEn}</strong><span style={{ color: t.muted, fontSize: 9.8, lineHeight: 1.4 }}>{localizeCatalysisText(task.reason, zh)}</span></div>
            <span style={{ color: t.subtle, fontSize: 9.5 }}>{TASK_LABELS[task.type]?.[zh ? 0 : 1] || task.type}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export function CatalysisVerificationCenter({ database: databaseProp = null, tasksDataset: tasksProp = null, graph: graphProp = null, t, lang = "zh", isMobile = false, embedded = false }) {
  const zh = lang === "zh"
  const [database, setDatabase] = useState(databaseProp)
  const [tasksDataset, setTasksDataset] = useState(tasksProp)
  const [graph, setGraph] = useState(graphProp)
  const [status, setStatus] = useState(databaseProp ? "loaded" : "loading")
  useEffect(() => {
    if (databaseProp) return
    let active = true
    Promise.all([
      getCatalysisReactionDatabaseV2({ throwOnError: true }),
      getCatalysisVerificationTasksV2({ throwOnError: true }),
      getCatalysisEvidenceGraphV2({ throwOnError: true }),
    ]).then(([nextDatabase, nextTasks, nextGraph]) => {
      if (!active) return
      setDatabase(nextDatabase)
      setTasksDataset(nextTasks)
      setGraph(nextGraph)
      setStatus("loaded")
    }).catch(() => {
      if (active) setStatus("error")
    })
    return () => { active = false }
  }, [databaseProp])
  const view = useMemo(() => buildCatalysisVerificationView(database, tasksDataset), [database, tasksDataset])
  const trainingGate = useMemo(() => catalysisTrainingGate(database), [database])
  return (
    <section id="catalysis-verification-center" data-testid="catalysis-verification-center" style={{ background: embedded ? "transparent" : t.panel, border: embedded ? 0 : `1px solid ${t.border}`, borderRadius: embedded ? 0 : 8, display: "grid", gap: 13, padding: embedded ? 0 : isMobile ? 12 : 16 }}>
      {!embedded ? <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, maxWidth: 850 }}>
          <span style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}><ListChecks aria-hidden size={15} weight="fill" />{zh ? "证据核验与使用边界" : "Evidence admission system"}</span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, margin: 0 }}>{zh ? "催化文献核验中心" : "Catalysis literature verification center"}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{zh ? "论文身份、数值声明、实验条件、结构身份和使用许可分别核验；未通过的记录仍可浏览，但不能进入比较、训练或推荐。" : "Article identity, numeric claims, conditions, structure identity, and reuse licenses are verified separately. Blocked records remain browsable but cannot enter comparison, training, or recommendation."}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><GateBadge enabled={view.summary.browseEligibleCount > 0}>{zh ? `浏览级 ${view.summary.browseEligibleCount || 0}` : `Browse ${view.summary.browseEligibleCount || 0}`}</GateBadge><GateBadge enabled={view.summary.compareEligibleCount > 0}>{zh ? `比较级 ${view.summary.compareEligibleCount || 0}` : `Compare ${view.summary.compareEligibleCount || 0}`}</GateBadge><GateBadge enabled={view.summary.trainingEligibleCount > 0}>{zh ? `训练级 ${view.summary.trainingEligibleCount || 0}` : `Train ${view.summary.trainingEligibleCount || 0}`}</GateBadge></div>
        </div>
        <nav aria-label={zh ? "催化数据连接" : "Catalysis data connections"} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <a href="#library" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10.5, gap: 5, textDecoration: "none" }}><Database size={14} />{zh ? "MOF身份库" : "MOF registry"}<ArrowSquareOut size={12} /></a>
          <a href="#methodology-catalysis-lab" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 10.5, gap: 5, textDecoration: "none" }}><ListChecks size={14} />{zh ? "核验方法" : "Verification method"}<ArrowSquareOut size={12} /></a>
          <span style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 10.5, gap: 5 }}><GitBranch size={14} />{graph?.summary?.nodeCount || 0} {zh ? "证据节点" : "evidence nodes"}</span>
          <span style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 10.5, gap: 5 }}><CirclesThreePlus size={14} />{graph?.summary?.edgeCount || 0} {zh ? "证据连接" : "evidence edges"}</span>
        </nav>
      </header> : null}
      {status === "loading" ? <div style={{ color: t.muted, fontSize: 11, padding: 12 }}>{zh ? "正在读取核验记录…" : "Loading the V2 verification database…"}</div> : null}
      {status === "error" ? <div role="alert" style={{ color: t.warn, fontSize: 11, padding: 12 }}>{zh ? "核验记录加载失败。" : "The V2 verification database failed to load."}</div> : null}
      {status === "loaded" ? <>
      <VerificationKpis isMobile={isMobile} summary={view.summary} t={t} zh={zh} />
      <div role="status" style={{ background: trainingGate.eligible ? t.badgeCalcBg : t.badgeWarnBg, border: `1px solid ${trainingGate.eligible ? t.success : t.warn}`, borderRadius: 5, color: t.muted, fontSize: 10.8, lineHeight: 1.5, padding: "8px 10px" }}>{zh ? trainingGate.reasonZh : trainingGate.reasonEn}</div>
      <EvidenceTrace isMobile={isMobile} rows={view.recordRows} t={t} zh={zh} />
      <GateMatrix rows={view.recordRows} t={t} zh={zh} />
      <VerificationQueue tasks={view.tasks} t={t} zh={zh} />
      </> : null}
    </section>
  )
}

export default CatalysisVerificationCenter
