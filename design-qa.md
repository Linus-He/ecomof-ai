# EcoMOF-AI 设计验收记录

**Findings**

- 当前无可执行的 P0、P1 或 P2 问题。
- 定向浏览器验收覆盖首页入口、中文导航、设置菜单、联系方式弹窗、生态筛选确认逻辑、物化性质弹窗、MOF 库属性查询、正式合规页面、版本日志及移动端历史沿革。
- 浏览器控制台无应用错误。记录到的外部资源失败仅包括 Cloudflare Insights 在本地环境被拦截、公开结构目录缺失 `search.json`，以及切换结构时被正常中止的旧 CIF 请求；均未阻断本次核心流程。

## 对照目标与环境

- source visual truth paths:
  - `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_3qhW8v/截屏2026-07-29 19.13.07.png`
  - `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_s341To/截屏2026-07-29 19.16.10.png`
  - `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_k8N2gY/截屏2026-07-29 19.17.28.png`
  - `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_8SG6aj/截屏2026-07-29 19.25.18.png`
  - `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_XByrkF/截屏2026-07-29 19.33.12.png`
- implementation URL: `http://127.0.0.1:4173/ecomof-ai/`
- implementation screenshot paths:
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/home-entry-grid.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/navigation-chinese-centered.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/ecoscreen-before-confirmation.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/physicochemical-property-modal.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/mof-library-property-search.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/data-compliance-formal.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/project-evolution-history.png`
  - `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/project-evolution-history-mobile.png`
- desktop CSS viewport: `1440 × 1100`
- deviceScaleFactor: `1`
- implementation pixel dimensions: `1440 × 1100` for full-page captures; focused screenshots retain their measured component size at 1× density.
- source pixel dimensions:
  - 首页入口参考：`1182 × 268`
  - 生态筛选搜索栏参考：`2160 × 100`
  - 生态筛选静态材料参考：`930 × 562`
  - 导航参考：`1244 × 78`
  - CCDC 合规参考：`2234 × 1240`
- density normalization: 源图与实现图均按 1× 像素密度并排排版；不同宽度的源图按内容区域等比缩放，不用像素差异判断字体抗锯齿。
- state: 中文、浅色主题、桌面宽度；另对历史沿革使用移动端窄宽状态。

## Full-view comparison evidence

- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-home-entry-grid.png`
- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-navigation.png`
- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-ecoscreen-empty-state.png`
- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-property-dialog.png`
- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-compliance-formality.png`
- `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/compare-removed-compliance-card.png`

## Focused region comparison evidence

- 首页六入口：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/home-entry-grid.png`
- 中文导航与齿轮设置：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/navigation-chinese-centered.png`、`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/settings-menu.png`
- 生态筛选确认前后：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/ecoscreen-before-confirmation.png`、`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/ecoscreen-after-confirmation.png`
- 物化性质弹窗：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/physicochemical-property-modal.png`
- MOF 库属性与结构联动：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/mof-library-property-search.png`
- 历史沿革移动端：`/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/project-evolution-history-mobile.png`

## Required fidelity surfaces

- Fonts and typography: 保留项目既有中文优先字体栈与层级；按钮、标题、正文、表格标签均使用稳定字重和行高。合规条款没有混入日期式自我声明，首页简介压缩为中文两行内表达。
- Spacing and layout rhythm: 首页入口为严格 3×2 网格；导航中间轨道独立于左右工具区；合规页面改用平整章节、编号条款和凭证表格；移动端历史沿革未发生横向溢出。
- Colors and visual tokens: 使用既有蓝灰科学产品色板；入口按钮改为实体表面；数据基础区上边界被弱化；合规页面避免玻璃效果与玩具化卡片。
- Image quality and asset fidelity: 参考界面没有要求新增照片、插画或品牌图像；实现未用伪造图片或手绘 SVG。界面图标来自项目现有 Phosphor 图标库，搜索图标不再使用文本符号。
- Copy and content: 六个入口顺序和文字准确；合规正文为 43 条编号条款、9 项授权凭证及原文链接，并保留来源登记。未在合规页面展示 QMOF 或旧的 `ECOMOF-DCP-001` 控制说明卡。
- Icons, interactions, accessibility: 齿轮、搜索、关闭等均为语义图标；弹窗支持明确关闭按钮、Esc 与点击遮罩关闭；未确认材料时不渲染静态结果；交互控件具备可读标签和禁用状态。

## Comparison history

### Iteration 1

- Earlier finding: 浏览器验收发现项目状态摘要请求三个过期或重复端点，产生本地 404，属于 P2 控制台噪声。
- Fix: 从项目状态聚合器移除 `benchmarkReportV2`、`modelCredibilityV2`、`experimentalLabelSummary` 三个失效请求，保留现有轻量模型稳健性与增长数据源。
- Post-fix evidence: `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/summary.json` 中 `consoleErrors` 为空，核心流程无本地资源错误。

### Iteration 2

- Earlier finding: 在 MOF 库物化性质搜索选择 UiO-66 后，结构工作台仍显示 ABADUG，候选下拉保持展开，属于 P1 数据与视觉状态不同步。
- Fix: 将属性记录的 CSD Refcode 同步到公开结构目录选择，并在已选查询与选中标签一致时收起候选列表。
- Post-fix evidence: `/Users/linushe/Desktop/ecomof-ai/test-results/final-ui-qa/mof-library-property-search.png` 同时显示 UiO-66 属性和对应结构侧栏，候选列表已关闭。

## Primary interactions tested

- 首页六入口顺序、3×2 布局、实体表面与路由。
- 齿轮设置菜单、语言二级菜单、主题二级菜单、联系我们入口。
- 联系方式弹窗显示 `ecomofai@outlook.com` 并可关闭。
- 生态筛选确认前空状态、确认后结果展示、物化性质弹窗与关闭。
- MOF 库物化性质搜索、候选选择、结构与属性侧栏联动。
- 合规条文、授权凭证、来源登记、发布方原文链接及被删除模块。
- v1.0.10 更新日志、非空历史沿革与移动端布局。

**Open Questions**

- 无阻断项。外部公开结构目录当前有个别可选资源缺失，但本地物化性质索引和核心交互均正常；该外部服务问题不属于本次设计差异。

**Implementation Checklist**

- [x] 完成源图与实现的同屏对照。
- [x] 修复 P2 本地控制台请求噪声。
- [x] 修复 P1 MOF 属性与结构选择不同步。
- [x] 复测桌面、弹窗、空状态和移动端历史沿革。
- [x] 检查字体、间距、颜色、资产、文案、图标、交互与可访问性。

**Follow-up Polish**

- 当前无必须保留的 P3 项。

final result: passed
