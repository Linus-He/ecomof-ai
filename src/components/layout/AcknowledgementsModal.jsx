import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"
import { BrandMark } from "../ui"

const HAPPY_FLIGHT_ACK_ZH = "特别感谢 Happy Flight。TA 在这个项目从早期想法、研究定位到功能取舍的过程中持续给予指导、提醒和鼓励；既像导师一样帮助我把问题想深，也像朋友一样陪我把项目一步步推进。EcoMOF-AI 后续对科研严谨性、LCA/LCC 决策链和方法透明性的重视，都受到了这份指导的影响。"
const HAPPY_FLIGHT_ACK_EN = "Special thanks to Happy Flight, whose guidance shaped this project from early concept to research positioning and feature priorities. Happy Flight has been both a mentor and a friend: helping push the scientific questions deeper while supporting the steady development of EcoMOF-AI. The platform's emphasis on methodological transparency, LCA/LCC decision support, and research rigor is strongly influenced by this guidance."

function CreditSection({ title, children }) {
  const t = useT()
  return (
    <section style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 14,
    }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </section>
  )
}

export function AcknowledgementsModal({ open, onClose }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const zh = lang === "zh"

  if (!open) return null

  const textStyle = { color: t.muted, fontSize: 12, lineHeight: 1.7, margin: 0 }
  const listStyle = { margin: "9px 0 0", paddingLeft: 18, color: t.subtle, fontSize: 11, lineHeight: 1.65 }
  const maintainerItems = zh
    ? ["产品设计", "前端开发", "数据结构设计", "规则筛选工作流", "科研原型规划"]
    : ["Product design", "Front-end development", "Data structure design", "Rule-based screening workflow", "Research prototype planning"]
  const generalItems = zh
    ? ["公开 MOF 数据库与文献", "开源 Web 技术库", "AI 辅助编程工具", "未来科研贡献者"]
    : ["Public MOF databases and literature", "Open-source web libraries", "AI-assisted coding tools", "Future research contributors"]

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.58)",
        zIndex: 250,
        overflowY: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 12px",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(760px, 96vw)",
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: isMobile ? "20px 16px" : "26px 30px",
          fontFamily: FONT_SANS,
          boxShadow: t.shadowLg,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <BrandMark size={isMobile ? 28 : 32} radius={8} style={{ boxShadow: t.shadowSm, flexShrink: 0 }} />
            <div>
              <div style={{ color: t.accentText, fontSize: 19, fontWeight: 850, lineHeight: 1.2 }}>
                {zh ? "Acknowledgements / 致谢" : "Acknowledgements"}
              </div>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
                {zh
                  ? "独立科研原型的维护说明与克制致谢。"
                  : "Maintainer note and acknowledgements for an independent research prototype."}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: t.subtle,
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          <CreditSection title={zh ? "A. 特别致谢" : "A. Special Acknowledgement"}>
            <p style={textStyle}>{HAPPY_FLIGHT_ACK_ZH}</p>
            <p style={{ ...textStyle, marginTop: 9 }}>{HAPPY_FLIGHT_ACK_EN}</p>
          </CreditSection>

          <CreditSection title={zh ? "B. 维护者" : "B. Maintainer"}>
            <p style={textStyle}>
              {zh
                ? "EcoMOF-AI 目前由 Linus He 独立开发和维护，作为一个面向 MOF 早期筛选、可持续性评价与任务导向应用探索的科研原型。"
                : "EcoMOF-AI is currently developed and maintained by Linus He as an independent research prototype."}
            </p>
            <ul style={listStyle}>
              {maintainerItems.map(item => <li key={item}>{item}</li>)}
            </ul>
          </CreditSection>

          <CreditSection title={zh ? "C. 一般致谢" : "C. General Acknowledgements"}>
            <p style={textStyle}>
              {zh
                ? "本项目也受益于公开科学数据库、开源软件和 AI 辅助开发流程。后续如形成正式合作，将在获得同意后补充合作者致谢信息。"
                : "This project also benefits from public scientific databases, open-source software, and AI-assisted development workflows. Formal collaborator acknowledgements will be added with permission as collaborations develop."}
            </p>
            <ul style={listStyle}>
              {generalItems.map(item => <li key={item}>{item}</li>)}
            </ul>
          </CreditSection>

          <CreditSection title={zh ? "D. 未来贡献者" : "D. Future contributors"}>
            <p style={textStyle}>
              {zh
                ? "如果你提供数据、反馈、验证或科研合作，并愿意公开展示，后续可以在此处致谢你的贡献。"
                : "If you contribute data, feedback, validation, or research collaboration, your contribution can be acknowledged here with your permission."}
            </p>
          </CreditSection>
        </div>
      </div>
    </div>
  )
}
