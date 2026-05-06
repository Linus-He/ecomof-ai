import { useEffect } from "react"
import { BasisBadge } from "../ui"
import { toolbarBtn } from "../../utils/styles"

const COMPARISON_FIELDS = [
  { key: "surfaceArea", label: { en: "Surface area", zh: "比表面积" }, unit: "m²/g" },
  { key: "poreSizeA", label: { en: "Pore size", zh: "孔径" }, unit: "Å" },
  { key: "poreVolume", label: { en: "Pore volume", zh: "孔体积" }, unit: "cm³/g" },
  { key: "co2Uptake", label: { en: "CO₂ uptake", zh: "CO₂ 吸附量" }, unit: "mmol/g" },
  { key: "bandGap", label: { en: "Band gap", zh: "带隙" }, unit: "eV" },
  { key: "waterStability", label: { en: "Water stability", zh: "水稳定性" }, unit: "" },
  { key: "thermalStability", label: { en: "Thermal stability", zh: "热稳定性" }, unit: "" },
  { key: "toxicityConcern", label: { en: "Toxicity concern", zh: "毒性关注" }, unit: "" },
]

function isMissing(value) {
  return value === undefined || value === null || value === "" || value === "—" || value === "pending"
}

function pendingLabel(lang) {
  return lang === "zh" ? "待补充" : "Pending"
}

function sourcePendingLabel(lang) {
  return lang === "zh" ? "来源待补充" : "Source pending"
}

function curationStatus(source, lang) {
  if (!source) return { id: "pending", label: pendingLabel(lang), tone: "warn" }
  if (source.sourceType === "pending") return { id: "pending", label: pendingLabel(lang), tone: "warn" }
  if (source.evidenceLevel === "needs-validation") return { id: "pending", label: pendingLabel(lang), tone: "warn" }
  if (source.curationStatus === "needs-review" || source.reviewStatus === "conflict" || source.hasConflict) {
    return { id: "needs-review", label: lang === "zh" ? "待核查" : "Needs review", tone: "danger" }
  }
  return { id: "curated", label: lang === "zh" ? "已整理" : "Curated", tone: "calc" }
}

function fieldValue(candidate, field, lang) {
  const source = candidate.fieldSources?.[field.key]
  const value = !isMissing(candidate[field.key]) ? candidate[field.key] : source?.value
  if (isMissing(value)) return pendingLabel(lang)
  const unit = source?.unit ?? field.unit
  return unit ? `${value} ${unit}` : String(value)
}

function basicValue(value, lang) {
  return isMissing(value) ? pendingLabel(lang) : String(value)
}

function curationSummary(candidate, lang) {
  const statuses = COMPARISON_FIELDS.map(field => curationStatus(candidate.fieldSources?.[field.key], lang))
  return {
    curated: statuses.filter(item => item.id === "curated").length,
    pending: statuses.filter(item => item.id === "pending").length,
    needsReview: statuses.filter(item => item.id === "needs-review").length,
  }
}

function provenanceSummary(candidate, lang) {
  const sources = COMPARISON_FIELDS.map(field => candidate.fieldSources?.[field.key])
  const withSource = sources.filter(source => {
    if (!source || source.sourceType === "pending") return false
    return Boolean(source.sourceName || source.database || source.url || source.doi || source.condition)
  }).length
  const pending = COMPARISON_FIELDS.length - withSource
  return {
    withSource,
    pending,
    warning: pending >= 5
      ? (lang === "zh" ? "多个字段来源待补充" : "Many fields are source pending")
      : "",
  }
}

function Section({ title, children, t }) {
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>{title}</div>
      {children}
    </section>
  )
}

function ComparisonTable({ children, t }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${t.border}`, borderRadius: 8 }}>
      <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 11 }}>
        {children}
      </table>
    </div>
  )
}

function HeaderRow({ candidates, label, t }) {
  return (
    <thead>
      <tr style={{ background: t.surface }}>
        <th style={{ textAlign: "left", color: t.faint, padding: "8px 10px", borderBottom: `1px solid ${t.border}`, width: 150 }}>{label}</th>
        {candidates.map(candidate => (
          <th key={candidate.id} style={{ textAlign: "left", color: t.textStrong, padding: "8px 10px", borderBottom: `1px solid ${t.border}`, minWidth: 150 }}>
            {candidate.name}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function CompareTray({ count, canCompare, notice, onCompare, onClear, t, lang }) {
  const helper = count < 2
    ? (lang === "zh" ? "至少选择 2 个候选材料进行对比。" : "Select at least 2 candidates to compare.")
    : notice

  return (
    <div style={{
      position: "sticky",
      bottom: 12,
      zIndex: 10,
      background: t.panel,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 8,
      padding: "10px 12px",
      boxShadow: t.shadowSm,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
          {lang === "zh" ? `已选择 ${count} 个候选材料` : `${count} candidates selected`}
        </div>
        {helper && <div style={{ color: count < 2 ? t.faint : t.warn, fontSize: 10, lineHeight: 1.4, marginTop: 3 }}>{helper}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onCompare}
          disabled={!canCompare}
          style={{
            ...toolbarBtn(t),
            opacity: canCompare ? 1 : 0.5,
            cursor: canCompare ? "pointer" : "not-allowed",
            color: canCompare ? t.accentText : t.faint,
            border: `1px solid ${canCompare ? t.accent : t.border}`,
          }}
        >
          {lang === "zh" ? "开始对比" : "Compare now"}
        </button>
        <button type="button" onClick={onClear} style={toolbarBtn(t)}>
          {lang === "zh" ? "清空" : "Clear"}
        </button>
      </div>
    </div>
  )
}

export function CandidateComparisonModal({ open, candidates, onClose, t, lang, isMobile }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const zh = lang === "zh"
  const notes = zh
    ? [
      "描述符完整性较高有助于提高可解释性。",
      "稳定性字段待整理时，不宜直接用于科研结论。",
      "不同候选材料的来源覆盖程度不同。",
      "该对比应被视为决策支持语境，而不是最终排名。",
    ]
    : [
      "Higher descriptor completeness may improve interpretability.",
      "Pending stability fields should be reviewed before research use.",
      "Source coverage differs across candidates.",
      "This comparison should be treated as decision-support context, not final ranking.",
    ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-comparison-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15, 23, 42, 0.46)",
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
        padding: isMobile ? 10 : 24,
      }}
    >
      <div style={{
        width: "min(1040px, 100%)",
        maxHeight: isMobile ? "calc(100vh - 20px)" : "min(820px, calc(100vh - 48px))",
        overflow: "auto",
        background: t.bg,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 8,
        boxShadow: t.shadowLg || t.shadowSm,
        padding: isMobile ? 14 : 18,
        display: "grid",
        gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <h2 id="candidate-comparison-title" style={{ margin: 0, color: t.textStrong, fontSize: 18, lineHeight: 1.25 }}>
              {zh ? "候选材料对比" : "Candidate Comparison"}
            </h2>
            <p style={{ margin: "7px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.65, maxWidth: 850 }}>
              {zh
                ? "该对比基于当前可用描述符、整理状态、证据等级和字段级溯源记录，不代表最终材料性能结论。"
                : "This comparison is based on available descriptors, curation status, evidence levels, and provenance records. It is not a final material performance conclusion."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={zh ? "关闭候选材料对比" : "Close Candidate Comparison"} style={toolbarBtn(t)}>
            ×
          </button>
        </div>

        <Section title={zh ? "基本信息" : "Basic Info"} t={t}>
          <ComparisonTable t={t}>
            <HeaderRow candidates={candidates} label={zh ? "字段" : "Field"} t={t} />
            <tbody>
              {[
                [zh ? "候选名称" : "Candidate name", item => item.name],
                [zh ? "组成 / 分子式" : "Formula / composition", item => item.formula],
                [zh ? "数据模式" : "Data mode", item => item.dataMode],
                [zh ? "数据状态" : "Data status", item => item.dataStatus],
              ].map(([label, getter]) => (
                <tr key={label}>
                  <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{label}</td>
                  {candidates.map(candidate => (
                    <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}` }}>
                      {basicValue(getter(candidate), lang)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </ComparisonTable>
        </Section>

        <Section title={zh ? "描述符完整性" : "Descriptor Completeness"} t={t}>
          <ComparisonTable t={t}>
            <HeaderRow candidates={candidates} label={zh ? "整理状态" : "Curation status"} t={t} />
            <tbody>
              {candidates.map(candidate => candidate.id).length > 0 && [
                [zh ? "已整理" : "Curated", item => curationSummary(item, lang).curated],
                [zh ? "待补充" : "Pending", item => curationSummary(item, lang).pending],
                [zh ? "待核查" : "Needs review", item => curationSummary(item, lang).needsReview],
              ].map(([label, getter]) => (
                <tr key={label}>
                  <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{label}</td>
                  {candidates.map(candidate => {
                    const summary = curationSummary(candidate, lang)
                    return (
                      <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}` }}>
                        {label === (zh ? "已整理" : "Curated")
                          ? `${summary.curated}/8 ${zh ? "描述符已整理" : "descriptors curated"}`
                          : getter(candidate)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </ComparisonTable>
        </Section>

        <Section title={zh ? "关键描述符" : "Key Descriptors"} t={t}>
          <ComparisonTable t={t}>
            <HeaderRow candidates={candidates} label={zh ? "描述符" : "Descriptor"} t={t} />
            <tbody>
              {COMPARISON_FIELDS.map(field => (
                <tr key={field.key}>
                  <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{field.label[zh ? "zh" : "en"]}</td>
                  {candidates.map(candidate => {
                    const status = curationStatus(candidate.fieldSources?.[field.key], lang)
                    return (
                      <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}`, verticalAlign: "top" }}>
                        <div style={{ display: "grid", gap: 5 }}>
                          <span>{fieldValue(candidate, field, lang)}</span>
                          <BasisBadge tone={status.tone}>{status.label}</BasisBadge>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </ComparisonTable>
        </Section>

        <Section title={zh ? "证据与溯源摘要" : "Evidence & Provenance Summary"} t={t}>
          <ComparisonTable t={t}>
            <HeaderRow candidates={candidates} label={zh ? "摘要" : "Summary"} t={t} />
            <tbody>
              {[
                [zh ? "证据等级" : "Evidence level", item => item.evidenceLevel || pendingLabel(lang)],
                [zh ? "有来源记录字段" : "Fields with source records", item => provenanceSummary(item, lang).withSource],
                [zh ? "来源待补充字段" : "Source pending fields", item => provenanceSummary(item, lang).pending],
                [zh ? "提示" : "Notice", item => {
                  const summary = provenanceSummary(item, lang)
                  return summary.warning ? `${sourcePendingLabel(lang)} · ${summary.warning}` : sourcePendingLabel(lang)
                }],
              ].map(([label, getter]) => (
                <tr key={label}>
                  <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{label}</td>
                  {candidates.map(candidate => (
                    <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}` }}>
                      {getter(candidate)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </ComparisonTable>
        </Section>

        <Section title={zh ? "解释说明" : "Interpretation Notes"} t={t}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {notes.map(note => (
              <div key={note} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px", color: t.muted, fontSize: 11, lineHeight: 1.6 }}>
                {note}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
