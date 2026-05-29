// @ts-nocheck
import { useEffect, useMemo, useState } from "react"

export const ROUTE_GROUPS = [
  "All",
  "Sugar activation",
  "C1-to-formate route",
  "C2/C3-to-formate route",
  "Bicarbonate role",
  "Byproduct / carbon-loss route",
]

export const ROUTE_GROUP_DESCRIPTIONS = {
  "Sugar activation": "P1: glucose isomerization and sugar activation before carbon-carbon cleavage.",
  "C1-to-formate route": "P2/P3: candidate C1 intermediates, especially formaldehyde-to-formate capability.",
  "C2/C3-to-formate route": "P2/P4: glyceraldehyde, pyruvaldehyde, and related C2/C3 fragments that may form formate.",
  "Bicarbonate role": "P5: HCO3- as possible carbon contributor, buffer/base, or local environment regulator.",
  "Byproduct / carbon-loss route": "P6/P7/P8: organic-acid byproducts, retained formate, decomposition, and unknown carbon loss.",
}

export const FINGERPRINT_METRICS = [
  ["A1_sugarActivation", "A1 Sugar activation", "positive"],
  ["A2_precursorGeneration", "A2 Formate precursor generation", "positive"],
  ["A3_intermediateToFormate", "A3 Intermediate-to-formate", "positive"],
  ["A4_formateRelease", "A4 Formate release", "positive"],
  ["B1_byproductRisk", "B1 Byproduct risk", "risk"],
]

const DATA_PATHS = {
  pathways: "data/catalytic_pathways_demo.json",
  nodes: "data/pathway_nodes_demo.json",
  fingerprints: "data/reaction_fingerprint_demo.json",
  readiness: "data/mof_reaction_screening_tags.json",
}

const normalizeName = value => String(value || "")
  .toLowerCase()
  .replace(/^nh2[-_\s]*/, "")
  .replace(/[-_\s]+nh2$/, "")
  .replace(/[^a-z0-9]+/g, "")

async function loadJson(path) {
  const base = import.meta.env.BASE_URL || "/"
  const response = await fetch(`${base}${path}`)
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`)
  return response.json()
}

export function useReactionRationaleData() {
  const [state, setState] = useState({
    status: "loading",
    nodes: [],
    pathways: [],
    fingerprints: [],
    readiness: [],
    error: null,
  })

  useEffect(() => {
    let active = true
    setState(prev => ({ ...prev, status: "loading", error: null }))
    Promise.all([
      loadJson(DATA_PATHS.nodes),
      loadJson(DATA_PATHS.pathways),
      loadJson(DATA_PATHS.fingerprints),
      loadJson(DATA_PATHS.readiness),
    ])
      .then(([nodes, pathways, fingerprints, readiness]) => {
        if (!active) return
        setState({
          status: "loaded",
          nodes: Array.isArray(nodes) ? nodes : [],
          pathways: Array.isArray(pathways) ? pathways.slice().sort((a, b) => Number(a.displayPriority || 0) - Number(b.displayPriority || 0)) : [],
          fingerprints: Array.isArray(fingerprints) ? fingerprints : [],
          readiness: Array.isArray(readiness) ? readiness : [],
          error: null,
        })
      })
      .catch(error => {
        if (!active) return
        console.warn("Reaction rationale data could not be loaded.", error)
        setState({ status: "error", nodes: [], pathways: [], fingerprints: [], readiness: [], error })
      })
    return () => { active = false }
  }, [])

  return state
}

export function getMofReactionProfile(candidate, fingerprints = [], readinessRows = []) {
  const ids = [
    candidate?.mofId,
    candidate?.id,
    candidate?.name,
    candidate?.displayName,
    candidate?.libraryName,
    candidate?.commonName,
  ].filter(Boolean)
  const normalizedIds = ids.map(normalizeName)
  const matchRow = row => {
    const rowIds = [row?.mofId, row?.displayName].filter(Boolean).map(normalizeName)
    return rowIds.some(rowId => normalizedIds.some(candidateId => candidateId === rowId || candidateId.includes(rowId) || rowId.includes(candidateId)))
  }
  return {
    fingerprint: fingerprints.find(matchRow) || null,
    readiness: readinessRows.find(matchRow) || null,
  }
}

export function useMofReactionProfile(candidate) {
  const data = useReactionRationaleData()
  return useMemo(() => ({
    ...data,
    profile: getMofReactionProfile(candidate, data.fingerprints, data.readiness),
  }), [candidate, data])
}
