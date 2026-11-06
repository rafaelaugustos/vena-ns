"""Export the attributed BodyParts3D heart GLB as luminous surface points."""
from pathlib import Path
import bisect
import json
import math
import random
import struct
import sys

root = Path(__file__).resolve().parent.parent
data = Path(sys.argv[1]).read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
gltf = json.loads(data[20:20+length])
buffer = data[28+length:]

def accessor(index):
    a = gltf['accessors'][index]
    view = gltf['bufferViews'][a['bufferView']]
    count = {'VEC3': 3, 'SCALAR': 1}[a['type']]
    fmt = '<' + {5126: 'f', 5125: 'I', 5123: 'H'}[a['componentType']] * count
    stride = view.get('byteStride', struct.calcsize(fmt))
    offset = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from(fmt, buffer, offset+i*stride) for i in range(a['count'])]

triangles, areas, total = [], [], 0
for mesh in gltf['meshes']:
    if mesh['name'] in ('left-ventricle', 'right-ventricle'):
        continue  # Interior cavity surfaces are not part of the exterior silhouette.
    for primitive in mesh['primitives']:
        positions = accessor(primitive['attributes']['POSITION'])
        normals = accessor(primitive['attributes']['NORMAL'])
        indices = [x[0] for x in accessor(primitive['indices'])]
        for i in range(0, len(indices), 3):
            p = [positions[j] for j in indices[i:i+3]]
            n = [normals[j] for j in indices[i:i+3]]
            a, b = [[p[j][k]-p[0][k] for k in range(3)] for j in (1, 2)]
            cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
            area = math.sqrt(sum(v*v for v in cross)) / 2
            total += area
            triangles.append((p, n))
            areas.append(total)

rng = random.Random(27)
points = []
for _ in range(40000):
    p, n = triangles[bisect.bisect(areas, rng.random()*total)]
    u, v = math.sqrt(rng.random()), rng.random()
    w = (1-u, u*(1-v), u*v)
    position = [sum(p[j][i]*w[j] for j in range(3)) for i in range(3)]
    normal = [sum(n[j][i]*w[j] for j in range(3)) for i in range(3)]
    light = .4 + max(0, normal[2])*.6
    intensity = .65 + rng.random()*.35
    points.append((position[0]*.26+.2, position[1]*.26+.42, position[2]*.26+.55,
                   intensity, .012+light*.045, .025+light*.07, .25+light*.65))

out = root / 'src/assets/anatomy/heart.bin'
out.write_bytes(b''.join(struct.pack('<7f', *p) for p in points))
print(f'{len(points):,} points → {out.relative_to(root)}')
