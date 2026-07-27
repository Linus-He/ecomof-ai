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
- 通过：249 个测试文件 / 802 项测试串行全量通过，TypeScript 与生产构建通过。

## 已修复问题

- P1：全局 `appearance: none` 使景深滑杆轨道不可见；已补齐 WebKit/Firefox 轨道与滑块样式。
- P2：中等桌面宽度下标题操作区过于贴近右边界；已在 1320 px 以下切换为上下排布。
- P2：原生 range 键盘事件在自动化环境未更新；已显式支持方向键并限制在 1–10。
- P1：只用晶胞内直线距离会漏掉周期边界上的配位原子；已从 CIF 晶胞参数构造晶格向量并对 27 个相邻镜像取最短距离。

## 剩余边界

- QA 中的 ZrO6 CIF 是合成测试夹具，只验证渲染和多面体算法，不作为数据库记录发布。
- 公共数据仓库仅用于非商业开放研究，CIF 与派生索引遵循 CC BY-NC-SA 4.0；主程序代码与数据许可证分离。
- 拓扑、连接体命名和论文 DOI 不在 CSD MOF Collection 当前元数据中，界面明确显示“该集合未提供”，不自动臆测。

Final result: passed
