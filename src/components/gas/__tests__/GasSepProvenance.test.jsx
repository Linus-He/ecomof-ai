import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import v1Records from "../../../../public/data/gas_adsorption_records_v1.json"
import { THEME_LIGHT } from "../../../constants/theme"
import { GasFieldProvenanceButton } from "../GasFieldProvenanceButton"
import { normalizeGasRecord } from "../gasDataNormalize"
import { getFieldSource } from "../gasDataSchema"

function setViewport(width = 1024, height = 768) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height })
}

function renderGasButton(props = {}) {
  const record = normalizeGasRecord(v1Records[0])
  render(
    <GasFieldProvenanceButton
      record={record}
      field="co2Uptake"
      currentValue="3.33 mmol/g"
      unit="mmol/g"
      lang="en"
      t={THEME_LIGHT}
      label="CO2 uptake"
      {...props}
    />,
  )
  const button = screen.getByRole("button", { name: /field-level provenance/i })
  Object.defineProperty(button, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ left: 180, top: 90, right: 202, bottom: 112, width: 22, height: 22 }),
  })
  return { button, record }
}

describe("GasSep field provenance", () => {
  it("maps gas-specific aliases to canonical field sources", () => {
    const record = normalizeGasRecord(v1Records[0])
    expect(getFieldSource(record, "co2Uptake").field).toBe("primaryUptake")
    expect(getFieldSource(record, "n2Uptake").field).toBe("secondaryUptake")
    expect(getFieldSource(record, "selectivityCO2N2").field).toBe("selectivity")
    expect(getFieldSource(record, "gasSeparationScore").field).toBe("gasScore")
  })

  it("returns curated or pending provenance for required GasSep display fields", () => {
    const record = normalizeGasRecord(v1Records[0])
    const fields = [
      "displayName",
      "sourceDatabase",
      "sourceRecordId",
      "surfaceArea",
      "poreSizeA",
      "poreVolume",
      "density",
      "voidFraction",
      "waterStability",
      "thermalStability",
      "co2Uptake",
      "n2Uptake",
      "ch4Uptake",
      "h2Uptake",
      "co2Henry",
      "n2Henry",
      "selectivityCO2N2",
      "selectivityCO2CH4",
      "workingCapacity",
      "heatOfAdsorption",
      "temperatureK",
      "pressureBar",
      "gasMixture",
      "method",
      "isothermModel",
      "dataSourceType",
      "measurementBasis",
      "gasSeparationScore",
      "confidenceLevel",
      "curationStatus",
      "dataCompleteness",
      "normalizationMethod",
    ]

    for (const field of fields) {
      const source = getFieldSource(record, field)
      expect(source.sourceType, field).toBeTruthy()
      expect(source.sourceDatabase, field).toBeTruthy()
      expect(source.sourceRecordId, field).toBeTruthy()
      expect(`${source.sourceType} ${source.sourceDatabase} ${source.sourceRecordId}`).not.toMatch(/undefined|null|NaN/)
    }
  })

  it("opens GasSep provenance in a body portal and keeps it open on scroll", async () => {
    setViewport()
    const { button } = renderGasButton()

    fireEvent.click(button)
    const panel = await screen.findByRole("dialog", { name: /field-level provenance/i })
    expect(panel.parentElement).toBe(document.body)
    expect(panel).toHaveTextContent("CO2 uptake")
    expect(panel).toHaveTextContent("Source database")
    expect(panel).toHaveTextContent("EcoMOF Gas Adsorption Seed v1")

    fireEvent.scroll(window)
    expect(screen.getByRole("dialog", { name: /field-level provenance/i })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole("dialog", { name: /field-level provenance/i })).not.toBeInTheDocument()
  })

  it("shows pending provenance for fields without field-level source and closes on Escape", async () => {
    setViewport(390, 720)
    const { button } = renderGasButton({
      field: "co2Henry",
      currentValue: Number.NaN,
      unit: "pending",
      label: "CO2 Henry coefficient",
    })

    fireEvent.click(button)
    const panel = await screen.findByRole("dialog", { name: /field-level provenance/i })
    expect(panel).toHaveTextContent("Pending provenance")
    expect(panel).toHaveTextContent("EcoMOF Gas Adsorption Seed v1")
    expect(panel.textContent).not.toMatch(/undefined|null|NaN/)

    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: /field-level provenance/i })).not.toBeInTheDocument()
  })
})
