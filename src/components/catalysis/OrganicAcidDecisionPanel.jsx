import { CandidatePriorityList } from "./CandidatePriorityList"
import { formatScore, pct } from "./evidenceScoring"

const organicProducts = ["formate", "acetate", "lactate", "glycolate", "formic acid"]

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function ruleDot(status, t) {
  if (status === "matched") return t.success || "#15803d"
  if (status === "partial") return t.warn || "#b45309"
  return t.faint
}

function ruleLabel(rule, lang) {
  if (lang !== "zh") return rule.label || rule.ruleId
  const map = {
    "co2-activation": "CO2 活化",
    "aqueous-stability": "水相稳定性",
    "c-c-coupling": "C-C 偶联可能性",
    "hydrogen-transfer": "氢转移路径",
    "biomass-assisted-intermediate": "生物质辅助中间体",
    "redox-compatibility": "氧化还原兼容性",
    "pore-accessibility": "孔道可达性",
    "lewis-acid-base": "Lewis 酸碱位点相关性",
  }
  return map[rule.ruleId] || rule.label || rule.ruleId
}

function ruleReason(rule, lang) {
  if (lang !== "zh") return rule.reason || "Reason pending."
  if (rule.reasonZh) return rule.reasonZh
  const label = ruleLabel(rule, lang)
  if (rule.status === "matched") return `${label}已有文献或整理字段支持，可作为当前候选的正向依据。`
  if (rule.status === "partial") return `${label}只有部分证据支持，仍需补充反应条件或稳定性验证。`
  return `${label}缺少直接证据，暂作为待验证假设处理。`
}

function readableRisk(value, lang) {
  if (lang !== "zh") return value
  const map = {
    "missing kinetic data": "缺少动力学数据",
    "condition mismatch": "反应条件不一致",
    "yield inferred from conversion x selectivity": "收率由转化率和选择性推算",
    "missing aqueous stability evidence": "缺少水相稳定性证据",
    "unclear product basis": "产物报告基准不清",
    "insufficient selectivity evidence": "选择性证据不足",
    "demo-only source": "仅 demo 来源",
    "no long-term stability": "缺少长期稳定性",
    "long-term stability": "长期稳定性",
    "pressure uncertainty": "压力不确定性",
    "reported yield": "实测收率",
    "isotope tracing": "同位素示踪",
    "same carbon basis": "统一碳基准",
    "catalyst mass basis": "催化剂质量基准",
    "product quantification method": "产物定量方法",
    "kinetic order": "动力学级数",
    "pressureBar": "压力",
    "carbonEfficiency": "碳效率",
    "selectivity uncertainty": "选择性不确定性",
  }
  return map[value] || value
}

function MiniMetric({ label, value, note, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: "9px 10px" }}>
      <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 920, lineHeight: 1 }}>{value}</div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, lineHeight: 1.25, marginTop: 5, textTransform: "uppercase" }}>{label}</div>
      {note ? <div style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.35, marginTop: 4 }}>{note}</div> : null}
    </div>
  )
}

function RuleList({ rules, t, lang }) {
  const zh = lang === "zh"
  if (!rules.length) {
    return <div style={{ color: t.muted, fontSize: 12.5 }}>{zh ? "暂无候选规则指纹。" : "No rule fingerprint available."}</div>
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rules.map(rule => (
        <div key={rule.ruleId || rule.label} style={{ alignItems: "start", display: "grid", gap: 8, gridTemplateColumns: "10px minmax(0, 1fr) auto" }}>
          <span aria-hidden="true" style={{ background: ruleDot(rule.status, t), borderRadius: 999, height: 8, marginTop: 5, width: 8 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 870, lineHeight: 1.3 }}>{ruleLabel(rule, lang)}</div>
            <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.45, marginTop: 2 }}>{ruleReason(rule, lang)}</div>
          </div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>{rule.evidenceLevel || "unknown"}</div>
        </div>
      ))}
    </div>
  )
}

function EvidenceRisk({ candidate, records, t, lang }) {
  const zh = lang === "zh"
  const rows = candidate
    ? records.filter(record => record.candidateId === candidate.candidateId)
    : records
  const missing = Array.from(new Set([
    ...safeArray(candidate?.riskFlags),
    ...rows.flatMap(row => safeArray(row.missingFields)),
  ])).slice(0, 7)
  const risks = Array.from(new Set([
    ...safeArray(candidate?.riskFlags),
    ...rows.flatMap(row => safeArray(row.riskFlags)),
  ])).slice(0, 7)
  const comparability = rows[0]?.comparabilityStatus || candidate?.comparabilityStatus || "unknown"
  const validation = candidate?.validationStatus || rows[0]?.validationStatus || "needs_validation"

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{candidate ? (candidate.candidateName || candidate.candidateId) : (zh ? "有机酸案例总览" : "Organic-acid case summary")}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          {zh ? "证据覆盖" : "Evidence coverage"} {pct(candidate?.dataCoverage ?? (rows.length ? rows.reduce((sum, row) => sum + Number(row.dataCoverage || 0), 0) / rows.length : null))}
          {" · "}
          {zh ? "可比性" : "comparability"} {comparability}
          {" · "}
          {validation}
        </div>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{zh ? "缺失字段" : "Missing evidence"}</div>
        <div style={{ color: missing.length ? t.warn : t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          {missing.length ? missing.map(item => readableRisk(item, lang)).join(", ") : (zh ? "暂无集中缺口。" : "No concentrated gap recorded.")}
        </div>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{zh ? "风险信号" : "Risk flags"}</div>
        <div style={{ color: risks.length ? t.warn : t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          {risks.length ? risks.map(item => readableRisk(item, lang)).join(", ") : (zh ? "暂无集中风险。" : "No concentrated risk flag recorded.")}
        </div>
      </div>
    </div>
  )
}

function CandidateDetail({ candidate, linkedRecord, t, lang }) {
  const zh = lang === "zh"
  if (!candidate) {
    return (
      <section style={{ background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 12 }}>
        {zh ? "选择一个候选物，查看规则匹配、证据缺口和建议验证实验。" : "Select a candidate to inspect matched rules, evidence gaps, and suggested validation steps."}
      </section>
    )
  }
  const matched = safeArray(candidate.rules).filter(rule => rule.status === "matched")
  const partial = safeArray(candidate.rules).filter(rule => rule.status === "partial")
  const reasons = [
    matched.length ? `${zh ? "匹配规则" : "Matches"}: ${matched.map(rule => ruleLabel(rule, lang)).slice(0, 3).join(", ")}.` : null,
    partial.length ? `${zh ? "部分支持" : "Partial support"}: ${partial.map(rule => ruleLabel(rule, lang)).slice(0, 2).join(", ")}.` : null,
    candidate.mainRisk ? `${zh ? "主要限制" : "Main limitation"}: ${readableRisk(candidate.mainRisk, lang)}.` : null,
    candidate.nextValidationStep ? `${zh ? "下一步" : "Next step"}: ${zh ? "在水相 CO2 转化条件下验证产物选择性。" : candidate.nextValidationStep}` : null,
  ].filter(Boolean)

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ color: t.textStrong, fontSize: 13.5, fontWeight: 930 }}>{candidate.candidateName || candidate.candidateId}</div>
        <div style={{ color: t.accentText, fontSize: 11.5, fontWeight: 900 }}>priority {formatScore(candidate.priorityScore)}</div>
      </div>
      <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.5 }}>
        {reasons.map(reason => <div key={reason}>- {reason}</div>)}
      </div>
      <div style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>
        {zh ? "关联路径点" : "Linked pathway point"}: {linkedRecord?.pathwayName || candidate.pathwayName || "pending"} · {zh ? "数据状态" : "data status"}: {candidate.sourceType || linkedRecord?.sourceType || "demo-seed"}
      </div>
    </section>
  )
}

export function OrganicAcidDecisionPanel({
  records,
  fingerprints,
  selectedCandidateId,
  selectedPathwayId,
  onSelectCandidate,
  t,
  lang,
  isMobile,
}) {
  const zh = lang === "zh"
  const organicRecords = records.filter(record => (
    record.productType === "organic acid" || organicProducts.includes(String(record.mainProduct || "").toLowerCase())
  ))
  const organicCandidateIds = new Set(organicRecords.map(record => record.candidateId).filter(Boolean))
  const candidates = safeArray(fingerprints)
    .filter(item => item.candidateId && (organicCandidateIds.has(item.candidateId) || organicProducts.includes(String(item.mainProduct || "").toLowerCase())))
    .slice()
    .sort((a, b) => (
      Number(b.priorityScore || 0) - Number(a.priorityScore || 0)
      || Number(b.evidenceReadiness || 0) - Number(a.evidenceReadiness || 0)
      || Number(b.dataCoverage || 0) - Number(a.dataCoverage || 0)
    ))
  const selectedCandidate = candidates.find(item => item.candidateId === selectedCandidateId) || null
  const fallbackCandidate = selectedCandidate || candidates.find(item => item.pathwayId === selectedPathwayId) || candidates[0] || null
  const ruleSource = selectedCandidate || fallbackCandidate
  const linkedRecord = selectedCandidate
    ? organicRecords.find(record => record.candidateId === selectedCandidate.candidateId) || null
    : null

  const targetPathwaysCount = new Set(organicRecords.map(record => record.pathwayId).filter(Boolean)).size
  const highPriorityRoutesCount = candidates.filter(item => Number(item.priorityScore) >= 0.7).length

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>{zh ? "有机酸案例" : "Organic-acid case"}</div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {zh ? "有机酸路径决策面板" : "Organic Acid Pathway Decision Panel"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 960 }}>
          {zh
            ? "有机酸生成在此作为重点案例展示，连接反应规则、证据缺口和候选物优先级；当前结果不等同于实验验证预测。"
            : "Organic-acid formation is a focused case study linking reaction rules, evidence gaps, and candidate priority without treating results as validated predictions."}
        </p>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
        <MiniMetric label={zh ? "目标路径" : "Target pathways"} value={targetPathwaysCount} note="formate / acetate / lactate / glycolate" t={t} />
        <MiniMetric label={zh ? "候选 MOF" : "Candidate MOFs"} value={candidates.length} note={zh ? "来自规则指纹" : "from fingerprints"} t={t} />
        <MiniMetric label={zh ? "证据记录" : "Evidence records"} value={organicRecords.length} note={zh ? "已纳入证据图" : "included in map"} t={t} />
        <MiniMetric label={zh ? "高优先级路线" : "High-priority routes"} value={highPriorityRoutesCount} note={zh ? "优先级 >= 0.70" : "priority >= 0.70"} t={t} />
      </div>

      <div style={{ alignItems: "start", display: "grid", gap: isMobile ? 10 : 14, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.1fr)" }}>
        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 930 }}>{zh ? "反应规则" : "Reaction Rules"}</div>
          <RuleList rules={safeArray(ruleSource?.rules)} t={t} lang={lang} />
        </section>

        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 930 }}>{zh ? "证据与风险" : "Evidence & Risk"}</div>
          <EvidenceRisk candidate={selectedCandidate} records={organicRecords} t={t} lang={lang} />
        </section>

        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 930 }}>{zh ? "候选物优先级" : "Candidate Priority"}</div>
          <CandidatePriorityList candidates={candidates} selectedCandidateId={selectedCandidateId} onSelectCandidate={onSelectCandidate} t={t} lang={lang} />
        </section>
      </div>

      <CandidateDetail candidate={selectedCandidate} linkedRecord={linkedRecord} t={t} lang={lang} />
    </section>
  )
}
