import { useState } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"
import { toolbarBtn } from "../../utils/styles"

const ENDPOINT = "https://formspree.io/f/mnjwnojy"
const FALLBACK_EMAIL = "square.hwh@gmail.com"

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
        {required && <span style={{ color: t.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const BLANK = {
  name: "", email: "", organization: "", role: "",
  referral_source: "",
  interest_module: "", data_type: "", has_dataset: "",
  message: "", consent: false,
}

export function ContactModal({ open, onClose }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()

  const [form, setForm] = useState(BLANK)
  const [status, setStatus] = useState("idle") // idle | loading | success | error

  if (!open) return null

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const canSubmit =
    form.name.trim() && form.email.trim() && form.message.trim() &&
    form.consent && status !== "loading"

  const handleSubmit = async (e) => {
    e.preventDefault()
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
    onClose()
  }

  const inputStyle = {
    width: "100%",
    background: t.surface,
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

  // ── Option tables ────────────────────────────────────────────────────────
  const zh = lang === "zh"

  const roleOpts = zh
    ? [["", "请选择"], ["Student", "学生"], ["Researcher", "研究人员"],
       ["Professor", "老师/导师"], ["Developer", "开发者"],
       ["Industry", "企业/产业"], ["Other", "其他"]]
    : [["", "Select…"], ["Student", "Student"], ["Researcher", "Researcher"],
       ["Professor", "Professor"], ["Developer", "Developer"],
       ["Industry", "Industry"], ["Other", "Other"]]

  const moduleOpts = zh
    ? [["", "请选择"],
       ["EcoScreen", "EcoScreen"],
       ["Performance / Advanced Screening", "Performance / 高级筛选"],
       ["CatalysisLab", "CatalysisLab"],
       ["MOF Library / Data Provenance", "MOF Library / 数据溯源"],
       ["Real Seed Dataset", "Real Seed Dataset"],
       ["General collaboration", "一般合作"]]
    : [["", "Select…"],
       ["EcoScreen", "EcoScreen"],
       ["Performance / Advanced Screening", "Performance / Advanced Screening"],
       ["CatalysisLab", "CatalysisLab"],
       ["MOF Library / Data Provenance", "MOF Library / Data Provenance"],
       ["Real Seed Dataset", "Real Seed Dataset"],
       ["General collaboration", "General collaboration"]]

  const dataTypeOpts = zh
    ? [["", "请选择"], ["Experimental data", "实验数据"],
       ["Literature data", "文献数据"], ["Simulation data", "模拟数据"],
       ["LCA / LCC data", "LCA / LCC 数据"],
       ["No dataset yet", "暂无数据"], ["Other", "其他"]]
    : [["", "Select…"], ["Experimental data", "Experimental data"],
       ["Literature data", "Literature data"], ["Simulation data", "Simulation data"],
       ["LCA / LCC data", "LCA / LCC data"],
       ["No dataset yet", "No dataset yet"], ["Other", "Other"]]

  const hasDatasetOpts = zh
    ? [["", "请选择"], ["Yes", "是"], ["No", "否"], ["Not sure", "不确定"]]
    : [["", "Select…"], ["Yes", "Yes"], ["No", "No"], ["Not sure", "Not sure"]]

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
        padding: "48px 12px 40px",
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(640px, 96vw)",
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: isMobile ? "20px 16px" : "26px 30px",
          fontFamily: FONT_SANS,
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ color: t.accentText, fontSize: 19, fontWeight: 850 }}>
              {zh ? "联系 / 合作" : "Contact / Collaboration"}
            </div>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.65, maxWidth: 460 }}>
              {zh
                ? "如果你希望将 ecomof-ai 用于 MOF 筛选、催化数据整理、LCA 评价或科研合作，可以留下联系方式，并简要说明你的数据或研究问题。"
                : "Interested in using ecomof-ai for MOF screening, catalysis data curation, LCA evaluation, or research collaboration? Send a short message and describe your dataset or research question."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "none", border: "none",
              color: t.subtle, fontSize: 22, cursor: "pointer",
              lineHeight: 1, padding: 4, marginLeft: 12, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Success ── */}
        {status === "success" && (
          <div style={{
            background: t.surface, border: `1px solid ${t.success}`,
            borderRadius: 8, padding: 28, textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10, color: t.success }}>✓</div>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>
              {zh ? "已发送，谢谢你的留言。" : "Thanks — your message has been sent."}
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
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Name + Email */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Field label={zh ? "姓名或称呼 / Name" : "Name / 姓名或称呼"} required>
                <input
                  type="text" name="name" required autoComplete="name"
                  value={form.name} onChange={e => set("name", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label={zh ? "邮箱 / Email" : "Email / 邮箱"} required>
                <input
                  type="email" name="email" required autoComplete="email"
                  value={form.email} onChange={e => set("email", e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Organization + Role */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Field label={zh ? "学校或机构 / Organization" : "Organization / 学校或机构"}>
                <input
                  type="text" name="organization" autoComplete="organization"
                  value={form.organization} onChange={e => set("organization", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label={zh ? "身份 / Role" : "Role / 身份"}>
                <select name="role" value={form.role} onChange={e => set("role", e.target.value)} style={selectStyle}>
                  {roleOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            {/* Referral Source */}
            <Field label={zh ? "渠道来源 / How did you hear about ecomof-ai?" : "How did you hear about ecomof-ai? / 你是通过什么渠道了解到 ecomof-ai 的？"}>
              <select
                name="referral_source"
                value={form.referral_source}
                onChange={e => set("referral_source", e.target.value)}
                style={{ ...selectStyle, maxWidth: isMobile ? "100%" : "calc(50% - 6px)" }}
              >
                {referralSourceOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>

            {/* Interest Module + Data Type */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Field label={zh ? "感兴趣模块 / Interest Module" : "Interest Module / 感兴趣模块"}>
                <select name="interest_module" value={form.interest_module} onChange={e => set("interest_module", e.target.value)} style={selectStyle}>
                  {moduleOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label={zh ? "数据类型 / Data Type" : "Data Type / 数据类型"}>
                <select name="data_type" value={form.data_type} onChange={e => set("data_type", e.target.value)} style={selectStyle}>
                  {dataTypeOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            {/* Has Dataset */}
            <Field label={zh ? "是否已有数据 / Do you already have a dataset?" : "Do you already have a dataset? / 是否已有数据"}>
              <select
                name="has_dataset"
                value={form.has_dataset}
                onChange={e => set("has_dataset", e.target.value)}
                style={{ ...selectStyle, maxWidth: isMobile ? "100%" : "calc(50% - 6px)" }}
              >
                {hasDatasetOpts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>

            {/* Message */}
            <Field label={zh ? "留言 / Message" : "Message / 留言"} required>
              <textarea
                name="message" required rows={4}
                value={form.message}
                onChange={e => set("message", e.target.value)}
                placeholder={zh
                  ? "请简要说明你的研究问题、数据情况或合作想法。"
                  : "Briefly describe your research question, dataset, or collaboration idea."}
                style={{ ...inputStyle, resize: "vertical", minHeight: 96 }}
              />
            </Field>

            {/* Consent */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
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

            {/* Submit */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: "12px 0",
                  borderRadius: 8, border: "none",
                  background: canSubmit ? t.accent : t.border,
                  color: canSubmit ? "#fff" : t.subtle,
                  fontSize: 14, fontWeight: 800,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  width: "100%",
                  fontFamily: FONT_SANS,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {status === "loading"
                  ? (zh ? "发送中…" : "Sending…")
                  : (zh ? "发送留言" : "Send Message")}
              </button>

              <div style={{ color: t.faint, fontSize: 11, textAlign: "center" }}>
                {zh ? "或直接通过邮件联系：" : "Or email directly: "}
                <a href={`mailto:${FALLBACK_EMAIL}`} style={{ color: t.accentText, textDecoration: "none" }}>
                  {FALLBACK_EMAIL}
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
