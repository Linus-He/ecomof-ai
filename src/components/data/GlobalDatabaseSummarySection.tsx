// @ts-nocheck
// V3.9 — self-fetching loader that pulls the key registry sources, builds the
// global database summary, and renders the presentational card. Lives in the
// Data Sources tab. Heavy sources are intentionally omitted; the registry's
// fallback handling shows loaded-vs-total honestly.
import { useEffect, useState } from "react"
import { fetchDataJson } from "../../services/dataService"
import { buildGlobalDatabaseSummary } from "../../utils/summary/buildGlobalDatabaseSummary"
import { GlobalDatabaseSummaryCard } from "./GlobalDatabaseSummaryCard"

// Registry id -> data path for the lighter, high-signal sources.
const FETCH_MAP: Array<[string, string]> = [
  ["experimental-labels", "experimental_labels/experimental_labels_v2.json"],
  ["external-test", "external_test_dataset_v2.json"],
  ["benchmark-eligible", "benchmark_dataset_v3_6.json"],
  ["source-registry", "data_ingestion/source_registry.json"],
  ["version-evolution", "version_evolution_records.json"],
  ["version-docs", "organic_acid_final_screening/version_docs.json"],
  ["oa-graph", "organic_acid_pathway_graph.json"],
  ["oa-evidence", "organic_acid_evidence_items.json"],
  ["gas-sources", "gas_adsorption_sources_v1.json"],
]

export function GlobalDatabaseSummarySection({ lang = "en", t, isMobile = false, dataVersion = "V3.9.1" }: any) {
  const [summary, setSummary] = useState(() => buildGlobalDatabaseSummary({ loaded: {}, dataVersion }))

  useEffect(() => {
    let active = true
    Promise.all(FETCH_MAP.map(([, path]) => fetchDataJson(path, null)))
      .then(results => {
        if (!active) return
        const loaded: Record<string, any> = {}
        FETCH_MAP.forEach(([id], i) => { if (results[i] != null) loaded[id] = results[i] })
        setSummary(buildGlobalDatabaseSummary({ loaded, dataVersion }))
      })
      .catch(() => { if (active) setSummary(buildGlobalDatabaseSummary({ loaded: {}, dataVersion })) })
    return () => { active = false }
  }, [dataVersion])

  return <GlobalDatabaseSummaryCard summary={summary} lang={lang} t={t} isMobile={isMobile} />
}

export default GlobalDatabaseSummarySection
