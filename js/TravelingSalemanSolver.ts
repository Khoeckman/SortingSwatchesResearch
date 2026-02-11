import type { RGB } from 'color-convert'

export default class TravelingSalesmanSolver {
  values: RGB[]
  N: number
  distMatrix: number[][]
  path: number[]

  constructor(values: RGB[], power = 1) {
    this.values = values.slice()
    this.N = this.values.length
    this.path = this.values.map((_, i) => i)
    this.distMatrix = this.createDistMatrix(power)
  }

  private static dist(a: RGB, b: RGB) {
    const dr = a[0] - b[0]
    const dg = a[1] - b[1]
    const db = a[2] - b[2]

    return dr * dr + dg * dg + db * db
  }

  private static async awaitWorker<T>(worker: Worker): Promise<T> {
    const result = await new Promise((resolve: (value: T) => void, reject) => {
      const handleMessage = (e: MessageEvent) => {
        worker.removeEventListener('message', handleMessage)
        resolve(e.data)
      }

      const handleError = (err: ErrorEvent) => {
        worker.removeEventListener('error', handleError)
        reject(err)
      }

      worker.addEventListener('message', handleMessage)
      worker.addEventListener('error', handleError)
    })
    worker.terminate()
    return result
  }

  createDistMatrix(power = 1) {
    const values = this.values
    const N = this.N

    const distMatrix = Array(N)
      .fill(0)
      .map(() => Array(N).fill(0))

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const d = Math.pow(TravelingSalesmanSolver.dist(values[i], values[j]), power) // 8 bit
        distMatrix[i][j] = d
        distMatrix[j][i] = d
      }
    }
    return distMatrix
  }

  totalDist() {
    const path = this.path
    const distMatrix = this.distMatrix

    let sum = 0
    let prev = path[0]

    for (let i = 1, len = path.length; i < len; i++) {
      const curr = path[i]
      sum += distMatrix[prev][curr]
      prev = curr
    }
    return sum
  }

  async nearestNeighborPath(startIndex = 0) {
    const worker = new Worker(new URL('./worker/nearestNeighborPath.ts', import.meta.url), { type: 'module' })
    worker.postMessage({ N: this.N, distMatrix: this.distMatrix, startIndex })
    this.path = await TravelingSalesmanSolver.awaitWorker(worker)
  }

  async twoOpt() {
    const worker = new Worker(new URL('./worker/twoOpt.ts', import.meta.url), { type: 'module' })
    worker.postMessage({ N: this.N, path: this.path, distMatrix: this.distMatrix })
    this.path = await TravelingSalesmanSolver.awaitWorker(worker)
  }

  getValuesFromPath(path = this.path) {
    return (this.values = (path || this.path).map((i) => this.values[i]))
  }
}
