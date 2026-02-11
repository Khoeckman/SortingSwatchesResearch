self.onmessage = function (e) {
  const { N, path, distMatrix } = e.data

  let improved = true
  let improvements = 0
  let maxImprovements = 10_000

  // Repeat until no improvements are found capped at maxImprovements
  while (improved && improvements < maxImprovements) {
    improved = false

    for (let i = 1; i < N - 2; i++) {
      for (let k = i + 1; k < N - 1; k++) {
        const a = path[i - 1]
        const b = path[i]
        const c = path[k]
        const d = path[k + 1]

        const current = distMatrix[a][b] + distMatrix[c][d]
        const swapped = distMatrix[a][c] + distMatrix[b][d]

        if (swapped < current) {
          path.splice(i, k - i + 1, ...path.slice(i, k + 1).reverse())
          improved = true
          improvements++
        }
      }
    }
  }
  self.postMessage(path)
}
