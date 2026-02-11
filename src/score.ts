import type { RGB } from 'color-convert'

export function scoreSwatchPath(path: RGB[], power = 1): number {
  const n = path.length
  if (n <= 1) return 0

  // Euclidean distance between two colors
  const dist = (a: RGB, b: RGB) => {
    const dr = a[0] - b[0]
    const dg = a[1] - b[1]
    const db = a[2] - b[2]
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  // Step 1: compute actual path penalty
  let actualPenalty = 0

  for (let i = 1; i < n; i++) {
    actualPenalty += Math.pow(dist(path[i - 1], path[i]), power)
  }

  // Step 2: compute guaranteed lower bound (closest neighbor sum)
  let lowerBound = 0

  for (let i = 0; i < n; i++) {
    let minDist = Infinity

    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const d = dist(path[i], path[j])
      if (d < minDist) minDist = d
    }
    lowerBound += Math.pow(minDist, power)
  }

  // Step 3: approximate worst-case (max jump every step)
  const maxStep = Math.sqrt(3 * 255 * 255) // max RGB distance
  const worstPenalty = Math.pow(maxStep, power) * (n - 1)

  // Step 4: normalize
  const normalized = (actualPenalty - lowerBound) / (worstPenalty - lowerBound)
  return Math.max(0, Math.min(1, normalized))
}
