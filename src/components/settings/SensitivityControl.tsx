import { useSettingsStore } from '../../stores/settings.store'

export function SensitivityControl() {
  const { audioConfig, setClarityThreshold } = useSettingsStore()
  const threshold = audioConfig.clarityThreshold
  const percent = Math.round(threshold * 100)

  return (
    <div className="sensitivity-control">
      <label>
        <span className="sensitivity-control__label">
          Sensibilidade: <strong>{percent}%</strong>
        </span>
        <span className="sensitivity-control__hint">
          {threshold < 0.7 ? 'Capta mais ruido' : threshold > 0.9 ? 'Apenas voz clara' : 'Balanceado'}
        </span>
      </label>
      <input
        type="range"
        min="40"
        max="98"
        value={percent}
        onChange={(e) => setClarityThreshold(Number(e.target.value) / 100)}
        className="sensitivity-control__slider"
      />
    </div>
  )
}
