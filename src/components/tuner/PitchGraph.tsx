import { useRef, useEffect, useCallback } from 'react'
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
const MINIMAP_MIDI_LOW = 24   // C1 — full vocal range shown in minimap
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<PitchPoint[]>([])
  const animRef = useRef<number>(0)
  const pitchRef = useRef<{ midi: number; clarity: number } | null>(null)

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
      // Fade out the overlay when no pitch
      const fadeOut = setTimeout(() => { pitchRef.current = null }, 300)
      return () => clearTimeout(fadeOut)
    }
  }, [pitch, addPoint])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scaleNotes = getScaleMidiNotes(musicalKey, midiLow, midiHigh)

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height

      const now = performance.now()
      const midiRange = midiHigh - midiLow
      const graphLeft = PIANO_WIDTH
      const graphWidth = W - PIANO_WIDTH - MINIMAP_WIDTH
      const centerX = graphLeft + graphWidth / 2
      const minimapLeft = W - MINIMAP_WIDTH

      const yFromMidi = (midi: number) => H - ((midi - midiLow) / midiRange) * H
      const noteHeight = H / midiRange

      // Time mapping: center = now, left = past
      const xFromTime = (time: number) => {
        const age = (now - time) / 1000
        return centerX - (age / (durationSeconds / 2)) * (graphWidth / 2)
      }

      // === Background ===
      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(0, 0, W, H)

      // === Note rows (grid) ===
      for (let midi = midiLow; midi <= midiHigh; midi++) {
        const y = yFromMidi(midi + 0.5)
        const isInScale = scaleNotes.has(midi)
        const isC = midi % 12 === 0
        const isBlack = BLACK_KEYS.has(midi % 12)

        // Row background for scale notes
        if (isInScale) {
          ctx.fillStyle = isC ? 'rgba(74, 222, 128, 0.06)' : 'rgba(74, 222, 128, 0.03)'
          ctx.fillRect(graphLeft, y, graphWidth, noteHeight)
        }

        // Grid line
        if (!isBlack) {
          ctx.strokeStyle = isC ? '#333' : isInScale ? '#222' : '#181818'
          ctx.lineWidth = isC ? 1 : 0.5
          ctx.beginPath()
          ctx.moveTo(graphLeft, y + noteHeight)
          ctx.lineTo(W, y + noteHeight)
          ctx.stroke()
        }
      }

      // === Center line (now) ===
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, H)
      ctx.stroke()
      ctx.setLineDash([])

      // === Time labels ===
      ctx.fillStyle = '#444'
      ctx.font = '8px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      for (let s = 1; s <= durationSeconds / 2; s++) {
        const x = centerX - (s / (durationSeconds / 2)) * (graphWidth / 2)
        if (x > graphLeft + 10) {
          ctx.fillText(`-${s}s`, x, H - 3)
        }
      }

      // === Target note line ===
      if (targetMidi !== null) {
        const targetY = yFromMidi(targetMidi)
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.beginPath()
        ctx.moveTo(graphLeft, targetY)
        ctx.lineTo(W, targetY)
        ctx.stroke()
        ctx.setLineDash([])

        // Target label
        const tName = noteNameFromMidi(targetMidi)
        const tOct = octaveFromMidi(targetMidi)
        ctx.fillStyle = '#4ade80'
        ctx.font = 'bold 10px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${tName}${tOct}`, centerX + 8, targetY - 4)
      }

      // === Pitch trail ===
      const points = pointsRef.current
      if (points.length > 1) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1]
          const curr = points[i]

          // Skip very large jumps (noise) but allow natural voice movement
          if (Math.abs(curr.midi - prev.midi) > 6) continue
          // Skip if time gap is too large (silence between phrases)
          if (curr.time - prev.time > 400) continue

          const x1 = xFromTime(prev.time)
          const x2 = xFromTime(curr.time)
          const y1 = yFromMidi(prev.midi)
          const y2 = yFromMidi(curr.midi)

          // Only draw visible segments
          if (x2 < graphLeft || x1 > W) continue

          const age = (now - curr.time) / 1000
          const alpha = Math.max(0.2, 1 - age / (durationSeconds / 2))
          ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }

      // === Current pitch dot (at center) ===
      if (points.length > 0) {
        const last = points[points.length - 1]
        const age = (now - last.time) / 1000
        if (age < 0.3) {
          const y = yFromMidi(last.midi)
          // Glowing dot at center
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

      // === Pitch overlay info (note + clarity) ===
      const cp = pitchRef.current
      if (cp) {
        const midiInt = Math.round(cp.midi)
        const noteName = noteNameFromMidi(midiInt)
        const oct = octaveFromMidi(midiInt)
        const cents = Math.round((cp.midi - midiInt) * 100)
        const clarityPct = Math.round(cp.clarity * 100)
        const label = `${noteName}${oct}  ${cents >= 0 ? '+' : ''}${cents}c  ${clarityPct}%`
        ctx.fillStyle = 'rgba(74, 222, 128, 0.85)'
        ctx.font = 'bold 11px Inter, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(label, graphLeft + 8, 16)
      }

      // === Piano keys (left side) ===
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, PIANO_WIDTH, H)

      for (let midi = midiLow; midi <= midiHigh; midi++) {
        const y = yFromMidi(midi + 0.5)
        const noteIndex = midi % 12
        const isBlack = BLACK_KEYS.has(noteIndex)
        const isC = noteIndex === 0
        const isInScale = scaleNotes.has(midi)
        const isActive = points.length > 0 &&
          Math.abs(points[points.length - 1].midi - midi) < 0.5 &&
          (now - points[points.length - 1].time) < 300
        const isTarget = targetMidi === midi

        // Key background
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

        // Key border
        if (!isBlack) {
          ctx.strokeStyle = '#333'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(0, y + keyH)
          ctx.lineTo(keyW, y + keyH)
          ctx.stroke()
        }

        // Scale highlight bar
        if (isInScale && !isActive) {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.15)'
          ctx.fillRect(keyW - 3, y, 3, keyH)
        }

        // Label (C notes + target): note name + frequency
        if (isC || isTarget) {
          const name = noteNameFromMidi(midi)
          const oct = octaveFromMidi(midi)
          const freq = frequencyFromMidi(midi)
          const freqStr = freq >= 100 ? `${freq.toFixed(0)}` : `${freq.toFixed(1)}`
          ctx.fillStyle = isActive ? '#000' : isTarget ? '#4ade80' : '#666'
          ctx.textAlign = 'right'
          // Note name
          ctx.font = `${isTarget ? 'bold ' : ''}8px Inter, system-ui, sans-serif`
          ctx.fillText(`${name}${oct}`, PIANO_WIDTH - 4, y + keyH / 2)
          // Frequency below note name (always show)
          ctx.font = '6px Inter, system-ui, sans-serif'
          ctx.fillStyle = isActive ? '#000' : isTarget ? 'rgba(74,222,128,0.7)' : '#444'
          ctx.fillText(`${freqStr}Hz`, PIANO_WIDTH - 4, y + keyH / 2 + 7)
        }
      }

      // Piano right border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PIANO_WIDTH, 0)
      ctx.lineTo(PIANO_WIDTH, H)
      ctx.stroke()

      // === Minimap (right side) ===
      const mmRange = MINIMAP_MIDI_HIGH - MINIMAP_MIDI_LOW
      const mmY = (midi: number) => H - ((midi - MINIMAP_MIDI_LOW) / mmRange) * H

      // Background
      ctx.fillStyle = '#111'
      ctx.fillRect(minimapLeft, 0, MINIMAP_WIDTH, H)

      // Octave dividers
      for (let oct = 1; oct <= 7; oct++) {
        const midi = (oct + 1) * 12  // C notes
        const y = mmY(midi)
        ctx.strokeStyle = '#2a2a2a'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(minimapLeft, y)
        ctx.lineTo(minimapLeft + MINIMAP_WIDTH, y)
        ctx.stroke()
        // Octave label
        ctx.fillStyle = '#333'
        ctx.font = '5px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`C${oct}`, minimapLeft + MINIMAP_WIDTH / 2, y - 1)
      }

      // Current view window highlight
      const viewTopY = mmY(midiHigh)
      const viewBotY = mmY(midiLow)
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)'
      ctx.fillRect(minimapLeft, viewTopY, MINIMAP_WIDTH, viewBotY - viewTopY)
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(minimapLeft, viewTopY, MINIMAP_WIDTH, viewBotY - viewTopY)

      // Target note indicator on minimap
      if (targetMidi !== null) {
        const ty = mmY(targetMidi)
        ctx.fillStyle = 'rgba(74, 222, 128, 0.6)'
        ctx.fillRect(minimapLeft + 1, ty - 1, MINIMAP_WIDTH - 2, 2)
      }

      // Recent pitch history on minimap
      const recent = pointsRef.current.filter((p) => now - p.time < durationSeconds * 1000)
      for (const pt of recent) {
        const py = mmY(pt.midi)
        if (py < 0 || py > H) continue
        const age = (now - pt.time) / (durationSeconds * 1000)
        const alpha = Math.max(0.1, 1 - age)
        // Highlight if outside current view
        const outOfView = pt.midi < midiLow || pt.midi > midiHigh
        ctx.fillStyle = outOfView
          ? `rgba(255, 200, 50, ${alpha})`   // amber = out of view
          : `rgba(74, 222, 128, ${alpha})`   // green = in view
        ctx.fillRect(minimapLeft + 2, py - 1, MINIMAP_WIDTH - 4, 2)
      }

      // Separator line left of minimap
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(minimapLeft, 0)
      ctx.lineTo(minimapLeft, H)
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [durationSeconds, targetMidi, musicalKey, midiLow, midiHigh])

  return (
    <canvas
      ref={canvasRef}
      className="pitch-graph"
      style={{ width: '100%', height: '320px', borderRadius: '8px' }}
    />
  )
}
