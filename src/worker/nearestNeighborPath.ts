function pop<T = any>(arr: T[], index: number): T {
  return arr.splice(index, 1)[0]
}

self.onmessage = function (e) {
  const { N, distMatrix, startIndex = 0 } = e.data

  const remaining = Array(N)
    .fill(0)
    .map((_, i) => i)

  const path: number[] = [pop(remaining, startIndex)]

  while (remaining.length) {
    const tail = path[path.length - 1]

    let bestIndex = 0
    let bestDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const d = distMatrix[tail][remaining[i]]

      if (d < bestDist) {
        bestDist = d
        bestIndex = i
      }
    }
    path.push(pop(remaining, bestIndex))
  }
  self.postMessage(path)
}
