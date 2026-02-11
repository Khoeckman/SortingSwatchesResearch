import convert from 'color-convert'
import TravelingSalesmanSolver from './TravelingSalemanSolver'
import { scoreSwatchPath } from './score'
import type { RGB } from 'color-convert'

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z * 6 + 3))

export const generateRandomRGB = (length: number): RGB[] =>
  new Array(length)
    .fill(0)
    .map(() => [~~(sigmoid(Math.random()) * 256), ~~(sigmoid(Math.random()) * 256), ~~(sigmoid(Math.random()) * 256)])

function populateSolution(solution: Element, swatches: RGB[]) {
  const score = Math.floor(1 / scoreSwatchPath(swatches, 3))
  solution.querySelector('.score')!.textContent = String(score)

  const swatchesList = solution.querySelector('ol')
  if (!swatchesList) return

  swatchesList.innerHTML = ''

  swatches.forEach(([r, g, b]) => {
    const li = document.createElement('li')
    li.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
    swatchesList.appendChild(li)
  })
}

export function populateSolutions(_swatches: RGB[]) {
  const solutions = [...document.querySelector('.solutions')!.children]
  const N = _swatches.length

  solutions.forEach(async (solution, i) => {
    if (solution.classList.contains('not-solution')) return

    let swatches = structuredClone(_swatches)

    switch (i) {
      case 0:
        break // Settings form
      case 1:
        break // Generated

      case 2:
        // Sort by relative hue
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const hueA = Math.atan2(Math.sqrt(3) * (ag - ab), 2 * ar - ag - ab)
          const hueB = Math.atan2(Math.sqrt(3) * (bg - bb), 2 * br - bg - bb)
          return hueA - hueB
        })
        break
      case 3:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [, satA] = convert.rgb.hsl(ar, ag, ab)
          const [, satB] = convert.rgb.hsl(br, bg, bb)
          return satA - satB
        })
        break
      case 4:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [, , lightA] = convert.rgb.hsl(ar, ag, ab)
          const [, , lightB] = convert.rgb.hsl(br, bg, bb)
          return lightA - lightB
        })
        break
      case 5:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [, , valA] = convert.rgb.hsv(ar, ag, ab)
          const [, , valB] = convert.rgb.hsv(br, bg, bb)
          return valA - valB
        })
        break

      case 6:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [hueA, satA] = convert.rgb.hsl(ar, ag, ab)
          const [hueB, satB] = convert.rgb.hsl(br, bg, bb)

          const groupA = +(satA > 50)
          const groupB = +(satB > 50)

          return groupA - groupB || hueA - hueB
        })
        break
      case 7:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [hueA, , lightA] = convert.rgb.hsl(ar, ag, ab)
          const [hueB, , lightB] = convert.rgb.hsl(br, bg, bb)

          const groupA = +(lightA > 50)
          const groupB = +(lightB > 50)

          return groupA - groupB || hueA - hueB
        })
        break
      case 8:
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const [hueA, , valA] = convert.rgb.hsv(ar, ag, ab)
          const [hueB, , valB] = convert.rgb.hsv(br, bg, bb)

          const groupA = +(valA > 50)
          const groupB = +(valB > 50)

          return groupA - groupB || hueA - hueB
        })
        break

      case 9: {
        swatches.sort(([ar, ag, ab], [br, bg, bb]) => {
          const hueA = Math.atan2(Math.sqrt(3) * (ag - ab), 2 * ar - ag - ab)
          const hueB = Math.atan2(Math.sqrt(3) * (bg - bb), 2 * br - bg - bb)
          return hueA - hueB
        })

        const tsp = new TravelingSalesmanSolver(swatches)
        await tsp.twoOpt()
        swatches = tsp.getValuesFromPath()
        break
      }
      case 10: {
        if (N <= 1) break

        const tsp = new TravelingSalesmanSolver(swatches, 3)
        await tsp.nearestNeighborPath()
        swatches = tsp.getValuesFromPath()
        break
      }
      case 11: {
        if (N <= 1) break

        const tsp = new TravelingSalesmanSolver(swatches, 3)
        await tsp.nearestNeighborPath()
        await tsp.twoOpt()
        swatches = tsp.getValuesFromPath()
        break
      }
      case 12: {
        if (N <= 1) break

        const tsp = new TravelingSalesmanSolver(swatches, 3)

        let bestPath: number[] = []
        let bestScore = Infinity

        // Start from every swatch (max 120)
        for (let start = 0; start < Math.min(N, 120); start++) {
          await tsp.nearestNeighborPath(start)

          const score = tsp.totalDist()

          if (score < bestScore) {
            bestScore = score
            bestPath = tsp.path
          }
        }

        swatches = tsp.getValuesFromPath(bestPath)
        break
      }
      case 13: {
        if (N <= 1) break

        const tsp = new TravelingSalesmanSolver(swatches, 3)

        let bestPath: number[] = []
        let bestScore = Infinity

        // Start from every swatch (max 120)
        for (let start = 0; start < Math.min(N, 120); start++) {
          await tsp.nearestNeighborPath(start)
          await tsp.twoOpt()

          const score = tsp.totalDist()

          if (score < bestScore) {
            bestScore = score
            bestPath = tsp.path
          }
        }
        swatches = tsp.getValuesFromPath(bestPath)
        break
      }
    }

    populateSolution(solution, swatches)
  })
}
