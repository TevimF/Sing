import { type Exercise, type ExerciseSet, type IntervalType, type NoteName } from '../../contracts'
import { midiFromNoteName, noteFromMidi } from './notes'
import { getTargetNote } from './intervals'

const DEFAULT_OCTAVE = 4

export function createExercise(root: import('../../contracts').Note, intervalType: IntervalType): Exercise {
  const targetNote = getTargetNote(root, intervalType)
  return {
    id: crypto.randomUUID(),
    intervalType,
    rootNote: root,
    targetNote,
    toleranceCents: 10,
    status: 'pending',
    bestCentsOffset: null,
    holdDurationMs: 1000,
  }
}

export function createExerciseSet(key: NoteName, intervals: IntervalType[], octaveOffset = 0): ExerciseSet {
  const rootMidi = midiFromNoteName(key, DEFAULT_OCTAVE + octaveOffset)
  const root = noteFromMidi(rootMidi)
  const exercises = intervals.map((interval) => createExercise(root, interval))

  return {
    id: crypto.randomUUID(),
    name: `${key} - ${intervals.length} intervalos`,
    key,
    intervals,
    exercises,
    currentIndex: 0,
  }
}
