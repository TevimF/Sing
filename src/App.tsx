import { PitchGraph } from './components/tuner/PitchGraph'
import { SensitivityControl } from './components/settings/SensitivityControl'
import { AudioFiltersPanel } from './components/settings/AudioFiltersPanel'
import { ExerciseSelector } from './components/exercises/ExerciseSelector'
import { ExerciseDisplay } from './components/exercises/ExerciseDisplay'
import { MetronomePanel } from './components/settings/MetronomePanel'
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
        <h1>Sing</h1>
        <p className="app-subtitle">Afine sua voz</p>
      </header>

      <main className="app-main">
        {/* Graph spans full width */}
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
                <div className="tuner-empty-state__icon">🎤</div>
                <p className="tuner-empty-state__title">Pronto para cantar?</p>
                <p className="tuner-empty-state__hint">Toque em <strong>Iniciar Microfone</strong> abaixo</p>
                <div className="tuner-empty-state__arrow">↓</div>
              </div>
            )}
          </div>
          <div className="tuner-mic-row">
            <button className={`btn btn--mic ${isListening ? 'btn--active' : ''}`} onClick={toggle}>
              {isListening ? 'Parar' : 'Iniciar Microfone'}
            </button>
            {isListening && (
              <div className="input-meter">
                <span className="input-meter__label">Entrada:</span>
                <div className="input-meter__bar">
                  <div
                    className="input-meter__fill"
                    style={{ width: `${Math.max(0, Math.min(100, (inputLevel + 60) * (100 / 60)))}%` }}
                  />
                </div>
                <span className="input-meter__value">{inputLevel > -100 ? `${inputLevel.toFixed(0)} dB` : '--'}</span>
              </div>
            )}
            {error && <p className="error-msg">{error}</p>}
          </div>
        </section>

        {/* Side-by-side panels */}
        <section className="panels">
          <div className="panel panel--exercises">
            <ExerciseSelector />
            {exerciseSet && <ExerciseDisplay pitch={currentPitch} />}
          </div>
          <div className="panel panel--settings">
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
