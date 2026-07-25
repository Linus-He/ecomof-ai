# EcoMOF-AI 设计复核

## 本轮范围

- 弱化首页模块边框，收紧模块间距，保持连续的科研叙事。
- 放大描述符相关矩阵，保留金属、指标、区间与相关单元格的联动。
- 将项目演化整合为“左侧定义与更新、右侧交互图”，完整记录按主题收纳。
- 所有可见版本称谓统一为 Web；项目演化不再展示开发者日志或开发文档。
- 复核浅色、深色、桌面与移动端。

## 参考画面

- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_z3PN7c/截屏2026-07-25 11.08.36.png`
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_28yWvU/截屏2026-07-25 11.10.01.png`

## 实现画面

- 项目演化，深色桌面：`/private/tmp/ecomof-project-evolution-dark-qa-v3.png`
- 项目演化，浅色桌面：`/private/tmp/ecomof-project-evolution-light-qa-v3.png`
- 项目演化，移动端：`/private/tmp/ecomof-project-evolution-mobile-qa-v3.png`
- 相关性图，浅色桌面：`/private/tmp/ecomof-home-correlation-light-qa-v6.png`
- 相关性图，移动端：`/private/tmp/ecomof-home-correlation-mobile-qa-v6.png`
- 项目演化并排对照：`/private/tmp/ecomof-design-qa-comparison-v4.png`
- 相关性图并排对照：`/private/tmp/ecomof-design-qa-correlation-comparison.png`

## 可见差异

- 项目演化从分散的版本卡片改为单一演化视图，公式、当前状态与本次更新位于左侧，五个维度的变化位于右侧；信息层级更清楚，首屏不再堆叠说明卡。
- 相关矩阵从缩略图提升为主要图表，四个描述符、相关方向、样本量与排序关系均可直接阅读；桌面和移动端均未出现横向溢出。
- 首页主模块边框透明度降低，纵向间距由宽松展示调整为连续阅读节奏。
- 浅色和深色均使用现有语义色；折线、矩阵、公式和弱边框在两种主题下保持可辨识。

## 交互检查

- 项目演化的 Web 发布、数据、科研、验证、体验五个图层可切换。
- 折线节点可选择并显示对应记录。
- 首页相关矩阵单元格与相关排序保持联动。
- 主题切换、首页与项目演化导航正常。
- 移动端项目演化宽度与页面宽度一致；相关矩阵完整落在视口内。
- 页面日志未发现运行时错误；仅有开发服务器热更新调试信息。

## 验证记录

- 项目演化与版本中心定向测试：通过。
- 完整测试（单工作进程）：240 个测试文件、768 项测试全部通过。
- TypeScript 检查：通过。
- 生产构建：通过。
- 差异检查：通过。

final result: pass
