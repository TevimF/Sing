import { useMetronome } from '../../hooks/useMetronome'

export function MetronomePanel() {
  const { isPlaying, setIsPlaying, bpm, setBpm, volume, setVolume, beat } = useMetronome(90)

  return (
    <div className="metronome-panel">
      <div className="metronome-panel__header">
        <h3 className="metronome-panel__title">Metrônomo</h3>
        <div className="metronome-panel__beats" aria-label={`Compasso ${beat + 1} de 4`}>
          {[0, 1, 2, 3].map((b) => (
            <span
              key={b}
              className={
                'metronome-panel__beat-dot' +
                (isPlaying && b === beat ? ' metronome-panel__beat-dot--active' : '') +
                (b === 0 ? ' metronome-panel__beat-dot--downbeat' : '')
              }
            />
          ))}
        </div>
      </div>

      <div className="metronome-panel__controls">
        <button
          className={'btn metronome-panel__play' + (isPlaying ? ' metronome-panel__play--on' : '')}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'Parar' : 'Tocar'}
        </button>

        <div className="metronome-panel__bpm">
          <div className="metronome-panel__bpm-label">
            <span>BPM</span>
            <strong>{bpm}</strong>
          </div>
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="metronome-panel__bpm-slider"
            aria-label="BPM"
          />
        </div>

        <label className="metronome-panel__volume" title={`Volume: ${volume}%`}>
          <span>Vol</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume do metrônomo"
          />
        </label>
      </div>
    </div>
  )
}
