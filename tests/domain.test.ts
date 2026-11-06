import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseSaved, pulseAt, sessionFor } from '../src/domain/sessions.ts'
import { decodeCloud } from '../src/scene/cloud-data.ts'

test('saved samples recover from malformed data and unknown IDs', () => {
  assert.deepEqual(parseSaved('not-json'), [])
  assert.deepEqual(parseSaved('{}'), [])
  assert.deepEqual(parseSaved('["rest","rest","unknown","recover"]'), ['rest', 'recover'])
  assert.equal(sessionFor('unknown').id, 'rest')
})

test('the pulse is periodic and remains bounded across the strip', () => {
  for (let i = -100; i < 100; i++) {
    const value = pulseAt(i / 41)
    assert.ok(Number.isFinite(value) && value > -.6 && value < 1.1)
    assert.ok(Math.abs(value - pulseAt(i / 41 + 1)) < 1e-10)
  }
})

test('bundled anatomy decodes into complete, finite surface points', () => {
  for (const [name, expectedCount] of [['torso', 160000], ['heart', 40000]] as const) {
    const bytes = readFileSync(new URL(`../src/assets/anatomy/${name}.bin`, import.meta.url))
    const cloud = decodeCloud(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    const count = cloud.positions.length / 3
    assert.equal(count, expectedCount)
    assert.equal(cloud.colors.length, count * 4)
    assert.ok(cloud.positions.every(value => Number.isFinite(value) && Math.abs(value) < 3))
    assert.ok(cloud.colors.every(value => Number.isFinite(value) && value >= 0 && value <= 1.3))
  }
})

test('truncated and empty anatomy data fails before creating native geometry', () => {
  assert.throws(() => decodeCloud(new ArrayBuffer(0)), /Invalid anatomy/)
  assert.throws(() => decodeCloud(new Float32Array([1, 2, 3, 1, 0, 0]).buffer), /Invalid anatomy/)
  assert.throws(() => decodeCloud(new ArrayBuffer(27)))
})
