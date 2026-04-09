import { create } from 'zustand'
import { type ExerciseSet, type IntervalType, type NoteName } from '../contracts'
import { createExerciseSet } from '../core/music/exercises'

interface ExerciseStoreState {
  exerciseSet: ExerciseSet | null
  selectedIntervals: IntervalType[]
  octaveOffset: number
  startExercises: (key: NoteName, intervals: IntervalType[]) => void
  nextExercise: () => void
  completeCurrentExercise: (bestCents: number) => void
  reset: () => void
}

const DEFAULT_INTERVALS: IntervalType[] = [
  'unison',
  'major_third',
  'perfect_fifth',
  'octave',
]

export const useExerciseStore = create<ExerciseStoreState>((set) => ({
  exerciseSet: null,
  selectedIntervals: DEFAULT_INTERVALS,
  octaveOffset: 0,
  startExercises: (key, intervals) => {
    const { octaveOffset } = useExerciseStore.getState()
    const exerciseSet = createExerciseSet(key, intervals, octaveOffset)
    exerciseSet.exercises[0].status = 'active'
    set({ exerciseSet, selectedIntervals: intervals })
  },
  nextExercise: () =>
    set((state) => {
      if (!state.exerciseSet) return state
      const next = state.exerciseSet.currentIndex + 1
      if (next >= state.exerciseSet.exercises.length) return state
      const exercises = [...state.exerciseSet.exercises]
      exercises[next] = { ...exercises[next], status: 'active' }
      return {
        exerciseSet: { ...state.exerciseSet, exercises, currentIndex: next },
      }
    }),
  completeCurrentExercise: (bestCents) =>
    set((state) => {
      if (!state.exerciseSet) return state
      const idx = state.exerciseSet.currentIndex
      const exercises = [...state.exerciseSet.exercises]
      exercises[idx] = {
        ...exercises[idx],
        status: 'completed',
        bestCentsOffset: bestCents,
      }
      return { exerciseSet: { ...state.exerciseSet, exercises } }
    }),
  reset: () => set({ exerciseSet: null }),
}))
