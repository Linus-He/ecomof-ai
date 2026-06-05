// @ts-nocheck
import { ChemicalText } from "../../../../shared"
import { StatusPill, text } from "../FinalScreeningShared"

const DATA_MODES = [
  {
    id: "demo_workflow",
    label: "Demo workflow",
    labelZh: "演示流程",
    status: "enabled",
    note: "Uses current demo / seed / literature-derived records.",
    noteZh: "使用当前 demo / seed / literature-derived 记录。",
  },
  {
    id: "mapped_fixtures",
    label: "Mapped fixtures",
    labelZh: "映射样例",
    status: "enabled",
    note: "Uses V1.5 mapper-ready fixture shape with the same demo workflow.",
    noteZh: "使用 V1.5 mapper-ready 样例形状，并沿用当前演示流程。",
  },
  {
    id: "curated_real_examples",
    label: "Curated real examples",
    labelZh: "人工整理真实样例",
    status: "enabled",
    note: "Small curated sample only. Not full database screening.",
    noteZh: "仅小规模人工整理样例；不是全量数据库筛选。",
  },
]

const PRESET_ROWS = [
  ["CO2 -> formic acid / organic acids", "CO2 -> 甲酸 / 有机酸"],
  ["170C aqueous phase", "170C 水相"],
  ["Noble-metal-free route", "排除贵金属主路径"],
  ["Al-MOF scaffold + second metal-oxo site", "Al-MOF 骨架 + 第二金属氧活性位点"],
]

export function RunConfigurationPanel({ dataMode, setDataMode, lang, t, isMobile }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {DATA_MODES.map(mode => {
          const disabled = mode.status !== "enabled"
          const active = mode.id === dataMode
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => setDataMode(mode.id)}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accentText : t.border}`,
                borderRadius: 10,
                color: disabled ? t.faint : t.textStrong,
                cursor: disabled ? "not-allowed" : "pointer",
                display: "grid",
                gap: 6,
                minHeight: 106,
                opacity: disabled ? 0.68 : 1,
                padding: 10,
                textAlign: "left",
              }}
            >
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Data mode</span>
              <strong style={{ color: disabled ? t.faint : t.textStrong, fontSize: 13.2, lineHeight: 1.25 }}>
                {text(lang, mode.labelZh, mode.label)}
              </strong>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.42 }}>
                <ChemicalText value={text(lang, mode.noteZh, mode.note)} />
              </span>
              <StatusPill tone={disabled ? "warn" : "info"} t={t}>{mode.status}</StatusPill>
            </button>
          )
        })}
      </div>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 10 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Reaction preset</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PRESET_ROWS.map(([en, zh]) => (
            <span key={en} style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontSize: 11.5, fontWeight: 850, padding: "6px 9px" }}>
              <ChemicalText value={text(lang, zh, en)} />
            </span>
          ))}
        </div>
      </article>
    </section>
  )
}
