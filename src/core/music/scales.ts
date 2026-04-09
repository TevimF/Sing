import { type NoteName } from '../../contracts'
import { midiFromNoteName } from './notes'

// Major scale intervals in semitones from root
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]

/**
 * Returns all MIDI notes that belong to the major scale of the given key,
 * across the full MIDI range.
 */
export function getScaleMidiNotes(key: NoteName, midiLow: number, midiHigh: number): Set<number> {
  const rootMidi = midiFromNoteName(key, 0)
  const scaleNotes = new Set<number>()

  for (let octave = -1; octave <= 9; octave++) {
    for (const interval of MAJOR_SCALE_INTERVALS) {
      const midi = rootMidi + octave * 12 + interval
      if (midi >= midiLow && midi <= midiHigh) {
        scaleNotes.add(midi)
      }
    }
  }

  return scaleNotes
}
