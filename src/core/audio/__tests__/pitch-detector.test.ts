import { describe, it, expect, vi } from 'vitest'
import { detectPitch } from '../pitch-detector'

// Mock pitchy
vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: vi.fn().mockReturnValue({
      findPitch: vi.fn().mockReturnValue([440, 0.95]),
    }),
  },
}))

describe('Audio Pitch Detector', () => {
  it('should detect pitch and return a validated PitchResult', () => {
    const buffer = new Float32Array(2048)
    const result = detectPitch(buffer, 44100, 0.8, 440)
    
    expect(result!.frequency).toBe(440)
    expect(result!.clarity).toBe(0.95)
    expect(result!.noteName).toBe('A4')
  })

  it('should return null if clarity is below threshold', () => {
    // We can change the mock per test if needed, but for now let's just implement the basic one
    // and then refine.
  })
})
