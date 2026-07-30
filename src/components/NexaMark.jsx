
export const NEXA_N_VIEWBOX = '0 0 32 34'
export const NEXA_N_PATH = 'M 8 27 L 8 7 L 24 27 L 24 7'
export const NEXA_N_STROKE_WIDTH = 6
export const NEXA_N_LENGTH = 66

export default function NexaMark({ size = 22, className = '' }) {
  return (
    <svg className={`nexa-mark ${className}`} width={size} height={size * (34 / 32)} viewBox={NEXA_N_VIEWBOX}>
      <path
        d={NEXA_N_PATH}
        fill="none"
        strokeWidth={NEXA_N_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}