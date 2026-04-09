import { useState, useRef, useEffect, useCallback } from 'react'

export function useMetronome(initialBpm = 120) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(initialBpm)
  const [volume, setVolumeState] = useState(50) // 0 to 100
  const volumeRef = useRef(50)
  const [beat, setBeat] = useState(0) // 0 to 3 for 4/4
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const nextNoteTimeRef = useRef(0)
  const currentScheduledBeatRef = useRef(0)
  const notesQueueRef = useRef<{ beat: number; time: number }[]>([])
  const intervalIdRef = useRef<number | null>(null)

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    // Add to queue for visual sync
    notesQueueRef.current.push({ beat: beatNumber, time })

    // Max internal gain is 25% to avoid deafening pure square/sine waves
    const peakGain = (volumeRef.current / 100) * 0.25 
    if (peakGain <= 0.005) return // Completely mute if extremely low

    const osc = audioContextRef.current!.createOscillator()
    const gain = audioContextRef.current!.createGain()

    osc.connect(gain)
    gain.connect(audioContextRef.current!.destination)

    osc.frequency.value = beatNumber === 0 ? 1000 : 800 // high beep on 1st beat
    gain.gain.setValueAtTime(peakGain, time)
    gain.gain.linearRampToValueAtTime(0, time + 0.1)

    osc.start(time)
    osc.stop(time + 0.1)
  }, [])

  const tick = useCallback(() => {
    if (!audioContextRef.current) return
    const scheduleAheadTime = 0.2 // schedule 200ms ahead for mobile stability
    const secondsPerBeat = 60.0 / bpm
 
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      const beatNum = currentScheduledBeatRef.current
      scheduleNote(beatNum, nextNoteTimeRef.current)
      
      currentScheduledBeatRef.current = (beatNum + 1) % 4
      nextNoteTimeRef.current += secondsPerBeat
    }

    // Precise UI Sync: Check the queue for the beat that should be playing NOW
    while (notesQueueRef.current.length > 0 && notesQueueRef.current[0].time < audioContextRef.current.currentTime) {
      setBeat(notesQueueRef.current[0].beat)
      notesQueueRef.current.shift()
    }
  }, [bpm, scheduleNote])

  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05
      currentScheduledBeatRef.current = 0
      notesQueueRef.current = [] // clear queue
      setBeat(0) // initial UI beat
      intervalIdRef.current = window.setInterval(tick, 25) // lookahead loop
    } else {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
    return () => {
      if (intervalIdRef.current !== null) clearInterval(intervalIdRef.current)
    }
  }, [isPlaying, tick])

  const setVolume = useCallback((val: number) => {
    volumeRef.current = val
    setVolumeState(val)
  }, [])

  return { isPlaying, setIsPlaying, bpm, setBpm, volume, setVolume, beat }
}
