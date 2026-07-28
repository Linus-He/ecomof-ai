// @ts-nocheck
import { useMemo, useState } from "react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import { BasisBadge, CopyLinkButton, PageHeader, toolbarBtn, useLang, useT, useViewport } from "../../shared"

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
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function statusMeta(status, lang) {
  const map = {
    active: { tone: "calc", zh: "已接入", en: "Active" },
    "active-limited": { tone: "info", zh: "有限接入", en: "Limited" },
    quarantined: { tone: "proxy", zh: "已隔离", en: "Quarantined" },
  }
  const item = map[status] || { tone: "user", zh: status, en: status }
  return { ...item, label: text(lang, item.zh, item.en) }
}

function NoticeRow({ t, index, title, body, level = "required" }) {
  return (
    <article style={{ alignItems: "flex-start", display: "grid", gap: 10, gridTemplateColumns: "30px minmax(0, 1fr)" }}>
      <span style={{
        alignItems: "center",
        background: level === "required" ? t.badgeInfoBg : t.surface,
        border: `1px solid ${level === "required" ? t.accent : t.border}`,
        borderRadius: 8,
        color: level === "required" ? t.accentText : t.muted,
        display: "inline-flex",
        fontSize: 10,
        fontWeight: 900,
        height: 26,
        justifyContent: "center",
      }}>
        {String(index).padStart(2, "0")}
      </span>
      <div style={{ minWidth: 0 }}>
        <strong style={{ color: t.textStrong, display: "block", fontSize: 12.2, lineHeight: 1.4 }}>{title}</strong>
        <span style={{ color: t.muted, display: "block", fontSize: 11.2, lineHeight: 1.6, marginTop: 3 }}>{body}</span>
      </div>
    </article>
  )
}

function DatasetCard({ dataset, lang, t }) {
  const status = statusMeta(dataset.status, lang)
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, padding: 14 }}>
      <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ color: t.textStrong, fontSize: 15, lineHeight: 1.25, margin: 0 }}>{dataset.name}</h3>
          <div style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.5, marginTop: 4 }}>
            {text(lang, dataset.roleZh, dataset.roleEn)}
          </div>
        </div>
        <BasisBadge tone={status.tone}>{status.label}</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {[
          [text(lang, "记录", "Records"), dataset.recordCount == null ? text(lang, "逐条整理", "per-record") : Number(dataset.recordCount).toLocaleString()],
          [text(lang, "许可/边界", "Licence/boundary"), dataset.licence],
          [text(lang, "版本", "Version"), dataset.version],
          [text(lang, "发布方", "Publisher"), dataset.publisher],
        ].map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 9.5, fontWeight: 850 }}>{label}</span>
            <strong style={{ color: t.textStrong, display: "block", fontSize: 10.8, lineHeight: 1.45, marginTop: 3, overflowWrap: "anywhere" }}>{value}</strong>
          </div>
        ))}
      </div>
      <details>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 11.2, fontWeight: 850 }}>
          {text(lang, "查看允许用途、禁止事项与平台处理", "View permitted use, prohibitions, and project handling")}
        </summary>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {[
            [text(lang, "允许范围", "Permitted scope"), text(lang, dataset.allowedZh, dataset.allowedEn), t.success],
            [text(lang, "禁止/不可推断", "Prohibited / not implied"), text(lang, dataset.prohibitedZh, dataset.prohibitedEn), t.warn],
            [text(lang, "EcoMOF-AI 处理", "EcoMOF-AI handling"), text(lang, dataset.projectHandlingZh, dataset.projectHandlingEn), t.accentText],
          ].map(([label, body, color]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
              <strong style={{ color, display: "block", fontSize: 10.4 }}>{label}</strong>
              <span style={{ color: t.muted, display: "block", fontSize: 10.8, lineHeight: 1.55, marginTop: 4 }}>{body}</span>
            </div>
          ))}
        </div>
      </details>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {dataset.sourceUrl ? (
          <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(t), color: t.accentText, textDecoration: "none" }}>
            {text(lang, "官方来源", "Official source")}
          </a>
        ) : null}
        {(dataset.licenceUrls || []).map((url, index) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" style={{ ...toolbarBtn(t), textDecoration: "none" }}>
            {index === 0 ? text(lang, "许可正文", "Licence text") : text(lang, "附加条款", "Additional terms")}
          </a>
        ))}
      </div>
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

  return (
    <div id="database-compliance" data-testid="database-compliance-tab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "数据合规", "Data Compliance")}
        subtitle={text(
          lang,
          "逐库说明来源、许可、再分发边界、平台承诺与用户责任。接入状态不是对任何来源数据的重新许可。",
          "Source-by-source disclosure of licences, redistribution boundaries, platform commitments, and user responsibilities. Ingestion status is not a relicence of source data.",
        )}
        meta={text(lang, "非商业开放研究 · 条款逐库核验 · 用户再利用责任", "Non-commercial open research · source-specific terms · user reuse obligations")}
        action={<CopyLinkButton hash="database-compliance" ariaLabel={text(lang, "复制合规说明链接", "Copy compliance link")} />}
      />

      <Surface t={t} style={{ background: t.badgeInfoBg, borderColor: t.accent, display: "grid", gap: 12 }}>
        <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <BasisBadge tone="calc">{text(lang, "项目合规门：当前通过", "Project gate: currently passed")}</BasisBadge>
            <h2 style={{ color: t.textStrong, fontSize: isMobile ? 19 : 22, lineHeight: 1.2, margin: "9px 0 0" }}>
              {text(lang, complianceRegistry.operatingMode.zh, complianceRegistry.operatingMode.en)}
            </h2>
          </div>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
            {text(lang, "条款复核日期", "Terms checked")} · {complianceRegistry.termsCheckedAt}
          </span>
        </div>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: 0 }}>
          {text(lang, complianceRegistry.statusStatement.zh, complianceRegistry.statusStatement.en)}
        </p>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, color: t.warn, fontSize: 11.2, lineHeight: 1.6, padding: 10 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "访问边界：", "Access boundary: ")}</strong>
          {text(lang, complianceRegistry.accessBoundary.zh, complianceRegistry.accessBoundary.en)}
        </div>
      </Surface>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {[
          [text(lang, "当前主动接入", "Active ingestions"), activeCount, text(lang, "逐库通过合规门", "source-specific gate")],
          [text(lang, "含非商业限制", "Non-commercial licences"), nonCommercialCount, text(lang, "商业用途需另行许可", "separate commercial permission")],
          [text(lang, "FAIR-MOFs 证据", "FAIR-MOFs evidence"), "4,168", text(lang, "CC BY 4.0", "CC BY 4.0")],
          [text(lang, "CoRE 结构主库", "CoRE structure corpus"), "9,835", text(lang, "仅 modified CIF", "modified CIF only")],
        ].map(([label, value, note]) => (
          <Surface key={label} t={t} style={{ display: "grid", gap: 5, padding: 13 }}>
            <span style={{ color: t.faint, fontSize: 9.8, fontWeight: 850 }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 21 }}>{value}</strong>
            <span style={{ color: t.muted, fontSize: 10.4 }}>{note}</span>
          </Surface>
        ))}
      </div>

      <Surface t={t} style={{ display: "grid", gap: 13 }}>
        <div>
          <h2 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "网站用户必须遵守的再利用责任", "Mandatory user responsibilities for reuse")}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, margin: "6px 0 0" }}>
            {text(
              lang,
              "以下提示不把你变成任何来源许可的当事人，也不扩大许可范围；它用于提醒你在下载、复制、改编、模型训练、发布或再分发前完成自己的许可核验。",
              "These notices do not make you a party to a source licence or expand licensed rights. They remind you to complete your own review before download, copying, adaptation, model training, publication, or redistribution.",
            )}
          </p>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {complianceRegistry.userObligations.map((item, index) => (
            <NoticeRow
              key={item.id}
              t={t}
              index={index + 1}
              title={text(lang, item.level === "required" ? "必须遵守" : "责任提示", item.level === "required" ? "Required" : "Responsibility notice")}
              body={text(lang, item.zh, item.en)}
              level={item.level}
            />
          ))}
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, fontSize: 11.2, lineHeight: 1.6, padding: 10 }}>
          {text(lang, complianceRegistry.notLegalAdvice.zh, complianceRegistry.notLegalAdvice.en)}
        </div>
      </Surface>

      <Surface t={t} style={{ display: "grid", gap: 13 }}>
        <div>
          <h2 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "EcoMOF-AI 的公开承诺", "EcoMOF-AI public commitments")}</h2>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, margin: "6px 0 0" }}>
            {text(lang, "这些是当前运营与数据发布流程的可审计承诺，不是对未来所有版本的无条件保证。", "These are auditable commitments for the current operating and publication workflow, not unconditional promises for all future versions.")}
          </p>
        </div>
        <div style={{ display: "grid", gap: 11, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {complianceRegistry.platformCommitments.map((item, index) => (
            <NoticeRow
              key={item.id}
              t={t}
              index={index + 1}
              title={text(lang, "平台承诺", "Platform commitment")}
              body={text(lang, item.zh, item.en)}
              level="notice"
            />
          ))}
        </div>
      </Surface>

      <Surface t={t} style={{ display: "grid", gap: 13 }}>
        <div style={{ alignItems: "flex-end", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "逐数据库许可矩阵", "Source-by-source licence matrix")}</h2>
            <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, margin: "6px 0 0" }}>
              {text(lang, "展开每张卡查看允许范围、禁止事项、平台处理方式和官方条款。", "Expand each card for permitted use, prohibitions, project handling, and official terms.")}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[
              ["all", text(lang, "全部", "All")],
              ["active", text(lang, "已接入", "Active")],
              ["limited", text(lang, "有限接入", "Limited")],
              ["quarantined", text(lang, "已隔离", "Quarantined")],
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
                  color: filter === id ? "#fff" : t.muted,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 11, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {datasets.map(dataset => <DatasetCard key={dataset.id} dataset={dataset} lang={lang} t={t} />)}
        </div>
      </Surface>
    </div>
  )
}
