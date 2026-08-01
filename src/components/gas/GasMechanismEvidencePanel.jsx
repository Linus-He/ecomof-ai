// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, fetchDataJson, formatGasPairLabel, SectionTitle } from "../../shared"
import { formatPending } from "../../utils/formatters"
import { buildGasMechanismEvidence } from "../../utils/gasMechanismEvidence"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function formatNumber(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

function propertyLabel(property, lang) {
  if (!property) return formatPending(lang)
  return text(lang, property.nameZh || property.gas, property.name || property.gas)
}

function gasSizeCell(gas, property, t, lang) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 }}>
        <ChemicalText value={gas || formatPending(lang)} />
      </strong>
      <span style={{ color: t.muted, fontSize: 11.2 }}><ChemicalText value={propertyLabel(property, lang)} /></span>
      <span style={{ color: t.textStrong, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
        {property?.kineticDiameterA == null ? formatPending(lang) : `${formatNumber(property.kineticDiameterA, 2)} A`}
      </span>
      <span style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.4 }}>
        <ChemicalText value={`${property?.polarityClass || "pending"} · ${property?.condensabilityClass || "pending"}`} />
      </span>
    </div>
  )
}

function lookupLabel(target, lang) {
  const source = target?.source
  if (!target) return formatPending(lang)
  return text(
    lang,
    `${target.missingWhenZh || target.missingWhen} → ${source?.label || target.targetSourceId}`,
    `${target.missingWhen} -> ${source?.label || target.targetSourceId}`,
  )
}

export function GasMechanismEvidencePanel({ selected, records = [], scenario = {}, lang = "en", t, isMobile = false, onOpenMethod }) {
  const [propertiesDoc, setPropertiesDoc] = useState(null)

  useEffect(() => {
    let active = true
    fetchDataJson("gas_molecular_properties_v1.json", null)
      .then(data => {
        if (active) setPropertiesDoc(data)
      })
      .catch(() => {
        if (active) setPropertiesDoc(null)
      })
    return () => { active = false }
  }, [])

  const evidence = useMemo(
    () => buildGasMechanismEvidence(selected || {}, scenario, propertiesDoc || {}, records),
    [selected, scenario, propertiesDoc, records],
  )

  if (!selected) return null

  return (
    <section data-testid="gassep-mechanism-evidence" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 14, minWidth: 0, padding: 16 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div>
          <SectionTitle>{text(lang, "机制分类与数据库补全", "Mechanism Classification and Database Backfill")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5, maxWidth: 940 }}>
            {text(
              lang,
              "把平衡热力学、传质动力学、框架响应、穿透过程、湿度/循环拆成独立证据层；缺口会指向可查询数据库或必须人工整理的论文 SI，而不是把缺失值补造成分数。",
              "Separates equilibrium thermodynamics, transport kinetics, framework response, dynamic breakthrough, and robustness into distinct evidence layers. Missing evidence is routed to database or SI lookup targets rather than fabricated into scores.",
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-end" }}>
          <BasisBadge tone={evidence.readiness === "process-ready-evidence" ? "calc" : evidence.readiness === "mechanism-hypothesis-ready" ? "info" : "proxy"}>
            {text(lang, evidence.readinessZh, evidence.readiness)}
          </BasisBadge>
          <BasisBadge tone="info">{formatGasPairLabel(scenario.gasPair || selected.gasPair)}</BasisBadge>
        </div>
      </div>

      <div style={{ display: "grid", gap: 11, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.9fr) minmax(0, 1.1fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 11 }}>
            <span style={{ color: t.faint, fontSize: 10.4, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "主导机理判读", "Primary mechanism read")}</span>
            <strong style={{ color: t.textStrong, fontSize: 15, lineHeight: 1.3 }}><ChemicalText value={text(lang, evidence.primaryMechanismZh, evidence.primaryMechanism)} /></strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
              {text(
                lang,
                `支持层 ${evidence.supportedCount}，假设层 ${evidence.hypothesisCount}，缺口 ${evidence.missingCount}。`,
                `${evidence.supportedCount} supported layers, ${evidence.hypothesisCount} hypothesis layers, ${evidence.missingCount} gaps.`,
              )}
            </span>
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            {gasSizeCell(evidence.primaryGas, evidence.primaryProperty, t, lang)}
            {gasSizeCell(evidence.secondaryGas, evidence.secondaryProperty, t, lang)}
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {[
              [text(lang, "尺寸差", "Size gap"), evidence.diameterGap == null ? formatPending(lang) : `${formatNumber(evidence.diameterGap, 2)} A`, text(lang, "动力学直径差", "kinetic-diameter gap")],
              [text(lang, "孔径", "Pore size"), evidence.poreSizeA == null ? formatPending(lang) : `${formatNumber(evidence.poreSizeA, 2)} A`, evidence.tightWindow ? text(lang, "窄孔筛分候选", "tight sieving window") : evidence.openWindow ? text(lang, "开放孔道", "open pore window") : text(lang, "孔径语境待核", "pore context pending")],
              [text(lang, "温度响应", "Temperature response"), text(lang, evidence.temperature.labelZh, evidence.temperature.label), evidence.temperature.ratio == null ? text(lang, "需要多温穿透", "needs multi-T breakthrough") : `x${formatNumber(evidence.temperature.ratio, 2)}`],
            ].map(([label, value, note]) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, minWidth: 0, padding: 9 }}>
                <span style={{ color: t.faint, fontSize: 9.8, fontWeight: 850 }}>{label}</span>
                <strong style={{ color: t.textStrong, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.4, lineHeight: 1.35 }}>
                  <ChemicalText value={value} />
                </strong>
                <span style={{ color: t.subtle, fontSize: 9.8, lineHeight: 1.35 }}><ChemicalText value={note} /></span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {evidence.layers.map(item => (
            <div key={item.label} style={{ alignItems: "start", background: t.surface, border: `1px solid ${item.tone === "warn" ? t.warn : t.border}`, borderRadius: 8, display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 0.72fr) minmax(0, 1.28fr)", minHeight: 70, padding: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.2, lineHeight: 1.3 }}><ChemicalText value={text(lang, item.labelZh, item.label)} /></strong>
                <BasisBadge tone={item.tone}>{item.status}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.52 }}>
                <ChemicalText value={text(lang, item.detailZh, item.detail)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, padding: 12 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "缺失数据的数据库补全队列", "Database backfill queue for missing evidence")}</strong>
          <BasisBadge tone={evidence.databaseGaps.length ? "warn" : "calc"}>
            {text(lang, `${evidence.databaseGaps.length} 个待查目标`, `${evidence.databaseGaps.length} lookup targets`)}
          </BasisBadge>
        </div>
        <div style={{ display: "grid", gap: 7 }}>
          {evidence.databaseGaps.length ? evidence.databaseGaps.map(target => (
            <div key={target.id} style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, display: "grid", fontSize: 11.3, gap: 3, lineHeight: 1.45, paddingTop: 7 }}>
              <span><ChemicalText value={lookupLabel(target, lang)} /></span>
              <span style={{ color: t.faint }}>
                {text(lang, "查询字段：", "Query fields: ")}
                <ChemicalText value={(lang === "zh" ? target.queryFieldsZh : target.queryFields || []).join(", ")} />
              </span>
            </div>
          )) : (
            <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, "当前机制证据没有自动识别出的数据库补全缺口。", "No automatically detected database backfill gaps for the current mechanism evidence.")}</span>
          )}
        </div>
        <button type="button" onClick={onOpenMethod} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, justifySelf: "start", padding: "7px 10px" }}>
          {text(lang, "查看方法论中的机制证据边界", "Open mechanism-evidence methodology")}
        </button>
      </div>
    </section>
  )
}

export default GasMechanismEvidencePanel
