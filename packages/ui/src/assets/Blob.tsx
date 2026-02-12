import React from 'react'
import { View } from 'react-native'
import Svg, { G, Path, type SvgProps } from 'react-native-svg'

type PartStyle = {
  color?: string
  opacity?: number
  /**
   * Scale factor (1 = original)
   */
  scale?: number
  /**
   * Translate in SVG units (viewBox coordinates)
   */
  tx?: number
  ty?: number
}

type BlobParts = {
  leftOuter?: PartStyle
  leftInner?: PartStyle
  rightOuter?: PartStyle
  rightInner?: PartStyle
  topRightSweep?: PartStyle
  topLeftSweep?: PartStyle
  topRightCore?: PartStyle
  topLeftCore?: PartStyle
}

function Part({
  d,
  color = '#F3F2F0',
  opacity = 1,
  scale = 1,
  tx = 0,
  ty = 0,
}: {
  d: string
} & PartStyle) {
  // Transform order: translate -> scale (so scaling occurs around origin)
  // If you need scale-around-center, we can add cx/cy later.
  const transform = scale !== 1 || tx !== 0 || ty !== 0 ? `translate(${tx} ${ty}) scale(${scale})` : undefined

  return (
    <G transform={transform} opacity={opacity}>
      <Path d={d} fill={color} />
    </G>
  )
}

/** 1) Left outer / base */
export function BlobLeftOuter(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M323.008 306.498C327.083 306.109 330.525 309.435 330.395 313.526C330.288 316.892 327.757 319.708 324.427 320.207C185.046 341.077 78.1583 461.305 78.1582 606.5C78.1582 607.993 76.9551 609.211 75.4619 609.211H26.1305C11.699 609.211 0 597.512 0 583.08V494.112C0 488.335 1.89509 482.705 5.51103 478.2C81.8257 383.12 194.809 318.735 323.008 306.498Z'
  return <Part d={d} {...style} />
}

/** 2) Left inner */
export function BlobLeftInner(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M323.556 322.742C327.051 322.203 330.158 324.964 330.158 328.5C330.158 415.089 353.751 496.168 394.857 565.66C405.838 584.223 393.154 609.211 371.587 609.211H83.2588C81.7575 609.211 80.5342 608.001 80.5342 606.5C80.5343 462.922 185.919 343.96 323.556 322.742Z'
  return <Part d={d} {...style} />
}

/** 3) Right outer */
export function BlobRightOuter(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M367.658 304.376C514.787 304.376 645.926 372.836 730.959 479.639C734.535 484.132 736.408 489.731 736.408 495.473V583.08C736.408 597.512 724.709 609.211 710.278 609.211H659.856C658.362 609.211 657.158 607.993 657.158 606.5C657.158 446.613 527.545 317 367.658 317C358.395 317 349.234 317.435 340.194 318.285C336.193 318.662 332.697 315.497 332.842 311.481C332.963 308.143 335.592 305.456 338.927 305.252C348.43 304.671 358.01 304.376 367.658 304.376Z'
  return <Part d={d} {...style} />
}

/** 4) Right inner */
export function BlobRightInner(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M367.658 319.376C526.233 319.376 654.783 447.925 654.783 606.5C654.783 608.001 653.56 609.211 652.059 609.211H439.973C431.81 609.211 424.078 605.424 419.319 598.792C364.696 522.67 332.534 429.341 332.534 328.5C332.534 324.487 335.556 321.122 339.55 320.734C348.798 319.835 358.174 319.376 367.658 319.376Z'
  return <Part d={d} {...style} />
}

/** 5) Top-right sweep (big arc) */
export function BlobTopRightSweep(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M736.408 406.438C736.408 431.332 703.194 443.454 684.949 426.518C601.703 349.247 490.198 302 367.658 302C356.986 302 346.398 302.36 335.905 303.066C334.475 303.162 333.278 301.987 333.363 300.557C333.444 299.2 334.649 298.195 336.001 298.338C346.403 299.436 356.965 300 367.658 300C532.239 300 665.658 166.581 665.658 1.99976C665.658 0.839292 666.595 -0.105713 667.756 -0.105713H710.278C724.709 -0.105713 736.408 11.5933 736.408 26.0248V406.438Z'
  return <Part d={d} {...style} />
}

/** 6) Top-left sweep */
export function BlobTopLeftSweep(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M67.5605 -0.105713C68.721 -0.105713 69.6582 0.839292 69.6582 1.99976C69.6582 153.215 182.288 278.123 328.234 297.413C329.867 297.629 331.071 299.068 330.974 300.713C330.883 302.269 329.655 303.524 328.101 303.655C221.665 312.592 125.394 357.264 51.3269 425.634C33.0711 442.485 0 430.353 0 405.509V26.0249C0 11.5934 11.699 -0.105713 26.1305 -0.105713H67.5605Z'
  return <Part d={d} {...style} />
}

/** 7) Top-right core block */
export function BlobTopRightCore(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M661.17 -0.105713C662.335 -0.105713 663.283 0.834559 663.283 1.99976C663.283 165.269 530.927 297.625 367.658 297.625C364.629 297.625 361.61 297.579 358.603 297.489C344.627 297.068 334.364 284.682 336.085 270.807C348.676 169.258 394.071 77.883 461.335 7.61211C466.119 2.6141 472.781 -0.105713 479.7 -0.105713H661.17Z'
  return <Part d={d} {...style} />
}

/** 8) Top-left core block */
export function BlobTopLeftCore(style: PartStyle & { dOverride?: string }) {
  const d =
    style.dOverride ??
    'M402.792 -0.105713C426.025 -0.105713 438.464 28.7257 424.444 47.2508C376.748 110.274 344.689 185.787 334.043 268.018C332.122 282.859 318.804 293.991 304.184 290.792C171.42 261.745 72.0342 143.48 72.0342 1.99976C72.0342 0.834559 72.9823 -0.105713 74.1475 -0.105713H402.792Z'
  return <Part d={d} {...style} />
}

/**
 * Parent component that composes all parts.
 * Control each part via `parts`.
 */
export function Blob({
  parts,
  ...props
}: SvgProps & {
  parts?: BlobParts
}) {
  return (
    <View style={{ width: '100%', aspectRatio: 737 / 800 }}>
      <Svg width="100%" height="100%" viewBox="0 0 737 609" preserveAspectRatio="xMidYMin slice" fill="none" {...props}>
        <BlobLeftOuter {...(parts?.leftOuter ?? {})} />
        <BlobLeftInner {...(parts?.leftInner ?? {})} />
        <BlobRightOuter {...(parts?.rightOuter ?? {})} />
        <BlobRightInner {...(parts?.rightInner ?? {})} />
        <BlobTopRightSweep {...(parts?.topRightSweep ?? {})} />
        <BlobTopLeftSweep {...(parts?.topLeftSweep ?? {})} />
        <BlobTopRightCore {...(parts?.topRightCore ?? {})} />
        <BlobTopLeftCore {...(parts?.topLeftCore ?? {})} />
      </Svg>
    </View>
  )
}