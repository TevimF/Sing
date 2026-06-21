import { midiFromFrequency, frequencyFromMidi } from './notes'

export function centsBetween(freqA: number, freqB: number): number {
  return 1200 * Math.log2(freqB / freqA)
}

export function centsFromNearestNote(
  frequency: number,
  referencePitch = 440,
): { midi: number; cents: number } {
  const midi = midiFromFrequency(frequency, referencePitch)
  const exactFreq = frequencyFromMidi(midi, referencePitch)
  const cents = centsBetween(exactFreq, frequency)
  return { midi, cents }
}
