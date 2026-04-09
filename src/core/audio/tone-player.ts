export class TonePlayer {
  private audioContext: AudioContext | null = null
  private activeNodes: { osc: OscillatorNode; gain: GainNode }[] = []

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  async playNotes(frequencies: number[], durationMs = 1500): Promise<void> {
    this.stop()

    const ctx = this.getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const maxVol = 0.3 / Math.max(1, frequencies.length)

    frequencies.forEach(frequency => {
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      // Fade in
      gainNode.gain.linearRampToValueAtTime(maxVol, ctx.currentTime + 0.05)
      // Sustain then fade out
      gainNode.gain.setValueAtTime(maxVol, ctx.currentTime + durationMs / 1000 - 0.1)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000)
      gainNode.connect(ctx.destination)

      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      oscillator.connect(gainNode)
      oscillator.start()
      oscillator.stop(ctx.currentTime + durationMs / 1000)

      this.activeNodes.push({ osc: oscillator, gain: gainNode })

      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
        this.activeNodes = this.activeNodes.filter(n => n.osc !== oscillator)
      }
    })
  }

  async playNote(frequency: number, durationMs = 1500): Promise<void> {
    return this.playNotes([frequency], durationMs)
  }

  stop(): void {
    const ctx = this.audioContext
    if (!ctx) return

    this.activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05)
        setTimeout(() => {
          try {
            osc.stop()
            osc.disconnect()
            gain.disconnect()
          } catch {}
        }, 60)
      } catch {}
    })
    this.activeNodes = []
  }

  async dispose(): Promise<void> {
    this.stop()
    if (this.audioContext?.state !== 'closed') {
      await this.audioContext?.close()
    }
    this.audioContext = null
  }
}
