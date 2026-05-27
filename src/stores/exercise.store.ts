import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type ExerciseSet, type IntervalType, type NoteName } from '../contracts'
import { createExerciseSet } from '../core/music/exercises'
import { midiFromNoteName, noteFromMidi } from '../core/music/notes'
import { getTargetNote } from '../core/music/intervals'

interface ExerciseStoreState {
  exerciseSet: ExerciseSet | null
  selectedIntervals: IntervalType[]
  octaveOffset: number
  autoAdvance: boolean
  startExercises: (key: NoteName, intervals: IntervalType[]) => void
  nextExercise: () => void
  jumpToExercise: (index: number) => void
  shiftOctave: (delta: number) => void
  completeCurrentExercise: (bestCents: number) => void
  setAutoAdvance: (v: boolean) => void
  reset: () => void
}

const DEFAULT_INTERVALS: IntervalType[] = [
  'major_third',
  'perfect_fifth',
  'octave',
]

export const useExerciseStore = create<ExerciseStoreState>()(
  persist(
    (set) => ({
      exerciseSet: null,
      selectedIntervals: DEFAULT_INTERVALS,
      octaveOffset: 0,
      autoAdvance: true,
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
      jumpToExercise: (index) =>
        set((state) => {
          if (!state.exerciseSet) return state
          if (index < 0 || index >= state.exerciseSet.exercises.length) return state
          const exercises = [...state.exerciseSet.exercises]
          exercises[index] = { ...exercises[index], status: 'active' }
          return {
            exerciseSet: { ...state.exerciseSet, exercises, currentIndex: index },
          }
        }),
      shiftOctave: (delta) =>
        set((state) => {
          const newOffset = state.octaveOffset + delta
          if (!state.exerciseSet) return { octaveOffset: newOffset }
          const newRootMidi = midiFromNoteName(state.exerciseSet.key, 4 + newOffset)
          const newRoot = noteFromMidi(newRootMidi)
          const exercises = state.exerciseSet.exercises.map((ex) => ({
            ...ex,
            rootNote: newRoot,
            targetNote: getTargetNote(newRoot, ex.intervalType),
          }))
          return {
            octaveOffset: newOffset,
            exerciseSet: { ...state.exerciseSet, exercises },
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
      setAutoAdvance: (v) => set({ autoAdvance: v }),
      reset: () => set({ exerciseSet: null }),
    }),
    {
      name: 'sing-exercises',
      storage: createJSONStorage(() => localStorage),
      // Persist user preferences only — never the active exerciseSet, which
      // is session state (would re-mount mid-exercise on a reload).
      partialize: (s) => ({
        selectedIntervals: s.selectedIntervals,
        octaveOffset: s.octaveOffset,
        autoAdvance: s.autoAdvance,
      }),
      version: 1,
    },
  ),
)
