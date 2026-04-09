/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const registerProcessor: any;
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

class PitchProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>) {
    const input = inputs[0]
    if (input && input[0]) {
      const buffer = input[0]
      this.port.postMessage(buffer)
    }
    return true
  }
}

registerProcessor('pitch-processor', PitchProcessor)
