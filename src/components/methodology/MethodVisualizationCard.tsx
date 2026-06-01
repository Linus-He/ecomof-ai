// @ts-nocheck
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChemicalText, SCIENTIFIC_TOKEN_FONT } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const barData = [
  { name: "stability", value: 0.28 },
  { name: "uptake", value: 0.24 },
  { name: "selectivity", value: 0.21 },
  { name: "evidence", value: 0.17 },
  { name: "risk", value: 0.10 },
]

const lineData = [
  { x: -20, y: 0.66 },
  { x: -10, y: 0.69 },
  { x: 0, y: 0.71 },
  { x: 10, y: 0.70 },
  { x: 20, y: 0.67 },
]

const scatterData = [
  { x: 0.35, y: 0.42, z: 80 },
  { x: 0.52, y: 0.68, z: 160 },
  { x: 0.72, y: 0.58, z: 120 },
  { x: 0.86, y: 0.79, z: 210 },
]

function MiniChart({ type, t }) {
  const commonAxis = { tick: { fill: t.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 10 } }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={lineData} margin={{ top: 10, right: 12, bottom: 8, left: -18 }}>
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" />
          <XAxis dataKey="x" {...commonAxis} />
          <YAxis domain={[0, 1]} {...commonAxis} />
          <Tooltip wrapperStyle={{ zIndex: 30 }} />
          <Line type="monotone" dataKey="y" stroke={t.accent} strokeWidth={2.4} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }
  if (type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={150}>
        <ScatterChart margin={{ top: 10, right: 12, bottom: 8, left: -18 }}>
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={[0, 1]} {...commonAxis} />
          <YAxis type="number" dataKey="y" domain={[0, 1]} {...commonAxis} />
          <Tooltip wrapperStyle={{ zIndex: 30 }} />
          <Scatter data={scatterData} fill={t.accent}>
            {scatterData.map((row, index) => <Cell key={index} fill={index % 2 ? t.success || t.accent : t.accent} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    )
  }
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={barData} margin={{ top: 10, right: 12, bottom: 8, left: -18 }}>
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" />
          <XAxis dataKey="name" {...commonAxis} />
          <YAxis {...commonAxis} />
          <Tooltip wrapperStyle={{ zIndex: 30 }} />
          <Bar dataKey="value" fill={t.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  return (
    <div style={{ alignItems: "center", background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12, minHeight: 118, padding: 12, textAlign: "center" }}>
      {type === "flow" ? "Data → provenance → comparison → validation" : "score / tier / evidence view"}
    </div>
  )
}

export function MethodVisualizationCard({ visualization, lang, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
      <div>
        <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5, lineHeight: 1.3 }}>
          <ChemicalText value={text(lang, visualization.titleZh, visualization.title)} />
        </strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5, margin: "5px 0 0" }}>
          <ChemicalText value={text(lang, visualization.descriptionZh, visualization.description)} />
        </p>
      </div>
      <MiniChart type={visualization.chartType} t={t} />
    </article>
  )
}
