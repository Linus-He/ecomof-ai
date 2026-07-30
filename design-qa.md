# Design QA — 首页连续画布、无胶囊控件与方法论重构

## 参考截图

- 首页区块标签胶囊：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_yEz7Ra/截屏2026-07-30 14.40.56.png`
- 筛选情景胶囊：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_0zuitc/截屏2026-07-30 14.41.07.png`
- 需要删除的方法论 GitHub 横幅：`/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_KGK6my/截屏2026-07-30 14.41.56.png`

## 前后对照

- 首页同视口前后对照：`qa/compare-home-immersion.png`
- 方法论同画布前后对照：`qa/compare-methodology-rework.png`
- 调整后首页：`qa/audit-after-home.png`
- 调整后方法论：`qa/audit-after-methodology.png`

对照结果显示：首页首屏与数据基础之间的空白缩短，数据基础外框和阴影被移除，内层卡片边界降为低对比度；六个入口按钮和导航控件不再使用胶囊轮廓。方法论删除了 GitHub 宣言横幅，目录改成 01–10 的扁平左导轨，并恢复文献灵感来源入口。

## 内容与交互检查

- 方法目录顺序为：平台总览、MOF库、EcoScreen、气体分离、催化、有机酸筛选、当前有机酸方法、共享证据 / 来源、文献灵感来源与采用边界、限制与验证路线。
- 桌面目录继续支持 220–440 px 拖动调宽；活动项以左侧蓝线和低对比底色表示，不使用胶囊卡片。
- 文献来源动态读取 `methodology_literature_inspiration_records.json`，显示六个分类、34 条来源、30 条已核验 / 官方记录和三条待补元数据记录。
- 点击“文献灵感来源与采用边界”可滚动到目标区块；点击“GasSep 吸附与过程指标”等分类会切换来源内容并更新 `aria-pressed`。
- 每个方法分组均新增五段逐项实现说明：研究对象与目的、输入与进入条件、执行与中间状态、结果与页面呈现、核查依据与停止条件。
- 每个模块架构条目均新增执行链、字段与审计、页面行为；每个算法步骤均新增身份、单位与来源前置约束。
- 截图 3 所示“把方法写清楚，方便别人核对”及 GitHub 仓库链接整块已删除。

## 全站无胶囊检查

- 对总览、生态筛选、气体分离、催化、MOF库、方法论、项目演化、数据合规承诺八个一级页面逐页扫描。
- 文本按钮、筛选项、状态标签和带内边距的标签统一为 4–5 px 紧凑圆角。
- 数据点、步骤编号圆点和进度轨道属于信息图形，不按文本胶囊处理。
- 八个一级页面均无横向溢出。
- 调整后文本控件胶囊扫描结果为 0。

## 验证结果

- TypeScript 类型检查：通过。
- 全量 Vitest：通过；仅保留既有测试中的远程数据 404 日志，不影响结果。
- 生产构建：通过；仅保留 3Dmol 依赖的既有 `eval` 警告。
- `git diff --check`：通过。
- 常规视觉检查：通过。
- 独立无头浏览器脚本受 macOS 沙箱 `bootstrap_check_in ... Permission denied (1100)` 阻止，未计作浏览器通过；本轮视觉、交互、无溢出和胶囊残留检查均由已经打开的应用内浏览器完成。
- 版本中心：已更新为 Web v1.0.13，并明确记录仅本地提交、不推送、不部署。

final result: passed
