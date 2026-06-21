import { INTERVAL_SEMITONES, type Interval, type IntervalType, type Note } from '../../contracts'
import { noteFromMidi } from './notes'

export function getTargetNote(root: Note, intervalType: IntervalType, referencePitch = 440): Note {
  const semitones = INTERVAL_SEMITONES[intervalType]
  return noteFromMidi(root.midi + semitones, referencePitch)
}

export function getInterval(root: Note, intervalType: IntervalType, referencePitch = 440): Interval {
  const semitones = INTERVAL_SEMITONES[intervalType]
  const targetNote = getTargetNote(root, intervalType, referencePitch)
  return {
    type: intervalType,
    semitones,
    rootNote: root,
    targetNote,
  }
}
