const urlRegex = /^(.*:)\/\/([A-Za-z0-9-.]+)(:[0-9]+)?(.*)$/

export function getHostNameFromUrl(url: string) {
  const parts = urlRegex.exec(url)
  return parts ? parts[2] : undefined
}
