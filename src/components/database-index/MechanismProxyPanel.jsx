// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildMechanismProxies } from "../../utils/organicAcid/mechanismProxyMapping"

const PROXY_LABELS = {
  co2ActivationProxy: ["CO₂ activation proxy", "CO₂ 活化代理"],
  formatePathwayProxy: ["Formate pathway proxy", "甲酸路径代理"],
  hydrothermalStabilityProxy: ["Hydrothermal stability proxy", "水热稳定性代理"],
  poreTransportProxy: ["Pore transport proxy", "孔道传质代理"],
  metalSiteSynergyProxy: ["Metal-site synergy proxy", "金属位点协同代理"],
  competitionRiskProxy: ["Competition risk", "竞争路径风险"],
  evidenceConfidenceProxy: ["Evidence confidence", "证据置信度"],
}

function proxyTone(key, value) {
  if (value === null) return "warn"
  if (key === "competitionRiskProxy") return value > 0.6 ? "warn" : "proxy"
  return value >= 0.6 ? "pass" : "proxy"
}

export function MechanismProxyPanel({ record = {}, lang, t, isMobile }) {
  const result = useMemo(() => buildMechanismProxies(record), [record])
  const explanations = lang === "zh" ? result.explanationsZh : result.explanationsEn

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.4 }}>{text(lang, "机制代理指标", "Mechanism proxy indicators")}</strong>
        <StatusPill tone="warn" t={t}>{text(lang, "仅机制假设", "hypothesis only")}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {result.proxyKeys.map(key => {
          const value = result.proxies[key]
          const [en, zh] = PROXY_LABELS[key] || [key, key]
          return (
            <article key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                <span style={{ color: t.textStrong, fontSize: 11.8, fontWeight: 850 }}>{text(lang, zh, en)}</span>
                <StatusPill tone={proxyTone(key, value)} t={t}>{value === null ? text(lang, "证据不足", "insufficient evidence") : value.toFixed(2)}</StatusPill>
              </div>
              <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4 }}><ChemicalText value={explanations[key] || ""} /></span>
            </article>
          )
        })}
      </div>

      {result.missingProxies.length ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.warn, fontSize: 11.6, fontWeight: 800, lineHeight: 1.45, padding: 9 }}>
          <ChemicalText value={text(
            lang,
            `证据不足的代理：${result.missingProxies.length} 项（缺少描述符）。`,
            `Proxies with insufficient evidence: ${result.missingProxies.length} (missing descriptors).`
          )} />
        </div>
      ) : null}

      <p style={{ color: t.muted, fontSize: 11.6, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "该面板仅提供机制假设，不是 DFT 或实验结论，也不是最终推荐。",
          "This panel provides mechanism hypotheses only, not DFT or experimental conclusions, and not a final recommendation."
        )} />
      </p>
    </section>
  )
}

export default MechanismProxyPanel
