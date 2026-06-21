// @ts-nocheck
// V3.5 Benchmark Credibility Audit — upgrades the V3.4 benchmark audit with a
// credibility view: Ground Truth Quality, External Test Quality, Leakage Status,
// Split Quality, and Cross Validation Status. Reads the frozen V3.4 report and
// the V3.5 cross-validation result; changes nothing.
export function auditBenchmarkCredibility({ firstBenchmark = {}, crossValidation = {} } = {}) {
  const gt = firstBenchmark.groundTruthAudit || {}
  const ela = firstBenchmark.experimentalLabelAudit || {}
  const split = firstBenchmark.split?.counts || {}
  const leak = firstBenchmark.leakage || {}

  const externalTest = Number(split.external_test || 0)
  const cvDone = Array.isArray(crossValidation.models) && crossValidation.models.length > 0

  const groundTruthQuality = gt.invalidGroundTruthCount === 0 && Number(gt.verifiedGroundTruthCount || 0) >= 30 ? "High" : Number(gt.verifiedGroundTruthCount || 0) > 0 ? "Moderate" : "Low"
  const externalTestQuality = externalTest >= 30 ? "High" : externalTest >= 20 ? "Moderate" : "Low"
  const leakageStatus = Number(leak.leakCount || 0) === 0 ? "Clean" : "Leakage Detected"
  const splitQuality = firstBenchmark.split?.complete ? "Complete 70/15/15 + external" : "Incomplete"
  const crossValidationStatus = cvDone ? `Done (${crossValidation.k}-fold)` : "Not Run"

  const checks = [
    groundTruthQuality === "High",
    externalTestQuality === "High",
    leakageStatus === "Clean",
    firstBenchmark.split?.complete === true,
    cvDone,
  ]
  const passed = checks.filter(Boolean).length

  return {
    auditId: "benchmark-credibility-audit",
    groundTruthQuality,
    externalTestQuality,
    leakageStatus,
    splitQuality,
    crossValidationStatus,
    syntheticLabelCount: Number(ela.syntheticLabelCount || 0),
    passed,
    total: checks.length,
    status: passed === checks.length ? "Pass" : passed >= 3 ? "Warning" : "Fail",
  }
}

export default auditBenchmarkCredibility
