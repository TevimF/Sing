import { type PitchResult } from '../../contracts'
import { noteNameFromMidi, octaveFromMidi } from '../../core/music/notes'

interface PianoStripProps {
  pitch: PitchResult | null
  targetMidi?: number | null
}

const PIANO_LOW = 48  // C3
const PIANO_HIGH = 72 // C5
const KEYS = Array.from({ length: PIANO_HIGH - PIANO_LOW + 1 }, (_, i) => PIANO_LOW + i)

export function PianoStrip({ pitch, targetMidi = null }: PianoStripProps) {
  const currentMidi = pitch?.midiNote ?? null

  return (
    <div className="piano-strip">
      <div className="piano-strip__keys">
        {KEYS.map((midi) => {
          const noteIndex = midi % 12
          const isBlack = [1, 3, 6, 8, 10].includes(noteIndex)
          const isActive = currentMidi === midi
          const isTarget = targetMidi === midi
          const name = noteNameFromMidi(midi)
          const oct = octaveFromMidi(midi)
          const isC = noteIndex === 0

          return (
            <div
              key={midi}
              className={[
                'piano-key',
                isBlack ? 'piano-key--black' : 'piano-key--white',
                isActive ? 'piano-key--active' : '',
                isTarget ? 'piano-key--target' : '',
              ].join(' ')}
              title={`${name}${oct}`}
            >
              {isC && <span className="piano-key__label">{name}{oct}</span>}
            </div>
          )
        })}
      </div>
      <div className="piano-strip__info">
        {pitch && currentMidi !== null ? (
          <>
            <span className="piano-strip__note">
              {noteNameFromMidi(currentMidi)}{octaveFromMidi(currentMidi)}
            </span>
            <span className="piano-strip__freq">{pitch.frequency.toFixed(1)} Hz</span>
            <span className="piano-strip__cents">
              {pitch.centsOffset !== null
                ? `${pitch.centsOffset >= 0 ? '+' : ''}${pitch.centsOffset.toFixed(0)}c`
                : ''}
            </span>
          </>
        ) : (
          <span className="piano-strip__note piano-strip__note--dim">--</span>
        )}
      </div>
    </div>
  )
}
