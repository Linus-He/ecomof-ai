import { BasisBadge, ChemicalText, DisclaimerLink } from "../../shared"

function Card({ title, children, t, accent = false }) {
  return (
    <div style={{ background: accent ? t.badgeInfoBg : t.panel, border: `1px solid ${accent ? (t.borderStrong || t.border) : t.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ color: accent ? t.accentText : t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.3 }}><ChemicalText value={title} /></div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  )
}

export function CatalysisCurationLayer({ lang, t }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <Card title={lang === "zh" ? "案例研究：生物质辅助 CO₂ / HCO₃⁻ 转化" : "Case study: biomass-assisted CO₂ / HCO₃⁻ conversion"} t={t} accent>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
            {lang === "zh"
              ? "该案例用于测试有机酸路径的字段整理、条件语境和可比性判断。甲酸、乳酸、乙酸和乙醇酸是产物家族（product family）示例，不是整个 CatalysisLab 的唯一主线。"
              : "This case tests field curation, condition context, and comparability for organic-acid pathways. Formic, lactic, acetic, and glycolic acids are product-family examples, not the whole Catalysis Lab scope."}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {(lang === "zh"
              ? ["合作语境", "文献整理待补充", "不公开真实数据", "非性能预测"]
              : ["collaborator context", "literature curation pending", "no private values", "not performance prediction"]
            ).map((item, index) => <BasisBadge key={item} tone={index === 0 ? "proxy" : index === 3 ? "warn" : "info"}>{item}</BasisBadge>)}
          </div>
        </Card>
        <Card title={lang === "zh" ? "数据整理层" : "Data curation layer"} t={t}>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
            {lang === "zh"
              ? "当前重点是路径级任务（pathway-level task）、指标对齐（metric alignment）、条件语境、字段级证据和桥接指标需求。"
              : "The current layer focuses on pathway-level tasks, metric alignment, condition context, field-level evidence, and bridge metric requirements."}
          </div>
        </Card>
        <Card title={lang === "zh" ? "方法边界" : "Method boundary"} t={t}>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
            {lang === "zh"
              ? "该工作台不替代实验验证，不提供已验证催化剂排序，也不声称已有跨路径权威换算公式。"
              : "This workspace does not replace experimental validation, does not provide validated catalyst ranking, and does not claim an authoritative cross-pathway conversion formula."}{" "}
            <DisclaimerLink />
          </div>
        </Card>
      </div>
      <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14 }}>
        <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 13, fontWeight: 900 }}>{lang === "zh" ? "结构化记录字段" : "Structured record fields"}</summary>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginTop: 10 }}>
          {lang === "zh"
            ? "建议记录催化剂身份（catalyst identity）、反应域、催化模式、原料、产物家族、条件语境、关键指标、来源状态、缺失桥接指标和整理状态。"
            : "Recommended fields include catalyst identity, reaction domain, catalytic mode, feedstock, product family, condition context, key metrics, source status, missing bridge metrics, and curation status."}
        </div>
      </details>
    </section>
  )
}
