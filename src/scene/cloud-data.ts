export interface PointCloud { positions: number[]; colors: number[] }

export function decodeCloud(buffer: ArrayBuffer): PointCloud {
  const data = new Float32Array(buffer)
  if (!data.length || data.length % 7) throw new Error('Invalid anatomy point data')
  const positions: number[] = [], colors: number[] = []
  for (let i = 0; i < data.length; i += 7) {
    positions.push(data[i]!, data[i + 1]!, data[i + 2]!)
    colors.push(data[i + 3]!, data[i + 4]!, data[i + 5]!, data[i + 6]!)
  }
  return { positions, colors }
}
