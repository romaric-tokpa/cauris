import { ICONS, type IconName } from './icons'

export interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  className?: string
}

/** Wrapper SVG ligne (viewBox 24×24, couleur via `currentColor`). Porté de wf-lib.jsx. */
export function Icon({ name, size = 20, stroke = 1.7, className = '' }: IconProps) {
  return (
    <svg
      className={'wf-ic ' + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}
