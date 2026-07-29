// @ts-nocheck
import { useEffect, useRef } from "react"
import { Database, Flask, ShieldCheck, X } from "@phosphor-icons/react"
import { useLang, useT, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"

const text = (lang, zh, en) => lang === "zh" ? zh : en

function hasValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
}

function format(value, digits = 3) {
  if (!hasValue(value)) return "—"
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
}

function PropertyCell({ label, value, unit, t }) {
  const available = value !== "—"
  return (
    <div style={{
      borderBottom: `1px solid ${t.border}`,
      display: "grid",
      gap: 5,
      minWidth: 0,
      padding: "12px 0",
    }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
      <strong style={{ color: available ? t.textStrong : t.warn, fontSize: 15, lineHeight: 1.25 }}>
        {value}{available && unit ? <small style={{ color: t.muted, fontSize: 10.5, fontWeight: 700 }}> {unit}</small> : null}
      </strong>
    </div>
  )
}

export function PhysicochemicalPropertyModal({ open, onClose, record }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKeyDown = event => {
      if (event.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  const fair = record?.fairMofsCrossValidation || null
  const title = record?.commonName || record?.displayName || record?.csdRefcode || record?.sourceRecordId || text(lang, "未选择 MOF", "No MOF selected")
  const properties = [
    [text(lang, "比表面积", "Surface area"), format(record?.surfaceArea), "m²/g"],
    [text(lang, "孔体积", "Pore volume"), format(record?.poreVolume), "cm³/g"],
    ["PLD", format(record?.pldA ?? record?.poreSizeA), "Å"],
    ["LCD", format(record?.lcdA), "Å"],
    [text(lang, "密度", "Density"), format(record?.density), "g/cm³"],
    [text(lang, "空隙率", "Void fraction"), format(record?.voidFraction, 4), ""],
  ]

  return (
    <div
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.()
      }}
      style={{
        alignItems: "center",
        background: "rgba(5, 13, 24, 0.66)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: isMobile ? 12 : 24,
        position: "fixed",
        zIndex: 500,
      }}
    >
      <section
        aria-labelledby="mof-property-dialog-title"
        aria-modal="true"
        data-testid="mof-property-modal"
        role="dialog"
        style={{
          background: t.panel,
          border: `1px solid ${t.borderStrong || t.border}`,
          borderRadius: 10,
          boxShadow: "0 28px 80px rgba(4, 16, 30, 0.28)",
          color: t.text,
          fontFamily: FONT_SANS,
          maxHeight: "min(820px, calc(100vh - 32px))",
          overflowY: "auto",
          width: "min(760px, 100%)",
        }}
      >
        <header style={{
          alignItems: "flex-start",
          background: t.panel,
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          gap: 18,
          justifyContent: "space-between",
          padding: isMobile ? 16 : "20px 22px",
          position: "sticky",
          top: 0,
          zIndex: 3,
        }}>
          <div style={{ display: "grid", gap: 7, minWidth: 0 }}>
            <span style={{ alignItems: "center", color: t.accentText, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 7, letterSpacing: ".06em" }}>
              <Flask aria-hidden="true" size={16} weight="duotone" />
              {text(lang, "物化性质档案", "Physicochemical property record")}
            </span>
            <h2 id="mof-property-dialog-title" style={{ color: t.textStrong, fontSize: isMobile ? 23 : 29, lineHeight: 1.1, margin: 0, overflowWrap: "anywhere" }}>{title}</h2>
            <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.55 }}>
              CSD {record?.csdRefcode || text(lang, "待确认", "pending")} · {record?.sourceVersion || "CoRE MOF 2024 v1.1"}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={text(lang, "关闭物化性质弹窗", "Close physicochemical property dialog")}
            style={{
              alignItems: "center",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 7,
              color: t.textStrong,
              cursor: "pointer",
              display: "inline-flex",
              height: 36,
              justifyContent: "center",
              width: 36,
            }}
          >
            <X aria-hidden="true" size={18} weight="bold" />
          </button>
        </header>

        <div style={{ display: "grid", gap: 20, padding: isMobile ? 16 : "20px 22px 24px" }}>
          <section>
            <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
              <Database aria-hidden="true" color={t.accentText} size={17} weight="duotone" />
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "CoRE MOF 2024 主性质层", "CoRE MOF 2024 primary property layer")}</strong>
            </div>
            <div style={{ display: "grid", gap: "0 18px", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", marginTop: 8 }}>
              {properties.map(([label, value, unit]) => <PropertyCell key={label} label={label} value={value} unit={unit} t={t} />)}
            </div>
            <p style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.65, margin: "12px 0 0" }}>
              {text(
                lang,
                "以上为 CoRE MOF 2024 CSD-modified CR 记录中的结构几何描述符，不等同于在特定活化、温度或吸附质条件下的实验测量值。",
                "These are structural-geometry descriptors from the CoRE MOF 2024 CSD-modified CR record, not experimental measurements under a particular activation, temperature, or adsorbate condition.",
              )}
            </p>
          </section>

          <section style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 16 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
                <ShieldCheck aria-hidden="true" color={fair ? t.success : t.warn} size={17} weight="duotone" />
                <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "FAIR‑MOFs 独立交叉记录", "FAIR-MOFs independent cross-record")}</strong>
              </div>
              <span style={{ color: fair ? t.success : t.warn, fontSize: 10.5, fontWeight: 900 }}>
                {fair ? text(lang, "CSD Refcode 完全一致", "Exact CSD Refcode") : text(lang, "无精确交叉记录", "No exact cross-record")}
              </span>
            </div>
            {fair ? (
              <>
                <div style={{ display: "grid", gap: "0 18px", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", marginTop: 8 }}>
                  <PropertyCell label={text(lang, "可达比表面积", "Accessible surface area")} value={format(fair.properties?.accessibleSurfaceAreaM2Cm3)} unit="m²/cm³" t={t} />
                  <PropertyCell label={text(lang, "可达体积分数", "Accessible volume fraction")} value={format(fair.properties?.accessibleVolumeFraction, 4)} unit="" t={t} />
                  <PropertyCell label="PLD" value={format(fair.properties?.pldA)} unit="Å" t={t} />
                  <PropertyCell label="LCD" value={format(fair.properties?.lcdA)} unit="Å" t={t} />
                  <PropertyCell label={text(lang, "最大自由路径直径", "Largest free-path diameter")} value={format(fair.properties?.largestFreePathDiameterA)} unit="Å" t={t} />
                  <PropertyCell label={text(lang, "孔道数量", "Number of channels")} value={format(fair.properties?.numberOfChannels, 0)} unit="" t={t} />
                </div>
                <a href={fair.sourceUrl} target="_blank" rel="noreferrer" style={{ color: t.accentText, display: "inline-block", fontSize: 10.8, fontWeight: 850, marginTop: 12, textDecorationThickness: "1px", textUnderlineOffset: 3 }}>
                  {text(lang, "查看 FAIR‑MOFs 官方原始记录与许可", "Open FAIR-MOFs primary record and licence")} ↗
                </a>
              </>
            ) : (
              <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, margin: "10px 0 0" }}>
                {text(lang, "当前结构仍可使用 CoRE 主性质层；系统不会用基础 Refcode、DOI、化学式或近似名称伪造跨库一致性。", "The CoRE primary layer remains available. The system does not manufacture a cross-database match from a base Refcode, DOI, formula, or similar name.")}
              </p>
            )}
          </section>

          <footer style={{ background: t.surface, borderLeft: `3px solid ${t.warn}`, color: t.muted, fontSize: 10.7, lineHeight: 1.65, padding: "10px 12px" }}>
            <strong style={{ color: t.textStrong }}>{text(lang, "使用边界：", "Use boundary: ")}</strong>
            {text(
              lang,
              "本站确认仅用于非商业研究。CoRE 修改数据适用 CC BY‑NC‑SA 4.0；FAIR‑MOFs 适用 CC BY 4.0。结果用于检索与筛选，不能替代原始论文、实验表征或工程安全审查。",
              "This site is confirmed for non-commercial research only. Modified CoRE data are governed by CC BY-NC-SA 4.0; FAIR-MOFs is governed by CC BY 4.0. Results support retrieval and screening and do not replace source papers, experimental characterization, or engineering safety review.",
            )}
          </footer>
        </div>
      </section>
    </div>
  )
}
