import { BasisBadge } from "../../shared"
import {
  organicAcidCaseSummary,
  organicAcidComparabilityRules,
  organicAcidEvidenceChecklist,
  organicAcidPathwayLayers,
  organicAcidProductFamilies,
  organicAcidSchemaGroups,
} from "../../data/organicAcidFramework"

function SectionTitle({ eyebrow, title, t }) {
  return (
    <div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 950, marginTop: 3 }}>{title}</div>
    </div>
  )
}

function FrameworkNote({ lang, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.65, padding: 12 }}>
      {lang === "zh"
        ? "本案例目前用于展示有机酸催化数据的结构化整理框架，暂不包含合作方未公开实验数据。"
        : "This case study demonstrates a framework for structuring organic-acid catalysis records. No collaborator-owned experimental data are included at this stage."}
    </div>
  )
}

function PathwayMap({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
      <SectionTitle eyebrow={lang === "zh" ? "路径图" : "Pathway map"} title={lang === "zh" ? "CO₂ / HCO₃⁻ + 生物质底物 → 有机酸产物族" : "CO₂ / HCO₃⁻ + biomass substrates → organic-acid families"} t={t} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 14 }}>
        {organicAcidPathwayLayers.map((layer, index) => (
          <div key={layer.key} style={{ minWidth: 0 }}>
            <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? layer.zh : layer.en}</div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {(lang === "zh" ? layer.nodesZh : layer.nodesEn).map(node => (
                <div key={node} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.35, padding: "9px 10px" }}>
                  {node}
                </div>
              ))}
            </div>
            {index < organicAcidPathwayLayers.length - 1 && (
              <div style={{ color: t.faint, fontSize: 18, fontWeight: 900, marginTop: 8, textAlign: "center" }}>↓</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 12 }}>
        {lang === "zh" ? "这是 pathway framework，不表示所有路线已完成实验验证。" : "This is a pathway framework; it does not imply that all routes have been experimentally validated."}
      </div>
    </section>
  )
}

function ProductBreakdown({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
      <SectionTitle eyebrow={lang === "zh" ? "产物族" : "Product family"} title={lang === "zh" ? "有机酸产物拆解" : "Organic acid product breakdown"} t={t} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
        {organicAcidProductFamilies.map(product => (
          <article key={product.key} style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 950 }}>{lang === "zh" ? product.zh : product.en}</div>
              <BasisBadge tone="proxy">{product.carbon}</BasisBadge>
            </div>
            <dl style={{ display: "grid", gap: 7, margin: "10px 0 0" }}>
              {[
                [lang === "zh" ? "路线语境" : "Route context", lang === "zh" ? product.routeZh : product.routeEn],
                [lang === "zh" ? "待收集指标" : "Metrics to collect", lang === "zh" ? product.metricsZh : product.metricsEn],
                [lang === "zh" ? "所需证据" : "Evidence needed", lang === "zh" ? product.evidenceZh : product.evidenceEn],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "grid", gap: 4 }}>
                  <dt style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{label}</dt>
                  <dd style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function DataSchema({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
      <SectionTitle eyebrow={lang === "zh" ? "字段框架" : "Data schema"} title={lang === "zh" ? "实验记录整理字段" : "Experimental data schema"} t={t} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginTop: 14 }}>
        {organicAcidSchemaGroups.map(group => (
          <article key={group.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{lang === "zh" ? group.zh : group.en}</div>
            <ol style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, margin: "9px 0 0", paddingLeft: 18 }}>
              {(lang === "zh" ? group.fieldsZh : group.fieldsEn).map(field => <li key={field}>{field}</li>)}
            </ol>
          </article>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 12 }}>
        {lang === "zh" ? "定量数值在当前公开页面中标记为 framework only / not provided。" : "Quantitative values are marked framework only / not provided in this public page."}
      </div>
    </section>
  )
}

function ComparabilityAndEvidence({ lang, t }) {
  return (
    <section style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
        <SectionTitle eyebrow={lang === "zh" ? "可比性逻辑" : "Comparability logic"} title={lang === "zh" ? "为什么不能直接横向比较" : "Why direct comparison is limited"} t={t} />
        <ol style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, margin: "12px 0 0", paddingLeft: 18 }}>
          {organicAcidComparabilityRules.map(rule => <li key={rule.en}>{lang === "zh" ? rule.zh : rule.en}</li>)}
        </ol>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
        <SectionTitle eyebrow={lang === "zh" ? "缺失证据" : "Missing evidence"} title={lang === "zh" ? "公开展示前需要补齐的证据" : "Evidence to curate before public comparison"} t={t} />
        <ol style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, margin: "12px 0 0", paddingLeft: 18 }}>
          {organicAcidEvidenceChecklist.map(item => <li key={item.key}>{lang === "zh" ? item.zh : item.en}</li>)}
        </ol>
      </div>
    </section>
  )
}

export function OrganicAcidCaseStudy({ lang, t }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 950 }}>{lang === "zh" ? organicAcidCaseSummary.titleZh : organicAcidCaseSummary.titleEn} v0</div>
            <div style={{ color: t.accentText, fontSize: 13, fontWeight: 850, marginTop: 5 }}>
              {lang === "zh" ? organicAcidCaseSummary.pathwayZh : organicAcidCaseSummary.pathwayEn}
            </div>
          </div>
          <BasisBadge tone="warn">{lang === "zh" ? "framework-first" : "framework-first"}</BasisBadge>
        </div>
        <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, marginTop: 12 }}>
          {lang === "zh"
            ? "有机酸是 CO₂/HCO₃⁻ 转化与生物质协同利用中的一个代表性产物族。本案例展示如何把分散的催化实验记录转化为可比较、可追溯、可补全的数据结构；当前不展示真实实验结果。"
            : "Organic acids are a representative product family in CO₂/HCO₃⁻ conversion and biomass coupling. This case shows how dispersed catalysis records can be structured into comparable, traceable, and completable data records; no real experimental results are shown."}
        </div>
        <div style={{ marginTop: 12 }}><FrameworkNote lang={lang} t={t} /></div>
        <div style={{ color: t.faint, fontSize: 11, fontWeight: 850, lineHeight: 1.5, marginTop: 10 }}>
          {lang === "zh"
            ? "当前公开演示不包含合作方未公开实验数据。"
            : "No collaborator-owned experimental data are included in this public demo."}
        </div>
      </section>
      <PathwayMap lang={lang} t={t} />
      <ProductBreakdown lang={lang} t={t} />
      <DataSchema lang={lang} t={t} />
      <ComparabilityAndEvidence lang={lang} t={t} />
    </div>
  )
}
