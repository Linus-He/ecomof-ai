import { useRef, useState } from "react"
import { toolbarBtn } from "../../utils/styles"
import { WeightExplanationPopover } from "./WeightExplanationPopover"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function WhyThisWeightButton({ model, descriptorKey, item, t, lang, isMobile, compact = false }) {
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)
  const ariaLabel = text(
    lang,
    "查看该描述符权重的区分度、冲突度、缺失率与证据覆盖",
    "View contrast, conflict, missing rate, and evidence coverage for this descriptor."
  )
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        style={{
          ...toolbarBtn(t),
          fontSize: compact ? 10.5 : 11.5,
          padding: compact ? "6px 8px" : "8px 10px",
          color: t.accentText,
          borderColor: t.accent,
          background: t.panel,
        }}
      >
        {compact ? text(lang, "解释", "Rationale") : text(lang, "权重解释", "Weight rationale")}
      </button>
      <WeightExplanationPopover
        open={open}
        anchorRef={buttonRef}
        onClose={() => setOpen(false)}
        model={model}
        descriptorKey={descriptorKey}
        item={item}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
    </>
  )
}
