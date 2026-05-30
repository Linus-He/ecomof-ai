// @ts-nocheck
import { CURRENCIES } from "../constants/catalogs"
import { fetchDataJson } from "../services/dataService"
import { convertPressure, convertUptake } from "./units"

export function formatCurrency(valueUsd, currencyCode = "USD", digits = 1) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const value = Number(valueUsd || 0) * currency.rate
  const decimals = currencyCode === "JPY" ? 0 : digits
  return `${currency.symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function parseCsvRows(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const split = (line) => line.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""))
  const headers = split(lines[0]).map(h => h.toLowerCase())
  return lines.slice(1).map(line => {
    const cells = split(line)
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] ?? ""
      return row
    }, {})
  })
}

export function normalizeIsothermRows(rows) {
  return rows.map(row => ({
    mof_id: row.mof_id || row.mof || row.name || "uploaded",
    name: row.name || row.mof_name || row.mof || "Uploaded isotherm",
    gas: row.gas || row.component || "CO2",
    temperature_k: Number(row.temperature_k ?? row.temperature ?? row.t ?? row.temp_k),
    pressure_bar: (() => {
      const value = row.pressure_bar ?? row.pressureBar ?? row.p_bar ?? row.p ?? row.pressure
      const unit = row.pressure_unit || row.pressureUnit || (row.pressure_kpa || row.pressureKPa ? "kPa" : "bar")
      const pressureValue = row.pressure_kpa ?? row.pressureKPa ?? value
      try {
        return convertPressure(pressureValue, unit, "bar")
      } catch {
        return Number(value)
      }
    })(),
    loading_mmolg: (() => {
      const value = row.loading_mmolg ?? row.loading ?? row.q_mmolg ?? row.q
      const unit = row.loading_unit || row.uptake_unit || row.unit || "mmol/g"
      try {
        return convertUptake(value, unit, "mmol/g", { gas: row.gas || row.component || "CO2" })
      } catch {
        return Number(value)
      }
    })(),
    method: row.method || row.source_type || "uploaded",
    source_ref: row.source_ref || row.source || "user CSV",
    doi_or_url: row.doi_or_url || row.doi || "—",
    quality_flag: row.quality_flag || "user_uploaded",
  })).filter(row =>
    Number.isFinite(row.temperature_k) &&
    Number.isFinite(row.pressure_bar) &&
    Number.isFinite(row.loading_mmolg)
  )
}

export function fitLangmuirFromPoints(points) {
  const valid = points.filter(point => point.pressure_bar > 0 && point.loading_mmolg > 0)
  if (valid.length < 2) return null
  const n = valid.length
  const x = valid.map(point => point.pressure_bar)
  const y = valid.map(point => point.pressure_bar / point.loading_mmolg)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, value, index) => acc + value * y[index], 0)
  const sumXX = x.reduce((acc, value) => acc + value * value, 0)
  const denom = n * sumXX - sumX * sumX
  if (Math.abs(denom) < 1e-9) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const qmax = 1 / Math.max(slope, 1e-8)
  const kads = slope / Math.max(intercept, 1e-8)
  const fitted = valid.map(point => ({
    pressure: Number(point.pressure_bar.toFixed(4)),
    observed: Number(point.loading_mmolg.toFixed(4)),
    fit: Number((qmax * kads * point.pressure_bar / (1 + kads * point.pressure_bar)).toFixed(4)),
    temperature: point.temperature_k,
  }))
  return {
    model: "single-site Langmuir",
    qmax: Number(qmax.toFixed(3)),
    kads: Number(kads.toFixed(3)),
    henry: Number((qmax * kads).toFixed(3)),
    fitted,
  }
}

export function summarizeIsothermPoints(points) {
  const temperatures = Array.from(new Set(points.map(point => point.temperature_k))).sort((a, b) => a - b)
  const gases = Array.from(new Set(points.map(point => point.gas))).filter(Boolean)
  return {
    temperatures,
    gases,
    qstReady: temperatures.length >= 3,
    count: points.length,
    sourceTypes: Array.from(new Set(points.map(point => point.method))).filter(Boolean),
  }
}

export function buildDatabaseRecords(structures = [], labels = []) {
  const labelByMof = new Map(labels.map(label => [label.mof_id, label]))
  return structures.map(row => {
    const label = labelByMof.get(row.mof_id) || {}
    return {
      name: row.name,
      metal: row.metal,
      linker: row.linker,
      topology: row.topology || "—",
      bet: Number(row.bet_m2g ?? row.bet ?? 0),
      pv: Number(row.pore_volume_cm3g ?? row.pv ?? 0),
      pd: Number(row.lld_a ?? row.pd ?? 0),
      lcd: Number(row.lcd_a ?? 0),
      voidFraction: Number(row.void_fraction ?? 0),
      density: Number(row.density_gcm3 ?? 0),
      oms: Boolean(row.oms),
      co2: Number(label.primary_loading_mmolg ?? row.co2 ?? 0),
      selectivity: Number(label.selectivity ?? row.selectivity ?? 0),
      henryPrimary: Number(label.henry_primary_mmolgbar ?? 0),
      henrySecondary: Number(label.henry_secondary_mmolgbar ?? 0),
      sourceType: label.method || row.source_type || "seed",
      sourceDatabase: row.source_database || "local seed",
      sourceRecord: row.source_record || label.source_ref || "—",
      descriptorMethod: row.descriptor_method || "—",
      labelSource: label.isotherm_source || "—",
      qualityFlag: label.quality_flag || row.source_type || "screening_seed",
      doi: label.doi_or_url || row.source_record || "—",
      licenseNote: label.license_note || row.license_note || "Verify source license before publication.",
    }
  })
}
