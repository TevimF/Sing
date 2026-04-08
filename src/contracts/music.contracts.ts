import { z } from 'zod'

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

export const NoteNameSchema = z.enum(NOTE_NAMES)

export const NoteSchema = z.object({
  name: NoteNameSchema,
  octave: z.number().int().min(0).max(8),
  frequency: z.number().positive(),
  midi: z.number().int().min(0).max(127),
})

export const IntervalTypeSchema = z.enum([
  'unison',
  'minor_second',
  'major_second',
  'minor_third',
  'major_third',
  'perfect_fourth',
  'tritone',
  'perfect_fifth',
  'minor_sixth',
  'major_sixth',
  'minor_seventh',
  'major_seventh',
  'octave',
])

export const INTERVAL_SEMITONES: Record<IntervalType, number> = {
  unison: 0,
  minor_second: 1,
  major_second: 2,
  minor_third: 3,
  major_third: 4,
  perfect_fourth: 5,
  tritone: 6,
  perfect_fifth: 7,
  minor_sixth: 8,
  major_sixth: 9,
  minor_seventh: 10,
  major_seventh: 11,
  octave: 12,
}

export const IntervalSchema = z.object({
  type: IntervalTypeSchema,
  semitones: z.number().int().min(0).max(12),
  rootNote: NoteSchema,
  targetNote: NoteSchema,
})

export const ExerciseStatusSchema = z.enum([
  'pending',
  'active',
  'completed',
  'skipped',
])

export const ExerciseSchema = z.object({
  id: z.string(),
  intervalType: IntervalTypeSchema,
  rootNote: NoteSchema,
  targetNote: NoteSchema,
  toleranceCents: z.number().default(10),
  status: ExerciseStatusSchema,
  bestCentsOffset: z.number().nullable(),
  holdDurationMs: z.number().default(1000),
})

export const ExerciseSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: NoteNameSchema,
  intervals: z.array(IntervalTypeSchema),
  exercises: z.array(ExerciseSchema),
  currentIndex: z.number().int().min(0),
})

export type NoteName = z.infer<typeof NoteNameSchema>
export type Note = z.infer<typeof NoteSchema>
export type IntervalType = z.infer<typeof IntervalTypeSchema>
export type Interval = z.infer<typeof IntervalSchema>
export type ExerciseStatus = z.infer<typeof ExerciseStatusSchema>
export type Exercise = z.infer<typeof ExerciseSchema>
export type ExerciseSet = z.infer<typeof ExerciseSetSchema>
