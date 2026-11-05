export interface PointCloud { positions: number[]; colors: number[] }
export interface Anatomy { body: PointCloud; heart: PointCloud }

function random(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed)
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n
    return ((n ^ n >>> 14) >>> 0) / 4294967296
  }
}

const profile = [
  [-1.6, .63, .29], [-1, .66, .33], [-.35, .72, .39], [.3, .88, .43],
  [.8, .98, .36], [1.05, .88, .28], [1.24, .55, .24], [1.39, .27, .23], [2.1, .245, .22],
] as const

function dimensions(y: number): [number, number] {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]!, b = profile[i]!
    if (y <= b[0]) {
      let t = (y - a[0]) / (b[0] - a[0])
      t = t * t * (3 - 2 * t)
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    }
  }
  return [.245, .22]
}

export function createAnatomy(seed = 19): Anatomy {
  const next = random(seed)
  const body: PointCloud = { positions: [], colors: [] }
  const heart: PointCloud = { positions: [], colors: [] }
  const put = (cloud: PointCloud, x: number, y: number, z: number, r: number, g: number, b: number, a: number) => {
    cloud.positions.push(x, y, z)
    cloud.colors.push(r, g, b, a)
  }

  for (let i = 0; i < 17800; i++) {
    const y = -1.6 + next() * 3.7
    const angle = next() * Math.PI * 2
    const [rx, rz] = dimensions(y)
    const x = rx * Math.cos(angle)
    let z = rz * Math.sin(angle)
    // Sternum, collarbones and the rib cage are part of the surface, not an outline.
    if (z > 0) {
      z += .075 * Math.exp(-(((Math.abs(x) - .38) / .27) ** 2) - ((y - .35) / .44) ** 2)
      z -= .055 * Math.exp(-((x / .09) ** 2)) * Math.exp(-(((y - .3) / .9) ** 2))
      z += .025 * Math.cos(y * 24) * Math.exp(-(((y + .25) / .55) ** 2))
    }
    const edge = Math.abs(Math.cos(angle)) ** 5
    const collar = Math.exp(-(((y - (1.05 - .18 * Math.abs(x))) / .035) ** 2))
    const light = .23 + edge * .48 + collar * .29 + next() * .21
    const front = z > 0 ? 1 : .33
    put(body, x, y, z, light * .82, light * .84, light, (.2 + next() * .53) * front)
  }
  // Upper arms hang naturally away from the tapered torso.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3200; i++) {
      const t = next(), angle = next() * Math.PI * 2
      const y = .82 - t * 2.4
      const radius = .19 + .075 * Math.sin(t * Math.PI)
      const x = side * (1.03 + t * .17) + radius * Math.cos(angle)
      const z = -.04 + radius * Math.sin(angle)
      const light = .22 + .35 * Math.abs(Math.cos(angle)) ** 4 + next() * .2
      put(body, x, y, z, light * .8, light * .84, light, .22 + next() * .35)
    }
  }
  // An asymmetric ventricular volume, leaning toward the anatomical left.
  for (let i = 0; i < 6800; i++) {
    const v = next() * 2 - 1, angle = next() * Math.PI * 2
    const ring = Math.sqrt(1 - v * v)
    const taper = .63 + .37 * ((v + 1) / 2)
    let x = .43 * ring * Math.cos(angle) * taper
    let y = v * .5
    let z = .3 * ring * Math.sin(angle)
    const folds = 1 + .06 * Math.sin(angle * 3 + v * 8)
    x *= folds; z *= folds
    // A shallow diagonal groove separates the two ventricular masses.
    z -= .035 * Math.exp(-(((x + y * .23) / .03) ** 2)) * Math.max(0, Math.sin(angle))
    const tilt = -.28
    const px = x * Math.cos(tilt) - y * Math.sin(tilt) + .2
    const py = x * Math.sin(tilt) + y * Math.cos(tilt) + .04
    const bright = .65 + next() * .35
    put(heart, px, py, z + .48, bright, .055 + next() * .16, .16 + next() * .2, .55 + next() * .45)
  }
  // Three vessel openings give the silhouette its anatomical character.
  for (let vessel = 0; vessel < 3; vessel++) {
    for (let i = 0; i < 650; i++) {
      const t = next(), a = next() * Math.PI * 2
      const radius = vessel === 1 ? .085 : .055
      const x = .08 + vessel * .115 + (vessel === 1 ? -.13 * Math.sin(t * Math.PI) : .07 * t)
      const y = .4 + t * (vessel === 1 ? .34 : .23)
      const z = .47 + (vessel === 1 ? .03 : -.04)
      put(heart, x + Math.cos(a) * radius, y, z + Math.sin(a) * radius, .85 + next() * .15, .12, .22, .65 + next() * .35)
    }
  }
  return { body, heart }
}
