// @ts-nocheck
import { useMemo, useState } from "react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import { CopyLinkButton, PageHeader, toolbarBtn, useLang, useT, useViewport } from "../../shared"

const text = (lang, zh, en) => lang === "zh" ? zh : en

const OBLIGATION_TITLES = {
  identify: ["确认记录与许可", "Identify the record and licence"],
  "preserve-notices": ["保留署名与权利声明", "Preserve attribution and rights notices"],
  nc: ["遵守非商业边界", "Respect the non-commercial boundary"],
  sharealike: ["履行相同方式共享", "Apply ShareAlike where required"],
  "fair-by": ["履行 CC BY 署名", "Apply CC BY attribution"],
  "no-rights-expansion": ["不得扩张或转移权利", "Do not expand or transfer rights"],
  "no-bulk-csd": ["不得规避 CSD 许可", "Do not circumvent CSD licensing"],
  articles: ["单独核验出版物及其他权利", "Review publication and other rights separately"],
  science: ["完成科学与工程复核", "Complete scientific and engineering verification"],
  responsibility: ["承担独立判断责任", "Retain independent responsibility"],
}

const COMMITMENT_TITLES = {
  scope: ["用途限缩", "Purpose limitation"],
  attribution: ["来源与署名保全", "Source and attribution preservation"],
  changes: ["原始与派生分层", "Source and derivative separation"],
  noncommercial: ["非商业控制", "Non-commercial control"],
  "restricted-csd": ["受限 CSD 隔离", "Restricted CSD isolation"],
  isolation: ["未决记录隔离", "Unresolved-record quarantine"],
  review: ["变更与异议复核", "Change and dispute review"],
}

function Surface({ t, children, style = {}, ...props }) {
  return (
    <section
      {...props}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 0,
        minWidth: 0,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function SectionHeading({ t, eyebrow, title, body }) {
  return (
    <header style={{ borderBottom: `2px solid ${t.accent}`, display: "grid", gap: 7, paddingBottom: 15 }}>
      <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{eyebrow}</span>
      <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 900, lineHeight: 1.25, margin: 0 }}>{title}</h2>
      {body ? <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: 0, maxWidth: 900 }}>{body}</p> : null}
    </header>
  )
}

function ResponsibilityRow({ t, label, title, body, required = true, number }) {
  return (
    <article style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 7, gridTemplateColumns: "34px minmax(0, 1fr)", padding: "14px 0" }}>
      <span aria-hidden="true" style={{ alignItems: "center", background: required ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${required ? t.warn : t.accent}`, borderRadius: 6, color: required ? t.warn : t.accentText, display: "inline-flex", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, fontWeight: 900, height: 28, justifyContent: "center", width: 28 }}>
        {String(number).padStart(2, "0")}
      </span>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.3 }}>{title}</strong>
          <span style={{ border: `1px solid ${required ? t.warn : t.border}`, borderRadius: 999, color: required ? t.warn : t.accentText, fontSize: 9.5, fontWeight: 900, padding: "2px 7px" }}>
            {label}
          </span>
        </div>
        <p style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.7, margin: 0 }}>{body}</p>
      </div>
    </article>
  )
}

function DocumentLink({ item, lang, t }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      style={{
        background: "transparent",
        borderBottom: `1px solid ${t.border}`,
        borderRadius: 0,
        color: "inherit",
        display: "grid",
        gap: 7,
        minWidth: 0,
        padding: "13px 2px",
        textDecorationColor: t.accent,
        textDecorationThickness: "1px",
        textUnderlineOffset: 4,
      }}
    >
      <span style={{ color: t.accentText, fontSize: 9.8, fontWeight: 900, letterSpacing: ".05em", textTransform: "uppercase" }}>{item.publisher} · {text(lang, "官方原文", "Primary source")}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.35 }}>{text(lang, item.titleZh, item.titleEn)}</strong>
      <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.55 }}>{text(lang, item.scopeZh, item.scopeEn)}</span>
      <span style={{ color: t.faint, fontSize: 9.7, overflowWrap: "anywhere" }}>{item.url} ↗</span>
    </a>
  )
}

function WorkflowStep({ item, index, lang, t, isNarrow }) {
  return (
    <article style={{ borderLeft: `3px solid ${t.accent}`, borderTop: `1px solid ${t.border}`, display: "grid", gap: 7, minWidth: 0, padding: "13px 14px" }}>
      <span style={{ color: t.accentText, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.8, fontWeight: 900 }}>
        CONTROL {String(index + 1).padStart(2, "0")}
      </span>
      <strong style={{ color: t.textStrong, fontSize: isNarrow ? 12.5 : 13.2 }}>{text(lang, item.titleZh, item.titleEn)}</strong>
      <p style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.65, margin: 0 }}>{text(lang, item.bodyZh, item.bodyEn)}</p>
    </article>
  )
}

function ClauseGroup({ group, lang, t }) {
  return (
    <article style={{ border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 0, minWidth: 0, overflow: "hidden" }}>
      <header style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, display: "grid", gap: 7, padding: 15 }}>
        <span style={{ color: t.accentText, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.8, fontWeight: 900 }}>
          {group.id.toUpperCase()} · {group.clauses.length} {text(lang, "条", "clauses")}
        </span>
        <h3 style={{ color: t.textStrong, fontSize: 14.5, lineHeight: 1.35, margin: 0 }}>{text(lang, group.titleZh, group.titleEn)}</h3>
        <p style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.65, margin: 0 }}>{text(lang, group.scopeZh, group.scopeEn)}</p>
      </header>
      <ol style={{ display: "grid", listStyle: "none", margin: 0, padding: 0 }}>
        {group.clauses.map((clause, index) => {
          const source = complianceRegistry.officialDocuments.find(item => item.id === clause.sourceDocumentId)
          return (
            <li key={clause.id} style={{ background: index % 2 === 0 ? t.panel : t.surface, borderTop: index ? `1px solid ${t.border}` : "none", display: "grid", gap: 10, gridTemplateColumns: "58px minmax(0, 1fr)", padding: "13px 14px" }}>
              <span style={{ color: t.accentText, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.6, fontWeight: 900, paddingTop: 2 }}>{clause.id}</span>
              <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <strong style={{ color: t.textStrong, fontSize: 12.1, lineHeight: 1.45 }}>{text(lang, clause.titleZh, clause.titleEn)}</strong>
                  <span style={{ color: t.faint, fontSize: 9.6, fontWeight: 800 }}>{clause.section}</span>
                </div>
                <p style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.68, margin: 0 }}>{text(lang, clause.bodyZh, clause.bodyEn)}</p>
                {source ? (
                  <a href={source.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.2, fontWeight: 850, justifySelf: "start", textDecoration: "none" }}>
                    {text(lang, "查看发布方原文", "Open publisher source")} · {text(lang, source.titleZh, source.titleEn)} ↗
                  </a>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}

function credentialStatusMeta(status, t, lang) {
  const map = {
    "public-licence": { color: t.success, bg: t.badgeCalcBg, zh: "公开许可凭证", en: "Public-licence evidence" },
    "documented-quarantined": { color: t.warn, bg: t.badgeWarnBg, zh: "凭证存在 / 数据隔离", en: "Evidence exists / data quarantined" },
    "record-level": { color: t.accentText, bg: t.badgeInfoBg, zh: "逐记录核验", en: "Record-level review" },
    "blocked-no-credential": { color: t.warn, bg: t.badgeWarnBg, zh: "缺少覆盖性凭证 / 阻断", en: "No blanket evidence / blocked" },
    "project-origin": { color: t.accentText, bg: t.badgeInfoBg, zh: "项目来源证据", en: "Project-origin evidence" },
  }
  const item = map[status] || { color: t.faint, bg: t.surface, zh: status, en: status }
  return { ...item, label: text(lang, item.zh, item.en) }
}

function CredentialCard({ credential, lang, t }) {
  const meta = credentialStatusMeta(credential.status, t, lang)
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 0, display: "grid", minWidth: 0, overflow: "hidden" }}>
      <header style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 8, padding: 14 }}>
        <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.4 }}>{text(lang, credential.sourceZh, credential.sourceEn)}</strong>
          <span style={{ background: meta.bg, border: `1px solid ${meta.color}`, borderRadius: 999, color: meta.color, fontSize: 9.3, fontWeight: 900, padding: "3px 7px" }}>{meta.label}</span>
        </div>
        <p style={{ color: t.textStrong, fontSize: 11.2, lineHeight: 1.65, margin: 0 }}>{text(lang, credential.authorizationZh, credential.authorizationEn)}</p>
      </header>
      <div style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 5, padding: "11px 14px" }}>
        <span style={{ color: t.warn, fontSize: 9.7, fontWeight: 900 }}>{text(lang, "凭证边界与缺口", "Evidence boundary and gap")}</span>
        <p style={{ color: t.muted, fontSize: 10.9, lineHeight: 1.62, margin: 0 }}>{text(lang, credential.limitationZh, credential.limitationEn)}</p>
      </div>
      <ul style={{ display: "grid", listStyle: "none", margin: 0, padding: "8px 14px 12px" }}>
        {credential.evidence.map((item, index) => (
          <li key={`${item.label}-${index}`} style={{ borderTop: index ? `1px solid ${t.border}` : "none", display: "grid", gap: 3, padding: "8px 0" }}>
            <span style={{ color: t.faint, fontSize: 9.3, fontWeight: 850 }}>{text(lang, item.kindZh, item.kindEn)}</span>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.5, fontWeight: 800, overflowWrap: "anywhere", textDecoration: "none" }}>{item.label} ↗</a>
            ) : (
              <code style={{ color: t.textStrong, fontSize: 9.8, overflowWrap: "anywhere" }}>{item.label}</code>
            )}
          </li>
        ))}
      </ul>
    </article>
  )
}

function statusMeta(status, lang) {
  const map = {
    active: { color: "#16835d", zh: "当前接入", en: "Active ingestion" },
    "active-limited": { color: "#196fbb", zh: "按记录有限接入", en: "Limited per-record ingestion" },
    quarantined: { color: "#9a5b18", zh: "未进入公开数据层", en: "Excluded from public data layer" },
  }
  const item = map[status] || { color: "#65758d", zh: status, en: status }
  return { ...item, label: text(lang, item.zh, item.en) }
}

function DatasetRow({ dataset, lang, t }) {
  const status = statusMeta(dataset.status, lang)
  const facts = [
    [text(lang, "数据角色", "Data role"), text(lang, dataset.roleZh, dataset.roleEn)],
    [text(lang, "发布方", "Publisher"), dataset.publisher],
    [text(lang, "当前版本", "Current version"), dataset.version],
    [text(lang, "记录范围", "Record scope"), dataset.recordCount == null ? text(lang, "逐条登记", "Per-record registry") : Number(dataset.recordCount).toLocaleString()],
    [text(lang, "许可与边界", "Licence and boundary"), dataset.licence],
  ]
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 0, minWidth: 0, overflow: "hidden" }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: 14 }}>
        <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
          <span style={{ borderLeft: `3px solid ${status.color}`, color: status.color, fontSize: 10.5, fontWeight: 900, paddingLeft: 8 }}>{status.label}</span>
          <h3 style={{ color: t.textStrong, fontSize: 15, lineHeight: 1.28, margin: 0 }}>{dataset.name}</h3>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {dataset.sourceUrl ? (
            <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(t), borderRadius: 7, color: t.accentText, textDecoration: "none" }}>
              {text(lang, "官方来源", "Official source")}
            </a>
          ) : null}
          {(dataset.licenceUrls || []).map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(t), borderRadius: 7, textDecoration: "none" }}>
              {index === 0 ? text(lang, "许可正文", "Licence text") : text(lang, "附加条款", "Additional terms")}
            </a>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 0 }}>
        {facts.map(([label, value]) => (
          <div key={label} style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 8, gridTemplateColumns: "minmax(110px, .32fr) minmax(0, 1fr)", padding: "10px 14px" }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
            <span style={{ color: t.textStrong, fontSize: 11.2, lineHeight: 1.55, overflowWrap: "anywhere" }}>{value}</span>
          </div>
        ))}
      </div>

      <details style={{ padding: "12px 14px 14px" }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 900 }}>
          {text(lang, "查看允许范围、限制与 EcoMOF-AI 处理方式", "Review permitted scope, restrictions, and EcoMOF-AI handling")}
        </summary>
        <div style={{ display: "grid", gap: 0, marginTop: 10 }}>
          {[
            [text(lang, "允许范围", "Permitted scope"), text(lang, dataset.allowedZh, dataset.allowedEn), "#16835d"],
            [text(lang, "限制与不可推断", "Restrictions and non-implications"), text(lang, dataset.prohibitedZh, dataset.prohibitedEn), t.warn],
            [text(lang, "本站处理方式", "Site handling"), text(lang, dataset.projectHandlingZh, dataset.projectHandlingEn), t.accentText],
          ].map(([label, body, color]) => (
            <div key={label} style={{ borderLeft: `3px solid ${color}`, borderTop: `1px solid ${t.border}`, display: "grid", gap: 5, padding: "11px 12px" }}>
              <strong style={{ color, fontSize: 10.8 }}>{label}</strong>
              <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.65 }}>{body}</span>
            </div>
          ))}
        </div>
      </details>
    </article>
  )
}

export function DatabaseComplianceTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [filter, setFilter] = useState("all")
  const datasets = useMemo(() => {
    if (filter === "all") return complianceRegistry.datasets
    if (filter === "active") return complianceRegistry.datasets.filter(row => row.status === "active")
    if (filter === "limited") return complianceRegistry.datasets.filter(row => row.status === "active-limited")
    return complianceRegistry.datasets.filter(row => row.status === "quarantined")
  }, [filter])

  const nonCommercialCount = complianceRegistry.datasets.filter(row => /BY-NC|NonCommercial|non-commercial/i.test(row.licence)).length
  const clauseCount = complianceRegistry.applicableClauseGroups.reduce((total, group) => total + group.clauses.length, 0)
  const blockedCredentialCount = complianceRegistry.authorizationCredentials.filter(item => item.status === "blocked-no-credential").length
  const acknowledgementZh = "继续访问、检索、下载或使用本网站的数据与派生结果，即表示您确认已经阅读并理解本页所述的来源归属、许可边界与再利用责任，并同意在适用范围内遵守相应要求。该确认不替代您与原始数据发布方之间可能适用的许可协议，也不免除您针对具体用途进行独立核验并取得必要授权的责任。"
  const acknowledgementEn = "By continuing to access, search, download, or use data and derived results from this website, you confirm that you have read and understood the source attribution, licence boundaries, and reuse responsibilities described on this page, and agree to comply where they apply. This acknowledgement does not replace any licence agreement that may apply between you and the original data publisher, nor does it remove your responsibility to review the intended use independently and obtain any required permission."

  return (
    <div id="database-compliance" data-testid="database-compliance-tab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "数据使用、许可与责任", "Data Use, Licensing, and Responsibilities")}
        subtitle={text(
          lang,
          "逐项说明 EcoMOF-AI 使用的数据对象、授权依据、非商业边界、停止条件以及平台与用户在访问、分析、发布、模型训练和再分发中的责任。",
          "An itemized account of EcoMOF-AI data objects, authorization basis, non-commercial boundaries, stop conditions, and platform/user responsibilities for access, analysis, publication, model training, and redistribution.",
        )}
        meta={text(lang, "非商业研究 · 逐来源核验 · 原文优先", "Non-commercial research · source-by-source review · primary terms prevail")}
        action={<CopyLinkButton hash="database-compliance" ariaLabel={text(lang, "复制合规说明链接", "Copy compliance link")} />}
      />

      <nav aria-label={text(lang, "合规页面目录", "Compliance page index")} style={{ background: "transparent", borderBottom: `1px solid ${t.borderStrong || t.border}`, borderTop: `1px solid ${t.borderStrong || t.border}`, display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: "12px 2px" }}>
        {[
          ["compliance-position", text(lang, "适用范围", "Position")],
          ["compliance-controls", text(lang, "核验流程", "Control workflow")],
          ["compliance-ccdc", "CCDC"],
          ["compliance-clauses", text(lang, "全部条文", "All clauses")],
          ["compliance-credentials", text(lang, "授权凭证", "Authorization evidence")],
          ["compliance-responsibilities", text(lang, "责任与义务", "Responsibilities")],
          ["compliance-documents", text(lang, "官方原文", "Primary documents")],
          ["compliance-source-registry", text(lang, "来源登记", "Source registry")],
          ["compliance-response", text(lang, "异议与移除", "Disputes and removal")],
        ].map(([id, label], index) => (
          <a key={id} href={`#${id}`} style={{ color: t.accentText, fontSize: 10.8, fontWeight: 850, textDecorationThickness: "1px", textUnderlineOffset: 3 }}>
            {String(index + 1).padStart(2, "0")} · {label}
          </a>
        ))}
      </nav>

      <Surface data-testid="compliance-use-notice" t={t} style={{ borderLeft: `5px solid ${t.accent}`, display: "grid", gap: 15, padding: isMobile ? 18 : 24 }}>
        <div style={{ display: "grid", gap: 7 }}>
          <span style={{ color: t.accentText, fontSize: 10.8, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{text(lang, "开始使用前必须阅读", "Read before use")}</span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 22 : 28, fontWeight: 920, lineHeight: 1.2, margin: 0 }}>
            {text(lang, complianceRegistry.operatingMode.zh, complianceRegistry.operatingMode.en)}
          </h2>
          <p style={{ color: t.textStrong, fontSize: 12.3, lineHeight: 1.75, margin: 0, maxWidth: 980 }}>
            {text(lang, acknowledgementZh, acknowledgementEn)}
          </p>
        </div>
        <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", paddingTop: 13 }}>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>
            {text(
              lang,
              "如果您对来源、署名方式、许可适用范围、数据移除或商业用途授权有任何疑问，请在继续使用相关数据前联系我们。",
              "If you have questions about source attribution, licence scope, data removal, or permission for commercial use, contact us before continuing to use the affected data.",
            )}
          </p>
          <a href="#contact" style={{ color: t.accentText, fontSize: 12, fontWeight: 900, justifySelf: isNarrow ? "start" : "end", textDecorationThickness: "1px", textUnderlineOffset: 3 }}>
            {text(lang, "联系我们", "Contact Us")}
          </a>
        </div>
      </Surface>

      <Surface id="compliance-position" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "文件性质与判断边界", "Document nature and decision boundary")}
          title={text(lang, "本页列示规则与证据，不作全面合规自我认证", "This page lists rules and evidence; it does not self-certify comprehensive compliance")}
          body={text(lang, complianceRegistry.statusStatement.zh, complianceRegistry.statusStatement.en)}
        />
        <div style={{ display: "grid", gap: 0, gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
          {[
            [text(lang, "逐项列示条文", "Itemized clauses"), clauseCount, text(lang, "按许可与来源分组", "grouped by licence and source")],
            [text(lang, "授权凭证登记", "Evidence entries"), complianceRegistry.authorizationCredentials.length, text(lang, "包括凭证、缺口与阻断", "evidence, gaps, and blocks")],
            [text(lang, "缺少覆盖性凭证", "No blanket evidence"), blockedCredentialCount, text(lang, "保持阻断，不推定授权", "blocked; no presumed permission")],
            [text(lang, "含非商业限制", "Non-commercial restrictions"), nonCommercialCount, text(lang, "商业用途需另行授权", "separate permission for commercial use")],
          ].map(([label, value, note], index) => (
            <div key={label} style={{ borderLeft: index > 0 && !isNarrow ? `1px solid ${t.border}` : "none", borderTop: isNarrow && index > 0 ? `1px solid ${t.border}` : "none", display: "grid", gap: 4, padding: "11px 14px" }}>
              <span style={{ color: t.faint, fontSize: 10.2, fontWeight: 850 }}>{label}</span>
              <strong style={{ color: t.textStrong, fontSize: 18 }}>{value}</strong>
              <span style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.45 }}>{note}</span>
            </div>
          ))}
        </div>
        <div style={{ borderLeft: `3px solid ${t.warn}`, color: t.muted, fontSize: 11.4, lineHeight: 1.7, padding: "2px 0 2px 12px" }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "访问边界：", "Access boundary: ")}</strong>
          {text(lang, complianceRegistry.accessBoundary.zh, complianceRegistry.accessBoundary.en)}
        </div>
      </Surface>

      <Surface id="compliance-controls" data-testid="compliance-control-workflow" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "核验控制流程", "Compliance control workflow")}
          title={text(lang, "任何下载、训练、发布或再分发都必须经过六步核验", "Every download, training use, publication, or redistribution must pass six controls")}
          body={text(
            lang,
            "本流程用于把“能否访问”与“能否用于某一具体目的”分开判断。任一步出现许可不明、身份不明、商业边界不明或来源冲突，都应停止处理并进入人工复核。",
            "This workflow separates access from permission for a specific purpose. Any uncertainty about licence, identity, commercial scope, or conflicting provenance stops processing and triggers manual review.",
          )}
        />
        <div style={{ display: "grid", gap: 0, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          {complianceRegistry.controlWorkflow.map((item, index) => (
            <WorkflowStep key={item.id} item={item} index={index} lang={lang} t={t} isNarrow={isNarrow} />
          ))}
        </div>
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.textStrong, fontSize: 11.4, lineHeight: 1.65, padding: "11px 13px" }}>
          <strong style={{ color: t.warn }}>{text(lang, "停止条件：", "Stop condition: ")}</strong>
          {text(
            lang,
            "无法确认具体来源、无法读取适用条款、用途涉及商业化但没有书面许可、拟向第三方批量提供原始数据，或记录身份/权利存在合理争议时，不得继续公开发布、下载或导出。",
            "Do not continue public release, download, or export when the source cannot be identified, applicable terms cannot be read, commercial use lacks written permission, original data would be supplied in bulk to third parties, or record identity/rights are reasonably disputed.",
          )}
        </div>
      </Surface>

      <Surface id="compliance-ccdc" data-testid="compliance-ccdc-boundaries" t={t} style={{ borderColor: t.borderStrong, display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow="CCDC / CSD"
          title={text(lang, "CCDC 数据必须按对象和用途分别判断", "CCDC data must be assessed by object and intended use")}
          body={text(
            lang,
            "CSD MOF Collection、CoRE-MOF modified CIFs、CoRE-MOF unmodified CIFs 与完整付费 CSD 不是同一个授权对象。下表依据 CCDC 官方下载页、再分发 FAQ、标准许可入口和 Conditions of Use 建立项目级控制边界；实际机构协议与 CCDC 书面答复始终优先。",
            "The CSD MOF Collection, CoRE-MOF modified CIFs, CoRE-MOF unmodified CIFs, and the full paid CSD are not the same licensed object. This table establishes project controls from the official CCDC downloads page, redistribution FAQ, standard agreement entry point, and Conditions of Use; the actual institutional agreement and written CCDC response always prevail.",
          )}
        />
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 9, overflow: "hidden" }}>
          {complianceRegistry.ccdcDecisionRules.map((item, index) => (
            <article key={item.id} style={{ background: index % 2 === 0 ? t.surface : t.panel, borderTop: index ? `1px solid ${t.border}` : "none", display: "grid", gap: 0, gridTemplateColumns: isNarrow ? "1fr" : "minmax(180px, .58fr) minmax(0, 1.42fr)" }}>
              <div style={{ borderRight: isNarrow ? "none" : `1px solid ${t.border}`, display: "grid", gap: 7, padding: 14 }}>
                <span style={{ color: t.faint, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, fontWeight: 900 }}>CCDC-{String(index + 1).padStart(2, "0")}</span>
                <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.4 }}>{text(lang, item.objectZh, item.objectEn)}</strong>
              </div>
              <div style={{ display: "grid", gap: 10, padding: 14 }}>
                <p style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.68, margin: 0 }}>{text(lang, item.ruleZh, item.ruleEn)}</p>
                <div style={{ borderLeft: `3px solid ${index < 2 ? t.success : t.warn}`, color: t.textStrong, fontSize: 10.9, fontWeight: 800, lineHeight: 1.6, paddingLeft: 10 }}>
                  {text(lang, item.decisionZh, item.decisionEn)}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {complianceRegistry.officialDocuments.slice(0, 4).map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(t), borderRadius: 7, color: t.accentText, textDecoration: "none" }}>
              {text(lang, item.titleZh, item.titleEn)} ↗
            </a>
          ))}
        </div>
      </Surface>

      <Surface id="compliance-clauses" data-testid="compliance-applicable-clauses" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "全部适用控制条文", "All applicable control clauses")}
          title={text(lang, `${clauseCount} 条条文逐项列示，不以概括性承诺替代原许可`, `${clauseCount} clauses itemized; no general pledge substitutes for source terms`)}
          body={text(
            lang,
            "条文按 CCDC、CC BY-NC-SA 4.0、CC BY 4.0、NIST/文献逐记录边界和项目自有材料分组。中文内容是为本项目建立停止条件和责任分配的保守释义，不是法律文本翻译；每条均链接发布方原文，发生差异时以原文、实际机构协议和权利人书面答复为准。",
            "Clauses are grouped by CCDC, CC BY-NC-SA 4.0, CC BY 4.0, NIST/literature record-level boundaries, and project-owned material. The summaries are conservative project controls, not certified legal translations. Each links to the publisher source; the original text, actual institutional agreement, and written rightsholder response prevail.",
          )}
        />
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.textStrong, fontSize: 11.2, lineHeight: 1.68, padding: "11px 13px" }}>
          <strong style={{ color: t.warn }}>{text(lang, "阅读规则：", "Reading rule: ")}</strong>
          {text(
            lang,
            "“全部”是指对本网站已登记数据对象和使用场景具有实际控制意义的条文，而不是复制整份许可的每一段定义。定义、解释、可分割性等仍通过原文链接完整保留。",
            "All means every clause materially controlling the registered data objects and use cases on this site, not a verbatim copy of every definition in each licence. Definitions, interpretation, severability, and the complete text remain available through the source links.",
          )}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {complianceRegistry.applicableClauseGroups.map(group => <ClauseGroup key={group.id} group={group} lang={lang} t={t} />)}
        </div>
      </Surface>

      <Surface id="compliance-credentials" data-testid="compliance-authorization-credentials" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "授权凭证与缺口清单", "Authorization evidence and gaps")}
          title={text(lang, "逐来源说明“谁授权、授权什么、凭证在哪里、哪些仍未获授权”", "For each source: who grants what, where the evidence is, and what remains unauthorized")}
          body={text(
            lang,
            "公开许可页面、法律文本、机构协议或发布方书面答复才是外部授权凭证。仓库 manifest、来源登记、哈希、NOTICE 和测试只用于证明项目处理状态，不能冒充 CCDC 或其他发布方颁发的证书。标为缺少覆盖性凭证的来源保持阻断。",
            "Public licence pages, legal codes, institutional agreements, or written publisher responses are external authorization evidence. Repository manifests, source registries, hashes, NOTICE files, and tests evidence project handling only and are not certificates issued by CCDC or another publisher. Sources without blanket evidence remain blocked.",
          )}
        />
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {complianceRegistry.authorizationCredentials.map(item => <CredentialCard key={item.id} credential={item} lang={lang} t={t} />)}
        </div>
      </Surface>

      <div id="compliance-responsibilities" style={{ alignItems: "start", display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.08fr) minmax(320px, .92fr)", scrollMarginTop: 112 }}>
        <Surface t={t} style={{ display: "grid", gap: 0 }}>
          <SectionHeading
            t={t}
            eyebrow={text(lang, "用户责任", "User responsibilities")}
            title={text(lang, "下载、分析、发布与再分发前必须完成的核验", "Checks required before download, analysis, publication, or redistribution")}
            body={text(
              lang,
              "EcoMOF-AI 的页面、索引和导出文件不会替代原始数据许可。每位用户都应依据具体记录、具体用途和所属机构政策作出独立判断。",
              "EcoMOF-AI pages, indexes, and exports do not replace source licences. Each user must assess the specific record, intended use, and institutional policy independently.",
            )}
          />
          <div>
            {complianceRegistry.userObligations.map((item, index) => (
              <ResponsibilityRow
                key={item.id}
                t={t}
                label={text(lang, item.level === "required" ? "必须遵守" : "独立判断责任", item.level === "required" ? "Required" : "Independent responsibility")}
                title={text(lang, OBLIGATION_TITLES[item.id]?.[0] || item.id, OBLIGATION_TITLES[item.id]?.[1] || item.id)}
                body={text(lang, item.zh, item.en)}
                required={item.level === "required"}
                number={index + 1}
              />
            ))}
          </div>
        </Surface>

        <div style={{ display: "grid", gap: 16 }}>
          <Surface t={t} style={{ display: "grid", gap: 0 }}>
            <SectionHeading
              t={t}
              eyebrow={text(lang, "平台承诺", "Platform commitments")}
              title={text(lang, "EcoMOF-AI 当前公开执行的处理原则", "Current public handling principles")}
              body={text(lang, "这些原则用于约束当前数据接入和发布流程；来源条款、数据版本、运营模式或用途变化时会重新复核。", "These principles govern the current ingestion and publication workflow and are reviewed again when source terms, versions, operating mode, or uses change.")}
            />
            {complianceRegistry.platformCommitments.map((item, index) => (
              <ResponsibilityRow
                key={item.id}
                t={t}
                label={text(lang, "平台处理", "Platform handling")}
                title={text(lang, COMMITMENT_TITLES[item.id]?.[0] || item.id, COMMITMENT_TITLES[item.id]?.[1] || item.id)}
                body={text(lang, item.zh, item.en)}
                required={false}
                number={index + 1}
              />
            ))}
          </Surface>

          <Surface t={t} style={{ background: t.surface, display: "grid", gap: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "法律与科学边界", "Legal and scientific boundary")}</strong>
            <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>{text(lang, complianceRegistry.notLegalAdvice.zh, complianceRegistry.notLegalAdvice.en)}</p>
            <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
              {text(
                lang,
                "数据库记录、文本挖掘字段、结构映射和算法评分均不构成材料身份、适用性、安全性、可合成性或性能保证。科研与工程使用前仍应核对来源论文、实验条件、晶体身份和派生方法。",
                "Database records, text-mined fields, structure mappings, and algorithm scores do not guarantee material identity, fitness, safety, synthesizability, or performance. Verify source papers, experimental conditions, crystal identity, and derivation methods before research or engineering use.",
              )}
            </p>
            <span style={{ color: t.faint, fontSize: 10.5 }}>
              {text(lang, "本文件不以日期或测试结果宣称已经全面合规；请依据具体数据对象、用途和最新发布方原文作独立判断。", "This document does not claim comprehensive compliance based on a date or test result; assess the specific data object, intended use, and current publisher terms independently.")}
            </span>
          </Surface>
        </div>
      </div>

      <Surface id="compliance-documents" data-testid="compliance-primary-documents" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "官方原文与解释优先级", "Primary documents and precedence")}
          title={text(lang, "不得用本站摘要替代数据发布方的原始条款", "Do not substitute this summary for publisher terms")}
          body={text(
            lang,
            "以下链接直接指向 CCDC、Creative Commons、Zenodo 与 NIST 的官方页面。发生冲突时，依次核对适用于具体数据对象的附加条款、实际机构协议、许可法律文本和发布方书面答复；EcoMOF-AI 的说明只用于建立保守控制，不构成重新许可。",
            "These links point directly to official CCDC, Creative Commons, Zenodo, and NIST pages. If terms conflict, review the item-specific additional terms, actual institutional agreement, licence legal code, and written publisher response applicable to the object. EcoMOF-AI provides conservative controls only and does not relicence data.",
          )}
        />
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {complianceRegistry.officialDocuments.map(item => (
            <DocumentLink key={item.id} item={item} lang={lang} t={t} />
          ))}
        </div>
      </Surface>

      <Surface id="compliance-source-registry" data-testid="compliance-source-registry" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 112 }}>
        <div style={{ alignItems: "flex-end", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <SectionHeading
            t={t}
            eyebrow={text(lang, "来源登记", "Source registry")}
            title={text(lang, "逐数据库许可与处理矩阵", "Source-by-source licence and handling matrix")}
            body={text(lang, "每项登记分别说明来源、版本、允许范围、限制、本站处理方式和官方条款。接入状态不是对第三方数据的重新许可。", "Each registry entry states source, version, permitted scope, restrictions, site handling, and official terms. Ingestion status is not a relicence of third-party data.")}
          />
          <div role="group" aria-label={text(lang, "按接入状态筛选", "Filter by ingestion status")} style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[
              ["all", text(lang, "全部来源", "All sources")],
              ["active", text(lang, "当前接入", "Active")],
              ["limited", text(lang, "有限接入", "Limited")],
              ["quarantined", text(lang, "未公开接入", "Excluded")],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                style={{
                  ...toolbarBtn(t),
                  background: filter === id ? t.accentText : t.surface,
                  borderColor: filter === id ? t.accent : t.border,
                  borderRadius: 7,
                  color: filter === id ? "#fff" : t.muted,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div data-testid="compliance-dataset-list" style={{ display: "grid", gap: 11 }}>
          {datasets.map(dataset => <DatasetRow key={dataset.id} dataset={dataset} lang={lang} t={t} />)}
        </div>
      </Surface>

      <div id="compliance-response" style={{ alignItems: "start", display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.12fr) minmax(320px, .88fr)", scrollMarginTop: 112 }}>
        <Surface data-testid="compliance-incident-response" t={t} style={{ display: "grid", gap: 14 }}>
          <SectionHeading
            t={t}
            eyebrow={text(lang, "异议、纠错与移除", "Dispute, correction, and removal")}
            title={text(lang, "权利声明和来源争议的五步响应程序", "Five-step response for rights notices and provenance disputes")}
            body={text(
              lang,
              "收到合理异议后，优先控制风险，再判断是否恢复。暂停展示不代表承认侵权；恢复展示也必须有可记录的来源和条款依据。",
              "After a reasonable concern is received, contain risk before deciding whether to restore. Suspension is not an admission of infringement, and restoration requires documented provenance and terms.",
            )}
          />
          <ol style={{ display: "grid", gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
            {complianceRegistry.incidentResponse.map((item, index) => (
              <li key={item.id} style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 10, gridTemplateColumns: "34px minmax(0, 1fr)", padding: "11px 0" }}>
                <span style={{ color: t.warn, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</span>
                <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.65 }}>{text(lang, item.zh, item.en)}</span>
              </li>
            ))}
          </ol>
        </Surface>

        <Surface data-testid="compliance-definitions" t={t} style={{ display: "grid", gap: 0 }}>
          <SectionHeading
            t={t}
            eyebrow={text(lang, "术语定义", "Definitions")}
            title={text(lang, "本页使用的关键合规术语", "Key compliance terms used on this page")}
            body={text(lang, "这些定义仅用于本项目的控制流程；适用许可或法律定义不一致时，以后者为准。", "These definitions support project controls only; applicable licence or legal definitions prevail.")}
          />
          <dl style={{ display: "grid", margin: 0 }}>
            {complianceRegistry.definitions.map(item => (
              <div key={item.termEn} style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 5, padding: "11px 0" }}>
                <dt style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900 }}>{text(lang, item.termZh, item.termEn)}</dt>
                <dd style={{ color: t.muted, fontSize: 10.9, lineHeight: 1.6, margin: 0 }}>{text(lang, item.definitionZh, item.definitionEn)}</dd>
              </div>
            ))}
          </dl>
        </Surface>
      </div>

      <Surface t={t} style={{ borderLeft: `4px solid ${t.accent}`, display: "grid", gap: 8 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "疑问、权利声明或数据移除请求", "Questions, rights notices, or data removal requests")}</strong>
        <p style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.65, margin: 0 }}>
          {text(
            lang,
            "如您是数据发布方、权利人或网站用户，并对署名、许可适用、记录身份、错误内容或数据移除有疑问，请提供相关记录名称、来源链接与问题说明。我们会先暂停存在合理争议的相关展示，再进行来源和条款核验。",
            "If you are a publisher, rightsholder, or site user with questions about attribution, licence scope, record identity, incorrect content, or removal, include the record name, source link, and a description of the issue. We will suspend reasonably disputed content before reviewing provenance and terms.",
          )}
        </p>
        <a href="#contact" style={{ color: t.accentText, fontSize: 12.5, fontWeight: 900, justifySelf: "start", textDecorationThickness: "1px", textUnderlineOffset: 3 }}>{text(lang, "联系我们", "Contact Us")}</a>
      </Surface>
    </div>
  )
}
