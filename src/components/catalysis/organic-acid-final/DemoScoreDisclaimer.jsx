// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusBadge, text } from "./FinalScreeningShared"

const DEFAULT_ZH = "演示级代理评分 当前 OACS/DMRS 数值为演示级文献代理或专家先验评分，用于展示筛选流程和生成实验假设，不代表最终材料发现结论，也不等同于实际转化率预测。"
const DEFAULT_EN = "Demo-level proxy score: Current OACS/DMRS values are demo-level literature proxies or expert-prior scores used to demonstrate the screening workflow and generate experimental hypotheses; they do not represent final material-discovery conclusions and are not actual conversion-rate predictions."

export function DemoScoreDisclaimer({ rules, lang, t }) {
  const disclaimer = lang === "zh"
    ? rules?.scoreDisclaimer?.zh || DEFAULT_ZH
    : rules?.scoreDisclaimer?.en || DEFAULT_EN

  return (
    <Panel
      id="organic-acid-final-demo-score-disclaimer"
      eyebrow={text(lang, "V1.1 审计边界", "V1.1 audit boundary")}
      title={text(lang, "演示级代理评分 / Demo Score Disclaimer", "Demo Score Disclaimer")}
      t={t}
      actions={<StatusBadge tone="warn" t={t}>demo score</StatusBadge>}
      style={{ background: t.badgeWarnBg }}
    >
      <p style={{ color: t.muted, fontSize: 13, fontWeight: 760, lineHeight: 1.62, margin: 0 }}>
        <ChemicalText value={disclaimer} />
      </p>
    </Panel>
  )
}
