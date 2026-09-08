// Original editorial interpretation based on publisher abstracts / bibliographic records.
// Do not imply full-text review, independent reproduction or platform validation.
export const researchArticles = [
  {
    id: "molecular-fans", category: ["气体分离 · 孔道动力学", "Gas separation · Pore dynamics"],
    sourceUrl: "https://www.nature.com/articles/s41467-026-77361-y",
    sourceTitle: "Construction of molecular fans in metal-organic framework to overcome diffusion resistance for trace benzene capture",
    authors: "Huang, Z., Yang, X., Luan, Y. et al.",
    sections: [
      { title: ["01 · 研究问题：抓得住，也要进得去", "01 · The question: binding and access"], body: ["痕量苯捕集不能只看材料最终能吸附多少。孔道与分子尺寸相近时，较强吸附作用可能伴随较大扩散阻力。这项工作围绕两者的矛盾，研究如何让苯分子更快进入吸附空间。", "Trace benzene capture involves both binding and transport. Size-matched pores can attract benzene strongly while restricting diffusion. The study addresses this tension rather than considering capacity alone."] },
      { title: ["02 · 核心进展：让孔道内部动起来", "02 · The finding: motion inside the pores"], body: ["作者在铁基 ZJU-701 中引入具有旋转能力的分子单元。摘要报告：298 K、P/P₀ = 0.001 时，苯吸附容量为 2.05 mmol/g；气流速度从 0.03 增至 0.12 m/s 时，动态容量下降 10.1%。这些数值属于原论文特定测试条件，不是本站计算结果。", "The authors introduce rotating molecular units into Fe-based ZJU-701. The abstract reports 2.05 mmol/g benzene uptake at 298 K and P/P₀ = 0.001, and a 10.1% dynamic-capacity decrease when gas velocity rises from 0.03 to 0.12 m/s. These are source-reported results, not platform calculations."] },
      { title: ["03 · 研究意义：从静态孔径走向动态传质", "03 · Why it matters: beyond static pore size"], body: ["本站解读：筛选吸附材料时，平衡容量与传质过程应分别记录。孔径、孔体积可以帮助描述结构，却不能单独代表运行中的捕集效率。对 EcoMOF-AI 而言，这提示未来应把流速、突破行为和扩散相关证据与静态描述符并列，而不是仅凭一个容量数值排名；这仍是方法启示，不表示相关模型已经上线。", "Our interpretation: equilibrium uptake and transport deserve separate evidence fields. Static descriptors cannot by themselves represent operating capture efficiency. A future screening workflow could retain flow and breakthrough evidence alongside pore descriptors. This is a design implication, not a claim that such a model is already deployed."] },
      { title: ["04 · 证据边界与后续问题", "04 · Limits and next questions"], body: ["本文基于公开摘要和书目信息撰写，未独立复现实验。不能将上述表现推广到所有污染物、湿度或真实混合气环境。后续查阅应重点核对循环稳定性、湿度干扰、再生需求和成型条件；跨材料比较必须先统一测试条件。", "This article is based on public abstract and bibliographic information, without independent reproduction. Results should not be generalized to every contaminant or operating environment. Humidity, cycling, regeneration and shaping remain questions to check in the source before comparing materials."] },
    ],
  },
  {
    id: "reticular-sites", category: ["催化 · 网状化学综述", "Catalysis · Reticular chemistry review"],
    sourceUrl: "https://www.nature.com/articles/s44160-026-01130-4",
    sourceTitle: "Designing heterogeneous electrocatalytic sites using reticular chemistry",
    authors: "Ghatak, A., Shanker, G. S., Shimoni, R. et al.",
    sections: [
      { title: ["01 · 研究问题：活性中心之外，还有什么", "01 · The question: beyond the active centre"], body: ["这是一篇综述，而不是发布单一新材料性能的实验论文。作者关注异相电催化中心附近的化学环境：理解中心本身的结构还不够，其周围环境如何影响反应同样需要分子尺度的解释。", "This is a review, not a report of one new material's performance. It examines the chemical surroundings of heterogeneous electrocatalytic centres and the need to understand those surroundings at molecular scale."] },
      { title: ["02 · 主要脉络：把局部环境纳入设计", "02 · The argument: designing the local environment"], body: ["综述讨论网状化学如何调节活性位点附近的化学环境，并由此影响小分子电催化转化的活性与选择性。它的价值是组织设计思路与已有研究证据，不能被概括为某一种 MOF 在所有反应中性能更好。", "The review discusses reticular chemistry as a way to tune the environment near active sites and influence activity and selectivity in small-molecule electrocatalysis. Its contribution is a design perspective and synthesis of evidence, not a universal material ranking."] },
      { title: ["03 · 研究意义：从元素标签走向环境描述", "03 · Why it matters: describing the surroundings"], body: ["本站解读：用金属名称给催化材料分类很方便，但不足以解释不同材料为何产生不同结果。整理催化文献时，应将反应条件、位点环境与性能证据关联起来，避免把同一金属的不同结构视作等价。对平台的直接启示是提高证据字段的表达能力，而不是据此增加一个未经验证的评分项。", "Our interpretation: a metal label is useful for indexing but insufficient for explaining performance. Literature records should connect conditions, site environments and outcome evidence rather than treating structures with the same metal as equivalent. Richer evidence fields are a safer implication than an unvalidated scoring term."] },
      { title: ["04 · 阅读边界：综述不替代原始证据", "04 · Limits: a review is not primary validation"], body: ["本文依据可访问的摘要与书目信息编写，不声称已经逐条核验综述引用的实验。涉及具体反应、机理或性能数字时，应继续查阅被引原始论文，并检查电解质、电位、归一化方式和稳定性条件。综述中的设计方向不能直接成为平台的预测结论。", "This interpretation uses accessible abstract and bibliographic information; it does not audit every cited experiment. Specific mechanisms or performance claims require the original studies and their electrolyte, potential, normalization and stability conditions. A review's design direction is not a platform prediction."] },
    ],
  },
  {
    id: "monolithic-catalyst", category: ["催化 · 生物质转化", "Catalysis · Biomass conversion"],
    sourceUrl: "https://www.nature.com/articles/s43246-026-01249-z",
    repositoryUrl: "https://ora.ox.ac.uk/objects/uuid%3A7e1857f5-b94f-48d6-9028-63ebcaf0c893",
    sourceTitle: "Acid-base bifunctional monolithic MOF catalyst for biodiesel production",
    authors: "Gouda, S. P., Ao, S., Patra, S. G. et al.",
    sections: [
      { title: ["01 · 研究问题：反应与材料形态一起考虑", "01 · The question: chemistry and material form"], body: ["生物柴油路线既涉及化学转化，也涉及催化剂与产物的分离。这项研究选择具有酸碱双功能的整体式 MOF，把催化位点与材料形态放在同一个研究问题中，而不仅讨论粉体材料的反应表现。", "Biodiesel production involves chemical conversion as well as catalyst and product separation. This work studies an acid–base bifunctional monolithic MOF, bringing catalytic function and material form into the same question."] },
      { title: ["02 · 核心进展：双功能服务于一锅转化", "02 · The finding: two functions in one conversion"], body: ["牛津大学研究档案的公开记录指出，该催化剂将酯化与酯交换结合，用于非食用麻疯树油的转化，并报告所得生物柴油满足 ASTM 相关要求。本文不据此推断商业成本、工业放大效果或所有原料油的适用性，也不填入尚未核验的产率数字。", "The Oxford research record reports combined esterification and transesterification of inedible Jatropha curcas oil, yielding biodiesel described as ASTM-compliant. This does not establish commercial cost, scale-up performance or suitability for every feedstock. No unverified yield is added here."] },
      { title: ["03 · 研究意义：把催化性能放回流程", "03 · Why it matters: restoring process context"], body: ["本站解读：材料筛选若只比较一次反应的转化结果，容易忽视回收、分离和原料差异。整体式材料提供了一个值得追踪的方向：让位点功能与操作方式协同设计。平台可据此完善催化记录中的材料形态和分离步骤描述，但不能把这种方向性优势直接换算成环境收益或经济收益。", "Our interpretation: conversion alone can hide recovery, separation and feedstock differences. Monolithic materials motivate tracking how catalytic function interacts with operation. Material form and separation steps can enrich platform records, but their possible advantages cannot be converted directly into environmental or economic gains."] },
      { title: ["04 · 证据边界与工程问题", "04 · Limits and engineering questions"], body: ["本文是公开来源的编辑性总结，并非全文复现或工程评估。判断实际应用前，还需核对原料组成、催化剂用量、反应条件、重复使用、浸出和分离操作。原文报告的标准符合性也应回到具体检测项目核查，不能等同于整个工艺已经获得工业认证。", "This is an editorial summary, not reproduction or engineering assessment. Practical evaluation still requires feedstock composition, catalyst loading, conditions, reuse, leaching and separation details. Reported fuel compliance should be checked against the measured tests, not treated as certification of an entire industrial process."] },
    ],
  },
]
