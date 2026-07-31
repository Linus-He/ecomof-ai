// @ts-nocheck
import { useState, useEffect, useRef } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"
import { X } from "@phosphor-icons/react"

const ENDPOINT = "https://formspree.io/f/mnjwnojy"
const FALLBACK_EMAIL = "ecomofai@outlook.com"
const DATA_INTAKE_TEMPLATE = `{
  "recordId": "",
  "sourceStatus": "public-literature | collaborator-private | anonymized-demo | pending-review | schema-only",
  "catalyst": {
    "name": "",
    "mofScaffold": "",
    "metalNode": "",
    "modifierMetal": "",
    "functionalGroup": "",
    "batchId": ""
  },
  "reactionCondition": {
    "temperatureC": null,
    "timeH": null,
    "substrate": "",
    "substrateAmountMg": null,
    "co2Source": "CO₂ | NaHCO₃ | HCO₃⁻ | pending",
    "NaHCO3Mg": null,
    "waterMl": null,
    "catalystMg": null,
    "solvent": "water"
  },
  "productMetrics": {
    "formicAcidYieldPercent": null,
    "lacticAcidYieldPercent": null,
    "aceticAcidYieldPercent": null,
    "glycolicAcidYieldPercent": null,
    "peakAreaRecords": []
  },
  "characterizationEvidence": {
    "XRD": "pending",
    "BET": "pending",
    "XPS": "pending",
    "FTIR": "pending",
    "ICP": "pending",
    "SEM_TEM": "pending",
    "NMR": "pending"
  },
  "mechanismNotes": {
    "pathway": "isomerization | retro-aldol | redox with HCO₃⁻ | side reaction | pending",
    "activeSiteHypothesis": "",
    "stabilityNote": ""
  },
  "confidentiality": {
    "canPublish": false,
    "displayMode": "private-draft | anonymized-demo | schema-only"
  },
  "curationStatus": "pending"
}`

function Field({ label, required, children }) {
  const t = useT()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        color: t.subtle,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionHeader({ label, note }) {
  const t = useT()
  return (
    <div>
      <div style={{
        color: t.textStrong,
        fontSize: 11,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
      }}>
        {label}
      </div>
      {note && (
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{note}</div>
      )}
    </div>
  )
}

const BLANK = {
  name: "", email: "", organization: "", role: "",
  referral_source: "",
  use_goal: "", interest_module: "", collaboration_mode: "",
  data_type: "", has_dataset: "", dataset_readiness: "",
  reply_preference: "",
  message: "", consent: false,
}

export function ContactModal({ open, onClose }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()

  const [form, setForm] = useState(BLANK)
  const [status, setStatus] = useState("idle") // idle | loading | success | error
  const [templateStatus, setTemplateStatus] = useState("idle") // idle | copied | fallback
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [validationError, setValidationError] = useState("")
  const closeBtnRef = useRef(null)
  const triggerRef = useRef(null)

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus close button on open
  useEffect(() => {
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const canSubmit =
    form.name.trim() && form.email.trim() &&
    form.organization.trim() && form.role &&
    form.referral_source && form.use_goal && form.interest_module &&
    form.collaboration_mode && form.data_type && form.has_dataset &&
    form.dataset_readiness && form.reply_preference &&
    form.message.trim() && form.consent && status !== "loading"

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setValidationError(lang === "zh" ? "请填写所有必填字段，并确认同意后再提交。" : "Please complete all required fields and confirm consent before submitting.")
      return
    }
    setValidationError("")
    setStatus("loading")
    try {
      const { consent: _c, ...payload } = form
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...payload,
          _subject: `ecomof-ai collaboration inquiry — ${form.name}`,
        }),
      })
      setStatus(res.ok ? "success" : "error")
    } catch {
      setStatus("error")
    }
  }

  const handleClose = () => {
    setForm(BLANK)
    setStatus("idle")
    setTemplateStatus("idle")
    setIntakeOpen(false)
    setValidationError("")
    onClose()
  }

  const copyDataTemplate = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(DATA_INTAKE_TEMPLATE)
        setTemplateStatus("copied")
      } else {
        setTemplateStatus("fallback")
      }
    } catch {
      setTemplateStatus("fallback")
    }
  }

  // ── Shared input styles ──────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    color: t.text,
    fontSize: 13,
    fontFamily: FONT_SANS,
    outline: "none",
    boxSizing: "border-box",
  }
  const selectStyle = { ...inputStyle, cursor: "pointer" }

  // ── Layout helpers ───────────────────────────────────────────────────────
  const col2 = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }
  const sectionBlock = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: isMobile ? "14px 14px" : "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  }
  const compactTag = {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    color: t.subtle,
    fontSize: 10,
    fontWeight: 800,
    padding: "5px 8px",
    lineHeight: 1.2,
  }

  // ── Option tables ────────────────────────────────────────────────────────
  const zh = lang === "zh"

  const roleOpts = zh
    ? [["", "请选择"], ["Student", "学生"], ["Researcher", "研究人员"],
       ["Professor", "老师/导师"], ["Developer", "开发者"],
       ["Industry", "企业/产业"], ["Other", "其他"]]
    : [["", "Select…"], ["Student", "Student"], ["Researcher", "Researcher"],
       ["Professor", "Professor"], ["Developer", "Developer"],
       ["Industry", "Industry"], ["Other", "Other"]]

  const referralSourceOpts = zh
    ? [["", "请选择"],
       ["Xiaohongshu", "小红书"],
       ["Reddit", "Reddit"],
       ["AI tool recommendation", "AI 工具推荐"],
       ["Developer recommendation", "开发者推荐"],
       ["Zhihu", "知乎"],
       ["GitHub", "GitHub"],
       ["Search engine", "搜索引擎"],
       ["Friend / colleague", "朋友、同学或同事推荐"],
       ["Other", "其他"]]
    : [["", "Select…"],
       ["Xiaohongshu", "Xiaohongshu / 小红书"],
       ["Reddit", "Reddit"],
       ["AI tool recommendation", "AI tool recommendation / AI 工具推荐"],
       ["Developer recommendation", "Developer recommendation / 开发者推荐"],
       ["Zhihu", "Zhihu / 知乎"],
       ["GitHub", "GitHub"],
       ["Search engine", "Search engine / 搜索引擎"],
       ["Friend / colleague", "Friend / colleague / 朋友、同学或同事推荐"],
       ["Other", "Other / 其他"]]

  const useGoalOpts = zh
    ? [["", "请选择"],
       ["MOF screening", "材料筛选"],
       ["Catalysis data curation", "催化数据整理"],
       ["LCA / LCC evaluation", "LCA/LCC 评价"],
       ["Data visualization", "数据可视化"],
       ["Paper or project support", "论文或项目支撑"],
       ["Custom platform development", "平台定制开发"],
       ["Just exploring", "只是了解"],
       ["Other", "其他"]]
    : [["", "Select…"],
       ["MOF screening", "MOF screening / 材料筛选"],
       ["Catalysis data curation", "Catalysis data curation / 催化数据整理"],
       ["LCA / LCC evaluation", "LCA / LCC evaluation / LCA/LCC 评价"],
       ["Data visualization", "Data visualization / 数据可视化"],
       ["Paper or project support", "Paper or project support / 论文或项目支撑"],
       ["Custom platform development", "Custom platform development / 平台定制开发"],
       ["Just exploring", "Just exploring / 只是了解"],
       ["Other", "Other / 其他"]]

  const moduleOpts = zh
    ? [["", "请选择"],
       ["EcoScreen", "生态筛选"],
       ["Performance / Advanced Screening", "早期性能筛选 / 高级筛选"],
       ["Catalysis", "催化"],
       ["MOF Library / Data Provenance", "MOF库 / 数据溯源"],
       ["Real Seed Dataset", "真实种子数据集"],
       ["General collaboration", "一般合作"]]
    : [["", "Select…"],
       ["EcoScreen", "EcoScreen"],
       ["Performance / Advanced Screening", "Performance / Advanced Screening"],
       ["Catalysis", "Catalysis"],
       ["MOF Library / Data Provenance", "MOF Library / Data Provenance"],
       ["Real Seed Dataset", "Real Seed Dataset"],
       ["General collaboration", "General collaboration"]]

  const collaborationModeOpts = zh
    ? [["", "请选择"],
       ["Academic collaboration", "学术合作或共同署名"],
       ["Student project or competition", "项目协作、竞赛或大创"],
       ["Technical development", "技术开发，可讨论费用"],
       ["Early discussion", "前期交流，暂不确定"]]
    : [["", "Select…"],
       ["Academic collaboration", "Academic collaboration / 学术合作或共同署名"],
       ["Student project or competition", "Student project or competition / 项目协作、竞赛或大创"],
       ["Technical development", "Technical development / 技术开发，可讨论费用"],
       ["Early discussion", "Early discussion / 前期交流，暂不确定"]]

  const dataTypeOpts = zh
    ? [["", "请选择"], ["Experimental data", "实验数据"],
       ["Literature data", "文献数据"], ["Simulation data", "模拟数据"],
       ["LCA / LCC data", "LCA / LCC 数据"],
       ["No dataset yet", "暂无数据"], ["Other", "其他"]]
    : [["", "Select…"], ["Experimental data", "Experimental data"],
       ["Literature data", "Literature data"], ["Simulation data", "Simulation data"],
       ["LCA / LCC data", "LCA / LCC data"],
       ["No dataset yet", "No dataset yet"], ["Other", "Other"]]

  const datasetReadinessOpts = zh
    ? [["", "请选择"],
       ["No dataset yet", "暂无数据"],
       ["Scattered experimental notes", "零散实验记录"],
       ["Excel or CSV available", "已有 Excel/CSV"],
       ["Literature table available", "已有文献整理表"],
       ["Structured dataset available", "已有结构化数据"],
       ["Not sure yet", "不确定，需要先沟通"]]
    : [["", "Select…"],
       ["No dataset yet", "No dataset yet / 暂无数据"],
       ["Scattered experimental notes", "Scattered experimental notes / 零散实验记录"],
       ["Excel or CSV available", "Excel or CSV available / 已有 Excel/CSV"],
       ["Literature table available", "Literature table available / 已有文献整理表"],
       ["Structured dataset available", "Structured dataset available / 已有结构化数据"],
       ["Not sure yet", "Not sure yet / 不确定，需要先沟通"]]

  const hasDatasetOpts = zh
    ? [["", "请选择"], ["Yes", "是"], ["No", "否"], ["Not sure", "不确定"]]
    : [["", "Select…"], ["Yes", "Yes"], ["No", "No"], ["Not sure", "Not sure"]]

  const replyPreferenceOpts = zh
    ? [["", "请选择"],
       ["Yes, please reply soon", "希望尽快回复"],
       ["No rush", "不着急"],
       ["Feedback only", "只是反馈，不需要回复"]]
    : [["", "Select…"],
       ["Yes, please reply soon", "Yes, please reply soon / 希望尽快回复"],
       ["No rush", "No rush / 不着急"],
       ["Feedback only", "Feedback only / 只是反馈，不需要回复"]]

  const intakeDataTypes = zh
    ? ["催化剂记录", "反应条件", "产物指标", "表征证据", "机理说明", "来源 / 保密状态"]
    : ["Catalyst records", "Reaction conditions", "Product metrics", "Characterization evidence", "Mechanism notes", "Source / confidentiality status"]

  const dataStatusLabels = zh
    ? ["公开文献", "合作者保密数据", "匿名化演示", "仅字段结构", "待复核"]
    : ["Public literature", "Collaborator-private data", "Anonymized demo", "Schema-only", "Pending review"]

  const intakeWorkflow = zh
    ? ["确认数据范围", "映射字段结构", "确认保密边界", "构建演示模块"]
    : ["Define data scope", "Map field structure", "Confirm confidentiality boundary", "Build demo module"]

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(2,6,23,0.58)",
        zIndex: 240,
        overflowY: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 12px 48px",
      }}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={zh ? "联系与合作 / Contact" : "Contact / Collaboration"}
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(820px, 96vw)",
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          maxHeight: "calc(100dvh - 96px)",
          overflowY: "auto",
          padding: isMobile ? "20px 16px" : "28px 32px",
          fontFamily: FONT_SANS,
        }}
      >
        {/* ── Header ── */}
        <div style={{ alignItems: "flex-start", background: t.panel, borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", margin: isMobile ? "-20px -16px 12px" : "-28px -32px 12px", padding: isMobile ? "18px 16px 13px" : "22px 32px 15px", position: "sticky", top: isMobile ? -20 : -28, zIndex: 3 }}>
          <div style={{ color: t.accentText, fontSize: 20, fontWeight: 850, lineHeight: 1.15 }}>
            {zh ? "联系与合作 / Contact" : "Contact / Collaboration"}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            aria-label={zh ? "关闭联系弹窗" : "Close contact dialog"}
            style={{
              alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
              color: t.subtle, cursor: "pointer", display: "inline-flex", height: 36,
              justifyContent: "center", padding: 0, marginLeft: 12, flexShrink: 0, width: 36,
            }}
          >
            <X aria-hidden="true" size={18} weight="bold" />
          </button>
        </div>

        {/* Intro */}
        <p style={{ margin: "0 0 22px", color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
          {zh
            ? "反馈、合作范围与数据接入需求沟通。"
            : "Share feedback, collaboration scope, or data-intake needs."}
        </p>

        <div style={{
          background: t.badgeInfoBg,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: "10px 12px",
          color: t.muted,
          fontSize: 12,
          lineHeight: 1.65,
          marginBottom: 14,
        }}>
          {zh
            ? "你提交的所有信息都会被谨慎处理。未发表数据、合作想法、联系方式和私密内容不会在未经明确同意的情况下公开展示。"
            : "All submitted information will be handled carefully. Unpublished data, collaboration ideas, contact details, and private content will not be published without explicit permission."}
        </div>

        <section id="data-intake" style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setIntakeOpen(prev => !prev)}
            aria-expanded={intakeOpen}
            aria-controls="data-intake-details"
            style={{
              width: "100%",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: "12px 14px",
              color: t.textStrong,
              cursor: "pointer",
              fontFamily: FONT_SANS,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              textAlign: "left",
            }}
          >
            <span style={{ display: "grid", gap: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 850 }}>{zh ? "数据接入与合作说明" : "Data Intake & Collaboration"}</span>
              <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
                {zh ? "默认折叠；展开查看数据类型、处理方式、流程和模板。" : "Collapsed by default; expand for data types, handling, workflow, and template."}
              </span>
            </span>
            <span style={{ color: t.subtle, fontSize: 16 }}>{intakeOpen ? "−" : "+"}</span>
          </button>

          {intakeOpen && (
            <div id="data-intake-details" style={{ ...sectionBlock, marginTop: 8, padding: 14 }}>
              {[
                [zh ? "可以整理哪些数据" : "What data can be structured", intakeDataTypes],
                [zh ? "数据如何处理" : "How data are handled", dataStatusLabels],
                [zh ? "接入流程" : "Intake workflow", intakeWorkflow],
              ].map(([title, items]) => (
                <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 8 }}>{title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {items.map(item => <span key={item} style={compactTag}>{item}</span>)}
                  </div>
                </div>
              ))}

              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
                  {zh ? "模板复制" : "Template copy"}
                </div>
                <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.55, marginTop: 6 }}>
                  {zh
                    ? "仅复制结构化 JSON 模板；不会上传文件或提交真实数据。"
                    : "Copies a structured JSON template only; no upload or real data submission is performed."}
                </div>
                <button
                  type="button"
                  onClick={copyDataTemplate}
                  aria-label={zh ? "复制数据模板" : "Copy data template"}
                  style={{ ...toolbarBtn(t), marginTop: 10, fontWeight: 850 }}
                >
                  {zh ? "复制数据模板" : "Copy data template"}
                </button>
                {templateStatus === "copied" && (
                  <div style={{ color: t.success, fontSize: 10, marginTop: 8 }}>
                    {zh ? "模板已复制" : "Template copied"}
                  </div>
                )}
                {templateStatus === "fallback" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: t.warn, fontSize: 10, lineHeight: 1.5 }}>
                      {zh ? "无法访问剪贴板。可从下方查看模板。" : "Clipboard access failed. The template is shown below."}
                    </div>
                    <pre style={{
                      margin: "8px 0 0",
                      maxHeight: 180,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      color: t.subtle,
                      fontSize: 9,
                      lineHeight: 1.45,
                      padding: 8,
                    }}>{DATA_INTAKE_TEMPLATE}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Success ── */}
        {status === "success" && (
          <div style={{
            background: t.surface, border: `1px solid ${t.success}`,
            borderRadius: 8, padding: 28, textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10, color: t.success }}>✓</div>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>
              {zh ? "已发送，谢谢你的留言。我通常会在 48 小时内回复。如果没有看到回复，请留意垃圾邮件或广告邮件文件夹。" : "Thanks — your message has been sent. I usually reply within 48 hours. If you do not see a reply, please check your spam or junk folder."}
            </div>
            <button type="button" onClick={handleClose} style={{ ...toolbarBtn(t), marginTop: 18 }}>
              {zh ? "关闭" : "Close"}
            </button>
          </div>
        )}

        {/* ── Error banner ── */}
        {status === "error" && (
          <div style={{
            background: t.surface, border: `1px solid ${t.danger}`,
            borderRadius: 8, padding: "12px 16px", marginBottom: 14,
          }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>
              {zh ? "提交失败，请直接通过邮箱联系我。" : "Submission failed. Please email me directly."}
            </div>
            <a href={`mailto:${FALLBACK_EMAIL}`} style={{ color: t.accentText, fontSize: 13, marginTop: 4, display: "block" }}>
              {FALLBACK_EMAIL}
            </a>
            <button type="button" onClick={() => setStatus("idle")} style={{ ...toolbarBtn(t), marginTop: 10, fontSize: 11 }}>
              {zh ? "重试" : "Try again"}
            </button>
          </div>
        )}

        {/* ── Form ── */}
        {status !== "success" && (
          <form noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ── A. Basic information ── */}
            <div style={sectionBlock}>
              <SectionHeader label={zh ? "A. 基本信息" : "A. Basic information"} />
              {validationError && (
                <div style={{ background: t.panel, border: `1px solid ${t.warn}`, borderRadius: 7, padding: "9px 11px", color: t.warn, fontSize: 11, lineHeight: 1.5 }}>
                  {validationError}
                </div>
              )}
              <div style={col2}>
                <Field label={zh ? "姓名或称呼" : "Name"} required>
                  <input
                    type="text" name="name" required autoComplete="name"
                    value={form.name} onChange={e => set("name", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label={zh ? "邮箱" : "Email"} required>
                  <input
                    type="email" name="email" required autoComplete="email"
                    value={form.email} onChange={e => set("email", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={col2}>
                <Field label={zh ? "学校、团队或单位" : "Organization"} required>
                  <input
                    type="text" name="organization" required autoComplete="organization"
                    value={form.organization} onChange={e => set("organization", e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label={zh ? "身份或方向" : "Role"} required>
                  <select name="role" required value={form.role} onChange={e => set("role", e.target.value)} style={selectStyle}>
                    {roleOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={zh ? "渠道来源" : "How did you hear about EcoMOF-AI?"} required>
                <select name="referral_source" required value={form.referral_source} onChange={e => set("referral_source", e.target.value)} style={selectStyle}>
                  {referralSourceOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            {/* ── B. Collaboration context ── */}
            <div style={sectionBlock}>
              <SectionHeader
                label={zh ? "B. 合作意向" : "B. Collaboration context"}
                note={zh ? "帮助我了解你的使用目的和倾向的合作方式。" : "Helps me understand your goals and preferred collaboration mode."}
              />
              <Field label={zh ? "你希望用 EcoMOF-AI 做什么？" : "What do you want to do with EcoMOF-AI?"} required>
                <select name="use_goal" required value={form.use_goal} onChange={e => set("use_goal", e.target.value)} style={selectStyle}>
                  {useGoalOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <div style={col2}>
                <Field label={zh ? "感兴趣模块" : "Interest module"} required>
                  <select name="interest_module" required value={form.interest_module} onChange={e => set("interest_module", e.target.value)} style={selectStyle}>
                    {moduleOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label={zh ? "合作范围 / 方式" : "Collaboration scope / mode"} required>
                  <select name="collaboration_mode" required value={form.collaboration_mode} onChange={e => set("collaboration_mode", e.target.value)} style={selectStyle}>
                    {collaborationModeOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* ── C. Dataset information ── */}
            <div style={sectionBlock}>
              <SectionHeader
                label={zh ? "C. 数据情况" : "C. Dataset information"}
                note={zh
                  ? "你不需要已经拥有完整数据才能联系我，早期想法也可以交流。"
                  : "You do not need a complete dataset to contact me. Early-stage ideas are also welcome."}
              />
              <div style={col2}>
                <Field label={zh ? "数据类型" : "Data type"} required>
                  <select name="data_type" required value={form.data_type} onChange={e => set("data_type", e.target.value)} style={selectStyle}>
                    {dataTypeOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
                <Field label={zh ? "数据准备程度" : "Dataset readiness"} required>
                  <select name="dataset_readiness" required value={form.dataset_readiness} onChange={e => set("dataset_readiness", e.target.value)} style={selectStyle}>
                    {datasetReadinessOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={zh ? "是否已有数据集" : "Do you already have a dataset?"} required>
                <select name="has_dataset" required value={form.has_dataset} onChange={e => set("has_dataset", e.target.value)} style={selectStyle}>
                  {hasDatasetOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            {/* ── D. Message ── */}
            <div style={sectionBlock}>
              <SectionHeader label={zh ? "D. 留言" : "D. Message"} />
              <Field label={zh ? "留言内容" : "Message"} required>
                <textarea
                  name="message" required rows={5}
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder={zh
                    ? "请简要说明你的研究问题、数据情况或合作想法。"
                    : "Briefly describe your research question, dataset, or collaboration idea."}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
                />
              </Field>
              <Field label={zh ? "你希望我回复你吗？" : "Do you want a reply?"} required>
                <select name="reply_preference" required value={form.reply_preference} onChange={e => set("reply_preference", e.target.value)} style={selectStyle}>
                  {replyPreferenceOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>

              {/* Privacy note */}
              <div style={{
                background: t.panel,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                padding: "9px 12px",
                color: t.faint,
                fontSize: 11,
                lineHeight: 1.65,
              }}>
                {zh
                  ? "请不要提交敏感个人信息。你的留言仅用于后续联系沟通。"
                  : "Please do not submit sensitive personal information. Your message will only be used for follow-up communication."}
              </div>

              {/* Consent */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={e => set("consent", e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: t.accent, width: 15, height: 15 }}
                />
                <span style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6 }}>
                  {zh
                    ? "我同意你根据本次留言联系我。"
                    : "I agree to be contacted about this message."}
                </span>
              </label>

              {/* Submit row */}
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column-reverse" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: 10,
                paddingTop: 2,
              }}>
                <div style={{ color: t.faint, fontSize: 11 }}>
                  {zh ? "或直接通过邮件联系：" : "Or email directly: "}
                  <a href={`mailto:${FALLBACK_EMAIL}`} style={{ color: t.accentText, textDecoration: "none" }}>
                    {FALLBACK_EMAIL}
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    padding: "11px 28px",
                    borderRadius: 8, border: "none",
                    background: canSubmit ? t.accent : t.border,
                    color: canSubmit ? "#fff" : t.subtle,
                    fontSize: 14, fontWeight: 800,
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    fontFamily: FONT_SANS,
                    transition: "background 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {status === "loading"
                    ? (zh ? "发送中…" : "Sending…")
                    : (zh ? "发送留言" : "Send Message")}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
