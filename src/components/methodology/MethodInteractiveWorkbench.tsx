// @ts-nocheck
import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { SlidersHorizontal } from "@phosphor-icons/react"

const text = (lang, zh, en) => lang === "zh" ? zh : en

function curveFor(groupId, control) {
  const factor = control / 100
  if (String(groupId).includes("gas") || String(groupId).includes("adsorp")) {
    return Array.from({ length: 13 }, (_, index) => {
      const pressure = index / 2
      const affinity = 0.25 + factor * 1.75
      return {
        x: pressure,
        baseline: Number((4.5 * 0.85 * pressure / (1 + 0.85 * pressure)).toFixed(3)),
        adjusted: Number((4.5 * affinity * pressure / (1 + affinity * pressure)).toFixed(3)),
      }
    })
  }
  if (String(groupId).includes("organic") || String(groupId).includes("candidate") || String(groupId).includes("reaction")) {
    return Array.from({ length: 11 }, (_, index) => {
      const evidence = index / 10
      return {
        x: evidence,
        baseline: Number(Math.pow(Math.max(evidence, 0.001), 0.22).toFixed(3)),
        adjusted: Number(Math.pow(Math.max(evidence * (0.55 + factor * 0.9), 0.001), 0.22).toFixed(3)),
      }
    })
  }
  return Array.from({ length: 11 }, (_, index) => {
    const input = index / 10
    return {
      x: input,
      baseline: Number(input.toFixed(3)),
      adjusted: Number((input * (0.45 + factor * 0.85)).toFixed(3)),
    }
  })
}

export function MethodInteractiveWorkbench({ groupId, lang, t }) {
  const [control, setControl] = useState(70)
  const data = useMemo(() => curveFor(groupId, control), [control, groupId])
  const isGas = String(groupId).includes("gas") || String(groupId).includes("adsorp")
  const xLabel = isGas ? text(lang, "相对压力", "Relative pressure") : text(lang, "归一化输入", "Normalized input")

  return (
    <section data-testid={`method-interactive-${groupId}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, minHeight: 260, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 3 }}>
          <strong style={{ alignItems: "center", color: t.textStrong, display: "flex", fontSize: 12.5, gap: 7 }}>
            <SlidersHorizontal aria-hidden="true" color={t.accentText} size={17} weight="duotone" />
            {text(lang, "动态敏感性演示", "Interactive sensitivity view")}
          </strong>
          <span style={{ color: t.faint, fontSize: 10.3, lineHeight: 1.45 }}>
            {text(lang, "仅用于理解变量方向；不改写正式参数或候选结果。", "Explanatory only; official parameters and candidate results are not changed.")}
          </span>
        </div>
        <strong style={{ color: t.accentText, fontSize: 12 }}>{control}%</strong>
      </header>
      <input
        aria-label={text(lang, "调整演示参数", "Adjust demonstration parameter")}
        type="range"
        min="20"
        max="100"
        step="5"
        value={control}
        onChange={event => setControl(Number(event.target.value))}
        style={{ accentColor: t.accent, width: "100%" }}
      />
      <div style={{ height: 170, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 2, left: -16 }}>
            <CartesianGrid stroke={t.divider || t.border} strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="x" tick={{ fill: t.faint, fontSize: 9 }} tickLine={false} axisLine={{ stroke: t.border }} label={{ value: xLabel, position: "insideBottomRight", offset: -1, fill: t.faint, fontSize: 9 }} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: t.faint, fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 11 }} />
            <ReferenceLine y={0} stroke={t.borderStrong || t.border} />
            <Line type="monotone" dataKey="baseline" name={text(lang, "基准", "Baseline")} stroke={t.faint} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="adjusted" name={text(lang, "调整后", "Adjusted")} stroke={t.accent} strokeWidth={2.4} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
