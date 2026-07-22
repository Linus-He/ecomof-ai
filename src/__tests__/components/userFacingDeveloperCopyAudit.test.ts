// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import releaseLog from "../../../public/data/app_release_log.json"

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8")
    .split("\n")
    .filter(line => !line.includes("developerPattern"))
    .filter(line => !line.includes("buildWorkerScoring"))
    .filter(line => !line.includes("normalizeWorkerRecord"))
    .filter(line => !line.includes("WorkerScoringBoundaryPreview"))
    .join("\n")
}

describe("user-facing developer copy audit", () => {
  it("keeps implementation details out of primary user-facing copy", () => {
    const uiSources = [
      "src/components/tabs/MOFLibraryTab.tsx",
      "src/components/tabs/EcoScreenTab.tsx",
      "src/components/tabs/ProjectEvolutionTab.jsx",
      "src/components/methodology/OrganicAcidFinalMethodology.jsx",
      "src/components/catalysis/organic-acid-final/trace-workbench/AlgorithmTraceWorkbench.jsx",
      "src/components/catalysis/organic-acid-final/trace-workbench/TraceEmptyState.jsx",
      "src/components/catalysis/organic-acid-final/run-launcher/AlgorithmRunLauncher.jsx",
      "src/components/tabs/MethodsLimitationsTab.tsx",
      "src/components/tabs/DataSourcesTab.tsx",
      "src/components/tabs/PerformanceTab.tsx",
      "src/components/tabs/ScreeningTab.tsx",
      "src/components/tabs/ValidationTab.tsx",
      "src/components/ui/index.tsx",
      "src/utils/databaseIndex/databaseIndexCopy.js",
      "src/utils/databaseIndex/databaseIndexTraceAdapter.js",
      "src/components/screening-trace/ScreeningTraceSection.jsx",
      "src/components/screening-trace/ScreeningFunnelPanel.jsx",
      "src/components/screening-trace/CandidateDecisionDashboard.jsx",
    ].map(source).join("\n")

    expect(uiSources).not.toMatch(/展开后再执行|阻塞页面|GitHub Pages 数据路径|shell 已就绪|dashboard shell|shell-first|marker 与容器|脚本重跑|构建脚本|懒加载边界|展开后渲染|浏览器主线程|全量 JSON|Worker 评分/)
    expect(uiSources).not.toMatch(/统一接入 createScoringModel|直接读取 app_release_log\.json|组件内写死 CURRENT_RELEASE|深链接路由/)
    expect(uiSources).not.toMatch(/Run Launcher|dry run|Dry-run|browser-side|cat-zone|catalyst-cat|小猫|生成脚本/)
  })

  it("keeps the visible release log free of implementation notes", () => {
    const visibleReleaseLog = JSON.stringify({
      pendingNextRelease: releaseLog.pendingNextRelease,
      currentRelease: releaseLog.releases?.[0],
    })

    expect(visibleReleaseLog).not.toMatch(/CURRENT_RELEASE|app_release_log|主线程|阻塞页面|组件内写死|深链接路由|metal_precursor_cost_table|lazy-loads|main-thread|GitHub Pages/)
    expect(visibleReleaseLog).not.toMatch(/Run Launcher|dry run|Dry-run|browser-side|cat-playground|小猫|生成脚本/)
  })

  it("keeps visible Organic Acid version docs in research-user language", () => {
    const docs = source("public/data/organic_acid_final_screening/version_docs.json")
    expect(docs).not.toMatch(/Run Launcher|dry run|Dry-run|browser-side|No full database scoring in browser|Worker boundary|Worker 边界|scripts\/|docs\/|构建脚本|小猫|cat playground|cat-playground|draggable cat|chart mascot/)
  })
})
