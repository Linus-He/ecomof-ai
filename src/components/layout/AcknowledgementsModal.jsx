import { useEffect, useRef } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS } from "../../constants/theme"

const XJU_EMBLEM_SRC = `${import.meta.env.BASE_URL || "/"}assets/xju-emblem.jpg`

const acknowledgementCards = [
  {
    id: "happyflight",
    variant: "mof-purple",
    watermark: "MOFs",
    en: {
      name: "HappyFlight",
      role: "Early supporter",
      text: "Mentor and friend — thank you for your encouragement, sharing, and inspiration along the way. May you keep flying higher and farther in the field you love.",
    },
    zh: {
      name: "HappyFlight",
      role: "早期支持者",
      text: "亦师亦友，感谢你一路的鼓励、分享与启发。愿你在热爱的领域继续飞得更高、更远。",
    },
  },
  {
    id: "li-xinjian",
    variant: "xju-catalysis",
    emblemSrc: XJU_EMBLEM_SRC,
    watermark: "XJU",
    secondaryWatermark: "CO₂ / HCO₃⁻",
    en: {
      name: "Li Xinjian",
      role: "Xinjiang University · Organic acid catalysis feedback",
      text: "Thank you for your suggestions from the perspective of organic acid catalysis experiments. Your feedback helped Catalysis Lab better reflect real experimental records, data fields, and comparability assessment.",
    },
    zh: {
      name: "李新建",
      role: "新疆大学 · 有机酸催化方向建议",
      text: "感谢你从有机酸催化实验的角度提出建议，帮助 Catalysis Lab 更好地理解真实实验记录、数据字段与可比性判断。",
    },
  },
]

const variantStyles = {
  "mof-purple": {
    background: "linear-gradient(135deg, #21162f 0%, #3f285a 52%, #5b3a78 100%)",
    glow: "rgba(169, 116, 255, 0.22)",
    line: "rgba(255, 255, 255, 0.16)",
  },
  "xju-catalysis": {
    background: "linear-gradient(135deg, #063b3f 0%, #0f5b5f 50%, #0e7490 100%)",
    glow: "rgba(103, 232, 249, 0.18)",
    line: "rgba(236, 253, 245, 0.16)",
  },
}

const pageCopy = {
  en: {
    title: "Acknowledgements",
    description: "EcoMOF-AI is shaped by feedback, encouragement, and domain-specific suggestions from friends, researchers, and early supporters.",
    close: "Close acknowledgements dialog",
  },
  zh: {
    title: "致谢",
    description: "EcoMOF-AI 的迭代离不开朋友、研究方向建议者与早期支持者的鼓励和反馈。",
    close: "关闭致谢弹窗",
  },
}

function MoleculeWatermark({ variant }) {
  const style = variantStyles[variant]
  const nodes = [
    { left: "16%", top: "24%" },
    { left: "46%", top: "16%" },
    { left: "70%", top: "38%" },
    { left: "32%", top: "64%" },
    { left: "76%", top: "74%" },
  ]
  const lines = [
    { left: "24%", top: "28%", width: "29%", rotate: 18 },
    { left: "51%", top: "28%", width: "25%", rotate: 34 },
    { left: "38%", top: "59%", width: "34%", rotate: -20 },
    { left: "34%", top: "37%", width: "30%", rotate: 76 },
  ]

  return (
    <div aria-hidden="true" style={{ inset: 0, opacity: 0.62, pointerEvents: "none", position: "absolute" }}>
      {lines.map((line, index) => (
        <span
          key={`line-${index}`}
          style={{
            background: style.line,
            borderRadius: 999,
            height: 2,
            left: line.left,
            position: "absolute",
            top: line.top,
            transform: `rotate(${line.rotate}deg)`,
            transformOrigin: "left center",
            width: line.width,
          }}
        />
      ))}
      {nodes.map((node, index) => (
        <span
          key={`node-${index}`}
          style={{
            background: "rgba(255, 255, 255, 0.18)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: 999,
            height: index % 2 ? 15 : 11,
            left: node.left,
            position: "absolute",
            top: node.top,
            width: index % 2 ? 15 : 11,
          }}
        />
      ))}
    </div>
  )
}

function AcknowledgementCard({ card, lang, isMobile }) {
  const content = card[lang] || card.en
  const style = variantStyles[card.variant]
  const isXju = card.variant === "xju-catalysis"

  return (
    <article
      className="ack-card"
      style={{
        background: style.background,
        borderRadius: isMobile ? 26 : 30,
        boxShadow: `0 24px 50px rgba(15, 23, 42, 0.20), inset 0 1px 0 rgba(255,255,255,0.12)`,
        color: "white",
        minHeight: isMobile ? 210 : 220,
        overflow: "hidden",
        padding: isMobile ? "24px 22px" : "34px 36px",
        position: "relative",
        transition: "transform 180ms ease, box-shadow 180ms ease",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at center, ${style.glow}, transparent 68%)`,
          bottom: -90,
          height: 260,
          position: "absolute",
          right: -70,
          width: 320,
        }}
      />
      <MoleculeWatermark variant={card.variant} />
      {card.emblemSrc && (
        <img
          aria-hidden="true"
          alt=""
          src={card.emblemSrc}
          style={{
            bottom: isMobile ? 20 : 12,
            filter: "grayscale(1) contrast(1.05)",
            height: isMobile ? 150 : 210,
            mixBlendMode: "screen",
            objectFit: "contain",
            opacity: isMobile ? 0.1 : 0.13,
            pointerEvents: "none",
            position: "absolute",
            right: isMobile ? -28 : -20,
            transform: "rotate(-7deg)",
            userSelect: "none",
            width: isMobile ? 150 : 210,
            zIndex: 0,
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          bottom: isMobile ? 16 : 8,
          color: "rgba(255, 255, 255, 0.12)",
          fontSize: isMobile ? 70 : 112,
          fontWeight: 950,
          letterSpacing: -4,
          lineHeight: 0.9,
          pointerEvents: "none",
          position: "absolute",
          right: isMobile ? 18 : 32,
          transform: isXju ? "rotate(-3deg)" : "rotate(-9deg)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {card.watermark}
      </div>
      {card.secondaryWatermark && (
        <div
          aria-hidden="true"
          style={{
            color: "rgba(255, 255, 255, 0.11)",
            fontSize: isMobile ? 18 : 26,
            fontWeight: 900,
            letterSpacing: 0.5,
            pointerEvents: "none",
            position: "absolute",
            right: isMobile ? 24 : 42,
            top: isMobile ? 26 : 34,
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {card.secondaryWatermark}
        </div>
      )}
      {isXju && (
        <div
          aria-hidden="true"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            height: isMobile ? 110 : 150,
            opacity: 0.8,
            position: "absolute",
            right: isMobile ? 12 : 22,
            top: isMobile ? 72 : 72,
            width: isMobile ? 110 : 150,
          }}
        />
      )}
      <div style={{ maxWidth: isMobile ? "100%" : "68%", position: "relative", zIndex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {content.role}
        </div>
        <h3 style={{ color: "white", fontSize: isMobile ? 27 : 31, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.08, margin: "18px 0 0" }}>
          {content.name}
        </h3>
        <p style={{ color: "rgba(255,255,255,0.86)", fontSize: isMobile ? 15 : 16, fontWeight: 650, lineHeight: 1.72, margin: "14px 0 0" }}>
          {content.text}
        </p>
      </div>
    </article>
  )
}

export function AcknowledgementsModal({ open, onClose }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const closeBtnRef = useRef(null)
  const copy = pageCopy[lang] || pageCopy.en

  useEffect(() => {
    if (!open) return
    const handler = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "rgba(2,6,23,0.52)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        overflowY: "auto",
        padding: isMobile ? "16px 10px" : "48px 16px",
        position: "fixed",
        zIndex: 250,
      }}
      onClick={onClose}
    >
      <style>
        {`
          .ack-card:hover {
            box-shadow: 0 30px 62px rgba(15, 23, 42, 0.26), inset 0 1px 0 rgba(255,255,255,0.14);
            transform: translateY(-2px);
          }
          .ack-close:focus-visible {
            outline: 3px solid rgba(14, 116, 144, 0.28);
            outline-offset: 3px;
          }
          @media (prefers-reduced-motion: reduce) {
            .ack-card { transition: none !important; }
            .ack-card:hover { transform: none !important; }
          }
        `}
      </style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={event => event.stopPropagation()}
        style={{
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: isMobile ? 28 : 34,
          boxShadow: t.shadowLg,
          fontFamily: FONT_SANS,
          maxHeight: isMobile ? "calc(100dvh - 32px)" : "calc(100dvh - 96px)",
          overflowY: "auto",
          padding: isMobile ? "22px 16px 28px" : "36px 38px 42px",
          width: isMobile ? "calc(100vw - 20px)" : "min(1000px, 96vw)",
        }}
      >
        <header style={{ alignItems: "flex-start", display: "flex", gap: 18, justifyContent: "space-between", margin: "0 auto 26px", maxWidth: 920 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: t.textStrong, fontSize: isMobile ? 30 : 36, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.08, margin: 0 }}>
              {copy.title}
            </h2>
            <p style={{ color: t.subtle, fontSize: isMobile ? 14 : 15, lineHeight: 1.62, margin: "10px 0 0", maxWidth: 760 }}>
              {copy.description}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            className="ack-close"
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            style={{
              alignItems: "center",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              boxShadow: t.shadowSm,
              color: t.textStrong,
              cursor: "pointer",
              display: "inline-flex",
              flexShrink: 0,
              fontSize: 28,
              height: 46,
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
              width: 46,
            }}
          >
            ×
          </button>
        </header>

        <main style={{ display: "grid", gap: 24, margin: "0 auto", maxWidth: 920 }}>
          {acknowledgementCards.map(card => (
            <AcknowledgementCard key={card.id} card={card} isMobile={isMobile} lang={lang} />
          ))}
        </main>
      </div>
    </div>
  )
}
