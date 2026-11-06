import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decodeCloud } from '../src/scene/cloud-data.ts'
import { hitsHeart, type HeartPose } from '../src/scene/heart-space.ts'

const bytes = readFileSync(new URL('../src/assets/anatomy/heart.bin', import.meta.url))
const { positions } = decodeCloud(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
const resting: HeartPose = { beat: 1, heartTap: 1, focus: 0, orbit: [0, 0] }
const tolerance = 7 * 3.24 / 568

test('heart clicks hit the anatomy, while nearby torso clicks miss', () => {
  assert.ok(hitsHeart(positions, [.2, .42, .35], tolerance, resting))
  assert.ok(!hitsHeart(positions, [-.45, .42, .35], tolerance, resting))
  assert.ok(!hitsHeart(positions, [.2, -.5, .35], tolerance, resting))
})

test('the clickable heart follows focus instead of keeping its old screen position', () => {
  const focused = { ...resting, focus: 1 }
  assert.ok(hitsHeart(positions, [.025, .0525, .35], tolerance, focused))
  assert.ok(!hitsHeart(positions, [.025, .0525, .35], tolerance, resting))
})

test('the clickable heart follows rotation and remains available during a beat', () => {
  const rotated: HeartPose = { ...resting, orbit: [.6, 0] }
  // The shader rotates around the body origin, moving the heart toward the right.
  const x = .2 * Math.cos(.6) + .55 * Math.sin(.6)
  assert.ok(hitsHeart(positions, [x, .42, .35], tolerance, rotated))
  assert.ok(!hitsHeart(positions, [x, .42, .35], tolerance, resting))
  assert.ok(hitsHeart(positions, [x, .42, .35], tolerance, { ...rotated, beat: .17, heartTap: .15 }))
})
