import { describe, it, expect } from 'vitest'
import {
  centsBetween,
  centsFromNearestNote,
} from '../cents'

describe('centsBetween', () => {
  it('should return 0 for identical frequencies', () => {
    expect(centsBetween(440, 440)).toBe(0)
  })

  it('should return 1200 for one octave up', () => {
    expect(centsBetween(440, 880)).toBeCloseTo(1200, 1)
  })

  it('should return -1200 for one octave down', () => {
    expect(centsBetween(880, 440)).toBeCloseTo(-1200, 1)
  })

  it('should return 100 for one semitone up', () => {
    const a4 = 440
    const aSharp4 = 440 * Math.pow(2, 1 / 12)
    expect(centsBetween(a4, aSharp4)).toBeCloseTo(100, 1)
  })

  it('should return 700 for a perfect fifth', () => {
    const c4 = 261.63
    const g4 = 392.00
    expect(centsBetween(c4, g4)).toBeCloseTo(700, 0)
  })
})

describe('centsFromNearestNote', () => {
  it('should return 0 cents for exact A4 (440Hz)', () => {
    const result = centsFromNearestNote(440)
    expect(result.midi).toBe(69)
    expect(result.cents).toBeCloseTo(0, 1)
  })

  it('should return small positive cents for slightly sharp', () => {
    const result = centsFromNearestNote(442)
    expect(result.midi).toBe(69)
    expect(result.cents).toBeGreaterThan(0)
    expect(result.cents).toBeLessThan(50)
  })

  it('should return small negative cents for slightly flat', () => {
    const result = centsFromNearestNote(438)
    expect(result.midi).toBe(69)
    expect(result.cents).toBeLessThan(0)
    expect(result.cents).toBeGreaterThan(-50)
  })

  it('should find correct note for C4', () => {
    const result = centsFromNearestNote(261.63)
    expect(result.midi).toBe(60)
    expect(Math.abs(result.cents)).toBeLessThan(1)
  })

  it('should return cents in range -50 to 50', () => {
    const result = centsFromNearestNote(450)
    expect(result.cents).toBeGreaterThanOrEqual(-50)
    expect(result.cents).toBeLessThanOrEqual(50)
  })

  it('should use custom reference pitch', () => {
    const result = centsFromNearestNote(442, 442)
    expect(result.midi).toBe(69)
    expect(result.cents).toBeCloseTo(0, 1)
  })
})
