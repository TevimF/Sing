import { PitchDetector } from 'pitchy'
import { type PitchResult } from '../../contracts'
import { midiFromFrequency, noteNameFromMidi, octaveFromMidi } from '../music/notes'
import { centsFromNearestNote } from '../music/cents'

let cachedDetector: ReturnType<typeof PitchDetector.forFloat32Array> | null = null
let cachedBufferSize = 0

function getDetector(bufferSize: number) {
  if (!cachedDetector || cachedBufferSize !== bufferSize) {
    cachedDetector = PitchDetector.forFloat32Array(bufferSize)
    cachedBufferSize = bufferSize
  }
  return cachedDetector
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  clarityThreshold: number,
  referencePitch: number,
): PitchResult | null {
  const detector = getDetector(buffer.length)
  const [frequency, clarity] = detector.findPitch(buffer, sampleRate)

  if (clarity < clarityThreshold || frequency <= 0) {
    return null
  }

  const midi = midiFromFrequency(frequency, referencePitch)
  const noteName = noteNameFromMidi(midi)
  const octave = octaveFromMidi(midi)
  const { cents } = centsFromNearestNote(frequency, referencePitch)

  return {
    frequency,
    clarity,
    timestamp: performance.now(),
    midiNote: midi,
    noteName: `${noteName}${octave}`,
    centsOffset: cents,
  }
}
