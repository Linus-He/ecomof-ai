// @ts-nocheck
import { buildWorkerScoringTrace, runLoadedScopeDryRun } from "../utils/databaseIndex/databaseScoringBoundary"

self.onmessage = event => {
  const request = event.data || {}
  const result = runLoadedScopeDryRun(request)
  self.postMessage({
    ...result,
    trace: buildWorkerScoringTrace(result),
  })
}
