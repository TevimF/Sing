import { PitchGraph } from './components/tuner/PitchGraph'
import { SensitivityControl } from './components/settings/SensitivityControl'
import { AudioFiltersPanel } from './components/settings/AudioFiltersPanel'
import { ExerciseSelector } from './components/exercises/ExerciseSelector'
import { ExerciseDisplay } from './components/exercises/ExerciseDisplay'
import { MetronomePanel } from './components/settings/MetronomePanel'
import { LiveReadout } from './components/tuner/LiveReadout'
import { usePitchDetection } from './hooks/usePitchDetection'
import { useExerciseStore } from './stores/exercise.store'
import { useSettingsStore } from './stores/settings.store'
import './App.css'


function App() {
  const { isListening, currentPitch, error, inputLevel, toggle } = usePitchDetection()
  const exerciseSet = useExerciseStore((s) => s.exerciseSet)
  const musicalKey = useSettingsStore((s) => s.key)
  const scaleMode = useSettingsStore((s) => s.scaleMode)

  const currentExercise = exerciseSet?.exercises[exerciseSet.currentIndex]
  const targetMidi = currentExercise?.targetNote.midi ?? null

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <span className="eyebrow eyebrow--amber">Op. 01 — Studio del canto</span>
          <h1>Sing</h1>
        </div>
        <p className="app-subtitle">Un&apos;atelier per la voce — precision pitch trainer</p>
      </header>

      <main className="app-main">
        <section className="tuner-section">
          <div className="tuner-section__graph">
            <PitchGraph
              pitch={currentPitch}
              targetMidi={targetMidi}
              musicalKey={musicalKey}
              scaleMode={scaleMode}
            />
            {!isListening && (
              <div className="tuner-empty-state" aria-hidden>
                <div className="tuner-empty-state__icon">&#x266B;</div>
                <p className="tuner-empty-state__title">Pronto para cantar?</p>
                <p className="tuner-empty-state__hint">
                  Toque em <strong>Iniciar microfone</strong> abaixo
                </p>
                <div className="tuner-empty-state__arrow">&darr;</div>
              </div>
            )}
          </div>

          <LiveReadout
            pitch={currentPitch}
            isListening={isListening}
            targetMidi={targetMidi}
          />
        </section>

        <div className="tuner-mic-row">
          <button
            className={`btn btn--mic ${isListening ? 'btn--active' : ''}`}
            onClick={toggle}
          >
            {isListening ? '◼ Parar' : '● Iniciar microfone'}
          </button>
          {isListening ? (
            <div className="input-meter">
              <span className="input-meter__label">Sinal</span>
              <div className="input-meter__bar">
                <div
                  className="input-meter__fill"
                  style={{ width: `${Math.max(0, Math.min(100, (inputLevel + 60) * (100 / 60)))}%` }}
                />
              </div>
              <span className="input-meter__value">
                {inputLevel > -100 ? `${inputLevel.toFixed(0)} dB` : '— dB'}
              </span>
            </div>
          ) : (
            <span className="eyebrow" style={{ opacity: 0.5 }}>
              Aguardando entrada de áudio
            </span>
          )}
          {error && <p className="error-msg">{error}</p>}
        </div>

        <section className="panels">
          <div className="panel panel--exercises" data-label="Esercizi">
            <ExerciseSelector />
            {exerciseSet && <ExerciseDisplay pitch={currentPitch} />}
          </div>
          <div className="panel panel--settings" data-label="Strumenti">
            <SensitivityControl />
            <AudioFiltersPanel />
            <MetronomePanel />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
