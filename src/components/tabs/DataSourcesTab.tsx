// @ts-nocheck
import { useState, useEffect } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  zhText,
  fetchDataJson,
  BasisBadge, SectionTitle,
} from "../../shared"

export function DataSourcesTab() {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const [datasets, setDatasets] = useState({ structures: [], labels: [], inventory: [], isotherms: [], manifest: null, status: "loading" })
  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_structures.json"),
      fetchDataJson("adsorption_labels.json"),
      fetchDataJson("lca_inventory.json"),
      fetchDataJson("isotherms.json"),
      fetchDataJson("training_manifest.json"),
    ]).then(([structures, labels, inventory, isotherms, manifest]) => {
      if (active) setDatasets({ structures, labels, inventory, isotherms, manifest, status: "loaded" })
    }).catch(() => { if (active) setDatasets(prev => ({ ...prev, status: "fallback" })) })
    return () => { active = false }
  }, [])

  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }
  const connectorRows = lang === "zh" ? [
    ["LCI 后端", "public/data/lca_inventory.json 种子 schema", "带版本活动 ID 的 openLCA / ecoinvent 过程映射", "代理 schema"],
    ["价格后端", "USD 种子值 + 静态货币换算", "供应商报价、带日期试剂价格、区域电价", "筛选级"],
    ["区域因子", "通用电力和溶剂回收假设", "国家/地区电网结构、溶剂回收情景库、水压力因子", "路线图"],
    ["不确定性", "基于代理范围的确定性伪 Monte Carlo", "清单专属分布和校准后的不确定性传播", "测试版"],
    ["审计轨迹", "source_type、source_ref、price_source、assumption、replacement 字段", "DOI / 数据库记录 / 供应商报价附件和修订历史", "脚手架"],
  ] : [
    ["LCI backend", "public/data/lca_inventory.json seed schema", "openLCA / ecoinvent process mapping with versioned activity IDs", "Proxy schema"],
    ["Price backend", "USD seed values + static currency conversion", "supplier quotations, date-stamped reagent prices, regional electricity tariffs", "Screening"],
    ["Regional factors", "generic electricity and solvent-recovery assumptions", "country/region grid mix, solvent recovery scenario library, water-stress factors", "Roadmap"],
    ["Uncertainty", "deterministic pseudo Monte Carlo from proxy ranges", "inventory-specific distributions and calibrated uncertainty propagation", "Beta"],
    ["Audit trail", "source_type, source_ref, price_source, assumption, replacement fields", "DOI / database record / supplier quote attachment and revision history", "Scaffolded"],
  ]
  const datasetCards = lang === "zh" ? [
    ["MOF structures", "MOF 结构库", datasets.structures.length, "public/data/mof_structures.json", "结构、拓扑、PLD/LCD、BET、孔体积、密度、OMS、CIF/source 元数据。", "结构库提供材料描述符，不直接等于吸附标签。", "Stage 1 screening", "benchmark-backed"],
    ["Adsorption labels", "吸附标签库", datasets.labels.length, "public/data/adsorption_labels.json", "气体体系、温度、压力、loading、Henry 常数、选择性、方法与 DOI/source。", "真正训练吸附模型需要这一层，且应替换为验证过的 NIST/GCMC/文献标签。", "Stage 1 screening", "benchmark-backed"],
    ["Linker cost band / availability", "连接体成本带 / 可得性", datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length, "price_usd_per_unit + price_source", "价格以 USD seed values 存储，界面可切换主流货币作静态显示换算。", "不是实时市场报价，也不是供应商询价。", "Stage 2 feasibility", "exploratory"],
    ["Proxy LCA inventory", "代理 LCA 清单", datasets.inventory.length, "public/data/lca_inventory.json", "材料、溶剂、能耗、水、废弃物、价格、单位、不确定性与替换路线。", "当前是入围候选比较代理层，不能替代完整 ecoinvent/openLCA 工业清单。", "Stage 3 shortlist comparison", "assumption-dependent"],
    ["Isotherm points", "等温线点", datasets.isotherms.length, "public/data/isotherms.json", "多温 pressure-loading 点，用于 Langmuir 拟合、Henry、IAST/Qst 工作流打底。", "科研级 Qst 仍需要真实实验或 GCMC 多温纯组分等温线。", "Stage 1 interpretation", "comparative"],
    ["Detailed engineering inventory", "详细工程清单", datasets.manifest?.rows ?? "—", "future openLCA / ecoinvent mapping", "正式工艺路线、供应商价格、区域电网和放大经济性。", "当前尚未实现。", "Future Stage 4", "future engineering-grade"],
  ] : [
    ["MOF structures", "MOF structures", datasets.structures.length, "public/data/mof_structures.json", "Identity, topology, PLD/LCD, BET, pore volume, density, OMS, CIF/source metadata.", "Structure libraries provide descriptors; they are not adsorption labels.", "Stage 1 screening", "benchmark-backed"],
    ["Adsorption labels", "Adsorption labels", datasets.labels.length, "public/data/adsorption_labels.json", "Gas pair, temperature, pressure, loading, Henry constants, selectivity, method, DOI/source.", "Adsorption training depends on this layer and should be replaced with verified NIST/GCMC/literature labels.", "Stage 1 screening", "benchmark-backed"],
    ["Linker cost band / availability", "Linker cost band / availability", datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length, "price_usd_per_unit + price_source", "Prices are stored as USD seed values; the UI supports static display conversion across major currencies.", "Not live market pricing and not supplier quotations.", "Stage 2 feasibility", "exploratory"],
    ["Proxy LCA inventory", "Proxy LCA inventory", datasets.inventory.length, "public/data/lca_inventory.json", "Material, solvent, energy, water, waste, price, unit, uncertainty, and replacement pathway.", "Current values are shortlist-comparison proxies, not a full ecoinvent/openLCA industrial inventory.", "Stage 3 shortlist comparison", "assumption-dependent"],
    ["Isotherm points", "Isotherm points", datasets.isotherms.length, "public/data/isotherms.json", "Multi-temperature pressure-loading points for Langmuir fitting, Henry, IAST/Qst workflow scaffolding.", "Research-grade Qst still requires real experimental or GCMC multi-temperature pure-component isotherms.", "Stage 1 interpretation", "comparative"],
    ["Detailed engineering inventory", "Detailed engineering inventory", datasets.manifest?.rows ?? "—", "future openLCA / ecoinvent mapping", "Formal process routes, supplier prices, regional grids, and scale-up economics.", "Not implemented in the current prototype.", "Future Stage 4", "future engineering-grade"],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{lang === "zh" ? "数据来源与可追溯性" : "Data Sources & Provenance"}</h1>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 820 }}>{lang === "zh" ? "本页把结构库、吸附标签、LCA 清单、LCC 成本假设、等温线和验证清单分开说明。核心原则是：结构库不等于吸附标签，代理清单不等于科研级 inventory。" : "This page separates structures, adsorption labels, LCA inventory, LCC assumptions, isotherms, and validation manifests. The core rule: a structure library is not an adsorption-label library, and proxy inventory is not publication-grade LCI."}</p>
          </div>
          <BasisBadge tone={datasets.status === "loaded" ? "calc" : "proxy"}>{zhText(lang, datasets.status)}</BasisBadge>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {datasetCards.map(([key, title, count, file, body, limit, stage, interpretation]) => (
          <div key={key} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>{title}</div>
              <BasisBadge tone="info">{lang === "zh" ? `${count} 条记录` : `${count} records`}</BasisBadge>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
              <BasisBadge tone={stage.includes("Stage 1") ? "info" : stage.includes("Stage 2") ? "proxy" : stage.includes("Future") ? "user" : "calc"}>{zhText(lang, stage)}</BasisBadge>
              <BasisBadge tone={interpretation.includes("assumption") || interpretation.includes("exploratory") ? "proxy" : interpretation.includes("future") ? "user" : "calc"}>{zhText(lang, interpretation)}</BasisBadge>
            </div>
            <div style={{ color: t.accentText, fontSize: 11, fontFamily: FONT_MONO, overflowWrap: "anywhere", marginBottom: 9 }}>{file}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{body}</div>
            <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>{limit}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "0.9fr 1.1fr", gap: 12 }}>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "数据质量分级" : "Data Quality Levels"}</SectionTitle>
          <div style={{ display: "grid", gap: 9 }}>
            {(lang === "zh" ? [["0 级","界面种子数据 / 代理","用于演示 schema 和交互，不可作为科研结论。"],["1 级","文献可追溯","有 DOI/source，但可能单位、条件或清洗流程未完全统一。"],["2 级","可复现计算","CIF、描述符、GCMC/IAST 脚本和参数可复现。"],["3 级","论文级","外部测试集、误差、不确定性、适用域和版本化数据全部可追溯。"]] : [["Level 0","UI seed / proxy","Schema and interaction demonstration; not scientific evidence."],["Level 1","Literature traceable","DOI/source exists, but units, conditions, or cleaning may not be fully harmonized."],["Level 2","Reproducible computed","CIFs, descriptors, GCMC/IAST scripts, and parameters are reproducible."],["Level 3","Publication-ready","External test set, errors, uncertainty, applicability domain, and versioned data are traceable."]]).map(([level, label, body]) => (
              <div key={level} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <strong style={{ color: t.textStrong, fontSize: 12 }}>{level}</strong>
                  <BasisBadge tone={level.includes("0") ? "proxy" : level.includes("3") || level.includes("Level 3") ? "calc" : "info"}>{label}</BasisBadge>
                </div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "覆盖表与替换路线" : "Coverage Table & Replacement Path"}</SectionTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {(lang === "zh" ? ["数据层","当前覆盖","质量等级","下一步替换"] : ["Layer","Current coverage","Quality","Next replacement"]).map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lang === "zh" ? [
                  ["结构", `${datasets.structures.length || "种子"} 条`, "0-1 级", "导入 CoRE 2019/2024 CIF，统一 Zeo++ 描述符。"],
                  ["吸附标签", `${datasets.labels.length || "种子"} 条`, "0-1 级", "收集 NIST/文献/GCMC 等温线、Henry 和 IAST 标签。"],
                  ["LCA 清单", `${datasets.inventory.length || "种子"} 条`, "0 级", "替换为 ecoinvent/openLCA 或论文可追溯清单。"],
                  ["LCC 价格", `${datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length || "种子"} 条`, "0 级", "替换为供应商报价、价格数据库或明确日期的市场价。"],
                  ["验证", `${datasets.manifest?.rows ?? "种子"} 行`, "0-1 级", "建立冻结外部测试集和版本化指标。"],
                ] : [
                  ["Structures", `${datasets.structures.length || "seed"} records`, "Level 0-1", "Import CoRE 2019/2024 CIFs and unified Zeo++ descriptors."],
                  ["Adsorption labels", `${datasets.labels.length || "seed"} records`, "Level 0-1", "Collect NIST/literature/GCMC isotherms, Henry constants, and IAST labels."],
                  ["LCA inventory", `${datasets.inventory.length || "seed"} records`, "Level 0", "Replace with ecoinvent/openLCA or literature-traceable LCI."],
                  ["LCC prices", `${datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length || "seed"} records`, "Level 0", "Replace with supplier quotations, price databases, or date-stamped market prices."],
                  ["Validation", `${datasets.manifest?.rows ?? "seed"} rows`, "Level 0-1", "Build a frozen external test set and versioned metrics."],
                ]).map(row => (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {row.map((cell, index) => (
                      <td key={index} style={{ padding: "8px 10px", color: index === 0 ? t.textStrong : index === 2 ? t.warn : t.muted, lineHeight: 1.45 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "清单 / 价格接入路线图" : "Inventory / Price Connector Roadmap"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{lang === "zh" ? "第三优先级先把数据结构、字段和替换路线做清楚；当前页面不声称已经接入完整 ecoinvent、openLCA 或实时价格数据库。" : "Third-priority work clarifies the data structure, fields, and replacement path."}</div>
          </div>
          <BasisBadge tone="proxy">{lang === "zh" ? "接入脚手架" : "connector scaffold"}</BasisBadge>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {(lang === "zh" ? ["模块","当前实现","科研级替换","状态"] : ["Connector","Current implementation","Research-grade replacement","Status"]).map(h => (
                  <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {connectorRows.map(row => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "8px 10px", color: t.textStrong, fontWeight: 800 }}>{row[0]}</td>
                  <td style={{ padding: "8px 10px", color: t.muted, lineHeight: 1.45 }}>{row[1]}</td>
                  <td style={{ padding: "8px 10px", color: t.subtle, lineHeight: 1.45 }}>{row[2]}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <BasisBadge tone={row[3] === "Beta" || row[3] === "测试版" ? "proxy" : row[3] === "Roadmap" || row[3] === "路线图" ? "info" : "calc"}>{row[3]}</BasisBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "数据质量政策" : "Provenance Policy"}</SectionTitle>
          {(lang === "zh" ? ["所有结果都应显示依据：模型预测、计算得到、代理、用户定义或文献支持。","用于论文或答辩前，应把种子/代理数据替换为可引用 DOI、数据库记录或可复现实验/GCMC 输出。","LCC 价格必须保留单位、币种、来源类型、假设和替换路线。"] : ["Every result should expose its basis: model-predicted, calculated, proxy, user-defined, or literature-based.","Before publication or defense, seed/proxy records should be replaced with citable DOI, database records, or reproducible experimental/GCMC outputs.","LCC prices must retain unit, currency, source type, assumption, and replacement pathway."]).map(line => (
            <div key={line} style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>• {line}</div>
          ))}
        </div>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "当前覆盖与限制" : "Coverage & Limitations"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>{lang === "zh" ? "当前公开 JSON 是小型 seed 数据，用于演示工作流、UI 连接和 schema。它能支持可追溯展示，但还不能支撑严格模型泛化结论。下一步应导入 CoRE/QMOF CIF，计算描述符，收集或生成气体吸附标签，并按气体体系分别训练。" : "Current public JSON files are small seed datasets for workflow, UI connection, and schema demonstration. They support traceable display, but not strict model-generalization claims."}</div>
        </div>
      </div>
    </div>
  )
}
