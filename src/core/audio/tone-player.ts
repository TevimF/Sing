export class TonePlayer {
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  async playNote(frequency: number, durationMs = 1500): Promise<void> {
    this.stop()

    const ctx = this.getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    this.gainNode = ctx.createGain()
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime)
    // Fade in
    this.gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    // Sustain then fade out
    this.gainNode.gain.setValueAtTime(0.3, ctx.currentTime + durationMs / 1000 - 0.1)
    this.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000)
    this.gainNode.connect(ctx.destination)

    this.oscillator = ctx.createOscillator()
    this.oscillator.type = 'sine'
    this.oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    this.oscillator.connect(this.gainNode)
    this.oscillator.start()
    this.oscillator.stop(ctx.currentTime + durationMs / 1000)

    this.oscillator.onended = () => {
      this.oscillator = null
      this.gainNode = null
    }
  }

  stop(): void {
    try {
      this.oscillator?.stop()
    } catch {
      // Already stopped
    }
    this.oscillator?.disconnect()
    this.gainNode?.disconnect()
    this.oscillator = null
    this.gainNode = null
  }

  async dispose(): Promise<void> {
    this.stop()
    if (this.audioContext?.state !== 'closed') {
      await this.audioContext?.close()
    }
    this.audioContext = null
  }
}
