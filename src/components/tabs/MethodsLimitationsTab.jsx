import {
  BasisBadge,
  CopyLinkButton,
  FONT_MONO,
  PageHeader,
  useLang,
  useT,
  useViewport,
} from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const sections = [
  ["method-overview", "Method Overview", "方法总览"],
  ["evidence-levels", "Evidence Levels", "证据等级"],
  ["reaction-fingerprint", "Reaction Fingerprint Scoring", "路径指纹评分"],
  ["score-boundary", "What the Score Means", "分数边界"],
  ["data-provenance", "Data Provenance", "数据来源"],
  ["validation-roadmap", "Validation Roadmap", "验证路线"],
]

const overviewSteps = [
  {
    title: "Candidate Pathway Library",
    zhTitle: "候选路径库",
    body: "Build a candidate network first instead of assuming one confirmed glucose / bicarbonate-to-formate mechanism.",
    zhBody: "先建立候选路径网络，而不是预设唯一且已确认的 glucose / bicarbonate-to-formate 机理。",
  },
  {
    title: "MOF Descriptor & Risk Tagging",
    zhTitle: "MOF 描述符与风险标签",
    body: "Use descriptor curation and reaction-readiness tags to flag stability, pore access, active sites, and release risk.",
    zhBody: "用描述符整理和 reaction-readiness tags 标注稳定性、孔可及性、活性位点和释放风险。",
  },
  {
    title: "Reaction Fingerprint Scoring",
    zhTitle: "路径指纹评分",
    body: "A1/A2/A3/A4/B1 values are expert-prior pathway fingerprints for ranking and explanation, not yield prediction.",
    zhBody: "A1/A2/A3/A4/B1 是用于排序与解释的专家先验路径指纹，不是产率预测。",
  },
  {
    title: "Experimental Calibration & Active Learning",
    zhTitle: "实验校准与主动学习",
    body: "Use feeding tests, isotope tracing, time-series detection, and post-reaction characterization to update pathway weights.",
    zhBody: "用中间体投料、同位素示踪、时间序列和反应后表征来修正路径权重。",
  },
]

const evidenceLevels = [
  {
    level: "A",
    label: "Strong evidence",
    items: ["isotope tracing", "feeding experiment", "time-series detection", "direct product tracking"],
    tone: "strong",
  },
  {
    level: "B",
    label: "Literature-supported",
    items: ["literature mechanism", "related product/intermediate evidence", "not directly validated in current MOF/NaHCO3 system"],
    tone: "supported",
  },
  {
    level: "C",
    label: "Hypothesis",
    items: ["chemically plausible", "supported by site/pathway logic", "needs experimental validation"],
    tone: "uncertain",
  },
  {
    level: "D",
    label: "Open uncertainty",
    items: ["unknown carbon loss", "humins", "unassigned LC-MS/GC-MS peaks", "unresolved mechanism"],
    tone: "open",
  },
]

const fingerprintRows = [
  ["A1", "Sugar activation", "glucose isomerization / early cleavage ability", "positive"],
  ["A2", "Formate precursor generation", "HCHO / glyceraldehyde / pyruvaldehyde precursor generation", "positive"],
  ["A3", "Intermediate-to-formate", "candidate intermediates converting to formate", "positive"],
  ["A4", "Formate release", "formate recovery / stability / adsorption penalty", "positive"],
  ["B1", "Byproduct risk", "lactic / acetic / glycolic / pyruvic / humins / carbon loss", "risk"],
]

const meansRows = [
  {
    title: "What it means",
    zhTitle: "它表示什么",
    items: [
      "candidate prioritization",
      "hypothesis generation",
      "descriptor-based ranking",
      "experimental planning",
      "pathway-level explanation",
    ],
    tone: "positive",
  },
  {
    title: "What it does not mean",
    zhTitle: "它不表示什么",
    items: [
      "validated yield prediction",
      "proven reaction mechanism",
      "completed LCA",
      "completed DFT proof",
      "guaranteed catalytic performance",
    ],
    tone: "warn",
  },
]

const descriptorRows = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

const readinessRows = [
  "water stability",
  "pore access",
  "hydrophilic sites",
  "Lewis acid sites",
  "formate release risk",
  "synthesis readiness",
]

const provenanceNotes = [
  ["Demo data", "Workflow demonstration only; it is not experimental evidence."],
  ["Real-seed data", "Public seed records may still contain pending descriptors and name-curation gaps."],
  ["Expert-prior data", "Mechanistic priors support ranking discussions, not measured catalytic conclusions."],
  ["Field-level provenance", "Every research-facing field needs source, version, citation, and curation state."],
  ["Descriptor curation", "Each MOF descriptor should be marked curated, pending, or needs review."],
]

const validationRows = [
  ["HCHO feeding experiment", "C1-to-formate route", "planned", "high"],
  ["Glyceraldehyde feeding experiment", "C3-to-formate / byproduct competition", "planned", "high"],
  ["Pyruvaldehyde feeding experiment", "formate vs lactic acid branch", "planned", "high"],
  ["HCOONa/HCOOH recovery", "formate release / adsorption risk", "planned", "high"],
  ["NaH13CO3 isotope tracing", "bicarbonate carbon contribution", "future", "medium-high"],
  ["XRD / ICP after reaction", "MOF stability / metal leaching", "future", "high"],
  ["FTIR / XPS after reaction", "formate adsorption / site change", "future", "medium"],
  ["LC-MS / GC-MS / TOC", "unknown carbon loss", "future", "medium"],
]

function scrollToSection(id) {
  if (typeof document === "undefined") return
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function Section({ id, eyebrow, title, subtitle, children, t }) {
  return (
    <section
      id={id}
      className="content-card"
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        display: "grid",
        gap: 14,
        minWidth: 0,
        padding: 16,
        scrollMarginTop: 118,
      }}
    >
      <header>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, letterSpacing: 0, textTransform: "uppercase" }}>
          {eyebrow}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.18, margin: "5px 0 0" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ color: t.subtle, fontSize: 12.5, lineHeight: 1.6, margin: "7px 0 0", maxWidth: 860 }}>
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

function MiniCard({ children, t, tone = "neutral", style }) {
  const palette = {
    neutral: { bg: t.surface, border: t.border },
    info: { bg: t.badgeInfoBg || t.surface, border: t.accent },
    warn: { bg: t.badgeWarnBg || t.surface, border: t.warn },
  }[tone] || { bg: t.surface, border: t.border }
  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, minWidth: 0, padding: 12, ...style }}>
      {children}
    </article>
  )
}

function FlowStep({ step, index, t, lang }) {
  return (
    <MiniCard t={t} style={{ display: "grid", gap: 7, minHeight: 142, position: "relative" }}>
      <div style={{ color: t.accentText, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 950 }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 920, lineHeight: 1.3 }}>
        {text(lang, step.zhTitle, step.title)}
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
        {text(lang, step.zhBody, step.body)}
      </div>
    </MiniCard>
  )
}

function MethodFlow({ t, lang, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: isMobile ? 9 : 12, alignItems: "stretch" }}>
      {overviewSteps.map((step, index) => (
        <div key={step.title} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 18px", gap: isMobile ? 8 : 7, alignItems: "center" }}>
          <FlowStep step={step} index={index} t={t} lang={lang} />
          {!isMobile && index < overviewSteps.length - 1 && (
            <div style={{ color: t.accentText, fontSize: 19, fontWeight: 900, textAlign: "center" }}>→</div>
          )}
        </div>
      ))}
    </div>
  )
}

function LevelBadge({ level, label, tone, t }) {
  const weak = tone === "uncertain" || tone === "open"
  return (
    <span style={{
      border: `1px solid ${weak ? t.warn : t.accent}`,
      borderRadius: 6,
      color: weak ? t.warn : t.accentText,
      display: "inline-flex",
      fontSize: 11,
      fontWeight: 900,
      lineHeight: 1.2,
      padding: "4px 7px",
      whiteSpace: "nowrap",
    }}>
      Level {level} · {label}
    </span>
  )
}

function EvidenceLevelCard({ row, t }) {
  const weak = row.tone === "uncertain" || row.tone === "open"
  return (
    <MiniCard t={t} tone={weak ? "warn" : "neutral"} style={{ display: "grid", gap: 9, minHeight: 170 }}>
      <LevelBadge level={row.level} label={row.label} tone={row.tone} t={t} />
      <ul style={{ color: t.muted, display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {row.items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </MiniCard>
  )
}

function FingerprintRow({ row, t }) {
  const [key, label, description, kind] = row
  const risk = kind === "risk"
  return (
    <div style={{
      alignItems: "start",
      background: t.surface,
      border: `1px solid ${risk ? t.warn : t.border}`,
      borderRadius: 8,
      display: "grid",
      gap: 7,
      gridTemplateColumns: "46px minmax(0, 0.72fr) minmax(0, 1.05fr) minmax(90px, 0.35fr)",
      minWidth: 0,
      padding: 10,
    }}>
      <div style={{ color: risk ? t.warn : t.accentText, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 950 }}>{key}</div>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}>{label}</div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{description}</div>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
          <div style={{ background: risk ? t.warn : t.accentText, height: "100%", width: risk ? "42%" : "64%" }} />
        </div>
        <div style={{ color: risk ? t.warn : t.faint, fontSize: 10.5, fontWeight: 850 }}>{risk ? "risk term" : "capability"}</div>
      </div>
    </div>
  )
}

function TwoColumnMeaning({ t, isMobile, lang }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
      {meansRows.map(row => (
        <MiniCard key={row.title} t={t} tone={row.tone === "warn" ? "warn" : "info"} style={{ display: "grid", gap: 10 }}>
          <div style={{ color: row.tone === "warn" ? t.warn : t.accentText, fontSize: 13, fontWeight: 920 }}>
            {text(lang, row.zhTitle, row.title)}
          </div>
          <ul style={{ color: t.muted, display: "grid", fontSize: 12, gap: 6, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
            {row.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </MiniCard>
      ))}
    </div>
  )
}

function CompactList({ title, rows, t, columns = 2 }) {
  return (
    <MiniCard t={t} style={{ display: "grid", gap: 10 }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 7 }}>
        {rows.map(item => (
          <div key={item} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 820, padding: "7px 8px", overflowWrap: "anywhere" }}>
            {item}
          </div>
        ))}
      </div>
    </MiniCard>
  )
}

function ValidationTable({ t, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {validationRows.map(([task, supports, status, priority]) => (
          <MiniCard key={task} t={t} style={{ display: "grid", gap: 7 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{task}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{supports}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <span style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{status}</span>
              <span style={{ color: priority.includes("high") ? t.warn : t.accentText, fontSize: 11, fontWeight: 900 }}>{priority}</span>
            </div>
          </MiniCard>
        ))}
      </div>
    )
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: "0 7px", minWidth: isMobile ? 760 : "100%", width: "100%" }}>
        <thead>
          <tr style={{ color: t.faint, fontSize: 10.5, textAlign: "left", textTransform: "uppercase" }}>
            <th style={{ padding: "0 10px" }}>Validation task</th>
            <th style={{ padding: "0 10px" }}>Supports</th>
            <th style={{ padding: "0 10px" }}>Current status</th>
            <th style={{ padding: "0 10px" }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {validationRows.map(([task, supports, status, priority]) => (
            <tr key={task} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
              <td style={{ background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850, padding: 10 }}>{task}</td>
              <td style={{ background: t.surface, padding: 10 }}>{supports}</td>
              <td style={{ background: t.surface, padding: 10 }}>{status}</td>
              <td style={{ background: t.surface, borderRadius: "0 7px 7px 0", color: priority.includes("high") ? t.warn : t.accentText, fontWeight: 900, padding: 10 }}>{priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProvenanceSection({ t, lang, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 9 }}>
        {provenanceNotes.map(([title, body]) => (
          <MiniCard key={title} t={t} style={{ display: "grid", gap: 7, minHeight: 118 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{title}</div>
            <div style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.5 }}>{body}</div>
          </MiniCard>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
        <MiniCard t={t} tone="warn" style={{ color: t.muted, display: "grid", fontSize: 12, gap: 7, lineHeight: 1.55 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "关键边界", "Key boundary")}</strong>
          <span>
            {text(
              lang,
              "Reaction-readiness tags 是催化路径解释的补充层，不能替代 MOF Library 中原有 8 个 descriptor checklist 和字段级 provenance。",
              "Reaction-readiness tags are an additional catalysis-explanation layer. They do not replace the MOF Library descriptor checklist or field-level provenance."
            )}
          </span>
        </MiniCard>
        <CompactList title="Core descriptor checklist" rows={descriptorRows} t={t} columns={isMobile ? 1 : 2} />
      </div>
      <CompactList title="Reaction-readiness tags" rows={readinessRows} t={t} columns={isMobile ? 1 : 3} />
    </div>
  )
}

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title="Methods & Evidence"
        subtitle={text(
          lang,
          "说明 EcoMOF-AI 如何连接候选反应路径、MOF 描述符、证据等级与实验验证需求。",
          "How EcoMOF-AI links candidate pathways, MOF descriptors, evidence levels, and experimental validation needs."
        )}
        meta={text(lang, "candidate pathway network · evidence levels · reaction fingerprint · validation boundary", "candidate pathway network · evidence levels · reaction fingerprint · validation boundary")}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "假设生成", "hypothesis generation")}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={text(lang, "复制方法论链接", "Copy methodology link")} />
          </>
        }
      />

      <div style={{ background: t.panel, border: `1px solid ${t.warn}`, borderLeft: `4px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 13, lineHeight: 1.6, padding: "12px 14px" }}>
        <strong style={{ color: t.textStrong }}>
          This framework is designed for hypothesis generation and experimental prioritization, not validated yield prediction at the current stage.
        </strong>
        <div style={{ color: t.subtle, marginTop: 4 }}>
          当前框架用于假设生成与实验优先级排序，并非已验证的甲酸产率预测模型。
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "220px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <aside style={{
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          maxHeight: isNarrow ? "none" : "calc(100vh - 120px)",
          overflow: "auto",
          padding: 10,
          position: isNarrow ? "static" : "sticky",
          top: 92,
        }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, marginBottom: 8, textTransform: "uppercase" }}>
            {text(lang, "页面结构", "Contents")}
          </div>
          <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
            {sections.map(([id, en, zh]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 7,
                  color: t.accentText,
                  cursor: "pointer",
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 820,
                  padding: "7px 8px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {text(lang, zh, en)}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Section
            id="method-overview"
            eyebrow="01"
            title="Method Overview"
            subtitle={text(
              lang,
              "从候选路径网络开始，再进入描述符、路径指纹和实验校准；不把任一路径写成唯一确定机理。",
              "Start from a candidate pathway network, then connect descriptors, reaction fingerprints, and calibration experiments. No route is treated as the only confirmed mechanism."
            )}
            t={t}
          >
            <MethodFlow t={t} lang={lang} isMobile={isMobile} />
          </Section>

          <Section
            id="evidence-levels"
            eyebrow="02"
            title="Evidence Levels"
            subtitle={text(
              lang,
              "Level A/B/C/D 与 catalytic_pathways_demo.json 中的 evidenceLevel 字段一致，用来标注路径证据强度和验证需求。",
              "Level A/B/C/D align with the evidenceLevel field in catalytic_pathways_demo.json and separate evidence strength from validation needs."
            )}
            t={t}
          >
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              {evidenceLevels.map(row => <EvidenceLevelCard key={row.level} row={row} t={t} />)}
            </div>
          </Section>

          <Section
            id="reaction-fingerprint"
            eyebrow="03"
            title="Reaction Fingerprint Scoring"
            subtitle="Current values are expert-prior estimates and require experimental calibration."
            t={t}
          >
            <div style={{ display: "grid", gap: 8 }}>
              {fingerprintRows.map(row => <FingerprintRow key={row[0]} row={row} t={t} />)}
            </div>
            <MiniCard t={t} tone="info" style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
              <strong style={{ color: t.textStrong }}>Initial expert-prior scoring rule:</strong>{" "}
              A1-A4 are positive capability terms, while B1 is a risk term. Any current weighting is provisional and should be updated with correlation analysis, LASSO/Ridge, Random Forest feature importance, or Bayesian update after experimental calibration data are available.
            </MiniCard>
          </Section>

          <Section
            id="score-boundary"
            eyebrow="04"
            title="What the Score Means / Does Not Mean"
            subtitle={text(
              lang,
              "用一个双栏边界替代重复 disclaimer，明确当前分数的用途与禁止误读。",
              "A compact boundary replaces repeated disclaimers and defines what the current score can and cannot support."
            )}
            t={t}
          >
            <TwoColumnMeaning t={t} isMobile={isMobile} lang={lang} />
          </Section>

          <Section
            id="data-provenance"
            eyebrow="05"
            title="Data Provenance & Descriptor Curation"
            subtitle={text(
              lang,
              "连接 MOF Library 的字段级 provenance、8 个核心 descriptor checklist，以及新的 reaction-readiness tags。",
              "Connects MOF Library field-level provenance, the 8 core descriptor checklist, and the new reaction-readiness tags."
            )}
            t={t}
          >
            <ProvenanceSection t={t} lang={lang} isMobile={isMobile} />
          </Section>

          <Section
            id="validation-roadmap"
            eyebrow="06"
            title="Validation Roadmap"
            subtitle={text(
              lang,
              "验证任务把路径网络、MOF 风险标签和路径指纹连接到可执行实验。",
              "Validation tasks connect the pathway network, MOF risk tags, and reaction fingerprints to concrete experiments."
            )}
            t={t}
          >
            <ValidationTable t={t} isMobile={isMobile} />
          </Section>
        </main>
      </div>
    </div>
  )
}
