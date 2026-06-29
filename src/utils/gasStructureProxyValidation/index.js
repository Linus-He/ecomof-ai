// @ts-nocheck

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function rank(values) {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const ranks = Array(values.length)
  for (let index = 0; index < sorted.length; index += 1) ranks[sorted[index].index] = index + 1
  return ranks
}

export function spearman(xs = [], ys = []) {
  const pairs = xs.map((x, index) => [finite(x), finite(ys[index])]).filter(([x, y]) => x !== null && y !== null)
  const n = pairs.length
  if (n < 3) return { rho: null, n, status: "insufficient-data" }
  const rx = rank(pairs.map(([x]) => x))
  const ry = rank(pairs.map(([, y]) => y))
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length
  const mx = mean(rx)
  const my = mean(ry)
  const numerator = rx.reduce((sum, value, index) => sum + (value - mx) * (ry[index] - my), 0)
  const denomX = Math.sqrt(rx.reduce((sum, value) => sum + (value - mx) ** 2, 0))
  const denomY = Math.sqrt(ry.reduce((sum, value) => sum + (value - my) ** 2, 0))
  const rho = denomX && denomY ? numerator / (denomX * denomY) : null
  return { rho, n, status: rho === null ? "insufficient-data" : Math.abs(rho) < 0.35 ? "low-validity-indicative" : "indicative-only" }
}

export function validateStructureProxy(rows = [], descriptorKey = "surfaceArea", metricKey = "primaryUptake") {
  const pairs = []
  for (const row of rows) {
    const descriptor = finite(row[descriptorKey])
    for (const gas of row.gasRecords || []) {
      const metric = finite(gas.metrics?.[metricKey] ?? gas[metricKey])
      if (descriptor !== null && metric !== null) pairs.push([descriptor, metric])
    }
  }
  const result = spearman(pairs.map(([x]) => x), pairs.map(([, y]) => y))
  return {
    descriptorKey,
    metricKey,
    ...result,
    caveat: "Indicative only: structural descriptors are not adsorption predictions and require same-condition uptake validation.",
  }
}
