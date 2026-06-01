import { describe, expect, it } from "vitest"
import v1Records from "../../../public/data/gas_adsorption_records_v1.json"
import demoRecords from "../../../public/data/gas_adsorption_records_demo.json"
import { normalizeGasRecord, normalizeGasRecords } from "../../components/gas/gasDataNormalize"
import { GAS_SCHEMA_VERSION, getFieldSource } from "../../components/gas/gasDataSchema"

describe("gasDataNormalize", () => {
  it("flattens v1 records for existing GasSep scoring and views", () => {
    const normalized = normalizeGasRecord(v1Records[0])
    expect(normalized.schemaVersion).toBe(GAS_SCHEMA_VERSION)
    expect(normalized.primaryUptake).toBe(v1Records[0].metrics.primaryUptake)
    expect(normalized.surfaceArea).toBe(v1Records[0].descriptors.surfaceArea)
    expect(normalized.temperatureK).toBe(v1Records[0].condition.temperatureK)
    expect(normalized.dataType).toBe(v1Records[0].evidence.dataType)
    expect(getFieldSource(normalized, "primaryUptake").sourceType).not.toBe("missing")
  })

  it("normalizes legacy demo records as D-level fallback records", () => {
    const [normalized] = normalizeGasRecords([demoRecords[0]])
    expect(normalized.evidenceLevel).toBe("D")
    expect(normalized.dataType).toBe("demo_placeholder")
    expect(getFieldSource(normalized, "primaryUptake").sourceType).toBe("legacy_demo")
  })
})
