import { useMemo, useState } from "react"
import {
  DESCRIPTOR_GROUP_ORDER,
  DESCRIPTOR_PRESETS,
  getAllDescriptors,
  getDatasetDescriptorCoverage,
  getDescriptorGroup,
  getDescriptorUsageByPreset,
  toPercent,
} from "../../scoring"
import { FONT_MONO } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { BasisBadge } from "../ui"
import { GraphDescriptorPanel } from "../mof/GraphDescriptorPanel"
import { WhyThisResultButton } from "./WhyThisResultButton"
import { WhyThisWeightButton } from "./WhyThisWeightButton"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const fmt = (value, digits = 3) => Number(value || 0).toFixed(digits)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function Card({ t, children, style }) {
  return (
    <section style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 14,
      minWidth: 0,
      ...style,
    }}>
      {children}
    </section>
  )
}

function MiniTitle({ title, subtitle, t }) {
  return (
    <div>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14, lineHeight: 1.25, fontWeight: 900 }}>{title}</h3>
      {subtitle && <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

function SegmentedButtons({ items, value, onChange, t, lang }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              ...toolbarBtn(t),
              background: active ? t.badgeInfoBg : t.panel,
              borderColor: active ? t.accent : t.border,
              color: active ? t.accentText : t.muted,
              minHeight: 33,
            }}
          >
            {lang === "zh" ? item.labelZh || item.label : item.label}
          </button>
        )
      })}
    </div>
  )
}

export function ScoringModelCard({ model, settings, onManageDescriptors, onApply, changed, t, lang, isMobile }) {
  const presetLabel = model?.preset ? (lang === "zh" ? model.preset.labelZh : model.preset.label) : "—"
  const descriptorPreset = model?.metadata?.descriptorPreset || settings?.descriptorPreset || "—"
  const descriptorCoverage = model?.descriptorCoverage?.coverage
  const descriptorCoverageLabel = Number.isFinite(Number(descriptorCoverage))
    ? pct(descriptorCoverage)
    : "—"
  return (
    <Card t={t} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <MiniTitle
          t={t}
          title={text(lang, "当前评分模型", "Current scoring model")}
          subtitle={text(
            lang,
            "描述符集定义了本次筛选使用哪些指标；新增描述符需同时确认单位、指标方向、缺失值策略和证据要求。",
            "Descriptor sets define which indicators are used in this screening run. New descriptors require unit, direction, missing-value policy, and evidence requirements."
          )}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onManageDescriptors} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
            {text(lang, "管理描述符集", "Manage descriptor set")}
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!changed}
            style={{ ...toolbarBtn(t), background: changed ? t.accent : t.surface, borderColor: changed ? t.accent : t.border, color: changed ? "#fff" : t.faint, cursor: changed ? "pointer" : "default" }}
          >
            {text(lang, "Apply / Update scoring", "Apply / Update scoring")}
          </button>
        </div>
      </div>
      {changed && <BasisBadge tone="warn">{text(lang, "Settings changed，点击 Apply scoring 后更新结果", "Settings changed. Apply scoring to update results.")}</BasisBadge>}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {[
          [text(lang, "Dataset", "Dataset"), lang === "zh" ? model.preset?.datasetLabelZh : model.preset?.datasetLabel],
          [text(lang, "Preset", "Preset"), presetLabel],
          [text(lang, "Descriptor preset", "Descriptor preset"), descriptorPreset],
          [text(lang, "Algorithm", "Algorithm"), String(settings.algorithm || model.algorithm).toUpperCase()],
          [text(lang, "Missing strategy", "Missing strategy"), settings.missingValueStrategy || model.missingValueStrategy],
          [text(lang, "Hybrid alpha", "Hybrid alpha"), Number(settings.hybridAlpha ?? model.hybridAlpha ?? 0).toFixed(2)],
          [text(lang, "Candidate count", "Candidate count"), model.metadata?.candidateCount || 0],
          [text(lang, "Descriptor coverage", "Descriptor coverage"), `${descriptorCoverageLabel} · ${model.metadata?.descriptorCount || 0}/${model.metadata?.requestedDescriptorCount || model.metadata?.descriptorCount || 0}`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 5, overflowWrap: "anywhere" }}>{value || "—"}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function WeightingMethodPanel({ draft, setDraft, onApply, onReset, onManageDescriptors, changed, t, lang, isMobile }) {
  const methods = [
    { id: "manual", label: "Manual", labelZh: "Manual 手动" },
    { id: "equal", label: "Equal", labelZh: "Equal 等权重" },
    { id: "critic", label: "CRITIC", labelZh: "CRITIC" },
    { id: "hybrid", label: "Hybrid", labelZh: "Hybrid 混合" },
  ]
  return (
    <Card t={t} style={{ display: "grid", gap: 12 }}>
      <MiniTitle
        t={t}
        title={text(lang, "权重方法", "Weighting method")}
        subtitle={text(lang, "设置先进入草稿状态，点击 Apply scoring 后才更新图表。", "Settings stay as draft until Apply scoring is clicked.")}
      />
      <SegmentedButtons items={methods} value={draft.algorithm} onChange={algorithm => setDraft(prev => ({ ...prev, algorithm }))} t={t} lang={lang} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
        <label style={{ display: "grid", gap: 6, color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          <span style={{ color: t.textStrong, fontWeight: 850 }}>{text(lang, "Hybrid alpha", "Hybrid alpha")}: {Number(draft.hybridAlpha || 0).toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={draft.hybridAlpha}
            disabled={draft.algorithm !== "hybrid"}
            onChange={event => setDraft(prev => ({ ...prev, hybridAlpha: Number(event.target.value) }))}
          />
        </label>
        <label style={{ display: "grid", gap: 6, color: t.muted, fontSize: 11.5 }}>
          <span style={{ color: t.textStrong, fontWeight: 850 }}>{text(lang, "Missing value strategy", "Missing value strategy")}</span>
          <select
            value={draft.missingValueStrategy}
            onChange={event => setDraft(prev => ({ ...prev, missingValueStrategy: event.target.value }))}
            style={{ background: t.surface, color: t.textStrong, border: `1px solid ${t.border}`, borderRadius: 7, padding: "8px 9px" }}
          >
            <option value="median">median</option>
            <option value="zeroPenalty">zeroPenalty</option>
            <option value="exclude">exclude</option>
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {onManageDescriptors && (
          <button type="button" onClick={onManageDescriptors} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
            {text(lang, "管理描述符集", "Manage descriptor set")}
          </button>
        )}
        <button type="button" onClick={onReset} style={toolbarBtn(t)}>{text(lang, "Reset", "Reset")}</button>
        <button type="button" onClick={onApply} disabled={!changed} style={{ ...toolbarBtn(t), background: changed ? t.accent : t.surface, borderColor: changed ? t.accent : t.border, color: changed ? "#fff" : t.faint }}>
          {text(lang, "Apply scoring", "Apply scoring")}
        </button>
      </div>
    </Card>
  )
}

export function DescriptorSetDrawer({ open, onClose, draft, setDraft, candidates, t, lang, isMobile }) {
  const descriptors = useMemo(() => getAllDescriptors({ includePlanned: true }), [])
  const selectedKeys = new Set(draft.descriptorKeys || DESCRIPTOR_PRESETS[draft.descriptorPreset]?.descriptorKeys || DESCRIPTOR_PRESETS.coreMof8.descriptorKeys)
  const coverage = useMemo(() => getDatasetDescriptorCoverage(candidates, Array.from(selectedKeys)), [candidates, draft.descriptorKeys, draft.descriptorPreset])
  if (!open) return null
  const setPreset = descriptorPreset => {
    setDraft(prev => ({
      ...prev,
      descriptorPreset,
      descriptorKeys: descriptorPreset === "custom" ? prev.descriptorKeys || DESCRIPTOR_PRESETS.coreMof8.descriptorKeys : DESCRIPTOR_PRESETS[descriptorPreset].descriptorKeys,
    }))
  }
  const toggleDescriptor = key => {
    setDraft(prev => {
      const current = new Set(prev.descriptorKeys || DESCRIPTOR_PRESETS[prev.descriptorPreset]?.descriptorKeys || DESCRIPTOR_PRESETS.coreMof8.descriptorKeys)
      if (current.has(key)) current.delete(key)
      else current.add(key)
      return { ...prev, descriptorPreset: "custom", descriptorKeys: Array.from(current) }
    })
  }
  const panel = (
    <aside style={{
      position: "fixed",
      inset: isMobile ? "auto 0 0 0" : "0 0 0 auto",
      width: isMobile ? "100%" : 520,
      maxHeight: isMobile ? "88vh" : "100vh",
      overflow: "auto",
      zIndex: 30,
      background: t.panel,
      borderLeft: isMobile ? "none" : `1px solid ${t.border}`,
      borderTop: isMobile ? `1px solid ${t.border}` : "none",
      boxShadow: t.shadowLg || t.shadowSm,
      padding: 16,
      display: "grid",
      gap: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <MiniTitle
          t={t}
          title={text(lang, "管理描述符集", "Manage descriptor set")}
          subtitle={text(lang, "planned 描述符为后续扩展入口；当前数据不可用时不会默认参与评分。", "Planned descriptors are expansion hooks; unavailable fields are not scored by default.")}
        />
        <button type="button" onClick={onClose} style={toolbarBtn(t)}>{text(lang, "关闭", "Close")}</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{text(lang, "Preset", "Preset")}</div>
        <SegmentedButtons
          items={Object.values(DESCRIPTOR_PRESETS).filter(preset => preset.key !== "catalysisFormate3").map(preset => ({ id: preset.key, label: preset.label, labelZh: preset.labelZh }))}
          value={draft.descriptorPreset}
          onChange={setPreset}
          t={t}
          lang={lang}
        />
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, display: "grid", gap: 6 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{text(lang, "Coverage preview", "Coverage preview")}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          {text(lang, "Current dataset coverage", "Current dataset coverage")}: {coverage.availableCells}/{coverage.totalCells || 0} · {text(lang, "Selected descriptors", "Selected descriptors")}: {selectedKeys.size}
        </div>
      </div>
      {DESCRIPTOR_GROUP_ORDER.map(groupKey => {
        const groupDescriptors = descriptors.filter(descriptor => descriptor.group === groupKey)
        if (!groupDescriptors.length) return null
        const group = getDescriptorGroup(groupKey)
        return (
          <div key={groupKey} style={{ display: "grid", gap: 7 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{lang === "zh" ? group.labelZh : group.label}</div>
            {groupDescriptors.map(descriptor => {
              const datasetRow = coverage.rows.find(row => row.key === descriptor.key)
              const unavailablePlanned = descriptor.planned && (!datasetRow || datasetRow.availableCount === 0)
              return (
                <label key={descriptor.key} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 9, alignItems: "flex-start", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, opacity: unavailablePlanned ? 0.68 : 1 }}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(descriptor.key)}
                    disabled={unavailablePlanned}
                    onChange={() => toggleDescriptor(descriptor.key)}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ display: "grid", gap: 5, minWidth: 0 }}>
                    <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 850 }}>{lang === "zh" ? descriptor.labelZh : descriptor.label} <span style={{ color: t.faint, fontFamily: FONT_MONO, fontWeight: 500 }}>{descriptor.unit || ""}</span></span>
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <BasisBadge tone={descriptor.direction === "cost" ? "warn" : "calc"}>{descriptor.direction}</BasisBadge>
                      <BasisBadge tone={descriptor.planned ? "proxy" : "info"}>{descriptor.planned ? "planned" : descriptor.defaultRole}</BasisBadge>
                      {unavailablePlanned && <BasisBadge tone="warn">{text(lang, "当前数据不可用", "not available in current dataset")}</BasisBadge>}
                    </span>
                    <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>{lang === "zh" ? descriptor.descriptionZh : descriptor.description}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )
      })}
    </aside>
  )
  return (
    <>
      <button type="button" aria-label="Close descriptor drawer backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 29, background: "rgba(0,0,0,0.28)", border: 0 }} />
      {panel}
    </>
  )
}

export function DescriptorWeightChart({ model, t, lang }) {
  const explanations = model.explanations?.weights || []
  return (
    <Card t={t} style={{ display: "grid", gap: 12 }}>
      <MiniTitle t={t} title={text(lang, "Descriptor weights", "Descriptor weights")} subtitle={text(lang, "显示权重、contrast intensity、conflict score 与缺失率。", "Shows weight, contrast intensity, conflict score, and missing rate.")} />
      <div style={{ display: "grid", gap: 8 }}>
        {explanations.map(item => (
          <div key={item.key} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 0.8fr) minmax(0, 1.3fr) auto", gap: 10, alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? item.labelZh : item.label}</div>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ height: 7, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden", background: t.panel }}>
                <div style={{ height: "100%", width: pct(item.weight), background: t.accent }} />
              </div>
              <div style={{ color: t.faint, fontSize: 10.5 }}>
                w {fmt(item.weight)} · contrast {fmt(item.contrastIntensity)} · conflict {fmt(item.conflictScore)} · missing {pct(item.missingRate)}
              </div>
            </div>
            <WhyThisWeightButton model={model} descriptorKey={item.key} item={item} t={t} lang={lang} />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function CandidateRankingTable({ model, selectedId, onSelect, t, lang, isMobile }) {
  const [expanded, setExpanded] = useState(selectedId || null)
  const rows = model.rankings || []
  const expandedRow = rows.find(row => row.id === expanded)
  return (
    <Card t={t} style={{ display: "grid", gap: 10 }}>
      <MiniTitle t={t} title={text(lang, "Candidate ranking", "Candidate ranking")} subtitle={text(lang, "Rank / score / completeness / driver / warning / confidence.", "Rank / score / completeness / driver / warning / confidence.")} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: isMobile ? 900 : 960, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 8px" }}>Rank</th><th>Candidate</th><th>Score</th><th>Completeness</th><th>Main driver</th><th>Evidence warning</th><th>Confidence</th><th>Explain</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const open = expanded === row.id
              return (
                <tr key={row.id} onClick={() => { setExpanded(open ? null : row.id); onSelect?.(row.id) }} style={{ cursor: "pointer", color: t.muted, fontSize: 12 }}>
                    <td style={{ background: t.surface, padding: 10, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 900 }}>{row.rank}</td>
                    <td style={{ background: t.surface, padding: 10, color: t.textStrong, fontWeight: 850 }}>{row.name}</td>
                    <td style={{ background: t.surface, padding: 10, fontFamily: FONT_MONO }}>{Number(row.score).toFixed(1)}</td>
                    <td style={{ background: t.surface, padding: 10 }}>{pct(row.descriptorCompleteness)}</td>
                    <td style={{ background: t.surface, padding: 10 }}>{lang === "zh" ? row.mainDriver?.labelZh : row.mainDriver?.label}</td>
                    <td style={{ background: t.surface, padding: 10, color: row.evidenceWarning ? t.warn : t.faint }}>{row.evidenceWarning || "—"}</td>
                    <td style={{ background: t.surface, padding: 10 }}>{pct(row.confidence)}</td>
                    <td style={{ background: t.surface, padding: 10, borderRadius: "0 7px 7px 0" }}>
                      <WhyThisResultButton model={model} candidateId={row.id} candidate={row} t={t} lang={lang} isMobile={isMobile} compact />
                    </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {expandedRow && <ScoreBreakdownPanel row={expandedRow} t={t} lang={lang} />}
    </Card>
  )
}

export function ScoreBreakdownPanel({ row, t, lang }) {
  const graphScore = row.graphScore
  const graphMetadata = row.candidate?.graphMetadata
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 10, marginBottom: 6 }}>
      {graphScore && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {[
            [text(lang, "Descriptor Score", "Descriptor Score"), graphScore.descriptorScore, ""],
            [text(lang, "Graph Motif Bonus", "Graph Motif Bonus"), graphScore.graphMotifScore, "+"],
            [text(lang, "Diversity Bonus", "Diversity Bonus"), graphScore.diversityBonus, "+"],
            [text(lang, "Evidence Penalty", "Evidence Penalty"), graphScore.evidencePenalty, "-"],
            [text(lang, "Final Score", "Final Score"), graphScore.finalScore, ""],
          ].map(([label, value, prefix]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9, minWidth: 0 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: label === "Final Score" ? t.textStrong : t.muted, fontFamily: FONT_MONO, fontSize: 16, fontWeight: 900, marginTop: 5 }}>
                {prefix}{Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {row.contributions.map(item => (
          <div key={item.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? item.labelZh : item.label}</div>
            <div style={{ color: t.faint, fontSize: 10.5, marginTop: 4 }}>value {fmt(item.normalizedValue, 2)} · w {fmt(item.weight, 2)} · contribution {(item.contribution * 100).toFixed(1)}</div>
            {item.missing && <BasisBadge tone="warn">{text(lang, "missing descriptor penalty", "missing descriptor penalty")}</BasisBadge>}
          </div>
        ))}
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
        {row.methodNote} {row.evidenceWarning ? `${text(lang, "Warning", "Warning")}: ${row.evidenceWarning}` : ""}
      </div>
      <div style={{ color: t.faint, fontSize: 11 }}>
        {text(lang, "Top drivers", "Top drivers")}: {row.topDrivers.map(item => lang === "zh" ? item.labelZh : item.label).join(", ")} · {text(lang, "Main weakness", "Main weakness")}: {lang === "zh" ? row.mainWeakness?.labelZh : row.mainWeakness?.label}
      </div>
      <GraphDescriptorPanel graphMetadata={graphMetadata} t={t} lang={lang} />
    </div>
  )
}

export function DescriptorConflictMatrix({ model, t, lang }) {
  const descriptors = model.descriptors || []
  const correlation = model.weightingDiagnostics?.correlationMatrix || model.weightingDiagnostics?.critic?.correlationMatrix || {}
  const conflict = model.weightingDiagnostics?.conflictMatrix || model.weightingDiagnostics?.critic?.conflictMatrix || {}
  return (
    <Card t={t} style={{ display: "grid", gap: 10 }}>
      <MiniTitle t={t} title={text(lang, "Descriptor conflict matrix", "Descriptor conflict matrix")} subtitle={text(lang, "高正相关可能冗余；低相关表示独立信息；负相关可能代表 trade-off。", "High positive correlation may mean redundancy; low correlation means independent information; negative correlation may indicate trade-off.")} />
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `110px repeat(${descriptors.length}, minmax(70px, 1fr))`, gap: 5, minWidth: Math.max(420, descriptors.length * 82 + 110) }}>
          <span />
          {descriptors.map(descriptor => <span key={descriptor.key} style={{ color: t.faint, fontSize: 10, fontWeight: 850, textAlign: "center" }}>{descriptor.key}</span>)}
          {descriptors.flatMap(row => [
            <span key={`${row.key}-head`} style={{ color: t.textStrong, fontSize: 10.5, fontWeight: 850, alignSelf: "center" }}>{lang === "zh" ? row.labelZh : row.label}</span>,
            ...descriptors.map(col => {
              const r = correlation[row.key]?.[col.key]
              const c = conflict[row.key]?.[col.key]
              const value = Number.isFinite(Number(r)) ? Number(r) : 0
              const bg = row.key === col.key ? t.surface : Math.abs(value) > 0.72 ? t.badgeInfoBg : Math.abs(value) < 0.2 ? t.badgeCalcBg : t.panel
              const hint = !Number.isFinite(Number(r))
                ? "insufficient data = unstable"
                : value > 0.7
                  ? "high positive correlation = possible redundancy"
                  : value < -0.25
                    ? "negative correlation = possible trade-off"
                    : "low correlation = independent information"
              return <span key={`${row.key}-${col.key}`} title={`${hint}; conflict ${fmt(c, 2)}`} style={{ background: bg, border: `1px solid ${t.border}`, borderRadius: 7, padding: "9px 6px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 10.5, textAlign: "center" }}>{fmt(value, 2)}</span>
            }),
          ])}
        </div>
      </div>
    </Card>
  )
}

export function ScoringDiagnosticsPanel({ model, t, lang, isMobile }) {
  const diagnostics = model.diagnostics || {}
  const warnings = model.warnings || []
  const comparisonRows = diagnostics.methodComparison?.rows || []
  const maxShift = diagnostics.rankingStability?.maxShift ?? 0
  const fallbackUsed = Boolean(model.weightingDiagnostics?.fallbackUsed || model.weightingDiagnostics?.critic?.fallbackUsed)
  return (
    <Card t={t} style={{ display: "grid", gap: 12 }}>
      <MiniTitle t={t} title={text(lang, "Scoring diagnostics", "Scoring diagnostics")} subtitle={text(lang, "缺失影响、排名稳定性、算法对比和 warning。", "Missing impact, ranking stability, method comparison, and warnings.")} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{text(lang, "Missing data impact", "Missing data impact")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, marginTop: 5 }}>{pct(diagnostics.missingDataImpact?.missingRate)}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{text(lang, "Ranking stability", "Ranking stability")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, marginTop: 5 }}>{lang === "zh" ? diagnostics.rankingStability?.labelZh : diagnostics.rankingStability?.label}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{text(lang, "Valid records", "Valid records")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, marginTop: 5 }}>{model.metadata?.validRecordCount || 0}/{model.metadata?.candidateCount || 0}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{text(lang, "Fallback status", "Fallback status")}</div>
          <div style={{ color: fallbackUsed ? t.warn : t.textStrong, fontSize: 18, fontWeight: 900, marginTop: 5 }}>{fallbackUsed ? "Used" : "None"}</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{text(lang, "Method comparison", "Method comparison")}</div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, marginTop: 5 }}>{comparisonRows.length} · Δ {maxShift}</div>
        </div>
      </div>
      {diagnostics.smallSeedNotice && <BasisBadge tone="warn">{diagnostics.smallSeedNotice}</BasisBadge>}
      {comparisonRows.length > 0 && (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "Ranking stability preview", "Ranking stability preview")}: </strong>
          {comparisonRows.slice(0, 3).map(row => `${row.name}: Manual #${row.ranks.manual || "—"} / Equal #${row.ranks.equal || "—"} / CRITIC #${row.ranks.critic || "—"} / Hybrid #${row.ranks.hybrid || "—"}`).join(" · ")}
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {warnings.map(warning => <div key={warning} style={{ color: t.warn, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9, fontSize: 11.5, lineHeight: 1.45 }}>{warning}</div>)}
        </div>
      )}
    </Card>
  )
}

export function MethodComparisonTable({ model, t, lang, isMobile }) {
  const rows = model.diagnostics?.methodComparison?.rows || []
  return (
    <Card t={t}>
      <MiniTitle t={t} title={text(lang, "Method comparison", "Method comparison")} subtitle={text(lang, "比较 Manual / Equal / CRITIC / Hybrid 下的候选排名变化。", "Compare candidate rank changes under Manual / Equal / CRITIC / Hybrid.")} />
      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ width: "100%", minWidth: isMobile ? 650 : 720, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 8px" }}>Candidate</th><th>Manual</th><th>Equal</th><th>CRITIC</th><th>Hybrid</th><th>Max shift</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map(row => (
              <tr key={row.id} style={{ color: t.muted, fontSize: 12 }}>
                <td style={{ background: t.surface, padding: 9, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{row.name}</td>
                <td style={{ background: t.surface, padding: 9 }}>{row.ranks.manual || "—"}</td>
                <td style={{ background: t.surface, padding: 9 }}>{row.ranks.equal || "—"}</td>
                <td style={{ background: t.surface, padding: 9 }}>{row.ranks.critic || "—"}</td>
                <td style={{ background: t.surface, padding: 9 }}>{row.ranks.hybrid || "—"}</td>
                <td style={{ background: t.surface, padding: 9, borderRadius: "0 7px 7px 0" }}>{row.maxRankShift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function DescriptorRegistryViewer({ t, lang, isMobile }) {
  const descriptors = useMemo(() => getAllDescriptors({ includePlanned: true }), [])
  return (
    <Card t={t} style={{ display: "grid", gap: 10 }}>
      <MiniTitle
        t={t}
        title={text(lang, "Descriptor Registry", "Descriptor Registry")}
        subtitle={text(lang, "全站描述符定义的唯一来源：单位、方向、normalizer、缺失策略、证据要求与 preset 使用情况。", "Single source for descriptor units, direction, normalizer, missing policy, evidence requirements, and preset usage.")}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: isMobile ? 920 : 980, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 8px" }}>Name</th><th>Group</th><th>Unit</th><th>Direction</th><th>Normalizer</th><th>Missing policy</th><th>Evidence</th><th>Presets</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {descriptors.map(descriptor => (
              <tr key={descriptor.key} style={{ color: t.muted, fontSize: 12 }}>
                <td style={{ background: t.surface, padding: 9, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{lang === "zh" ? descriptor.labelZh : descriptor.label}</td>
                <td style={{ background: t.surface, padding: 9 }}>{getDescriptorGroup(descriptor.group).label}</td>
                <td style={{ background: t.surface, padding: 9, fontFamily: FONT_MONO }}>{descriptor.unit || "—"}</td>
                <td style={{ background: t.surface, padding: 9 }}>{descriptor.direction}</td>
                <td style={{ background: t.surface, padding: 9 }}>{descriptor.normalizer}</td>
                <td style={{ background: t.surface, padding: 9 }}>{descriptor.missingPolicy}</td>
                <td style={{ background: t.surface, padding: 9 }}>{descriptor.evidenceRequired ? "required" : "optional"}</td>
                <td style={{ background: t.surface, padding: 9 }}>{getDescriptorUsageByPreset(descriptor.key, DESCRIPTOR_PRESETS).join(", ") || "—"}</td>
                <td style={{ background: t.surface, padding: 9, borderRadius: "0 7px 7px 0" }}>{descriptor.planned ? "planned" : "current"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
