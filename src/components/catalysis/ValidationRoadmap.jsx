const ROADMAP = [
  {
    id: "support",
    titleZh: "当前支持",
    titleEn: "Current support",
    itemsZh: ["路径级证据图", "反应指纹与候选物联动", "覆盖率和可比性评分"],
    itemsEn: ["Pathway-level evidence map", "Reaction fingerprint linkage", "Coverage and comparability scoring"],
  },
  {
    id: "gaps",
    titleZh: "数据缺口",
    titleEn: "Data gaps",
    itemsZh: ["动力学数据", "长期稳定性", "可比较报告基准", "真实实验验证"],
    itemsEn: ["Kinetic data", "Long-term stability", "Comparable reporting basis", "Real experimental validation"],
  },
  {
    id: "next",
    titleZh: "下一步验证",
    titleEn: "Next validation steps",
    itemsZh: ["补充整理文献记录", "验证选中候选物", "对照选择性 / 收率结果"],
    itemsEn: ["Add curated literature records", "Validate selected candidates", "Compare observed selectivity / yield"],
  },
]

export function ValidationRoadmap({ t, isMobile, lang = "en" }) {
  const zh = lang === "zh"
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>Validation roadmap</div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {zh ? "验证路线与数据缺口" : "Validation Roadmap"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 860 }}>
          {zh ? "当前工作台用于证据整理和优先级判断，仍需要文献整理和实验验证闭环。" : "The workspace supports evidence organization and prioritization; literature curation and experiments remain required."}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 9 }}>
        {ROADMAP.map(section => (
          <article key={section.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.3 }}>{zh ? section.titleZh : section.titleEn}</div>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.5, gap: 4, lineHeight: 1.45 }}>
              {(zh ? section.itemsZh : section.itemsEn).map(item => <div key={item}>- {item}</div>)}
            </div>
          </article>
        ))}
      </div>
      <div style={{ background: t.badgeWarnBg || t.surface, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.badgeWarnText || t.warn, fontSize: 12, lineHeight: 1.55, padding: 11 }}>
        {zh ? "边界：当前为 decision-support preview，不是已验证预测。" : "Boundary: decision-support preview, not a validated prediction."}
      </div>
    </section>
  )
}
