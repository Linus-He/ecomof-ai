// @ts-nocheck
import { useMemo, useState } from "react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import { CopyLinkButton, PageHeader, toolbarBtn, useLang, useT, useViewport } from "../../shared"

const text = (lang, zh, en) => lang === "zh" ? zh : en

function Surface({ t, children, style = {}, ...props }) {
  return (
    <section
      {...props}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        minWidth: 0,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function SectionHeading({ t, eyebrow, title, body }) {
  return (
    <header style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 6, paddingBottom: 14 }}>
      <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{eyebrow}</span>
      <h2 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.25, margin: 0 }}>{title}</h2>
      {body ? <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: 0, maxWidth: 900 }}>{body}</p> : null}
    </header>
  )
}

function ResponsibilityRow({ t, label, body, required = true }) {
  return (
    <article style={{ borderBottom: `1px solid ${t.border}`, display: "grid", gap: 6, padding: "13px 0" }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 9 }}>
        <span style={{ borderLeft: `3px solid ${required ? t.warn : t.accentText}`, color: t.textStrong, fontSize: 11.5, fontWeight: 900, paddingLeft: 9 }}>
          {label}
        </span>
      </div>
      <p style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.68, margin: 0, paddingLeft: 12 }}>{body}</p>
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
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, minWidth: 0, overflow: "hidden" }}>
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

  const activeCount = complianceRegistry.datasets.filter(row => row.status === "active").length
  const nonCommercialCount = complianceRegistry.datasets.filter(row => /BY-NC|NonCommercial|non-commercial/i.test(row.licence)).length
  const acknowledgementZh = "继续访问、检索、下载或使用本网站的数据与派生结果，即表示您确认已经阅读并理解本页所述的来源归属、许可边界与再利用责任，并同意在适用范围内遵守相应要求。该确认不替代您与原始数据发布方之间可能适用的许可协议，也不免除您针对具体用途进行独立核验并取得必要授权的责任。"
  const acknowledgementEn = "By continuing to access, search, download, or use data and derived results from this website, you confirm that you have read and understood the source attribution, licence boundaries, and reuse responsibilities described on this page, and agree to comply where they apply. This acknowledgement does not replace any licence agreement that may apply between you and the original data publisher, nor does it remove your responsibility to review the intended use independently and obtain any required permission."

  return (
    <div id="database-compliance" data-testid="database-compliance-tab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "数据合规与再利用边界", "Data Compliance and Reuse Boundaries")}
        subtitle={text(
          lang,
          "说明 EcoMOF-AI 使用了哪些数据、依据什么条款处理、哪些用途需要额外许可，以及网站用户在下载、分析、发布和再分发时承担的责任。",
          "Explains which data EcoMOF-AI uses, the terms governing its handling, uses that require additional permission, and user responsibilities for download, analysis, publication, and redistribution.",
        )}
        meta={text(lang, "非商业开放研究 · 来源逐库登记 · 许可不随界面转移", "Non-commercial open research · source-specific registry · source rights are not transferred by the interface")}
        action={<CopyLinkButton hash="database-compliance" ariaLabel={text(lang, "复制合规说明链接", "Copy compliance link")} />}
      />

      <Surface t={t} style={{ background: t.badgeInfoBg, borderColor: t.accent, display: "grid", gap: 14, padding: isMobile ? 16 : 22 }}>
        <div style={{ display: "grid", gap: 7 }}>
          <span style={{ color: t.accentText, fontSize: 10.8, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>{text(lang, "使用与责任确认", "Use and responsibility acknowledgement")}</span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.25, margin: 0 }}>
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
          <a href="mailto:ecomofai@outlook.com" style={{ color: t.accentText, fontSize: 12, fontWeight: 900, justifySelf: isNarrow ? "start" : "end", textDecoration: "none" }}>
            ecomofai@outlook.com
          </a>
        </div>
      </Surface>

      <Surface t={t} style={{ display: "grid", gap: 14 }}>
        <SectionHeading
          t={t}
          eyebrow={text(lang, "当前状态", "Current position")}
          title={text(lang, "合规判断只适用于已登记的版本与当前用途", "Compliance conclusions are limited to registered versions and current uses")}
          body={text(lang, complianceRegistry.statusStatement.zh, complianceRegistry.statusStatement.en)}
        />
        <div style={{ display: "grid", gap: 0, gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
          {[
            [text(lang, "当前主动接入", "Active ingestions"), activeCount, text(lang, "均按数据源单独核验", "reviewed source by source")],
            [text(lang, "含非商业限制", "Non-commercial restrictions"), nonCommercialCount, text(lang, "商业用途需另行授权", "separate permission for commercial use")],
            [text(lang, "FAIR-MOFs 证据记录", "FAIR-MOFs evidence records"), "4,168", "CC BY 4.0"],
            [text(lang, "CoRE 结构主库", "CoRE structure corpus"), "9,835", text(lang, "仅 CSD-modified CIF", "CSD-modified CIF only")],
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

      <div style={{ alignItems: "start", display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.08fr) minmax(320px, .92fr)" }}>
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
            {complianceRegistry.userObligations.map(item => (
              <ResponsibilityRow
                key={item.id}
                t={t}
                label={text(lang, item.level === "required" ? "必须遵守" : "独立判断责任", item.level === "required" ? "Required" : "Independent responsibility")}
                body={text(lang, item.zh, item.en)}
                required={item.level === "required"}
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
            {complianceRegistry.platformCommitments.map(item => (
              <ResponsibilityRow
                key={item.id}
                t={t}
                label={text(lang, "平台处理", "Platform handling")}
                body={text(lang, item.zh, item.en)}
                required={false}
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
            <span style={{ color: t.faint, fontSize: 10.5 }}>{text(lang, "条款复核日期", "Terms last checked")} · {complianceRegistry.termsCheckedAt}</span>
          </Surface>
        </div>
      </div>

      <Surface t={t} style={{ display: "grid", gap: 14 }}>
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
        <div style={{ display: "grid", gap: 11 }}>
          {datasets.map(dataset => <DatasetRow key={dataset.id} dataset={dataset} lang={lang} t={t} />)}
        </div>
      </Surface>

      <Surface t={t} style={{ background: t.badgeInfoBg, borderColor: t.accent, display: "grid", gap: 8 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "疑问、权利声明或数据移除请求", "Questions, rights notices, or data removal requests")}</strong>
        <p style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.65, margin: 0 }}>
          {text(
            lang,
            "如您是数据发布方、权利人或网站用户，并对署名、许可适用、记录身份、错误内容或数据移除有疑问，请提供相关记录名称、来源链接与问题说明。我们会先暂停存在合理争议的相关展示，再进行来源和条款核验。",
            "If you are a publisher, rightsholder, or site user with questions about attribution, licence scope, record identity, incorrect content, or removal, include the record name, source link, and a description of the issue. We will suspend reasonably disputed content before reviewing provenance and terms.",
          )}
        </p>
        <a href="mailto:ecomofai@outlook.com" style={{ color: t.accentText, fontSize: 12.5, fontWeight: 900, justifySelf: "start", textDecoration: "none" }}>ecomofai@outlook.com</a>
      </Surface>
    </div>
  )
}
