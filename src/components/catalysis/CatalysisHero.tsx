// @ts-nocheck
import { BasisBadge, CopyLinkButton, PageHeader } from "../../shared"

export function CatalysisHero({ lang, stats, t }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PageHeader
        title={lang === "zh" ? "催化" : "Catalysis"}
        subtitle={lang === "zh"
          ? "用坐标轴图、筛选器和任务表组织 MOF 相关催化任务、指标体系、条件语境和可比性边界。"
          : "A chart-first workspace for organizing MOF-related catalytic tasks, metric systems, condition context, and comparability boundaries."}
        meta={lang === "zh" ? "总览 · 坐标轴图 · 可比性评估 · 数据整理" : "overview · axis charts · comparability assessment · data curation"}
        action={<CopyLinkButton hash="catalysis" ariaLabel={lang === "zh" ? "复制催化链接" : "Copy Catalysis link"} />}
      />
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {(lang === "zh"
          ? ["多反应领域", "电/光/热/光热催化", "有机酸仅为案例", "不替代实验"]
          : ["multiple reaction domains", "electro/photo/thermal/photothermal", "organic acids as one case", "not experimental replacement"]
        ).map((item, index) => (
          <BasisBadge key={item} tone={index === 2 ? "proxy" : index === 3 ? "warn" : "info"}>{item}</BasisBadge>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 10 }}>
        {stats.map(card => (
          <div key={card.key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 24, fontWeight: 950, lineHeight: 1 }}>{card.value}</div>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, marginTop: 6, textTransform: "uppercase" }}>{lang === "zh" ? card.zh : card.en}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
