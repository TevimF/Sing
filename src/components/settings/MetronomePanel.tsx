import { useMetronome } from '../../hooks/useMetronome'

export function MetronomePanel() {
  const { isPlaying, setIsPlaying, bpm, setBpm, volume, setVolume, beat } = useMetronome(90)

  return (
    <div className="metronome-panel panel" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Metrônomo</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2, 3].map((b) => (
            <div 
              key={b} 
              style={{
                width: '12px', 
                height: '12px', 
                borderRadius: '50%',
                background: isPlaying && b === beat ? (b === 0 ? 'var(--accent)' : 'var(--text-dim)') : 'var(--surface-2)',
                boxShadow: isPlaying && b === beat ? `0 0 8px ${b === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}` : 'none',
                transition: 'all 50ms',
              }}
            />
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          className={`btn ${isPlaying ? 'btn--active' : 'btn--secondary'}`} 
          style={{ padding: '0.5rem 1rem', background: isPlaying ? 'var(--danger)' : '' }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'Parar' : 'Tocar'}
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>BPM</span>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{bpm}</span>
          </div>
          <input 
            type="range" 
            min="40" 
            max="200" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderLeft: '1px solid var(--surface-3)', paddingLeft: '1rem', height: '100px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Vol</span>
          <div style={{ width: '20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ 
                 width: '60px', 
                 height: '4px',
                 transform: 'rotate(-90deg)',
                 transformOrigin: 'center',
                 accentColor: 'var(--accent)',
                 cursor: 'pointer'
              }}
              title={`Volume: ${volume}%`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
