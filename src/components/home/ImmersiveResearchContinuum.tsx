// @ts-nocheck
import { ArrowDown, ArrowRight } from "@phosphor-icons/react"
import atlasCatalysis from "../../assets/home-map/atlas-catalysis.jpg"
import atlasEvidence from "../../assets/home-map/atlas-validation.jpg"
import atlasGas from "../../assets/home-map/atlas-gassep.jpg"
import atlasLifecycle from "../../assets/home-map/atlas-ecoscreen.jpg"
import atlasLibrary from "../../assets/home-map/atlas-library.jpg"

const numberText = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : "Not available"
}

export function ImmersiveResearchContinuum({
  activeBranch,
  gasParetoCount,
  lang,
  onBranchChange,
  onContinue,
  onNavigate,
  summary,
}) {
  const zh = lang === "zh"
  const branches = [
    {
      id: "ecoscreen",
      short: zh ? "可持续性" : "Sustainability",
      eyebrow: zh ? "研究线 01 / 可持续性评价" : "RESEARCH THREAD 01 / SUSTAINABILITY",
      title: zh ? "把环境影响、成本与性能放在同一决策边界中。" : "Keep impact, cost, and performance inside one decision boundary.",
      body: zh ? "从生命周期清单和地区情景进入多目标筛选，再回到可核查的候选权衡。功能单位、缺失数据和回收假设始终保持可见。" : "Move from life-cycle inventories and regional scenarios into multi-objective screening, then back to inspectable candidate trade-offs. Functional units, missingness, and recovery assumptions remain visible.",
      image: atlasLifecycle,
      facts: [[zh ? "方法" : "METHOD", "LCA / LCC + Pareto"], [zh ? "边界" : "BOUNDARY", zh ? "功能单位与地区情景" : "Functional unit + region"], [zh ? "下一层" : "NEXT LAYER", zh ? "数据基础" : "Data foundation"]],
      targetId: "home-data-foundation",
      hash: "ecoscreen",
      target: "ecoscreen",
    },
    {
      id: "library",
      short: zh ? "结构与来源" : "Library",
      eyebrow: zh ? "研究线 02 / 结构与来源" : "RESEARCH THREAD 02 / STRUCTURE & PROVENANCE",
      title: zh ? "让每一个结构、字段和来源都能沿原路径返回。" : "Let every structure, field, and source travel back to its origin.",
      body: zh ? "结构身份、清洗版本、描述符和缺失状态共同进入检索。相同材料的多来源记录不会被包装成彼此独立的证据。" : "Structural identity, cleaning version, descriptors, and missingness enter search together. Multi-source records for one material are not presented as independent evidence.",
      image: atlasLibrary,
      facts: [[zh ? "平台记录" : "PLATFORM RECORDS", numberText(summary?.totalRecords)], ["CoRE MOF", numberText(summary?.coreMofRecords)], ["FAIR-MOFs", numberText(summary?.fairMofsRecords)]],
      targetId: "home-descriptor-3d",
      hash: "library",
      target: "mofLibrary",
    },
    {
      id: "gassep",
      short: zh ? "气体分离" : "Gas separation",
      eyebrow: zh ? "研究线 03 / 气体分离" : "RESEARCH THREAD 03 / GAS SEPARATION",
      title: zh ? "从配对等温线走向有条件的分离判断。" : "Move from paired isotherms to a conditional separation judgment.",
      body: zh ? "气体组成、温度、压力窗口、IAST 资格和工作容量在同一条证据线上解释；数据不足时不生成越界的热力学结论。" : "Gas composition, temperature, pressure window, IAST eligibility, and working capacity stay on one evidence line; thermodynamic conclusions are withheld when data are insufficient.",
      image: atlasGas,
      facts: [[zh ? "吸附记录" : "ADSORPTION RECORDS", numberText(summary?.gasAdsorptionRecords)], [zh ? "前沿点" : "FRONTIER POINTS", numberText(gasParetoCount)], [zh ? "下一层" : "NEXT LAYER", zh ? "任务性能" : "Task performance"]],
      targetId: "home-gas-performance",
      hash: "gassep",
      target: "gassep",
    },
    {
      id: "organic",
      short: zh ? "催化路径" : "Catalysis",
      eyebrow: zh ? "研究线 04 / 催化路径" : "RESEARCH THREAD 04 / CATALYTIC PATHWAY",
      title: zh ? "沿反应网络解释主客体催化选择，而不是只给出排名。" : "Explain host-guest catalytic choices along the reaction network, not as a ranking alone.",
      body: zh ? "目标路径、竞争产物、主体 MOF、客体金属和 HGCPS 贡献共同展开；权重、证据与不确定度可逐步复核。" : "Target routes, competing products, host MOFs, guest metals, and HGCPS contributions unfold together, with weights, evidence, and uncertainty available for stepwise review.",
      image: atlasCatalysis,
      facts: [[zh ? "解释对象" : "TARGET", zh ? "主客体催化路径" : "Host-guest pathway"], [zh ? "模型" : "MODEL", "HGCPS"], [zh ? "下一层" : "NEXT LAYER", zh ? "验证证据" : "Validation evidence"]],
      targetId: "home-algorithm-validation",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
    },
    {
      id: "validation",
      short: zh ? "可信验证" : "Validation",
      eyebrow: zh ? "研究线 05 / 可信验证" : "RESEARCH THREAD 05 / TRUSTWORTHY VALIDATION",
      title: zh ? "用实验标签、敏感性和外部测试限定结论强度。" : "Bound conclusion strength with labels, sensitivity, and external tests.",
      body: zh ? "规则分数、证据修正、参数扰动与 Benchmark 并列呈现。没有完成的验证不会被转换成确定性结论。" : "Rule scores, evidence adjustment, parameter perturbation, and benchmarks remain side by side. Incomplete validation is never converted into certainty.",
      image: atlasEvidence,
      facts: [[zh ? "实验标签" : "EXPERIMENTAL LABELS", numberText(summary?.experimentalLabelCount)], ["Benchmark", numberText(summary?.benchmarkEligibleCount)], [zh ? "下一层" : "NEXT LAYER", zh ? "研究行动" : "Research action"]],
      targetId: "home-algorithm-validation",
      hash: "methodology-algorithm-validation",
      target: "about",
    },
  ]
  const current = branches.find(branch => branch.id === activeBranch) || branches[2]

  return (
    <section className="home-research-continuum" data-home-reveal="research-continuum" data-branch={current.id} aria-labelledby="home-research-continuum-title">
      <nav className="home-continuum-branch-index" aria-label={zh ? "切换当前研究线" : "Switch active research thread"}>
        {branches.map(branch => (
          <button key={branch.id} type="button" data-active={branch.id === current.id ? "true" : "false"} onClick={() => onBranchChange?.(branch.id)}>
            <img src={branch.image} alt="" aria-hidden="true" />
            <span>{branch.short}</span>
          </button>
        ))}
      </nav>

      <div className="home-continuum-lead">
        <figure>
          <img src={current.image} alt="" aria-hidden="true" />
        </figure>
        <div className="home-continuum-copy">
          <span>{current.eyebrow}</span>
          <h2 id="home-research-continuum-title">{current.title}</h2>
          <p>{current.body}</p>
          <div className="home-continuum-actions">
            <button type="button" className="home-continuum-secondary" onClick={() => onContinue?.(current.id, current.targetId)}>
              <span>{zh ? "沿本页进入完整证据" : "Continue through the evidence"}</span>
              <ArrowDown aria-hidden="true" size={17} weight="bold" />
            </button>
            <button type="button" className="home-continuum-primary" onClick={() => onNavigate?.(current.hash, current.target)}>
              <span>{zh ? "进入完整工作区" : "Open full workspace"}</span>
              <ArrowRight aria-hidden="true" size={17} weight="bold" />
            </button>
          </div>
        </div>
        <dl>
          {current.facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
