import { NOTE_NAMES, type NoteName, type IntervalType, type ScaleMode } from '../../contracts'
import { useSettingsStore } from '../../stores/settings.store'
import { useExerciseStore } from '../../stores/exercise.store'
import { useRef } from 'react'
import { TonePlayer } from '../../core/audio/tone-player'
import { midiFromNoteName, frequencyFromMidi } from '../../core/music/notes'

const SCALE_MODE_OPTIONS: { value: ScaleMode; label: string; short: string }[] = [
  { value: 'major',            label: 'Maior',          short: 'Maj' },
  { value: 'natural_minor',    label: 'Menor natural',  short: 'min' },
  { value: 'harmonic_minor',   label: 'Menor harmônica', short: 'min h.' },
  { value: 'melodic_minor',    label: 'Menor melódica',  short: 'min m.' },
  { value: 'major_pentatonic', label: 'Pent. maior',    short: 'Pent M' },
  { value: 'minor_pentatonic', label: 'Pent. menor',    short: 'Pent m' },
  { value: 'blues',            label: 'Blues',          short: 'Blues' },
  { value: 'chromatic',        label: 'Cromática',      short: 'Crom.' },
]

const INTERVAL_GROUPS: { title: string; intervals: { type: IntervalType; label: string; short: string }[] }[] = [
  {
    title: 'Basicos',
    intervals: [
      { type: 'unison', label: 'Unissono', short: 'U' },
      { type: 'octave', label: 'Oitava', short: '8a' },
    ],
  },
  {
    title: 'Tercas',
    intervals: [
      { type: 'minor_third', label: '3a menor', short: '3m' },
      { type: 'major_third', label: '3a maior', short: '3M' },
    ],
  },
  {
    title: 'Quartas & Quintas',
    intervals: [
      { type: 'perfect_fourth', label: '4a justa', short: '4J' },
      { type: 'perfect_fifth', label: '5a justa', short: '5J' },
    ],
  },
  {
    title: 'Especiais',
    intervals: [
      { type: 'vibrato', label: 'Vibrato', short: '~' },
    ],
  },
]

export function ExerciseSelector() {
  const { key, setKey, scaleMode, setScaleMode } = useSettingsStore()
  const { exerciseSet, selectedIntervals, octaveOffset, startExercises, reset } = useExerciseStore()
  const tonePlayerRef = useRef<TonePlayer>(new TonePlayer())

  const playRootPreview = () => {
    const rootMidi = midiFromNoteName(key, 4 + octaveOffset)
    tonePlayerRef.current.playNote(frequencyFromMidi(rootMidi), 1500)
  }

  const toggleInterval = (interval: IntervalType) => {
    const current = selectedIntervals
    if (current.includes(interval)) {
      if (current.length > 1) {
        useExerciseStore.setState({
          selectedIntervals: current.filter((i) => i !== interval),
        })
      }
    } else {
      useExerciseStore.setState({
        selectedIntervals: [...current, interval],
      })
    }
  }

  const setOctaveOffset = (offset: number) => {
    useExerciseStore.setState({ octaveOffset: offset })
  }

  const handleStart = () => {
    startExercises(key, selectedIntervals)
  }

  if (exerciseSet) {
    return (
      <div className="exercise-selector exercise-selector--active">
        <button className="btn btn--secondary exercise-selector__back" onClick={reset}>
          ← Voltar
        </button>
        <div className="exercise-selector__ref-group">
          <span className="exercise-selector__ref-label">Ref:</span>
          <span className="root-note-badge root-note-badge--sm">{key}4</span>
          <button
            type="button"
            className="exercise-selector__hear"
            title="Ouvir tom fixo"
            onClick={() => tonePlayerRef.current.playNote(frequencyFromMidi(midiFromNoteName(key, 4)), 1500)}
          >
            Ouvir ♪
          </button>
        </div>
      </div>
    )
  }

  const octaveLabel = octaveOffset === 0 ? '4' : octaveOffset < 0 ? `${4 + octaveOffset}` : `${4 + octaveOffset}`
  const rootDisplay = `${key}${octaveLabel}`

  return (
    <div className="exercise-selector">
      {/* Key + Octave row */}
      <div className="exercise-selector__top-row">
        <div className="exercise-selector__key-group">
          <label>Tom</label>
          <select value={key} onChange={(e) => setKey(e.target.value as NoteName)}>
            {NOTE_NAMES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="exercise-selector__octave-group">
          <label>Oitava</label>
          <div className="octave-control">
            <button
              className="octave-control__btn"
              onClick={() => setOctaveOffset(Math.max(-2, octaveOffset - 1))}
              disabled={octaveOffset <= -2}
            >
              −
            </button>
            <span className="octave-control__value">{4 + octaveOffset}</span>
            <button
              className="octave-control__btn"
              onClick={() => setOctaveOffset(Math.min(2, octaveOffset + 1))}
              disabled={octaveOffset >= 2}
            >
              +
            </button>
          </div>
        </div>

        <div className="exercise-selector__root-display">
          <span className="root-note-badge">{rootDisplay}</span>
          <button
            type="button"
            className="exercise-selector__hear"
            title="Ouvir tom selecionado"
            onClick={playRootPreview}
          >
            Ouvir ♪
          </button>
        </div>
      </div>

      {/* Scale mode — affects which keys are highlighted on the graph */}
      <div className="scale-mode-row">
        <label className="scale-mode-row__label">Escala</label>
        <div className="scale-mode-row__chips">
          {SCALE_MODE_OPTIONS.map(({ value, label, short }) => (
            <button
              key={value}
              type="button"
              className={'chip' + (scaleMode === value ? ' chip--active' : '')}
              onClick={() => setScaleMode(value)}
              title={label}
            >
              {short}
            </button>
          ))}
        </div>
      </div>

      {/* Interval groups */}
      <div className="exercise-selector__intervals">
        {INTERVAL_GROUPS.map((group) => (
          <div key={group.title} className="interval-group">
            <span className="interval-group__title">{group.title}</span>
            <div className="interval-group__chips">
              {group.intervals.map(({ type, label }) => (
                <button
                  key={type}
                  className={`chip ${selectedIntervals.includes(type) ? 'chip--active' : ''}`}
                  onClick={() => toggleInterval(type)}
                  title={label}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn--primary" onClick={handleStart} disabled={selectedIntervals.length === 0}>
        Iniciar Exercicios
      </button>
    </div>
  )
}
