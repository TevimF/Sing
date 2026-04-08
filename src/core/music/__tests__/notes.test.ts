import { describe, it, expect } from 'vitest'
import {
  frequencyFromMidi,
  midiFromFrequency,
  noteNameFromMidi,
  octaveFromMidi,
  noteFromMidi,
  midiFromNoteName,
} from '../notes'

describe('frequencyFromMidi', () => {
  it('should return 440 for MIDI 69 (A4)', () => {
    expect(frequencyFromMidi(69)).toBeCloseTo(440, 2)
  })

  it('should return 261.63 for MIDI 60 (C4)', () => {
    expect(frequencyFromMidi(60)).toBeCloseTo(261.63, 1)
  })

  it('should return 880 for MIDI 81 (A5)', () => {
    expect(frequencyFromMidi(81)).toBeCloseTo(880, 2)
  })

  it('should return 220 for MIDI 57 (A3)', () => {
    expect(frequencyFromMidi(57)).toBeCloseTo(220, 2)
  })

  it('should double frequency every 12 semitones', () => {
    const f1 = frequencyFromMidi(60)
    const f2 = frequencyFromMidi(72)
    expect(f2).toBeCloseTo(f1 * 2, 2)
  })

  it('should use custom reference pitch', () => {
    expect(frequencyFromMidi(69, 442)).toBeCloseTo(442, 2)
  })
})

describe('midiFromFrequency', () => {
  it('should return 69 for 440Hz', () => {
    expect(midiFromFrequency(440)).toBe(69)
  })

  it('should return 60 for 261.63Hz', () => {
    expect(midiFromFrequency(261.63)).toBe(60)
  })

  it('should round to nearest MIDI note', () => {
    expect(midiFromFrequency(445)).toBe(69) // still closest to A4
  })

  it('should return 81 for 880Hz', () => {
    expect(midiFromFrequency(880)).toBe(81)
  })
})

describe('noteNameFromMidi', () => {
  it('should return C for MIDI 60', () => {
    expect(noteNameFromMidi(60)).toBe('C')
  })

  it('should return A for MIDI 69', () => {
    expect(noteNameFromMidi(69)).toBe('A')
  })

  it('should return C# for MIDI 61', () => {
    expect(noteNameFromMidi(61)).toBe('C#')
  })

  it('should return B for MIDI 71', () => {
    expect(noteNameFromMidi(71)).toBe('B')
  })

  it('should wrap correctly for MIDI 0 (C)', () => {
    expect(noteNameFromMidi(0)).toBe('C')
  })
})

describe('octaveFromMidi', () => {
  it('should return 4 for MIDI 60 (C4)', () => {
    expect(octaveFromMidi(60)).toBe(4)
  })

  it('should return 4 for MIDI 69 (A4)', () => {
    expect(octaveFromMidi(69)).toBe(4)
  })

  it('should return -1 for MIDI 0', () => {
    expect(octaveFromMidi(0)).toBe(-1)
  })

  it('should return 5 for MIDI 72 (C5)', () => {
    expect(octaveFromMidi(72)).toBe(5)
  })
})

describe('noteFromMidi', () => {
  it('should return full Note object for A4', () => {
    const note = noteFromMidi(69)
    expect(note.name).toBe('A')
    expect(note.octave).toBe(4)
    expect(note.frequency).toBeCloseTo(440, 2)
    expect(note.midi).toBe(69)
  })

  it('should return full Note object for C4', () => {
    const note = noteFromMidi(60)
    expect(note.name).toBe('C')
    expect(note.octave).toBe(4)
    expect(note.frequency).toBeCloseTo(261.63, 1)
    expect(note.midi).toBe(60)
  })
})

describe('midiFromNoteName', () => {
  it('should return 69 for A4', () => {
    expect(midiFromNoteName('A', 4)).toBe(69)
  })

  it('should return 60 for C4', () => {
    expect(midiFromNoteName('C', 4)).toBe(60)
  })

  it('should return 61 for C#4', () => {
    expect(midiFromNoteName('C#', 4)).toBe(61)
  })

  it('should return 48 for C3', () => {
    expect(midiFromNoteName('C', 3)).toBe(48)
  })

  it('should be inverse of noteFromMidi', () => {
    const midi = 65
    const note = noteFromMidi(midi)
    expect(midiFromNoteName(note.name, note.octave)).toBe(midi)
  })
})
