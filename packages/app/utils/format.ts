export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function sanitizeString(str: string) {
  const result = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  let words = result.split(' ')
  words = words.map((word, index) => {
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    } else {
      return word.charAt(0).toLowerCase() + word.slice(1)
    }
  })
  return words.join(' ')
}
