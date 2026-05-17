import { useMemo, useState } from "react"
import { safeNumber } from "../../utils/rgfaScore"
import {
  buildDescriptorRows,
  DescriptorLabel,
  descriptorGroupTabs,
  NumericText,
  ORGANIC_ACID_FONT,
  organicAcidPalette,
} from "./FormulaInline"

function fmtValue(value) {
  if (value === null || value === undefined || value === "") return "pending"
  if (typeof value === "number") {
    const digits = Math.abs(value) >= 10 ? 2 : 3
    return safeNumber(value, 0).toFixed(digits)
  }
  return String(value)
}

function toneForStatus(status) {
  if (status === "available") return { bg: organicAcidPalette.positiveSoft, text: organicAcidPalette.positive }
  if (status === "partial") return { bg: organicAcidPalette.mixedSoft, text: organicAcidPalette.mixed }
  if (status === "missing") return { bg: organicAcidPalette.riskSoft, text: organicAcidPalette.risk }
  return { bg: organicAcidPalette.surfaceStrong, text: organicAcidPalette.faint }
}

function DescriptorStat({ label, value, tone }) {
  return (
    <div style={{ background: organicAcidPalette.surface, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 10, padding: "9px 10px" }}>
      <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800 }}>{label}</div>
      <div style={{ color: tone, fontSize: 15, fontWeight: 700, lineHeight: 1.15, marginTop: 5 }}>{value}</div>
    </div>
  )
}

export function DynamicDescriptorMatrix({ candidate }) {
  const [activeGroup, setActiveGroup] = useState("all")
  const rows = useMemo(() => buildDescriptorRows(candidate), [candidate])
  const visibleRows = useMemo(() => (
    activeGroup === "all" ? rows : rows.filter((row) => row.group === activeGroup)
  ), [activeGroup, rows])

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {}), [rows])

  return (
    <section style={{ background: organicAcidPalette.bg, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 18, fontFamily: ORGANIC_ACID_FONT }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.18, textTransform: "uppercase" }}>Dynamic Descriptor Matrix</div>
        <h2 style={{ color: organicAcidPalette.text, fontSize: 22, lineHeight: 1.2, margin: 0 }}>动态描述符表 Dynamic Descriptor Matrix</h2>
        <p style={{ color: organicAcidPalette.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          以当前候选为中心展示可直接填数的数据表。缺失字段保留为 pending / demo placeholder，便于后续接入真实整理数据。
        </p>
      </div>

      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div style={{ background: organicAcidPalette.surface, border: `1px solid ${organicAcidPalette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: organicAcidPalette.faint, fontSize: 10.5, fontWeight: 800 }}>当前候选 Current candidate</div>
          <div style={{ color: organicAcidPalette.text, fontSize: 15.5, fontWeight: 700, lineHeight: 1.2, marginTop: 5 }}>{candidate?.mof || "pending"}</div>
          <div style={{ color: organicAcidPalette.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>
            表格随 Candidate Ranking / Algorithm Trace 选中项同步。
          </div>
        </div>
        <DescriptorStat label="Available" value={counts.available || 0} tone={organicAcidPalette.positive} />
        <DescriptorStat label="Pending" value={counts.pending || 0} tone={organicAcidPalette.faint} />
        <DescriptorStat label="Missing / Partial" value={(counts.missing || 0) + (counts.partial || 0)} tone={organicAcidPalette.mixed} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {descriptorGroupTabs.map((tab) => {
          const active = tab.key === activeGroup
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveGroup(tab.key)}
              style={{
                background: active ? organicAcidPalette.accentSoft : organicAcidPalette.bg,
                border: `1px solid ${active ? organicAcidPalette.accent : organicAcidPalette.border}`,
                borderRadius: 10,
                color: active ? organicAcidPalette.accent : organicAcidPalette.muted,
                cursor: "pointer",
                fontFamily: ORGANIC_ACID_FONT,
                fontSize: 12.5,
                fontWeight: 700,
                padding: "6px 10px",
              }}
            >
              {tab.labelZh} {tab.labelEn}
            </button>
          )
        })}
      </div>

      <div style={{ maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 980, width: "100%" }}>
          <thead>
            <tr>
              {["描述符 Descriptor", "分组 Group", "当前值 Value", "单位 Unit", "数据状态 Status", "证据等级 Evidence", "用于算法 Used in", "来源 / 备注 Source note"].map((head) => (
                <th key={head} style={{ borderBottom: `1px solid ${organicAcidPalette.borderStrong}`, color: organicAcidPalette.faint, fontSize: 11, fontWeight: 900, padding: "9px 10px", textAlign: "left", whiteSpace: "nowrap" }}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => {
              const tone = toneForStatus(row.status)
              return (
                <tr key={row.key} style={{ background: index % 2 === 0 ? organicAcidPalette.bg : organicAcidPalette.surface }}>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, padding: "10px" }}>
                    <div><DescriptorLabel descriptor={row.key} /></div>
                    <div style={{ color: organicAcidPalette.muted, fontSize: 11.5, fontWeight: 500, marginTop: 4 }}>{row.labelZh} / {row.labelEn}</div>
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                    {row.groupZh} {row.groupEn}
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.text, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                    <NumericText>{fmtValue(row.value)}</NumericText>
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                    {row.unit || "—"}
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, padding: "10px", whiteSpace: "nowrap" }}>
                    <span style={{ background: tone.bg, borderRadius: 999, color: tone.text, display: "inline-flex", fontSize: 11.5, fontWeight: 800, padding: "4px 8px" }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                    {row.evidence}
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.text, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>
                    {row.usedIn.join(" / ")}
                  </td>
                  <td style={{ borderBottom: `1px solid ${organicAcidPalette.border}`, color: organicAcidPalette.muted, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>
                    {row.source}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
