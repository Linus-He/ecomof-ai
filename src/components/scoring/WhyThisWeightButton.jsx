import { useState } from "react"
import { toolbarBtn } from "../../utils/styles"
import { WeightExplanationPopover } from "./WeightExplanationPopover"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function WhyThisWeightButton({ model, descriptorKey, item, t, lang, isMobile, compact = true }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
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
        {text(lang, "为什么这个权重？", "Why this weight?")}
      </button>
      <WeightExplanationPopover
        open={open}
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
