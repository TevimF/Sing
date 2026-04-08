# SingApp - Arquitetura

## Visao Geral
SingApp e um afinador vocal com exercicios de intervalos musicais. O usuario seleciona um tom, canta, e o app mostra em tempo real onde sua voz esta e onde deveria chegar.

## Fluxo de Dados
```
Microfone -> getUserMedia() -> AudioContext -> AudioWorkletNode
  -> pitch-processor.worklet.ts (audio thread)
    -> coleta Float32Array buffer
    -> envia para main thread via port.postMessage()
  -> pitch-detector.ts (main thread)
    -> pitchy PitchDetector.findPitch()
    -> { frequency, clarity }
    -> enriquece com noteName, midi, centsOffset
    -> valida contra PitchResultSchema
    -> atualiza audio store (Zustand)
  -> React UI re-renderiza
    -> TunerGauge (SVG) mostra agulha
    -> PitchHistory (Canvas) mostra historico
```

## Stack
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | React 18 + TypeScript | Tipagem forte para SDD |
| Build | Vite | HMR rapido, ESM nativo |
| Audio | Web Audio API + AudioWorklet + pitchy | Pitch detection em thread separada, ~46ms latencia |
| Schemas | Zod | Contratos runtime + inferencia de tipos |
| State | Zustand | Leve, testavel fora do React |
| Testes | Vitest + RTL + Playwright | TDD completo |

## Modulos Core

### src/contracts/
Schemas Zod que sao a **unica fonte de verdade** para todas as interfaces. Todos os modulos consomem e produzem dados validados contra esses contratos.

### src/core/music/
Funcoes puras de teoria musical:
- `notes.ts` - Mapeamento nota-frequencia (12-TET)
- `cents.ts` - Calculo de desvio em cents
- `intervals.ts` - Definicoes de intervalos e semitons
- `exercises.ts` - Geracao de exercicios

### src/core/audio/
Pipeline de audio:
- `pitch-detector.ts` - Wrapper sobre pitchy com validacao de contrato
- `audio-manager.ts` - Ciclo de vida do AudioContext e permissoes
- `pitch-processor.worklet.ts` - AudioWorkletProcessor

### src/stores/
Zustand stores:
- `audio.store.ts` - Pitch atual, estado do mic
- `exercise.store.ts` - Exercicio ativo, progresso
- `settings.store.ts` - Pitch de referencia, tom selecionado

### src/components/
- `tuner/` - Gauge SVG, display de nota, historico Canvas
- `exercises/` - Seletor, display, diagrama de intervalo
- `settings/` - Seletor de tom, pitch de referencia
