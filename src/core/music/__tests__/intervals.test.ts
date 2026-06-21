import { describe, it, expect } from 'vitest'
import { getInterval, getTargetNote } from '../intervals'
import { noteFromMidi } from '../notes'

describe('getInterval', () => {
  it('should return unison with 0 semitones', () => {
    const root = noteFromMidi(60) // C4
    const interval = getInterval(root, 'unison')
    expect(interval.semitones).toBe(0)
    expect(interval.targetNote.midi).toBe(60)
    expect(interval.targetNote.name).toBe('C')
  })

  it('should return major third with 4 semitones', () => {
    const root = noteFromMidi(60) // C4
    const interval = getInterval(root, 'major_third')
    expect(interval.semitones).toBe(4)
    expect(interval.targetNote.midi).toBe(64)
    expect(interval.targetNote.name).toBe('E')
  })

  it('should return perfect fifth with 7 semitones', () => {
    const root = noteFromMidi(60) // C4
    const interval = getInterval(root, 'perfect_fifth')
    expect(interval.semitones).toBe(7)
    expect(interval.targetNote.midi).toBe(67)
    expect(interval.targetNote.name).toBe('G')
  })

  it('should return minor third with 3 semitones', () => {
    const root = noteFromMidi(69) // A4
    const interval = getInterval(root, 'minor_third')
    expect(interval.semitones).toBe(3)
    expect(interval.targetNote.midi).toBe(72)
    expect(interval.targetNote.name).toBe('C')
  })

  it('should return octave with 12 semitones', () => {
    const root = noteFromMidi(60) // C4
    const interval = getInterval(root, 'octave')
    expect(interval.semitones).toBe(12)
    expect(interval.targetNote.midi).toBe(72)
    expect(interval.targetNote.name).toBe('C')
    expect(interval.targetNote.octave).toBe(5)
  })

  it('should preserve root note reference', () => {
    const root = noteFromMidi(60)
    const interval = getInterval(root, 'perfect_fifth')
    expect(interval.rootNote.midi).toBe(60)
    expect(interval.type).toBe('perfect_fifth')
  })
})

describe('getTargetNote', () => {
  it('should return correct note for major third from C4', () => {
    const root = noteFromMidi(60)
    const target = getTargetNote(root, 'major_third')
    expect(target.name).toBe('E')
    expect(target.octave).toBe(4)
  })

  it('should cross octave boundary correctly', () => {
    const root = noteFromMidi(71) // B4
    const target = getTargetNote(root, 'minor_second')
    expect(target.name).toBe('C')
    expect(target.octave).toBe(5)
  })

  it('should return same note for unison', () => {
    const root = noteFromMidi(69) // A4
    const target = getTargetNote(root, 'unison')
    expect(target.midi).toBe(69)
  })
})
