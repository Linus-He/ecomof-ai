import { useEffect, useMemo, useState } from "react"
import { useViewport } from "../../shared"
import { NumericText, ORGANIC_ACID_FONT, organicAcidPalette as palette } from "./FormulaInline"

function fmtValue(value) {
  if (value === null || value === undefined || value === "") return "pending"
  if (typeof value === "number") {
    const digits = Math.abs(value) >= 10 ? 2 : 3
    return value.toFixed(digits)
  }
  return String(value)
}

function toneForStatus(status) {
  if (status === "available") return { bg: palette.positiveSoft, text: palette.positive }
  if (status === "demo") return { bg: palette.accentSoft, text: palette.accent }
  if (status === "partial") return { bg: palette.mixedSoft, text: palette.mixed }
  if (status === "missing") return { bg: palette.riskSoft, text: palette.risk }
  return { bg: palette.surfaceStrong, text: palette.faint }
}

function statusLabel(status) {
  const map = {
    available: "可用 Available",
    demo: "演示 Demo",
    partial: "部分可用 Partial",
    missing: "缺失 Missing",
    pending: "待补充 Pending",
  }
  return map[status] || status || "pending"
}

function matchesFilter(row, filterKey) {
  if (filterKey === "all") return true
  if (filterKey === "pending") return ["pending", "missing", "partial"].includes(row.status)
  if (row.group === filterKey) return true
  return Array.isArray(row.tags) && row.tags.includes(filterKey)
}

export function getOrganicAcidStepHighlight(activeStep) {
  const map = {
    raw: {
      label: "原始输入 Raw Input",
      keys: [],
      usedIn: [],
    },
    gate: {
      label: "门槛初筛 Gate",
      keys: ["waterStabilityScore", "accessibilityScore", "activeSiteConfidence"],
      usedIn: ["Gate", "Accessibility"],
    },
    pathway: {
      label: "路径指纹 Pathway",
      keys: [
        "pathway_formaldehyde_to_formic",
        "pathway_glyceraldehyde_to_formic",
        "pathway_glyceraldehyde_to_c2_byproducts",
        "pathway_pyruvaldehyde_to_formic",
        "pathway_pyruvaldehyde_to_lactic",
      ],
      usedIn: ["Reaction descriptors"],
    },
    step: {
      label: "步骤评分 StepScore",
      keys: ["A1", "A2", "A3", "A4", "B1"],
      usedIn: ["A1", "A2", "A3", "A4", "B1"],
    },
    selectivity: {
      label: "选择性因子 SelectivityFactor",
      keys: ["Y_FA", "S_FA_C", "Y_lactic", "Y_acetic", "Y_glycolic", "Y_pyruvic", "Y_solid"],
      usedIn: ["SelectivityFactor", "Ranking"],
    },
    critic: {
      label: "权重校正 CRITIC",
      keys: ["Y_lactic", "Y_acetic", "Y_glycolic", "Y_pyruvic", "Y_solid"],
      usedIn: ["CRITIC"],
    },
    rgfa: {
      label: "最终评分 RGFA",
      keys: ["waterStabilityScore", "accessibilityScore", "activeSiteConfidence", "A1", "A2", "A3", "A4", "B1", "Y_FA", "S_FA_C"],
      usedIn: ["Gate", "A1", "A2", "A3", "A4", "B1", "SelectivityFactor", "Ranking"],
    },
    ranking: {
      label: "排名影响 Ranking",
      keys: ["Y_FA", "S_FA_C"],
      usedIn: ["Ranking"],
    },
    experiment: {
      label: "下一步实验 Next Experiment",
      keys: [],
      usedIn: ["Validation"],
    },
  }

  return map[activeStep] || map.raw
}

export function InteractiveDataTable({
  rows = [],
  filterTabs = [],
  defaultFilter = "all",
  detailTitle = "字段详情 Field Detail",
  emptyMessage = "当前筛选下没有字段。",
  showGroup = false,
  showUnit = false,
  highlightKeys = [],
  highlightUsedIn = [],
  activeHighlightLabel = "",
  onSelectedRowChange,
}) {
  const { isNarrow } = useViewport()
  const [activeFilter, setActiveFilter] = useState(defaultFilter)
  const [selectedKey, setSelectedKey] = useState(rows[0]?.key || "")

  const visibleRows = useMemo(() => rows.filter((row) => matchesFilter(row, activeFilter)), [rows, activeFilter])
  const selectedRow = useMemo(() => (
    visibleRows.find((row) => row.key === selectedKey) || visibleRows[0] || rows[0] || null
  ), [rows, selectedKey, visibleRows])

  useEffect(() => {
    if (!visibleRows.length) {
      setSelectedKey(rows[0]?.key || "")
      return
    }
    if (!visibleRows.some((row) => row.key === selectedKey)) {
      setSelectedKey(visibleRows[0].key)
    }
  }, [rows, selectedKey, visibleRows])

  useEffect(() => {
    onSelectedRowChange?.(selectedRow)
  }, [onSelectedRowChange, selectedRow])

  const columnCount = 7 + (showGroup ? 1 : 0) + (showUnit ? 1 : 0)

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {filterTabs.map((tab) => {
          const active = tab.key === activeFilter
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              style={{
                background: active ? palette.accentSoft : palette.bg,
                border: `1px solid ${active ? palette.accent : palette.border}`,
                borderRadius: 10,
                color: active ? palette.accent : palette.muted,
                cursor: "pointer",
                fontFamily: ORGANIC_ACID_FONT,
                fontSize: 12.5,
                fontWeight: 700,
                padding: "6px 10px",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeHighlightLabel ? (
        <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 11.5, lineHeight: 1.45, padding: "8px 10px" }}>
          当前高亮 Current highlight: <span style={{ color: palette.text, fontWeight: 700 }}>{activeHighlightLabel}</span>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.22fr) minmax(260px, 0.78fr)" }}>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, maxWidth: "100%", minWidth: 0, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: showGroup || showUnit ? 1080 : 960, width: "100%" }}>
            <thead>
              <tr>
                {[
                  "字段 Field",
                  ...(showGroup ? ["分组 Group"] : []),
                  "当前值 Value",
                  ...(showUnit ? ["单位 Unit"] : []),
                  "用途 Use",
                  "用于算法 Used in",
                  "数据状态 Status",
                  "证据等级 Evidence",
                  "来源 / 备注 Source note",
                ].map((head) => (
                  <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 800, padding: "9px 10px", textAlign: "left", whiteSpace: "nowrap" }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? visibleRows.map((row, index) => {
                const statusTone = toneForStatus(row.status)
                const highlighted = highlightKeys.includes(row.key) || row.usedIn.some((item) => highlightUsedIn.includes(item))
                const selected = selectedRow?.key === row.key
                return (
                  <tr
                    key={row.key}
                    onClick={() => setSelectedKey(row.key)}
                    style={{
                      background: selected ? palette.accentSoft : index % 2 === 0 ? palette.bg : palette.surface,
                      boxShadow: highlighted ? `inset 3px 0 0 ${palette.accent}` : "none",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, padding: "10px" }}>
                      <div>{row.labelNode || row.label || row.key}</div>
                      <div style={{ color: palette.muted, fontSize: 11.5, fontWeight: 500, marginTop: 4 }}>
                        {row.nameZh}{row.nameEn ? ` / ${row.nameEn}` : ""}
                      </div>
                    </td>
                    {showGroup ? (
                      <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                        {row.groupZh}{row.groupEn ? ` ${row.groupEn}` : ""}
                      </td>
                    ) : null}
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                      {typeof row.value === "number" ? <NumericText>{fmtValue(row.value)}</NumericText> : fmtValue(row.value)}
                    </td>
                    {showUnit ? (
                      <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                        {row.unit || "—"}
                      </td>
                    ) : null}
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>
                      {row.use}
                    </td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>
                      {row.usedIn.join(" / ")}
                    </td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, padding: "10px", whiteSpace: "nowrap" }}>
                      <span style={{ background: statusTone.bg, borderRadius: 999, color: statusTone.text, display: "inline-flex", fontSize: 11.5, fontWeight: 800, padding: "4px 8px" }}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                      {row.evidence}
                    </td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>
                      {row.source}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={columnCount} style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, padding: 16 }}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12, alignSelf: "start" }}>
          <div style={{ borderBottom: `1px solid ${palette.border}`, display: "grid", gap: 4, paddingBottom: 9 }}>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>{detailTitle}</div>
            <div style={{ color: palette.text, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
              {selectedRow?.labelNode || selectedRow?.label || selectedRow?.key || "pending"}
            </div>
            <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>
              {selectedRow?.nameZh || "当前筛选下暂无字段"}{selectedRow?.nameEn ? ` / ${selectedRow.nameEn}` : ""}
            </div>
          </div>

          {selectedRow ? (
            <>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>当前值 Current value</div>
                  <div style={{ color: palette.text, fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginTop: 5 }}>
                    {typeof selectedRow.value === "number" ? <NumericText>{fmtValue(selectedRow.value)}</NumericText> : fmtValue(selectedRow.value)}
                    {showUnit && selectedRow.unit ? ` ${selectedRow.unit}` : ""}
                  </div>
                </div>
                <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>用于算法 Used in algorithm</div>
                  <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>{selectedRow.usedIn.join(" / ")}</div>
                </div>
              </div>

              <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>字段作用 Field purpose</div>
                <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{selectedRow.use}</div>
              </div>

              <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>如何进入公式 How it enters the formula</div>
                <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{selectedRow.formula || "当前字段作为工作台输入被后续步骤调用。"}</div>
                <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>{selectedRow.impact || "用于解释当前候选在算法中的作用和限制。"}</div>
              </div>

              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>数据状态 Data status</div>
                  <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>{statusLabel(selectedRow.status)}</div>
                  <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>{selectedRow.evidence}</div>
                </div>
                <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>来源 / 备注 Source note</div>
                  <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>{selectedRow.source}</div>
                </div>
              </div>

              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                {selectedRow.needsData || "当前字段仍属于 demo / prototype data，后续可直接补充真实整理值。"}
              </div>
            </>
          ) : (
            <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>当前筛选下暂无字段详情。</div>
          )}
        </aside>
      </div>
    </div>
  )
}
