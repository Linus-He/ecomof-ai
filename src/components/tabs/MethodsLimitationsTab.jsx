import { useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  ChemFormula,
  CopyLinkButton,
  FONT_MONO,
  PageHeader,
  SCIENTIFIC_TOKEN_FONT,
  ScientificText,
  chemText,
  fetchDataJson,
  useLang,
  useT,
  useViewport,
} from "../../shared"

const NAV_ORDER = [
  "home-platform",
  "ecoscreen",
  "gassep",
  "catalysis-lab",
  "organic-acid",
  "mof-library",
  "performance",
]

function text(lang, zh, en) {
  return lang === "zh" ? zh : en
}

function scrollToSection(id) {
  if (typeof document === "undefined") return
  const target = document.getElementById(id)
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`)
  }
}

function Pill({ children, t, tone = "info" }) {
  const palette = {
    info: { bg: t.badgeInfoBg, color: t.accentText, border: t.border },
    warn: { bg: t.badgeWarnBg, color: t.warn, border: t.warn },
    proxy: { bg: t.surface, color: t.subtle, border: t.border },
  }[tone]
  return (
    <span style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.color, display: "inline-flex", fontSize: 10.5, fontWeight: 850, lineHeight: 1.25, padding: "4px 8px" }}>
      <ScientificText>{children}</ScientificText>
    </span>
  )
}

function SectionShell({ id, eyebrow, title, subtitle, children, t }) {
  return (
    <section id={id} className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, minWidth: 0, padding: 16, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{eyebrow}</div>
        <h2 style={{ color: t.textStrong, fontSize: 21, fontWeight: 930, lineHeight: 1.18, margin: 0 }}>{title}</h2>
        {subtitle ? <p style={{ color: t.subtle, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  )
}

function MethodCard({ item, t, lang }) {
  const zh = lang === "zh"
  return (
    <article id={`methodology-${item.id === "organic-acid" ? "organic-acid" : item.id}`} style={{ background: t.surface, border: `1px solid ${item.id === "gassep" || item.id === "organic-acid" ? t.accent : t.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, padding: 13, scrollMarginTop: 118 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, item.moduleZh, item.module)}</div>
          <h3 style={{ color: t.textStrong, fontSize: 16, fontWeight: 930, lineHeight: 1.25, margin: "4px 0 0" }}>{text(lang, item.titleZh, item.title)}</h3>
        </div>
        <BasisBadge tone={item.id === "gassep" || item.id === "organic-acid" ? "warn" : "info"}>
          {item.id === "gassep" ? "GasSep" : item.id === "organic-acid" ? "Organic Acid" : "method"}
        </BasisBadge>
      </div>

      <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58 }}>{text(lang, item.purposeZh, item.purpose)}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
        {[
          [text(lang, "输入", "Inputs"), zh ? item.inputsZh : item.inputs],
          [text(lang, "输出", "Outputs"), zh ? item.outputsZh : item.outputs],
          [text(lang, "证据类型", "Evidence types"), item.evidenceTypes],
        ].map(([label, rows]) => (
          <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, marginBottom: 7 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(rows || []).map(row => <Pill key={row} t={t} tone="proxy">{chemText(row)}</Pill>)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.55, padding: 10 }}>
        {((zh ? item.limitationsZh : item.limitations) || []).map(limit => <div key={limit}>{chemText(limit)}</div>)}
      </div>
    </article>
  )
}

function SharedComponents({ t, lang, isMobile }) {
  const rows = [
    ["Field-level provenance", "字段级来源", "sourceId / sourceLocation / evidenceType / curationStatus"],
    ["Evidence level", "证据等级", "experimental / literature / simulation / rule-based / needs-validation"],
    ["Condition key", "条件键", "gas system + feed ratio + temperature + pressure + method"],
    ["Chemistry text", "化学文本", "CO₂ / CH₄ / N₂ / C₂H₂ / C₂H₄ / HCO₃⁻"],
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
      {rows.map(([en, zh, body]) => (
        <article key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{text(lang, zh, en)}</div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 7, fontFamily: SCIENTIFIC_TOKEN_FONT }}>{chemText(body)}</div>
        </article>
      ))}
    </div>
  )
}

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [modules, setModules] = useState([])

  useEffect(() => {
    let active = true
    fetchDataJson("methodology_modules_demo.json", [])
      .then(rows => {
        if (!active) return
        setModules(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (active) setModules([])
      })
    return () => { active = false }
  }, [])

  const orderedModules = useMemo(() => {
    const byId = new Map(modules.map(item => [item.id, item]))
    return NAV_ORDER.map(id => byId.get(id)).filter(Boolean)
  }, [modules])

  const sectionLinks = [
    ["platform-method-overview", text(lang, "平台总览", "Overview")],
    ["module-method-index", text(lang, "模块索引", "Module Index")],
    ["methods-by-module", text(lang, "按模块方法", "Methods by Module")],
    ["shared-method-components", text(lang, "共享方法组件", "Shared Components")],
    ["limitations", text(lang, "限制", "Limitations")],
    ["future-validation-roadmap", text(lang, "未来验证", "Future Validation")],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "方法与证据", "Methods & Evidence")}
        subtitle={text(
          lang,
          "按 Web 菜单栏分类说明 EcoMOF-AI 各模块的方法、输入、输出、证据类型、限制与验证路线。",
          "Methodology is organized by the web navigation: module purpose, inputs, outputs, evidence types, limitations, and validation roadmap."
        )}
        meta={text(lang, "platform overview · module methods · shared components · limitations", "platform overview · module methods · shared components · limitations")}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "决策支持，不是验证结论", "decision support, not validation")}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={text(lang, "复制方法论链接", "Copy methodology link")} />
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "230px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, maxHeight: isNarrow ? "none" : "calc(100vh - 120px)", overflow: "auto", padding: 10, position: isNarrow ? "static" : "sticky", top: 92 }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, marginBottom: 8, textTransform: "uppercase" }}>{text(lang, "页面结构", "Contents")}</div>
          <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible" }}>
            {[...sectionLinks, ["methodology-gassep", "GasSep"], ["methodology-organic-acid", "Organic Acid"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 820, padding: "7px 8px", textAlign: "left", whiteSpace: "nowrap" }}>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <SectionShell id="platform-method-overview" eyebrow="01" title={text(lang, "Platform Method Overview", "Platform Method Overview")} subtitle={text(lang, "先总览，再进入各模块方法。所有结果都按证据状态和使用边界解释。", "Overview first, then module-level methods. Every output is read with evidence status and usage boundaries.")} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {[
                [text(lang, "数据来源", "Data sources"), text(lang, "静态 JSON、Open MOF Seed、demo records 与字段级来源。", "Static JSON, Open MOF Seed, demo records, and field-level provenance.")],
                [text(lang, "解释方式", "Interpretation"), text(lang, "候选优先级和证据提示，不输出验证级结论。", "Candidate priority and evidence cues, not validated conclusions.")],
                [text(lang, "化学文本", "Chemistry text"), <span key="chem"><ChemFormula>CO2</ChemFormula> / <ChemFormula>CH4</ChemFormula> / <ChemFormula>N2</ChemFormula> / <ChemFormula>HCO3-</ChemFormula></span>],
              ].map(([title, body]) => (
                <article key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
                  <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{body}</div>
                </article>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="module-method-index" eyebrow="02" title={text(lang, "Module Method Index", "Module Method Index")} subtitle={text(lang, "顺序与 Web 菜单栏保持一致。", "Order follows the web navigation.")} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {orderedModules.map(item => (
                <button key={item.id} type="button" onClick={() => scrollToSection(`methodology-${item.id === "organic-acid" ? "organic-acid" : item.id}`)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 4, padding: 10, textAlign: "left" }}>
                  <span style={{ color: t.accentText, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 900 }}>{String(item.navOrder).padStart(2, "0")}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 900 }}>{text(lang, item.moduleZh, item.module)}</span>
                </button>
              ))}
            </div>
          </SectionShell>

          <SectionShell id="methods-by-module" eyebrow="03" title={text(lang, "Methods by Module", "Methods by Module")} subtitle={text(lang, "每个模块统一列出 purpose、inputs、outputs、evidence types 与 limitations。", "Each module lists purpose, inputs, outputs, evidence types, and limitations.")} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              {orderedModules.map(item => <MethodCard key={item.id} item={item} t={t} lang={lang} />)}
            </div>
          </SectionShell>

          <SectionShell id="shared-method-components" eyebrow="04" title={text(lang, "Shared Method Components", "Shared Method Components")} subtitle={text(lang, "跨页面复用的条件键、证据状态、字段级来源和化学文本处理。", "Reusable condition keys, evidence status, field provenance, and chemistry text formatting.")} t={t}>
            <SharedComponents t={t} lang={lang} isMobile={isMobile} />
          </SectionShell>

          <SectionShell id="limitations" eyebrow="05" title={text(lang, "Limitations", "Limitations")} subtitle={text(lang, "集中列出不能被误读为验证结论的边界。", "Central limits that prevent decision-support views from being read as validation.")} t={t}>
            <div style={{ display: "grid", gap: 9 }}>
              {[
                text(lang, "GasSep 当前是 curated literature data，不是在线 IAST/GCMC。", "GasSep is curated literature data, not online IAST/GCMC."),
                text(lang, "Organic Acid priority matrix 是决策支持视图，不是已经实验验证的真实排名。", "Organic Acid priority matrix is a decision-support view, not an experimentally validated ranking."),
                text(lang, "Algorithm Trace Explorer 用于解释规则和证据贡献，不证明真实机理因果关系。", "Algorithm Trace Explorer explains rule and evidence contributions. It does not prove mechanistic causality."),
              ].map(row => <div key={row} style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12.5, lineHeight: 1.55, padding: 10 }}>{row}</div>)}
            </div>
          </SectionShell>

          <SectionShell id="future-validation-roadmap" eyebrow="06" title={text(lang, "Future Validation Roadmap", "Future Validation Roadmap")} subtitle={text(lang, "下一步应把文献整理、DFT、实验与字段级来源持续接入。", "Next steps should connect literature curation, DFT, experiments, and field-level provenance.")} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {[
                [text(lang, "GasSep", "GasSep"), text(lang, "接入核验 DOI、原始等温线点和统一条件元数据。", "Add verified DOI, raw isotherm points, and normalized condition metadata.")],
                [text(lang, "Organic Acid", "Organic Acid"), text(lang, "用投料实验、同位素示踪、DFT 与碳平衡更新规则权重。", "Use feeding tests, isotope tracing, DFT, and carbon balance to update rule weights.")],
                [text(lang, "Platform", "Platform"), text(lang, "把字段级 provenance 扩展到每个研究级输出。", "Extend field-level provenance to each research-facing output.")],
              ].map(([title, body]) => (
                <article key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
                  <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{body}</div>
                </article>
              ))}
            </div>
          </SectionShell>
        </main>
      </div>
    </div>
  )
}
