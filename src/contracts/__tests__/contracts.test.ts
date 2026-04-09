import { describe, it, expect } from 'vitest'
import {
  AudioConfigSchema,
  PitchResultSchema,
  NoteSchema,
  IntervalTypeSchema,
  TunerDisplaySchema,
  INTERVAL_SEMITONES,
} from '../index'

describe('AudioConfigSchema', () => {
  it('should apply defaults when parsing empty object', () => {
    const config = AudioConfigSchema.parse({})
    expect(config.sampleRate).toBe(44100)
    expect(config.bufferSize).toBe(2048)
    expect(config.clarityThreshold).toBe(0.9)
    expect(config.referencePitch).toBe(440)
  })

  it('should accept valid custom config', () => {
    const config = AudioConfigSchema.parse({
      sampleRate: 48000,
      bufferSize: 4096,
      clarityThreshold: 0.8,
      referencePitch: 442,
    })
    expect(config.sampleRate).toBe(48000)
  })

  it('should reject clarity threshold out of range', () => {
    expect(() => AudioConfigSchema.parse({ clarityThreshold: 1.5 })).toThrow()
  })
})

describe('PitchResultSchema', () => {
  it('should validate a complete pitch result', () => {
    const result = PitchResultSchema.parse({
      frequency: 440,
      clarity: 0.95,
      timestamp: 1000,
      midiNote: 69,
      noteName: 'A4',
      centsOffset: 2.5,
    })
    expect(result.frequency).toBe(440)
    expect(result.noteName).toBe('A4')
  })

  it('should accept null values for optional fields', () => {
    const result = PitchResultSchema.parse({
      frequency: 0,
      clarity: 0,
      timestamp: 0,
      midiNote: null,
      noteName: null,
      centsOffset: null,
    })
    expect(result.midiNote).toBeNull()
  })

  it('should reject negative frequency', () => {
    expect(() =>
      PitchResultSchema.parse({
        frequency: -1,
        clarity: 0.5,
        timestamp: 0,
        midiNote: null,
        noteName: null,
        centsOffset: null,
      })
    ).toThrow()
  })
})

describe('NoteSchema', () => {
  it('should validate A4', () => {
    const note = NoteSchema.parse({
      name: 'A',
      octave: 4,
      frequency: 440,
      midi: 69,
    })
    expect(note.name).toBe('A')
  })

  it('should reject invalid note name', () => {
    expect(() =>
      NoteSchema.parse({ name: 'H', octave: 4, frequency: 440, midi: 69 })
    ).toThrow()
  })

  it('should reject octave out of range', () => {
    expect(() =>
      NoteSchema.parse({ name: 'C', octave: 9, frequency: 440, midi: 69 })
    ).toThrow()
  })
})

describe('IntervalTypeSchema', () => {
  it('should accept all valid interval types', () => {
    const types = [
      'unison', 'minor_second', 'major_second', 'minor_third',
      'major_third', 'perfect_fourth', 'tritone', 'perfect_fifth',
      'minor_sixth', 'major_sixth', 'minor_seventh', 'major_seventh',
      'octave',
    ]
    types.forEach((type) => {
      expect(IntervalTypeSchema.parse(type)).toBe(type)
    })
  })
})

describe('INTERVAL_SEMITONES', () => {
  it('should map unison to 0 semitones', () => {
    expect(INTERVAL_SEMITONES.unison).toBe(0)
  })

  it('should map major_third to 4 semitones', () => {
    expect(INTERVAL_SEMITONES.major_third).toBe(4)
  })

  it('should map perfect_fifth to 7 semitones', () => {
    expect(INTERVAL_SEMITONES.perfect_fifth).toBe(7)
  })

  it('should map octave to 12 semitones', () => {
    expect(INTERVAL_SEMITONES.octave).toBe(12)
  })
})

describe('TunerDisplaySchema', () => {
  it('should validate a tuner display state', () => {
    const display = TunerDisplaySchema.parse({
      needleAngle: 15,
      noteLabel: 'A4',
      centsLabel: '+5',
      isInTune: false,
      frequencyLabel: '442.5 Hz',
      clarityPercent: 95,
    })
    expect(display.isInTune).toBe(false)
  })

  it('should reject needle angle out of range', () => {
    expect(() =>
      TunerDisplaySchema.parse({
        needleAngle: 100,
        noteLabel: 'A4',
        centsLabel: '+5',
        isInTune: false,
        frequencyLabel: '440 Hz',
        clarityPercent: 95,
      })
    ).toThrow()
  })
})
