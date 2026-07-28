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
    { id: "synergy", label: text(lang, "优先级地图", "Priority Map") },
  ]

  return (
    <div id="organic-acid-final-hot-spot-map" data-cat-zone="hot-spot-map" style={{ display: "grid", gap: 14, scrollMarginTop: 118 }}>
      <Panel
        eyebrow={text(lang, "受耦合催化剂设计思想启发", "Inspired by coupled catalyst design")}
        title={text(lang, "耦合描述符热区图", "Coupled Descriptor Hot Spot Map")}
        t={t}
        actions={<StatusPill tone="proxy" t={t}>{text(lang, "演示级代理 · 仅限预览", "demo/proxy · preview only")}</StatusPill>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "将 Al-MOF 骨架稳健性与第二金属活性位点价值耦合起来的低维设计空间，用于解释候选优先级；该图不证明实际催化性能，也不是经完整验证的全量数据库筛选。",
              "A low-dimensional design space linking Al-MOF framework robustness with second-metal active-site value to explain candidate priority. This map does not prove catalytic performance and is not full verified database screening."
            )} />
          </p>
          {curatedRealResult?.mappingReport ? (
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 12.1, fontWeight: 820, lineHeight: 1.45, padding: 9 }}>
              <ChemicalText value={text(
                lang,
                `历史 V1.6 映射样例：${curatedRealResult.mappingReport.readyForScoring} ready / ${curatedRealResult.mappingReport.needsReview} needs-review / ${curatedRealResult.mappingReport.rejected} rejected；仅用于验证热区图，不代表当前 9,835 条 CoRE 结构路线计算。`,
                `Historical V1.6 mapping sample: ${curatedRealResult.mappingReport.readyForScoring} ready / ${curatedRealResult.mappingReport.needsReview} needs-review / ${curatedRealResult.mappingReport.rejected} rejected; used only to validate this map, not the active 9,835-record CoRE route calculation.`
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
