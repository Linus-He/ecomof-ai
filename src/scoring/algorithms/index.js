import { computeCriticWeighting } from "./criticWeighting"
import { computeEqualWeighting } from "./equalWeighting"
import { computeHybridWeighting } from "./hybridWeighting"
import { computeManualWeighting } from "./manualWeighting"

export { computeCriticWeighting } from "./criticWeighting"
export { computeEqualWeighting } from "./equalWeighting"
export { computeHybridWeighting } from "./hybridWeighting"
export { computeManualWeighting } from "./manualWeighting"

export const weightingAlgorithms = {
  critic: computeCriticWeighting,
  equal: computeEqualWeighting,
  hybrid: computeHybridWeighting,
  manual: computeManualWeighting,
}

export function computeWeightingByAlgorithm(algorithm, args) {
  const compute = weightingAlgorithms[algorithm] || weightingAlgorithms.equal
  return compute(args)
}
