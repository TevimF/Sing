import { create } from 'zustand'
import { type PitchResult } from '../contracts'

interface AudioStoreState {
  isListening: boolean
  hasPermission: boolean | null
  currentPitch: PitchResult | null
  inputLevel: number
  error: string | null
  setListening: (listening: boolean) => void
  setPermission: (granted: boolean) => void
  setPitch: (pitch: PitchResult | null) => void
  setInputLevel: (dB: number) => void
  setError: (error: string | null) => void
}

export const useAudioStore = create<AudioStoreState>((set) => ({
  isListening: false,
  hasPermission: null,
  currentPitch: null,
  inputLevel: -100,
  error: null,
  setListening: (listening) => set({ isListening: listening }),
  setPermission: (granted) => set({ hasPermission: granted }),
  setPitch: (pitch) => set({ currentPitch: pitch }),
  setInputLevel: (dB) => set({ inputLevel: dB }),
  setError: (error) => set({ error }),
}))
