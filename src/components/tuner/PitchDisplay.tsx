import { type PitchResult } from '../../contracts'

interface PitchDisplayProps {
  pitch: PitchResult | null
}

export function PitchDisplay({ pitch }: PitchDisplayProps) {
  const noteName = pitch?.noteName ?? '--'
  const frequency = pitch ? `${pitch.frequency.toFixed(1)} Hz` : '-- Hz'
  const cents = pitch?.centsOffset
  const centsLabel = cents != null ? (cents >= 0 ? `+${cents.toFixed(0)}` : `${cents.toFixed(0)}`) : '--'
  const clarity = pitch ? Math.round(pitch.clarity * 100) : 0

  return (
    <div className="pitch-display">
      <div className="pitch-display__note">{noteName}</div>
      <div className="pitch-display__details">
        <span className="pitch-display__frequency">{frequency}</span>
        <span className="pitch-display__cents">{centsLabel} cents</span>
        <span className="pitch-display__clarity">Clareza: {clarity}%</span>
      </div>
    </div>
  )
}
