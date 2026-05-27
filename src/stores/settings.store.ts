import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { type NoteName, type AudioConfig } from '../contracts'

export interface AudioFilters {
  // Pre-amplifier gain
  preampGain: number            // linear, 1.0 = 0dB, 10.0 = +20dB

  // Noise gate
  noiseGateEnabled: boolean
  noiseGateThreshold: number    // dB, -100 to 0

  // High-pass filter (remove low rumble)
  highpassEnabled: boolean
  highpassFrequency: number     // Hz, 20-500

  // Low-pass filter (remove hiss)
  lowpassEnabled: boolean
  lowpassFrequency: number      // Hz, 1000-20000

  // Compressor
  compressorEnabled: boolean
  compressorThreshold: number   // dB, -100 to 0
  compressorRatio: number       // 1-20
  compressorAttack: number      // seconds, 0-1
  compressorRelease: number     // seconds, 0-1
}

interface SettingsState {
  key: NoteName
  audioConfig: AudioConfig
  filters: AudioFilters
  setKey: (key: NoteName) => void
  setReferencePitch: (pitch: number) => void
  setClarityThreshold: (threshold: number) => void
  setFilter: <K extends keyof AudioFilters>(key: K, value: AudioFilters[K]) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      key: 'C',
      audioConfig: {
        sampleRate: 48000,
        bufferSize: 1024,
        clarityThreshold: 0.6,
        referencePitch: 440,
      },
      filters: {
        preampGain: 1.0,

        noiseGateEnabled: false,
        noiseGateThreshold: -40,

        highpassEnabled: false,
        highpassFrequency: 80,

        lowpassEnabled: false,
        lowpassFrequency: 5000,

        compressorEnabled: false,
        compressorThreshold: -24,
        compressorRatio: 4,
        compressorAttack: 0.003,
        compressorRelease: 0.25,
      },
      setKey: (key) => set({ key }),
      setReferencePitch: (pitch) =>
        set((state) => ({
          audioConfig: { ...state.audioConfig, referencePitch: pitch },
        })),
      setClarityThreshold: (threshold) =>
        set((state) => ({
          audioConfig: { ...state.audioConfig, clarityThreshold: threshold },
        })),
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
    }),
    {
      name: 'sing-settings',
      storage: createJSONStorage(() => localStorage),
      // Persist user preferences only — not the action functions.
      partialize: (s) => ({ key: s.key, audioConfig: s.audioConfig, filters: s.filters }),
      version: 1,
    },
  ),
)
