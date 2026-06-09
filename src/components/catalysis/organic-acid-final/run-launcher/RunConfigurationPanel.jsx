// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, text } from "../FinalScreeningShared"

// Research-readable candidate sources. Status reflects how each source may be used,
// not a developer "enabled/disabled" flag.
const RUN_SCOPES = [
  {
    id: "demo_workflow",
    label: "Current demo workflow",
    labelZh: "当前演示流程",
    statusLabel: "Available",
    statusLabelZh: "可运行",
    statusTone: "pass",
    note: "Shows the full scoring chain end to end; it does not represent real database screening.",
    noteZh: "用于展示完整评分链路，不代表真实数据库筛选。",
  },
  {
    id: "mapped_fixtures",
    label: "Mapped sample records",
    labelZh: "映射样例",
    statusLabel: "Needs verification",
    statusLabelZh: "需核验",
    statusTone: "warn",
    note: "Used to verify field mapping, schema, and the data quality gate.",
    noteZh: "用于验证字段映射、schema 与质量门控。",
  },
  {
    id: "curated_real_examples",
    label: "Curated real samples",
    labelZh: "人工整理样例",
    statusLabel: "Needs verification",
    statusLabelZh: "需核验",
    statusTone: "warn",
    note: "Checks whether real literature samples can pass the metadata and evidence gates.",
    noteZh: "用于检查真实文献样例能否通过 metadata 与 evidence gate。",
  },
  {
    id: "database_index_preview",
    label: "Database index preview",
    labelZh: "数据库索引预览",
    statusLabel: "Preview only",
    statusLabelZh: "仅限预览",
    statusTone: "proxy",
    note: "Reads the manifest, Top-N preview, and the selected part only; it does not run full scoring.",
    noteZh: "只读取 manifest、Top-N 预览与已选择分片；不执行全量评分。",
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
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "候选来源 / 运行范围", "Candidate source / run scope")}</span>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {RUN_SCOPES.map(mode => {
          const active = mode.id === dataMode
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setDataMode(mode.id)}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accentText : t.border}`,
                borderRadius: 10,
                color: t.textStrong,
                cursor: "pointer",
                display: "grid",
                gap: 6,
                minHeight: 112,
                padding: 10,
                textAlign: "left",
              }}
            >
              <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.25 }}>
                {text(lang, mode.labelZh, mode.label)}
              </strong>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.42 }}>
                <ChemicalText value={text(lang, mode.noteZh, mode.note)} />
              </span>
              <StatusPill tone={mode.statusTone} t={t}>{text(lang, mode.statusLabelZh, mode.statusLabel)}</StatusPill>
            </button>
          )
        })}
      </div>

      <p style={{ color: t.muted, fontSize: 11.6, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "所有来源的结果都是预览，不参与最终推荐。浏览器不执行全量数据库评分。",
          "All sources produce preview results that are not final recommendations. The browser does not run full database scoring."
        )} />
      </p>

      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 10 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "反应约束", "Reaction constraints")}</span>
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
