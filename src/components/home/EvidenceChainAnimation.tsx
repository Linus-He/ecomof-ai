// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { BrandMotif, LogoMark } from "../brand"
import { ChemicalText } from "../../shared"

const CHAIN_NODES = [
  { label: "CO₂ uptake", zhLabel: "CO₂ 吸附量", sublabel: "field", zhSublabel: "字段" },
  { label: "literature / database source", zhLabel: "文献 / 数据库来源", sublabel: "source", zhSublabel: "来源" },
  { label: "evidence level", zhLabel: "证据等级", sublabel: "confidence language", zhSublabel: "置信语言" },
  { label: "data status", zhLabel: "数据状态", sublabel: "curation state", zhSublabel: "整理状态" },
  { label: "score contribution", zhLabel: "评分贡献", sublabel: "weighted effect", zhSublabel: "加权影响" },
]

export function EvidenceChainAnimation({ fields, t, isMobile, lang = "en" }) {
  const zh = lang === "zh"
  const [activeField, setActiveField] = useState(null)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true)
    }, { threshold: 0.3 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!activeField) return undefined
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveField(null)
    }
    const onPointerDown = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setActiveField(null)
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onPointerDown)
    }
  }, [activeField])

  const active = fields.find(item => item.field === activeField)

  return (
    <section ref={ref} className="content-card evidence-chain-demo evidence-chain-animation" data-visible={visible ? "true" : "false"} style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: isMobile ? 16 : 20,
      display: "grid",
      gap: 15,
      position: "relative",
      overflow: "visible",
    }}>
      <BrandMotif size={180} color={t.accentText} opacity={0.045} style={{ position: "absolute", right: -44, top: -54, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
            {zh ? "证据链演示" : "Evidence Chain Demo"}
          </div>
          <h3 style={{ margin: "6px 0 0", color: t.textStrong, fontSize: isMobile ? 17 : 21, lineHeight: 1.25, fontWeight: 950 }}>
            {zh ? "单个字段如何进入筛选结果" : "How one field enters a screening result"}
          </h3>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
        gap: isMobile ? 10 : 8,
        position: "relative",
        zIndex: 1,
      }}>
        {CHAIN_NODES.map((node, index) => (
          <div key={node.label} className="evidence-chain-node" style={{
            "--chain-delay": `${index * 95}ms`,
            background: index === 0 ? t.badgeInfoBg : t.surface,
            border: `1px ${index === 3 ? "dashed" : "solid"} ${index === 0 ? t.accent : t.border}`,
            borderRadius: 9,
            padding: "11px 10px",
            minHeight: isMobile ? 0 : 78,
            display: "grid",
            alignContent: "center",
            gap: 5,
            position: "relative",
          }}>
            <div style={{ color: index === 0 ? t.accentText : t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.3 }}>
              <ChemicalText value={zh ? node.zhLabel : node.label} />
            </div>
            <div style={{ color: t.faint, fontSize: 10.2, lineHeight: 1.35 }}>
              {zh ? node.zhSublabel : node.sublabel}
            </div>
            {index < CHAIN_NODES.length - 1 && !isMobile && (
              <span className="evidence-chain-connector" style={{ position: "absolute", top: "50%", left: "100%", width: 8, height: 1, borderTop: `1px ${index === 2 ? "dashed" : "solid"} ${t.borderStrong}` }} />
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
        gap: 10,
        position: "relative",
        zIndex: 1,
      }}>
        {fields.map(field => {
          const selected = activeField === field.field
          return (
            <button
              key={field.field}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setActiveField(current => current === field.field ? null : field.field)
              }}
              onMouseDown={event => event.stopPropagation()}
              aria-label={zh ? `查看 ${field.zhField || field.field} 的证据详情` : `View evidence details for ${field.field}`}
              className="evidence-field-button"
              data-active={selected ? "true" : "false"}
              style={{
                minHeight: 76,
                background: selected ? t.badgeInfoBg : t.surface,
                border: `1px ${field.status === "pending" ? "dashed" : "solid"} ${selected ? t.accent : t.border}`,
                borderRadius: 9,
                padding: 12,
                cursor: "pointer",
                display: "grid",
                gap: 8,
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.25 }}>{zh ? field.zhField || field.field : field.field}</span>
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${selected ? t.accent : t.borderStrong}`,
                  color: selected ? t.accentText : t.subtle,
                  background: t.panel,
                  fontSize: 11,
                  fontWeight: 950,
                  flexShrink: 0,
                }}>
                  i
                </span>
              </span>
              <span style={{ color: selected ? t.accentText : t.subtle, fontSize: 11, fontWeight: 850 }}>{zh ? field.zhStatus || field.status : field.status}</span>
            </button>
          )
        })}
      </div>

      {active && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={zh ? `${active.zhField || active.field} 证据详情` : `${active.field} evidence details`}
          className="evidence-local-popover"
          style={{
            position: isMobile ? "relative" : "absolute",
            right: isMobile ? "auto" : 20,
            bottom: isMobile ? "auto" : 20,
            zIndex: 25,
            width: isMobile ? "100%" : 330,
            maxWidth: "100%",
            background: t.panel,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 10,
            boxShadow: t.shadowMd,
            padding: 14,
            display: "grid",
            gap: 9,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "字段名称" : "Field name"}</div>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{zh ? active.zhField || active.field : active.field}</div>
            </div>
            <button type="button" onClick={() => setActiveField(null)} aria-label={zh ? "关闭证据详情" : "Close evidence details"} style={{ background: "transparent", border: "none", color: t.subtle, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 }}>
              x
            </button>
          </div>
          {(zh ? [
            ["数据状态", active.zhStatus || active.status],
            ["证据类型", active.zhEvidenceType || active.evidenceType],
            ["来源类型", active.zhSourceType || active.sourceType],
            ["置信度", active.zhConfidence || active.confidence],
          ] : [
            ["Data status", active.status],
            ["Evidence type", active.evidenceType],
            ["Source type", active.sourceType],
            ["Confidence", active.confidence],
          ]).map(([label, value]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 9px" }}>
              <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.45, marginTop: 2 }}>{value}</div>
            </div>
          ))}
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{zh ? active.zhNote || active.note : active.note}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 9, color: t.faint, fontSize: 10.5, fontWeight: 800 }}>
            <LogoMark size={18} radius={5} />
            {zh ? "记录在 EcoMOF-AI 证据层" : "Tracked in EcoMOF-AI evidence layer"}
          </div>
        </div>
      )}
    </section>
  )
}
