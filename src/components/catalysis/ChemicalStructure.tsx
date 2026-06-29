// @ts-nocheck
const LINE = "#111827"
const TEXT = "#111827"
const MUTED = "#475569"
const STROKE = 2
const FONT_SIZE = 13
const SUB_SIZE = 8.5

const toneMap = {
  neutral: { border: "#D9E2EC", bg: "#FFFFFF", accent: "#475569", shadow: "none" },
  positive: { border: "#147C43", bg: "#F7FEFA", accent: "#147C43", shadow: "0 8px 20px rgba(20, 124, 67, 0.12)" },
  mixed: { border: "#C98530", bg: "#FFFDF8", accent: "#A15C13", shadow: "0 8px 20px rgba(161, 92, 19, 0.10)" },
  risk: { border: "#B35A32", bg: "#FFFCFA", accent: "#8F3B1B", shadow: "0 8px 20px rgba(143, 59, 27, 0.11)" },
  feedstock: { border: "#B8C5D4", bg: "#FFFFFF", accent: "#1A6DB5", shadow: "0 8px 18px rgba(26, 109, 181, 0.08)" },
}

function ChemSvg({ label, children, width = 180, height = 120, viewBox = "0 0 180 120", style }) {
  return (
    <svg
      role="img"
      aria-label={`${label} chemical structure`}
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ background: "transparent", display: "block", maxWidth: "100%", overflow: "visible", ...style }}
    >
      {children}
    </svg>
  )
}

function Bond({ x1, y1, x2, y2, width = STROKE }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth={width} strokeLinecap="round" />
}

function DoubleBond({ x1, y1, x2, y2, gap = 5 }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  const offsetX = (-dy / length) * (gap / 2)
  const offsetY = (dx / length) * (gap / 2)

  return (
    <>
      <Bond x1={x1 + offsetX} y1={y1 + offsetY} x2={x2 + offsetX} y2={y2 + offsetY} width={1.75} />
      <Bond x1={x1 - offsetX} y1={y1 - offsetY} x2={x2 - offsetX} y2={y2 - offsetY} width={1.75} />
    </>
  )
}

function RingBond({ points }) {
  return (
    <polyline
      points={points.map(([x, y]) => `${x},${y}`).join(" ")}
      fill="none"
      stroke={LINE}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={STROKE}
    />
  )
}

function AtomLabel({ x, y, children, anchor = "middle", size = FONT_SIZE, weight = 650, fill = TEXT }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fill={fill}
      fontFamily="var(--font-body)"
      fontSize={size}
      fontWeight={weight}
    >
      {children}
    </text>
  )
}

function FormulaLabel({ x, y, parts, anchor = "middle", size = FONT_SIZE, fill = TEXT, weight = 650 }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fill={fill}
      fontFamily="var(--font-body)"
      fontSize={size}
      fontWeight={weight}
    >
      {parts.map((part, index) => {
        if (typeof part === "string") return <tspan key={`${part}-${index}`}>{part}</tspan>
        return (
          <tspan key={`${part.sub}-${index}`} baselineShift="sub" fontSize={part.size || SUB_SIZE}>
            {part.sub}
          </tspan>
        )
      })}
    </text>
  )
}

const sub = (value) => ({ sub: value })

function CarbonylUp({ cX, cY, oX = cX, oY = cY - 36 }) {
  return (
    <>
      <DoubleBond x1={cX} y1={cY - 7} x2={oX} y2={oY + 9} gap={5.2} />
      <AtomLabel x={oX} y={oY}>O</AtomLabel>
    </>
  )
}

function RingSubstituent({ x1, y1, x2, y2, labelX, labelY, parts, anchor = "middle" }) {
  return (
    <>
      <Bond x1={x1} y1={y1} x2={x2} y2={y2} />
      <FormulaLabel x={labelX} y={labelY} parts={parts} anchor={anchor} />
    </>
  )
}

export function GlucoseStructure() {
  const ring = [[36, 58], [58, 30], [99, 30], [128, 56], [108, 88], [64, 88], [36, 58]]
  return (
    <ChemSvg label="Glucose">
      <RingBond points={ring} />
      <AtomLabel x={116} y={43} size={14}>O</AtomLabel>
      <RingSubstituent x1={58} y1={30} x2={54} y2={14} labelX={40} labelY={13} parts={["CH", sub("2"), "OH"]} />
      <RingSubstituent x1={36} y1={58} x2={18} y2={50} labelX={10} labelY={47} parts={["OH"]} />
      <RingSubstituent x1={64} y1={88} x2={56} y2={105} labelX={51} labelY={113} parts={["OH"]} />
      <RingSubstituent x1={108} y1={88} x2={120} y2={104} labelX={131} labelY={110} parts={["OH"]} />
      <RingSubstituent x1={128} y1={56} x2={149} y2={49} labelX={161} labelY={46} parts={["OH"]} />
      <FormulaLabel x={82} y={60} parts={["D-glucose"]} size={10.5} fill={MUTED} weight={600} />
    </ChemSvg>
  )
}

export function FructoseStructure() {
  const ring = [[45, 62], [70, 34], [107, 42], [118, 77], [80, 94], [45, 62]]
  return (
    <ChemSvg label="Fructose">
      <RingBond points={ring} />
      <AtomLabel x={72} y={39} size={14}>O</AtomLabel>
      <RingSubstituent x1={45} y1={62} x2={25} y2={52} labelX={14} labelY={48} parts={["CH", sub("2"), "OH"]} />
      <RingSubstituent x1={107} y1={42} x2={130} y2={27} labelX={154} labelY={24} parts={["CH", sub("2"), "OH"]} />
      <RingSubstituent x1={118} y1={77} x2={140} y2={86} labelX={154} labelY={91} parts={["OH"]} />
      <RingSubstituent x1={80} y1={94} x2={77} y2={110} labelX={76} labelY={117} parts={["OH"]} />
      <RingSubstituent x1={70} y1={34} x2={62} y2={17} labelX={58} labelY={9} parts={["OH"]} />
      <FormulaLabel x={85} y={66} parts={["D-fructose"]} size={10.5} fill={MUTED} weight={600} />
    </ChemSvg>
  )
}

export function FormaldehydeStructure() {
  return (
    <ChemSvg label="Formaldehyde" height={96} viewBox="0 0 180 96">
      <FormulaLabel x={46} y={56} parts={["H"]} />
      <Bond x1={56} y1={56} x2={84} y2={56} />
      <AtomLabel x={92} y={56}>C</AtomLabel>
      <CarbonylUp cX={92} cY={56} oY={18} />
      <Bond x1={101} y1={56} x2={130} y2={56} />
      <FormulaLabel x={142} y={56} parts={["H"]} />
      <FormulaLabel x={92} y={82} parts={["H", sub("2"), "C=O"]} size={11} fill={MUTED} weight={600} />
    </ChemSvg>
  )
}

export function GlyceraldehydeStructure() {
  return (
    <ChemSvg label="Glyceraldehyde">
      <FormulaLabel x={17} y={66} parts={["HO"]} />
      <Bond x1={29} y1={66} x2={54} y2={66} />
      <FormulaLabel x={69} y={66} parts={["CH", sub("2")]} />
      <Bond x1={83} y1={66} x2={107} y2={66} />
      <FormulaLabel x={120} y={66} parts={["CH"]} />
      <Bond x1={120} y1={53} x2={120} y2={31} />
      <FormulaLabel x={120} y={21} parts={["OH"]} />
      <Bond x1={133} y1={66} x2={149} y2={66} />
      <AtomLabel x={158} y={66}>C</AtomLabel>
      <CarbonylUp cX={158} cY={66} oY={27} />
      <Bond x1={162} y1={75} x2={170} y2={92} />
      <FormulaLabel x={174} y={103} parts={["H"]} />
    </ChemSvg>
  )
}

export function PyruvaldehydeStructure() {
  return (
    <ChemSvg label="Pyruvaldehyde">
      <FormulaLabel x={28} y={68} parts={["CH", sub("3")]} />
      <Bond x1={46} y1={68} x2={76} y2={68} />
      <AtomLabel x={87} y={68}>C</AtomLabel>
      <CarbonylUp cX={87} cY={68} oY={28} />
      <Bond x1={98} y1={68} x2={126} y2={68} />
      <AtomLabel x={137} y={68}>C</AtomLabel>
      <CarbonylUp cX={137} cY={68} oY={28} />
      <Bond x1={141} y1={77} x2={151} y2={94} />
      <FormulaLabel x={158} y={104} parts={["H"]} />
    </ChemSvg>
  )
}

export function FormicAcidStructure() {
  return (
    <ChemSvg label="Formic acid" height={96} viewBox="0 0 180 96">
      <FormulaLabel x={48} y={58} parts={["H"]} />
      <Bond x1={58} y1={58} x2={85} y2={58} />
      <AtomLabel x={96} y={58}>C</AtomLabel>
      <CarbonylUp cX={96} cY={58} oY={20} />
      <Bond x1={107} y1={58} x2={135} y2={58} />
      <FormulaLabel x={153} y={58} parts={["OH"]} />
    </ChemSvg>
  )
}

export function GlycolicAcidStructure() {
  return (
    <ChemSvg label="Glycolic acid">
      <FormulaLabel x={19} y={68} parts={["HO"]} />
      <Bond x1={32} y1={68} x2={57} y2={68} />
      <FormulaLabel x={74} y={68} parts={["CH", sub("2")]} />
      <Bond x1={90} y1={68} x2={118} y2={68} />
      <AtomLabel x={129} y={68}>C</AtomLabel>
      <CarbonylUp cX={129} cY={68} oY={29} />
      <Bond x1={140} y1={68} x2={154} y2={68} />
      <FormulaLabel x={168} y={68} parts={["OH"]} />
    </ChemSvg>
  )
}

export function AceticAcidStructure() {
  return (
    <ChemSvg label="Acetic acid" height={96} viewBox="0 0 180 96">
      <FormulaLabel x={42} y={58} parts={["CH", sub("3")]} />
      <Bond x1={60} y1={58} x2={90} y2={58} />
      <AtomLabel x={101} y={58}>C</AtomLabel>
      <CarbonylUp cX={101} cY={58} oY={20} />
      <Bond x1={112} y1={58} x2={138} y2={58} />
      <FormulaLabel x={156} y={58} parts={["OH"]} />
    </ChemSvg>
  )
}

export function LacticAcidStructure() {
  return (
    <ChemSvg label="Lactic acid">
      <FormulaLabel x={28} y={68} parts={["CH", sub("3")]} />
      <Bond x1={46} y1={68} x2={75} y2={68} />
      <FormulaLabel x={89} y={68} parts={["CH"]} />
      <Bond x1={89} y1={55} x2={89} y2={32} />
      <FormulaLabel x={89} y={22} parts={["OH"]} />
      <Bond x1={102} y1={68} x2={128} y2={68} />
      <AtomLabel x={139} y={68}>C</AtomLabel>
      <CarbonylUp cX={139} cY={68} oY={29} />
      <Bond x1={150} y1={68} x2={160} y2={68} />
      <FormulaLabel x={172} y={68} parts={["OH"]} />
    </ChemSvg>
  )
}

export function PyruvicAcidStructure() {
  return (
    <ChemSvg label="Pyruvic acid">
      <FormulaLabel x={25} y={68} parts={["CH", sub("3")]} />
      <Bond x1={44} y1={68} x2={73} y2={68} />
      <AtomLabel x={84} y={68}>C</AtomLabel>
      <CarbonylUp cX={84} cY={68} oY={29} />
      <Bond x1={95} y1={68} x2={123} y2={68} />
      <AtomLabel x={134} y={68}>C</AtomLabel>
      <CarbonylUp cX={134} cY={68} oY={29} />
      <Bond x1={145} y1={68} x2={158} y2={68} />
      <FormulaLabel x={171} y={68} parts={["OH"]} />
    </ChemSvg>
  )
}

export function MoleculeNode({
  title,
  subtitle,
  children,
  tone = "neutral",
  featured = false,
  compact = false,
  active = false,
  dimmed = false,
  selected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
}) {
  const colors = toneMap[tone] || toneMap.neutral
  const interactive = typeof onClick === "function"
  const borderWidth = selected || featured || active ? 2 : 1

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: colors.bg,
        border: `${borderWidth}px solid ${selected || active ? colors.accent : colors.border}`,
        borderRadius: 8,
        boxShadow: selected || featured || active ? colors.shadow : "none",
        cursor: interactive ? "pointer" : "default",
        minWidth: compact ? 156 : 184,
        opacity: dimmed ? 0.38 : 1,
        outline: "none",
        padding: compact ? 8 : 10,
        transform: active || selected ? "translateY(-1px)" : "none",
        transition: "opacity 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
        ...style,
      }}
    >
      <div style={{ color: TEXT, fontSize: compact ? 11.5 : 12.5, fontWeight: 900, lineHeight: 1.2 }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ color: colors.accent, fontSize: compact ? 10 : 10.5, fontWeight: 800, lineHeight: 1.3, marginTop: 3 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ alignItems: "center", display: "flex", justifyContent: "center", marginTop: compact ? 3 : 6 }}>
        {children}
      </div>
    </div>
  )
}
