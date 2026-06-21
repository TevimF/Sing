import { type PitchResult } from '../../contracts'
import { noteNameFromMidi, octaveFromMidi, frequencyFromMidi } from '../../core/music/notes'

interface LiveReadoutProps {
  pitch: PitchResult | null
  isListening: boolean
  targetMidi: number | null
}

const TUNED_TOLERANCE_CENTS = 10

export function LiveReadout({ pitch, isListening, targetMidi }: LiveReadoutProps) {
  const hasPitch = pitch?.midiNote !== null && pitch?.midiNote !== undefined
  const midi = pitch?.midiNote ?? null
  const cents = pitch?.centsOffset ?? null
  const clarity = pitch?.clarity ?? 0
  const noteLetter = midi !== null ? noteNameFromMidi(midi) : null
  const oct = midi !== null ? octaveFromMidi(midi) : null

  const isTuned = cents !== null && Math.abs(cents) <= TUNED_TOLERANCE_CENTS
  const isMatchingTarget = midi !== null && targetMidi !== null && midi === targetMidi && isTuned

  // Cents bar position: -50..+50 mapped to 0..100%
  const centsClamped = cents !== null ? Math.max(-50, Math.min(50, cents)) : 0
  const needleLeft = ((centsClamped + 50) / 100) * 100

  const letter = noteLetter ? noteLetter.replace('#', '') : null
  const isSharp = noteLetter?.includes('#') ?? false

  const noteColor = isMatchingTarget
    ? 'readout__note--accent'
    : !isListening || !hasPitch
      ? 'readout__note--idle'
      : ''

  const needleClass = !hasPitch
    ? ''
    : isTuned
      ? 'cents-bar__needle--good'
      : Math.abs(cents ?? 0) > 35
        ? 'cents-bar__needle--off'
        : ''

  return (
    <aside className="readout">
      <div className="readout__head">
        <div className="readout__head-label">
          <span className={`readout__dot ${isListening && hasPitch ? 'readout__dot--live' : ''}`} />
          <span className="eyebrow">
            {isListening ? (hasPitch ? 'Sintonia' : 'Escutando…') : 'Em silêncio'}
          </span>
        </div>
        {targetMidi !== null && (
          <span className="eyebrow eyebrow--amber">
            Alvo&nbsp;·&nbsp;{noteNameFromMidi(targetMidi)}{octaveFromMidi(targetMidi)}
          </span>
        )}
      </div>

      <div className="readout__stage">
        <span className={`readout__note ${noteColor}`}>
          {letter ?? '—'}
          {isSharp && <span className="readout__accidental">♯</span>}
        </span>
        {oct !== null && hasPitch && (
          <span className="readout__oct">/{oct}</span>
        )}
      </div>

      <div className="cents-bar" aria-label="Desvio em cents">
        <span className="cents-bar__label cents-bar__label--l">−50¢</span>
        <span className="cents-bar__center" />
        <span className="cents-bar__tick" style={{ left: '25%' }} />
        <span className="cents-bar__tick" style={{ left: '75%' }} />
        <span className="cents-bar__label cents-bar__label--r">+50¢</span>
        {hasPitch && (
          <span
            className={`cents-bar__needle ${needleClass}`}
            style={{ left: `${needleLeft}%` }}
          />
        )}
      </div>

      <div className="readout__meta">
        <div className="readout__meta-row">
          <span className="readout__meta-label">Frequência</span>
          <span className="readout__meta-value">
            {hasPitch && midi !== null ? `${frequencyFromMidi(midi).toFixed(1)} Hz` : '— Hz'}
          </span>
        </div>
        <div className="readout__meta-row">
          <span className="readout__meta-label">Desvio</span>
          <span
            className={`readout__meta-value ${
              hasPitch && cents !== null
                ? isTuned
                  ? 'readout__meta-value--accent'
                  : Math.abs(cents) > 35
                    ? 'readout__meta-value--warn'
                    : ''
                : ''
            }`}
          >
            {hasPitch && cents !== null
              ? `${cents >= 0 ? '+' : ''}${cents.toFixed(0)}¢`
              : '— ¢'}
          </span>
        </div>
        <div className="readout__meta-row">
          <span className="readout__meta-label">Clareza</span>
          <span className="readout__meta-value">
            {hasPitch ? `${Math.round(clarity * 100)}%` : '— %'}
          </span>
        </div>
        <div className="readout__meta-row">
          <span className="readout__meta-label">Estado</span>
          <span className={`readout__meta-value ${isMatchingTarget ? 'readout__meta-value--accent' : ''}`}>
            {!isListening
              ? 'idle'
              : !hasPitch
                ? 'searching'
                : isMatchingTarget
                  ? 'on target'
                  : isTuned
                    ? 'in tune'
                    : 'drift'}
          </span>
        </div>
      </div>
    </aside>
  )
}
