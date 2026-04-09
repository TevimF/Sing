import { useRef, useCallback, useEffect, useState } from 'react'
import { type PitchResult } from '../../contracts'
import { useExerciseStore } from '../../stores/exercise.store'
import { TonePlayer } from '../../core/audio/tone-player'

interface ExerciseDisplayProps {
  pitch: PitchResult | null
}

const HOLD_DURATION_MS = 1500
const VIBRATO_WINDOW_MS = 2000
const VIBRATO_MIN_OSCILLATIONS = 3
const VIBRATO_MIN_RANGE_CENTS = 30
const VIBRATO_MAX_RANGE_CENTS = 200

export function ExerciseDisplay({ pitch }: ExerciseDisplayProps) {
  const { exerciseSet, completeCurrentExercise, nextExercise, jumpToExercise, shiftOctave } = useExerciseStore()
  const tonePlayerRef = useRef<TonePlayer>(new TonePlayer())
  const [holdProgress, setHoldProgress] = useState(0)
  const holdStartRef = useRef<number | null>(null)
  const holdRafRef = useRef<number>(0)
  const [vibratoDetected, setVibratoDetected] = useState(false)
  const pitchHistoryRef = useRef<{ cents: number; time: number }[]>([])

  const playTarget = useCallback(() => {
    if (!exerciseSet) return
    const current = exerciseSet.exercises[exerciseSet.currentIndex]
    if (!current) return
    tonePlayerRef.current.playNote(current.targetNote.frequency, 800)
  }, [exerciseSet])

  const playChord = useCallback(() => {
    if (!exerciseSet) return
    const current = exerciseSet.exercises[exerciseSet.currentIndex]
    if (!current) return
    tonePlayerRef.current.playNotes([current.rootNote.frequency, current.targetNote.frequency], 800)
  }, [exerciseSet])

  const playRoot = useCallback(() => {
    if (!exerciseSet) return
    const current = exerciseSet.exercises[exerciseSet.currentIndex]
    if (!current) return
    tonePlayerRef.current.playNote(current.rootNote.frequency, 800)
  }, [exerciseSet])

  const current = exerciseSet?.exercises[exerciseSet.currentIndex] ?? null
  const isVibrato = current?.intervalType === 'vibrato'
  const targetMidi = current?.targetNote.midi ?? null
  const currentCents = pitch?.centsOffset ?? null
  const currentMidi = pitch?.midiNote ?? null
  
  // Octave Equivalency: check if the pitch class (modulo 12) matches the target.
  const isPitchClassMatch = currentMidi !== null && targetMidi !== null && (currentMidi % 12 === targetMidi % 12)
  const isOnTarget = !isVibrato && isPitchClassMatch && currentCents !== null && Math.abs(currentCents) <= (current?.toleranceCents ?? 10)

  // Vibrato detection
  useEffect(() => {
    if (!isVibrato || !pitch || !current) return

    const now = performance.now()
    const rootMidi = current.rootNote.midi
    const pitchMidi = pitch.midiNote
    if (pitchMidi === null) return

    const midiDiff = pitchMidi - rootMidi
    if (Math.abs(midiDiff) > 2) return // too far from root, ignore

    const centsFromRoot = midiDiff * 100 + (pitch.centsOffset ?? 0)
    pitchHistoryRef.current.push({ cents: centsFromRoot, time: now })

    // Trim old samples
    const cutoff = now - VIBRATO_WINDOW_MS
    pitchHistoryRef.current = pitchHistoryRef.current.filter((s) => s.time > cutoff)

    const samples = pitchHistoryRef.current
    if (samples.length < 10) return

    // Detect oscillations: count direction changes
    let dirChanges = 0
    let minCents = samples[0].cents
    let maxCents = samples[0].cents
    let lastDir = 0

    for (let i = 1; i < samples.length; i++) {
      const diff = samples[i].cents - samples[i - 1].cents
      minCents = Math.min(minCents, samples[i].cents)
      maxCents = Math.max(maxCents, samples[i].cents)
      const dir = diff > 0 ? 1 : diff < 0 ? -1 : 0
      if (dir !== 0 && dir !== lastDir) {
        dirChanges++
        lastDir = dir
      }
    }

    const range = maxCents - minCents
    const hasVibrato =
      dirChanges >= VIBRATO_MIN_OSCILLATIONS * 2 &&
      range >= VIBRATO_MIN_RANGE_CENTS &&
      range <= VIBRATO_MAX_RANGE_CENTS

    setVibratoDetected(hasVibrato)
  }, [pitch, isVibrato, current])

  // Reset vibrato state on exercise change
  useEffect(() => {
    setVibratoDetected(false)
    pitchHistoryRef.current = []
  }, [current?.id])

  // Hold timer logic
  useEffect(() => {
    const shouldHold = isOnTarget || (isVibrato && vibratoDetected)

    if (shouldHold && current?.status === 'active') {
      if (holdStartRef.current === null) {
        holdStartRef.current = performance.now()
      }

      const animate = () => {
        if (holdStartRef.current === null) return
        const elapsed = performance.now() - holdStartRef.current
        const progress = Math.min(1, elapsed / HOLD_DURATION_MS)
        setHoldProgress(progress)

        if (progress >= 1) {
          // Auto-complete, but do not progress automatically
          completeCurrentExercise(currentCents ?? 0)
          holdStartRef.current = null
          setHoldProgress(0)
          return
        }
        holdRafRef.current = requestAnimationFrame(animate)
      }
      holdRafRef.current = requestAnimationFrame(animate)
    } else {
      holdStartRef.current = null
      setHoldProgress(0)
      cancelAnimationFrame(holdRafRef.current)
    }

    return () => cancelAnimationFrame(holdRafRef.current)
  }, [isOnTarget, vibratoDetected, isVibrato, current?.status, current?.id, completeCurrentExercise, nextExercise, exerciseSet, currentCents])

  if (!exerciseSet || !current) return null

  const isLast = exerciseSet.currentIndex >= exerciseSet.exercises.length - 1
  const allDone = exerciseSet.exercises.every((e) => e.status === 'completed')

  const handleSkip = () => {
    completeCurrentExercise(999)
    if (!isLast) {
      setTimeout(() => nextExercise(), 300)
    }
  }

  const showHoldIndicator = (isOnTarget || (isVibrato && vibratoDetected)) && current.status === 'active'

  return (
    <div className="exercise-display">
      <div className="exercise-display__header" style={{ alignItems: 'center' }}>
        <span className="exercise-display__progress">
          {exerciseSet.currentIndex + 1} / {exerciseSet.exercises.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.5rem' }} onClick={() => shiftOctave(-1)} title="Descer Oitava">-</button>
          <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Oitava {current.rootNote.octave}</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.5rem' }} onClick={() => shiftOctave(1)} title="Subir Oitava">+</button>
        </div>
        <span className="exercise-display__interval">{formatInterval(current.intervalType)}</span>
      </div>

      <div className="exercise-display__notes" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="exercise-display__note exercise-display__note--playable" onClick={playRoot} style={{ flex: 1, minWidth: '80px' }}>
          <span className="label">Raiz (Tom)</span>
          <span className="note">{current.rootNote.name}{current.rootNote.octave}</span>
          <span className="play-hint">Tocar</span>
        </button>

        {!isVibrato && (
          <button className="exercise-display__note exercise-display__note--playable" onClick={playChord} style={{ flex: 1, minWidth: '80px', border: '1px solid var(--accent-dim)' }}>
            <span className="label">Acorde</span>
            <span className="note">{'🎵'}</span>
            <span className="play-hint">Ouvir Junção</span>
          </button>
        )}

        <button
          className={`exercise-display__note exercise-display__note--playable ${isOnTarget || (isVibrato && vibratoDetected) ? 'on-target' : ''}`}
          onClick={playTarget}
          style={{ flex: 1, minWidth: '80px' }}
        >
          <span className="label">{isVibrato ? 'Vibrato' : 'Alvo'}</span>
          <span className="note">
            {isVibrato ? `${current.rootNote.name}${current.rootNote.octave}~` : `${current.targetNote.name}${current.targetNote.octave}`}
          </span>
          <span className="play-hint">Tocar</span>
        </button>
      </div>

      {/* Hold progress bar */}
      {showHoldIndicator && (
        <div className="hold-progress">
          <div className="hold-progress__bar">
            <div className="hold-progress__fill" style={{ width: `${holdProgress * 100}%` }} />
          </div>
          <span className="hold-progress__label">Segure a nota...</span>
        </div>
      )}

      <div className="exercise-display__actions">
        {current.status === 'active' ? (
          <button className="btn btn--secondary" onClick={handleSkip}>
            Pular
          </button>
        ) : !isLast ? (
          <button className="btn" style={{ background: '#4ade80', color: '#000' }} onClick={() => nextExercise()}>
            Próximo Exercício
          </button>
        ) : null}
      </div>

      {allDone && (
        <div className="exercise-display__done">
          Exercicios completos!
        </div>
      )}

      <div className="exercise-display__history">
        {exerciseSet.exercises.map((ex, i) => (
          <div 
            key={ex.id} 
            className={`history-item ${ex.status}`}
            onClick={() => jumpToExercise(i)}
            style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '0.5rem' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseOut={(e) => e.currentTarget.style.background = ex.status === 'active' ? 'var(--surface-2)' : 'transparent'}
          >
            <span>{formatInterval(ex.intervalType)}</span>
            {ex.status === 'completed' && (
              <span className="history-item__cents">
                {ex.bestCentsOffset !== null && ex.bestCentsOffset < 900
                  ? `${ex.bestCentsOffset > 0 ? '+' : ''}${ex.bestCentsOffset.toFixed(0)}c`
                  : 'pulou'}
              </span>
            )}
            {i === exerciseSet.currentIndex && ex.status === 'active' && (
              <span className="history-item__current">◀</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatInterval(type: string): string {
  const labels: Record<string, string> = {
    unison: 'Unissono',
    minor_second: '2a menor',
    major_second: '2a maior',
    minor_third: '3a menor',
    major_third: '3a maior',
    perfect_fourth: '4a justa',
    tritone: 'Tritono',
    perfect_fifth: '5a justa',
    minor_sixth: '6a menor',
    major_sixth: '6a maior',
    minor_seventh: '7a menor',
    major_seventh: '7a maior',
    octave: 'Oitava',
    vibrato: 'Vibrato',
  }
  return labels[type] ?? type
}
