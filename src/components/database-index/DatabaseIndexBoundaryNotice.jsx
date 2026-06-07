// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { DatabaseIndexStatusBadge } from "./DatabaseIndexStatusBadge"

export function DatabaseIndexBoundaryNotice({ lang, t }) {
  return (
    <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <DatabaseIndexStatusBadge status="database_index_preview" t={t} />
        <DatabaseIndexStatusBadge status="not_full_database" t={t} />
        <DatabaseIndexStatusBadge status="offline_preprocessed" t={t} />
        <DatabaseIndexStatusBadge status="detail_on_demand" t={t} />
      </div>
      <strong style={{ color: t.warn, fontSize: 13.5 }}>
        {text(lang, "这是数据库索引架构预览，不是经过完整验证的全量数据库筛选。", "This is an index architecture preview, not full verified database screening.")}
      </strong>
      <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "浏览器只加载摘要、选定索引分片和按需详情记录。它不会在浏览器中加载完整 CoRE/QMOF 原始数据库，也不代表经过验证的全量筛选结论。",
          "The browser loads summaries, selected index parts, and detail records on demand. It does not load full raw CoRE/QMOF databases in the browser and does not represent verified full-scale screening."
        )} />
      </p>
    </section>
  )
}
