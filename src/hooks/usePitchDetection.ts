import { useRef, useCallback, useEffect } from 'react'
import { AudioManager } from '../core/audio/audio-manager'
import { detectPitch } from '../core/audio/pitch-detector'
import { useAudioStore } from '../stores/audio.store'
import { useSettingsStore } from '../stores/settings.store'

export function usePitchDetection() {
  const managerRef = useRef<AudioManager | null>(null)
  const { isListening, currentPitch, hasPermission, error, inputLevel, setListening, setPermission, setPitch, setInputLevel, setError } =
    useAudioStore()
  const { audioConfig, filters } = useSettingsStore()

  // Sync filter changes to running audio manager
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateFilters(filters)
    }
  }, [filters])

  const start = useCallback(async () => {
    try {
      setError(null)
      const manager = new AudioManager()
      managerRef.current = manager

      const granted = await manager.requestMicPermission()
      setPermission(granted)
      if (!granted) {
        setError('Permissao do microfone negada')
        return
      }

      const currentFilters = useSettingsStore.getState().filters

      await manager.startListening(
        audioConfig,
        currentFilters,
        (buffer) => {
          const { audioConfig: liveConfig } = useSettingsStore.getState()
          const result = detectPitch(
            buffer,
            liveConfig.sampleRate,
            liveConfig.clarityThreshold,
            liveConfig.referencePitch,
          )
          setPitch(result)
        },
        (dB) => {
          setInputLevel(dB)
        },
      )

      setListening(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar audio')
      setListening(false)
    }
  }, [audioConfig, setError, setPermission, setListening, setPitch, setInputLevel])

  const stop = useCallback(async () => {
    await managerRef.current?.stopListening()
    managerRef.current = null
    setListening(false)
    setPitch(null)
    setInputLevel(-100)
  }, [setListening, setPitch, setInputLevel])

  const toggle = useCallback(async () => {
    if (isListening) {
      await stop()
    } else {
      await start()
    }
  }, [isListening, start, stop])

  return { isListening, currentPitch, hasPermission, error, inputLevel, start, stop, toggle }
}
