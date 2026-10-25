export const scienceUpdateStories = [
{
  "hash": "update-science-forecasts",
  "version": "v3.5.8",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "科学预测专题与全局页面显示修复",
    "Science Forecasts and reliable secondary pages"
  ],
  "intro": [
    "将预测市场扩展为科学预测统一入口，保留诺奖档案，新增电池、超导与碳捕集的可核验技术事件，并修复二级页面正文发灰。",
    "A unified Science Forecasts entry preserves Nobel archives and adds source-backed battery, superconductor and carbon-capture events, with a global fix for faded secondary pages."
  ],
  "sections": [
    {
      "title": [
        "从一个入口进入四个专题",
        "Four topics in one place"
      ],
      "body": [
        "首页、菜单和页脚统一改为“科学预测”。诺奖市场成为独立专题，原有七份年度／平台记录与旧链接继续可用；新增全固态电池、超导材料、碳捕集与 MOF 三个技术专题。",
        "Home, menu and footer now use Science Forecasts. Nobel markets retain all seven year/source editions and legacy links as a dedicated topic, alongside batteries, superconductors and carbon capture / MOFs."
      ]
    },
    {
      "title": [
        "具体事件与真实成交",
        "Specific events and actual trades"
      ],
      "body": [
        "从 Manifold 公共 API 收录 19 个具体事件、7,803 个真实成交后采样点，分别标明虚拟积分、存档概率、停盘前成交及平台判定。六条规则冲突或不足单独提示，取消不视为 No。",
        "Public Manifold API records supply 19 specific events and 7,803 actual post-trade observations. Play money, archived snapshots, pre-close trades and resolution are distinct. Six rule issues are flagged; cancellation is not No."
      ]
    },
    {
      "title": [
        "查规则，也查机构",
        "Explore rules and institutions"
      ],
      "body": [
        "专题提供搜索、阶段与状态筛选、排序、本机关注、事件目录与历史 CSV 下载。事件详情按需加载，包含规则摘要、判定边界、真实历史曲线及中英机构简介和官方图标。",
        "Topics offer search, stage/status filters, sorting, device-local watchlists and CSV exports. Event details load on demand with rule summaries, resolution boundaries, actual history and bilingual institution profiles with official icons."
      ]
    },
    {
      "title": [
        "证据不代替赔率",
        "Evidence and market prices"
      ],
      "body": [
        "补充 VTT 测量说明、LK-99 实验论文及 Svante／BASF 的 MOF 材料供应资料。市场预测与科学证据分别呈现；未找到可核验的 MOF 产业专属市场，不以其他碳捕集路线的概率代替。",
        "Evidence links cover VTT measurements, an LK-99 experimental paper and Svante/BASF MOF supply documents. Market prices and evidence remain separate; other capture pathways do not stand in for an unverified MOF industry market."
      ]
    },
    {
      "title": [
        "二级页面保持清晰",
        "Readable secondary pages"
      ],
      "body": [
        "移除全局正文容器的滚动透明度动画，二级页面在进入、滚动及异步加载后保持完整显示。致谢同步说明 Manifold 的新增数据用途；本轮提交记录与动态详情保持一致。",
        "Global content containers no longer use scroll-driven opacity, keeping secondary pages readable on entry, scroll and lazy loading. Acknowledgements cover the expanded Manifold use; release and update stories describe the same completed work."
      ]
    }
  ],
  "comparison": [],
  "source": "依据公开 API 存档、机构原始资料与本轮已完成的界面修复编写；存档不代表实时行情。"
},
{
  "hash": "update-methodology-reader",
  "version": "v3.5.7",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "方法论重绘与市场入口修复",
    "A clearer methodology and reliable market entry"
  ],
  "intro": [
    "用八组中英教学例解释材料身份、权重、评分、分离、催化、溯源与验证，重绘白色阅读页面，并修复进入预测市场时的滚动定位与加载状态。",
    "Eight bilingual teaching examples explain identity, weights, scores, separation, catalysis, provenance and validation, with a white editorial layout and fixes to market entry scrolling and loading states."
  ],
  "sections": [
    {
      "title": [
        "清晰的阅读层次",
        "A clearer reading path"
      ],
      "body": [
        "方法论采用与诺奖专栏一致的白底、深青标题与分隔线；减少嵌套卡片，目录改为简洁侧栏，方法索引和治理依据可以展开查阅。",
        "Methodology adopts the Nobel column’s white background, deep teal headings and fine rules. A simpler directory and expandable reference index accompany flatter method sections."
      ]
    },
    {
      "title": [
        "逐步算一次",
        "Work through an example"
      ],
      "body": [
        "新增八组中英示例，逐项解释输入、假设、计算结果和缺失条件时的停止位置；综合评分示例可调整证据系数，所有教学数字均明确为构造输入。",
        "Eight bilingual examples explain inputs, assumptions, results and stopping conditions. The scoring example recalculates with an adjustable evidence factor; all teaching numbers are explicitly constructed."
      ]
    },
    {
      "title": [
        "完整方法与来源",
        "Methods and sources"
      ],
      "body": [
        "保留完整公式、交互工作台、方法步骤与来源入口。新增说明链接至 NIST、W3C、IUPAC 和 CRITIC 原始方法，区分教学简化与完整计算。",
        "Complete formulas, interactive workbenches, method steps and source links remain available. Examples link NIST, W3C, IUPAC and the original CRITIC method and distinguish simplified teaching from full calculations."
      ]
    },
    {
      "title": [
        "稳定进入市场",
        "Reliable market entry"
      ],
      "body": [
        "预测市场进入时回到页面顶部，避免沿用首页或页脚的滚动位置；年份索引加载完成前不再显示空数据提示，索引和报价请求超时或失败时均可重试。",
        "Market entry resets inherited scroll positions. Loading the year index no longer flashes an unavailable-year message; failed or timed-out index and quote requests can be retried."
      ]
    }
  ],
  "comparison": [],
  "source": "依据本轮界面修复和现有方法实现编写；示例不代表实测性能。"
},
  {
    "hash": "update-science-refinements",
    "version": "v3.5.6",
    "date": "2026-10-24",
    "image": 2,
    "title": [
      "更完整的历史市场与产业资料",
      "Historical markets and product evidence"
    ],
    "intro": [
      "合并应用与企业阅读，补充概念实例、三个平台的历史预测、人物资料与具名致谢；首页去掉概念大图。",
      "Integrated application and company reading, concept examples, three forecast sources, person records and acknowledgements, with text-first home sections."
    ],
    "sections": [
      {
        "title": [
          "把不同平台的数据分开读",
          "Keep platforms distinct"
        ],
        "body": [
          "预测市场已分别收录 Polymarket、Manifold 与 Kalshi。2022–2026 年合计七份年度/平台记录，保留真实成交、领域预测和稀疏历史的差异；提供平台切换、搜索、排序、曲线重置及数据下载。",
          "Polymarket, Manifold and Kalshi provide seven source/year editions across 2022–2026. Source, scope and sparse-history differences remain visible, with platform selection, search, sorting, chart reset and CSV export."
        ]
      },
      {
        "title": [
          "企业进展落到产品和工作环节",
          "Products and their roles"
        ],
        "body": [
          "历年企业部分补充产品、技术原理、用途及官方资料，区分研究工具、商业材料和研发项目；不根据论文结果推断企业采用、授权或产业化。人物信息补充获奖时机构与个人档案，致谢逐项列出实际来源平台。",
          "Annual company sections explain products, mechanisms, uses and official sources, distinguishing research tools, commercial materials and development programs. Person records and platform acknowledgements are expanded."
        ]
      },
      {
        "title": [
          "收紧首页入口",
          "A more compact home"
        ],
        "body": [
          "最新动态移至首页倒数第二，以紧凑文字摘要替代大图。站内入口使用横向箭头，外部资料继续保留外链标识。",
          "Updates move to the penultimate homepage section as compact summaries. Internal navigation uses horizontal arrows; source links retain external-link indicators."
        ]
      },
      {
        "title": [
          "先解释概念，再看成果",
          "Understand the concept first"
        ],
        "body": [
          "每个获奖年份补充基础概念与具体例子；2026 年用香芹酮的两种镜像结构解释手性与气味差异。企业简介、产品与技术支持中英文，长篇文章移除全局滚动淡入，修复切换年份后内容发灰。最新动态与最新研究的概念大图全部移除。",
          "Awarded years add foundational explanations and concrete examples. Carvone enantiomers illustrate chirality and aroma in 2026. Bilingual company profiles and products accompany a fix for faded long articles; update and research concept covers are removed."
        ]
      }
    ],
    "comparison": []
  },
  {
    "hash": "update-prediction-archive",
    "version": "v3.5.5",
    "date": "2026-10-24",
    "image": 1,
    "title": [
      "在独立页面回看开奖前的判断",
      "A separate forecast archive"
    ],
    "intro": [
      "预测市场拥有首页、菜单和页脚入口；展示历史曲线、真实得主及候选人的研究方向与机构。",
      "A dedicated market page with history, actual laureates, research profiles and institutions."
    ],
    "sections": [
      {
        "title": [
          "保留开奖前的数据边界",
          "Preserve the pre-announcement boundary"
        ],
        "body": [
          "预测市场从诺奖解读中分离，按年度加载。历史报价在公布前截断，缺失的市场和候选人不补造概率；每个候选人的研究方向和机构资料均附来源链接。",
          "Markets are loaded by year in a separate page. Histories stop before disclosure; missing markets and candidates are not assigned invented probabilities. Research and institution sources are linked."
        ]
      }
    ],
    "comparison": []
  },
  {
    "hash": "update-nobel-archive",
    "version": "v3.5.4",
    "date": "2026-10-24",
    "image": 0,
    "title": [
      "从年度获奖记录到化学成果解读",
      "From award records to Chemistry readings"
    ],
    "intro": [
      "补齐历年六部分解读、方程式、官方人物肖像与研究资料，统一白色页面和年份切换。",
      "Annual six-part readings, equations, official portraits and research evidence in a shared white layout."
    ],
    "sections": [
      {
        "title": [
          "逐年阅读，逐项核查",
          "Read and verify by year"
        ],
        "body": [
          "118 个获奖年份采用同一阅读结构，八个未颁奖年份单独标明。解读连接大学论文、机构和企业资料，并在下方提供官网原文入口。历史人物肖像沿用官方图片和署名。",
          "All 118 awarded years share a reading structure; eight unawarded years are identified. Readings link papers, institutions and company evidence, followed by official originals and credited portraits."
        ]
      }
    ],
    "comparison": []
  }
]
