// @ts-nocheck
import { useMemo, useState } from "react"
import { useLang } from "../../contexts"
import "./AboutTextPages.css"

const ENDPOINT = "https://formspree.io/f/mnjwnojy"
const CONTACT_EMAIL = "ecomofai@outlook.com"
const text = (lang, zh, en) => lang === "zh" ? zh : en

const EMPTY_FORM = {
  collaborationType: "",
  name: "",
  email: "",
  organization: "",
  subject: "",
  dataStatus: "",
  message: "",
  consent: false,
}

export function ContactPage() {
  const { lang } = useLang()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")
  const zh = lang === "zh"
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const canSubmit = useMemo(() => Boolean(
    form.collaborationType && form.name.trim() && form.email.trim() &&
    form.subject.trim() && form.dataStatus && form.message.trim() && form.consent,
  ), [form])

  const submit = async event => {
    event.preventDefault()
    if (!canSubmit) {
      setError(text(lang, "请填写所有必填字段并确认联系授权。", "Complete all required fields and confirm contact consent."))
      return
    }
    setError("")
    setStatus("loading")
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          collaboration_type: form.collaborationType,
          name: form.name.trim(),
          email: form.email.trim(),
          organization: form.organization.trim(),
          subject: form.subject.trim(),
          data_status: form.dataStatus,
          message: form.message.trim(),
          _subject: `EcoMOF-AI collaboration: ${form.subject.trim()}`,
        }),
      })
      if (!response.ok) throw new Error("submit-failed")
      setStatus("success")
      setForm(EMPTY_FORM)
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="about-text-page" data-testid="contact-page">
      <header className="about-text-intro">
        <span>{text(lang, "关于 / 联系与合作", "About / Contact and collaboration")}</span>
        <h1>{text(lang, "联系与合作", "Contact and collaboration")}</h1>
        <p>{text(
          lang,
          "研究合作、数据接入、方法核查和界面问题都可以在这里说明。请先写清问题与预期结果，不需要提交完整项目材料。",
          "Use this page for research collaboration, data intake, methodology review, or interface issues. Describe the question and expected outcome first; a complete project package is not required.",
        )}</p>
      </header>

      <div className="contact-page-layout">
        <aside className="contact-page-aside">
          <section>
            <h2>{text(lang, "适合联系的事项", "Good reasons to contact")}</h2>
            <ul>
              <li>{text(lang, "MOF、气体分离、催化或生态筛选研究合作", "MOF, gas separation, catalysis, or EcoScreen collaboration")}</li>
              <li>{text(lang, "数据集接入、字段映射与 DOI 核验", "Dataset intake, field mapping, and DOI verification")}</li>
              <li>{text(lang, "方法论复核、错误报告与界面建议", "Methodology review, error reports, and interface feedback")}</li>
            </ul>
          </section>
          <section>
            <h2>{text(lang, "直接联系", "Direct contact")}</h2>
            <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
            <p><a href="https://github.com/Linus-He/ecomof-ai" rel="noreferrer" target="_blank">GitHub / Linus-He</a></p>
          </section>
          <section>
            <h2>{text(lang, "保密承诺", "Confidentiality commitment")}</h2>
            <p>{text(
              lang,
              "我会对通过本页收到的联系内容、研究说明和身份信息保密，仅用于评估和回复本次事项；未经提交者明确许可，不会公开、转交他人或用于其他用途。",
              "I will keep contact details, research descriptions, and identity information received through this page confidential and use them only to assess and respond to the inquiry. They will not be published, shared with others, or used for another purpose without the submitter's explicit permission.",
            )}</p>
            <p>{text(
              lang,
              "表单由 Formspree 负责传输和存储。需要严格保密或受许可限制的原始数据，请先只说明数据范围与保密要求，再通过邮件协商合适的传输方式；请勿提交访问凭证或个人敏感信息。",
              "Formspree processes and stores form submissions. For source data requiring strict confidentiality or subject to licence restrictions, describe only its scope and confidentiality requirements first, then arrange a suitable transfer method by email. Do not submit credentials or sensitive personal information.",
            )}</p>
          </section>
        </aside>

        <form className="contact-page-form" onSubmit={submit} aria-label={text(lang, "联系与合作表单", "Contact and collaboration form")}>
          <div className="contact-form-grid">
            <div className="contact-form-field">
              <label htmlFor="contact-type">{text(lang, "合作类型 *", "Inquiry type *")}</label>
              <select id="contact-type" value={form.collaborationType} onChange={event => set("collaborationType", event.target.value)} required>
                <option value="">{text(lang, "请选择", "Select")}</option>
                <option value="research-collaboration">{text(lang, "研究合作", "Research collaboration")}</option>
                <option value="dataset-intake">{text(lang, "数据集接入与核验", "Dataset intake and verification")}</option>
                <option value="method-review">{text(lang, "方法复核", "Methodology review")}</option>
                <option value="bug-feedback">{text(lang, "错误与界面反馈", "Bug or interface feedback")}</option>
                <option value="other">{text(lang, "其他", "Other")}</option>
              </select>
            </div>
            <div className="contact-form-field">
              <label htmlFor="contact-data-status">{text(lang, "数据状态 *", "Data status *")}</label>
              <select id="contact-data-status" value={form.dataStatus} onChange={event => set("dataStatus", event.target.value)} required>
                <option value="">{text(lang, "请选择", "Select")}</option>
                <option value="no-data">{text(lang, "暂时没有数据", "No dataset yet")}</option>
                <option value="public-data">{text(lang, "仅涉及公开数据", "Public data only")}</option>
                <option value="anonymized-summary">{text(lang, "可提供匿名摘要", "An anonymized summary is available")}</option>
                <option value="restricted-data">{text(lang, "涉及未公开或受限数据", "Unpublished or restricted data involved")}</option>
              </select>
            </div>
            <div className="contact-form-field">
              <label htmlFor="contact-name">{text(lang, "姓名 *", "Name *")}</label>
              <input id="contact-name" autoComplete="name" value={form.name} onChange={event => set("name", event.target.value)} required />
            </div>
            <div className="contact-form-field">
              <label htmlFor="contact-email">{text(lang, "回复邮箱 *", "Reply email *")}</label>
              <input id="contact-email" type="email" autoComplete="email" value={form.email} onChange={event => set("email", event.target.value)} required />
            </div>
            <div className="contact-form-field contact-form-field--wide">
              <label htmlFor="contact-organization">{text(lang, "机构或团队（选填）", "Organization or team (optional)")}</label>
              <input id="contact-organization" autoComplete="organization" value={form.organization} onChange={event => set("organization", event.target.value)} />
            </div>
            <div className="contact-form-field contact-form-field--wide">
              <label htmlFor="contact-subject">{text(lang, "主题 *", "Subject *")}</label>
              <input id="contact-subject" value={form.subject} onChange={event => set("subject", event.target.value)} placeholder={text(lang, "一句话说明希望解决的问题", "State the problem in one sentence")} required />
            </div>
            <div className="contact-form-field contact-form-field--wide">
              <label htmlFor="contact-message">{text(lang, "问题与预期结果 *", "Question and expected outcome *")}</label>
              <textarea id="contact-message" value={form.message} onChange={event => set("message", event.target.value)} placeholder={text(lang, "建议包括研究对象、现有数据、希望获得的结果和时间要求。", "Include the research object, available data, desired outcome, and timing where relevant.")} required />
            </div>
          </div>

          <label className="contact-form-consent">
            <input type="checkbox" checked={form.consent} onChange={event => set("consent", event.target.checked)} required />
            <span>{text(lang, "我同意仅就本次事项通过上述邮箱接收回复。", "I agree to receive a reply at the email above about this inquiry only.")}</span>
          </label>

          <div className="contact-form-actions">
            <p className="contact-form-status" data-tone={error || status === "error" ? "error" : "normal"} role="status">
              {error || (status === "success"
                ? text(lang, "已发送。后续回复将发送到你填写的邮箱。", "Sent. Any follow-up will be sent to the email you provided.")
                : status === "error"
                  ? text(lang, `发送失败，请改用 ${CONTACT_EMAIL}。`, `Submission failed. Please email ${CONTACT_EMAIL}.`)
                  : text(lang, "带 * 的字段为必填项。", "Fields marked * are required."))}
            </p>
            <button type="submit" disabled={status === "loading"}>{status === "loading" ? text(lang, "发送中…", "Sending…") : text(lang, "发送", "Send")}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactPage
