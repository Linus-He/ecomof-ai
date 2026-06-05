// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { DescriptorCouplingPanel } from "./DescriptorCouplingPanel"
import { DopantMetalHotSpotMap } from "./DopantMetalHotSpotMap"
import { Panel, StatusPill, text } from "./FinalScreeningShared"
import { HotSpotMapLegend } from "./HotSpotMapLegend"
import { ScaffoldHotSpotMap } from "./ScaffoldHotSpotMap"
import { SynergyHotSpotMap } from "./SynergyHotSpotMap"
import { ValidationEvidenceLadder } from "./ValidationEvidenceLadder"
import { WhyHotSpotMattersCard } from "./WhyHotSpotMattersCard"

export function CoupledDescriptorHotSpotMap({ result, curatedRealResult, lang, t, isMobile }) {
  const [activeView, setActiveView] = useState("synergy")
  const scaffoldData = [
    ...(result?.scaffoldHotSpotData || []),
    ...(curatedRealResult?.scaffoldHotSpotData || []),
  ]
  const views = [
    { id: "scaffold", label: text(lang, "骨架热区", "Scaffold Map") },
    { id: "dopant", label: text(lang, "金属热区", "Dopant Map") },
    { id: "synergy", label: text(lang, "协同热区", "Synergy Map") },
  ]

  return (
    <div id="organic-acid-final-hot-spot-map" data-cat-zone="hot-spot-map" style={{ display: "grid", gap: 14, scrollMarginTop: 118 }}>
      <Panel
        eyebrow={text(lang, "受耦合催化剂设计思想启发", "Inspired by coupled catalyst design")}
        title={text(lang, "耦合描述符热区图", "Coupled Descriptor Hot Spot Map")}
        t={t}
        actions={<StatusPill tone="proxy" t={t}>demo/proxy + curated V1.6 sample</StatusPill>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "将 Al-MOF 骨架稳定性与第二金属活性位点价值耦合起来的低维设计空间。V1.6 会叠加小规模人工整理真实样例，用于验证 mapper 与质量门；该热区图不证明实际催化性能。",
              "A low-dimensional design space linking Al-MOF scaffold robustness with second-metal active-site value. V1.6 overlays a small curated real-example sample to validate mapper and quality gates; this map does not prove catalytic performance."
            )} />
          </p>
          {curatedRealResult?.mappingReport ? (
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 12.1, fontWeight: 820, lineHeight: 1.45, padding: 9 }}>
              <ChemicalText value={text(
                lang,
                `Curated real examples：${curatedRealResult.mappingReport.readyForScoring} ready / ${curatedRealResult.mappingReport.needsReview} needs-review / ${curatedRealResult.mappingReport.rejected} rejected；不是全量 CoRE/QMOF 筛选。`,
                `Curated real examples: ${curatedRealResult.mappingReport.readyForScoring} ready / ${curatedRealResult.mappingReport.needsReview} needs-review / ${curatedRealResult.mappingReport.rejected} rejected; not full CoRE/QMOF screening.`
              )} />
            </div>
          ) : null}
          <HotSpotMapLegend lang={lang} t={t} />
          <div role="tablist" aria-label="Hot spot map views" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", padding: 5 }}>
            {views.map(view => {
              const active = view.id === activeView
              return (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveView(view.id)}
                  style={{ background: active ? t.accent : "transparent", border: `1px solid ${active ? t.accent : "transparent"}`, borderRadius: 8, color: active ? t.buttonText || "#fff" : t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}
                >
                  {view.label}
                </button>
              )
            })}
          </div>
          {activeView === "scaffold" ? (
            <ScaffoldHotSpotMap data={scaffoldData} selectedScaffold={result.scaffoldHotSpotData?.find(point => point.isSelected)} lang={lang} t={t} />
          ) : null}
          {activeView === "dopant" ? (
            <DopantMetalHotSpotMap data={result.dopantHotSpotData} lang={lang} t={t} />
          ) : null}
          {activeView === "synergy" ? (
            <SynergyHotSpotMap data={result.synergyHotSpotData} region={result.hotSpotRegion} lang={lang} t={t} />
          ) : null}
        </div>
      </Panel>

      <WhyHotSpotMattersCard lang={lang} t={t} />
      <DescriptorCouplingPanel rows={result.descriptorCouplingData} lang={lang} t={t} />
      <ValidationEvidenceLadder rows={result.validationEvidenceLadder} lang={lang} t={t} />
    </div>
  )
}
