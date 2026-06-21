import { NOTE_NAMES, type Note, type NoteName } from '../../contracts'

export function frequencyFromMidi(midi: number, referencePitch = 440): number {
  return referencePitch * Math.pow(2, (midi - 69) / 12)
}

export function midiFromFrequency(frequency: number, referencePitch = 440): number {
  return Math.round(69 + 12 * Math.log2(frequency / referencePitch))
}

export function noteNameFromMidi(midi: number): NoteName {
  return NOTE_NAMES[((midi % 12) + 12) % 12]
}

export function octaveFromMidi(midi: number): number {
  return Math.floor(midi / 12) - 1
}

export function noteFromMidi(midi: number, referencePitch = 440): Note {
  return {
    name: noteNameFromMidi(midi),
    octave: octaveFromMidi(midi),
    frequency: frequencyFromMidi(midi, referencePitch),
    midi,
  }
}

export function midiFromNoteName(name: NoteName, octave: number): number {
  const index = NOTE_NAMES.indexOf(name)
  return (octave + 1) * 12 + index
}
