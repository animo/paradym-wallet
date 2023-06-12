import type { Colors } from '../config/tamagui.config'

import { hexColors } from '../config/tamagui.config'
/**
 * Get text color (white or black) for specific background color
 */
export function getTextColorBasedOnBg(bgColor: string) {
  return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '$grey-900' : '$grey-100'
}

/**
 * Darken the shade of a custom color based on the hex color and a percentage
 * used to dynamically create onPress styling for custom colors
 */
export function darken(color: string | Colors, percent: number): string {
  const hexColor = color.startsWith('#')
    ? color
    : (hexColors[color.startsWith('$') ? color.slice(1) : color] as string)
  const f = parseInt(hexColor.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}
