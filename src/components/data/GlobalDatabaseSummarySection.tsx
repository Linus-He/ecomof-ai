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
  ["core-mof", "core_mof_2024/summary.json"],
  ["fair-mofs", "data_ingestion/fair_mofs_import_v1.json"],
  ["gas-adsorption-v2", "gas_adsorption_records_v2.json"],
  ["experimental-labels", "experimental_labels/experimental_labels_v2.json"],
  ["benchmark-eligible", "benchmark_dataset_v3_6.json"],
]
const ACTIVE_SOURCE_IDS = FETCH_MAP.map(([id]) => id)

export function GlobalDatabaseSummarySection({ lang = "en", t, isMobile = false, dataVersion = "V3.9.1" }: any) {
  const [summary, setSummary] = useState(() => buildGlobalDatabaseSummary({ loaded: {}, activeSourceIds: ACTIVE_SOURCE_IDS, dataVersion }))

  useEffect(() => {
    let active = true
    Promise.all(FETCH_MAP.map(([, path]) => fetchDataJson(path, null)))
      .then(results => {
        if (!active) return
        const loaded: Record<string, any> = {}
        FETCH_MAP.forEach(([id], i) => { if (results[i] != null) loaded[id] = results[i] })
        setSummary(buildGlobalDatabaseSummary({ loaded, activeSourceIds: ACTIVE_SOURCE_IDS, dataVersion }))
      })
      .catch(() => { if (active) setSummary(buildGlobalDatabaseSummary({ loaded: {}, activeSourceIds: ACTIVE_SOURCE_IDS, dataVersion })) })
    return () => { active = false }
  }, [dataVersion])

  return <GlobalDatabaseSummaryCard summary={summary} lang={lang} t={t} isMobile={isMobile} />
}

export default GlobalDatabaseSummarySection
