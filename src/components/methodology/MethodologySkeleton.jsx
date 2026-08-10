// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologySkeleton({ lang, t, title, titleZh }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 11, padding: 15, scrollMarginTop: 118 }}>
      <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "正在加载方法论模块", "Loading methodology module")}
      </div>
      <strong style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2 }}>
        <ChemicalText value={text(lang, titleZh || "方法论模块", title || "Methodology module")} />
      </strong>
      <div style={{ display: "grid", gap: 8 }}>
        {[0, 1, 2].map(index => (
          <span key={index} style={{ background: index === 0 ? t.badgeInfoBg : t.surface, border: `1px solid ${t.border}`, borderRadius: 6, height: 12, opacity: 0.82, width: `${92 - index * 18}%` }} />
        ))}
      </div>
    </section>
  )
}

export function KnowledgeBaseSkeleton({ lang, t }) {
  return <MethodologySkeleton lang={lang} t={t} title="Knowledge Base" titleZh="知识库" />
}

export function MethodologySectionSkeleton({ lang, t, title, titleZh }) {
  return <MethodologySkeleton lang={lang} t={t} title={title} titleZh={titleZh} />
}

