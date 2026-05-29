// @ts-nocheck
import { useState } from "react"
import { toolbarBtn } from "../../utils/styles"
import { ScoreExplanationDrawer } from "./ScoreExplanationDrawer"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function WhyThisResultButton({
  model,
  candidateId,
  candidate,
  t,
  lang,
  isMobile,
  label,
  compact = false,
  stopPropagation = true,
  fallbackMessage,
}) {
  const [open, setOpen] = useState(false)
  const openDrawer = event => {
    if (stopPropagation) event.stopPropagation()
    setOpen(true)
  }
  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        style={{
          ...toolbarBtn(t),
          fontSize: compact ? 10.5 : 11.5,
          padding: compact ? "6px 8px" : "8px 10px",
          color: t.accentText,
          borderColor: t.accent,
          background: t.panel,
        }}
      >
        {label || text(lang, "为什么是这个结果？", "Why this result?")}
      </button>
      <ScoreExplanationDrawer
        open={open}
        onClose={() => setOpen(false)}
        model={model}
        candidateId={candidateId}
        candidate={candidate}
        t={t}
        lang={lang}
        isMobile={isMobile}
        fallbackMessage={fallbackMessage}
      />
    </>
  )
}
