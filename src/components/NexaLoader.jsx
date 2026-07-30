import { NEXA_N_VIEWBOX, NEXA_N_PATH, NEXA_N_STROKE_WIDTH, NEXA_N_LENGTH } from './NexaMark.jsx'

export default function NexaLoader({ size = 30 }) {
  return (
    <span className="nexa-loader-wrap">
      <svg className="nexa-loader" width={size} height={size * (34 / 32)} viewBox={NEXA_N_VIEWBOX}>
        <path
          className="nexa-loader-track"
          d={NEXA_N_PATH}
          fill="none"
          strokeWidth={NEXA_N_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="nexa-loader-draw"
          d={NEXA_N_PATH}
          fill="none"
          strokeWidth={NEXA_N_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: NEXA_N_LENGTH }}
        />
      </svg>
    </span>
  )
}