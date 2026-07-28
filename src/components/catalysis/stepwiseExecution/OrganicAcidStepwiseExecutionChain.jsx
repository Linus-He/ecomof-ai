import { useEffect, useMemo, useRef, useState } from "react"
import { NumericText, organicAcidPalette as palette, ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT } from "../FormulaInline"
import {
  DescriptorMappingExplanationPanel,
  DescriptorAblationChart,
  DescriptorContributionBar,
  FactorCompressionWaterfall,
  FinalResultSummary,
  GuestDumbbellChart,
  GuestScoreBreakdownChart,
  HgcpsFactorRose,
  HostFactorRose,
  HostScoreBreakdownChart,
  PathwayFlowDiagram,
  PathwayEvidenceHeatmap,
  RouteFactorComparisonChart,
  ScoreProvenanceTrace,
  TerminologyCrosswalkPanel,
  ValidationCoverageMatrix,
  ValidationReadinessDonut,
} from "../scoreProvenance"

const GRADE_TONE = { seed: "info", proxy: "risk", curated: "good", inferred: "muted" }

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function fmt(value, digits = 3) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0"
  return next.toFixed(digits)
}

function pct(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0%"
  return `${Math.round(Math.max(0, Math.min(1, next)) * 100)}%`
}

function truncate(value, length = 28) {
  const next = String(value || "pending")
  return next.length > length ? `${next.slice(0, length - 1)}…` : next
}

function cardStyle(style = {}) {
  return {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    display: "grid",
    gap: 9,
    minWidth: 0,
    padding: 12,
    ...style,
  }
}

function buttonStyle(active = false, style = {}) {
  return {
    background: active ? palette.accentSoft : palette.bg,
    border: `1px solid ${active ? palette.accent : palette.border}`,
    borderRadius: 8,
    color: active ? palette.accent : palette.text,
    cursor: "pointer",
    fontFamily: ORGANIC_ACID_FONT,
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.35,
    minHeight: 34,
    padding: "8px 10px",
    textAlign: "left",
    ...style,
  }
}

function Pill({ children, tone = "info" }) {
  const colors = tone === "risk"
    ? [palette.riskSoft, palette.risk, palette.risk]
    : tone === "good"
      ? [palette.positiveSoft, palette.positive, palette.positive]
      : tone === "muted"
        ? [palette.bg, palette.borderStrong, palette.faint]
        : [palette.accentSoft, palette.accent, palette.accent]
  return (
    <span style={{ alignItems: "center", background: colors[0], border: `1px solid ${colors[1]}`, borderRadius: 999, color: colors[2], display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

function SectionTitle({ kicker, title, note }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>{kicker}</div>
      <h2 style={{ color: palette.text, fontSize: 19, lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {note ? <p style={{ color: palette.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
    </div>
  )
}

function ChartTitle({ model, lang }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
      <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, model.subtitleZh, model.subtitleEn)}</span>
    </div>
  )
}

function Bar({ value, tone = palette.accent }) {
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
      <span style={{ background: tone, display: "block", height: "100%", width: pct(value) }} />
    </div>
  )
}

export function StepObjectiveInputOutputChart({ model, lang = "zh", withTestId = true }) {
  const rows = asArray(model.rows)
  return (
    <div data-testid={withTestId ? "objective-input-output-chart" : undefined} style={cardStyle({ background: palette.bg })}>
      <ChartTitle model={model} lang={lang} />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "输入数据", "Inputs")}</strong>
          {rows.map(row => (
            <div key={row.id} style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) 42px" }}>
              <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, row.labelZh, row.labelEn)}</span>
              <NumericText style={{ color: palette.accent, fontSize: 13, fontWeight: 950, textAlign: "right" }}>{row.value}</NumericText>
            </div>
          ))}
        </div>
        <div style={cardStyle({ alignContent: "center", background: palette.accentSoft, textAlign: "center" })}>
          <strong style={{ color: palette.accent, fontSize: 13.5 }}>{text(lang, model.algorithmLabelZh, model.algorithmLabelEn)}</strong>
          <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, "目标产物", "Target product")}: {model.targetProduct}</span>
          <Pill tone="muted">{model.readinessLevel}</Pill>
        </div>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "输出实验路线", "Output route")}</strong>
          <span style={{ color: palette.accent, fontSize: 15, fontWeight: 950 }}>{model.outputRoute}</span>
          <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{model.outputRouteType}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(lang === "zh" ? model.boundariesZh : model.boundariesEn).map(item => <Pill key={item} tone="risk">{item}</Pill>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PathwayCoverageChart({ model, lang = "zh", withTestId = true }) {
  const maxEvidence = Math.max(1, ...asArray(model.rows).map(row => Number(row.evidenceCount) || 0))
  return (
    <div data-testid={withTestId ? "pathway-coverage-chart" : undefined} data-row-count={asArray(model.rows).length} style={cardStyle({ background: palette.bg })}>
      <ChartTitle model={model} lang={lang} />
      <div style={{ display: "grid", gap: 8 }}>
        {asArray(model.rows).map(row => (
          <div key={row.id} style={{ display: "grid", gap: 7, gridTemplateColumns: "minmax(120px, 0.9fr) minmax(160px, 1.2fr) 70px", alignItems: "center" }}>
            <span style={{ color: palette.text, fontSize: 11.8, fontWeight: 850 }}>{truncate(row.labelZh, 28)}</span>
            <div style={{ display: "grid", gap: 5 }}>
              <Bar value={(Number(row.evidenceCount) || 0) / maxEvidence} tone={row.riskFlag ? palette.mixed : palette.accent} />
              <Bar value={row.confidenceValue} tone={palette.positive} />
            </div>
            <span style={{ color: row.riskFlag ? palette.risk : palette.faint, fontSize: 11, textAlign: "right" }}>{row.evidenceCount} ev · {row.descriptorCount} desc</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DescriptorMappingGraph({ model, lang = "zh", withTestId = true }) {
  const steps = asArray(model.steps)
  const descriptors = asArray(model.descriptors)
  const edges = asArray(model.edges)
  const height = Math.max(240, Math.max(steps.length, descriptors.length) * 52 + 40)
  const stepY = index => 36 + index * ((height - 72) / Math.max(1, steps.length - 1 || 1))
  const descriptorY = index => 36 + index * ((height - 72) / Math.max(1, descriptors.length - 1 || 1))
  const descriptorById = new Map(descriptors.map((row, index) => [row.id, { ...row, y: descriptorY(index) }]))
  const stepById = new Map(steps.map((row, index) => [row.id, { ...row, y: stepY(index) }]))
  return (
    <div data-testid={withTestId ? "descriptor-mapping-graph" : undefined} data-row-count={descriptors.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <ChartTitle model={model} lang={lang} />
      <svg viewBox={`0 0 720 ${height}`} role="img" aria-label={text(lang, model.titleZh, model.titleEn)} style={{ minWidth: 620, width: "100%", height: "auto", fontFamily: ORGANIC_ACID_FONT }}>
        {edges.map(edge => {
          const source = stepById.get(edge.source)
          const target = descriptorById.get(edge.target)
          if (!source || !target) return null
          const edgeWeight = 1.4 + Math.min(4, Math.max(0, Number(target.descriptorCount) || 0) * 0.45)
          return <path key={edge.id} d={`M 220 ${source.y} C 320 ${source.y}, 390 ${target.y}, 500 ${target.y}`} fill="none" stroke={edge.evidenceType?.includes("missing") || target.missingCount ? palette.risk : palette.borderStrong} strokeWidth={edgeWeight} strokeOpacity={target.missingCount ? 0.75 : 0.9} />
        })}
        {steps.map((step, index) => (
          <g key={step.id} transform={`translate(24 ${stepY(index) - 18})`}>
            <rect width="180" height="36" rx="8" fill={palette.surfaceStrong} stroke={palette.border} />
            <text x="10" y="22" fill={palette.text} fontSize="11.5" fontWeight="850">{truncate(text(lang, step.labelZh, step.labelEn), 24)}</text>
            <title>{text(lang, step.labelZh, step.labelEn)}</title>
          </g>
        ))}
        {descriptors.map((descriptor, index) => (
          <g key={descriptor.id} transform={`translate(516 ${descriptorY(index) - 20})`}>
            <rect width="180" height="40" rx="8" fill={descriptor.missingCount ? palette.riskSoft : palette.accentSoft} stroke={descriptor.missingCount ? palette.risk : palette.accent} />
            <text x="10" y="18" fill={palette.text} fontSize="11.5" fontWeight="850">{truncate(text(lang, descriptor.labelZh, descriptor.labelEn), 22)}</text>
            <text x="10" y="32" fill={palette.faint} fontSize="10.5">{descriptor.descriptorCount} descriptors · {descriptor.confidenceLevel}</text>
            <title>{text(lang, descriptor.labelZh, descriptor.labelEn)}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}

function RankingBarChart({ model, rowLabel, scoreKey = "score", testId, lang, onSelectRow }) {
  const rows = asArray(model.rows)
  const maxScore = Math.max(0.01, Number(model.maxScore) || Math.max(...rows.map(row => Number(row[scoreKey]) || 0), 0.01))
  return (
    <div data-testid={testId} data-row-count={rows.length} style={cardStyle({ background: palette.bg })}>
      <ChartTitle model={model} lang={lang} />
      <div style={{ display: "grid", gap: 8 }}>
        {rows.slice(0, 8).map(row => {
          const selected = Boolean(row.selected)
          return (
            <button key={row.id || row.routeId || row.labelZh} type="button" onClick={() => onSelectRow?.(row)} style={{ ...buttonStyle(selected), display: "grid", gap: 7 }}>
              <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <span style={{ color: palette.text, fontSize: 12.2, fontWeight: 900 }}>#{row.rank} {row[rowLabel] || row.labelZh}</span>
                <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 950 }}>{fmt(row[scoreKey], 3)}</NumericText>
              </div>
              <Bar value={(Number(row[scoreKey]) || 0) / maxScore} tone={selected ? palette.positive : palette.accent} />
              <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.4 }}>{row.whySelectedZh || row.whyRankedHereZh || row.advantageZh || row.mainReason}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function HostRankingChart({ model, lang = "zh", onSelectRow, withTestId = true }) {
  return <RankingBarChart model={model} rowLabel="host" testId={withTestId ? "host-ranking-chart" : undefined} lang={lang} onSelectRow={onSelectRow} />
}

export function GuestRankingChart({ model, lang = "zh", onSelectRow, withTestId = true }) {
  return <RankingBarChart model={model} rowLabel="metal" testId={withTestId ? "guest-ranking-chart" : undefined} lang={lang} onSelectRow={onSelectRow} />
}

export function RouteHgcpsBreakdownChart({ model, lang = "zh", onSelectRow, withTestId = true }) {
  const rows = asArray(model.rows)
  const maxScore = Math.max(0.01, Number(model.maxScore) || Math.max(...rows.map(row => Number(row.hgcps) || 0), 0.01))
  return (
    <div data-testid={withTestId ? "route-hgcps-breakdown-chart" : undefined} data-row-count={rows.length} style={cardStyle({ background: palette.bg })}>
      <ChartTitle model={model} lang={lang} />
      <div style={{ display: "grid", gap: 8 }}>
        {rows.slice(0, 8).map(row => (
          <button key={row.routeId} type="button" onClick={() => onSelectRow?.(row)} style={{ ...buttonStyle(row.selected), display: "grid", gap: 7 }}>
            <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <span style={{ color: palette.text, fontSize: 12.2, fontWeight: 900 }}>#{row.rank} {row.route}</span>
              <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 950 }}>HGCPS {fmt(row.hgcps, 3)}</NumericText>
            </div>
            <Bar value={(Number(row.hgcps) || 0) / maxScore} tone={row.selected ? palette.positive : palette.accent} />
            <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.4 }}>{row.whyRankedHereZh}</span>
          </button>
        ))}
      </div>
      <div style={cardStyle({ background: palette.surfaceStrong })}>
        <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, "选中路线因子分解", "Selected route factor breakdown")}: {model.selectedRoute}</strong>
        {asArray(model.factorRows).map(row => (
          <div key={row.id} style={{ display: "grid", gap: 7, gridTemplateColumns: "minmax(0, 1fr) 48px", alignItems: "center" }}>
            <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, row.labelZh, row.labelEn)}</span>
            <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 950, textAlign: "right" }}>{fmt(row.value, 2)}</NumericText>
            <div style={{ gridColumn: "1 / -1" }}><Bar value={row.value} tone={row.id === "riskRetention" ? palette.risk : palette.accent} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ValidationMatrixCoverageChart({ model, lang = "zh", withTestId = true }) {
  return (
    <div data-testid={withTestId ? "validation-matrix-coverage-chart" : undefined} data-row-count={asArray(model.rows).length} style={cardStyle({ background: palette.bg })}>
      <ChartTitle model={model} lang={lang} />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {asArray(model.rows).map(row => (
          <div key={row.id} style={cardStyle({ background: row.covered ? palette.positiveSoft : palette.riskSoft, padding: 10 })}>
            <strong style={{ color: row.covered ? palette.positive : palette.risk, fontSize: 12 }}>{text(lang, row.labelZh, row.labelEn)}</strong>
            <NumericText style={{ color: palette.text, fontSize: 16, fontWeight: 950 }}>{row.count}</NumericText>
            <span style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.4 }}>{asArray(row.examples).slice(0, 2).join("; ") || text(lang, "待补覆盖", "coverage pending")}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <Pill tone="good">{text(lang, "实验项", "experiments")}: {model.experimentCount}</Pill>
        <Pill>{text(lang, "必填字段", "required fields")}: {model.requiredFieldCount}</Pill>
        <Pill tone="risk">{model.readinessLevel}</Pill>
      </div>
    </div>
  )
}

export function OrganicAcidStepComparisonChart({ model, lang = "zh", onSelectRow, withTestId = true }) {
  if (!model) return null
  if (model.type === "pathway-coverage") return <PathwayCoverageChart model={model} lang={lang} withTestId={withTestId} />
  if (model.type === "descriptor-mapping") return <DescriptorMappingGraph model={model} lang={lang} withTestId={withTestId} />
  if (model.type === "host-ranking") return <HostRankingChart model={model} lang={lang} onSelectRow={onSelectRow} withTestId={withTestId} />
  if (model.type === "guest-ranking") return <GuestRankingChart model={model} lang={lang} onSelectRow={onSelectRow} withTestId={withTestId} />
  if (model.type === "route-hgcps-breakdown") return <RouteHgcpsBreakdownChart model={model} lang={lang} onSelectRow={onSelectRow} withTestId={withTestId} />
  if (model.type === "validation-matrix-coverage") return <ValidationMatrixCoverageChart model={model} lang={lang} withTestId={withTestId} />
  return <StepObjectiveInputOutputChart model={model} lang={lang} withTestId={withTestId} />
}

export function StepMiniMap({ miniMap, lang = "zh", onSelectStep }) {
  return (
    <section data-testid="organic-acid-step-mini-map" style={cardStyle({ background: palette.surfaceStrong })}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, miniMap.titleZh, miniMap.titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, miniMap.roleZh, miniMap.roleEn)}</span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {asArray(miniMap.nodes).map(node => (
          <button key={node.id} type="button" onClick={() => onSelectStep?.(node.id)} style={{ ...buttonStyle(node.active), alignItems: "center", display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)" }}>
            <span style={{ background: node.active ? palette.accent : palette.surface, border: `1px solid ${node.active ? palette.accent : palette.borderStrong}`, borderRadius: 999, color: node.active ? "#fff" : palette.faint, display: "inline-flex", fontSize: 10.5, fontWeight: 950, height: 20, justifyContent: "center", alignItems: "center" }}>{node.id.replace("step-", "")}</span>
            <span>{node.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function StepNavigator({ navigator, miniMap, lang = "zh", onSelectStep, onRunToggle, isRunning = false }) {
  return (
    <aside data-testid="organic-acid-step-navigator" style={{ display: "grid", gap: 12, alignSelf: "start", maxHeight: "calc(100vh - 104px)", overflowX: "hidden", overflowY: "auto", paddingRight: 4, position: "sticky", scrollbarColor: `${palette.borderStrong} ${palette.surface}`, scrollbarWidth: "thin", top: 88 }}>
      <section style={cardStyle({ background: palette.bg })}>
        <SectionTitle kicker="Step Navigator" title="Step Navigator" note={text(lang, "点击 Step 同步右侧解释区。", "Click a step to sync the explanation panel.")} />
        <button type="button" data-testid="organic-acid-run-control" aria-pressed={isRunning} onClick={onRunToggle} style={{ ...buttonStyle(isRunning), color: isRunning ? palette.risk : palette.accent, textAlign: "center" }}>
          {isRunning ? text(lang, navigator.stopTraceLabelZh, navigator.stopTraceLabelEn) : text(lang, navigator.startTraceLabelZh, navigator.startTraceLabelEn)}
        </button>
        <div style={{ display: "grid", gap: 7 }}>
          {asArray(navigator.items).map(item => (
            <button key={item.id} type="button" data-step-id={item.id} data-selected={item.active ? "true" : "false"} onClick={() => onSelectStep?.(item.id, item.anchorId)} style={buttonStyle(item.active)}>
              <span style={{ color: item.active ? palette.accent : palette.faint, display: "block", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 950 }}>{item.isFinal ? "Final" : `Step ${item.stepNumber}`}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>
      <StepMiniMap miniMap={miniMap} lang={lang} onSelectStep={onSelectStep} />
    </aside>
  )
}

function FieldBlock({ label, children }) {
  return (
    <div style={cardStyle({ background: palette.bg, padding: 10 })}>
      <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900 }}>{label}</span>
      <div style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

function StructuredConclusionCards({ model, lang, compact = false }) {
  const segments = asArray(model?.segments)
  if (!segments.length) return null
  return (
    <div data-testid="structured-conclusion" data-row-count={segments.length} style={{ display: "grid", gap: compact ? 6 : 8, gridTemplateColumns: compact ? "repeat(auto-fit, minmax(170px, 1fr))" : "1fr" }}>
      {segments.map(segment => (
        <div key={segment.id} style={cardStyle({ background: palette.bg, padding: compact ? 9 : 10 })}>
          <strong style={{ color: palette.text, fontSize: compact ? 11.2 : 12 }}>{text(lang, segment.labelZh, segment.labelEn)}</strong>
          <span style={{ color: palette.muted, fontSize: compact ? 10.8 : 11.6, lineHeight: 1.5 }}>{text(lang, segment.bodyZh, segment.bodyEn)}</span>
        </div>
      ))}
    </div>
  )
}

function CompetitionPreview({ rows, lang }) {
  if (!Array.isArray(rows)) return <span>{rows}</span>
  const previewRows = rows.some(row => row.route) ? rows.slice(0, 25) : rows.slice(0, 5)
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {previewRows.map(row => (
        <div key={row.id || row.routeId || row.labelZh} style={{ background: row.selected ? palette.accentSoft : palette.surface, border: `1px solid ${row.selected ? palette.accent : palette.border}`, borderRadius: 8, display: "grid", gap: 5, gridTemplateColumns: "34px minmax(0, 1fr) 58px", padding: 8 }}>
          <NumericText style={{ color: palette.faint, fontSize: 12, fontWeight: 950 }}>#{row.rank}</NumericText>
          <span style={{ color: palette.text, fontSize: 11.8, fontWeight: 900, minWidth: 0 }}>{row.host || row.metal || row.route || row.labelZh}</span>
          <NumericText style={{ color: palette.accent, fontSize: 11.8, fontWeight: 950, textAlign: "right" }}>{fmt(row.score ?? row.hgcps, 3)}</NumericText>
          <span style={{ color: palette.muted, fontSize: 11.2, gridColumn: "2 / -1", lineHeight: 1.4 }}>{row.whySelectedZh || row.whyRankedHereZh || text(lang, "竞争解释由 builder 输出。", "Competition explanation from builder.")}</span>
        </div>
      ))}
    </div>
  )
}

export function ExecutionStepCard({ step, lang = "zh", selected, onSelectStep, onTrace, onOpenMethodology, onOpenActivationCenter, onOpenAdvancedTab, onSelectComparison }) {
  const openDetail = button => {
    if (button.target === "activation") {
      onOpenActivationCenter?.()
    } else if (button.target === "evidence") {
      onOpenAdvancedTab?.("evidence")
    } else if (button.target === "competition-route") {
      onOpenAdvancedTab?.("sensitivity")
    } else if (button.target === "competition-host" || button.target === "competition-guest") {
      onSelectStep?.(step.id, step.anchorId)
    } else if (button.target === "start-chain") {
      onTrace?.()
    } else if (button.id === "methodology") {
      onOpenMethodology?.(button.target)
    } else {
      onSelectStep?.(step.id, step.anchorId)
    }
  }
  return (
    <article
      id={step.anchorId}
      data-testid={`organic-acid-execution-${step.id}`}
      style={{
        ...cardStyle({ background: selected ? palette.surfaceStrong : palette.bg, border: `1px solid ${selected ? palette.accent : palette.border}`, padding: 14, scrollMarginTop: 118 }),
      }}
    >
      <button type="button" onClick={() => onSelectStep?.(step.id, step.anchorId)} style={{ ...buttonStyle(selected), display: "grid", gap: 6 }}>
        <span style={{ color: selected ? palette.accent : palette.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12, fontWeight: 950 }}>STEP {step.stepNumber}</span>
        <strong style={{ color: palette.text, fontSize: 18, lineHeight: 1.2 }}>{step.nameZh}</strong>
        {step.stepNumber === 0 ? <span style={{ color: palette.muted, fontSize: 11.5 }}>{step.eyebrowZh || "Screening Objective / 筛选目标"}</span> : null}
      </button>
      {step.stepNumber === 0 ? (
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {asArray(step.dynamicChartModel?.rows).slice(0, 4).map(row => (
            <div key={row.id} style={cardStyle({ background: palette.surfaceStrong, padding: 10 })}>
              <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900 }}>{row.labelZh}</span>
              <NumericText style={{ color: palette.accent, fontSize: 20, fontWeight: 950 }}>{row.value}</NumericText>
              <span style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.4 }}>{row.noteZh}</span>
            </div>
          ))}
        </div>
      ) : null}
      {/* Middle cards answer what happened; the right Why Panel owns source, formula, risk, and rationale detail. */}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {step.whyPanelEnhanced?.structuredConclusion ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <StructuredConclusionCards model={step.whyPanelEnhanced.structuredConclusion} lang={lang} compact />
          </div>
        ) : (
          <FieldBlock label={text(lang, "一句话结果 Result", "One-line result")}>{step.whyPanelEnhanced?.conclusionZh || step.result}</FieldBlock>
        )}
        <FieldBlock label={text(lang, "候选竞争 Competition", "Competition")}><CompetitionPreview rows={step.competition} lang={lang} /></FieldBlock>
      </div>
      <OrganicAcidStepComparisonChart
        model={step.dynamicChartModel}
        lang={lang}
        withTestId
        onSelectRow={row => onSelectComparison?.({ stepId: step.id, chartType: step.dynamicChartModel?.type, row })}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {step.stepNumber === 0 ? (
          <button type="button" onClick={onTrace} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
            {text(lang, "开始链式追踪", "Start stepwise trace")}
          </button>
        ) : null}
        {step.buttons.map(button => (
          <button key={button.id} type="button" onClick={() => openDetail(button)} style={{ ...buttonStyle(false), color: button.id === "methodology" ? palette.accent : palette.text, textAlign: "center" }}>
            {text(lang, button.labelZh, button.labelEn)}
          </button>
        ))}
      </div>
    </article>
  )
}

function WhyPanelGradeBadge({ grade, labelZh, labelEn, lang }) {
  const tone = GRADE_TONE[grade] || "info"
  return <Pill tone={tone === "risk" ? "risk" : tone === "good" ? "good" : tone === "muted" ? "muted" : "info"}>{text(lang, labelZh, labelEn)}</Pill>
}

function WhyPanelMainChart({ stepId, step, enhanced, lang, onSelectComparison, onOpenActivationCenter, selectedFactorKey, onSelectFactor }) {
  if (stepId === "step-1") {
    return <PathwayFlowDiagram model={step?.dynamicChartModel} lang={lang} />
  }
  if (stepId === "step-2") {
    return (
      <OrganicAcidStepComparisonChart
        model={step?.dynamicChartModel}
        lang={lang}
        withTestId={false}
        onSelectRow={row => onSelectComparison?.({ stepId, chartType: step?.dynamicChartModel?.type, row })}
      />
    )
  }
  if (stepId === "step-3" && enhanced?.provenance) {
    return <HostFactorRose model={enhanced.provenance} comparisonModels={enhanced.comparisonProvenances} lang={lang} factorDetails={enhanced.perFactorInterpretation} factorEvidence={enhanced.factorEvidence} selectedFactorKey={selectedFactorKey} onSelectFactor={onSelectFactor} />
  }
  if (stepId === "step-4" && enhanced?.provenance) {
    return <GuestDumbbellChart models={enhanced.comparisonProvenances} model={enhanced.provenance} lang={lang} />
  }
  if (stepId === "step-5" && enhanced?.factorCompressionTrace) {
    return (
      <div style={{ display: "grid", gap: 9 }}>
        <HgcpsFactorRose model={enhanced.provenance} overlayRoute={enhanced.comparisonProvenances?.[1]} lang={lang} factorDetails={enhanced.perFactorInterpretation} factorEvidence={enhanced.factorEvidence} selectedFactorKey={selectedFactorKey} onSelectFactor={onSelectFactor} />
        <FactorCompressionWaterfall model={enhanced.factorCompressionTrace} lang={lang} />
      </div>
    )
  }
  if (stepId === "step-6" && enhanced?.validationCoverageMatrix) {
    return (
      <div style={{ display: "grid", gap: 9 }}>
        <ValidationReadinessDonut model={enhanced.validationCoverageMatrix} lang={lang} />
        <ValidationCoverageMatrix
          model={enhanced.validationCoverageMatrix}
          summary={enhanced.closureSummary}
          lang={lang}
          onOpenActivationCenter={onOpenActivationCenter}
          onDownloadTemplate={onOpenActivationCenter}
          onViewFeedbackRules={onOpenActivationCenter}
        />
      </div>
    )
  }
  return (
    <OrganicAcidStepComparisonChart
      model={step?.dynamicChartModel}
      lang={lang}
      withTestId={false}
      onSelectRow={row => onSelectComparison?.({ stepId, chartType: step?.dynamicChartModel?.type, row })}
    />
  )
}

function CompactInfoGrid({ step, panel, lang }) {
  const rows = [
    [text(lang, "输入 Input", "Input"), asArray(step?.input).join("; ") || asArray(panel?.inputs).join("; ")],
    [text(lang, "计算逻辑 Logic", "Logic"), step?.logic || panel?.logic],
    [text(lang, "公式 / 规则", "Formula or rule"), step?.formula],
    [text(lang, "结果 Result", "Result"), step?.result || panel?.result],
    [text(lang, "风险 Risk", "Risk"), step?.risk || panel?.risk],
    [text(lang, "下一步 Next", "Next"), step?.next || panel?.next],
  ]
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map(([label, value]) => (
        <FieldBlock key={label} label={label}>{value || text(lang, "待补充", "pending")}</FieldBlock>
      ))}
    </div>
  )
}

function PerFactorInterpretationTable({ rows, lang, selectedFactorKey = "", onSelectFactor }) {
  const items = asArray(rows)
  if (!items.length) return <span style={{ color: palette.faint, fontSize: 12 }}>{text(lang, "暂无逐因子解释。", "No per-factor interpretation.")}</span>
  return (
    <div data-testid="per-factor-interpretation-table" data-row-count={items.length} style={{ display: "grid", gap: 7 }}>
      {items.map(row => {
        const selected = row.factorKey === selectedFactorKey
        return (
        <button type="button" key={row.factorKey} onClick={() => onSelectFactor?.(selected ? "" : row.factorKey)} style={{ ...cardStyle({ background: selected ? palette.accentSoft : palette.surface, border: `1px solid ${selected ? palette.accent : palette.border}`, padding: 10 }), cursor: "pointer", textAlign: "left" }}>
          <div style={{ alignItems: "baseline", display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
            <strong style={{ color: palette.text, fontSize: 11.8 }}>{text(lang, row.labelZh, row.labelEn)}</strong>
            <NumericText style={{ color: palette.accent, fontSize: 11.8, fontWeight: 950 }}>{fmt(row.normalizedValue, 3)}</NumericText>
            <Pill tone={row.levelKey === "low" ? "risk" : row.levelKey === "high" ? "good" : "info"}>{text(lang, row.levelTag, row.levelTagEn)}</Pill>
          </div>
          <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.5 }}>{text(lang, row.interpretationZh, row.interpretationEn)}</span>
          <span style={{ color: palette.faint, fontSize: 10.8 }}>{row.sourceField} · {row.dataGrade} · contribution {fmt(row.contribution, 4)}</span>
        </button>
        )
      })}
    </div>
  )
}

function FactorDeltaTableView({ rows, lang }) {
  const items = asArray(rows)
  if (!items.length) return <span style={{ color: palette.faint, fontSize: 12 }}>{text(lang, "暂无对照路线对比。", "No runner-up / third comparison.")}</span>
  return (
    <div data-testid="factor-delta-table" data-row-count={items.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      {items.map(row => (
        <div key={row.factorKey} style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "minmax(120px,1fr) repeat(5, minmax(46px, auto))" }}>
          <strong style={{ color: row.isDominantGap ? palette.accent : palette.text, fontSize: 11.5 }}>{text(lang, row.labelZh, row.labelEn)}</strong>
          <span style={{ color: palette.muted, fontSize: 10.8 }}>Top {fmt(row.topValue, 2)}</span>
          <span style={{ color: palette.muted, fontSize: 10.8 }}>Runner {fmt(row.secondValue, 2)}</span>
          <span style={{ color: palette.muted, fontSize: 10.8 }}>Third {fmt(row.thirdValue, 2)}</span>
          <span style={{ color: row.deltaSecond >= 0 ? palette.positive : palette.risk, fontSize: 10.8, fontWeight: 900 }}>Δ runner {row.deltaSecond >= 0 ? "+" : ""}{fmt(row.deltaSecond, 2)}</span>
          <span style={{ color: row.isDominantGap ? palette.accent : palette.faint, fontSize: 10.5 }}>{row.isDominantGap ? text(lang, "主差异", "dominant") : ""}</span>
        </div>
      ))}
    </div>
  )
}

function FactorEvidenceList({ rows, lang }) {
  const items = asArray(rows)
  if (!items.length) return <span style={{ color: palette.faint, fontSize: 12 }}>{text(lang, "暂无证据映射。", "No evidence mapping.")}</span>
  return (
    <div data-testid="factor-evidence-list" data-row-count={items.length} style={{ display: "grid", gap: 7 }}>
      {items.slice(0, 12).map(row => (
        <div key={`${row.factorKey}-${row.evidenceId}`} style={cardStyle({ background: palette.surface, padding: 10 })}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Pill tone={row.factorKey === "route-level" ? "muted" : "info"}>{text(lang, row.factorLabelZh, row.factorLabelEn)}</Pill>
            <Pill tone={row.sameCondition ? "good" : "risk"}>{row.sameCondition ? text(lang, "同条件", "same condition") : text(lang, "非同条件", "not same condition")}</Pill>
            <Pill tone="muted">{row.directness}</Pill>
          </div>
          <strong style={{ color: palette.text, fontSize: 11.6 }}>{row.evidenceId}</strong>
          <span style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.45 }}>{row.supports}</span>
          <span style={{ color: palette.faint, fontSize: 10.8 }}>{row.citation} · {row.sourceUrl}</span>
          <span style={{ color: palette.risk, fontSize: 10.8 }}>{text(lang, row.noteZh, row.noteEn)} · {row.limitation}</span>
        </div>
      ))}
    </div>
  )
}

function RiskCounterfactualPanel({ risk, counterfactual, why, lang }) {
  const counterRows = asArray(counterfactual)
  return (
    <div data-testid="risk-counterfactual-panel" style={{ display: "grid", gap: 8 }}>
      {risk ? (
        <div style={cardStyle({ background: palette.bg })}>
          <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, "风险保留分解", "Risk retention decomposition")}</strong>
          <span style={{ color: palette.muted, fontSize: 11.5 }}>Risk Retention {fmt(risk.riskRetention, 3)} · {fmt(risk.scoreBeforeRisk, 3)} → {fmt(risk.finalHGCPS, 3)}</span>
          {asArray(risk.rows).slice(0, 5).map(row => (
            <div key={`${row.riskType}-${row.reason}`} style={{ color: palette.muted, display: "grid", fontSize: 11.2, gap: 3, lineHeight: 1.45 }}>
              <strong style={{ color: palette.risk }}>{row.riskType} · penalty {fmt(row.penalty, 3)}</strong>
              <span>{row.reason}</span>
              <span style={{ color: palette.faint }}>{text(lang, row.explanationZh, row.explanationEn)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {counterRows.length ? (
        <div style={cardStyle({ background: palette.bg })}>
          <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, "单因子反事实", "One-factor counterfactuals")}</strong>
          {counterRows.map(row => (
            <div key={row.factorKey} style={{ display: "grid", gap: 5 }}>
              <span style={{ color: palette.text, fontSize: 11.4, fontWeight: 850 }}>{text(lang, row.labelZh, row.labelEn)} · current {fmt(row.currentValue, 2)}</span>
              <div style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
                {asArray(row.scenarios).map(scenario => (
                  <span key={`${row.factorKey}-${scenario.setValue}`} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 10.8, lineHeight: 1.35, padding: 7 }}>
                    {text(lang, scenario.sentenceZh, scenario.sentenceEn)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {why ? (
        <div style={cardStyle({ background: palette.accentSoft })}>
          <strong style={{ color: palette.accent, fontSize: 12 }}>{text(lang, "为什么不是其他候选", "Why not the other candidates")}</strong>
          <span style={{ color: palette.text, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, why.whyWinnerLeadsZh, why.whyWinnerLeadsEn)}</span>
          <span style={{ color: palette.risk, fontSize: 11.2, lineHeight: 1.45 }}>{text(lang, why.whyRunnerUpNotSelectedZh, why.whyRunnerUpNotSelectedEn)}</span>
          <span style={{ color: palette.faint, fontSize: 10.8 }}>{why.limitation}</span>
        </div>
      ) : null}
    </div>
  )
}

export function StepWhyPanel({ panel, step, enhanced, lang = "zh", embedded = false, onOpenMethodology, onOpenActivationCenter, onOpenAdvancedTab, onSelectComparison }) {
  const model = enhanced || {}
  const stepId = model.stepId || step?.id || panel?.stepId || "step-0"
  const badges = asArray(model.dataGradeBadges)
  const boundaries = asArray(model.boundaries).length ? model.boundaries : asArray(panel?.boundaries).map(item => ({ id: item, zh: item, en: item }))
  const why = model.whyNotOther
  const tabs = [
    { id: "conclusion", labelZh: "结论", labelEn: "Conclusion", show: true },
    { id: "factors", labelZh: "逐因子", labelEn: "Per factor", show: asArray(model.perFactorInterpretation).length > 0 },
    { id: "comparison", labelZh: "对比路线", labelEn: "Compare routes", show: asArray(model.factorDeltaTable).length > 0 || Boolean(model.routeFactorComparison) },
    { id: "descriptor-ablation", labelZh: "描述符影响", labelEn: "Descriptor impact", show: stepId === "step-5" && Boolean(model.descriptorAblation) },
    { id: "evidence", labelZh: "证据 / 文献", labelEn: "Evidence / literature", show: asArray(model.factorEvidence).length > 0 || Boolean(model.provenance) || Boolean(model.pathwayEvidenceHeatmap) || Boolean(model.descriptorMappingExplanation) || Boolean(model.validationCoverageMatrix) },
    { id: "risk", labelZh: "风险 / 反事实", labelEn: "Risk / counterfactual", show: Boolean(model.riskDecomposition) || asArray(model.counterfactual).length > 0 || Boolean(why) },
  ].filter(tab => tab.show)
  const [activeTab, setActiveTab] = useState("conclusion")
  const [selectedFactorKey, setSelectedFactorKey] = useState("")
  const [selectedAblationRouteId, setSelectedAblationRouteId] = useState("")
  useEffect(() => {
    if (!tabs.some(tab => tab.id === activeTab)) setActiveTab(tabs[0]?.id || "conclusion")
  }, [activeTab, tabs])
  useEffect(() => {
    setSelectedFactorKey("")
    setSelectedAblationRouteId("")
  }, [stepId])
  const selectFactor = factorKey => {
    setSelectedFactorKey(factorKey || "")
    if (factorKey && tabs.some(tab => tab.id === "factors")) setActiveTab("factors")
  }
  const asideStyle = {
    ...cardStyle({
      alignSelf: "start",
      background: palette.surfaceStrong,
      maxHeight: embedded ? "none" : "calc(100vh - 104px)",
      overflowX: "hidden",
      overflowY: embedded ? "visible" : "auto",
      paddingRight: embedded ? 12 : 4,
      position: embedded ? "relative" : "sticky",
      scrollbarColor: `${palette.borderStrong} ${palette.surface}`,
      scrollbarWidth: "thin",
      top: 88,
    }),
  }
  return (
    <aside data-testid="organic-acid-step-why-panel" style={asideStyle}>
      <SectionTitle
        kicker="Step Why Panel"
        title={text(lang, model.titleZh || panel?.titleZh, model.titleEn || panel?.titleEn)}
        note={text(lang, model.conclusionZh, model.conclusionEn)}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {badges.map(badge => <WhyPanelGradeBadge key={badge.grade} grade={badge.grade} labelZh={badge.labelZh} labelEn={badge.labelEn} lang={lang} />)}
        {boundaries.map(boundary => <Pill key={boundary.id || boundary.zh} tone="risk">{text(lang, boundary.zh, boundary.en)}</Pill>)}
      </div>

      <WhyPanelMainChart stepId={stepId} step={step} enhanced={model} lang={lang} onSelectComparison={onSelectComparison} onOpenActivationCenter={onOpenActivationCenter} selectedFactorKey={selectedFactorKey} onSelectFactor={selectFactor} />

      <div role="tablist" aria-label={text(lang, "为什么面板分层", "Why panel sections")} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tabs.map(tab => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...buttonStyle(activeTab === tab.id), minHeight: 30, padding: "6px 9px", textAlign: "center" }}>
            {text(lang, tab.labelZh, tab.labelEn)}
          </button>
        ))}
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-conclusion" style={{ display: activeTab === "conclusion" ? "grid" : "none", gap: 8 }}>
        {model.structuredConclusion ? (
          <StructuredConclusionCards model={model.structuredConclusion} lang={lang} />
        ) : (
          <div style={cardStyle({ background: palette.bg })}>
          <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, "一句话结论", "One-line conclusion")}</strong>
          <span style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.5 }}>{text(lang, model.conclusionZh, model.conclusionEn)}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {boundaries.map(boundary => <Pill key={boundary.id || boundary.zh} tone="risk">{text(lang, boundary.zh, boundary.en)}</Pill>)}
          </div>
        </div>
        )}
        <CompactInfoGrid step={step} panel={panel} lang={lang} />
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-factors" style={{ display: activeTab === "factors" ? "grid" : "none", gap: 8 }}>
        <PerFactorInterpretationTable rows={model.perFactorInterpretation} lang={lang} selectedFactorKey={selectedFactorKey} onSelectFactor={selectFactor} />
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-comparison" style={{ display: activeTab === "comparison" ? "grid" : "none", gap: 8 }}>
        <FactorDeltaTableView rows={model.factorDeltaTable} lang={lang} />
        {stepId === "step-5" && model.routeFactorComparison ? <RouteFactorComparisonChart model={model.routeFactorComparison} lang={lang} /> : null}
        {stepId === "step-4" && model.comparisonProvenances ? <GuestScoreBreakdownChart models={model.comparisonProvenances} model={model.provenance} summary={model.whyNotOther} lang={lang} /> : null}
        {stepId === "step-3" && model.provenance ? <HostScoreBreakdownChart model={model.provenance} lang={lang} /> : null}
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-descriptor-ablation" style={{ display: activeTab === "descriptor-ablation" ? "grid" : "none", gap: 8 }}>
        <DescriptorAblationChart
          model={model.descriptorAblation}
          lang={lang}
          selectedRouteId={selectedAblationRouteId}
          onSelectRoute={setSelectedAblationRouteId}
        />
        <DescriptorContributionBar
          model={model.descriptorAblation}
          lang={lang}
          routeId={selectedAblationRouteId || model.descriptorAblation?.layers?.at(-1)?.candidates?.[0]?.routeId}
        />
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-evidence" style={{ display: activeTab === "evidence" ? "grid" : "none", gap: 8 }}>
        <FactorEvidenceList rows={model.factorEvidence} lang={lang} />
        {stepId === "step-1" && model.pathwayEvidenceHeatmap ? <PathwayEvidenceHeatmap model={model.pathwayEvidenceHeatmap} lang={lang} /> : null}
        {stepId === "step-2" && model.descriptorMappingExplanation ? <DescriptorMappingExplanationPanel model={model.descriptorMappingExplanation} summary={model.closureSummary} lang={lang} /> : null}
        {model.provenance ? <ScoreProvenanceTrace provenance={model.provenance} scoreSourceTable={model.scoreSourceTable} lang={lang} /> : null}
        {stepId === "step-5" && model.terminologyCrosswalk ? <TerminologyCrosswalkPanel model={model.terminologyCrosswalk} lang={lang} /> : null}
      </div>

      <div role="tabpanel" data-testid="why-panel-tab-risk" style={{ display: activeTab === "risk" ? "grid" : "none", gap: 8 }}>
        <RiskCounterfactualPanel risk={model.riskDecomposition} counterfactual={model.counterfactual} why={why} lang={lang} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => onOpenMethodology?.(model.methodologyAnchor || step?.methodologyAnchor)} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "查看对应公式", "View formula")}
        </button>
        <button type="button" onClick={() => onOpenAdvancedTab?.(stepId === "step-5" ? "sensitivity" : "risk")} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "打开高级分析", "Open advanced analysis")}
        </button>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "打开实验启用中心", "Open Activation Center")}
        </button>
      </div>
    </aside>
  )
}

export function OrganicAcidStepwiseExecutionChain({
  chain,
  lang = "zh",
  isNarrow = false,
  selectedStepId = "step-0",
  onSelectStep,
  onTrace,
  onOpenMethodology,
  onOpenActivationCenter,
  onOpenAdvancedTab,
  onViewHostStructure,
}) {
  const [selectedComparison, setSelectedComparison] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const runTimerRef = useRef(null)
  useEffect(() => {
    setSelectedComparison(null)
  }, [selectedStepId])
  useEffect(() => () => {
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current)
  }, [])
  const selectedStep = useMemo(() => chain.steps.find(step => step.id === selectedStepId) || chain.steps[chain.steps.length - 1] || chain.steps[0], [chain.steps, selectedStepId])
  const runItems = useMemo(() => [
    ...chain.steps.map(step => ({ id: step.id, anchorId: step.anchorId })),
    { id: "final-result", anchorId: "organic-acid-final-result-summary" },
  ], [chain.steps])
  const stopRun = () => {
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current)
    runTimerRef.current = null
    setIsRunning(false)
  }
  const selectStepManually = (stepId, anchorId) => {
    stopRun()
    onSelectStep?.(stepId, anchorId)
  }
  const runStepwise = () => {
    if (isRunning) {
      stopRun()
      return
    }
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current)
    const intervalMs = Number(chain.navigator?.runIntervalMs) || 900
    setIsRunning(true)
    const advance = index => {
      const item = runItems[index]
      if (!item) {
        setIsRunning(false)
        runTimerRef.current = null
        return
      }
      onSelectStep?.(item.id, item.anchorId)
      if (index >= runItems.length - 1) {
        setIsRunning(false)
        runTimerRef.current = null
        return
      }
      runTimerRef.current = window.setTimeout(() => advance(index + 1), intervalMs)
    }
    advance(0)
  }
  const whyPanel = selectedStep?.id === chain.currentStepWhyPanel?.stepId ? chain.currentStepWhyPanel : {
    ...chain.currentStepWhyPanel,
    stepId: selectedStep.id,
    chart: selectedStep.dynamicChartModel,
  }
  return (
    <section data-testid="organic-acid-stepwise-execution-chain" style={{ ...cardStyle({ background: palette.bg, padding: 14 }), fontFamily: ORGANIC_ACID_FONT }}>
      <SectionTitle
        kicker={chain.version}
        title={text(lang, chain.titleZh, chain.titleEn)}
        note={text(lang, chain.subtitleZh, chain.subtitleEn)}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {chain.boundaries.map(boundary => <Pill key={boundary} tone="risk">{boundary}</Pill>)}
        <Pill tone="good">{text(lang, "实验规划可启用", "Planning-ready")}</Pill>
      </div>
      {(() => {
        const objective = chain.steps.find(step => step.id === "step-0")?.dynamicChartModel || {}
        const objRows = asArray(objective.rows)
        const cnt = id => objRows.find(row => row.id === id)?.value ?? "—"
        return (
          <section data-testid="organic-acid-algorithm-status" style={{ alignItems: "center", background: palette.accentSoft, border: `1px solid ${palette.accent}`, borderRadius: 10, display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", padding: 12 }}>
            <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
              <span style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "当前算法状态", "Current algorithm status")}</span>
              <strong style={{ color: palette.text, fontSize: 13.5, lineHeight: 1.3 }}>
                {text(lang, "HGCPS · 加权几何均值 · 8 个数据派生因子", "HGCPS · weighted geometric mean · 8 data-derived factors")}
              </strong>
              <span style={{ color: palette.muted, fontSize: 11.6, lineHeight: 1.45 }}>
                {text(lang, "目标产物", "Target product")}: {objective.targetProduct || "formic acid / organic acid"} · {text(lang, "在真实数据上计算", "computed on real data")}: pathway {cnt("pathway")} · host {cnt("host")} · guest {cnt("guest")} · route {cnt("route")} · evidence {cnt("evidence")}
              </span>
            </div>
            <button
              type="button"
              data-testid="organic-acid-run-control-primary"
              aria-pressed={isRunning}
              onClick={runStepwise}
              style={{ background: isRunning ? palette.risk : palette.accent, border: "none", borderRadius: 9, color: "#fff", cursor: "pointer", fontFamily: ORGANIC_ACID_FONT, fontSize: 13, fontWeight: 900, justifySelf: isNarrow ? "start" : "end", minHeight: 42, padding: "10px 18px" }}
            >
              {isRunning
                ? text(lang, "⏹ 停止运行", "⏹ Stop run")
                : text(lang, "▶ 运行算法（Step 0 → 6）", "▶ Run algorithm (Step 0 → 6)")}
            </button>
          </section>
        )
      })()}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isNarrow ? "1fr" : "250px minmax(0, 1fr) 350px" }}>
        <StepNavigator
          navigator={chain.navigator}
          miniMap={chain.miniMap}
          lang={lang}
          onSelectStep={selectStepManually}
          onRunToggle={runStepwise}
          isRunning={isRunning}
        />
        <div style={{ display: "grid", gap: 12 }}>
          {chain.steps.map(step => (
            <div key={step.id} style={{ display: "grid", gap: 10 }}>
              <ExecutionStepCard
                step={step}
                lang={lang}
                selected={step.id === selectedStepId}
                onSelectStep={selectStepManually}
                onTrace={runStepwise}
                onOpenMethodology={onOpenMethodology}
                onOpenActivationCenter={onOpenActivationCenter}
                onOpenAdvancedTab={onOpenAdvancedTab}
                onSelectComparison={setSelectedComparison}
              />
              {isNarrow && step.id === selectedStep?.id ? (
                <StepWhyPanel
                  panel={whyPanel}
                  step={selectedStep}
                  enhanced={selectedStep?.whyPanelEnhanced}
                  lang={lang}
                  embedded
                  onOpenMethodology={onOpenMethodology}
                  onOpenActivationCenter={onOpenActivationCenter}
                  onOpenAdvancedTab={onOpenAdvancedTab}
                  onSelectComparison={setSelectedComparison}
                />
              ) : null}
            </div>
          ))}
          <div id="organic-acid-final-result-summary" style={{ scrollMarginTop: 118 }}>
            <FinalResultSummary model={chain.finalResultSummary} lang={lang} onOpenActivationCenter={onOpenActivationCenter} onViewHostStructure={onViewHostStructure} />
          </div>
        </div>
        {!isNarrow && selectedStepId !== "final-result" ? (
          <StepWhyPanel
            panel={whyPanel}
            step={selectedStep}
            enhanced={selectedStep?.whyPanelEnhanced}
            lang={lang}
            onOpenMethodology={onOpenMethodology}
            onOpenActivationCenter={onOpenActivationCenter}
            onOpenAdvancedTab={onOpenAdvancedTab}
            onSelectComparison={setSelectedComparison}
          />
        ) : !isNarrow ? (
          <FinalResultSummary model={chain.finalResultSummary} lang={lang} onOpenActivationCenter={onOpenActivationCenter} onViewHostStructure={onViewHostStructure} withTestId={false} />
        ) : null}
      </div>
    </section>
  )
}
