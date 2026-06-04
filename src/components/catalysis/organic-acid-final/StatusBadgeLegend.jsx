// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusPill, text } from "./FinalScreeningShared"

const STATUSES = [
  ["Demo proxy", "演示级代理", "warn", "Workflow demonstration and hypothesis generation only."],
  ["Expert prior", "专家先验", "info", "Expert-prior score; direct validation is pending."],
  ["Literature-supported", "文献支持", "info", "Supported by literature-derived proxy evidence."],
  ["Evidence pending", "证据待补", "warn", "Required DOI, DFT, EXAFS, or same-condition experiment is pending."],
  ["Robust but audit-required", "稳健但需审计", "warn", "Ranking is stable under perturbation but not final proof."],
  ["Verified", "已验证", "pass", "Reserved for directly validated evidence."],
  ["Rejected by hard gate", "硬阈值拦截", "fail", "Fail/blocked candidates cannot enter final recommendation."],
  ["Needs review", "需复核", "warn", "A required evidence field is missing or incomplete."],
]

export function StatusBadgeLegend({ lang, t, isMobile }) {
  return (
    <Panel
      id="organic-acid-final-status-legend"
      eyebrow={text(lang, "状态图例", "Status legend")}
      title={text(lang, "Status Badge Legend", "Status Badge Legend")}
      t={t}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {STATUSES.map(([en, zh, tone, note]) => (
          <article key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
            <StatusPill tone={tone} t={t}>{lang === "zh" ? zh : en}</StatusPill>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}>
              <ChemicalText value={note} />
            </span>
          </article>
        ))}
      </div>
    </Panel>
  )
}
