import { type AudioConfig } from '../../contracts'
import { type AudioFilters } from '../../stores/settings.store'

export type OnBufferCallback = (buffer: Float32Array) => void
export type OnLevelCallback = (dB: number) => void

export class AudioManager {
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null

  // Filter nodes
  private preampGain: GainNode | null = null
  private highpassFilter: BiquadFilterNode | null = null
  private lowpassFilter: BiquadFilterNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private noiseGateGain: GainNode | null = null
  private analyser: AnalyserNode | null = null

  private noiseGateThreshold = -50
  private noiseGateEnabled = false
  private monitorInterval: ReturnType<typeof setInterval> | null = null
  private onLevel: OnLevelCallback | null = null

  async requestMicPermission(): Promise<boolean> {
    // Echo cancellation, noise suppression and AGC must stay OFF — all three
    // distort the pitch the detector sees. The previous fallback to
    // `{ audio: true }` re-enabled all three silently, which broke detection
    // without telling the user. Fail explicitly instead.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      return true
    } catch (err) {
      console.error('Microphone access error:', err)
      return false
    }
  }

  async startListening(
    config: AudioConfig,
    filters: AudioFilters,
    onBuffer: OnBufferCallback,
    onLevel?: OnLevelCallback,
  ): Promise<void> {
    if (!this.stream) {
      const granted = await this.requestMicPermission()
      if (!granted) throw new Error('Microphone permission denied')
    }

    this.onLevel = onLevel ?? null
    // Use device-native sampleRate. Forcing 44.1k on Android (which runs natively at
    // 48k) inserts a resampler in the critical path and adds latency. config.sampleRate
    // is kept in the contract for now but no longer overrides the AudioContext.
    this.audioContext = new AudioContext()
    void config

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    await this.audioContext.audioWorklet.addModule('/pitch-processor.worklet.js')

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream!)
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pitch-processor')

    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (event.data?.buffer) {
        onBuffer(event.data.buffer)
      }
    }

    // Create filter nodes
    this.preampGain = this.audioContext.createGain()

    this.highpassFilter = this.audioContext.createBiquadFilter()
    this.highpassFilter.type = 'highpass'
    this.highpassFilter.Q.value = 0.7

    this.lowpassFilter = this.audioContext.createBiquadFilter()
    this.lowpassFilter.type = 'lowpass'
    this.lowpassFilter.Q.value = 0.7

    this.compressor = this.audioContext.createDynamicsCompressor()

    this.noiseGateGain = this.audioContext.createGain()
    this.noiseGateGain.gain.value = 1

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256

    // Always connect all nodes — control effect via parameters, not topology.
    // Disabled nodes are bypassed: highpass@10Hz, lowpass@20kHz, compressor ratio@1
    this.applyFilterParams(filters)

    // Chain: source -> preamp -> highpass -> lowpass -> compressor -> analyser -> noiseGate -> worklet
    this.sourceNode.connect(this.preampGain)
    this.preampGain.connect(this.highpassFilter)
    this.highpassFilter.connect(this.lowpassFilter)
    this.lowpassFilter.connect(this.compressor)
    this.compressor.connect(this.analyser)
    this.compressor.connect(this.noiseGateGain)
    this.noiseGateGain.connect(this.workletNode)

    // Silent output to keep audio graph alive
    const silentGain = this.audioContext.createGain()
    silentGain.gain.value = 0
    silentGain.connect(this.audioContext.destination)
    this.workletNode.connect(silentGain)

    // Start monitoring
    this.startMonitor()
  }

  private startMonitor(): void {
    if (!this.analyser || !this.noiseGateGain) return

    const dataArray = new Float32Array(this.analyser.fftSize)

    this.monitorInterval = setInterval(() => {
      if (!this.analyser || !this.noiseGateGain) return

      this.analyser.getFloatTimeDomainData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const dB = rms > 0 ? 20 * Math.log10(rms) : -100

      // Report level to UI
      this.onLevel?.(dB)

      // Noise gate
      if (this.noiseGateEnabled) {
        this.noiseGateGain.gain.value = dB > this.noiseGateThreshold ? 1 : 0
      } else {
        this.noiseGateGain.gain.value = 1
      }
    }, 30)
  }

  private applyFilterParams(filters: AudioFilters): void {
    if (this.preampGain) {
      this.preampGain.gain.value = filters.preampGain
    }
    if (this.highpassFilter) {
      // Bypass: set to 10 Hz (passes everything above 10 Hz = effectively all audio)
      this.highpassFilter.frequency.value = filters.highpassEnabled ? filters.highpassFrequency : 10
    }
    if (this.lowpassFilter) {
      // Bypass: set to 20 kHz (passes everything below 20 kHz = all audio)
      this.lowpassFilter.frequency.value = filters.lowpassEnabled ? filters.lowpassFrequency : 20000
    }
    if (this.compressor) {
      // Bypass: ratio=1 (no compression), threshold=0 dB
      this.compressor.threshold.value = filters.compressorEnabled ? filters.compressorThreshold : 0
      this.compressor.ratio.value = filters.compressorEnabled ? filters.compressorRatio : 1
      this.compressor.attack.value = filters.compressorAttack
      this.compressor.release.value = filters.compressorRelease
    }
    this.noiseGateThreshold = filters.noiseGateThreshold
    this.noiseGateEnabled = filters.noiseGateEnabled
  }

  updateFilters(filters: AudioFilters): void {
    this.applyFilterParams(filters)
  }

  async stopListening(): Promise<void> {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    this.workletNode?.disconnect()
    this.sourceNode?.disconnect()
    this.preampGain?.disconnect()
    this.highpassFilter?.disconnect()
    this.lowpassFilter?.disconnect()
    this.compressor?.disconnect()
    this.noiseGateGain?.disconnect()
    this.analyser?.disconnect()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
    }
    this.stream?.getTracks().forEach((track) => track.stop())
    this.workletNode = null
    this.sourceNode = null
    this.audioContext = null
    this.stream = null
    this.preampGain = null
    this.highpassFilter = null
    this.lowpassFilter = null
    this.compressor = null
    this.noiseGateGain = null
    this.analyser = null
    this.onLevel = null
  }

  get isActive(): boolean {
    return this.audioContext?.state === 'running'
  }

  get sampleRate(): number | null {
    return this.audioContext?.sampleRate ?? null
  }
}
