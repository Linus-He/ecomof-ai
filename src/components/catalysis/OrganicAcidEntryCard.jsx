import { toolbarBtn } from "../../shared"

export function OrganicAcidEntryCard({ lang, t, isMobile, onOpen }) {
  const zh = lang === "zh"
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>
          {zh ? "专题工作台" : "Focused Workspaces"}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {zh ? "有机酸路径工作台" : "Organic Acid Workspace"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 920 }}>
          {zh
            ? "进入有机酸路径工作台，查看前端访问入口、算法追踪器、路径显示图、图论网络分析、证据矩阵、优先级矩阵和候选物队列。"
            : "Explore organic-acid-oriented CO2 conversion as an independent case workspace with access gate, algorithm tracing, pathway maps, graph reasoning, evidence matrices, and candidate prioritization."}
        </p>
      </div>
      <div style={{ alignItems: "center", display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto" }}>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5 }}>
          {zh
            ? "该专题仍属于 Catalysis Lab，但拥有独立内容区，不再压缩为总览中的小面板。"
            : "This topic remains inside Catalysis Lab, but opens as its own workspace rather than a collapsed summary panel."}
        </div>
        <button
          type="button"
          onClick={onOpen}
          style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", justifyContent: "center", minHeight: 38, padding: "9px 13px", width: isMobile ? "100%" : "auto" }}
        >
          {zh ? "进入工作台" : "Open workspace"}
        </button>
      </div>
    </section>
  )
}
