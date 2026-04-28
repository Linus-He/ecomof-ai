import { useLang, PageHeader, InternalNav } from "../../shared"
import { DataSourcesTab } from "./DataSourcesTab"
import { LiteratureTab } from "./LiteratureTab"
import { MethodsLimitationsTab } from "./MethodsLimitationsTab"

export function ResourcesTab({ activeSub, setActiveSub, results, inputs }) {
  const { lang } = useLang()
  const items = [
    { id: "dataSources", label: lang === "zh" ? "数据来源" : "Data Sources" },
    { id: "literature", label: lang === "zh" ? "数据库 / 基准" : "Database / Benchmarks" },
    { id: "methods", label: lang === "zh" ? "方法说明" : "Methods / Notes" },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title={lang === "zh" ? "资源与证据层" : "Resources and Evidence Layers"}
        subtitle={lang === "zh"
          ? "数据来源、基准数据库和方法说明集中在这里，作为工作流的支持材料。"
          : "Data sources, benchmark databases, and method notes are grouped here as supporting material for the staged workflow."}
        meta={lang === "zh" ? "支持页面" : "Supporting pages"}
      />
      <InternalNav items={items} active={activeSub} onChange={setActiveSub} />
      {activeSub === "dataSources" && <DataSourcesTab />}
      {activeSub === "literature" && <LiteratureTab results={results} inputs={inputs} />}
      {activeSub === "methods" && <MethodsLimitationsTab />}
    </div>
  )
}
