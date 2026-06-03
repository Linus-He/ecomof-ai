import { useRef, useState } from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { AnchoredFieldProvenancePanel } from "../FieldProvenanceButton"

function setViewport(width = 900, height = 700) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height })
}

function Harness({ isMobile = false, rect = { left: 120, top: 80, right: 142, bottom: 102, width: 22, height: 22 } }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const panelRef = useRef(null)

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(true)}
      >
        Open provenance
      </button>
      <AnchoredFieldProvenancePanel
        open={open}
        anchorRef={anchorRef}
        panelRef={panelRef}
        isMobile={isMobile}
        onClose={() => setOpen(false)}
        ariaLabel="Field provenance"
        style={{ background: "white" }}
      >
        <div>Panel body</div>
      </AnchoredFieldProvenancePanel>
    </>
  )
}

function openHarness(rect) {
  render(<Harness rect={rect} />)
  const button = screen.getByRole("button", { name: /open provenance/i })
  Object.defineProperty(button, "getBoundingClientRect", {
    configurable: true,
    value: () => rect || { left: 120, top: 80, right: 142, bottom: 102, width: 22, height: 22 },
  })
  fireEvent.click(button)
  return button
}

describe("AnchoredFieldProvenancePanel", () => {
  it("renders into document.body and keeps the panel open while scroll updates position", async () => {
    setViewport()
    openHarness()

    const panel = await screen.findByRole("dialog", { name: /field provenance/i })
    expect(panel.parentElement).toBe(document.body)
    expect(panel).toHaveTextContent("Panel body")
    expect(panel.style.position).toBe("fixed")

    fireEvent.scroll(window)
    expect(screen.getByRole("dialog", { name: /field provenance/i })).toBeInTheDocument()
  })

  it("closes on outside pointer and Escape", async () => {
    setViewport()
    const button = openHarness()
    expect(await screen.findByRole("dialog", { name: /field provenance/i })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole("dialog", { name: /field provenance/i })).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(await screen.findByRole("dialog", { name: /field provenance/i })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: /field provenance/i })).not.toBeInTheDocument()
  })

  it("uses a bottom sheet style on mobile", async () => {
    setViewport(390, 720)
    render(<Harness isMobile />)
    const button = screen.getByRole("button", { name: /open provenance/i })
    Object.defineProperty(button, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 320, top: 120, right: 342, bottom: 142, width: 22, height: 22 }),
    })
    fireEvent.click(button)

    const panel = await screen.findByRole("dialog", { name: /field provenance/i })
    expect(panel.style.bottom).toBe("0px")
    expect(panel.style.maxHeight).toBe("72vh")
  })
})
