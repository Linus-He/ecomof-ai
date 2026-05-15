const LINE = "#111827"
const TEXT = "#111827"
const MUTED = "#374151"
const NODE_BORDER = "#D9E2EC"
const STROKE = 2.1
const FONT_SIZE = 13
const SUB_SIZE = 9

function ChemSvg({ label, children, width = 168, height = 112, viewBox = "0 0 168 112", style }) {
  return (
    <svg
      role="img"
      aria-label={`${label} structure`}
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ display: "block", maxWidth: "100%", overflow: "visible", ...style }}
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
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ox = (-dy / len) * (gap / 2)
  const oy = (dx / len) * (gap / 2)

  return (
    <>
      <Bond x1={x1 + ox} y1={y1 + oy} x2={x2 + ox} y2={y2 + oy} width={1.8} />
      <Bond x1={x1 - ox} y1={y1 - oy} x2={x2 - ox} y2={y2 - oy} width={1.8} />
    </>
  )
}

function Label({ x, y, children, anchor = "middle", size = FONT_SIZE, weight = 650, fill = TEXT }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fill={fill}
      fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fontSize={size}
      fontWeight={weight}
    >
      {children}
    </text>
  )
}

function FormulaLabel({ x, y, parts, anchor = "middle", size = FONT_SIZE, fill = TEXT }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fill={fill}
      fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fontSize={size}
      fontWeight={650}
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

function Carbonyl({ cx, cy, ox, oy, label = "O" }) {
  return (
    <>
      <DoubleBond x1={cx} y1={cy - 6} x2={ox} y2={oy + 8} />
      <Label x={ox} y={oy}>{label}</Label>
    </>
  )
}

function RingBond({ points, closed = true }) {
  return (
    <polyline
      points={points.map(([x, y]) => `${x},${y}`).join(" ")}
      fill="none"
      stroke={LINE}
      strokeWidth={STROKE}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  )
}

export function GlucoseStructure() {
  const ring = [[42, 56], [66, 30], [102, 30], [126, 56], [106, 84], [64, 84], [42, 56]]
  return (
    <ChemSvg label="Glucose">
      <RingBond points={ring} />
      <Label x={114} y={43}>O</Label>
      <Bond x1={66} y1={30} x2={60} y2={14} />
      <FormulaLabel x={45} y={14} parts={["CH", { sub: "2" }, "OH"]} anchor="middle" />
      <Bond x1={42} y1={56} x2={25} y2={48} />
      <Label x={17} y={45}>OH</Label>
      <Bond x1={64} y1={84} x2={56} y2={101} />
      <Label x={49} y={104}>OH</Label>
      <Bond x1={106} y1={84} x2={118} y2={99} />
      <Label x={126} y={103}>OH</Label>
      <Bond x1={126} y1={56} x2={144} y2={48} />
      <Label x={153} y={45}>OH</Label>
      <Label x={84} y={58} size={11} fill={MUTED}>glucopyranose</Label>
    </ChemSvg>
  )
}

export function FructoseStructure() {
  const ring = [[48, 62], [72, 34], [106, 42], [116, 76], [78, 92], [48, 62]]
  return (
    <ChemSvg label="Fructose">
      <RingBond points={ring} />
      <Label x={74} y={38}>O</Label>
      <Bond x1={48} y1={62} x2={31} y2={52} />
      <FormulaLabel x={21} y={49} parts={["CH", { sub: "2" }, "OH"]} />
      <Bond x1={106} y1={42} x2={126} y2={28} />
      <FormulaLabel x={146} y={25} parts={["CH", { sub: "2" }, "OH"]} />
      <Bond x1={116} y1={76} x2={135} y2={83} />
      <Label x={149} y={86}>OH</Label>
      <Bond x1={78} y1={92} x2={75} y2={108} />
      <Label x={75} y={109}>OH</Label>
      <Bond x1={72} y1={34} x2={66} y2={17} />
      <Label x={62} y={12}>OH</Label>
      <Label x={86} y={66} size={11} fill={MUTED}>fructofuranose</Label>
    </ChemSvg>
  )
}

export function FormaldehydeStructure() {
  return (
    <ChemSvg label="Formaldehyde" height={96} viewBox="0 0 168 96">
      <Label x={84} y={54}>C</Label>
      <Carbonyl cx={84} cy={54} ox={84} oy={19} />
      <Bond x1={73} y1={54} x2={43} y2={54} />
      <Label x={31} y={54}>H</Label>
      <Bond x1={95} y1={54} x2={125} y2={54} />
      <Label x={137} y={54}>H</Label>
    </ChemSvg>
  )
}

export function GlyceraldehydeStructure() {
  return (
    <ChemSvg label="Glyceraldehyde">
      <Label x={18} y={62}>HO</Label>
      <Bond x1={30} y1={62} x2={50} y2={62} />
      <FormulaLabel x={64} y={62} parts={["CH", { sub: "2" }]} />
      <Bond x1={77} y1={62} x2={98} y2={62} />
      <Label x={111} y={62}>CH</Label>
      <Bond x1={111} y1={49} x2={111} y2={28} />
      <Label x={111} y={18}>OH</Label>
      <Bond x1={124} y1={62} x2={140} y2={62} />
      <Label x={151} y={62}>C</Label>
      <Carbonyl cx={151} cy={62} ox={151} oy={27} />
      <Bond x1={154} y1={71} x2={160} y2={88} />
      <Label x={163} y={99}>H</Label>
    </ChemSvg>
  )
}

export function PyruvaldehydeStructure() {
  return (
    <ChemSvg label="Pyruvaldehyde">
      <FormulaLabel x={30} y={64} parts={["CH", { sub: "3" }]} />
      <Bond x1={48} y1={64} x2={76} y2={64} />
      <Label x={88} y={64}>C</Label>
      <Carbonyl cx={88} cy={64} ox={88} oy={28} />
      <Bond x1={100} y1={64} x2={128} y2={64} />
      <Label x={140} y={64}>C</Label>
      <Carbonyl cx={140} cy={64} ox={140} oy={28} />
      <Bond x1={144} y1={73} x2={154} y2={91} />
      <Label x={158} y={101}>H</Label>
    </ChemSvg>
  )
}

export function FormicAcidStructure() {
  return (
    <ChemSvg label="Formic acid" height={96} viewBox="0 0 168 96">
      <Label x={52} y={58}>H</Label>
      <Bond x1={64} y1={58} x2={84} y2={58} />
      <Label x={96} y={58}>C</Label>
      <Carbonyl cx={96} cy={58} ox={96} oy={20} />
      <Bond x1={108} y1={58} x2={132} y2={58} />
      <Label x={148} y={58}>OH</Label>
    </ChemSvg>
  )
}

export function GlycolicAcidStructure() {
  return (
    <ChemSvg label="Glycolic acid">
      <Label x={20} y={64}>HO</Label>
      <Bond x1={33} y1={64} x2={56} y2={64} />
      <FormulaLabel x={73} y={64} parts={["CH", { sub: "2" }]} />
      <Bond x1={89} y1={64} x2={113} y2={64} />
      <Label x={126} y={64}>C</Label>
      <Carbonyl cx={126} cy={64} ox={126} oy={28} />
      <Bond x1={137} y1={64} x2={151} y2={64} />
      <Label x={159} y={64}>OH</Label>
    </ChemSvg>
  )
}

export function AceticAcidStructure() {
  return (
    <ChemSvg label="Acetic acid" height={96} viewBox="0 0 168 96">
      <FormulaLabel x={43} y={58} parts={["CH", { sub: "3" }]} />
      <Bond x1={61} y1={58} x2={90} y2={58} />
      <Label x={102} y={58}>C</Label>
      <Carbonyl cx={102} cy={58} ox={102} oy={20} />
      <Bond x1={114} y1={58} x2={137} y2={58} />
      <Label x={153} y={58}>OH</Label>
    </ChemSvg>
  )
}

export function LacticAcidStructure() {
  return (
    <ChemSvg label="Lactic acid">
      <FormulaLabel x={28} y={64} parts={["CH", { sub: "3" }]} />
      <Bond x1={46} y1={64} x2={73} y2={64} />
      <Label x={87} y={64}>CH</Label>
      <Bond x1={87} y1={50} x2={87} y2={30} />
      <Label x={87} y={20}>OH</Label>
      <Bond x1={101} y1={64} x2={125} y2={64} />
      <Label x={137} y={64}>C</Label>
      <Carbonyl cx={137} cy={64} ox={137} oy={28} />
      <Bond x1={148} y1={64} x2={157} y2={64} />
      <Label x={164} y={64}>OH</Label>
    </ChemSvg>
  )
}

export function PyruvicAcidStructure() {
  return (
    <ChemSvg label="Pyruvic acid">
      <FormulaLabel x={26} y={64} parts={["CH", { sub: "3" }]} />
      <Bond x1={45} y1={64} x2={72} y2={64} />
      <Label x={84} y={64}>C</Label>
      <Carbonyl cx={84} cy={64} ox={84} oy={28} />
      <Bond x1={96} y1={64} x2={121} y2={64} />
      <Label x={133} y={64}>C</Label>
      <Carbonyl cx={133} cy={64} ox={133} oy={28} />
      <Bond x1={144} y1={64} x2={156} y2={64} />
      <Label x={164} y={64}>OH</Label>
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
  style,
}) {
  const toneMap = {
    neutral: { border: NODE_BORDER, bg: "#FFFFFF", accent: "#475569" },
    positive: { border: "#147C43", bg: "#F7FEFA", accent: "#147C43" },
    mixed: { border: "#C98530", bg: "#FFFDF8", accent: "#A15C13" },
    risk: { border: "#B35A32", bg: "#FFFCFA", accent: "#8F3B1B" },
    feedstock: { border: "#B8C5D4", bg: "#FFFFFF", accent: "#1A6DB5" },
  }
  const colors = toneMap[tone] || toneMap.neutral

  return (
    <div
      style={{
        background: colors.bg,
        border: `${featured ? 2 : 1}px solid ${colors.border}`,
        borderRadius: 8,
        boxShadow: featured ? "0 8px 22px rgba(20, 124, 67, 0.12)" : "none",
        minWidth: compact ? 148 : 176,
        padding: compact ? 8 : 10,
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
