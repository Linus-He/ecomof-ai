// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { MethodologyLink, MiniMetric, Panel, StatusBadge, text } from "./FinalScreeningShared"

export function ReactionConstraintBuilder({ rules, summary, lang, t, isMobile }) {
  const zh = lang === "zh"
  const constraints = rules?.reactionConstraints || {}
  const requirements = [
    text(lang, "MOF 基材料", "MOF-based catalyst"),
    text(lang, "排除贵金属主路径", "noble-metal-free main path"),
    text(lang, "高温水相稳定 Al-MOF 骨架", "hydrothermally robust Al-MOF scaffold"),
    text(lang, "第二金属氧活性位点", "secondary metal-oxo active site"),
  ]

  return (
    <Panel
      id="organic-acid-final-constraints"
      eyebrow={text(lang, "反应约束", "Reaction constraint builder")}
      title={text(lang, "170C 水相 CO2 到甲酸 / 有机酸", "170C aqueous CO2 to formic acid / organic acids")}
      t={t}
      actions={<MethodologyLink lang={lang} t={t} />}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <MiniMetric label={text(lang, "反应目标", "Reaction target")} value={constraints.targetReaction || "CO2 to organic acids"} t={t} />
        <MiniMetric label={text(lang, "温度", "Temperature")} value={`${constraints.temperatureC || 170}°C`} t={t} />
        <MiniMetric label={text(lang, "相态", "Phase")} value={text(lang, "水相", constraints.phase || "aqueous")} t={t} />
        <MiniMetric label={text(lang, "筛选模式", "Screening mode")} value={rules?.screeningMode || "two-stage"} t={t} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
          <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "催化剂要求", "Catalyst requirements")}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {requirements.map(item => <StatusBadge key={item} tone="info" t={t}>{item}</StatusBadge>)}
          </div>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={zh
              ? "本模块先筛 Al-MOF 稳定骨架，再推荐第二金属；Mo 是模型输出的设计假设，不是直接检索条件。"
              : "This module first mines stable Al-MOF scaffolds, then recommends a second metal. Mo is the design-hypothesis outcome, not a direct retrieval condition."}
            />
          </p>
        </article>

        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
          <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "禁止性表述", "Forbidden claims")}</strong>
          {(rules?.forbiddenClaims || []).map(claim => (
            <span key={claim} style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45 }}>
              <ChemicalText value={claim} />
            </span>
          ))}
        </article>
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <MiniMetric label={text(lang, "Gate pass", "Gate pass")} value={summary?.pass || 0} t={t} />
        <MiniMetric label={text(lang, "Needs review", "Needs review")} value={summary?.needs_review || 0} t={t} tone="warn" />
        <MiniMetric label={text(lang, "Rejected by hard gate", "Rejected by hard gate")} value={summary?.fail || 0} t={t} tone="warn" />
      </div>
    </Panel>
  )
}
