export const HEART_CENTER = [.2, .42, .55] as const

export interface HeartPose {
  beat: number
  heartTap: number
  focus: number
  orbit: readonly [number, number]
}

/** Matches the heart's shader pose so taps still land after focusing or rotating. */
export function heartProjection(pose: HeartPose) {
  const bump = (phase: number, center: number, width: number) => Math.exp(-(((phase - center) / width) ** 2))
  const beat = bump(pose.beat, .17, .095) + .38 * bump(pose.beat, .39, .085)
  const tap = bump(pose.heartTap, .15, .095) + .28 * bump(pose.heartTap, .38, .09)
  const contraction = Math.min(1.5, beat + tap * 1.1)
  const [cx, cy, cz] = HEART_CENTER
  const cosX = Math.cos(pose.orbit[1]), sinX = Math.sin(pose.orbit[1])
  const cosY = Math.cos(pose.orbit[0]), sinY = Math.sin(pose.orbit[0])
  const zoom = 1 + pose.focus * 1.5
  return (x: number, y: number, z: number): readonly [number, number] => {
    const px = cx + (x - cx) * (1 + contraction * .14)
    const py = cy + (y - cy) * (1 + contraction * .075)
    const pz = cz + (z - cz) * (1 + contraction * .1)
    const ry = py * cosX - pz * sinX, rz = py * sinX + pz * cosX
    return [(px * cosY + rz * sinY - cx * pose.focus * .95) * zoom, (ry - cy * pose.focus * .95) * zoom]
  }
}

export function hitsHeart(positions: readonly number[], point: readonly [number, number, number], radius: number, pose: HeartPose) {
  const project = heartProjection(pose), radiusSquared = radius * radius
  // One in eight surface points is enough for a small screen-space hit tolerance.
  for (let i = 0; i < positions.length; i += 24) {
    const [x, y] = project(positions[i]!, positions[i + 1]!, positions[i + 2]!)
    if ((x - point[0]) ** 2 + (y - point[1]) ** 2 <= radiusSquared) return true
  }
  return false
}
