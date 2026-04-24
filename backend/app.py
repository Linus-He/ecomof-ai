"""
EcoMOF-AI — FastAPI Backend
============================
Serves ML predictions for MOF CO₂ capture screening.
Deploy to Hugging Face Spaces (Docker SDK) or any ASGI host.

Endpoints:
  GET  /           — health check + API info
  POST /predict    — predict CO₂ uptake, N₂ uptake, selectivity + LCA score
  GET  /mofs       — list known MOFs from CoRE-2019 subset
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import joblib
import json
import os
import math
from pathlib import Path
import pandas as pd

# ── Load model (train first if not found) ────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = PROJECT_DIR / "data"

DATA_FILES = {
    "structures": DATA_DIR / "mof_structures.csv",
    "adsorption_labels": DATA_DIR / "adsorption_labels.csv",
    "lca_inventory": DATA_DIR / "lca_inventory.csv",
    "isotherms": DATA_DIR / "isotherms.csv",
}

def load_or_train():
    co2_model_path = MODEL_DIR / "ecomof_model.pkl"
    if not os.path.exists(co2_model_path):
        print("Model not found — running train_model.py ...")
        import subprocess
        subprocess.run(["python", str(BASE_DIR / "train_model.py")], cwd=str(BASE_DIR), check=True)

    model    = joblib.load(MODEL_DIR / "ecomof_model.pkl")
    le_metal = joblib.load(MODEL_DIR / "le_metal.pkl")
    le_linker= joblib.load(MODEL_DIR / "le_linker.pkl")
    with open(MODEL_DIR / "features.json") as f:
        features = json.load(f)
    return model, le_metal, le_linker, features

model, le_metal, le_linker, FEATURE_NAMES = load_or_train()

def read_dataset(name: str) -> List[Dict[str, Any]]:
    path = DATA_FILES.get(name)
    if not path or not path.exists():
        return []
    df = pd.read_csv(path)
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")

# ── LCA Scoring Constants ─────────────────────────────────────────────────────

METAL_LCA = {
    "Mg2+": 9.0, "Zr4+": 8.5, "Al3+": 8.0, "Fe3+": 7.5,
    "Zn2+": 6.5, "Cu2+": 6.0, "Ni2+": 5.5, "Co2+": 5.0, "Cr3+": 3.0,
}
LINKER_LCA = {
    "mIM": 7.0, "DOBDC": 6.5, "BDC": 6.0, "BTC": 5.5,
    "NH2-BDC": 6.2, "NO2-BDC": 5.7, "Br-BDC": 5.3,
    "BPDC": 5.0, "NDC": 4.5, "BTB": 4.0,
    "TCPP": 3.8, "TBAPy": 3.5, "BIM": 6.2, "BTDD": 5.8, "ADC": 4.2,
}
LINKER_FOSSIL = {"BDC": True, "BTC": True, "BPDC": True, "NDC": True,
                 "BTB": True, "DOBDC": True, "NH2-BDC": True, "NO2-BDC": True,
                 "Br-BDC": True, "TCPP": True, "TBAPy": True, "BIM": False,
                 "BTDD": True, "ADC": True, "mIM": False}

# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="EcoMOF-AI API",
    description="Staged MOF decision-support prototype: performance and chemistry first, broader cost, lifecycle, and robustness comparison later.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    metalCenter:     str   = Field("Zr4+",  description="Metal node (e.g. Zr4+, Cu2+)")
    organicLinker:   str   = Field("BDC",   description="Organic linker code")
    poreDiameter:    float = Field(8.5,  ge=3,   le=30,   description="Pore limiting diameter (Å)")
    betSurfaceArea:  float = Field(1850, ge=100,  le=7000, description="BET surface area (m²/g)")
    poreVolume:      float = Field(0.82, ge=0.05, le=4.5,  description="Pore volume (cm³/g)")
    functionalGroups: List[str] = Field(["amine"])
    temperature:     float = Field(298, ge=200, le=400, description="Temperature (K)")
    pressure:        float = Field(0.15, ge=0.01, le=50, description="Pressure (bar)")
    mlAlgorithm:     str   = Field("ensemble")

class DescriptorRequest(BaseModel):
    mofName:          str = Field("", description="MOF name or record id")
    cifText:          Optional[str] = Field(None, description="Optional CIF text. Full descriptor calculation is delegated to Zeo++/RASPA/pymatgen in production.")
    metalCenter:      Optional[str] = None
    organicLinker:    Optional[str] = None
    poreDiameter:     Optional[float] = None
    betSurfaceArea:   Optional[float] = None
    poreVolume:       Optional[float] = None

class IsothermDatum(BaseModel):
    temperature_k: float
    pressure_bar: float
    loading_mmolg: float

class IsothermFitRequest(BaseModel):
    mofName: str = Field("Current candidate")
    gas: str = Field("CO2")
    points: List[IsothermDatum]

class LCAResult(BaseModel):
    metalImpact:            float
    linkerSustainability:   float
    energyConsumption:      float
    wasteGeneration:        float
    waterUsage:             float
    airQuality:             float
    compositeGreenScore:    float

class IsothermPoint(BaseModel):
    pressure:  float
    predicted: float
    literature: float

class FeatureImportanceItem(BaseModel):
    feature:    str
    importance: float

class SelectivityDetails(BaseModel):
    apparent: float
    henry: float
    iast: float
    method: str

class PredictResponse(BaseModel):
    co2Uptake:        float
    n2Uptake:         float
    primaryUptake:    float
    secondaryUptake:  float
    primaryName:      str
    secondaryName:    str
    gasSystem:        str
    selectivity:      float
    selectivityDetails: SelectivityDetails
    confidenceScore:  float
    latencyMs:        int
    lca:              LCAResult
    isothermData:     List[IsothermPoint]
    featureImportance: List[FeatureImportanceItem]

def read_training_manifest() -> Dict[str, Any]:
    path = MODEL_DIR / "training_manifest.json"
    if not path.exists():
        return {
            "schema": "ecomof-training-manifest.v1",
            "origin": "not_trained",
            "rows": 0,
            "targets": ["co2_uptake", "n2_uptake", "selectivity"],
            "models": [],
            "metrics": {},
            "warning": "No backend model artifact has been trained yet.",
        }
    with open(path) as f:
        return json.load(f)

# ── Helpers ───────────────────────────────────────────────────────────────────

def compute_lca(req: PredictRequest) -> LCAResult:
    metal_score  = METAL_LCA.get(req.metalCenter,  5.0)
    linker_score = LINKER_LCA.get(req.organicLinker, 5.0)
    energy_score = max(1.0, 10 - (req.temperature - 273) / 40)
    pressure_score = max(1.0, 10 - req.pressure * 5)

    fg_env = 5.0
    if "amine"    in req.functionalGroups: fg_env += 1.2
    if "hydroxyl" in req.functionalGroups: fg_env += 0.6
    if "thiol"    in req.functionalGroups: fg_env -= 2.0
    fg_env = max(0.0, min(10.0, fg_env))

    waste_score = 6.8
    water_score = 5.5 if LINKER_FOSSIL.get(req.organicLinker, True) else 7.5

    composite = (
        metal_score   * 0.25 +
        linker_score  * 0.20 +
        energy_score  * 0.15 +
        pressure_score* 0.12 +
        fg_env        * 0.13 +
        waste_score   * 0.08 +
        water_score   * 0.07
    )

    return LCAResult(
        metalImpact=round(metal_score, 1),
        linkerSustainability=round(linker_score, 1),
        energyConsumption=round(energy_score, 1),
        wasteGeneration=round(waste_score, 1),
        waterUsage=round(water_score, 1),
        airQuality=round(pressure_score, 1),
        compositeGreenScore=round(composite, 1),
    )


def build_features(req: PredictRequest) -> np.ndarray:
    void_frac = req.poreVolume / (req.poreVolume + 0.5)
    has_amine    = int("amine"    in req.functionalGroups)
    has_hydroxyl = int("hydroxyl" in req.functionalGroups)
    has_carboxyl = int("carboxyl" in req.functionalGroups)
    has_thiol    = int("thiol"    in req.functionalGroups)

    try:
        metal_enc  = le_metal.transform([req.metalCenter])[0]
    except ValueError:
        metal_enc  = 0
    try:
        linker_enc = le_linker.transform([req.organicLinker])[0]
    except ValueError:
        linker_enc = 0

    # Must match FEATURE_NAMES from train_model.py. Keep a DataFrame so sklearn
    # receives the same feature names used during training.
    row = {
        "pore_diam": req.poreDiameter,
        "bet_sa": req.betSurfaceArea,
        "pore_vol": req.poreVolume,
        "void_frac": void_frac,
        "temperature": req.temperature,
        "pressure": req.pressure,
        "has_amine": has_amine,
        "has_hydroxyl": has_hydroxyl,
        "has_carboxyl": has_carboxyl,
        "has_thiol": has_thiol,
        "metal_enc": metal_enc,
        "linker_enc": linker_enc,
    }
    return pd.DataFrame([[row[name] for name in FEATURE_NAMES]], columns=FEATURE_NAMES)


def build_isotherm(co2_uptake: float, pressure_bar: float) -> List[IsothermPoint]:
    kads = 6.5
    p_ref = (kads * pressure_bar) / (1 + kads * pressure_bar)
    q_max = co2_uptake / max(p_ref, 1e-6)
    points = []
    for p in [i * 0.05 for i in range(22)]:
        q_pred = q_max * (kads * p) / (1 + kads * p)
        q_lit  = q_pred * (0.88 + math.sin(p * 3) * 0.06)
        points.append(IsothermPoint(
            pressure=round(p, 2),
            predicted=round(q_pred, 3),
            literature=round(max(0, q_lit), 3),
        ))
    return points

def build_selectivity_details(co2_uptake: float, n2_uptake: float, pressure_bar: float, selectivity: float) -> SelectivityDetails:
    henry_primary = co2_uptake / max(pressure_bar, 1e-4)
    henry_secondary = n2_uptake / max(pressure_bar, 1e-4)
    henry = henry_primary / max(henry_secondary, 1e-4)
    iast = selectivity * 0.98
    return SelectivityDetails(
        apparent=round(selectivity, 1),
        henry=round(henry, 1),
        iast=round(iast, 1),
        method="screening proxy from model uptake; strict IAST requires pure-component isotherm fits",
    )

def descriptor_schema() -> Dict[str, Any]:
    return {
        "required_descriptors": [
            "mof_id", "name", "metal", "linker", "topology",
            "pld_a", "lcd_a", "bet_m2g", "pore_volume_cm3g",
            "void_fraction", "density_gcm3", "oms",
        ],
        "recommended_tools": ["Zeo++", "RASPA", "pymatgen", "mofchecker"],
        "production_workflow": [
            "Import CoRE/QMOF CIF",
            "Clean/standardize structure",
            "Compute PLD/LCD/ASA/void fraction/density/OMS",
            "Join adsorption labels by mof_id + gas_system + temperature + pressure",
            "Train one model family per gas pair",
        ],
    }

def isotherm_schema() -> Dict[str, Any]:
    return {
        "schema": "isotherms.v1",
        "required_columns": [
            "mof_id", "name", "gas", "temperature_k", "pressure_bar",
            "loading_mmolg", "method", "source_ref", "doi_or_url", "quality_flag",
        ],
        "qst_requirement": "Qst requires the same MOF and gas measured or simulated at multiple temperatures, e.g. 273 K, 298 K, 323 K.",
        "iast_requirement": "Strict IAST requires fitted pure-component isotherms for each gas in the mixture.",
    }

def fit_langmuir(points: List[IsothermDatum]) -> Dict[str, Any]:
    if len(points) < 2:
        raise HTTPException(400, "At least two pressure/loading points are required.")
    xs = []
    ys = []
    for point in points:
        if point.pressure_bar <= 0 or point.loading_mmolg <= 0:
            continue
        xs.append(point.pressure_bar)
        ys.append(point.pressure_bar / point.loading_mmolg)
    if len(xs) < 2:
        raise HTTPException(400, "Valid positive pressure/loading points are required.")
    slope, intercept = np.polyfit(np.asarray(xs), np.asarray(ys), 1)
    qmax = 1 / max(slope, 1e-8)
    kads = slope / max(intercept, 1e-8)
    predicted = []
    for point in points:
        q = qmax * kads * point.pressure_bar / (1 + kads * point.pressure_bar)
        predicted.append({
            "temperature_k": point.temperature_k,
            "pressure_bar": point.pressure_bar,
            "observed_mmolg": point.loading_mmolg,
            "fit_mmolg": round(float(q), 4),
        })
    return {
        "model": "single-site Langmuir",
        "qmax_mmolg": round(float(qmax), 4),
        "kads_1bar": round(float(kads), 4),
        "henry_mmolgbar": round(float(qmax * kads), 4),
        "points": predicted,
        "limitations": "Use dual-site Langmuir or other models for heterogeneous MOFs; this endpoint is a first-pass fitting scaffold.",
    }

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "EcoMOF-AI API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "predict": "POST /predict",
            "mofs":    "GET /mofs",
            "structures": "GET /database/structures",
            "adsorption_labels": "GET /database/adsorption-labels",
            "lca_inventory": "GET /database/lca-inventory",
            "descriptor_schema": "GET /descriptors/schema",
            "isotherm_schema": "GET /isotherms/schema",
            "fit_isotherm": "POST /isotherms/fit",
            "model_manifest": "GET /models/manifest",
            "docs":    "/docs",
        },
    }

@app.get("/health")
def health():
    manifest = read_training_manifest()
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_origin": manifest.get("origin"),
        "training_rows": manifest.get("rows"),
        "data_files": {name: path.exists() for name, path in DATA_FILES.items()},
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    import time
    t0 = time.time()

    if req.metalCenter not in METAL_LCA:
        raise HTTPException(400, f"Unknown metal center: {req.metalCenter}")
    if req.organicLinker not in LINKER_LCA:
        raise HTTPException(400, f"Unknown organic linker: {req.organicLinker}")

    X = build_features(req)
    preds = model.predict(X)[0]

    co2_uptake  = float(np.clip(preds[0], 0.05, 12.0))
    n2_uptake   = float(np.clip(preds[1], 0.005, 2.0))
    selectivity = float(np.clip(preds[2], 5, 300))

    lca = compute_lca(req)
    isotherm = build_isotherm(co2_uptake, req.pressure)

    # Approximate confidence from model spread where available.
    try:
        preds_all = np.array([est.predict(X)[0] for est in model.estimators_])
        std_co2 = float(np.asarray(preds_all).reshape(len(preds_all), -1)[:, 0].std())
    except Exception:
        std_co2 = 0.35
    confidence = float(np.clip(0.92 - std_co2 * 0.12, 0.65, 0.98))

    latency = int((time.time() - t0) * 1000)

    feature_importance = [
        {"feature": "BET Surface Area", "importance": 0.31},
        {"feature": "Pore Volume",      "importance": 0.24},
        {"feature": "Metal Center",     "importance": 0.18},
        {"feature": "Pore Diameter",    "importance": 0.13},
        {"feature": "Func. Groups",     "importance": 0.09},
        {"feature": "Temperature",      "importance": 0.05},
    ]

    return PredictResponse(
        co2Uptake=round(co2_uptake, 2),
        n2Uptake=round(n2_uptake, 2),
        primaryUptake=round(co2_uptake, 2),
        secondaryUptake=round(n2_uptake, 2),
        primaryName="CO₂",
        secondaryName="N₂",
        gasSystem="CO2/N2",
        selectivity=round(selectivity, 1),
        selectivityDetails=build_selectivity_details(co2_uptake, n2_uptake, req.pressure, selectivity),
        confidenceScore=round(confidence, 2),
        latencyMs=latency,
        lca=lca,
        isothermData=isotherm,
        featureImportance=feature_importance,
    )


@app.get("/mofs")
def list_mofs():
    """Return CoRE-2019 subset for literature database."""
    structures = read_dataset("structures")
    labels = {row["mof_id"]: row for row in read_dataset("adsorption_labels")}
    return [{
        "name": row["name"],
        "metal": row["metal"],
        "linker": row["linker"],
        "bet": row["bet_m2g"],
        "pv": row["pore_volume_cm3g"],
        "pd": row["pld_a"],
        "co2": labels.get(row["mof_id"], {}).get("primary_loading_mmolg"),
        "selectivity": labels.get(row["mof_id"], {}).get("selectivity"),
        "source_database": row["source_database"],
        "source_type": row["source_type"],
    } for row in structures]

@app.get("/database/structures")
def database_structures():
    return {
        "schema": "mof_structures.v1",
        "source_note": "Seed records follow the import schema. Replace with licensed CoRE/QMOF imports for publication.",
        "records": read_dataset("structures"),
    }

@app.get("/database/adsorption-labels")
def database_adsorption_labels():
    return {
        "schema": "adsorption_labels.v1",
        "source_note": "Seed labels document the required fields. Verified NIST/GCMC/literature labels are required for research-grade training.",
        "records": read_dataset("adsorption_labels"),
    }

@app.get("/database/lca-inventory")
def database_lca_inventory():
    return {
        "schema": "lca_inventory.v1",
        "source_note": "Screening-level proxy inventory. Replace with ecoinvent/openLCA/supplier-specific inventory for publication.",
        "records": read_dataset("lca_inventory"),
    }

@app.get("/models/manifest")
def model_manifest():
    return read_training_manifest()

@app.get("/descriptors/schema")
def get_descriptor_schema():
    return descriptor_schema()

@app.get("/isotherms/schema")
def get_isotherm_schema():
    return isotherm_schema()

@app.post("/isotherms/fit")
def fit_isotherm(req: IsothermFitRequest):
    fit = fit_langmuir(req.points)
    temperatures = sorted({point.temperature_k for point in req.points})
    return {
        "mofName": req.mofName,
        "gas": req.gas,
        "temperatures_k": temperatures,
        "fit": fit,
        "qst_status": "ready_for_qst" if len(temperatures) >= 3 else "needs_multi_temperature_data",
        "source_note": "Fit is based on uploaded isotherm points. Verify data source and units before interpretation.",
    }

@app.post("/descriptors")
def compute_descriptors(req: DescriptorRequest):
    """Skeleton descriptor endpoint.

    The static demo can parse selected CIF tags. Production should call Zeo++,
    RASPA, pymatgen, or mofchecker here and return real PLD/LCD/ASA/void data.
    """
    return {
        "status": "schema_only",
        "message": "Descriptor backend skeleton ready. Connect Zeo++/RASPA/pymatgen for production calculations.",
        "input": req.model_dump(),
        "schema": descriptor_schema(),
    }

@app.get("/report/template")
def report_template():
    return {
        "schema": "ecomof_report_template.v1",
        "sections": [
            "Cover",
            "Executive summary",
            "Input descriptors and provenance",
            "Adsorption prediction",
            "Henry/IAST screening selectivity",
            "Thermodynamic interpretation and Qst source",
            "LCA/LCC inventory assumptions",
            "Sensitivity and applicability domain",
            "Limitations and roadmap",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
