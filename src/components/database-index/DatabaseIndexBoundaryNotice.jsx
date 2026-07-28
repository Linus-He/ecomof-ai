// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { DatabaseIndexStatusBadge } from "./DatabaseIndexStatusBadge"

export function DatabaseIndexBoundaryNotice({ lang, t }) {
  return (
    <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <DatabaseIndexStatusBadge status="real_core_mof_cr_index" lang={lang} t={t} />
        <DatabaseIndexStatusBadge status="structural_screening_only" lang={lang} t={t} />
        <DatabaseIndexStatusBadge status="raw_cif_on_demand" lang={lang} t={t} />
        <DatabaseIndexStatusBadge status="quarantined" lang={lang} t={t} />
      </div>
      <strong style={{ color: t.warn, fontSize: 13.5 }}>
        {text(lang, "9,835 条真实 CoRE 2024 CR 已形成全量记录索引；当前预览限制只针对催化评分与浏览器内置 CIF，不代表结构数据仍是样例。", "All 9,835 real CoRE 2024 CR rows are indexed. The preview boundary applies to catalytic scoring and browser-bundled CIFs, not to the source-record corpus.")}
      </strong>
      <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "全部 CoRE CR 记录可按 10 个索引分片加载；页面一次只打开选定分片，并内置 30 条详情与路线代表 CIF，以控制体积。结构就绪不等于有机酸催化结论；未经证据支持的字段不会参与评分。",
          "All CoRE CR rows are available through 10 index parts; the page opens one selected part at a time and bundles 30 details plus route-representative CIFs to control payload. Structural readiness is not an organic-acid catalytic conclusion; unsupported fields do not enter scoring."
        )} />
      </p>
    </section>
  )
}
