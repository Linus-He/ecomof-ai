import {
  useT, useLang, useViewport,
  zhText, FONT_MONO,
  BasisBadge, SectionTitle, Callout,
} from "../../shared"

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
      <Callout tone="warn">
        <strong>{c.methods.noticeTitle}</strong> {c.methods.noticeBody}
      </Callout>

      {/* Overview */}
      <div style={sectionCard}>
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
      <div style={sectionCard}>
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
        <div style={sectionCard}>
          <SectionTitle>{c.methods.selectivity}</SectionTitle>
          <div style={bodyText}>{c.methods.selectivityBody1}</div>
          <div style={{ margin: "14px 0", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
            padding: "12px 14px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14 }}>
            S(A/B) = q_A / q_B x interaction correction
          </div>
          <div style={bodyText}>{c.methods.selectivityBody2}</div>
        </div>

        <div style={sectionCard}>
          <SectionTitle>{c.methods.mlStatus}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(lang === "zh" ? [
              ["集成模型", "浏览器端独立模型配置文件，含透明权重与验证指标；不是后端训练 checkpoint。", "beta"],
              ["随机森林", "已与集成模型使用不同权重/误差指标，切换会改变结果；仍属于前端静态模型配置。", "beta"],
              ["XGBoost / GBM", "已加入独立配置文件；真实版本需要保存训练好的模型工件。", "beta"],
              ["图神经网络", "已加入 GNN 配置入口；科研级版本需要 CIF 图特征和真实吸附标签训练。", "planned"],
            ] : [
              ["Ensemble", "Browser-side independent model profile with transparent weights and validation metrics; not a backend checkpoint.", "beta"],
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
      <div style={sectionCard}>
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
              <div style={{ color: t.accentSoft, fontSize: 12, fontFamily: FONT_MONO, marginBottom: 8 }}>{formula}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div style={sectionCard}>
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
              <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{term}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ML pipeline */}
      <div style={sectionCard}>
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
      <div style={sectionCard}>
        <SectionTitle>{c.methods.applicability}</SectionTitle>
        <div style={bodyText}>{c.methods.applicabilityBody}</div>
      </div>

      {/* Databases */}
      <div style={sectionCard}>
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
        <div style={sectionCard}>
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
              <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 700 }}>{k}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={sectionCard}>
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
      <div style={sectionCard}>
        <SectionTitle>{c.methods.limits}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {(lang === "zh" ? [
            ["不保证合成可行性", "尚未检查所选金属/配体组合在实验上是否合理。"],
            ["严格 IAST 仍为代理", "已显示 Henry/IAST screening proxy，但尚未从真实单组分等温线运行严格混合热力学。"],
            ["CIF 解析有限", "可读取部分 cell 与描述符 tag；完整 PLD/LCD/ASA 仍应由 Zeo++/RASPA 等后端管线计算。"],
            ["无真实云同步", "当前为 localStorage + JSON 备份导入；账号、权限和云端同步需要后端。"],
          ] : [
            ["No guaranteed synthetic feasibility", "Does not yet check whether a proposed linker/metal combination is experimentally reasonable."],
            ["Strict IAST is still a proxy", "Henry/IAST screening proxies are displayed, but rigorous mixture thermodynamics from real pure-component isotherms is not implemented."],
            ["Limited CIF parsing", "The UI reads selected cell/descriptor tags; full PLD/LCD/ASA should come from a Zeo++/RASPA-style backend pipeline."],
            ["No real cloud sync", "Current storage is localStorage plus JSON backup/import; accounts, permissions, and sync need a backend."],
          ]).map(([title, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.warn, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Acknowledgement + Contact */}
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "致谢" : "Acknowledgement"}</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800 }}>Happy Flight</div>
            <BasisBadge tone="info">{lang === "zh" ? "亦师亦友" : "mentor & friend"}</BasisBadge>
          </div>
          <div style={bodyText}>
            {lang === "zh"
              ? "特别感谢 Happy Flight。TA 在这个项目从早期想法、研究定位到功能取舍的过程中持续给予指导、提醒和鼓励；既像导师一样帮助我把问题想深，也像朋友一样陪我把项目一步步推进。EcoMOF-AI 后续对科研严谨性、LCA/LCC 决策链和方法透明性的重视，都受到了这份指导的影响。"
              : "Special thanks to Happy Flight, whose guidance shaped this project from early concept to research positioning and feature priorities. Happy Flight has been both a mentor and a friend: helping push the scientific questions deeper while supporting the steady development of EcoMOF-AI. The platform's emphasis on methodological transparency, LCA/LCC decision support, and research rigor is strongly influenced by this guidance."}
          </div>
        </div>

        <div style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "联系开发者" : "Contact Developer"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
            {lang === "zh"
              ? "如果你希望反馈数据来源、方法假设、MOF 结构/等温线标签，或讨论后续合作与功能改进，可以通过邮件联系开发者。"
              : "For feedback on data provenance, method assumptions, MOF structures, isotherm labels, collaboration, or feature improvements, contact the developer by email."}
          </div>
          <a href="mailto:square.hwh@gmail.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.surface,
              border: `1px solid ${t.borderStrong}`, borderRadius: 8, padding: "10px 12px",
              color: t.accentSoft, textDecoration: "none", fontSize: 13, fontWeight: 800, fontFamily: FONT_MONO }}>
            square.hwh@gmail.com
          </a>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 12 }}>
            {lang === "zh"
              ? "建议邮件中附上：材料名称、气体体系、温度/压力、数据来源 DOI 或文件，以及希望工具输出的具体判断。"
              : "Useful context: material name, gas pair, temperature/pressure, DOI or file source, and the specific decision output you need."}
          </div>
        </div>
      </div>
    </div>
  )
}
