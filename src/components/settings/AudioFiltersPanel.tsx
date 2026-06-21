import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings.store'
import { useAudioStore } from '../../stores/audio.store'

export function AudioFiltersPanel() {
  const { filters, setFilter } = useSettingsStore()
  const inputLevel = useAudioStore((s) => s.inputLevel)
  const [isOpen, setIsOpen] = useState(false)

  const gainDb = Math.round(20 * Math.log10(Math.max(0.01, filters.preampGain)))

  // Noise gate: show open/closed state based on live input level
  const gateIsOpen = !filters.noiseGateEnabled || inputLevel > filters.noiseGateThreshold

  // Display threshold as "cortar abaixo de X dB" — slider left = permissive (-80), right = aggressive (-10)
  // We flip the slider: value goes from 10 (left=most-aggressive) to 80 (right=most-permissive)
  // internally: threshold = -sliderDisplayVal ... no, keep as dB but invert slider direction.
  // Simpler: show pct. 0%=off(-80dB), 100%=max(-10dB). slider 0-100.
  

  return (
    <div className="filters-panel">
      {/* Gain — always visible */}
      <div className="gain-control">
        <label>
          <span className="gain-control__label">Ganho: <strong>{gainDb >= 0 ? '+' : ''}{gainDb} dB</strong></span>
          <span className="gain-control__hint">{filters.preampGain.toFixed(1)}×</span>
        </label>
        <input
          type="range"
          min="1"
          max="200"
          step="1"
          value={Math.round(filters.preampGain * 10)}
          onChange={(e) => setFilter('preampGain', Number(e.target.value) / 10)}
          className="sensitivity-control__slider"
        />
      </div>

      <button className="filters-panel__toggle" onClick={() => setIsOpen(!isOpen)}>
        Filtros de Audio {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="filters-panel__content">

          {/* Noise Gate */}
          <div className="filter-group">
            <div className="filter-group__header">
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.noiseGateEnabled}
                  onChange={(e) => setFilter('noiseGateEnabled', e.target.checked)}
                />
                Noise Gate
              </label>
              <span className="filter-value">
                {filters.noiseGateEnabled && (
                  <span className={`gate-indicator ${gateIsOpen ? 'gate-indicator--open' : 'gate-indicator--closed'}`}>
                    {gateIsOpen ? '● passa' : '● corta'}
                  </span>
                )}
              </span>
            </div>
            {filters.noiseGateEnabled && (
              <>
                <div className="filter-row">
                  <span>Cortar abaixo de</span>
                  <span>{filters.noiseGateThreshold} dB</span>
                </div>
                {/* Slider: left=OFF(−80dB) → right=AGGRESSIVE(−10dB) */}
                <input
                  type="range"
                  min="-80"
                  max="-10"
                  value={filters.noiseGateThreshold}
                  onChange={(e) => setFilter('noiseGateThreshold', Number(e.target.value))}
                  className="filter-slider"
                />
                <div className="filter-hint-row">
                  <span>← fraco (−80)</span>
                  <span>forte (−10) →</span>
                </div>
                <div className="filter-hint-row" style={{ marginTop: '0.2rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                    Entrada atual: {inputLevel > -100 ? `${inputLevel.toFixed(0)} dB` : '--'}
                    {filters.noiseGateEnabled && inputLevel > -100 && (
                      <span> → suba o slider acima de {inputLevel.toFixed(0)} dB para cortar</span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* High-pass Filter */}
          <div className="filter-group">
            <div className="filter-group__header">
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.highpassEnabled}
                  onChange={(e) => setFilter('highpassEnabled', e.target.checked)}
                />
                High-pass (corta graves)
              </label>
              <span className="filter-value">{filters.highpassFrequency} Hz</span>
            </div>
            {filters.highpassEnabled && (
              <>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={filters.highpassFrequency}
                  onChange={(e) => setFilter('highpassFrequency', Number(e.target.value))}
                  className="filter-slider"
                />
                <div className="filter-hint-row">
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                    C2=65Hz · C3=131Hz — para cortar C2 use &gt;80Hz
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Low-pass Filter */}
          <div className="filter-group">
            <div className="filter-group__header">
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.lowpassEnabled}
                  onChange={(e) => setFilter('lowpassEnabled', e.target.checked)}
                />
                Low-pass (corta agudos)
              </label>
              <span className="filter-value">{filters.lowpassFrequency} Hz</span>
            </div>
            {filters.lowpassEnabled && (
              <input
                type="range"
                min="1000"
                max="15000"
                step="100"
                value={filters.lowpassFrequency}
                onChange={(e) => setFilter('lowpassFrequency', Number(e.target.value))}
                className="filter-slider"
              />
            )}
          </div>

          {/* Compressor */}
          <div className="filter-group">
            <div className="filter-group__header">
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.compressorEnabled}
                  onChange={(e) => setFilter('compressorEnabled', e.target.checked)}
                />
                Compressor
              </label>
            </div>
            {filters.compressorEnabled && (
              <div className="filter-subcontrols">
                <div className="filter-row">
                  <span>Threshold</span>
                  <span>{filters.compressorThreshold} dB</span>
                  <input
                    type="range"
                    min="-80"
                    max="0"
                    value={filters.compressorThreshold}
                    onChange={(e) => setFilter('compressorThreshold', Number(e.target.value))}
                    className="filter-slider"
                  />
                </div>
                <div className="filter-row">
                  <span>Ratio</span>
                  <span>{filters.compressorRatio}:1</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={filters.compressorRatio}
                    onChange={(e) => setFilter('compressorRatio', Number(e.target.value))}
                    className="filter-slider"
                  />
                </div>
                <div className="filter-row">
                  <span>Attack</span>
                  <span>{(filters.compressorAttack * 1000).toFixed(0)} ms</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.compressorAttack * 1000}
                    onChange={(e) => setFilter('compressorAttack', Number(e.target.value) / 1000)}
                    className="filter-slider"
                  />
                </div>
                <div className="filter-row">
                  <span>Release</span>
                  <span>{(filters.compressorRelease * 1000).toFixed(0)} ms</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.compressorRelease * 1000}
                    onChange={(e) => setFilter('compressorRelease', Number(e.target.value) / 1000)}
                    className="filter-slider"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
