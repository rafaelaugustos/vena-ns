"""Sample the CC0 MakeHuman body mesh into a compact, deterministic point cloud.

Usage: python3 scripts/sample-torso.py path/to/base.obj
The source mesh and its license are documented in resources/anatomy/README.md.
"""
from pathlib import Path
import bisect
import math
import random
import struct
import sys

root = Path(__file__).resolve().parent.parent
vertices, faces = [], []
group = ''
for line in Path(sys.argv[1]).read_text().splitlines():
    fields = line.split()
    if not fields:
        continue
    if fields[0] == 'v':
        x, y, z = map(float, fields[1:4])
        # Lower the A-pose arms, leaving the chest and clavicles intact.
        weight = min(1, max(0, (abs(x) - 1.65) / .65))
        side = 1 if x >= 0 else -1
        dx, dy = abs(x) - 1.95, y - 4.6
        angle = -.29 * weight
        x = side * (1.95 + dx * math.cos(angle) - dy * math.sin(angle))
        y = 4.6 + dx * math.sin(angle) + dy * math.cos(angle)
        vertices.append((x, y, z))
    elif fields[0] == 'g':
        group = fields[1]
    elif fields[0] == 'f' and group == 'body':
        indices = [int(p.split('/')[0]) - 1 for p in fields[1:]]
        for i in range(1, len(indices) - 1):
            faces.append((indices[0], indices[i], indices[i + 1]))

def sub(a, b):
    return tuple(a[i] - b[i] for i in range(3))

def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])

normals = [[0., 0., 0.] for _ in vertices]
areas, triangles = [], []
total = 0
for face in faces:
    a, b, c = [vertices[i] for i in face]
    n = cross(sub(b, a), sub(c, a))
    for index in face:
        for axis in range(3):
            normals[index][axis] += n[axis]
    if max(a[1], b[1], c[1]) < -.4 or min(a[1], b[1], c[1]) > 6.8:
        continue
    area = math.sqrt(sum(x*x for x in n)) / 2
    if area > 0:
        total += area
        areas.append(total)
        triangles.append(face)
for i, n in enumerate(normals):
    length = math.sqrt(sum(x*x for x in n)) or 1
    normals[i] = [x / length for x in n]

rng = random.Random(19)
points = []
while len(points) < 61000:
    tri = triangles[bisect.bisect(areas, rng.random() * total)]
    u, v = math.sqrt(rng.random()), rng.random()
    weights = (1-u, u*(1-v), u*v)
    p = [sum(vertices[tri[j]][i] * weights[j] for j in range(3)) for i in range(3)]
    n = [sum(normals[tri[j]][i] * weights[j] for j in range(3)) for i in range(3)]
    if p[1] < -.4 or p[1] > 6.8:
        continue
    front = max(0, n[2])
    rim = (1 - abs(n[2])) ** 3
    light = .16 + front * .34 + rim * .62 + max(0, n[0]*-.35+n[1]*.7+n[2]*.4) * .22
    if n[2] < -.1:
        light *= .11
    light *= .65 + rng.random() * .55
    fade = min(1, max(0, (p[1]+.4)/.7))
    # Front-facing points retain the actual chest, clavicle and shoulder relief.
    points.append((p[0]*.48, (p[1]-3.0)*.48, (p[2]-.18)*.48,
                   min(1, light*.86), min(1, light*.88), min(1, light), fade))

destination = root / 'src/assets/anatomy/torso.bin'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(b''.join(struct.pack('<7f', *p) for p in points))
print(f'{len(points):,} points → {destination.relative_to(root)} ({destination.stat().st_size:,} bytes)')
