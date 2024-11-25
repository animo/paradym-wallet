type DisclosureFrame = {
  [key: string]: boolean | DisclosureFrame
}

export function buildDisclosureFrameFromPaths(paths: (string | number | null)[][]): DisclosureFrame {
  const result: DisclosureFrame = {}

  // Sort paths by length ascending to ensure shallow paths override deeper ones
  const sortedPaths = [...paths].sort((a, b) => a.length - b.length)

  for (const path of sortedPaths) {
    let current = result
    let hasArrayMarker = false

    // First, check if path contains any array markers (number or null)
    for (const segment of path) {
      if (segment === null || typeof segment === 'number') {
        hasArrayMarker = true
        break
      }
    }

    if (hasArrayMarker) {
      // If path contains array marker, set the first segment to true
      const firstSegment = String(path[0])
      result[firstSegment] = true
      continue
    }

    // Handle non-array paths normally
    for (let i = 0; i < path.length; i++) {
      const segment = String(path[i])

      if (i === path.length - 1) {
        current[segment] = true
        if (typeof current[segment] === 'object') {
          current[segment] = true
        }
      } else {
        if (current[segment] === true) {
          break
        }
        if (!current[segment]) {
          current[segment] = {}
        }
        current = current[segment] as DisclosureFrame
      }
    }
  }

  return result
}
