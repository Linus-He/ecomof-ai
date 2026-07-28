// @ts-nocheck
import { useEffect, useState } from "react"
import { DEFAULT_CANDIDATE_DATA_MODE } from "../config/dataModes"
import { getGlobalMofCandidates } from "../services/dataService"

export function useMofCandidates(mode = DEFAULT_CANDIDATE_DATA_MODE, options = {}) {
  const [candidates, setCandidates] = useState([])
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState(null)

  useEffect(() => {
    if (options.enabled === false) {
      setStatus("idle")
      setError(null)
      return undefined
    }
    let active = true
    setStatus("loading")
    setError(null)
    getGlobalMofCandidates({ throwOnError: options.throwOnError ?? true })
      .then(rows => {
        if (!active) return
        const nextRows = Array.isArray(rows) ? rows : []
        setCandidates(nextRows)
        setStatus(nextRows.length ? "loaded" : "empty")
      })
      .catch(nextError => {
        if (!active) return
        console.warn("MOF candidate data failed to load.", nextError)
        setCandidates([])
        setError(nextError)
        setStatus("error")
      })
    return () => {
      active = false
    }
  }, [options.enabled, options.throwOnError])

  return { candidates, loading: status === "loading", status, error, mode: DEFAULT_CANDIDATE_DATA_MODE }
}
