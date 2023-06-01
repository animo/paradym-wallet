/**
 * Darken the shade of a custom color based on the hex color and a percentage
 * used to dynamically create onPress styling for custom colors
 */
export function getTextColorBasedOnBg(bgColor: string) {
  return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '$grey-900' : '$grey-100'
}
