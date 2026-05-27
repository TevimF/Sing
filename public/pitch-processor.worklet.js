// AudioWorklet runs in a separate JS scope and CANNOT import from other modules.
// Keep this file self-contained.
//
// Sliding-window detection: maintain a 1024-sample ring buffer, post a snapshot
// every 512 samples (hop). At 48kHz that means a detection candidate every
// ~10.7ms — 4x faster than the previous "fill 2048 then post" approach, with
// the same analysis window length.

const WINDOW_SIZE = 1024
const HOP_SIZE = 512

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(WINDOW_SIZE)
    this._writeIndex = 0
    this._samplesSinceLastPost = 0
    this._filled = false
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channel = input[0]
    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._writeIndex] = channel[i]
      this._writeIndex = (this._writeIndex + 1) % WINDOW_SIZE
      if (!this._filled && this._writeIndex === 0) {
        this._filled = true
      }
      this._samplesSinceLastPost++

      if (this._filled && this._samplesSinceLastPost >= HOP_SIZE) {
        // Copy buffer in chronological order: oldest sample first.
        const snapshot = new Float32Array(WINDOW_SIZE)
        for (let j = 0; j < WINDOW_SIZE; j++) {
          snapshot[j] = this._buffer[(this._writeIndex + j) % WINDOW_SIZE]
        }
        this.port.postMessage({ buffer: snapshot })
        this._samplesSinceLastPost = 0
      }
    }
    return true
  }
}

registerProcessor('pitch-processor', PitchProcessor)
