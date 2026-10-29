export const scienceUpdateStories = [
{
  "hash": "update-trade-verification",
  "version": "v3.5.15",
  "date": "2026-10-29",
  "image": 0,
  "title": [
    "交易数据复核与节点解释修正",
    "Trade verification and corrected node interpretation"
  ],
  "intro": [
    "复核既有交易来源，补回 1 个遗漏成交点，移除 4 个没有交易数据的专题，并停止用提交日期或冲突日期解释价格变化。",
    "Existing sources were rechecked, one omitted trade restored, four curve-free topics removed, and submission/conflicting dates blocked from price comparisons."
  ],
  "sections": [
    {
      "title": [
        "交易节点逐点核对",
        "Point-by-point trade review"
      ],
      "body": [
        "54 个技术市场重新分页核对：53 个完全匹配；一个聚变市场补回原截止时间内的 1 个有效成交点，历史总数由 12,793 更正为 12,794。不改原截止边界、不用结算值补价，也没有证据确定原遗漏的具体原因。",
        "Of 54 technical markets, 53 matched exactly; one fusion archive was corrected by restoring one qualifying pre-cutoff point, changing the total from 12,793 to 12,794. Original cutoffs remain; settlement values are not substituted and the omission’s cause is undetermined."
      ]
    },
    {
      "title": [
        "移除无交易数据专题",
        "Remove topics without trading data"
      ],
      "body": [
        "从目录和导航移除不对称有机催化、可见光光氧化还原、点击与生物正交、PET 酶解四个文献专题，并清理其专属来源、指标和关联入口。科学预测保留 11 个专题；不再保留文献专题的收录豁免。历史更新日志保留原记录。",
        "Four literature-only topics—asymmetric organocatalysis, photoredox, click/bioorthogonal chemistry and PET enzymes—were removed with exclusive sources, indicators and links. Eleven forecast topics remain, without literature exemptions. Historical release records are preserved."
      ]
    },
    {
      "title": [
        "日期不能自动解释成交",
        "Dates do not establish trade causation"
      ],
      "body": [
        "arXiv 提交日不再作为首次公开日期；DOE 点火页面日期与官方发布会日期不一致，停止生成价差。仅经复核的公开日期可参与比较；日期无时区时排除 UTC±14 小时覆盖的完整时段。修正七日窗口右端多算一个边界时点的问题；邻近成交只描述差异，不作因果归因。",
        "arXiv submission dates are not first-publication dates; conflicting DOE page/conference dates suppress comparison. Only reviewed release dates qualify, excluding the full UTC±14-hour envelope for timezone-unknown dates. The seven-day upper bound is exclusive. Nearby trades describe differences, never causation."
      ]
    },
    {
      "title": [
        "诺奖来源与核验边界",
        "Nobel sources and verification limits"
      ],
      "body": [
        "诺奖 Manifold 的 53 条候选序列与 Kalshi 的 18 条有成交量蜡烛序列已回读匹配。Polymarket 的 30 条候选历史接口返回 403，保留已有价格采样，并在页面显示重新核验未完成。三种平台口径不合并，不把价格采样称为逐笔成交。",
        "Fifty-three Nobel Manifold candidate series and eighteen Kalshi traded-candle series matched source records. Thirty Polymarket candidate history requests returned 403; existing price samples remain with a visible unverified notice. Platform grains remain distinct."
      ]
    }
  ],
  "comparison": [],
  "source": "依据原存档截止时间重新回读公开交易 API；日期依据 arXiv 提交历史、Donut Lab、Google Research、DOE/NNSA 原始页面。核验记录包含未通过与不可回读项，不代表所有来源均已完成在线核验。"
},

{
  "hash": "update-verified-trade-curves",
  "version": "v3.5.13",
  "date": "2026-10-26",
  "image": 0,
  "title": [
    "更多科学事件与真实成交曲线",
    "More scientific events with genuine trade curves"
  ],
  "intro": [
    "新增 13 个有真实成交历史的事件，扩充电池、制氢、碳利用、聚变、量子计算、钙钛矿和药物研发的规则、技术与来源阅读。",
    "Thirteen events with genuine trade histories extend battery, hydrogen, carbon-utilization, fusion, quantum, perovskite and drug-development reading."
  ],
  "sections": [
    {
      "title": [
        "先核对曲线，再收录事件",
        "Verify curves before admission"
      ],
      "body": [
        "新增 13 个 Manifold 二元市场，完整分页后得到 1,782 个有效成交时点；总计 54 个事件、12,793 个 UTC 历史时点。每个新增市场至少有 5 个有效时点，不以初始报价、结算价或插值代替成交。MANA 虚拟积分属性继续明示。",
        "Thirteen Manifold binary markets add 1,782 accepted observations after full pagination, bringing totals to 54 events and 12,793 UTC observations. Each addition has at least five observations; initial quotes, settlement prices and interpolation do not replace trades. MANA remains labelled play money."
      ]
    },
    {
      "title": [
        "扩充已有曲线的专题",
        "Deepen topics that already have curves"
      ],
      "body": [
        "九个专题加入新事件，十个已有曲线的技术专题补充解读。内容包括钠离子可订购价格、中国储能功率、钒与电池级锂供应、核能制氢、专用输氢管线、NIF 靶增益、并行双比特门、商业光伏效率与年出货，以及 AI 工具贡献归因。另补充固态电芯的 A 样耐久测试。",
        "Nine topics receive new events and ten existing curve-backed technical topics gain reading: orderable sodium-ion prices, Chinese storage power, vanadium/battery-grade lithium, nuclear hydrogen, dedicated pipelines, NIF gain, parallel gates, commercial PV and AI-tool attribution, plus solid-state A-sample endurance."
      ]
    },
    {
      "title": [
        "数字保留适用条件",
        "Keep numbers with their conditions"
      ],
      "body": [
        "新增 11 份论文、机构统计和企业原始资料，以及 21 项指标；资料总计 63 份、指标 71 项。区分 GW 与 GWh、V 与 V₂O₅、矿山含锂与电池级 LCE、获批规划与实际投运、靶能量与电站净电量、原子数与门对数、组件纪录与商品效率、燃料销售与设备合同。",
        "Eleven papers/institutional/company sources and 21 indicators bring totals to 63 documents and 71 indicators. GW/GWh, V/V₂O₅, mine lithium/battery-grade LCE, approval/operation, target energy/net electricity, atoms/gate pairs, records/products and fuel/equipment sales remain distinct."
      ]
    },
    {
      "title": [
        "规则缺口与来源状态",
        "Rule gaps and source status"
      ],
      "body": [
        "保留 NIF 百分比定义、量子门 SPAM 裁量、钒产量基数冲突、商业光伏范围和 AI 工具贡献标准等提示。封盘未判定继续保持未判定，cancellation 与 No 分开；价格变化不归因于某一公告，也不合并成技术成功率。",
        "Flags retain ambiguous NIF percentages, quantum SPAM discretion, conflicting vanadium baselines, commercial-PV scope and AI attribution. Closed/unresolved remains unresolved; cancellation is separate from No. Price changes are not attributed to announcements or pooled into technical-success probabilities."
      ]
    },
    {
      "title": [
        "收录门槛与旧资料保留",
        "Admission checks and preserved archives"
      ],
      "body": [
        "发布前校验每个预测至少两个不同的真实成交时点、完整分页、截止边界及收录记录。原有 41 个市场的来源元数据和成交历史以校验摘要保护；既有四个文献专题保留，本轮不新增无曲线专题，也不把无关市场借给文献页。诺奖原有七份年度／平台记录保留。",
        "Pre-publication checks require at least two distinct actual-trade timestamps, complete pagination, cutoffs and reviewed admission. Digests protect all 41 prior source snapshots. Four existing literature topics remain, with no new curve-free topics or unrelated proxy markets; seven Nobel editions are preserved."
      ]
    }
  ],
  "comparison": [],
  "source": "公共 Manifold 只读 API 元数据与完整分页成交记录；技术资料分别链接原始论文、政府/监管机构、实验室及企业公告。企业成本与研发目标分别标注，原始规则的含糊之处保留。"
},
{
  "hash": "update-organic-chemistry-topics",
  "version": "v3.5.12",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "有机化学专题与反应证据",
    "Organic chemistry topics and reaction evidence"
  ],
  "intro": [
    "新增不对称有机催化、可见光光氧化还原、点击与生物正交、PET 解聚四个文献专题，补充反应条件、选择性数据与来源。",
    "Four literature topics add asymmetric organocatalysis, visible-light photoredox, click/bioorthogonal chemistry and PET depolymerization with conditions, selectivity and sources."
  ],
  "sections": [
    {
      "title": [
        "四个有机化学方向",
        "Four organic chemistry directions"
      ],
      "body": [
        "新增四个文献专题、9 个代表反应和 25 项数据：覆盖烯胺与亚胺离子活化、光氧化还原／有机协同催化、染料路线、CuAAC、SPAAC 及 PET 酯键水解与再聚合。每个反应分别列出转化、催化体系、条件摘要、结果、适用范围与原文位置。",
        "Four literature topics add nine reaction cases and 25 indicators covering enamine/iminium activation, dual photoredox, dyes, CuAAC, SPAAC and PET hydrolysis/repolymerization. Each case lists transformation, catalyst, conditions, outcome, scope and source location."
      ]
    },
    {
      "title": [
        "把条件和数值放在同一条记录",
        "Keep values with their conditions"
      ],
      "body": [
        "保留收率、ee、er、exo:endo、实验规模、灯泡功率、酶质量用量、底物形态与预处理差别。Diels–Alder 的 exo 93% ee 不写成非对映比；15 W 灯泡不写成光子通量；PET 投料 g/kg 不擅自换成 g/L。反应与指标均支持带来源的 CSV 下载。",
        "Yield, ee, er, exo:endo, scale, lamp power, enzyme dose, feed morphology and pretreatment remain distinct. Exo 93% ee is not a diastereomer ratio; 15 W is not photon flux; g/kg is not silently converted to g/L. Reactions and indicators export with sources."
      ]
    },
    {
      "title": [
        "文献专题独立标注",
        "Literature topics labelled explicitly"
      ],
      "body": [
        "本轮检索未选入直接对应、规则适当的有机反应预测市场，记录八组公共 API 检索范围。新增专题显示文献数据与反应，不补造概率或成交曲线；原有 41 个事件和 11,011 个 UTC 历史采样保持不变，取消仍与 No 分开。",
        "Eight public-API searches selected no suitable directly matching organic-reaction contracts. New topics show literature evidence without invented probabilities; the existing 41 events and 11,011 UTC observations remain unchanged, with cancellation separate from No."
      ]
    },
    {
      "title": [
        "来源与产业状态",
        "Sources and project status"
      ],
      "body": [
        "新增 13 份原始论文与官方资料，资料总数增至 52 份；专题共 15 个，指标共 50 项。论文时期机构与任职地点分别核对；CARBIOS 50 kt/年保留为历史项目目标，并附后续报告中的暂停建设记录，不称为当前实测产量或最新施工状态。",
        "Thirteen papers/official documents bring sources to 52, topics to 15 and indicators to 50. Historical affiliations are checked. CARBIOS 50 kt/year remains a historical project target, with a later suspension record, not measured output or the latest construction status."
      ]
    },
    {
      "title": [
        "有机化学入口与核查",
        "Organic chemistry navigation and review"
      ],
      "body": [
        "目录增加有机化学筛选，连到四个新专题和已有药物化学；文献页不显示空市场筛选。构建时检查双语反应字段、指标与反应的来源关联、编号唯一性及文献／市场类型，修复连续切换专题时反应与数据区重复的问题，保留手机与深色排版。",
        "An organic filter connects four new topics and existing medicinal chemistry; literature pages omit empty market filters. Build checks validate bilingual cases, source joins, unique identifiers and literature/market types, fixing duplicate reaction/data sections during consecutive topic navigation and preserving phone/dark layouts."
      ]
    }
  ],
  "comparison": [],
  "source": "依据本轮核读的原始论文、作者机构公开 PDF、诺奖官方科学背景及企业历史文件整理；仅为文献条件摘要，不把底物范围端点拼成单一最佳纪录，不提供无来源市场概率。"
},
{
  "hash": "update-battery-chemistry-data",
  "version": "v3.5.11",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "电池体系扩充与化学专题数据",
    "Expanded battery chemistries and source-backed chemistry data"
  ],
  "intro": [
    "新增钠离子、动力电池与规模储能、清洁制氢及 AI 药物研发四个专题，补充真实市场历史与带条件的关键数据。",
    "Four new topics cover sodium-ion batteries, EV/grid storage, clean hydrogen and AI drug discovery, with actual market histories and scoped indicators."
  ],
  "sections": [
    {
      "title": [
        "从固态延伸到更多电池体系",
        "More battery chemistries"
      ],
      "body": [
        "电池部分新增 9 个市场，三个电池专题共收录 19 个事件：固态电池、钠离子，以及动力电池与规模储能。内容覆盖 Naxtra 客户交付、LFP 出货份额、凝聚态单体比能量、整包成本、并网储能能量与钒液流用料。",
        "Nine markets expand the three battery topics to 19 events, covering sodium-ion delivery, LFP shipments, condensed cells, pack cost, grid-storage energy and vanadium-flow materials."
      ]
    },
    {
      "title": [
        "化学研究与实际判定",
        "Chemistry and contract conditions"
      ],
      "body": [
        "新增清洁制氢与电解水、AI 药物研发与临床验证，扩充永久碳移除阅读。原题中的 2030／2031 年目标差异、LFP >65%／≥65% 冲突、非锂与钠离子商品范围、药物名称及临床／批准条件分别说明；平台取消仍独立于 No。",
        "Clean hydrogen/electrolysis and AI drug discovery/clinical validation join expanded permanent-removal reading. Timing, LFP threshold conflicts, sodium/non-lithium product scope, drug names and clinical/approval conditions remain distinct; cancellation stays separate from No."
      ]
    },
    {
      "title": [
        "关键数据可回到来源",
        "Indicators linked to their sources"
      ],
      "body": [
        "六个专题加入 25 项关键数据，逐项列明数值、年份或报告日期、适用条件及来源。实验测量、机构统计、模型估计、企业披露、在建规模和研发目标分开标注；支持下载指标与来源 CSV。药物试验保留主要与次要终点、样本量、随访和利益关系信息。",
        "Six topics gain 25 indicators with values, reference periods, conditions and sources. Measurements, statistics, models, company claims, construction and targets are labelled, with source-linked CSV export. Clinical reading retains endpoint hierarchy, sample, follow-up and interests."
      ]
    },
    {
      "title": [
        "市场与资料覆盖",
        "Market and source coverage"
      ],
      "body": [
        "全站科学预测共 11 个专题、41 个技术事件、11,011 个真实成交后采样与 39 份原始资料。本轮只新增 16 个市场的公共 API 快照，保留此前 25 个事件历史。专题显示成交覆盖日期、采样和来源数量、参与较少及规则提示；UTC 日期与原始规则继续可查。",
        "Science Forecasts now contains 11 topics, 41 technical events, 11,011 actual post-trade observations and 39 primary sources. Sixteen new API snapshots preserve the previous 25 histories. Topic coverage shows dates, counts, thin participation and rule flags, with UTC dates and original rules."
      ]
    },
    {
      "title": [
        "更方便查阅电池与化学资料",
        "Finding battery and chemistry reading"
      ],
      "body": [
        "专题目录增加电池与储能、化学与材料筛选，电池工作台之间提供相关专题入口。新增机构沿用官方标识和低强调国旗；国际能源署国旗注明秘书处所在地。市场曲线继续放在正文前部。",
        "Directory filters surface batteries/storage and chemistry/materials, with links among battery workbenches. New institutions use official marks and restrained flags; IEA identifies secretariat location. Market histories continue to lead topic reading."
      ]
    }
  ],
  "comparison": [],
  "source": "依据本轮只读获取的 Manifold 公共 API、CATL、DOE、EIA、IEA、FDA、原始论文与项目公告编写。市场与技术资料独立引用；不是实时行情，不把企业主张、目标或模型估计写成实测结果。"
},
{
  "hash": "update-science-topic-expansion",
  "version": "v3.5.10",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "科学预测扩充与阅读顺序调整",
    "More science topics and a history-first reading order"
  ],
  "intro": [
    "新增聚变发电、量子纠错计算和钙钛矿光伏专题；市场曲线置顶，扩写企业和机构公告，并将顶部操作简化为明暗切换。",
    "Added fusion power, quantum error correction and perovskite photovoltaics; histories lead, announcements are expanded and the header has one theme switch."
  ],
  "sections": [
    {
      "title": [
        "先看市场曲线",
        "Market history first"
      ],
      "body": [
        "专题页新增可切换事件的历史曲线；事件详情按市场历史、技术与判定、企业和机构公告、参考资料、相关事件排列，目录同步调整。图表沿用真实 UTC 日期、逐笔查看及 CSV 下载。",
        "Topic pages add selectable event histories. Event reading follows history, technology and criteria, announcements, references, then related events, with matching contents. Charts retain real UTC dates, observation inspection and CSV exports."
      ]
    },
    {
      "title": [
        "七个专题与真实市场",
        "Seven topics with actual markets"
      ],
      "body": [
        "新增三个专题及六个 Manifold 原始市场，技术事件共 25 个，真实历史采样共 8,051 个。新事件单独收录，原有 19 个事件快照保留。缺少规则、统计分母不清、成交稀疏和停盘未判定均明确标注；取消仍独立于 No。",
        "Three topics and six Manifold source markets bring the archive to 25 technical events and 8,051 actual observations. Original 19-event snapshots are preserved. Missing definitions, ambiguous denominators, thin trading, closed unresolved records and cancellation remain visible."
      ]
    },
    {
      "title": [
        "更完整的公告与专题解读",
        "Expanded announcements and background"
      ],
      "body": [
        "原始资料从 21 份增至 27 份，新增 DOE、Helion、Google Quantum AI 与 Oxford PV 资料。扩写十份既有资料，并为六个技术专题补充双语解读。采购协议、制造产能、首批出货和实验结果各按原文范围说明，目标年份不写成已完成交付。",
        "Primary sources increase from 21 to 27, adding DOE, Helion, Google Quantum AI and Oxford PV. Ten existing entries are expanded and six technical topics gain bilingual background reading. Agreements, capacity, first shipments and experimental results retain their stated scope; targets are not reported as completed delivery."
      ]
    },
    {
      "title": [
        "机构标识与顶部操作",
        "Institution cues and header controls"
      ],
      "body": [
        "24 家相关机构和企业补充小尺寸国旗，按机构所在地或企业总部标注，并记录归属依据。顶部删除设置与搜索，保留一个明暗切换按钮及主题记忆；科学预测阅读页同步适配深色背景。“把相近的问题放在一起读”等标题改为简洁的栏目名称。",
        "Small flags accompany 24 institutions and companies, with location or headquarters basis recorded. Settings and search give way to one persistent theme switch; science forecast pages support dark backgrounds. Conversational headings are replaced with concise section names."
      ]
    },
    {
      "title": [
        "个人致谢与同意说明",
        "Personal acknowledgements and consent"
      ],
      "body": [
        "个人致谢在原 03 与机构列表之间加入 Michael Li（HKU，UI 设计建议）及 Wilson（UCL，美学建议），保留机构标识与官网链接；明确个人姓名和相关致谢内容均经当事人同意，机构信息不代表背书。",
        "Added Michael Li (HKU, UI design feedback) and Wilson (UCL, aesthetic feedback) after personal entry 03 and before the institutions, with institution marks and official links. The consent notice covers personal names and acknowledgements without implying institutional endorsement."
      ]
    }
  ],
  "comparison": [],
  "source": "依据 Manifold 公共 API 新增快照、保留的历史存档及所列原始机构资料编写；不是实时行情，不新增推断成交或自行判定原市场。"
},
{
  "hash": "update-market-evidence-structures",
  "version": "v3.5.9",
  "date": "2026-10-25",
  "image": 0,
  "title": [
    "把企业进展、市场历史与科学结构连起来",
    "Connect company progress, market history and scientific structures"
  ],
  "intro": [
    "全部技术事件补充企业与证据说明，历史曲线改用真实日期和可查明细；年度解读加入来源可核对的分子结构与明确标注的示意图。",
    "Every technical event gains company/evidence reading. Histories use real dates and inspectable observations; annual readings add source-linked molecular structures and labelled schematics."
  ],
  "sections": [
    {
      "title": [
        "每个事件都能继续查证",
        "Make every event inspectable"
      ],
      "body": [
        "19 个技术事件逐项补齐预测对象、判定条件、三项核对清单、技术解释与产业影响路径。资料扩充为 21 份原始来源，包含论文、检测报告、产品资料和企业公告，参考条目保留机构、来源链接及可用的 DOI。",
        "All 19 technical events gain specific questions, conditions, three-item checklists, technical explanations and industry pathways. Twenty-one primary sources cover papers, tests, products and announcements, with institutions, links and available DOIs."
      ]
    },
    {
      "title": [
        "把企业动作对到市场条件",
        "Map company actions to contract conditions"
      ],
      "body": [
        "企业与市场放在事件正文前部：说明检测、材料、产线、样品、客户认证和交付分别触及哪道门槛。公开日期附近仅使用真实成交作日期级对照；报告日期不冒充公开日期，缺少近邻成交不补价，价格变化不写成因果结论。",
        "Company evidence leads the event reading, distinguishing tests, materials, lines, samples, qualification and delivery. Date-level comparisons use real nearby trades; report dates are not assumed public dates, missing prices stay missing and differences do not establish causation."
      ]
    },
    {
      "title": [
        "从曲线读到具体成交",
        "From a curve to actual trades"
      ],
      "body": [
        "历史图显示真实 UTC 日期、首末笔涨跌、最低最高值、采样数量与最大成交间隔。支持近期／自定日期、最后成交或存档基准、明确标注的纵轴放大、键盘逐笔查看、分页明细和当前窗口 CSV 下载。",
        "Histories show UTC dates, first-to-last change, extremes, counts and gaps. Recent/custom windows, last-trade/archive anchors, labelled vertical zoom, keyboard inspection, paginated data and scoped CSV exports remain tied to actual observations."
      ]
    },
    {
      "title": [
        "结构就在解释旁边",
        "Structures beside the explanation"
      ],
      "body": [
        "67 类年度概念与 10 类市场技术解释接入结构图。根据公开分子记录核对连接、分子式和立体化学，R／S 香芹酮并列展示；拓扑示意与计算构象单独标注，不杜撰晶胞、蛋白原子坐标或企业配方。",
        "Sixty-seven annual concepts and ten market contexts gain figures. Recorded graphs, formulas and stereochemistry are checked, including paired R/S carvone. Schematics and computed conformers are labelled; unit cells, protein coordinates and proprietary formulations are not invented."
      ]
    },
    {
      "title": [
        "来源与缺口一同保留",
        "Keep sources and gaps visible"
      ],
      "body": [
        "新增机构与企业标识、PubChem 致谢及 RDKit 构建期工具许可说明。发现并补标 Toyota 原题期限与 API 停盘字段差异；同类市场分开比较，保留稀疏历史、取消及规则冲突。",
        "Additional institution/company marks, PubChem attribution and RDKit build-time licensing accompany a newly flagged Toyota deadline/close-field discrepancy. Related contracts retain separate scopes, sparse histories, cancellation and rule conflicts."
      ]
    },
    {
      "title": [
        "补齐手机端与英文核查",
        "Complete phone and English checks"
      ],
      "body": [
        "补齐中英文手机端核查，确认结构放大与历史表格在各自区域滚动；修复年度企业资料的重复来源入口，保留不同文献并连续编号。",
        "Completed Chinese/English phone checks for locally scrolling enlarged structures and trade tables; duplicate annual company-source links are removed while distinct references retain consecutive numbering."
      ]
    }
  ],
  "comparison": [],
  "source": "依据本轮已核对的公开资料、真实成交存档与结构记录编写；结构示意、资料公开节点与市场反应的边界分别标明。"
},
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
