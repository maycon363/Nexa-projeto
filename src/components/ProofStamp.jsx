export default function ProofStamp({ progress, size = 44 }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - progress)
  const complete = progress >= 1

  return (
    <svg
      className={`proof-stamp${complete ? ' complete' : ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className="ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <path
        className="stamp-check"
        d={`M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.65} L ${size * 0.7} ${size * 0.36}`}
        fill="none"
        stroke="var(--color-green-bright)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}