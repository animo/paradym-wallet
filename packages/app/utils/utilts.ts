export function getTextColorBasedOnBg(bgColor: string) {
  return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '$grey-900' : '$grey-100'
}
