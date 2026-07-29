# Design QA

## 既有产品基线

- Navigation: one-row alignment, equal spacing, compact horizontal scrolling, language/theme actions visible.
- EcoScreen: explicit search confirmation, editable inputs, material-specific LCA/LCC conclusions, source boundary retained.
- GasSep: material-specific conclusions and method-specific selectivity/capacity/regenerability formulas.
- MOF Library: readable candidate labels, source IDs restricted to provenance, unified evidence coverage retained.
- Formula audit: Pareto, CRITIC, histogram, descriptor radius, LCA service allocation, Spearman, and evolution normalization checked against implementation.
- Responsive/theme: 390 px mobile without horizontal overflow; light and dark modes checked.
- Verification: typecheck, 778 tests, production build, JSON parse, and diff check passed. Browserless visual fallback passed; interactive in-app review completed separately.

## CSD 结构工作台

## 对照范围

- 参考：用户提供的 MOF Anatomy / NPF-500 详情页截图。
- 实现：MOF 候选库中的“晶体结构与配位多面体”工作台。
- 最终同图对照：`mof-anatomy-audit/20-design-comparison-final.png`。
- 桌面实现快照：`mof-anatomy-audit/19-ecomof-workbench-final.png`。

## 结构一致性

- 保留参考页最重要的“左侧属性、右侧三维结构、查看器顶部控制”构图。
- 将 Fragment、Polyhedra、Depth 三项控制对应落地为结构片段、多面体和景深范围。
- 将普通属性列表升级为来源、CSD Refcode、许可、金属、拓扑与连接体的可审计字段。
- 未获得授权 CIF 时保持许可空态；本地 CIF 仅在浏览器会话内解析。

## 视觉与交互复核

- 通过：桌面端双栏层级、留白、边界、标题密度与控制对齐。
- 通过：390 px 移动端改为纵向信息流，查看器与工具栏无横向溢出。
- 通过：本地 CIF 加载、晶胞、自动配位多面体、原子/金属/多面体统计。
- 通过：15,906 条 CSD MOF 公共目录按 Refcode、分子式、金属检索，并按需加载单个 CIF。
- 通过：跨晶胞边界的金属—供体近邻使用最小镜像重建，多面体不会因 P1 晶胞边界被系统性截断。
- 通过：多面体不透明/半透明/关闭，完整晶胞/自动配位簇，景深键盘控制，旋转/暂停与重置。
- 通过：无控制台 error 或 warning。
- 通过：`prefers-reduced-motion` 下停止加载旋转动画。
- 通过：250 个测试文件 / 815 项测试以 4 个工作线程全量通过，TypeScript 与生产构建通过。

## 已修复问题

- P1：全局 `appearance: none` 使景深滑杆轨道不可见；已补齐 WebKit/Firefox 轨道与滑块样式。
- P2：中等桌面宽度下标题操作区过于贴近右边界；已在 1320 px 以下切换为上下排布。
- P2：原生 range 键盘事件在自动化环境未更新；已显式支持方向键并限制在 1–10。
- P1：只用晶胞内直线距离会漏掉周期边界上的配位原子；已从 CIF 晶胞参数构造晶格向量并对 27 个相邻镜像取最短距离。

## 剩余边界

- QA 中的 ZrO6 CIF 是合成测试夹具，只验证渲染和多面体算法，不作为数据库记录发布。
- 公共数据仓库仅用于非商业开放研究，CIF 与派生索引遵循 CC BY-NC-SA 4.0；主程序代码与数据许可证分离。
- 拓扑、连接体命名和论文 DOI 不在 CSD MOF Collection 当前元数据中，界面明确显示“该集合未提供”，不自动臆测。

## CSD 全量命名接入

### 对照输入与实现路径

- 参考输入：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_0JgNPM/截屏2026-07-27 22.12.01.png`。
- 实现页面：`src/components/mof-structure/MofStructureWorkbench.tsx` 与 `src/components/mof-structure/MofStructureWorkbench.css`。
- 数据与命名层：`src/services/csdMofPublicService.js`、`src/utils/mofNaming.mjs`、`src/data/csdCommonAliases.json`。
- 桌面快照：`design-qa-artifacts/csd-naming/desktop-full.png`，2168 × 1224 CSS 视口。
- 移动端快照：`design-qa-artifacts/csd-naming/mobile-390.png`，390 × 844 CSS 视口。
- 最终同图对照：`design-qa-artifacts/csd-naming/reference-comparison.png`。

### 对照结论

- 保留参考卡片中“名称为第一层、金属类别/家族/年份为辅助层”的阅读顺序。
- 对 15,906 条 CSD MOF 逐条生成唯一且可复算的 `EcoMOF-<金属>-<Refcode>` 平台规范名，并与原始 Refcode、CIF 路径一一绑定。
- 已核验的文献常用名优先显示，例如 UiO-66 对应 RUBTAK、RUBTAK01、RUBTAK02；未核验 Refcode 的 NTU-68、Al(L2) 等名称只进入名称档案，不猜测结构。
- 搜索统一处理连字符、空格、括号和 Unicode 下标；已验证 `UiO-66`、`NTU68`、`Al L2` 三类入口。
- 身份未映射状态明确显示“名称已接入，结构映射待核验”和“不以相似分子式推断结构”，同时保留本地 CIF 降级入口。
- 390 px 移动端 `scrollWidth ≤ innerWidth`，名称目录、属性栏和三维结构入口无横向溢出。
- 浏览器控制台无 error 或 warning；脚本化视觉检查因本地端口权限使用 browserless fallback，但独立的应用内浏览器交互与截图验收已通过。

### 设计 QA 修订记录

- P1：原方案只覆盖少量示例名，无法满足“全部现有记录都有名称”；已改为全量平台规范名，并把文献名作为有证据的覆盖层。
- P1：相似分子式可能造成错误结构绑定；已禁止推断式映射，未核验名称进入 identity-only 状态。
- P2：搜索未统一 Unicode 下标、括号与连字符；已使用 NFKC 归一化和标点折叠。
- P2：原 5.86 MB 单体索引首屏过重；已拆为 2.48 MB 搜索索引与 214 个前缀详情文件。
- P3：参考图卡片可显示家族和年份，但 CSD 原始集合并不为全部记录提供这些字段；已只在有来源的别名档案中展示，避免伪造完整度。

final result: passed

## v1.0.9 生态筛选、首页、数据合规与项目沿革修复

### 设计依据与同图对照

- 首页入口参考：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_CEdUA6/截屏2026-07-29 12.55.28.png`，1186 × 354。
- 首页文案参考：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_ufybV2/截屏2026-07-29 13.29.20.png`，1170 × 196。
- 历史沿革缺陷参考：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_YgQqON/截屏2026-07-29 13.43.32.png`，2094 × 1090。
- 实现快照：`/private/tmp/ecomof-home-final.png`、`/private/tmp/ecomof-ecoscreen-final.png`、`/private/tmp/ecomof-compliance-final-top.png`、`/private/tmp/ecomof-compliance-final-credentials.png`、`/private/tmp/ecomof-project-evolution-final.png`，均为应用内浏览器 1037 × 717 输出。
- 同图对照：`/private/tmp/ecomof-home-design-comparison.png`、`/private/tmp/ecomof-history-design-comparison.png`；参考与实现统一归一到 1186 px 宽度后检查。
- 桌面 CSS 视口为 1274 × 720；窄屏另以 390 × 844 验证。浏览器快照像素密度由应用内浏览器缩放决定，尺寸差异不作为布局缺陷。

### 参考差异与有意调整

- 入口按钮保留参考图的冷灰蓝边界、轻阴影、低圆角和中性文字层级；根据用户明确要求，从参考图四个同排改为上三下二，并将按钮改为纯中文名称。
- 旧版中英混合三行总述按用户要求改为纯中文；桌面端实测一行，390 px 窄屏实测两行。
- 历史沿革参考图中的窄列逐字换行和大片空白属于明确缺陷；实现将档案样式限制到直接子级，并默认展开历史内容，不追求该错误状态的像素一致。

### 桌面布局与交互

- 首页五个入口实测为：上排 210 / 210 / 210 px，下排 320 / 320 px；标签顺序为生态筛选、气体分离、催化、数据合规承诺、联系我们。
- 首页正文不直接出现邮箱；点击“联系我们”后弹出 `role="dialog"`，邮箱只在弹窗内显示，关闭按钮可用。
- 生态筛选初始不挂载旧版兼容工作台；展开耗时约 259 ms，随后反应筛选面板和 9 个筛选控件均可操作。
- 数据合规页实测渲染 43 条控制条文、10 项授权凭证或缺口；来源登记仍存在，不含“截至某年已全面合规”的自我认证句式。
- 项目沿革统一版本中心可选择 v1.0.0 至 v1.0.9；逐项切换 v1.0.6、v1.0.7、v1.0.8、v1.0.9 后，对应模块页签和本轮关键内容均正确显示。
- 历史沿革默认展开，显示 38 个原始版本和 5 个模块分组；V3.10.1、日期与历史说明可见。

### 响应式、可访问性与视觉检查

- 390 px 首页仍保持上三下二：上排按钮各 113 px，下排各 175 px；总述为两行，页面 `scrollWidth === clientWidth`。
- 390 px 数据合规页继续显示全部 43 条条文和 10 项凭证，页面无横向溢出。
- 390 px 项目沿革页历史面板保持展开，5 个模块卡片改为单列，页面无横向溢出。
- 入口与历史折叠均使用原生 button / details / summary；联系弹窗带 dialog 语义和可访问关闭名称。
- 最终应用内浏览器控制台无 warning 或 error。

### 已修复问题

- P0：EcoScreen 旧版全量评分在 9,835 条记录上产生高成本重复查找并冻结渲染器；改为默认不挂载、96 条确定性兼容样本和映射索引。
- P1：首页入口未满足上三下二、名称不统一、联系方式直接暴露风险；改为精确五入口和按需联系方式弹窗。
- P1：数据合规页存在概括性、自我认证式表达；改为 43 条控制、10 项凭证或缺口、原文链接和明确停止条件。
- P1：`.project-evolution-archive summary` 等后代选择器误伤嵌套历史面板；改为直接子级选择器，恢复完整历史内容。
- P2：近期 v1.0.6–v1.0.8 发布范围缺失；补录四轮详细模块日志，并使当前版本统一为 v1.0.9。

final result: passed

## CSD 索引、结构框与侧栏体验优化

### 对照与验收材料

- 用户问题截图：侧栏遮挡、UiO-66 重复结果、DUT-68 / NTU-68 无结构、输入框双层蓝框与 `EcoMOF-*` 公开命名。
- 桌面最终快照：`design-qa-artifacts/csd-index-sidebar-v2/desktop-workbench.jpg`，1600 × 1100 CSS 视口。
- 移动端最终快照：`design-qa-artifacts/csd-index-sidebar-v2/mobile-390.jpg`，390 × 844 CSS 视口。
- 同图对照：`design-qa-artifacts/csd-index-sidebar-v2/reference-comparison.jpg`。

### 已解决

- P1：UiO-66 的 RUBTAK / RUBTAK01 / RUBTAK02 不再平铺为三个同名结果，而是合并为一个结构家族，并在侧栏中提供结构变体选择。
- P1：`DUT-` 不再误命中 DAMDUT、DUTJUZ、HEFDUT、IDUTAF 等 Refcode 子串；命名系列查询只返回真实的 DUT 常用名档案。
- P1：公开展示名称不再使用内部 `EcoMOF-*` 稳定标识；有文献常用名时显示常用名，其余显示专业 CSD Refcode。
- P1：DUT-68 已核验到 CCDC 902900 / CSD XICYUF；因不在当前 15,906 条公开 MOF 子集中，保持真实空态并提供 CCDC、论文与本地 CIF 入口。
- P1：NTU-68 的论文与补充材料已核验，但公开记录未暴露可自动接入的 CSD 沉积号或 CIF，因此保持名称档案与结构文件分层，不加载替代结构。
- P2：属性侧栏支持鼠标拖动、方向键、Home / End 与双击复位；侧栏从 336 px 调至 384 px 时，结构舞台与画布同步从 1065 px 缩至 1017 px。
- P2：侧栏改为“结构身份 / 组成与晶体 / 来源与许可”三组卡片；`pending`、`unknown` 等内部占位值不再作为科学属性显示。
- P2：搜索输入只保留外层 `focus-within` 状态，清除了被全局样式叠加的输入框内层蓝色描边。
- P2：390 px 移动端隐藏拖拽条并切换为单列；`scrollWidth = clientWidth`，三维画布宽度 358 px，无横向溢出。

### 回归验证

- CSD 搜索、命名、目录服务与结构工作台：4 个测试文件、22 项测试通过。
- 全量 Vitest 回归通过；独立性能守卫在单工作线程下复核通过。
- TypeScript、生产构建与 `git diff --check` 通过。
- 脚本化视觉检查因受限环境端口 `listen EPERM` 使用 browserless fallback 并通过；应用内浏览器另行完成了桌面、移动端和真实交互验收。

final result: passed

## 数据合规、首页与有机酸体验优化

### 本轮范围

- 重设计数据合规整页，保留 EcoMOF-AI 既有的白底、冷灰蓝边界和低圆角设计语言。
- 首页在 Organic Acid 后新增数据合规入口，并删除“当前能力状态”卡片区。
- 删除有机酸旧版目标 / demo 状态模块；重排执行链边界、步骤标识、输入输出图和最终结果区。
- 将 HGCPS 雷达 / 玫瑰图替换为可交互的横向因子贡献谱；将验证覆盖圆环替换为线性覆盖概览。
- 审计有机酸可见文案，移除“论文级”、版本主导和开发者说明式表述。

### 对照输入

- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_uFMH5q/截屏2026-07-28 16.51.02.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_WGNbYI/截屏2026-07-28 16.52.43.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_GXelPC/截屏2026-07-28 16.53.09.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_96TSpM/截屏2026-07-28 16.53.56.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_b9zx5l/截屏2026-07-28 16.54.41.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_5RS6Bv/截屏2026-07-28 16.55.29.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_9y3NA5/截屏2026-07-28 16.56.40.png`

### 实现快照与同图对照

- 数据合规：`design-qa-assets/database-compliance-desktop.png`
- 首页：`design-qa-assets/home-desktop.png`
- 有机酸顶部：`design-qa-assets/organic-acid-top-desktop.png`
- 输入输出布局：`design-qa-assets/organic-acid-objective-desktop.png`
- HGCPS：`design-qa-assets/organic-acid-hgcps-desktop.png`
- 最终结果响应式状态：`design-qa-assets/organic-acid-final-responsive.png`
- 同图对照：`design-qa-assets/compare-home.png`、`compare-organic-acid-top.png`、`compare-organic-acid-objective.png`、`compare-hgcps.png`

同图复核确认：首页入口顺序正确且能力卡片区已删除；有机酸不再显示旧 demo 目标区；原先单字竖排与圆形警告节点已经消失；HGCPS 完整显示双语因子名称、归一化条形、风险色和对照标记。

### 视口、状态与交互

- 应用内浏览器：1280 × 720。
- 合规页：默认状态与“有限接入”筛选状态。
- 首页：入场动画完成后四个主入口均可见。
- 有机酸：访问已授权；检查 Step 0 与 Final Result。
- Final Result 实测内容宽度 532 px，`clientWidth === scrollWidth`，无横向溢出。
- 首页“进入数据合规”可跳转到 `#database-compliance`。
- “有限接入”筛选设置 `aria-pressed="true"` 并只保留对应来源。
- 合规联系链接为 `mailto:ecomofai@outlook.com`。
- 当前结果视图共渲染 32 个可交互因子项；点击后会打开因子证据明细。
- 验收流程中浏览器控制台无运行时 error。

### 自动验证

- 聚焦 UI：28 项通过。
- 全量 Vitest：253 个文件、825 项通过。
- TypeScript、生产构建与 `git diff --check` 通过。
- 视觉脚本的静态 dist fallback 通过；由于沙箱阻止 Vite 预览端口和 Playwright 启动，该 fallback 不作为视觉通过证据，视觉结论来自上述应用内浏览器截图、测量和交互。

final result: passed
