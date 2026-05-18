import { useMemo } from "react"
import {
  buildDescriptorRows,
  DescriptorLabel,
  descriptorGroupTabs,
  NumericText,
  ORGANIC_ACID_FONT,
  organicAcidPalette,
} from "./FormulaInline"
import { getOrganicAcidStepHighlight, InteractiveDataTable } from "./InteractiveDataTable"

function DescriptorStat({ label, value, tone }) {
  return (
    <div style={{ background: organicAcidPalette.surface, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 10, padding: "9px 10px" }}>
      <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800 }}>{label}</div>
      <div style={{ color: tone, fontSize: 15, fontWeight: 700, lineHeight: 1.15, marginTop: 5 }}>{value}</div>
    </div>
  )
}

export function DynamicDescriptorMatrix({ candidate, activeStep = "raw" }) {
  const rows = useMemo(() => buildDescriptorRows(candidate).map((row) => ({
    ...row,
    labelNode: <DescriptorLabel descriptor={row.key} />,
    label: row.key,
    nameZh: row.labelZh,
    nameEn: row.labelEn,
    use: `${row.labelZh}，当前用于 ${row.usedIn.join(" / ")}。`,
    formula: `当前描述符主要进入：${row.usedIn.join(" / ")}。`,
    impact: row.status === "available"
      ? "该字段已可直接进入工作台解释层，但仍属于 demo / prototype data。"
      : "当前字段仍为 pending / missing / partial，占位结构已保留，等待后续真实整理数据或 DFT 结果补入。",
    needsData: row.status === "available"
      ? "当前字段仍属于 demo / prototype data，后续可被真实数据覆盖。"
      : "当前字段尚未整理完成，页面会明确保留 pending / missing 状态，不编造数值。",
    tags: [row.group],
  })), [candidate])

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {}), [rows])

  const highlight = getOrganicAcidStepHighlight(activeStep)
  const filterTabs = [...descriptorGroupTabs, { key: "pending", label: "待补充 Pending" }]

  return (
    <section style={{ background: organicAcidPalette.bg, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 18, fontFamily: ORGANIC_ACID_FONT }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.18, textTransform: "uppercase" }}>Dynamic Descriptor Matrix</div>
        <h2 style={{ color: organicAcidPalette.text, fontSize: 22, lineHeight: 1.2, margin: 0 }}>动态描述符表 Dynamic Descriptor Matrix</h2>
        <p style={{ color: organicAcidPalette.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          复用与 Raw Input 相同的交互式数据表。当前高亮会跟随 Algorithm Trace Explorer 的步骤切换，方便查看哪个描述符正在参与当前算法环节。
        </p>
      </div>

      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div style={{ background: organicAcidPalette.surface, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800 }}>当前候选 Current candidate</div>
          <div style={{ color: organicAcidPalette.text, fontSize: 15.5, fontWeight: 700, lineHeight: 1.2, marginTop: 5 }}>{candidate?.mof || "pending"}</div>
          <div style={{ color: organicAcidPalette.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>
            表格随 Candidate Ranking 与 Algorithm Trace 的选中候选同步切换。
          </div>
        </div>
        <DescriptorStat label="可用 Available" value={<NumericText>{counts.available || 0}</NumericText>} tone={organicAcidPalette.positive} />
        <DescriptorStat label="待补充 Pending" value={<NumericText>{counts.pending || 0}</NumericText>} tone={organicAcidPalette.faint} />
        <DescriptorStat label="缺失 / 部分 Missing / Partial" value={<NumericText>{(counts.missing || 0) + (counts.partial || 0)}</NumericText>} tone={organicAcidPalette.mixed} />
      </div>

      <InteractiveDataTable
        rows={rows}
        filterTabs={filterTabs}
        defaultFilter="all"
        detailTitle="描述符详情 Descriptor Detail"
        emptyMessage="当前筛选下没有描述符。"
        showGroup
        showUnit
        highlightKeys={highlight.keys}
        highlightUsedIn={highlight.usedIn}
        activeHighlightLabel={highlight.keys.length || highlight.usedIn.length ? highlight.label : ""}
      />
    </section>
  )
}
