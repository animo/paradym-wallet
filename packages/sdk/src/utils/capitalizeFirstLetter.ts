/**
 * Capitalize first letter of a string
 * i.e. capitalizeFirstLetter("helloworld")  // returns: 'Helloworld'
 */
export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
