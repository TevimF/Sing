import { type PitchResult } from '../../contracts'

interface TunerGaugeProps {
  pitch: PitchResult | null
  toleranceCents?: number
}

export function TunerGauge({ pitch, toleranceCents = 10 }: TunerGaugeProps) {
  const cents = pitch?.centsOffset ?? 0
  const needleAngle = Math.max(-90, Math.min(90, (cents / 50) * 90))
  const isInTune = pitch !== null && Math.abs(cents) <= toleranceCents

  return (
    <svg viewBox="0 0 300 180" className="tuner-gauge">
      {/* Background arc */}
      <path
        d="M 30 160 A 120 120 0 0 1 270 160"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* In-tune zone */}
      <path
        d={describeArc(150, 160, 120, -(toleranceCents / 50) * 90, (toleranceCents / 50) * 90)}
        fill="none"
        stroke="#2d5a2d"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Tick marks */}
      {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((c) => {
        const angle = -90 + ((c + 50) / 100) * 180
        const rad = (angle * Math.PI) / 180
        const r1 = c === 0 ? 105 : 110
        const r2 = 120
        return (
          <line
            key={c}
            x1={150 + r1 * Math.cos(rad)}
            y1={160 + r1 * Math.sin(rad)}
            x2={150 + r2 * Math.cos(rad)}
            y2={160 + r2 * Math.sin(rad)}
            stroke={c === 0 ? '#4ade80' : '#555'}
            strokeWidth={c === 0 ? 2.5 : 1.5}
          />
        )
      })}

      {/* Cent labels */}
      <text x="35" y="170" fill="#666" fontSize="10" textAnchor="middle">-50</text>
      <text x="150" y="35" fill="#888" fontSize="10" textAnchor="middle">0</text>
      <text x="265" y="170" fill="#666" fontSize="10" textAnchor="middle">+50</text>

      {/* Needle */}
      <g transform={`rotate(${needleAngle}, 150, 160)`}>
        <line
          x1="150"
          y1="160"
          x2="150"
          y2="50"
          stroke={isInTune ? '#4ade80' : pitch ? '#f59e0b' : '#555'}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'all 100ms ease-out' }}
        />
        <circle cx="150" cy="160" r="5" fill={isInTune ? '#4ade80' : pitch ? '#f59e0b' : '#555'} />
      </g>
    </svg>
  )
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle - 90)
  const end = polarToCartesian(cx, cy, r, startAngle - 90)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
