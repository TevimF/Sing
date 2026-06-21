# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server at http://localhost:5173
npm run build            # tsc -b && vite build (production bundle to dist/)
npm run lint             # eslint .
npm test                 # vitest in watch mode
npm run test:run         # vitest single run (CI mode)
npm run test:coverage    # vitest with coverage report
```

Run a single test file: `npx vitest run src/core/music/__tests__/notes.test.ts`
Run tests matching a name: `npx vitest run -t "should return 440"`

Android (Capacitor) — `appId: com.thelobby.sing`, `webDir: dist`:
```bash
npm run build && npx cap sync android
npx cap open android      # opens Android Studio
```

## Architecture

Real-time vocal pitch trainer. The defining axis is the **audio pipeline**, which crosses thread boundaries and dictates how the rest of the app is structured.

### Audio pipeline (read this first)

```
Microphone (getUserMedia)
  → AudioContext → filter chain (preamp → highpass → lowpass → compressor → noise-gate)
  → AudioWorkletNode running pitch-processor.worklet.ts (audio thread)
      collects Float32Array buffers, posts to main thread via port.postMessage()
  → detectPitch() in pitch-detector.ts (main thread, wraps pitchy/McLeod)
      returns { frequency, clarity } → enriched with midiNote, noteName, centsOffset
      validated against PitchResultSchema
  → useAudioStore (Zustand) → React re-renders PitchGraph / TunerDisplay / ExerciseDisplay
```

`AudioManager` (`src/core/audio/audio-manager.ts`) owns the entire graph and is the **only impure module in `src/core/`**. Everything else under `core/` (music theory, pitch detection wrappers, cents math) is pure functions.

**The AudioWorklet runs in a separate JS scope and CANNOT import from other modules.** Keep `pitch-processor.worklet.ts` self-contained — anything it needs must live inline.

### Schema-Driven Development (SDD)

Zod schemas in `src/contracts/` are the **single source of truth** for all data shapes. Types are inferred (`z.infer<typeof FooSchema>`), never hand-written.

- Validate with `.parse()` **only at system boundaries**: audio input, user input. Between internal modules, trust TypeScript.
- All pitch results must pass `PitchResultSchema.parse()` before reaching the UI.
- Contracts are re-exported from `src/contracts/index.ts` (barrel). Imports use relative paths — there is no `@/` alias configured despite what older docs may suggest.
- Three contract files: `audio.contracts.ts` (AudioConfig, PitchResult, AudioState), `music.contracts.ts` (Note, Interval, Exercise, ExerciseSet), `ui.contracts.ts` (TunerDisplay, PitchHistoryPoint).

### State (Zustand)

Three stores in `src/stores/`, deliberately split by concern:
- `audio.store.ts` — current pitch, mic state, input level
- `exercise.store.ts` — active exercise set and progress
- `settings.store.ts` — reference pitch, key, filter settings, audio config, metronome

Stores are testable outside React (`useStore.getState()` / `useStore.setState()`).

### Test-Driven Development (TDD)

- Tests are **co-located in `__tests__/` next to the module**, not in a top-level test directory.
- Naming: `should [expected behavior] when [condition]`.
- Use synthetic sine-wave buffers (see `docs/TDD_GUIDE.md`) to test pitch detection without a microphone.
- Mock Web Audio API with plain stub objects; `src/test-setup.ts` is loaded by Vitest (`jsdom` environment).

## Conventions that aren't obvious from the code

- **Never duplicate a Zod schema as a TypeScript interface** — always `z.infer<>`.
- **No `any`** — if the shape is unknown, define a schema.
- **No CSS-in-JS** — use CSS modules or plain CSS.
- Functions ≤ ~30 lines; prefer composition over inheritance.
- When changing a contract: run `npm run test:run` to surface every affected test, then fix all of them before committing.

## Reference documents

Detailed guidance lives in `docs/`:
- `ARCHITECTURE.md` — full pipeline and stack rationale
- `CONTRACTS.md` — field-by-field schema reference
- `SDD_GUIDE.md` — schema evolution rules and validation boundaries
- `TDD_GUIDE.md` — red-green-refactor examples and audio mocking
- `MUSIC_THEORY.md` — 12-TET formula, interval table, vocal ranges
- `AI_AGENT_RULES.md` — distilled rules for agents working in this repo
