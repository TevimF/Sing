import { useRef, useState, useEffect, useCallback } from 'react'
import { DronePlayer } from '../../core/audio/drone-player'

interface DroneControlProps {
  /** Frequency to anchor to. Drone retunes smoothly when this changes. */
  frequency: number
}

export function DroneControl({ frequency }: DroneControlProps) {
  const playerRef = useRef<DronePlayer | null>(null)
  const [isOn, setIsOn] = useState(false)
  const [volume, setVolume] = useState(0.06)

  // Retune the running drone whenever the exercise root changes.
  useEffect(() => {
    if (isOn && playerRef.current?.isPlaying) {
      playerRef.current.setFrequency(frequency)
    }
  }, [frequency, isOn])

  // Tear down on unmount.
  useEffect(() => () => { void playerRef.current?.dispose() }, [])

  const toggle = useCallback(async () => {
    if (!playerRef.current) playerRef.current = new DronePlayer()
    const player = playerRef.current
    if (isOn) {
      player.stop()
      setIsOn(false)
    } else {
      await player.start(frequency, volume)
      setIsOn(true)
    }
  }, [isOn, frequency, volume])

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    playerRef.current?.setVolume(v)
  }

  return (
    <div className={'drone-control' + (isOn ? ' drone-control--on' : '')}>
      <button
        type="button"
        className="drone-control__toggle"
        onClick={toggle}
        title={isOn ? 'Desligar drone' : 'Ligar drone do tom'}
        aria-pressed={isOn}
      >
        <span className="drone-control__icon" aria-hidden>∿</span>
        <span className="drone-control__label">Drone</span>
      </button>
      {isOn && (
        <input
          type="range"
          min="0"
          max="0.2"
          step="0.005"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="drone-control__volume"
          aria-label="Volume do drone"
          title={`Volume ${Math.round(volume * 500)}%`}
        />
      )}
    </div>
  )
}
