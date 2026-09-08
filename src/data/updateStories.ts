export const updateStories = [
  {
    hash:"update-research-progress", version:"v3.5.1", date:"2026-08-20", image:0,
    title:["让研究进展清晰可循", "Making research progress visible"],
    intro:["从一次界面更新到一条可追溯的研究路线：重新组织 EcoMOF-AI 的版本记录、科学里程碑与下一步问题。", "A clearer path from interface changes to research progress: connecting release records, scientific milestones, and the questions that come next."],
    sections:[
      { title:["把时间线变成研究脉络", "A clearer account of progress"], body:["研究平台的变化往往同时发生在界面、数据与方法中。如果这些变化全部挤进同一条时间线，读者很难区分已经完成的功能、得到支持的研究判断，以及仍等待验证的问题。v3.5.1 对这三类信息重新安排了阅读位置：更新日志记录完成的变化，科学里程碑整理阶段进展，科研路线图呈现后续方向。", "Changes to a research platform span interfaces, data, and methods. A single timeline can obscure the distinction between completed work and questions still awaiting validation. Version 3.5.1 separates completed changes into the changelog, research progress into scientific milestones, and future directions into the roadmap."] },
      { title:["阅读体验的改变", "What changes for the reader"], body:["这次调整同时收敛了页面的视觉语言。大面积领域色减少，黑白灰成为主要阅读背景；减少外层大卡片套内部小卡片，让标题、段落和来源之间的层次更直接。页面过渡用于引导阅读顺序，而方法论页保留适合连续查阅的呈现方式。视觉上的简化服务于一件具体的事：读者能把注意力放回研究内容。", "The release also reduces large areas of domain-specific color and nested cards. A quieter palette and clearer headings make the relationship between explanations and sources easier to follow. Page transitions guide reading, while the methodology page keeps a presentation suited to sustained reference."] },
      { title:["进展可见，边界也应可见", "Visible progress and visible boundaries"], body:["界面更清晰并不意味着科学结论自动更可靠。版本变化说明平台完成了什么，不能替代外部验证或实验复现。新的组织方式把这些不同层次的信息放在各自的位置，便于读者先了解改动，再沿着方法、数据和验证入口核对实际证据。", "A clearer interface does not establish a stronger scientific conclusion by itself. Release history documents implementation; it cannot replace external validation or experimental reproduction. The new organization makes it easier to follow a change back to methods, data, and evidence."] },
    ],
    comparison:[
      ["进展记录", "Progress records", "集中在项目演化中", "Combined in Project Evolution", "更新日志、里程碑、路线图各司其职", "Separate changelog, milestones, and roadmap"],
      ["视觉层次", "Visual hierarchy", "领域色与多层卡片较多", "More domain color and nested cards", "低彩度与连续段落", "Restrained color and continuous prose"],
      ["阅读路径", "Reading path", "读者自行拆分状态", "Readers distinguish status themselves", "完成事项与后续方向分开查阅", "Completed work and future directions are distinct"],
    ],
  },
  {
    hash:"update-research-canvas", version:"v3.5.0", date:"2026-07-30", image:1,
    title:["从独立区块到连续研究画布", "From separate sections to a research canvas"],
    intro:["把研究问题、数据与方法放到同一条阅读路径上，同时恢复方法论的文献来源与执行细节。", "Bringing questions, data, and methods into one reading path, with literature sources and execution details restored to the methodology."],
    sections:[
      { title:["减少边界，让内容连接起来", "Connecting the content"], body:["v3.5.0 弱化首页区块和内部卡片的边界，缩短区块之间的距离。变化的重点并非增加更多入口，而是让读者从研究问题继续看到数据与方法，不必反复适应新的视觉容器。筛选项、文本按钮和状态标签也使用了更紧凑的形态。", "Version 3.5.0 softens section boundaries and shortens gaps on the homepage. The aim is a continuous reading path from a research question into its data and methods. Filters, text buttons, and status labels adopt more compact geometry."] },
      { title:["方法不止于名称", "Beyond method names"], body:["方法论恢复了 34 条文献灵感来源，并列出六类采用边界。目录按研究流程排序，各方法分项补充研究目的、输入资格、执行状态、结果呈现、停止条件、字段审计和界面行为。读者由此可以进一步判断：一种方法在平台里如何被使用，哪些输入满足条件，何时应停止计算。", "The methodology restores 34 literature-inspiration sources and six categories of adoption boundaries. Its sections follow the research workflow and describe purpose, input eligibility, execution status, presentation, stopping conditions, field auditing, and interface behavior."] },
      { title:["从入口继续到证据", "Following an entry to its evidence"], body:["对于材料筛选，知道算法名字只是起点。实际判断仍需结合来源、可比条件与字段完整度。连续画布改善的是查阅路径；文献来源和执行说明则帮助读者检验这条路径上的每一步。两者共同支持更可检查的研究过程，但并不提供未经验证的性能提升承诺。", "A method name is only a starting point for screening. Decisions still depend on sources, comparable conditions, and field completeness. The canvas improves navigation; restored references and execution details support inspection of each step. Neither implies an unmeasured performance improvement."] },
    ],
    comparison:[
      ["首页", "Homepage", "区块边界较强", "Stronger section boundaries", "连续画布与更短间距", "Continuous canvas and shorter gaps"],
      ["方法来源", "Method sources", "来源说明有待恢复", "References needed restoration", "恢复 34 条来源与采用边界", "34 sources and adoption boundaries restored"],
      ["执行说明", "Execution details", "需要逐项补全", "Item-level detail incomplete", "补充资格、状态与停止条件", "Eligibility, status, and stopping conditions added"],
    ],
  },
  {
    hash:"update-methods", version:"v3.4.2", date:"2026-07-29", image:2,
    title:["从数据来源到方法实现", "From data sources to implementation"],
    intro:["把数据输入、索引、算法、输出与停止条件写清楚，让研究流程中的关键判断可以被逐项检查。", "Documenting inputs, indexes, algorithms, outputs, and stopping conditions so that key decisions can be inspected."],
    sections:[
      { title:["让实现路径有据可查", "An inspectable implementation path"], body:["v3.4.2 补全 MOF 库、生态筛选、气体分离、催化、有机酸、字段级溯源和验证路线的实现说明。各模块不再仅以功能名称出现，而是进一步交代所需输入、索引方式、计算过程、输出内容与停止条件。这为读者判断一个结果从何而来提供了更完整的阅读依据。", "Version 3.4.2 documents implementation across the MOF Library, EcoScreen, GasSep, catalysis, Organic Acid, field provenance, and validation. Descriptions connect each module to its inputs, indexing, computation, outputs, and stopping conditions."] },
      { title:["把发布方原文放回中心", "Returning to publisher sources"], body:["数据合规页由六步控制图和表格转向分级编号的文档结构。发布方许可、免责声明与原文链接成为主要阅读内容，来源登记和筛选仍然保留。新的阅读顺序便于先查阅原文，再理解平台怎样使用对应数据。", "The data-compliance page replaces the six-step diagram and tables with a numbered document structure. Publisher licenses, disclaimers, and original links lead the reading experience, while source registration and filtering remain available."] },
      { title:["说明完整，不等于验证完成", "Documentation and validation remain distinct"], body:["实现说明补全能够提高可检查性，但不能填补缺失实验，也不能改变数据本身的许可或适用边界。使用平台时，仍需沿着具体记录核对身份、字段来源和研究条件；对于缺少数据或不满足计算条件的任务，停止条件应与结果一样清楚。", "More complete documentation improves inspectability, but does not supply missing experiments or change a source's permissions. Users must still check record identity, field provenance, and research conditions. When inputs are insufficient, stopping conditions matter as much as outputs."] },
    ],
    comparison:[
      ["模块说明", "Module documentation", "实现路径需要补全", "Implementation paths incomplete", "输入到停止条件逐项说明", "Inputs through stopping conditions documented"],
      ["来源查阅", "Source reading", "控制图与表格主导", "Diagram and table-led", "分级编号、发布方原文优先", "Numbered, publisher-source-first document"],
      ["使用边界", "Use boundaries", "需结合各处分散信息", "Information distributed across sections", "随实现与来源说明查阅", "Boundaries accompany implementation and sources"],
    ],
  },
]
