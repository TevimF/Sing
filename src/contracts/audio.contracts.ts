import { z } from 'zod'

export const AudioConfigSchema = z.object({
  sampleRate: z.number().default(44100),
  bufferSize: z.number().default(2048),
  clarityThreshold: z.number().min(0).max(1).default(0.9),
  referencePitch: z.number().default(440),
})

export const PitchResultSchema = z.object({
  frequency: z.number().nonnegative(),
  clarity: z.number().min(0).max(1),
  timestamp: z.number(),
  midiNote: z.number().int().min(0).max(127).nullable(),
  noteName: z.string().nullable(),
  centsOffset: z.number().nullable(),
})

export const AudioStateSchema = z.object({
  isListening: z.boolean(),
  hasPermission: z.boolean().nullable(),
  currentPitch: PitchResultSchema.nullable(),
  error: z.string().nullable(),
})

export type AudioConfig = z.infer<typeof AudioConfigSchema>
export type PitchResult = z.infer<typeof PitchResultSchema>
export type AudioState = z.infer<typeof AudioStateSchema>
