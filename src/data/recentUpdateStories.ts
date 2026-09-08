export const recentUpdateStories = [
  {
    hash:"update-research-reading", version:"v3.5.3", date:"2026-09-08", image:0,
    title:["从研究链接到研究解读", "From paper links to research interpretation"],
    intro:["让最新研究不止于一个外部链接：先理解研究解决了什么、意味着什么，再回到原论文核对证据。", "Read what a study addresses and why it matters before following its sources. Research now opens as an editorial article inside EcoMOF-AI."],
    sections:[
      {title:["阅读先于跳转", "Read before leaving"],body:["上一轮的最新研究卡片直接打开论文。这一版将三条入口改为站内文章，围绕研究问题、核心进展、研究意义和证据边界组织内容。读者可以先把握研究脉络，再选择是否继续阅读原文，而不必在多个外部页面之间切换。", "Previously, research cards opened external papers. This version adds three in-site articles organized around the question, findings, significance and limitations. Readers can understand the context before deciding to consult the source."]},
      {title:["把来源放在最前面", "Sources at the top"],body:["每篇解读顶部提供论文原文链接和 DOI，标明期刊、论文日期以及本站解读身份；能够提供机构档案时也保留入口。正文区分论文报告结果与本站分析，不把综述当作新实验，也不将文献结果冒充平台计算或独立验证。", "Each article begins with the original paper link and DOI, journal and date, and an editorial label. Institutional records are linked where available. Source findings and our interpretation remain distinct; reviews are not presented as new experiments or platform validation."]},
      {title:["两个版本，一条连续的阅读路径", "Two versions, one reading path"],body:["本轮补记上一轮的统一搜索与多语言首页变化，并将两篇版本总结放入最新动态。页脚在维护信息之后增加 since2025，维护行相对整个页脚居中；窄屏时单独占一行，避免被社交入口或语言按钮挤偏。本轮没有改动科研评分、材料数据或论文结论。", "Both the previous search release and this reading release now have update stories. The footer adds since2025 after maintenance text and centres that line across the footer, placing it on its own row on narrow screens. Scientific scoring and material data are unchanged."]},
    ],
    comparison:[
      ["研究入口","Research entry","直接前往论文","External paper first","先读站内解读","In-site interpretation first"],
      ["证据路径","Evidence path","卡片附论文链接","Paper link on card","顶部原文、DOI 与文内边界","Top source links, DOI and evidence limits"],
      ["版本记录","Release record","本轮与上一轮尚未形成专题","The two rounds lacked update stories","两篇独立总结与历史日志同步","Two stories and synchronized release history"],
    ],
  },
  {
    hash:"update-search-platform", version:"v3.5.2", date:"2026-09-08", image:1,
    title:["一个入口，连接材料、方法与研究", "One entry for materials, methods and research"],
    intro:["回顾上一轮已提交的更新：独立搜索首页、可追溯材料结果，以及适配手机和 iPad 的多语言阅读体验。", "A retrospective of the previous committed release: a dedicated search home, traceable material results and multilingual reading across phone and tablet layouts."],
    sections:[
      {title:["从导航入口到材料记录", "From navigation to material records"],body:["统一搜索成为网站默认入口，左上角英文品牌名返回这一页。搜索把研究版块、功能和部分文字资料放在同一个界面，并支持 MOF 名称与别名检索。材料结果直接展示已有物化字段、来源和 DOI；记录缺少属性或可加载结构时，保留缺失提示，不以其他材料替代。", "Unified search becomes the default entry and wordmark destination. It connects sections, functions and selected text resources, with MOF name and alias matching. Results expose available properties, sources and DOI links while preserving missing-field and unavailable-structure boundaries."]},
      {title:["在不同屏幕上保持连续阅读", "Continuous reading across screens"],body:["搜索结果减少胶囊与嵌套卡片，手机上以两列属性和可换行操作显示。文章表格在自身区域内横向滚动，iPad 页脚根据空间调整列数。首页加入动态概念封面、暂停控制和减少动态效果的降级方式；这些是浏览器尺寸检查结果，不等于完成了所有真机型号验证。", "Results reduce nested cards, use two property columns on phones and wrap actions. Tables scroll internally and tablet footers adjust their columns. Conceptual covers include motion and pause controls with reduced-motion support. Browser-size checks do not amount to testing every physical device."]},
      {title:["语言支持与已知边界", "Languages and remaining boundaries"],body:["新增日语、韩语、西班牙语和香港繁体选项，并明确台湾（中国）的显示名称。新首页、主要搜索文案和专题内容提供相应适配；旧科研工作区仍可能回退英文。开源许可页补充本轮依赖与生成素材说明。上一轮提交为 8e0baba，本篇为其补记，不把本轮研究解读功能倒写成上一版已有能力。", "Japanese, Korean, Spanish and Hong Kong Traditional Chinese were added, with Taiwan (China) explicitly labelled. New landing and core search copy are localized; legacy workbenches may fall back to English. Notices cover dependencies and generated imagery. This entry records commit 8e0baba and does not backdate this version's research articles."]},
    ],
    comparison:[
      ["网站入口","Entry","原总览页","Overview page","独立统一搜索页","Dedicated search home"],
      ["材料检索","Material search","以版块入口为主","Mostly section entries","名称、别名、属性与来源","Names, aliases, properties and sources"],
      ["响应式阅读","Responsive reading","按钮和内容布局不协调","Inconsistent control layouts","换行操作、分列属性、内部滚动","Wrapped actions, property columns and internal scrolling"],
    ],
  },
]
