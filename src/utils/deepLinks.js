export const BASE_PATH = "/ecomof-ai/"

export const HASH_TO_TAB = {
  overview: "home",
  ecoscreen: "ecoscreen",
  performance: "performance",
  gassep: "gassep",
  catalysis: "catalysis",
  library: "library",
  methodology: "about",
  "data-quality-provenance": "library",
  "validation-evidence": "about",
  "benchmark-references": "about",
}

export const TAB_TO_HASH = {
  home: "overview",
  ecoscreen: "ecoscreen",
  performance: "performance",
  gassep: "gassep",
  catalysis: "catalysis",
  library: "library",
  about: "methodology",
}

export const HASH_META = {
  default: {
    title: "EcoMOF-AI | MOF AI Prototype Platform",
    description: "EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, descriptor curation, catalysis-oriented exploration, and field-level data provenance.",
  },
  overview: {
    title: "EcoMOF-AI | Transparent MOF Screening Prototype",
    description: "EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, descriptor curation, catalysis-oriented exploration, and field-level data provenance.",
  },
  ecoscreen: {
    title: "EcoScreen | Sustainability Screening for MOF Candidates",
    description: "Explore sustainability-oriented MOF candidate prioritization with transparent assumptions, candidate-priority scores, and limitations.",
  },
  performance: {
    title: "Performance | MOF Candidate Prioritization",
    description: "Explore rule-based MOF candidate prioritization with descriptor curation status and field-level provenance.",
  },
  gassep: {
    title: "GasSep | Condition-Aware Gas Separation Records",
    description: "Review condition-aware gas adsorption and separation records for MOF candidates, including gas ratio, temperature, pressure, method, source status, and isotherm availability.",
  },
  catalysis: {
    title: "CatalysisLab | Catalysis-Oriented MOF Exploration",
    description: "Explore catalysis-oriented MOF candidate prioritization as an early-stage research prototype, not final catalytic performance prediction.",
  },
  library: {
    title: "MOF Library | Descriptor Curation and Provenance",
    description: "Review MOF descriptors, curation status, source records, and Data Quality & Provenance summaries.",
  },
  methodology: {
    title: "Methods & Evidence | EcoMOF-AI",
    description: "Understand EcoMOF-AI scoring methods, evidence levels, data provenance, benchmark context, validation status, citation boundaries, and limitations.",
  },
  "data-quality-provenance": {
    title: "Data Quality & Provenance | EcoMOF-AI",
    description: "Review how EcoMOF-AI separates demo data, real-seed curation records, field-level provenance, and pending curation states.",
  },
  contact: {
    title: "Contact / Collaboration | EcoMOF-AI",
    description: "Contact the EcoMOF-AI maintainer about research collaboration, dataset integration, or feedback.",
  },
  acknowledgements: {
    title: "Acknowledgements | EcoMOF-AI",
    description: "Acknowledgements and maintainer information for the EcoMOF-AI early-stage research prototype.",
  },
  disclaimer: {
    title: "Disclaimer Center | EcoMOF-AI",
    description: "Centralized use boundaries for EcoMOF-AI prototype status, data interpretation, scoring, sustainability signals, catalysis records, machine learning, and collaborator-private data.",
  },
  "validation-evidence": {
    title: "Validation & Evidence | EcoMOF-AI",
    description: "Current validation status, what is explicitly checked, future validation plans, and non-validation disclaimer for EcoMOF-AI.",
  },
  "benchmark-references": {
    title: "Benchmark References | EcoMOF-AI",
    description: "Review contextual MOF benchmark references used to interpret candidate records without claiming validated prediction superiority.",
  },
}

export function normalizeHash(hash) {
  const cleaned = String(hash || "").replace(/^#/, "").trim()
  return cleaned || "overview"
}

export function tabToHash(tab) {
  return TAB_TO_HASH[tab] || "overview"
}

export function buildDeepLink(hash = "overview") {
  const normalized = normalizeHash(hash)
  if (typeof window !== "undefined") {
    const base = import.meta.env.BASE_URL || BASE_PATH
    return `${window.location.origin}${base}#${normalized}`
  }
  return `https://linus-he.github.io${BASE_PATH}#${normalized}`
}

export function getHashMeta(hash) {
  return HASH_META[String(hash || "").replace(/^#/, "").trim()] || HASH_META[normalizeHash(hash)] || HASH_META.default
}
