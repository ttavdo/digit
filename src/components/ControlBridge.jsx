import './ControlBridge.css'

const NODES = [
  { id: 'client', label: 'შენ', x: 60, y: 140, delay: 0.4 },
  { id: 'manager', label: 'მენეჯერი', x: 200, y: 80, delay: 0.9, hub: true },
  { id: 'specialist', label: 'სპეციალისტი', x: 340, y: 140, delay: 1.4 },
]

function ControlBridge() {
  return (
    <div className="control-bridge" aria-hidden="true">
      <div className="control-bridge__glow" />
      <svg viewBox="0 0 400 220" className="control-bridge__svg">
        <defs>
          <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-relay)" />
            <stop offset="50%" stopColor="var(--color-copper)" />
            <stop offset="100%" stopColor="var(--color-relay)" />
          </linearGradient>
        </defs>

        <path
          d="M 60 140 Q 130 60 200 80"
          className="control-bridge__path control-bridge__path--a"
          fill="none"
        />
        <path
          d="M 200 80 Q 270 60 340 140"
          className="control-bridge__path control-bridge__path--b"
          fill="none"
        />

        {NODES.map(({ id, label, x, y, delay, hub }) => (
          <g key={id} className="control-bridge__node" style={{ '--node-delay': `${delay}s` }}>
            <circle
              cx={x}
              cy={y}
              r={hub ? 28 : 20}
              className={`control-bridge__circle ${hub ? 'control-bridge__circle--hub' : ''}`}
            />
            <text x={x} y={y + (hub ? 52 : 44)} className="control-bridge__label">
              {label}
            </text>
          </g>
        ))}

        <circle cx="200" cy="80" r="6" className="control-bridge__pulse" />
      </svg>

      <div className="control-bridge__status">
        <span className="control-bridge__status-dot" />
        <span>კონტროლი მენეჯერის ხელში</span>
      </div>
    </div>
  )
}

export default ControlBridge
