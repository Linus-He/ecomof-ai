// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbText } from "../../utils/databaseIndex/databaseIndexCopy"
import { DATABASE_INDEX_DESCRIPTOR_FILTERS } from "../../utils/databaseIndex/databaseIndexFormatters"

const SOURCE_OPTIONS = [
  ["all", "all", "全部"],
  ["core", "CoRE", "CoRE"],
]

const QUALITY_OPTIONS = [
  ["all", "all", "全部"],
  ["ready-for-structural-screening", "structural fields ready", "结构字段就绪"],
  ["needs-review", "needs-review", "needs-review"],
  ["rejected", "rejected", "rejected"],
]

const METAL_OPTIONS = [
  ["all", "all", "全部"],
  ["Al", "Al", "Al"],
  ["Zr", "Zr", "Zr"],
  ["Zn", "Zn", "Zn"],
  ["Cu", "Cu", "Cu"],
  ["Mo", "Mo", "Mo"],
  ["Fe", "Fe", "Fe"],
  ["other", "other", "other"],
]

const COVERAGE_OPTIONS = [
  ["all", "all", "全部"],
  ["high", "high coverage", "高覆盖"],
  ["medium", "medium coverage", "中覆盖"],
  ["low", "low / pending coverage", "低覆盖 / 待核验"],
]

function Field({ label, children, t }) {
  return (
    <label style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  )
}

function Select({ value, onChange, children, t, ariaLabel }) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, fontWeight: 850, minHeight: 34, padding: "6px 8px", width: "100%" }}>
      {children}
    </select>
  )
}

export function DatabaseIndexFilterToolbar({ filters, onChange, lang, t }) {
  const update = patch => onChange?.({ ...filters, ...patch })
  const toggleDescriptor = descriptor => {
    const current = Array.isArray(filters.descriptors) ? filters.descriptors : []
    const next = current.includes(descriptor) ? current.filter(item => item !== descriptor) : [...current, descriptor]
    update({ descriptors: next })
  }

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>
            {dbText(lang, "expandedScreeningUi")}
          </strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "筛选只作用于当前结构审阅样本或选定索引分片，不会一次性加载 9,835 条详情。",
              "Filters apply only to the current structural-review sample or selected index part; they do not load all 9,835 detail records at once."
            )} />
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StatusBadge tone="proxy" t={t}>{dbText(lang, "topNPreviewOnly")}</StatusBadge>
          <StatusBadge tone="proxy" t={t}>{dbText(lang, "selectedIndexPartOnly")}</StatusBadge>
          <StatusBadge tone="warn" t={t}>{dbText(lang, "detailOnDemand")}</StatusBadge>
        </div>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <Field label={text(lang, "来源数据库", "Source database")} t={t}>
          <Select ariaLabel="Source database filter" value={filters.sourceDatabase} onChange={value => update({ sourceDatabase: value })} t={t}>
            {SOURCE_OPTIONS.map(([value, en, zh]) => <option key={value} value={value}>{text(lang, zh, en)}</option>)}
          </Select>
        </Field>
        <Field label={text(lang, "质量状态", "Quality status")} t={t}>
          <Select ariaLabel="Quality status filter" value={filters.qualityStatus} onChange={value => update({ qualityStatus: value })} t={t}>
            {QUALITY_OPTIONS.map(([value, en, zh]) => <option key={value} value={value}>{text(lang, zh, en)}</option>)}
          </Select>
        </Field>
        <Field label={text(lang, "金属节点", "Metal node")} t={t}>
          <Select ariaLabel="Metal node filter" value={filters.metal} onChange={value => update({ metal: value })} t={t}>
            {METAL_OPTIONS.map(([value, en, zh]) => <option key={value} value={value}>{text(lang, zh, en)}</option>)}
          </Select>
        </Field>
        <Field label={text(lang, "来源覆盖率", "Provenance coverage")} t={t}>
          <Select ariaLabel="Provenance coverage filter" value={filters.provenanceCoverage} onChange={value => update({ provenanceCoverage: value })} t={t}>
            {COVERAGE_OPTIONS.map(([value, en, zh]) => <option key={value} value={value}>{text(lang, zh, en)}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "Descriptor availability", "Descriptor availability")}
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {DATABASE_INDEX_DESCRIPTOR_FILTERS.map(descriptor => {
            const active = filters.descriptors?.includes(descriptor.id)
            return (
              <label key={descriptor.id} style={{ alignItems: "center", background: active ? t.badgeInfoBg : t.panel, border: `1px solid ${active ? t.accentText : t.border}`, borderRadius: 6, color: active ? t.accentText : t.muted, cursor: "pointer", display: "inline-flex", fontSize: 11.5, fontWeight: 850, gap: 5, minHeight: 30, padding: "5px 8px" }}>
                <input checked={active} onChange={() => toggleDescriptor(descriptor.id)} type="checkbox" />
                {descriptor.label}
              </label>
            )
          })}
        </div>
      </div>
    </section>
  )
}
