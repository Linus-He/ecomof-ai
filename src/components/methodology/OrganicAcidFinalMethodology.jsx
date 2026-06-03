// @ts-nocheck
import { BlockFormula, ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const ORGANIC_ACID_FINAL_DIRECTORY = {
  id: "methodology-organic-acid-final-screening",
  label: "Organic Acid Final Screening",
  labelZh: "有机酸最终筛选",
  level: 1,
  display: "有机酸最终筛选",
  children: [
    { id: "methodology-oafs-problem-definition", label: "Problem Definition", labelZh: "问题定义" },
    { id: "methodology-oafs-stage1", label: "Stage 1: Al-MOF Framework Mining", labelZh: "Stage 1：Al-MOF 骨架筛选" },
    { id: "methodology-oafs-stage2", label: "Stage 2: Dopant Metal Recommendation", labelZh: "Stage 2：第二金属推荐" },
    { id: "methodology-oafs-critic-ahp", label: "CRITIC + AHP Weighting", labelZh: "CRITIC + AHP 赋权" },
    { id: "methodology-oafs-sensitivity", label: "Sensitivity Analysis", labelZh: "敏感性分析" },
    { id: "methodology-oafs-blind-baseline", label: "Blind Baseline", labelZh: "盲测基线" },
    { id: "methodology-oafs-exafs", label: "EXAFS Prediction and Falsification", labelZh: "EXAFS 预测与证伪" },
    { id: "methodology-oafs-controls", label: "Experimental Validation Controls", labelZh: "实验验证对照" },
    { id: "methodology-oafs-limitations", label: "Limitations and Reproducibility", labelZh: "限制与复现" },
  ],
}

function Section({ id, title, children, t }) {
  return (
    <details id={id} open style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, padding: 12, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 16, fontWeight: 930, lineHeight: 1.25 }}>
        <ChemicalText value={title} />
      </summary>
      <div style={{ display: "grid", gap: 10, marginTop: 11 }}>
        {children}
      </div>
    </details>
  )
}

function Paragraph({ children, t }) {
  return <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.62, margin: 0 }}><ChemicalText value={children} /></p>
}

function Chips({ rows, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {rows.map(row => (
        <span key={row} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontSize: 11.5, fontWeight: 850, padding: "6px 9px" }}>
          <ChemicalText value={row} />
        </span>
      ))}
    </div>
  )
}

export function OrganicAcidFinalMethodology({ lang, t }) {
  return (
    <details id="methodology-organic-acid-final-screening" open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 14, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 22, fontWeight: 940, lineHeight: 1.15 }}>
        {text(lang, "有机酸最终筛选：Al-MOF 稳定骨架与第二金属推荐", "Organic Acid Final Screening: Al-MOF Framework Mining and Dopant Metal Recommendation")}
      </summary>
      <div style={{ display: "grid", gap: 12, marginTop: 13 }}>
        <Paragraph t={t}>
          {text(
            lang,
            "本章节说明 Organic Acid Final Screening V1 的两阶段目标定制筛选框架。它只支撑可解释实验设计假设，不宣称实际转化率、催化剂最优性或已验证性能。",
            "This chapter describes the two-stage target-conditioned screening framework for Organic Acid Final Screening V1. It supports interpretable experimental design hypotheses, not absolute conversion rates, catalyst optimality, or validated performance."
          )}
        </Paragraph>

        <Section id="methodology-oafs-problem-definition" title="1. Problem Definition" t={t}>
          <Paragraph t={t}>
            {text(
              lang,
              "本流程不直接检索 Al/Mo 双金属 MOF，而是首先在 170°C 水相约束下识别具有水热稳定潜力的 Al-MOF 骨架，再通过机制拆分的第二金属推荐模型对候选金属进行排序。Mo 是推荐结果，而不是直接检索条件。",
              "This workflow does not directly retrieve Al/Mo bimetallic MOFs. Instead, it first identifies hydrothermally robust Al-MOF scaffolds under a 170°C aqueous-phase constraint, and then ranks candidate second metals using a mechanism-resolved dopant recommendation model. Mo appears as a recommendation outcome rather than a direct search condition."
            )}
          </Paragraph>
        </Section>

        <Section id="methodology-oafs-stage1" title="2. Stage 1: Al-MOF Framework Mining" t={t}>
          <Paragraph t={t}>
            {text(lang, "Stage 1 uses a hydrothermal hard gate before scoring.", "Stage 1 uses a hydrothermal hard gate before scoring.")}
          </Paragraph>
          <BlockFormula
            t={t}
            math={"\\text{If HydrothermalGate}=\\text{fail},\\quad \\text{OACS}=0,\\quad \\text{CollapseRisk}=1"}
            fallback={"If HydrothermalGate = fail, OACS = 0, CollapseRisk = 1"}
          />
          <BlockFormula
            t={t}
            math={"\\text{OACS}=w_1H_{\\text{hydrothermal}}+w_2S_{\\text{thermal}}+w_3R_{\\text{water-blocking}}+w_4A_{\\text{pore}}+w_5A_{\\text{C1}}+w_6R_{\\text{Al-O}}+w_7M_{\\text{linker}}+w_8C_{\\text{evidence}}-w_9R_{\\text{collapse}}"}
            fallback={"OACS = w1 H_hydrothermal + w2 S_thermal + w3 R_water-blocking + w4 A_pore + w5 A_C1 + w6 R_Al-O + w7 M_linker + w8 C_evidence - w9 R_collapse"}
          />
          <Paragraph t={t}>
            {text(
              lang,
              "候选如果缺少 ≥150°C 水热稳定性证据或缺少反应后 PXRD 证据，不能通过高分排序进入最终推荐。",
              "Candidates missing >=150°C hydrothermal stability evidence or post-treatment PXRD evidence cannot enter final recommendation through high-score ranking."
            )}
          </Paragraph>
        </Section>

        <Section id="methodology-oafs-stage2" title="3. Stage 2: Dopant Metal Recommendation" t={t}>
          <Chips rows={["Mo", "W", "V", "Ti", "Zr", "Fe", "Cu", "Co", "Ni", "Mn", "Ce", "Ru", "Pd", "Ag"]} t={t} />
          <BlockFormula
            t={t}
            math={"\\text{DMRS}=\\alpha V_{\\text{active-site}}+\\beta F_{\\text{mechanism}}+\\gamma S_{\\text{aqueous}}+\\delta E_{\\text{support}}-\\lambda R_{\\text{leaching/aggregation}}"}
            fallback={"DMRS = alpha V_active-site + beta F_mechanism + gamma S_aqueous + delta E_support - lambda R_leaching/aggregation"}
          />
          <BlockFormula
            t={t}
            math={"F_{\\text{mechanism}}=\\max(F_{\\text{node-substitution}},F_{\\text{defect-anchoring}},F_{\\text{pore-confinement}})"}
            fallback={"F_mechanism = max(F_node-substitution, F_defect-anchoring, F_pore-confinement)"}
          />
          <Paragraph t={t}>
            {text(
              lang,
              "模型不默认假设 Mo 直接取代 Al³⁺ 节点，而是分别评估节点取代、缺陷锚定和孔道限域三种路径。在当前假设中，Mo 更可能以缺陷锚定 Mo-oxo 或孔道限域 MoOx-like 物种形式存在。",
              "Mo is not assumed to directly substitute Al³⁺ nodes. The model evaluates node substitution, defect anchoring, and pore confinement separately. In the current hypothesis, Mo is more likely to appear as defect-anchored Mo-oxo or pore-confined MoOx-like species."
            )}
          </Paragraph>
        </Section>

        <Section id="methodology-oafs-critic-ahp" title="4. CRITIC + AHP Weighting" t={t}>
          <Paragraph t={t}>
            {text(
              lang,
              "Pure CRITIC is not used alone because it may underestimate chemically important descriptors with low variance.",
              "Pure CRITIC is not used alone because it may underestimate chemically important descriptors with low variance."
            )}
          </Paragraph>
          <BlockFormula
            t={t}
            math={"w_i^{\\text{final}}=\\eta w_i^{\\text{CRITIC}}+(1-\\eta)w_i^{\\text{AHP}}"}
            fallback={"w_i_final = eta w_i_CRITIC + (1-eta) w_i_AHP"}
          />
          <Chips rows={["η = 0.5", "minimum chemical descriptor weight = 0.05"]} t={t} />
        </Section>

        <Section id="methodology-oafs-sensitivity" title="5. Sensitivity Analysis" t={t}>
          <Chips rows={["1000 Monte Carlo weight perturbations", "±20% perturbation range", "Mo Top 3 probability >85% required for robust recommendation", "Top 1 probability", "Top 3 probability", "Mean rank", "Rank standard deviation"]} t={t} />
        </Section>

        <Section id="methodology-oafs-blind-baseline" title="6. Blind Baseline" t={t}>
          <Paragraph t={t}>
            {text(
              lang,
              "Ru/Pd/Ag are included as blind baseline metals. The purpose is to test whether the scoring model has negative predictive power and is not only tuned to promote Mo.",
              "Ru/Pd/Ag are included as blind baseline metals. The purpose is to test whether the scoring model has negative predictive power and is not only tuned to promote Mo."
            )}
          </Paragraph>
          <Paragraph t={t}>
            {text(
              lang,
              "Negative evidence must be supported by literature or marked as evidence pending. No fake DOI is allowed.",
              "Negative evidence must be supported by literature or marked as evidence pending. No fake DOI is allowed."
            )}
          </Paragraph>
        </Section>

        <Section id="methodology-oafs-exafs" title="7. EXAFS Prediction and Falsification" t={t}>
          <Paragraph t={t}>
            {text(
              lang,
              "If defect-anchored Mo-oxo is correct, post-reaction Mo K-edge EXAFS should show: 1. dominant Mo–O shell at approximately 1.7–1.9 Å; 2. weak Mo–O–Al or Mo–O–C scattering path; 3. absent or very weak Mo–Mo scattering at approximately 2.5–3.0 Å.",
              "If defect-anchored Mo-oxo is correct, post-reaction Mo K-edge EXAFS should show: 1. dominant Mo–O shell at approximately 1.7–1.9 Å; 2. weak Mo–O–Al or Mo–O–C scattering path; 3. absent or very weak Mo–Mo scattering at approximately 2.5–3.0 Å."
            )}
          </Paragraph>
          <Chips rows={["Strong Mo-Mo scattering -> MoOx aggregation", "High Mo concentration in filtrate -> leaching", "Loss of framework PXRD -> Al-MOF collapse"]} t={t} />
        </Section>

        <Section id="methodology-oafs-controls" title="8. Experimental Validation Controls" t={t}>
          <Chips rows={["Pure Al-MOF", "Mo-anchored Al-MOF", "Al-MOF + MoOx physical mixture", "MoOx alone", "Blank reaction"]} t={t} />
          <Paragraph t={t}>
            {text(
              lang,
              "目的：区分 Mo 锚定协同效应、游离 MoOx 杂质贡献、Al-MOF 单独活性和无催化背景反应。",
              "Purpose: distinguish Mo anchoring synergy, free MoOx impurity contribution, Al-MOF-only activity, and background reaction without catalyst."
            )}
          </Paragraph>
        </Section>

        <Section id="methodology-oafs-limitations" title="9. Limitations and Reproducibility" t={t}>
          <Paragraph t={t}>
            {text(
              lang,
              "当前模型聚焦过渡金属掺杂路径，暂未覆盖非金属配体掺杂、单原子催化剂和配体杂原子工程。当前 OACS/DMRS 基于静态描述符、文献代理指标和证据可信度，不等同于实际转化率预测。当前模型需要后续 DFT、EXAFS 和同条件实验验证。",
              "The current model focuses on transition-metal dopant paths and does not yet cover non-metal ligand doping, single-atom catalysts, or ligand heteroatom engineering. OACS/DMRS are based on static descriptors, literature proxies, and evidence confidence; they are not actual conversion-rate predictions. Follow-up DFT, EXAFS, and same-condition experiments are required."
            )}
          </Paragraph>
          <Paragraph t={t}>
            {text(
              lang,
              "为确保本筛选流程可复现，项目将在发布时公开描述符字典、CRITIC+AHP 组合赋权配置文件、水热稳定性硬阈值规则、掺杂金属属性矩阵、盲测基线金属列表以及蒙特卡洛敏感性分析脚本。所有候选材料的筛选决策均保留字段级溯源信息，包括来源数据库、记录 ID、描述符来源、整理状态和证据可信度。",
              "To ensure full reproducibility, the descriptor dictionary, CRITIC+AHP weighting configuration files, hydrothermal hard-gate rules, dopant-metal property matrix, blind-baseline metal list, and Monte Carlo sensitivity analysis scripts will be made publicly available upon publication or project release. All candidate-level decisions retain field-level provenance, including source database, record ID, descriptor origin, curation status, and evidence confidence."
            )}
          </Paragraph>
        </Section>
      </div>
    </details>
  )
}
