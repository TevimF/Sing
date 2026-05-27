import { useRef, useEffect, useCallback, useState } from 'react'
import { type PitchResult, type NoteName } from '../../contracts'
import { noteNameFromMidi, octaveFromMidi, frequencyFromMidi } from '../../core/music/notes'
import { getScaleMidiNotes } from '../../core/music/scales'

interface PitchGraphProps {
  pitch: PitchResult | null
  targetMidi?: number | null
  musicalKey?: NoteName
  durationSeconds?: number
  midiLow?: number
  midiHigh?: number
}

interface PitchPoint {
  time: number
  midi: number
}

const PIANO_WIDTH = 48
const MINIMAP_WIDTH = 14
const MINIMAP_MIDI_LOW = 24   // C1
const MINIMAP_MIDI_HIGH = 96  // C7
const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

const DEFAULT_midiLow = 43   // G2
const DEFAULT_midiHigh = 72  // C5

export function PitchGraph({
  pitch,
  targetMidi = null,
  musicalKey = 'C',
  durationSeconds = 8,
  midiLow = DEFAULT_midiLow,
  midiHigh = DEFAULT_midiHigh,
}: PitchGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const pointsRef = useRef<PitchPoint[]>([])
  const animRef = useRef<number>(0)
  const pitchRef = useRef<{ midi: number; clarity: number } | null>(null)

  // View state
  const [viewCenter, setViewCenter] = useState((midiHigh + midiLow) / 2)
  const [viewRange, setViewRange] = useState(midiHigh - midiLow)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const cLow = viewCenter - viewRange / 2
  const cHigh = viewCenter + viewRange / 2

  const addPoint = useCallback((p: PitchResult) => {
    if (p.midiNote === null || p.centsOffset === null) return
    const midiFloat = p.midiNote + p.centsOffset / 100
    pitchRef.current = { midi: midiFloat, clarity: p.clarity }
    pointsRef.current.push({
      time: performance.now(),
      midi: midiFloat,
    })
    const cutoff = performance.now() - durationSeconds * 1000
    pointsRef.current = pointsRef.current.filter((pt) => pt.time > cutoff)
  }, [durationSeconds])

  useEffect(() => {
    if (pitch) {
      addPoint(pitch)
    } else {
      const fadeOut = setTimeout(() => { pitchRef.current = null }, 300)
      return () => clearTimeout(fadeOut)
    }
  }, [pitch, addPoint])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Mouse drag & scroll handling
  const isDragging = useRef(false)
  const lastY = useRef(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    lastY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !canvasRef.current) return
    const dy = e.clientY - lastY.current
    lastY.current = e.clientY

    const rect = canvasRef.current.getBoundingClientRect()
    // dy > 0 means mouse moved down. That means the graph should go down, meaning viewCenter should go UP.
    const notesDiff = (dy / rect.height) * viewRange
    setViewCenter(prev => {
      const center = prev + notesDiff
      return Math.max(MINIMAP_MIDI_LOW + viewRange / 2, Math.min(MINIMAP_MIDI_HIGH - viewRange / 2, center))
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent zooming page, allow zooming graph
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      setViewRange(prev => {
        const newRange = prev + e.deltaY * 0.05
        return Math.max(12, Math.min(60, newRange)) // Min 1 octave, max 5 octaves
      })
    } else {
      // Scroll vertically
      setViewCenter(prev => {
        const center = prev - e.deltaY * 0.05
        return Math.max(MINIMAP_MIDI_LOW + viewRange / 2, Math.min(MINIMAP_MIDI_HIGH - viewRange / 2, center))
      })
    }
  }

  // Mutable refs let the draw loop read live view/target/key state without
  // tearing down the rAF every time the user drags or zooms.
  const viewRef = useRef({ cLow, cHigh, viewRange })
  const targetMidiRef = useRef(targetMidi)
  const durationRef = useRef(durationSeconds)
  const scaleNotesRef = useRef(getScaleMidiNotes(musicalKey, MINIMAP_MIDI_LOW, MINIMAP_MIDI_HIGH))
  const sizeRef = useRef({ W: 0, H: 0 })

  useEffect(() => { viewRef.current = { cLow, cHigh, viewRange } }, [cLow, cHigh, viewRange])
  useEffect(() => { targetMidiRef.current = targetMidi }, [targetMidi])
  useEffect(() => { durationRef.current = durationSeconds }, [durationSeconds])
  useEffect(() => {
    scaleNotesRef.current = getScaleMidiNotes(musicalKey, MINIMAP_MIDI_LOW, MINIMAP_MIDI_HIGH)
  }, [musicalKey])

  // Draw loop — set up once on mount, never torn down by view/target changes.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      // setTransform overwrites (doesn't compound like scale). Setting width
      // resets the transform, so we re-apply it here whenever size changes.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { W: rect.width, H: rect.height }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(canvas)

    const draw = () => {
      const { cLow, cHigh, viewRange } = viewRef.current
      const { W, H } = sizeRef.current
      const targetMidi = targetMidiRef.current
      const durationSeconds = durationRef.current
      const scaleNotes = scaleNotesRef.current

      const now = performance.now()
      const graphLeft = PIANO_WIDTH
      const graphWidth = W - PIANO_WIDTH - MINIMAP_WIDTH
      const centerX = graphLeft + graphWidth / 2
      const minimapLeft = W - MINIMAP_WIDTH

      const yFromMidi = (midi: number) => H - ((midi - cLow) / viewRange) * H
      const noteHeight = H / viewRange

      const xFromTime = (time: number) => {
        const age = (now - time) / 1000
        return centerX - (age / (durationSeconds / 2)) * (graphWidth / 2)
      }

      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(0, 0, W, H)

      const startInt = Math.floor(cLow)
      const endInt = Math.ceil(cHigh)

      // Rows
      for (let midi = startInt; midi <= endInt; midi++) {
        const y = yFromMidi(midi + 0.5)
        const isInScale = scaleNotes.has(midi)
        const isC = midi % 12 === 0
        const isBlack = BLACK_KEYS.has(midi % 12)

        if (isInScale) {
          ctx.fillStyle = isC ? 'rgba(74, 222, 128, 0.06)' : 'rgba(74, 222, 128, 0.03)'
          ctx.fillRect(graphLeft, y, graphWidth, noteHeight)
        }

        if (!isBlack) {
          ctx.strokeStyle = isC ? '#333' : isInScale ? '#222' : '#181818'
          ctx.lineWidth = isC ? 1 : 0.5
          ctx.beginPath()
          ctx.moveTo(graphLeft, y + noteHeight)
          ctx.lineTo(W, y + noteHeight)
          ctx.stroke()
        }
      }

      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, H)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#444'
      ctx.font = '8px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      for (let s = 1; s <= durationSeconds / 2; s++) {
        const x = centerX - (s / (durationSeconds / 2)) * (graphWidth / 2)
        if (x > graphLeft + 10) {
          ctx.fillText(`-${s}s`, x, H - 3)
        }
      }

      if (targetMidi !== null && targetMidi >= cLow - 1 && targetMidi <= cHigh + 1) {
        const targetY = yFromMidi(targetMidi)
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.beginPath()
        ctx.moveTo(graphLeft, targetY)
        ctx.lineTo(W, targetY)
        ctx.stroke()
        ctx.setLineDash([])

        const tName = noteNameFromMidi(targetMidi)
        const tOct = octaveFromMidi(targetMidi)
        ctx.fillStyle = '#4ade80'
        ctx.font = 'bold 10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${tName}${tOct}`, centerX + 8, targetY - 4)
      }

      const points = pointsRef.current
      if (points.length > 1) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1]
          const curr = points[i]

          if (Math.abs(curr.midi - prev.midi) > 6) continue
          if (curr.time - prev.time > 400) continue

          const x1 = xFromTime(prev.time)
          const x2 = xFromTime(curr.time)
          const y1 = yFromMidi(prev.midi)
          const y2 = yFromMidi(curr.midi)

          if (x2 < graphLeft || x1 > W) continue

          const age = (now - curr.time) / 1000
          const alpha = Math.max(0.2, 1 - age / (durationSeconds / 2))
          ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x1, Math.max(-10, Math.min(H+10, y1)))
          ctx.lineTo(x2, Math.max(-10, Math.min(H+10, y2)))
          ctx.stroke()
        }
      }

      if (points.length > 0) {
        const last = points[points.length - 1]
        const age = (now - last.time) / 1000
        if (age < 0.3) {
          const y = yFromMidi(last.midi)
          if (y >= 0 && y <= H) {
            ctx.beginPath()
            ctx.arc(centerX, y, 6, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(74, 222, 128, 0.2)'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(centerX, y, 3.5, 0, Math.PI * 2)
            ctx.fillStyle = '#4ade80'
            ctx.fill()
          }
        }
      }

      const cp = pitchRef.current
      if (cp) {
        const midiInt = Math.round(cp.midi)
        const noteName = noteNameFromMidi(midiInt)
        const oct = octaveFromMidi(midiInt)
        const cents = Math.round((cp.midi - midiInt) * 100)
        const clarityPct = Math.round(cp.clarity * 100)
        const freq = frequencyFromMidi(cp.midi)
        const label = `${noteName}${oct}  ${cents >= 0 ? '+' : ''}${cents}c  ${clarityPct}%  ${freq.toFixed(1)}Hz`
        ctx.fillStyle = 'rgba(74, 222, 128, 0.85)'
        ctx.font = 'bold 11px Inter, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(label, graphLeft + 8, 16)
      }

      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, PIANO_WIDTH, H)

      for (let midi = startInt; midi <= endInt; midi++) {
        const y = yFromMidi(midi + 0.5)
        const noteIndex = midi % 12
        const isBlack = BLACK_KEYS.has(noteIndex)
        const isC = noteIndex === 0
        const isInScale = scaleNotes.has(midi)
        const isActive = points.length > 0 &&
          Math.abs(points[points.length - 1].midi - midi) < 0.5 &&
          (now - points[points.length - 1].time) < 300
        const isTarget = targetMidi === midi

        if (isActive) {
          ctx.fillStyle = '#4ade80'
        } else if (isTarget) {
          ctx.fillStyle = '#2d5a2d'
        } else if (isBlack) {
          ctx.fillStyle = isInScale ? '#1f1f1f' : '#141414'
        } else {
          ctx.fillStyle = isInScale ? '#2a2a2a' : '#222'
        }

        const keyH = Math.max(noteHeight - 0.5, 1)
        const keyW = isBlack ? PIANO_WIDTH * 0.65 : PIANO_WIDTH - 1
        ctx.fillRect(0, y, keyW, keyH)

        if (!isBlack) {
          ctx.strokeStyle = '#333'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(0, y + keyH)
          ctx.lineTo(keyW, y + keyH)
          ctx.stroke()
        }

        if (isInScale && !isActive) {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.15)'
          ctx.fillRect(keyW - 3, y, 3, keyH)
        }

        if ((isC || isTarget || isActive) && keyH > 10) {
          const name = noteNameFromMidi(midi)
          const oct = octaveFromMidi(midi)
          const freqStr = frequencyFromMidi(midi).toFixed(0)
          
          ctx.fillStyle = isActive ? '#000' : isTarget ? '#4ade80' : '#666'
          ctx.textAlign = 'right'
          
          if (keyH > 16) {
            ctx.font = `${isTarget ? 'bold ' : ''}8px Inter, system-ui, sans-serif`
            ctx.fillText(`${name}${oct}`, PIANO_WIDTH - 4, y + keyH / 2 - 1)
            ctx.font = '6px Inter, system-ui, sans-serif'
            ctx.fillStyle = isActive ? '#000' : isTarget ? 'rgba(74,222,128,0.7)' : '#444'
            ctx.fillText(`${freqStr}Hz`, PIANO_WIDTH - 4, y + keyH / 2 + 7)
          } else {
            ctx.font = `${isTarget ? 'bold ' : ''}8px Inter, system-ui, sans-serif`
            ctx.fillText(`${name}${oct}`, PIANO_WIDTH - 4, y + keyH / 2 + 3)
          }
        }
      }

      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PIANO_WIDTH, 0)
      ctx.lineTo(PIANO_WIDTH, H)
      ctx.stroke()

      // Minimap
      const mmRange = MINIMAP_MIDI_HIGH - MINIMAP_MIDI_LOW
      const mmY = (m: number) => H - ((m - MINIMAP_MIDI_LOW) / mmRange) * H

      ctx.fillStyle = '#111'
      ctx.fillRect(minimapLeft, 0, MINIMAP_WIDTH, H)

      for (let oct = 1; oct <= 7; oct++) {
        const midi = (oct + 1) * 12
        const y = mmY(midi)
        ctx.strokeStyle = '#2a2a2a'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(minimapLeft, y)
        ctx.lineTo(minimapLeft + MINIMAP_WIDTH, y)
        ctx.stroke()

        ctx.fillStyle = '#333'
        ctx.font = '5px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`C${oct}`, minimapLeft + MINIMAP_WIDTH / 2, y - 1)
      }

      const viewTopY = mmY(cHigh)
      const viewBotY = mmY(cLow)
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)'
      ctx.fillRect(minimapLeft, viewTopY, MINIMAP_WIDTH, viewBotY - viewTopY)
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(minimapLeft, viewTopY, MINIMAP_WIDTH, viewBotY - viewTopY)

      if (targetMidi !== null) {
        const ty = mmY(targetMidi)
        ctx.fillStyle = 'rgba(74, 222, 128, 0.6)'
        ctx.fillRect(minimapLeft + 1, ty - 1, MINIMAP_WIDTH - 2, 2)
      }

      const recent = pointsRef.current.filter((p) => now - p.time < durationSeconds * 1000)
      for (const pt of recent) {
        const py = mmY(pt.midi)
        if (py < 0 || py > H) continue
        const age = (now - pt.time) / (durationSeconds * 1000)
        const alpha = Math.max(0.1, 1 - age)
        const outOfView = pt.midi < cLow || pt.midi > cHigh
        ctx.fillStyle = outOfView
          ? `rgba(255, 200, 50, ${alpha})`
          : `rgba(74, 222, 128, ${alpha})`
        ctx.fillRect(minimapLeft + 2, py - 1, MINIMAP_WIDTH - 4, 2)
      }

      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(minimapLeft, 0)
      ctx.lineTo(minimapLeft, H)
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      observer.disconnect()
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const zoomIn = () => setViewRange(prev => Math.max(12, prev - 4))
  const zoomOut = () => setViewRange(prev => Math.min(60, prev + 4))
  const panUp = () => setViewCenter(prev =>
    Math.min(MINIMAP_MIDI_HIGH - viewRange / 2, prev + 12),
  )
  const panDown = () => setViewCenter(prev =>
    Math.max(MINIMAP_MIDI_LOW + viewRange / 2, prev - 12),
  )

  return (
    <div
      ref={containerRef}
      className={`pitch-graph-container ${isFullscreen ? 'pitch-graph-container--fs' : ''}`}
    >
      <div className="graph-toolbar">
        <button className="graph-btn" onClick={panUp} title="Subir oitava" aria-label="Subir oitava">↑</button>
        <button className="graph-btn" onClick={panDown} title="Descer oitava" aria-label="Descer oitava">↓</button>
        <button className="graph-btn" onClick={zoomIn} title="Aproximar" aria-label="Aproximar">+</button>
        <button className="graph-btn" onClick={zoomOut} title="Afastar" aria-label="Afastar">−</button>
        <button className="graph-btn graph-btn--accent" onClick={toggleFullscreen} title="Tela cheia">
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="pitch-graph"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />
    </div>
  )
}
