# Guia TDD - SingApp

## Ciclo Red-Green-Refactor

### 1. RED - Escreva o teste que falha
```typescript
// src/core/music/__tests__/notes.test.ts
import { describe, it, expect } from 'vitest'
import { frequencyFromMidi } from '../notes'

describe('frequencyFromMidi', () => {
  it('should return 440 for MIDI 69 (A4)', () => {
    expect(frequencyFromMidi(69)).toBeCloseTo(440, 2)
  })
})
```

### 2. GREEN - Implemente o minimo
```typescript
// src/core/music/notes.ts
export function frequencyFromMidi(midi: number, refPitch = 440): number {
  return refPitch * Math.pow(2, (midi - 69) / 12)
}
```

### 3. REFACTOR - Melhore mantendo verde
Apenas se necessario. Nao refatore por refatorar.

## Gerando Audio Sintetico para Testes

```typescript
function generateSineWave(frequency: number, sampleRate: number, duration: number): Float32Array {
  const samples = Math.floor(sampleRate * duration)
  const buffer = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate)
  }
  return buffer
}
```

Use isso para testar `pitch-detector.ts` sem microfone real.

## Mocking Web Audio API

```typescript
const mockAudioContext = {
  sampleRate: 44100,
  createMediaStreamSource: vi.fn(),
  audioWorklet: { addModule: vi.fn() },
  suspend: vi.fn(),
  resume: vi.fn(),
  close: vi.fn(),
}
```

## Convencoes de Teste

- **Arquivo**: `[modulo].test.ts` dentro de `__tests__/`
- **Nomenclatura**: `should [esperado] when [condicao]`
- **Arrange-Act-Assert**: Separe setup, execucao e verificacao
- **Um assert por teste** quando possivel
- **Sem logica condicional** em testes

## Piramide de Testes

```
        /  E2E  \        ~10% - Playwright com audio sintetico
       / Integ.  \       ~20% - RTL + hooks + stores
      /   Unit    \      ~70% - Vitest puro, funcoes core
```

## Rodando Testes

```bash
npm test              # watch mode
npm run test:run      # single run
npm run test:coverage # com cobertura
```
