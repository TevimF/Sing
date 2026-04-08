import { z } from 'zod'

export const TunerDisplaySchema = z.object({
  needleAngle: z.number().min(-90).max(90),
  noteLabel: z.string(),
  centsLabel: z.string(),
  isInTune: z.boolean(),
  frequencyLabel: z.string(),
  clarityPercent: z.number().min(0).max(100),
})

export const PitchHistoryPointSchema = z.object({
  timestamp: z.number(),
  centsOffset: z.number().nullable(),
  targetCents: z.number(),
})

export type TunerDisplay = z.infer<typeof TunerDisplaySchema>
export type PitchHistoryPoint = z.infer<typeof PitchHistoryPointSchema>
