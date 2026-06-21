// Sustained tonic drone — anchors the singer to the key.
// Two sines (root + one octave below) at low gain. Vocal coaches use this
// constantly; the difference between "I think I'm in tune" and "I am in tune"
// is having a reference pitch in the room.

export class DronePlayer {
  private audioContext: AudioContext | null = null
  private oscillators: OscillatorNode[] = []
  private masterGain: GainNode | null = null
  private currentFrequency: number | null = null

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  async start(frequency: number, volume = 0.06): Promise<void> {
    this.stop()

    const ctx = this.getContext()
    if (ctx.state === 'suspended') await ctx.resume()

    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = 0
    this.masterGain.connect(ctx.destination)

    // Root + sub-octave for body
    const frequencies = [frequency, frequency / 2]
    for (const f of frequencies) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.connect(this.masterGain)
      osc.start()
      this.oscillators.push(osc)
    }

    // Fade in to avoid click
    this.masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.4)
    this.currentFrequency = frequency
  }

  setFrequency(frequency: number): void {
    const ctx = this.audioContext
    if (!ctx || this.oscillators.length === 0) return
    const targetFreqs = [frequency, frequency / 2]
    this.oscillators.forEach((osc, i) => {
      const target = targetFreqs[i] ?? frequency
      // Glide to new pitch over 100ms so retunings sound musical, not clicky
      osc.frequency.linearRampToValueAtTime(target, ctx.currentTime + 0.1)
    })
    this.currentFrequency = frequency
  }

  setVolume(volume: number): void {
    const ctx = this.audioContext
    if (!ctx || !this.masterGain) return
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime)
    this.masterGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      ctx.currentTime + 0.05,
    )
  }

  stop(): void {
    const ctx = this.audioContext
    if (!ctx || !this.masterGain) return

    const gainAtStop = this.masterGain
    const oscsAtStop = this.oscillators
    gainAtStop.gain.cancelScheduledValues(ctx.currentTime)
    gainAtStop.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)

    setTimeout(() => {
      for (const osc of oscsAtStop) {
        try { osc.stop(); osc.disconnect() } catch { /* already stopped */ }
      }
      try { gainAtStop.disconnect() } catch { /* already disconnected */ }
    }, 250)

    this.oscillators = []
    this.masterGain = null
    this.currentFrequency = null
  }

  get isPlaying(): boolean {
    return this.oscillators.length > 0
  }

  get frequency(): number | null {
    return this.currentFrequency
  }

  async dispose(): Promise<void> {
    this.stop()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
    }
    this.audioContext = null
  }
}
