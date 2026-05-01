import {
  useT, useLang, useViewport,
  zhText, FONT_MONO,
  BasisBadge, SectionTitle, Callout, PageHeader,
} from "../../shared"

function MethodFormula({ title, formula, note, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
      <div style={{ color: t.accentText, fontSize: 12, fontFamily: FONT_MONO, lineHeight: 1.65, marginTop: 9 }}>{formula}</div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, marginTop: 9 }}>{note}</div>
    </div>
  )
}

export function MethodsLimitationsTab() {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()

  const sectionCard = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: 18,
  }
  const bodyText = { color: t.muted, fontSize: 12, lineHeight: 1.7 }
  const statusPill = (tone) => {
    const palette = {
      stable:  { bg: t.badgeCalcBg,   color: t.badgeCalcText,   border: t.validationAccent },
      beta:    { bg: t.badgeWarnBg,   color: t.badgeWarnText,   border: t.warn },
      planned: { bg: t.badgeProxyBg,  color: t.badgeProxyText,  border: t.sensitivityAccent },
      limited: { bg: t.badgeDangerBg, color: t.badgeDangerText, border: t.danger },
    }[tone]
    return {
      display: "inline-flex", alignItems: "center",
      border: `1px solid ${palette.border}`,
      background: palette.bg, color: palette.color,
      borderRadius: 4, padding: "2px 7px",
      fontSize: 10, fontWeight: 700, letterSpacing: 0, whiteSpace: "nowrap",
    }
  }
  const rowStyle = {
    display: "grid", gridTemplateColumns: "150px 1fr",
    gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.divider}`,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={lang === "zh" ? "方法学" : "Methodology"}
        subtitle={lang === "zh"
          ? "说明 ecomof 的数据来源、任务评分规则、证据等级、限制和免责声明。平台输出是候选优先级，不替代实验验证。"
          : "Data sources, task scoring rules, evidence levels, limitations, and disclaimers. Platform outputs are candidate priorities, not replacements for experimental validation."}
        meta={lang === "zh" ? "数据来源 · 评分规则 · 证据等级 · 限制 · 免责声明" : "Data sources · scoring rules · evidence levels · limits · disclaimer"}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "候选优先级" : "candidate priority"}</BasisBadge>}
      />
      <Callout tone="warn">
        <strong>{c.methods.noticeTitle}</strong> {c.methods.noticeBody}
      </Callout>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "平台做什么 / What this platform does" : "What this platform does"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
          {(lang === "zh" ? [
            ["早期候选筛选", "把吸附、稳定性、可持续性、任务适配和证据等级组织成候选优先级，支持 Early-stage Screening 和假设生成。", "info"],
            ["任务导向应用探索", "Performance、EcoScreen 和 CatalysisLab 共用可解释结果卡片，帮助科研合作讨论下一步验证。", "proxy"],
            ["决策支持", "输出 candidate priority、potential 和 needs validation，不替代实验、GCMC、严格 IAST 或完整工业 LCA。", "warn"],
          ] : [
            ["Early-stage candidate screening", "Organizes adsorption, stability, sustainability, application fit, and Evidence Level into candidate priority for hypothesis generation.", "info"],
            ["Task-oriented application exploration", "Performance, EcoScreen, and CatalysisLab share explainable result cards for research-collaboration discussion.", "proxy"],
            ["Decision support", "Outputs candidate priority, potential, and needs validation; it does not replace experiments, GCMC, strict IAST, or full industrial LCA.", "warn"],
          ]).map(([title, body, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={tone}>{title}</BasisBadge>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "数据契约与描述符含义" : "Data contracts and descriptor meaning"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 10 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginBottom: 8 }}>{lang === "zh" ? "数据契约" : "Data contracts"}</div>
            <div style={bodyText}>
              {lang === "zh"
                ? "MOF 数据至少应保留 id、name、formula、source、metalNodes、linker、topology、poreSizeA、surfaceArea、poreVolume、co2Uptake、bandGap、stability、cost/toxicity、reactionClasses、activeSiteHypothesis、Evidence Level 和 limitations。demo / placeholder 记录必须清楚标注。"
                : "MOF records should retain id, name, formula, source, metalNodes, linker, topology, poreSizeA, surfaceArea, poreVolume, co2Uptake, bandGap, stability, cost/toxicity, reactionClasses, activeSiteHypothesis, Evidence Level, and limitations. Demo / placeholder records must be clearly marked."}
            </div>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginBottom: 8 }}>{lang === "zh" ? "描述符含义" : "Descriptor meaning"}</div>
            <div style={bodyText}>
              {lang === "zh"
                ? "孔径、比表面积、CO2 uptake、band gap、稳定性、成本和毒性字段是筛选描述符；它们只提供候选排序线索。不同任务需要不同权重，字段缺失或来源较弱时必须降低解释强度。"
                : "Pore size, surface area, CO2 uptake, band gap, stability, cost, and toxicity are screening descriptors. They provide candidate-ranking cues only. Different tasks require different weights, and missing or weakly sourced fields should reduce interpretation strength."}
            </div>
          </div>
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "Rule-based scoring model" : "Rule-based scoring model"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 10 }}>
          <MethodFormula
            title="Final Score"
            formula="Final Score = w1 × Performance + w2 × Stability + w3 × Sustainability + w4 × Application Fit + w5 × Evidence Confidence"
            note={lang === "zh" ? "统一候选优先级公式；权重是可审计的 rule-based 配置，不是训练后真实模型参数。" : "Unified candidate-priority formula. Weights are auditable rule-based settings, not trained real-model parameters."}
            t={t}
          />
          <MethodFormula
            title="Catalysis Potential Score"
            formula="Catalysis Potential Score = w1 × CO₂ Affinity + w2 × Active Site Potential + w3 × Pore Accessibility + w4 × Stability + w5 × Electronic Property + w6 × Sustainability + w7 × Evidence Confidence"
            note={lang === "zh" ? "CatalysisLab 使用该公式进行候选优先级筛选；分数不代表最终转化率、选择性或 TOF。" : "CatalysisLab uses this formula for candidate prioritization. The score is not final conversion, selectivity, or TOF."}
            t={t}
          />
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "Evidence Level" : "Evidence levels"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
          {(lang === "zh" ? [
            ["High", "多来源一致且任务相关；仍需要目标反应验证。"],
            ["Medium", "有部分文献、描述符或结构证据；适合候选排序。"],
            ["Low-medium", "有少量描述符支持，但任务证据有限；只用于假设生成。"],
            ["Low", "主要是推断或占位；不能作为结论。"],
          ] : [
            ["High", "Multiple consistent and task-relevant sources; target-reaction validation is still needed."],
            ["Medium", "Partial literature, descriptor, or structural evidence; suitable for candidate ranking."],
            ["Low-medium", "Some descriptor support but limited task evidence; hypothesis generation only."],
            ["Low", "Mostly inferred or placeholder support; not a conclusion."],
          ]).map(([level, body]) => (
            <div key={level} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={level === "High" ? "calc" : level === "Medium" ? "info" : "proxy"}>{level}</BasisBadge>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "ML evaluation 占位模块" : "ML evaluation placeholder"}</SectionTitle>
        <Callout tone="info">
          {lang === "zh"
            ? "Demo only / Placeholder：当前没有真实标签数据时，不显示真实 R²、MAE 或 RMSE。下列模块只是未来评估计划。"
            : "Demo only / Placeholder: without labeled data, the platform does not show real R², MAE, or RMSE. The items below are future evaluation plans."}
        </Callout>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
          {["Predicted vs Actual", "Residual Plot", "Feature Importance", "R² / MAE / RMSE"].map(item => (
            <div key={item} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minHeight: 92 }}>
              <BasisBadge tone="proxy">Demo only / Placeholder</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 10 }}>{item}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 7 }}>
                {lang === "zh" ? "需要真实实验或文献标签数据后才能启用。" : "Requires labeled experimental or literature data before activation."}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "限制与免责声明" : "Limitations and disclaimer"}</SectionTitle>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {(lang === "zh" ? [
            "结果表示候选优先级，不表示最终材料性能。",
            "催化性能强烈依赖具体反应条件。",
            "可持续性评分不能替代完整工业 LCA。",
            "吸附结果不能替代严格 GCMC 或 IAST。",
            "必须进行实验验证。",
          ] : [
            "Results indicate candidate priority, not final material performance.",
            "Catalytic performance depends strongly on reaction conditions.",
            "Sustainability scores do not replace full industrial LCA.",
            "Adsorption results do not replace rigorous GCMC or IAST.",
            "Experimental validation is required.",
          ]).map(item => (
            <div key={item} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "任务导向评分框架" : "Task-oriented scoring framework"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {(lang === "zh" ? [
            ["数据来源", "结构库、描述符、吸附标签、LCA 代理清单和催化模拟数据分层展示；来源字段必须保留。", "info"],
            ["评分规则", "EcoScreen 聚合环境负担与可行性代理；CatalysisLab 聚合任务适配、活性位点线索和证据等级。", "proxy"],
            ["证据等级", "高/中/低证据只描述来源强弱和验证状态，不代表结果已经被证实。", "calc"],
            ["免责声明", "输出是候选优先级；任何论文、专利或工程决策前都需要实验与独立验证。", "warn"],
          ] : [
            ["Data sources", "Structure libraries, descriptors, adsorption labels, LCA proxies, and catalysis mock data are separated; source fields must remain visible.", "info"],
            ["Scoring rules", "EcoScreen aggregates burden and feasibility proxies; CatalysisLab aggregates task fit, active-site cues, and evidence level.", "proxy"],
            ["Evidence levels", "High/medium/low evidence describes source strength and validation state; it does not certify results.", "calc"],
            ["Disclaimer", "Outputs are candidate priorities; papers, patents, and engineering decisions require experimental and independent validation.", "warn"],
          ]).map(([title, body, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={tone}>{title}</BasisBadge>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.65, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div className="content-card" style={sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>
              {lang === "zh" ? "项目范围、实现状态与限制" : "Scope, Implementation Status, and Limits"}
            </h1>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 860 }}>
              {lang === "zh"
                ? "EcoMOF-AI 的定位是科研早期筛选与决策支持工具：把吸附性能、热力学解释、LCA/LCC 和敏感性分析放在同一条判断链中。当前版本适合形成候选材料假设，不应被包装成已经完成真实数据库、严格 IAST 或工业级 LCA 的系统。"
                : "EcoMOF-AI is an early-stage research screening and decision-support tool: adsorption performance, thermodynamic interpretation, LCA/LCC, and sensitivity analysis are presented as one decision chain. The current version is suitable for generating candidate hypotheses, not for claiming a completed real-database, strict-IAST, or industrial-LCA system."}
            </p>
          </div>
          <BasisBadge tone="proxy">{lang === "zh" ? "筛选级原型" : "screening prototype"}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {(lang === "zh" ? [
            ["项目范围", "输入 MOF 结构参数与条件，输出吸附、解释、环境、成本和稳健性判断。"],
            ["已实现", "搜索预设、算法状态标注、Qst 测试版、LCA/LCC 代理、敏感性、验证和数据来源页。"],
            ["非论文级", "真实大规模标签库、严格混合气 IAST、工业 LCI、供应商报价和科研级 Qst 仍未完成。"],
            ["引用建议", "引用本工具时，应同时引用真实数据源；代理或种子数据只应作为方法演示。"],
          ] : [
            ["Scope", "Input MOF descriptors and conditions; output adsorption, interpretation, impact, cost, and robustness signals."],
            ["Implemented", "Search presets, algorithm-status labels, Qst beta, LCA/LCC proxies, sensitivity, validation, and provenance pages."],
            ["Not publication-grade", "Large real label libraries, strict mixture IAST, industrial LCI, supplier quotes, and research-grade Qst are not complete."],
            ["Citation", "When citing the tool, cite the real data sources separately; proxy or seed data should be treated as method demonstration."],
          ]).map(([title, body]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow interpretation */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "如何解读这个工作流" : "How to interpret the workflow"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 10 }}>
          {(lang === "zh" ? [
            ["发现阶段化学", "性能、稳定性、机理和结构-性质理解是第一优先级。", "主要筛选"],
            ["可行性边界", "粗略成本、可得性和实际约束用于排除明显不可行路线。", "可行性边界"],
            ["工程阶段评估", "正式 LCA/LCC、工艺路线设计和放大经济性属于未来工程阶段。", "未来工程评估"],
          ] : [
            ["Discovery-stage chemistry", "Performance, stability, mechanism, and structure-property understanding come first.", "Primary screening"],
            ["Feasibility boundaries", "Rough cost, availability, and practical constraints act as coarse boundaries.", "Feasibility boundary"],
            ["Engineering-stage evaluation", "Formal LCA/LCC, process-route design, and scale-up economics belong to future engineering work.", "Future engineering evaluation"],
          ]).map(([title, body, chip]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone={chip.includes("未来") || chip.includes("Future") ? "user" : chip.includes("可行性") || chip.includes("Feasibility") ? "proxy" : "info"}>{chip}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850, marginTop: 10 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selectivity + ML status */}
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 14 }}>
        <div className="content-card" style={sectionCard}>
          <SectionTitle>{c.methods.selectivity}</SectionTitle>
          <div style={bodyText}>{c.methods.selectivityBody1}</div>
          <div style={{ margin: "14px 0", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
            padding: "12px 14px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14 }}>
            S(A/B) = q_A / q_B x interaction correction
          </div>
          <div style={bodyText}>{c.methods.selectivityBody2}</div>
        </div>

        <div className="content-card" style={sectionCard}>
          <SectionTitle>{c.methods.mlStatus}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(lang === "zh" ? [
              ["集成模型", "浏览器端独立模型配置文件，含透明权重与验证指标；不是后端训练模型检查点。", "beta"],
              ["随机森林", "已与集成模型使用不同权重/误差指标，切换会改变结果；仍属于前端静态模型配置。", "beta"],
              ["XGBoost / GBM", "已加入独立配置文件；真实版本需要保存训练好的模型工件。", "beta"],
              ["图神经网络", "已加入 GNN 配置入口；科研级版本需要 CIF 图特征和真实吸附标签训练。", "planned"],
            ] : [
              ["Ensemble", "Browser-side independent model profile with transparent weights and validation metrics; not a backend model checkpoint.", "beta"],
              ["Random Forest", "Uses different weights/metrics from Ensemble and changes the prediction; still a static front-end profile.", "beta"],
              ["XGBoost / GBM", "Independent profile added; a real version needs trained model artifacts.", "beta"],
              ["Graph Neural Net", "GNN entry added; research-grade use needs CIF graph features and real adsorption labels.", "planned"],
            ]).map(([name, desc, tone]) => (
              <div key={name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{name}</span>
                  <span style={statusPill(tone)}>{lang === "zh" ? zhText(lang, tone) : tone.toUpperCase()}</span>
                </div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulas */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{c.methods.formulas}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {[
            [c.methods.formulaApparent, "S = q_A / q_B",                  c.methods.formulaApparentBody],
            [c.methods.formulaHenry,   "S_H = K_H,A / K_H,B",             c.methods.formulaHenryBody],
            [c.methods.formulaIast,    "S = (x_A/y_A) / (x_B/y_B)",       c.methods.formulaIastBody],
            [c.methods.formulaQst,     "Qst = -R x d(ln P) / d(1/T)",     c.methods.formulaQstBody],
          ].map(([title, formula, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ color: t.accentText, fontSize: 12, fontFamily: FONT_MONO, marginBottom: 8 }}>{formula}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "系统化术语提示" : "Systematic Tooltip Glossary"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10 }}>
          {(lang === "zh" ? [
            ["PLD", "孔限制直径，决定可进入分子的最窄窗口。"],
            ["LCD", "最大孔腔直径，描述可容纳分子的最大孔腔。"],
            ["Henry", "低压极限吸附常数，常用于稀释条件选择性。"],
            ["IAST", "由单组分等温线估算混合气吸附平衡的方法。"],
            ["Qst", "等量吸附热，用来解释吸附强度和机理。"],
            ["GWP", "全球变暖潜势，LCA 特征化指标之一。"],
            ["归一化", "把不同环境指标拉到可比较尺度，不等于权重化。"],
            ["LCC", "生命周期成本，经济指标，不是环境影响。"],
            ["适用域", "判断当前输入是否落在训练/基准分布附近。"],
            ["代理", "代理估算，表示方向性参考而非真实清单或实验结果。"],
          ] : [
            ["PLD", "Pore limiting diameter, the narrowest accessible window."],
            ["LCD", "Largest cavity diameter, the largest pore cavity scale."],
            ["Henry", "Low-pressure adsorption constant used for dilute selectivity."],
            ["IAST", "Mixture-equilibrium estimate from pure-component isotherms."],
            ["Qst", "Isosteric heat of adsorption, used to interpret binding strength."],
            ["GWP", "Global warming potential, one LCA characterization category."],
            ["Normalization", "Makes impact categories comparable; it is not weighting."],
            ["LCC", "Life cycle costing, an economic metric separate from LCA."],
            ["Applicability", "Checks whether inputs sit near the benchmark/training domain."],
            ["Proxy", "A directional estimate rather than a real inventory or experiment."],
          ]).map(([term, desc]) => (
            <div key={term} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{term}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ML pipeline */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{c.methods.pipeline}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10 }}>
          {[
            [c.methods.pipelineStructure,    c.methods.pipelineStructureBody],
            [c.methods.pipelineDescriptors,  c.methods.pipelineDescriptorsBody],
            [c.methods.pipelineLabels,       c.methods.pipelineLabelsBody],
            [c.methods.pipelineModels,       c.methods.pipelineModelsBody],
            [c.methods.pipelineUncertainty,  c.methods.pipelineUncertaintyBody],
          ].map(([title, desc], i) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.success, fontSize: 11, fontWeight: 800, marginBottom: 6, fontFamily: FONT_MONO }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicability */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{c.methods.applicability}</SectionTitle>
        <div style={bodyText}>{c.methods.applicabilityBody}</div>
      </div>

      {/* Databases */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{c.methods.database}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {(lang === "zh" ? [
            ["CoRE MOF 2019", "当前用于常见 MOF 名称、结构范围和文献示例的参考集。", "stable"],
            ["CoRE MOF 2024", "计划作为更新的可计算实验 MOF 结构来源。", "planned"],
            ["QMOF Database", "计划用于 DFT 电子结构描述符；它不是直接的吸附标签数据库。", "planned"],
          ] : [
            ["CoRE MOF 2019", "Current reference set for common MOF names, structural ranges, and literature-style examples.", "stable"],
            ["CoRE MOF 2024", "Planned structure refresh for newer computation-ready experimental MOFs.", "planned"],
            ["QMOF Database", "Planned source for DFT-derived electronic descriptors; not a direct adsorption-label database.", "planned"],
          ]).map(([title, desc, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{title}</span>
                <span style={statusPill(tone)}>{lang === "zh" ? zhText(lang, tone) : tone.toUpperCase()}</span>
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ ...bodyText, marginTop: 12 }}>{c.methods.dbNote}</div>
      </div>

      {/* Beta features + Roadmap */}
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div className="content-card" style={sectionCard}>
          <SectionTitle>{c.methods.beta}</SectionTitle>
          {(lang === "zh" ? [
            ["CH4/N2 与 C2H4/C2H6", "作为第一阶段筛选启用，因为公开计算数据覆盖相对更现实。"],
            ["C2H2/CO2 异常标注", "对强 CO2 结合化学环境标注反常选择性风险；尚不是完整机理模型。"],
            ["H2 体系", "仅为经典近似；尚未实现量子扩散和低温修正。"],
            ["Qst 模块", "由预测的多温等温线计算；适合作机理参考，不是最终热力学证据。"],
          ] : [
            ["CH4/N2 and C2H4/C2H6", "Enabled for first-pass screening because public computational coverage is comparatively more realistic."],
            ["C2H2/CO2 anomaly flag", "Flags inverse-selectivity risk for strong CO2-binding chemistry; not yet a full mechanistic model."],
            ["H2 systems", "Classical approximation only; quantum diffusion and low-temperature corrections are not implemented."],
            ["Qst module", "Calculated from predicted multi-temperature isotherms; use as mechanistic guidance, not final thermodynamic evidence."],
          ]).map(([k, v], i, arr) => (
            <div key={k} style={{ ...rowStyle, borderBottom: i === arr.length - 1 ? "none" : rowStyle.borderBottom }}>
              <div style={{ color: t.danger, fontSize: 12, fontWeight: 700 }}>{k}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="content-card" style={sectionCard}>
          <SectionTitle>{c.methods.roadmap}</SectionTitle>
          {(lang === "zh" ? [
            ["v0.2", "可用性修复：MOF 搜索预设、直接数字输入、主题切换、清晰状态说明。"],
            ["v0.3", "方法说明页、更清晰的选择性命名、CSV schema、扩展连接体和官能团元数据。"],
            ["v1.0", "真实单组分等温线拟合，以及明确的 Henry/IAST 选择性流程。"],
            ["v1.1", "按目标气体对分别训练模型，刷新 CoRE 2024/QMOF 描述符，引入不确定性和适用域警告。"],
            ["长期", "在可靠标签可得后，扩展电子特气分离和 H2 量子修正。"],
          ] : [
            ["v0.2", "Usability fixes: MOF search presets, direct numeric inputs, theme toggle, and clear status notes."],
            ["v0.3", "Methods page, clearer selectivity naming, CSV schema, expanded linker and functional-group metadata."],
            ["v1.0", "Real single-component isotherm fitting and explicit Henry/IAST selectivity workflow."],
            ["v1.1", "Separate trained models per target gas pair, CoRE 2024/QMOF descriptor refresh, uncertainty and applicability-domain warnings."],
            ["Long term", "Electronic specialty gas separations and hydrogen-specific quantum corrections when reliable labels are available."],
          ]).map(([k, v], i, arr) => (
            <div key={k} style={{ ...rowStyle, gridTemplateColumns: "90px 1fr", borderBottom: i === arr.length - 1 ? "none" : rowStyle.borderBottom }}>
              <div style={{ color: t.success, fontSize: 12, fontWeight: 800, fontFamily: "monospace" }}>{k}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="content-card" style={sectionCard}>
        <SectionTitle>{c.methods.limits}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {(lang === "zh" ? [
            ["不保证合成可行性", "尚未检查所选金属/配体组合在实验上是否合理。"],
            ["严格 IAST 仍为代理", "已显示 Henry/IAST 筛选代理，但尚未从真实单组分等温线运行严格混合热力学。"],
            ["CIF 解析有限", "可读取部分晶胞与描述符标签；完整 PLD/LCD/ASA 仍应由 Zeo++/RASPA 等后端管线计算。"],
            ["无真实云同步", "当前为 localStorage + JSON 备份导入；账号、权限和云端同步需要后端。"],
          ] : [
            ["No guaranteed synthetic feasibility", "Does not yet check whether a proposed linker/metal combination is experimentally reasonable."],
            ["Strict IAST is still a proxy", "Henry/IAST screening proxies are displayed, but rigorous mixture thermodynamics from real pure-component isotherms is not implemented."],
            ["Limited CIF parsing", "The UI reads selected cell/descriptor tags; full PLD/LCD/ASA should come from a Zeo++/RASPA-style backend pipeline."],
            ["No real cloud sync", "Current storage is localStorage plus JSON backup/import; accounts, permissions, and sync need a backend."],
          ]).map(([title, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.danger}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.danger, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Acknowledgement + Contact */}
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div className="content-card" style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "致谢" : "Acknowledgement"}</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800 }}>
              {lang === "zh" ? "Happy Flight — 研究导师" : "Happy Flight — Research mentor"}
            </div>
            <BasisBadge tone="info">{lang === "zh" ? "亦师亦友" : "mentor & friend"}</BasisBadge>
          </div>
          <div style={bodyText}>
            {lang === "zh"
              ? "特别感谢 Happy Flight。TA 在这个项目从早期想法、研究定位到功能取舍的过程中持续给予指导、提醒和鼓励；既像导师一样帮助我把问题想深，也像朋友一样陪我把项目一步步推进。EcoMOF-AI 后续对科研严谨性、LCA/LCC 决策链和方法透明性的重视，都受到了这份指导的影响。"
              : "Special thanks to Happy Flight, whose guidance shaped this project from early concept to research positioning and feature priorities. Happy Flight has been both a mentor and a friend: helping push the scientific questions deeper while supporting the steady development of EcoMOF-AI. The platform's emphasis on methodological transparency, LCA/LCC decision support, and research rigor is strongly influenced by this guidance."}
          </div>
        </div>

        <div className="content-card" style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "联系开发者" : "Contact Developer"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
            {lang === "zh"
              ? "如果你希望反馈数据来源、方法假设、MOF 结构/等温线标签，或讨论后续合作与功能改进，可以通过邮件联系开发者。"
              : "For feedback on data provenance, method assumptions, MOF structures, isotherm labels, collaboration, or feature improvements, contact the developer by email."}
          </div>
          <a href="mailto:square.hwh@gmail.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.surface,
              border: `1px solid ${t.borderStrong}`, borderRadius: 8, padding: "10px 12px",
              color: t.accentText, textDecoration: "none", fontSize: 13, fontWeight: 800, fontFamily: FONT_MONO }}>
            square.hwh@gmail.com
          </a>
          <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 12 }}>
            {lang === "zh"
              ? "建议邮件中附上：材料名称、气体体系、温度/压力、数据来源 DOI 或文件，以及希望工具输出的具体判断。"
              : "Useful context: material name, gas pair, temperature/pressure, DOI or file source, and the specific decision output you need."}
          </div>
        </div>
      </div>
    </div>
  )
}
