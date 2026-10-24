export const nobelChemistry = [
  {
    year: 2026, theme: ['让化学选择一种镜像', 'Making chemistry choose a mirror image'],
    names: ['Henri B. Kagan', 'Kenso Soai'], slugs: ['kagan', 'soai'],
    citation: ['表彰在不对称有机合成中发现非线性效应与自催化的贡献。', 'Recognised for discovering non-linear effects and autocatalysis in asymmetric organic synthesis.'],
    intro: ['分子也有“左手”和“右手”。两种镜像形式可能具有不同的生物作用，而生命为何偏爱其中一种，一直是化学的重要问题。2026 年诺贝尔化学奖关注的，是微小的手性偏向如何被反应放大。', 'Molecules can have left- and right-handed forms. Their biological effects can differ. This year’s prize explores how a small chiral imbalance can grow through a chemical reaction.'],
    contributions: [
      ['Kagan：不成比例的放大', 'Kagan: disproportionate amplification', 'Kagan 在 1986 年揭示：催化体系的手性组成与产物的手性组成，不一定呈简单线性关系。少量的手性偏向，可能带来更大的产物偏向。', 'In 1986, Kagan showed that catalyst and product chirality need not follow a simple linear relationship. A modest bias can produce a larger product imbalance.'],
      ['Soai：产物推动自己的生成', 'Soai: a product catalyses its own formation', 'Soai 发展了不对称自催化反应：产物参与催化自身的继续生成，使初始的微小偏向得以持续放大。这为同手性的形成提供了化学路径。', 'Soai developed asymmetric autocatalysis: the product helps catalyse its own formation, amplifying an initial imbalance and providing a chemical route to homochirality.'],
    ],
    interpretation: ['如何理解这项成果', 'Reading the chemistry', '非线性效应强调“输入与输出不成比例”；自催化强调“输出反过来促进输入转化”。二者帮助理解手性放大，但并不意味着每种不对称反应都具有相同机制，也不能单凭这些实验确定生命起源的真实历史。', 'Non-linearity concerns the relationship between input and output; autocatalysis concerns feedback from product to reaction. These results illuminate chiral amplification without establishing the historical origin of life.'],
    relevance: ['对催化研究的启发', 'Implications for catalysis', '评估催化选择性时，需要同时追踪催化剂组成、产物对映体比例与反应进程。不能把单一时刻的选择性，直接推广为所有条件下的表现。', 'Track catalyst composition, product enantiomer ratios and reaction progress together. Selectivity at one time point does not establish performance under all conditions.'],
  },
  {
    year: 2025, theme: ['为化学创造新的空间', 'Creating new spaces for chemistry'],
    names: ['Susumu Kitagawa', 'Richard Robson', 'Omar M. Yaghi'], slugs: ['kitagawa', 'robson', 'yaghi'],
    citation: ['表彰金属有机框架（MOF）的发展。', 'Recognised for the development of metal–organic frameworks.'],
    intro: ['把金属节点与有机连接体组装成开放的网络，就能在材料内部创造分子尺度的空间。2025 年诺贝尔化学奖聚焦 MOF：孔隙可以被设计，化学功能也可以随结构调整。', 'Metal nodes and organic linkers form open networks with molecular-scale spaces. The 2025 prize celebrates MOFs, where pore architecture and chemical function can be designed together.'],
    contributions: [
      ['Robson：从连接规则到网络', 'Robson: from connectivity to networks', 'Robson 的工作展示了利用金属与有机组分构建开放网络的思路，让空间结构成为材料设计的起点。', 'Robson demonstrated an approach to building open networks from metal and organic components, making spatial architecture a starting point for design.'],
      ['Kitagawa 与 Yaghi：走向可设计的多孔材料', 'Kitagawa and Yaghi: designable porous materials', 'Kitagawa 推进了配位网络的孔隙与气体容纳研究；Yaghi 发展了稳定框架与网状化学。相关工作让开放网络成为可系统研究的材料家族。', 'Kitagawa advanced porous coordination networks and gas accommodation; Yaghi developed robust frameworks and reticular chemistry. Open networks became a systematically studied material family.'],
    ],
    interpretation: ['孔隙为什么重要', 'Why the spaces matter', '孔径、连接方式和孔壁化学环境共同影响分子如何进入、吸附和离开。材料的潜力来自这些结构变量的组合，不能用比表面积一项概括。', 'Pore size, connectivity and pore-wall chemistry influence how molecules enter, adsorb and leave. Surface area alone cannot describe this combination.'],
    relevance: ['与 EcoMOF-AI 的联系', 'Connections to EcoMOF-AI', 'MOF 筛选需要把结构描述符与具体应用条件放在一起：气体分离看混合物与等温线，催化看活性位点和稳定性。诺奖认可的是材料领域的发展，不是对任意候选性能的保证。', 'MOF screening links descriptors to operating conditions: mixtures and isotherms for separation, active sites and stability for catalysis. The prize does not guarantee any individual candidate’s performance.'],
  },
] as const
