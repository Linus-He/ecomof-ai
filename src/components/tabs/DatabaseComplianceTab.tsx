// @ts-nocheck
import { useMemo, useState } from "react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import { CopyLinkButton, PageHeader, toolbarBtn, useLang, useT } from "../../shared"

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
  scope: ["限制数据用途", "Limit data use"],
  attribution: ["保留来源与署名", "Preserve provenance and attribution"],
  changes: ["区分原始数据与派生结果", "Separate source data and derivatives"],
  noncommercial: ["执行非商业限制", "Apply non-commercial restrictions"],
  "restricted-csd": ["隔离受限 CSD 数据", "Isolate restricted CSD data"],
  isolation: ["隔离许可未明记录", "Quarantine unresolved records"],
  review: ["复核变更与权利异议", "Review changes and rights concerns"],
}

function Surface({ t, children, style = {}, ...props }) {
  return (
    <section
      {...props}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 0,
        display: "grid",
        gap: 16,
        minWidth: 0,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function SectionHeading({ number, title, body, t }) {
  return (
    <header style={{ borderBottom: `1px solid ${t.borderStrong || t.border}`, display: "grid", gap: 7, paddingBottom: 13 }}>
      <span style={{ color: t.accentText, fontSize: 12, fontWeight: 900 }}>{number}</span>
      <h2 style={{ color: t.textStrong, fontSize: 21, fontWeight: 900, lineHeight: 1.3, margin: 0 }}>{title}</h2>
      {body ? <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.75, margin: 0, maxWidth: 980 }}>{body}</p> : null}
    </header>
  )
}

function NumberedItem({ number, title, body, t, children, tone = "normal" }) {
  return (
    <article style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 7, padding: "13px 0" }}>
      <div style={{ alignItems: "baseline", display: "grid", gap: 10, gridTemplateColumns: "52px minmax(0, 1fr)" }}>
        <strong style={{ color: tone === "warn" ? t.warn : t.accentText, fontFamily: "inherit", fontSize: 12.2, fontWeight: 900 }}>{number}</strong>
        <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.5 }}>{title}</strong>
      </div>
      {body ? <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.75, margin: "0 0 0 62px" }}>{body}</p> : null}
      {children ? <div style={{ display: "grid", gap: 7, marginLeft: 62 }}>{children}</div> : null}
    </article>
  )
}

function SourceLink({ source, lang, t }) {
  if (!source) return null
  return (
    <a href={source.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.8, fontWeight: 850, justifySelf: "start", lineHeight: 1.55, overflowWrap: "anywhere", textUnderlineOffset: 3 }}>
      {text(lang, "发布方原文：", "Publisher source: ")}{text(lang, source.titleZh, source.titleEn)} ↗
    </a>
  )
}

function ClauseList({ lang, t }) {
  let groupNumber = 0
  return complianceRegistry.applicableClauseGroups.map(group => {
    groupNumber += 1
    const sectionNumber = `3.${groupNumber}`
    return (
      <section key={group.id} style={{ borderTop: `1px solid ${t.borderStrong || t.border}`, display: "grid", gap: 0, paddingTop: 14 }}>
        <h3 style={{ color: t.textStrong, fontSize: 15.5, lineHeight: 1.45, margin: 0 }}>
          <span style={{ color: t.accentText, marginRight: 10 }}>{sectionNumber}</span>
          {text(lang, group.titleZh, group.titleEn)}
        </h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.7, margin: "7px 0 4px" }}>{text(lang, group.scopeZh, group.scopeEn)}</p>
        <div>
          {group.clauses.map((clause, index) => {
            const source = complianceRegistry.officialDocuments.find(item => item.id === clause.sourceDocumentId)
            return (
              <NumberedItem
                key={clause.id}
                number={`${sectionNumber}.${index + 1}`}
                title={text(lang, clause.titleZh, clause.titleEn)}
                body={text(lang, clause.bodyZh, clause.bodyEn)}
                t={t}
              >
                <span style={{ color: t.faint, fontSize: 10.6, lineHeight: 1.55 }}>
                  {text(lang, "原文位置：", "Original section: ")}{clause.section}
                </span>
                <SourceLink source={source} lang={lang} t={t} />
              </NumberedItem>
            )
          })}
        </div>
      </section>
    )
  })
}

function credentialStatus(status, lang) {
  const labels = {
    "public-licence": ["公开许可", "Public licence"],
    "documented-quarantined": ["已登记但隔离", "Documented and quarantined"],
    "record-level": ["逐记录核验", "Record-level review"],
    "limited-factual-metadata-no-site-licence": ["仅登记事实信息", "Factual metadata only"],
    "blocked-no-credential": ["无覆盖性凭证，停止接入", "No blanket evidence; blocked"],
    "project-origin": ["项目自产材料", "Project-origin material"],
  }
  return text(lang, ...(labels[status] || [status, status]))
}

function CredentialList({ lang, t }) {
  return (
    <div>
      {complianceRegistry.authorizationCredentials.map((credential, index) => (
        <NumberedItem
          key={credential.id}
          number={`4.${index + 1}`}
          title={text(lang, credential.sourceZh, credential.sourceEn)}
          body={text(lang, credential.authorizationZh, credential.authorizationEn)}
          t={t}
          tone={credential.status === "blocked-no-credential" ? "warn" : "normal"}
        >
          <strong style={{ color: credential.status === "blocked-no-credential" ? t.warn : t.textStrong, fontSize: 10.8 }}>
            {credentialStatus(credential.status, lang)}
          </strong>
          <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "边界：", "Boundary: ")}</strong>
            {text(lang, credential.limitationZh, credential.limitationEn)}
          </p>
          {(credential.evidence || []).map((evidence, evidenceIndex) => (
            evidence.url ? (
              <a key={`${credential.id}-${evidenceIndex}`} href={evidence.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.8, fontWeight: 800, overflowWrap: "anywhere", textUnderlineOffset: 3 }}>
                {text(lang, evidence.kindZh, evidence.kindEn)}：{evidence.label} ↗
              </a>
            ) : (
              <span key={`${credential.id}-${evidenceIndex}`} style={{ color: t.muted, fontSize: 10.8, overflowWrap: "anywhere" }}>
                {text(lang, evidence.kindZh, evidence.kindEn)}：{evidence.label}
              </span>
            )
          ))}
        </NumberedItem>
      ))}
    </div>
  )
}

function DatasetList({ datasets, lang, t }) {
  const statusLabel = status => ({
    active: text(lang, "当前接入", "Active"),
    "active-limited": text(lang, "有限接入", "Limited"),
    quarantined: text(lang, "未公开接入", "Not publicly ingested"),
  })[status] || status

  return (
    <div data-testid="compliance-dataset-list">
      {datasets.map((dataset, index) => (
        <NumberedItem
          key={dataset.id}
          number={`7.${index + 1}`}
          title={dataset.name}
          body={text(lang, dataset.roleZh, dataset.roleEn)}
          t={t}
          tone={dataset.status === "quarantined" ? "warn" : "normal"}
        >
          <span style={{ color: t.textStrong, fontSize: 11.2, lineHeight: 1.65 }}>
            {statusLabel(dataset.status)} · {dataset.publisher} · {dataset.version}
            {dataset.recordCount == null ? "" : ` · ${Number(dataset.recordCount).toLocaleString()} ${text(lang, "条记录", "records")}`}
          </span>
          <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "许可：", "Licence: ")}</strong>{dataset.licence}
          </p>
          <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "可以怎样使用：", "Permitted use: ")}</strong>
            {text(lang, dataset.allowedZh, dataset.allowedEn)}
          </p>
          <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: t.warn }}>{text(lang, "不能据此推定：", "Do not infer: ")}</strong>
            {text(lang, dataset.prohibitedZh, dataset.prohibitedEn)}
          </p>
          <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "本站处理：", "Site handling: ")}</strong>
            {text(lang, dataset.projectHandlingZh, dataset.projectHandlingEn)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {dataset.sourceUrl ? <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.8, fontWeight: 850 }}>{text(lang, "官方来源", "Official source")} ↗</a> : null}
            {(dataset.licenceUrls || []).map((url, urlIndex) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.8, fontWeight: 850 }}>
                {urlIndex === 0 ? text(lang, "许可原文", "Licence text") : text(lang, "附加条款", "Additional terms")} ↗
              </a>
            ))}
          </div>
        </NumberedItem>
      ))}
    </div>
  )
}

export function DatabaseComplianceTab() {
  const t = useT()
  const { lang } = useLang()
  const [filter, setFilter] = useState("all")
  const datasets = useMemo(() => {
    if (filter === "all") return complianceRegistry.datasets
    if (filter === "active") return complianceRegistry.datasets.filter(row => row.status === "active")
    if (filter === "limited") return complianceRegistry.datasets.filter(row => row.status === "active-limited")
    return complianceRegistry.datasets.filter(row => row.status === "quarantined")
  }, [filter])

  const acknowledgementZh = "继续访问或使用本站内容，表示您已经看到本页列出的来源、许可和责任说明。这并不替代数据发布方的许可，也不代表您已经取得商业使用、批量再分发或其他受限用途的授权。"
  const acknowledgementEn = "Continuing to use this site means that you have seen the source, licence, and responsibility notes listed here. This does not replace publisher terms or grant permission for commercial use, bulk redistribution, or another restricted purpose."

  return (
    <div id="database-compliance" data-testid="database-compliance-tab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "数据使用、许可与责任", "Data use, licensing, and responsibilities")}
        subtitle={text(
          lang,
          "本页按来源列出本站实际使用的数据、对应许可、授权凭证和使用限制。需要判断具体用途时，请先阅读发布方原文；本站说明只帮助定位，不替代许可正文或机构协议。",
          "This page lists the data actually used by the site, its licences, evidence, and restrictions. Read the publisher terms before deciding on a specific use; this page helps locate them but does not replace the original terms or an institutional agreement.",
        )}
        meta={text(lang, "非商业研究 · 原文优先 · 来源持续登记", "Non-commercial research · primary terms prevail · maintained source registry")}
        action={<CopyLinkButton hash="database-compliance" ariaLabel={text(lang, "复制合规说明链接", "Copy compliance link")} />}
      />

      <nav aria-label={text(lang, "合规页面目录", "Compliance page index")} style={{ borderBottom: `1px solid ${t.borderStrong || t.border}`, borderTop: `1px solid ${t.borderStrong || t.border}`, display: "flex", flexWrap: "wrap", gap: "8px 18px", padding: "12px 2px" }}>
        {[
          ["compliance-position", text(lang, "1 适用范围", "1 Scope")],
          ["compliance-ccdc", text(lang, "2 CCDC 与 CSD", "2 CCDC and CSD")],
          ["compliance-clauses", text(lang, "3 条款与原文", "3 Terms and sources")],
          ["compliance-credentials", text(lang, "4 授权凭证", "4 Evidence")],
          ["compliance-responsibilities", text(lang, "5 责任", "5 Responsibilities")],
          ["compliance-documents", text(lang, "6 官方文件", "6 Official documents")],
          ["compliance-source-registry", text(lang, "7 来源登记", "7 Source registry")],
          ["compliance-response", text(lang, "8 异议与移除", "8 Disputes and removal")],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} style={{ color: t.accentText, fontSize: 11.2, fontWeight: 850, textUnderlineOffset: 3 }}>{label}</a>
        ))}
      </nav>

      <Surface t={t} style={{ background: t.surface, borderLeft: `4px solid ${t.accent}` }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "开始使用前请先阅读", "Read before use")}</strong>
        <p style={{ color: t.textStrong, fontSize: 12.1, lineHeight: 1.75, margin: 0 }}>{text(lang, acknowledgementZh, acknowledgementEn)}</p>
        <a href="#contact" style={{ color: t.accentText, fontSize: 11.6, fontWeight: 850, justifySelf: "start" }}>{text(lang, "对许可有疑问时联系我们", "Contact us with licence questions")}</a>
      </Surface>

      <Surface id="compliance-position" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="1"
          t={t}
          title={text(lang, "适用范围与免责声明", "Scope and disclaimer")}
          body={text(lang, "这里记录的是本站采用的处理边界，不是法律意见，也不是全面合规认证。数据对象、用途或发布方条款发生变化时，需要重新判断。", "These are the site's operating boundaries, not legal advice or comprehensive compliance certification. Reassess when the data object, intended use, or publisher terms change.")}
        />
        <NumberedItem number="1.1" title={text(lang, "本站以非商业研究方式运行", "The site operates for non-commercial research")} body={text(lang, complianceRegistry.statusStatement.zh, complianceRegistry.statusStatement.en)} t={t} />
        <NumberedItem number="1.2" title={text(lang, "访问不等于取得授权", "Access is not permission")} body={text(lang, "访问本网站不等于获得任何数据库的商业许可、机构许可或批量再分发权。是否可以使用，仍取决于具体数据对象、具体用途和原始条款。", "Accessing this site does not grant commercial, institutional, or bulk-redistribution rights. Permission still depends on the specific data object, use, and source terms.")} t={t} />
        <NumberedItem number="1.3" title={text(lang, "原文和实际协议优先", "Primary terms and actual agreements prevail")} body={text(lang, "如本站说明与许可正文、附加下载条款、实际机构协议或权利人书面答复不一致，以适用于该记录的原始文件为准。", "If this page differs from a licence, download term, institutional agreement, or written rightsholder response, the source document applicable to the record prevails.")} t={t} />
        <NumberedItem number="1.4" title={text(lang, "科学结果仍需独立复核", "Scientific results require independent review")} body={text(lang, complianceRegistry.notLegalAdvice.zh, complianceRegistry.notLegalAdvice.en)} t={t} />
      </Surface>

      <Surface id="compliance-ccdc" data-testid="compliance-ccdc-boundaries" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="2"
          t={t}
          title={text(lang, "CCDC 与 CSD 数据边界", "CCDC and CSD data boundaries")}
          body={text(lang, "CSD MOF Collection、CoRE-MOF modified CIF、CoRE-MOF unmodified CIF 和完整付费 CSD 是不同对象，不能因为名称相近就按同一许可处理。", "The CSD MOF Collection, CoRE-MOF modified CIFs, CoRE-MOF unmodified CIFs, and the full paid CSD are different objects and must not be treated as if they shared one licence.")}
        />
        {complianceRegistry.ccdcDecisionRules.map((item, index) => (
          <NumberedItem
            key={item.id}
            number={`2.${index + 1}`}
            title={text(lang, item.objectZh, item.objectEn)}
            body={text(lang, item.ruleZh, item.ruleEn)}
            t={t}
            tone={index > 1 ? "warn" : "normal"}
          >
            <p style={{ color: index > 1 ? t.warn : t.textStrong, fontSize: 11.4, fontWeight: 800, lineHeight: 1.65, margin: 0 }}>
              {text(lang, "本站决定：", "Site decision: ")}{text(lang, item.decisionZh, item.decisionEn)}
            </p>
          </NumberedItem>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {complianceRegistry.officialDocuments.slice(0, 4).map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.9, fontWeight: 850 }}>{text(lang, item.titleZh, item.titleEn)} ↗</a>
          ))}
        </div>
      </Surface>

      <Surface id="compliance-clauses" data-testid="compliance-applicable-clauses" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="3"
          t={t}
          title={text(lang, "适用条款与发布方原文", "Applicable terms and publisher sources")}
          body={text(lang, "以下内容按许可和来源整理，便于找到与本站数据实际使用有关的条款。中文说明只作索引和保守提示；条款含义、定义和例外情况以链接中的发布方原文为准。", "The entries below are organized by licence and source so the relevant publisher terms can be found. The summaries are a conservative index only; meaning, definitions, and exceptions come from the linked publisher text.")}
        />
        <ClauseList lang={lang} t={t} />
      </Surface>

      <Surface id="compliance-credentials" data-testid="compliance-authorization-credentials" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="4"
          t={t}
          title={text(lang, "授权凭证与尚未解决的缺口", "Authorization evidence and unresolved gaps")}
          body={text(lang, "这一部分说明每个来源目前依据什么接入，以及哪些用途仍然没有覆盖性授权。仓库清单和测试只能证明本站做过登记，不能代替发布方出具的许可。", "This section states the evidence used for each source and the uses that still lack blanket permission. Repository manifests and tests show site handling only; they do not replace publisher permission.")}
        />
        <CredentialList lang={lang} t={t} />
      </Surface>

      <Surface id="compliance-responsibilities" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="5"
          t={t}
          title={text(lang, "用户责任与本站责任", "User and site responsibilities")}
          body={text(lang, "数据许可不会因为经过检索、可视化或算法处理而消失。下面分别说明使用者和本站需要承担的事项。", "A licence does not disappear because data are searched, visualized, or processed by an algorithm. The responsibilities of users and the site are listed separately below.")}
        />
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: 0 }}>{text(lang, "5.1 使用者需要做到", "5.1 User responsibilities")}</h3>
        {complianceRegistry.userObligations.map((item, index) => (
          <NumberedItem key={item.id} number={`5.1.${index + 1}`} title={text(lang, OBLIGATION_TITLES[item.id]?.[0] || item.id, OBLIGATION_TITLES[item.id]?.[1] || item.id)} body={text(lang, item.zh, item.en)} t={t} tone={item.level === "required" ? "warn" : "normal"} />
        ))}
        <h3 style={{ color: t.textStrong, fontSize: 15, margin: "12px 0 0" }}>{text(lang, "5.2 本站目前执行的原则", "5.2 Current site commitments")}</h3>
        {complianceRegistry.platformCommitments.map((item, index) => (
          <NumberedItem key={item.id} number={`5.2.${index + 1}`} title={text(lang, COMMITMENT_TITLES[item.id]?.[0] || item.id, COMMITMENT_TITLES[item.id]?.[1] || item.id)} body={text(lang, item.zh, item.en)} t={t} />
        ))}
      </Surface>

      <Surface id="compliance-documents" data-testid="compliance-primary-documents" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="6"
          t={t}
          title={text(lang, "发布方官方文件", "Official publisher documents")}
          body={text(lang, "需要判断许可时，请打开对应原文，并结合具体记录的下载页、附加条件和实际机构协议阅读。", "When assessing permission, open the relevant source and read it together with the record download page, additional conditions, and the actual institutional agreement.")}
        />
        {complianceRegistry.officialDocuments.map((item, index) => (
          <NumberedItem key={item.id} number={`6.${index + 1}`} title={text(lang, item.titleZh, item.titleEn)} body={text(lang, item.scopeZh, item.scopeEn)} t={t}>
            <a href={item.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.9, fontWeight: 850, overflowWrap: "anywhere" }}>{item.publisher} · {item.url} ↗</a>
          </NumberedItem>
        ))}
      </Surface>

      <Surface id="compliance-source-registry" data-testid="compliance-source-registry" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="7"
          t={t}
          title={text(lang, "来源登记", "Source registry")}
          body={text(lang, "来源登记功能继续保留。每个条目说明版本、记录范围、许可、允许用途、禁止推定事项和本站处理方式。", "The source registry remains available. Each entry states version, record scope, licence, permitted uses, non-implications, and site handling.")}
        />
        <div role="group" aria-label={text(lang, "按接入状态筛选", "Filter by ingestion status")} style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[
            ["all", text(lang, "全部来源", "All sources")],
            ["active", text(lang, "当前接入", "Active")],
            ["limited", text(lang, "有限接入", "Limited")],
            ["quarantined", text(lang, "未公开接入", "Excluded")],
          ].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} style={{ ...toolbarBtn(t), background: filter === id ? t.accentText : t.surface, borderColor: filter === id ? t.accent : t.border, borderRadius: 7, color: filter === id ? "#fff" : t.muted }}>
              {label}
            </button>
          ))}
        </div>
        <DatasetList datasets={datasets} lang={lang} t={t} />
      </Surface>

      <Surface id="compliance-response" data-testid="compliance-incident-response" t={t} style={{ scrollMarginTop: 112 }}>
        <SectionHeading
          number="8"
          t={t}
          title={text(lang, "异议、纠错与移除", "Disputes, corrections, and removal")}
          body={text(lang, "收到具体且合理的权利或来源异议后，先暂停相关展示，再核对记录、来源和许可。暂停不代表承认侵权，恢复也必须有可记录的依据。", "After a specific and reasonable rights or provenance concern, the affected display is paused while the record, source, and terms are reviewed. Suspension is not an admission, and restoration requires documented support.")}
        />
        {complianceRegistry.incidentResponse.map((item, index) => (
          <NumberedItem key={item.id} number={`8.${index + 1}`} title={text(lang, ["登记问题", "暂停相关展示", "核对来源与条款", "记录处理决定", "通知并保留复核入口"][index], ["Record the concern", "Pause the affected display", "Review provenance and terms", "Record the decision", "Notify and retain a review route"][index])} body={text(lang, item.zh, item.en)} t={t} />
        ))}
      </Surface>

      <Surface data-testid="compliance-definitions" t={t}>
        <SectionHeading number="9" t={t} title={text(lang, "术语说明", "Definitions")} body={text(lang, "这些说明用于理解本站做法；如与许可或法律定义不一致，以后者为准。", "These definitions explain site handling; licence and legal definitions prevail if they differ.")} />
        {complianceRegistry.definitions.map((item, index) => (
          <NumberedItem key={item.termEn} number={`9.${index + 1}`} title={text(lang, item.termZh, item.termEn)} body={text(lang, item.definitionZh, item.definitionEn)} t={t} />
        ))}
      </Surface>

      <Surface t={t} style={{ borderLeft: `4px solid ${t.accent}` }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "提出疑问、权利声明或移除请求", "Questions, rights notices, or removal requests")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.7, margin: 0 }}>
          {text(lang, "请提供记录名称、来源链接和问题说明。对于存在合理争议的内容，本站会先暂停展示，再核对来源和条款。", "Include the record name, source link, and a description. Reasonably disputed content is paused while provenance and terms are reviewed.")}
        </p>
        <a href="#contact" style={{ color: t.accentText, fontSize: 12.2, fontWeight: 900, justifySelf: "start" }}>{text(lang, "联系我们", "Contact us")}</a>
      </Surface>
    </div>
  )
}
