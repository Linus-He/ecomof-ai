export function rankCandidates(scores = []) {
  const ranked = [...(Array.isArray(scores) ? scores : [])].sort((a, b) => {
    const scoreDiff = Number(b.score || 0) - Number(a.score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return String(a.name || "").localeCompare(String(b.name || ""))
  })
  return ranked.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
  }))
}
