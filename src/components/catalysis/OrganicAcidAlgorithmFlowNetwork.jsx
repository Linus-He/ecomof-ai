import {
  buildAlgorithmFlowMarkdownSummary,
  buildCandidateCompetitionCsv,
  buildFlowNetworkExportJson,
  buildNodeInspectorSummaryJson,
  buildRouteCompetitionCsv,
} from "../../utils/organicAcidAlgorithmFlow"
import { NumericText, organicAcidPalette as palette, ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function fmt(value, digits = 3) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0"
  return next.toFixed(digits)
}

function cardStyle(style = {}) {
  return {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    display: "grid",
    gap: 9,
    minWidth: 0,
    padding: 12,
    ...style,
  }
}

function buttonStyle(active = false, style = {}) {
  return {
    background: active ? palette.accentSoft : palette.bg,
    border: `1px solid ${active ? palette.accent : palette.border}`,
    borderRadius: 8,
    color: active ? palette.accent : palette.text,
    cursor: "pointer",
    fontFamily: ORGANIC_ACID_FONT,
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.35,
    minHeight: 34,
    padding: "8px 10px",
    textAlign: "left",
    ...style,
  }
}

function pillStyle(tone = "info") {
  if (tone === "risk") return { background: palette.riskSoft, border: palette.risk, color: palette.risk }
  if (tone === "good") return { background: palette.positiveSoft, border: palette.positive, color: palette.positive }
  if (tone === "muted") return { background: palette.bg, border: palette.border, color: palette.muted }
  return { background: palette.accentSoft, border: palette.accent, color: palette.accent }
}

function Pill({ children, tone = "info" }) {
  const colors = pillStyle(tone)
  return (
    <span style={{ alignItems: "center", background: colors.background, border: `1px solid ${colors.border}`, borderRadius: 999, color: colors.color, display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

function SectionTitle({ kicker, title, note }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>{kicker}</div>
      <h2 style={{ color: palette.text, fontSize: 19, lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {note ? <p style={{ color: palette.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
    </div>
  )
}

function downloadText(fileName, content, type = "application/json") {
  if (typeof document === "undefined") return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function roleTone(role) {
  if (role === "top") return "good"
  if (role === "backup" || role === "conditional") return "info"
  if (role === "control" || role === "pending") return "muted"
  return "info"
}

function nodeBackground(node, active, highlighted) {
  if (active) return palette.accentSoft
  if (highlighted) return node.pathRole === "top" ? palette.positiveSoft : palette.accentSoft
  if (node.pathRole === "control" || node.pathRole === "pending") return palette.bg
  return palette.surface
}

export function OrganicAcidAlgorithmStatusBar({ network, lang = "zh", onStartPath }) {
  const status = network.statusBar
  return (
    <section data-testid="organic-acid-algorithm-status-bar" style={{ ...cardStyle({ background: palette.bg, padding: 12 }) }}>
      <div style={{ alignItems: "center", display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <Pill tone="good">{text(lang, "当前阶段：", "Stage: ")}{status.stage}</Pill>
          <Pill tone="muted">{text(lang, "输入规模：", "Input scale: ")}{text(lang, status.inputScaleLabelZh, status.inputScaleLabelEn)}</Pill>
          <Pill>{text(lang, "当前链条：", "Chain: ")}{status.chainZh}</Pill>
          <Pill>{text(lang, "当前输出：", "Output: ")}{status.output}</Pill>
          <Pill tone="risk">{text(lang, "边界：", "Boundary: ")}{text(lang, status.boundaryZh, status.boundaryEn)}</Pill>
          <Pill tone="muted">{text(lang, "readiness：", "readiness: ")}{status.readinessZh}</Pill>
        </div>
        <button type="button" onClick={onStartPath} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center", whiteSpace: "nowrap" }}>
          {text(lang, status.actionLabelZh, status.actionLabelEn)}
        </button>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {[
          [text(lang, "主体候选", "host candidates"), status.inputScale.hostCandidates],
          [text(lang, "客体金属", "guest metals"), status.inputScale.guestMetals],
          [text(lang, "实验路线", "routes"), status.inputScale.routes],
          [text(lang, "证据风险记录", "evidence-risk records"), status.inputScale.evidenceRiskRecords],
        ].map(([label, value]) => (
          <div key={label} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 9 }}>
            <span style={{ color: palette.faint, display: "block", fontSize: 10.5, fontWeight: 850 }}>{label}</span>
            <NumericText style={{ color: palette.text, display: "block", fontSize: 18, fontWeight: 950, marginTop: 2 }}>{value}</NumericText>
          </div>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidAlgorithmFlowNetwork({ network, selectedNodeId, onSelectNode, lang = "zh", isNarrow = false }) {
  const topPath = new Set(network.highlightedPaths.topPath)
  const backupPath = new Set(network.highlightedPaths.backupPath)
  const controlPath = new Set(network.highlightedPaths.controlPath)
  return (
    <section data-testid="organic-acid-algorithm-flow-network" style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Algorithm Flow Network"
        title={text(lang, "有机酸算法链式网络", "Organic Acid Algorithm Flow Network")}
        note={text(lang, "从 CO2 路径步骤开始，沿描述符、主体候选、客体金属、主客体路线、证据风险和验证实验逐步推导路线输出。", "Starts from CO2 pathway steps and moves through descriptors, host candidates, guest metals, routes, evidence/risk, and validation experiments.")}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <Pill tone="good">{text(lang, "高亮：当前 top path", "Highlighted: current top path")}</Pill>
        <Pill>{text(lang, "弱化：backup / conditional path", "Subdued: backup / conditional path")}</Pill>
        <Pill tone="muted">{text(lang, "对照：control / pending path", "Control: control / pending path")}</Pill>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : `repeat(${network.columns.length}, minmax(132px, 1fr))`, overflowX: "auto" }}>
        {network.columns.map(column => (
          <div key={column.id} style={{ display: "grid", gap: 8, minWidth: isNarrow ? 0 : 132 }}>
            <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>{column.label}</div>
            {column.nodeIds.slice(0, 8).map(id => {
              const node = network.nodes.find(row => row.id === id)
              if (!node) return null
              const highlighted = topPath.has(id) || backupPath.has(id) || controlPath.has(id)
              const active = selectedNodeId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectNode(id)}
                  style={{
                    ...buttonStyle(active, {
                      background: nodeBackground(node, active, highlighted),
                      border: `1px solid ${active || topPath.has(id) ? palette.accent : palette.border}`,
                      minHeight: 78,
                      opacity: node.pathRole === "control" || node.pathRole === "pending" ? 0.78 : 1,
                    }),
                  }}
                >
                  <span style={{ color: palette.faint, display: "block", fontSize: 10.5, fontWeight: 900 }}>{node.typeLabelZh}</span>
                  <span style={{ color: palette.text, display: "block", fontSize: 12.2, fontWeight: 950, lineHeight: 1.25, marginTop: 3 }}>{node.labelZh}</span>
                  <span style={{ color: palette.muted, display: "block", fontSize: 11, lineHeight: 1.35, marginTop: 5 }}>{node.statusZh}</span>
                  <span style={{ display: "block", marginTop: 6 }}><Pill tone={roleTone(node.pathRole)}>{node.pathRole}</Pill></span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "网络边类型", "Network edge types")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Array.from(new Set(network.edges.map(edge => edge.type))).map(type => (
            <Pill key={type} tone={type.includes("risk") ? "risk" : "muted"}>{type}</Pill>
          ))}
        </div>
      </div>
    </section>
  )
}

export function OrganicAcidNodeInspector({ inspector, lang = "zh", onOpenActivationCenter, onOpenAdvancedTab, onOpenMethodology }) {
  return (
    <aside data-testid="organic-acid-node-inspector" style={{ ...cardStyle({ alignSelf: "start", background: palette.surfaceStrong, position: "sticky", top: 88 }) }}>
      <SectionTitle
        kicker="Node Inspector"
        title={text(lang, "节点解释器", "Node Inspector")}
        note={text(lang, "点击网络节点后，查看输入、输出、证据风险、HGCPS 影响和下一步。", "Click a network node to inspect input, output, evidence/risk, HGCPS impact, and next step.")}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Pill>{inspector.typeLabel}</Pill>
        {inspector.boundaries.map(boundary => <Pill key={boundary} tone="risk">{boundary}</Pill>)}
      </div>
      <h3 style={{ color: palette.text, fontSize: 18, lineHeight: 1.2, margin: 0 }}>{inspector.name}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          [text(lang, "链条角色", "Role in chain"), inspector.roleInChain],
          [text(lang, "输入", "Input"), inspector.input],
          [text(lang, "输出", "Output"), inspector.output],
          [text(lang, "证据状态", "Evidence status"), inspector.evidenceStatus],
          [text(lang, "风险状态", "Risk status"), inspector.riskStatus],
          [text(lang, "为什么进入下一步", "Why next step"), inspector.whyNextStep],
          [text(lang, "HGCPS 影响", "HGCPS impact"), inspector.hgcpsImpact],
        ].map(([label, value]) => (
          <div key={label} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 9 }}>
            <span style={{ color: palette.faint, display: "block", fontSize: 10.5, fontWeight: 850 }}>{label}</span>
            <span style={{ color: palette.muted, display: "block", fontSize: 11.8, lineHeight: 1.45, marginTop: 4 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "相关项", "Related items")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {inspector.relatedDescriptors.slice(0, 8).map(item => <Pill key={item} tone="muted">{item}</Pill>)}
          {inspector.relatedRoutes.slice(0, 4).map(item => <Pill key={item}>{item}</Pill>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => onOpenMethodology(inspector.methodologyAnchor)} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "查看方法论公式", "View methodology formula")}
        </button>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "实验启用中心", "Activation Center")}
        </button>
        <button type="button" onClick={() => onOpenAdvancedTab("risk")} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "缺失证据与风险矩阵", "Missing Evidence & Risk Matrix")}
        </button>
      </div>
    </aside>
  )
}

function CompactTable({ rows, columns, rowKey, maxRows = 6 }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 780, width: "100%" }}>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map(row => (
            <tr key={rowKey(row)} style={{ background: row.rank === 1 ? palette.accentSoft : "transparent" }}>
              {columns.map(column => (
                <td key={column.key} style={{ borderBottom: `1px solid ${palette.border}`, color: column.numeric ? palette.accent : palette.muted, fontFamily: column.numeric ? SCIENTIFIC_TOKEN_FONT : ORGANIC_ACID_FONT, fontSize: 11.7, fontWeight: column.strong ? 850 : 500, lineHeight: 1.4, padding: "8px 9px", verticalAlign: "top" }}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OrganicAcidCandidateCompetitionView({ network, lang = "zh" }) {
  const hosts = network.competition.hosts
  const guests = network.competition.guests
  const routes = network.competition.routes
  return (
    <section id="organic-acid-candidate-competition" data-testid="organic-acid-candidate-competition" style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}>
      <SectionTitle
        kicker="Candidate Competition"
        title={text(lang, "候选竞争", "Candidate Competition")}
        note={text(lang, "先解释 Al-MOF 为什么赢得主体竞争，再解释 Mo 为什么赢得客体竞争，最后解释 Al-MOF + Mo 为什么赢得路线竞争。", "Explains why Al-MOF wins host competition, why Mo wins guest competition, and why Al-MOF + Mo wins route competition.")}
      />
      <div style={{ display: "grid", gap: 12 }}>
        <article style={cardStyle()}>
          <strong style={{ color: palette.text, fontSize: 13.5 }}>{text(lang, "Host Competition / 主体 MOF 竞争", "Host Competition")}</strong>
          <CompactTable
            rows={hosts}
            rowKey={row => row.host}
            maxRows={10}
            columns={[
              { key: "rank", label: "Rank", numeric: true, render: row => `#${row.rank}` },
              { key: "host", label: "Host", strong: true },
              { key: "score", label: "Score", numeric: true, render: row => fmt(row.score, 3) },
              { key: "advantageZh", label: text(lang, "优势", "Advantage") },
              { key: "limitationZh", label: text(lang, "限制", "Limitation") },
              { key: "whySelectedZh", label: text(lang, "为什么入选", "Why selected") },
              { key: "whyNotSelectedZh", label: text(lang, "为什么不是第一", "Why not selected") },
            ]}
          />
        </article>
        <article style={cardStyle()}>
          <strong style={{ color: palette.text, fontSize: 13.5 }}>{text(lang, "Guest Competition / 客体金属竞争", "Guest Competition")}</strong>
          <CompactTable
            rows={guests}
            rowKey={row => row.metal}
            maxRows={8}
            columns={[
              { key: "rank", label: "Rank", numeric: true, render: row => `#${row.rank}` },
              { key: "metal", label: "Metal", strong: true },
              { key: "score", label: "Score", numeric: true, render: row => fmt(row.score, 3) },
              { key: "supportsPathwayZh", label: text(lang, "支持路径", "Supports pathway") },
              { key: "advantageZh", label: text(lang, "优势", "Advantage") },
              { key: "whySelectedZh", label: text(lang, "为什么入选", "Why selected") },
              { key: "whyNotSelectedZh", label: text(lang, "为什么不是第一", "Why not selected") },
            ]}
          />
        </article>
        <article style={cardStyle()}>
          <strong style={{ color: palette.text, fontSize: 13.5 }}>{text(lang, "Route Competition / 路线竞争", "Route Competition")}</strong>
          <CompactTable
            rows={routes}
            rowKey={row => row.routeId}
            maxRows={25}
            columns={[
              { key: "rank", label: "Rank", numeric: true, render: row => `#${row.rank}` },
              { key: "route", label: text(lang, "路线", "Route"), strong: true },
              { key: "hgcps", label: "HGCPS", numeric: true, render: row => fmt(row.hgcps, 3) },
              { key: "evidenceConfidence", label: text(lang, "证据", "Evidence"), numeric: true, render: row => fmt(row.evidenceConfidence, 2) },
              { key: "riskRetention", label: text(lang, "风险保留", "Risk retention"), numeric: true, render: row => fmt(row.riskRetention, 2) },
              { key: "whyRankedHereZh", label: text(lang, "排序原因", "Why ranked here") },
              { key: "whyNotHigherZh", label: text(lang, "为何不更高", "Why not higher") },
            ]}
          />
        </article>
      </div>
    </section>
  )
}

export function OrganicAcidRouteOutputPanel({ network, lang = "zh", onOpenActivationCenter, onOpenMethodology, onOpenAlternatives }) {
  const output = network.routeOutput
  const top = output.topRoute || {}
  const exportRows = [
    ["Algorithm Flow Network JSON", () => downloadText("organic-acid-algorithm-flow-network.json", JSON.stringify(buildFlowNetworkExportJson(network), null, 2))],
    ["Node Inspector Summary JSON", () => downloadText("organic-acid-node-inspector-summary.json", JSON.stringify(buildNodeInspectorSummaryJson(network.nodeInspector), null, 2))],
    ["Candidate Competition CSV", () => downloadText("organic-acid-candidate-competition.csv", buildCandidateCompetitionCsv(network), "text/csv")],
    ["Route Competition CSV", () => downloadText("organic-acid-route-competition.csv", buildRouteCompetitionCsv(network), "text/csv")],
    ["Algorithm Flow Markdown Summary", () => downloadText("organic-acid-algorithm-flow-summary.md", buildAlgorithmFlowMarkdownSummary(network), "text/markdown")],
  ]
  return (
    <section data-testid="organic-acid-route-output" style={{ ...cardStyle({ background: palette.surfaceStrong, padding: 14 }) }}>
      <SectionTitle
        kicker="Route Output"
        title={text(lang, "路线输出", "Route Output")}
        note={text(lang, "这里才展示当前输出：Al-MOF + Mo 是最高优先级验证路线，可用于实验规划，但不是最终催化性能证明。", "The current output appears here: Al-MOF + Mo is the top-priority validation route for planning, not final catalytic proof.")}
      />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={cardStyle({ background: palette.bg })}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "路线", "Route")}</span>
          <strong style={{ color: palette.text, fontSize: 17 }}>{output.routeName}</strong>
          <NumericText style={{ color: palette.accent, fontSize: 14, fontWeight: 950 }}>HGCPS {fmt(top.hgcps, 3)}</NumericText>
        </div>
        <div style={cardStyle({ background: palette.bg })}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "输出性质", "Output nature")}</span>
          <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, output.outputNatureZh, output.outputNatureEn)}</strong>
          <span style={{ color: palette.risk, fontSize: 12, lineHeight: 1.45 }}>{output.boundaries.join("; ")}</span>
        </div>
        <div style={cardStyle({ background: palette.bg })}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "为什么是当前第一", "Why current first")}</span>
          <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>{text(lang, top.whyRankedHereZh, top.whyRankedHereEn)}</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "下一步", "Next actions")}</strong>
        {(lang === "zh" ? output.nextActionsZh : output.nextActionsEn).map(action => (
          <div key={action} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 12, lineHeight: 1.45, padding: 9 }}>{action}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "查看实验启用中心", "View Activation Center")}
        </button>
        <button type="button" onClick={() => onOpenMethodology("#project-evolution-organic-acid-algorithm-methodology-formula-hgcps")} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "查看 HGCPS 公式", "View HGCPS formula")}
        </button>
        <button type="button" onClick={onOpenAlternatives} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          {text(lang, "查看为什么不是其他路线", "View why not other routes")}
        </button>
        {exportRows.map(([label, action]) => (
          <button key={label} type="button" onClick={action} style={{ ...buttonStyle(false), textAlign: "center" }}>
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidAlgorithmFlowExportLinks({ network, lang = "zh", onOpenMethodology }) {
  return (
    <section data-testid="organic-acid-export-methodology-links" style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Export / Methodology Links"
        title={text(lang, "导出 / 方法论链接", "Export / Methodology Links")}
        note={text(lang, "链式网络、节点解释、候选竞争、路线竞争和 Markdown 摘要均由同一 flow builder 派生。", "Network, node inspector, candidate competition, route competition, and Markdown summary are all derived from the same flow builder.")}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => onOpenMethodology("#project-evolution-organic-acid-algorithm-methodology")} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          Organic Acid Algorithm Methodology
        </button>
        <Pill>{network.version}</Pill>
        <Pill tone="risk">{text(lang, "非最终催化性能证明", "Not final catalytic proof")}</Pill>
        <Pill tone="risk">{text(lang, "非正式机器学习推荐", "Not formal machine learning recommendation")}</Pill>
      </div>
    </section>
  )
}
