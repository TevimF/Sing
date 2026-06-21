import { describe, it, expect } from 'vitest'
import { createExercise, createExerciseSet } from '../exercises'
import { noteFromMidi } from '../notes'

describe('createExercise', () => {
  it('should create an exercise with correct root and target', () => {
    const root = noteFromMidi(60) // C4
    const exercise = createExercise(root, 'major_third')
    expect(exercise.rootNote.name).toBe('C')
    expect(exercise.targetNote.name).toBe('E')
    expect(exercise.intervalType).toBe('major_third')
    expect(exercise.status).toBe('pending')
    expect(exercise.bestCentsOffset).toBeNull()
  })

  it('should generate a unique id', () => {
    const root = noteFromMidi(60)
    const ex1 = createExercise(root, 'major_third')
    const ex2 = createExercise(root, 'major_third')
    expect(ex1.id).not.toBe(ex2.id)
  })

  it('should have default tolerance of 10 cents', () => {
    const root = noteFromMidi(60)
    const exercise = createExercise(root, 'perfect_fifth')
    expect(exercise.toleranceCents).toBe(10)
  })

  it('should have default hold duration of 1000ms', () => {
    const root = noteFromMidi(60)
    const exercise = createExercise(root, 'perfect_fifth')
    expect(exercise.holdDurationMs).toBe(1000)
  })
})

describe('createExerciseSet', () => {
  it('should create a set with correct number of exercises', () => {
    const set = createExerciseSet('C', ['major_third', 'perfect_fifth', 'octave'])
    expect(set.exercises).toHaveLength(3)
    expect(set.currentIndex).toBe(0)
    expect(set.key).toBe('C')
  })

  it('should create exercises in correct order', () => {
    const set = createExerciseSet('C', ['unison', 'major_third', 'perfect_fifth'])
    expect(set.exercises[0].intervalType).toBe('unison')
    expect(set.exercises[1].intervalType).toBe('major_third')
    expect(set.exercises[2].intervalType).toBe('perfect_fifth')
  })

  it('should use the selected key as root', () => {
    const set = createExerciseSet('A', ['major_third'])
    expect(set.exercises[0].rootNote.name).toBe('A')
  })

  it('should work with different keys', () => {
    const setG = createExerciseSet('G', ['perfect_fifth'])
    expect(setG.exercises[0].rootNote.name).toBe('G')
    expect(setG.exercises[0].targetNote.name).toBe('D')
  })

  it('should set correct target for each interval', () => {
    const set = createExerciseSet('C', ['minor_third', 'major_third', 'perfect_fifth'])
    expect(set.exercises[0].targetNote.name).toBe('D#')
    expect(set.exercises[1].targetNote.name).toBe('E')
    expect(set.exercises[2].targetNote.name).toBe('G')
  })

  it('should generate a name with key and interval count', () => {
    const set = createExerciseSet('C', ['major_third', 'perfect_fifth'])
    expect(set.name).toContain('C')
  })

  it('should have unique id', () => {
    const set1 = createExerciseSet('C', ['major_third'])
    const set2 = createExerciseSet('C', ['major_third'])
    expect(set1.id).not.toBe(set2.id)
  })
})
