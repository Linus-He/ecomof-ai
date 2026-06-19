// @ts-nocheck
// V3.4 Real ML models — genuine, dependency-free implementations of Logistic
// Regression, a CART Decision Tree, and a Random Forest, plus the standard
// classification metrics. These are REAL fitted models: the metrics they emit
// are computed from actual predictions on held-out data, never fabricated.
// Everything is deterministic (seeded RNG) so the benchmark is reproducible.

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- Standardization (z-score using train statistics) ----
export function fitScaler(X) {
  const n = X.length || 1
  const d = X[0]?.length || 0
  const means = Array(d).fill(0)
  const stds = Array(d).fill(0)
  for (const row of X) for (let j = 0; j < d; j += 1) means[j] += row[j]
  for (let j = 0; j < d; j += 1) means[j] /= n
  for (const row of X) for (let j = 0; j < d; j += 1) stds[j] += (row[j] - means[j]) ** 2
  for (let j = 0; j < d; j += 1) stds[j] = Math.sqrt(stds[j] / n) || 1
  return { means, stds }
}
export function applyScaler(X, scaler) {
  return X.map(row => row.map((v, j) => (v - scaler.means[j]) / scaler.stds[j]))
}

// ---- Logistic Regression (batch gradient descent, L2) ----
export function trainLogisticRegression(X, y, { lr = 0.1, epochs = 400, l2 = 0.01 } = {}) {
  const scaler = fitScaler(X)
  const Xs = applyScaler(X, scaler)
  const d = Xs[0]?.length || 0
  const n = Xs.length || 1
  let w = Array(d).fill(0)
  let b = 0
  const sigmoid = z => 1 / (1 + Math.exp(-z))
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gw = Array(d).fill(0)
    let gb = 0
    for (let i = 0; i < n; i += 1) {
      let z = b
      for (let j = 0; j < d; j += 1) z += w[j] * Xs[i][j]
      const err = sigmoid(z) - y[i]
      for (let j = 0; j < d; j += 1) gw[j] += err * Xs[i][j]
      gb += err
    }
    for (let j = 0; j < d; j += 1) w[j] -= lr * (gw[j] / n + l2 * w[j])
    b -= lr * (gb / n)
  }
  const predictProba = rows => applyScaler(rows, scaler).map(row => {
    let z = b
    for (let j = 0; j < d; j += 1) z += w[j] * row[j]
    return sigmoid(z)
  })
  return { type: "Logistic Regression", predictProba, weights: w, bias: b }
}

// ---- Decision Tree (CART, gini impurity) ----
function gini(y) {
  if (!y.length) return 0
  const p = y.reduce((a, v) => a + v, 0) / y.length
  return 1 - (p * p + (1 - p) * (1 - p))
}
function buildTree(X, y, depth, { maxDepth, minSamples, featureBag, rand }) {
  const positives = y.reduce((a, v) => a + v, 0)
  const proba = y.length ? positives / y.length : 0.5
  if (depth >= maxDepth || y.length < minSamples || positives === 0 || positives === y.length) {
    return { leaf: true, proba }
  }
  const d = X[0]?.length || 0
  let features = Array.from({ length: d }, (_, j) => j)
  if (featureBag && featureBag < d) {
    // sample sqrt(d) features without replacement (random forest)
    features = features.sort(() => rand() - 0.5).slice(0, featureBag)
  }
  let best = null
  for (const j of features) {
    const values = [...new Set(X.map(row => row[j]))].sort((a, b) => a - b)
    for (let k = 0; k < values.length - 1; k += 1) {
      const thr = (values[k] + values[k + 1]) / 2
      const leftY = []
      const rightY = []
      for (let i = 0; i < X.length; i += 1) (X[i][j] <= thr ? leftY : rightY).push(y[i])
      if (!leftY.length || !rightY.length) continue
      const w = (leftY.length * gini(leftY) + rightY.length * gini(rightY)) / y.length
      if (!best || w < best.impurity) best = { feature: j, threshold: thr, impurity: w }
    }
  }
  if (!best || best.impurity >= gini(y) - 1e-9) return { leaf: true, proba }
  const lX = [], lY = [], rX = [], rY = []
  for (let i = 0; i < X.length; i += 1) {
    if (X[i][best.feature] <= best.threshold) { lX.push(X[i]); lY.push(y[i]) }
    else { rX.push(X[i]); rY.push(y[i]) }
  }
  return {
    leaf: false,
    feature: best.feature,
    threshold: best.threshold,
    left: buildTree(lX, lY, depth + 1, { maxDepth, minSamples, featureBag, rand }),
    right: buildTree(rX, rY, depth + 1, { maxDepth, minSamples, featureBag, rand }),
  }
}
function treeProba(node, row) {
  let cur = node
  while (!cur.leaf) cur = row[cur.feature] <= cur.threshold ? cur.left : cur.right
  return cur.proba
}
export function trainDecisionTree(X, y, { maxDepth = 5, minSamples = 2, featureBag = null, seed = 7 } = {}) {
  const rand = mulberry32(seed)
  const root = buildTree(X, y, 0, { maxDepth, minSamples, featureBag, rand })
  return { type: "Decision Tree", predictProba: rows => rows.map(row => treeProba(root, row)), root }
}

// ---- Random Forest (bagging + feature subsampling) ----
export function trainRandomForest(X, y, { nTrees = 40, maxDepth = 6, minSamples = 2, seed = 13 } = {}) {
  const rand = mulberry32(seed)
  const d = X[0]?.length || 1
  const featureBag = Math.max(1, Math.round(Math.sqrt(d)))
  const n = X.length || 1
  const trees = []
  for (let t = 0; t < nTrees; t += 1) {
    const bX = [], bY = []
    for (let i = 0; i < n; i += 1) {
      const idx = Math.floor(rand() * n)
      bX.push(X[idx]); bY.push(y[idx])
    }
    const treeRand = mulberry32(seed + t * 101 + 1)
    trees.push(buildTree(bX, bY, 0, { maxDepth, minSamples, featureBag, rand: treeRand }))
  }
  return {
    type: "Random Forest",
    predictProba: rows => rows.map(row => trees.reduce((a, tree) => a + treeProba(tree, row), 0) / (trees.length || 1)),
    trees: trees.length,
  }
}

// ---- Metrics ----
export function rocAuc(yTrue, yScore) {
  const pos = []
  const neg = []
  for (let i = 0; i < yTrue.length; i += 1) (yTrue[i] === 1 ? pos : neg).push(yScore[i])
  if (!pos.length || !neg.length) return null
  // Rank-based (Mann–Whitney U) AUC with tie handling.
  const paired = yScore.map((s, i) => ({ s, y: yTrue[i] })).sort((a, b) => a.s - b.s)
  let rank = 1, i = 0, rankSumPos = 0
  while (i < paired.length) {
    let j = i
    while (j < paired.length && paired[j].s === paired[i].s) j += 1
    const avgRank = (rank + (rank + (j - i) - 1)) / 2
    for (let k = i; k < j; k += 1) if (paired[k].y === 1) rankSumPos += avgRank
    rank += j - i
    i = j
  }
  const auc = (rankSumPos - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length)
  return Number(auc.toFixed(4))
}

export function computeMetrics(yTrue, yScore, { threshold = 0.5 } = {}) {
  let tp = 0, fp = 0, tn = 0, fn = 0
  for (let i = 0; i < yTrue.length; i += 1) {
    const pred = yScore[i] >= threshold ? 1 : 0
    if (pred === 1 && yTrue[i] === 1) tp += 1
    else if (pred === 1 && yTrue[i] === 0) fp += 1
    else if (pred === 0 && yTrue[i] === 0) tn += 1
    else fn += 1
  }
  const n = yTrue.length || 1
  const accuracy = (tp + tn) / n
  const precision = tp + fp ? tp / (tp + fp) : 0
  const recall = tp + fn ? tp / (tp + fn) : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  const r = v => Number(v.toFixed(4))
  return {
    accuracy: r(accuracy),
    precision: r(precision),
    recall: r(recall),
    f1: r(f1),
    rocAuc: rocAuc(yTrue, yScore),
    confusion: { tp, fp, tn, fn },
    n,
  }
}

export const MODEL_TRAINERS = {
  "Logistic Regression": (X, y) => trainLogisticRegression(X, y),
  "Decision Tree": (X, y) => trainDecisionTree(X, y, { maxDepth: 5 }),
  "Random Forest": (X, y) => trainRandomForest(X, y, { nTrees: 40, maxDepth: 6 }),
}

export default MODEL_TRAINERS
