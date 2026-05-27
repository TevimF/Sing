import { SCALE_INTERVALS, type NoteName, type ScaleMode } from '../../contracts'
import { midiFromNoteName } from './notes'

/**
 * Returns all MIDI notes that belong to the chosen scale of the given key,
 * within the requested MIDI range. The set is used to paint the piano keys
 * and graph background that should "look like home" for the singer.
 */
export function getScaleMidiNotes(
  key: NoteName,
  mode: ScaleMode,
  midiLow: number,
  midiHigh: number,
): Set<number> {
  const rootMidi = midiFromNoteName(key, 0)
  const intervals = SCALE_INTERVALS[mode]
  const scaleNotes = new Set<number>()

  for (let octave = -1; octave <= 9; octave++) {
    for (const interval of intervals) {
      const midi = rootMidi + octave * 12 + interval
      if (midi >= midiLow && midi <= midiHigh) {
        scaleNotes.add(midi)
      }
    }
  }

  return scaleNotes
}
