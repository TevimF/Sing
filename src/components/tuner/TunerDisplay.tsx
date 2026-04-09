import React from 'react'
import { useAudioStore } from '../../stores/audio.store'

export const TunerDisplay: React.FC = () => {
  const { currentPitch, isListening } = useAudioStore()

  if (!isListening) {
    return (
      <div className="tuner-offline">
        <p>Microfone desativado</p>
      </div>
    )
  }

  if (!currentPitch || !currentPitch.noteName) {
    return (
      <div className="tuner-searching">
        <p>Ouvindo...</p>
      </div>
    )
  }

  const cents = currentPitch.centsOffset || 0
  const isInTune = Math.abs(cents) < 10

  return (
    <div className={`tuner-display ${isInTune ? 'in-tune' : 'out-of-tune'}`}>
      <div className="note-name">{currentPitch.noteName}</div>
      <div className="frequency">{currentPitch.frequency.toFixed(1)} Hz</div>
      <div className="cents-meter">
        <div 
          className="needle" 
          style={{ transform: `translateX(${cents * 2}px)` }}
        />
        <div className="target-line" />
      </div>
      <div className="cents-label">{cents > 0 ? '+' : ''}{cents.toFixed(0)} cents</div>
    </div>
  )
}
