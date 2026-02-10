import convert from 'color-convert'
import { scoreSwatchPath } from './score'

type RGB = [r: number, g: number, b: number]

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z * 6 + 3))
}

const generateRandomColors = (length: number) =>
  new Array(length)
    .fill(0)
    .map(() => [~~(sigmoid(Math.random()) * 256), ~~(sigmoid(Math.random()) * 256), ~~(sigmoid(Math.random()) * 256)])

const swatches = generateRandomColors(410)

const solutions = [...(document.querySelector('.solutions')!.children as HTMLCollectionOf<HTMLUListElement>)]

solutions.forEach((solution, i) => {
  if (solution.classList.contains('separator')) return

  const swatchesList = solution.querySelector('ol')!

  const swatchesCopy: RGB[] = JSON.parse(JSON.stringify(swatches))

  switch (i) {
    case 0:
      break // Generated
    case 1:
      // Sort by relative hue
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const hueA = Math.atan2(Math.sqrt(3) * (ag - ab), 2 * ar - ag - ab)
        const hueB = Math.atan2(Math.sqrt(3) * (bg - bb), 2 * br - bg - bb)
        return hueA - hueB
      })
      break
    case 2:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [, satA] = convert.rgb.hsl(ar, ag, ab)
        const [, satB] = convert.rgb.hsl(br, bg, bb)
        return satA - satB
      })
      break
    case 3:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [, , lightA] = convert.rgb.hsl(ar, ag, ab)
        const [, , lightB] = convert.rgb.hsl(br, bg, bb)
        return lightA - lightB
      })
      break
    case 4:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [, , valA] = convert.rgb.hsv(ar, ag, ab)
        const [, , valB] = convert.rgb.hsv(br, bg, bb)
        return valA - valB
      })
      break
    case 5:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [hueA, satA] = convert.rgb.hsl(ar, ag, ab)
        const [hueB, satB] = convert.rgb.hsl(br, bg, bb)

        const groupA = +(satA > 50)
        const groupB = +(satB > 50)

        return groupA - groupB || hueA - hueB
      })
      break
    case 6:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [hueA, , lightA] = convert.rgb.hsl(ar, ag, ab)
        const [hueB, , lightB] = convert.rgb.hsl(br, bg, bb)

        const groupA = +(lightA > 50)
        const groupB = +(lightB > 50)

        return groupA - groupB || hueA - hueB
      })
      break
    case 7:
      swatchesCopy.sort(([ar, ag, ab], [br, bg, bb]) => {
        const [hueA, , valA] = convert.rgb.hsv(ar, ag, ab)
        const [hueB, , valB] = convert.rgb.hsv(br, bg, bb)

        const groupA = +(valA > 50)
        const groupB = +(valB > 50)

        return groupA - groupB || hueA - hueB
      })
      break
    case 8: {
      const dist = (a: [number, number, number], b: [number, number, number]) => {
        const dr = a[0] - b[0]
        const dg = a[1] - b[1]
        const db = a[2] - b[2]
        return dr * dr + dg * dg + db * db
      }

      const nearestNeighborPath = (colors: typeof swatchesCopy) => {
        const remaining = colors.slice()
        const path = [remaining.pop()!]

        while (remaining.length) {
          const last = path[path.length - 1]

          let bestIndex = 0
          let bestDist = dist(last, remaining[0])

          for (let i = 1; i < remaining.length; i++) {
            const d = dist(last, remaining[i])
            if (d < bestDist) {
              bestDist = d
              bestIndex = i
            }
          }

          path.push(remaining.splice(bestIndex, 1)[0])
        }

        return path
      }

      const twoOpt = (path: typeof swatchesCopy) => {
        let improved = true

        while (improved) {
          improved = false

          for (let i = 1; i < path.length - 2; i++) {
            for (let k = i + 1; k < path.length - 1; k++) {
              const a = path[i - 1]
              const b = path[i]
              const c = path[k]
              const d = path[k + 1]

              const current = dist(a, b) + dist(c, d)
              const swapped = dist(a, c) + dist(b, d)

              if (swapped < current) {
                const reversed = path.slice(i, k + 1).reverse()
                path.splice(i, k - i + 1, ...reversed)
                improved = true
              }
            }
          }
        }

        return path
      }

      let bestPath = twoOpt(nearestNeighborPath(swatchesCopy))

      swatchesCopy.splice(0, swatchesCopy.length, ...bestPath)
      break
    }
    case 9: {
      type RGB = [number, number, number]

      const power = 2.5 // punishment exponent

      // Optionally split by value > 50% for human perception
      const high: RGB[] = []
      const low: RGB[] = []
      for (const c of swatchesCopy) {
        const [, , v] = convert.rgb.hsv(...c)
        ;(v > 50 ? high : low).push(c)
      }

      const processGroup = (group: RGB[]) => {
        const N = group.length
        if (N <= 1) return group.slice()

        // Precompute distance matrix (squared Euclidean, heavy-jump powered later)
        const distMatrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0))
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            const [r1, g1, b1] = group[i]
            const [r2, g2, b2] = group[j]
            const dr = r1 - r2
            const dg = g1 - g2
            const db = b1 - b2
            const d = dr * dr + dg * dg + db * db
            distMatrix[i][j] = d
            distMatrix[j][i] = d
          }
        }

        const totalDistance = (path: number[]) =>
          path.reduce((sum, idx, i) => (i === 0 ? 0 : sum + Math.pow(distMatrix[path[i - 1]][idx], power / 2)), 0)

        // Nearest Neighbor path from arbitrary start
        const nearestNeighborPath = (startIndex: number) => {
          const remaining = Array.from({ length: N }, (_, i) => i)
          const path: number[] = [remaining.splice(startIndex, 1)[0]]

          while (remaining.length) {
            const last = path[path.length - 1]
            let bestIndex = 0
            let bestDist = distMatrix[last][remaining[0]]
            for (let i = 1; i < remaining.length; i++) {
              const d = distMatrix[last][remaining[i]]
              if (d < bestDist) {
                bestDist = d
                bestIndex = i
              }
            }
            path.push(remaining.splice(bestIndex, 1)[0])
          }

          return path
        }

        // 2-opt improvement (in-place)
        const twoOpt = (path: number[]) => {
          let improved = true
          while (improved) {
            improved = false
            for (let i = 1; i < N - 2; i++) {
              for (let k = i + 1; k < N - 1; k++) {
                const a = path[i - 1],
                  b = path[i],
                  c = path[k],
                  d = path[k + 1]
                const current = Math.pow(distMatrix[a][b], power / 2) + Math.pow(distMatrix[c][d], power / 2)
                const swapped = Math.pow(distMatrix[a][c], power / 2) + Math.pow(distMatrix[b][d], power / 2)
                if (swapped < current) {
                  path.splice(i, k - i + 1, ...path.slice(i, k + 1).reverse())
                  improved = true
                }
              }
            }
          }
          return path
        }

        // Multi-start NN
        const tries = Math.min(12, N)
        let bestPath: number[] = []
        let bestScore = Infinity
        for (let t = 0; t < tries; t++) {
          const start = Math.floor(Math.random() * N)
          let path = nearestNeighborPath(start)
          path = twoOpt(path)
          const score = totalDistance(path)
          if (score < bestScore) {
            bestScore = score
            bestPath = path
          }
        }

        return bestPath.map((i) => group[i])
      }

      const orderedHigh = processGroup(high)
      const orderedLow = processGroup(low)

      swatchesCopy.splice(0, swatchesCopy.length, ...orderedHigh, ...orderedLow)
      break
    }
    case 10: {
      const lab = swatchesCopy.map(([r, g, b]) => convert.rgb.lab(r, g, b) as [number, number, number])

      const dist = (a: number[], b: number[], power = 2.5) => {
        const dr = a[0] - b[0]
        const dg = a[1] - b[1]
        const db = a[2] - b[2]
        return Math.pow(dr * dr + dg * dg + db * db, power / 2)
      }

      const nearestNeighbor = (startIndex: number) => {
        const remaining = lab.map((_, i) => i)
        const path: number[] = [remaining.splice(startIndex, 1)[0]]

        while (remaining.length) {
          const last = path[path.length - 1]
          let bestIdx = 0
          let bestDist = dist(lab[last], lab[remaining[0]])

          for (let i = 1; i < remaining.length; i++) {
            const d = dist(lab[last], lab[remaining[i]])

            if (d < bestDist) {
              bestDist = d
              bestIdx = i
            }
          }
          path.push(remaining.splice(bestIdx, 1)[0])
        }
        return path
      }

      const twoOpt = (path: number[]) => {
        let improved = true

        while (improved) {
          improved = false

          for (let i = 1; i < path.length - 2; i++) {
            for (let k = i + 1; k < path.length - 1; k++) {
              const a = lab[path[i - 1]]
              const b = lab[path[i]]
              const c = lab[path[k]]
              const d = lab[path[k + 1]]

              const current = dist(a, b) + dist(c, d)
              const swapped = dist(a, c) + dist(b, d)

              if (swapped < current) {
                path.splice(i, k - i + 1, ...path.slice(i, k + 1).reverse())
                improved = true
              }
            }
          }
        }
        return path
      }

      // Multi-start NN (choose multiple random starts)
      const starts = Array.from({ length: 12 }, () => Math.floor(Math.random() * swatchesCopy.length))
      let bestPath: number[] = []
      let bestScore = Infinity

      for (const s of starts) {
        const p = twoOpt(nearestNeighbor(s))

        const score = p.reduce((sum, _, idx) => (idx === 0 ? 0 : sum + dist(lab[p[idx - 1]], lab[p[idx]])), 0)

        if (score < bestScore) {
          bestScore = score
          bestPath = p
        }
      }

      const ordered = bestPath.map((i) => swatchesCopy[i])
      swatchesCopy.splice(0, swatchesCopy.length, ...ordered)
      break
    }
  }

  const score = Math.floor(1 / scoreSwatchPath(swatchesCopy))
  solution.querySelector('.score')!.textContent = String(score)

  swatchesCopy.forEach(([r, g, b]) => {
    const li = document.createElement('li')
    li.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
    swatchesList.appendChild(li)
  })
})
