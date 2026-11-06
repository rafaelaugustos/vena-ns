# Anatomy assets

The torso is sampled from MakeHuman's `hm08` base mesh, released under CC0 in September 2020. Only the body surface is used; helper geometry is excluded. The arms are lowered and the mesh is cropped before sampling.

- Source: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
- License: [MAKEHUMAN-LICENSE.md](MAKEHUMAN-LICENSE.md)
- Export: `python3 scripts/sample-torso.py path/to/base.obj`

The torso has 160,000 surface points. Its shading comes from the mesh normals; a fixed random seed keeps the export reproducible.

The heart uses BodyParts3D anatomy prepared as a GLB by OrganUI. The exporter samples 40,000 points from the external surfaces, excludes the ventricular cavities, scales and positions the result inside the torso, and replaces the original colors with red lighting values. The app adds animated deformation and lighting.

- Pinned input: [OrganUI heart.glb](https://github.com/organui/heart-3d/blob/c72ce6654ff8e282942f97750d3104f55ef4fc3d/public/models/heart.glb)
- Attribution and license: [HEART-ATTRIBUTION.md](HEART-ATTRIBUTION.md)
- Export: `python3 scripts/sample-heart.py path/to/heart.glb`

Both scripts use Python's standard library. Their outputs are committed under `src/assets/anatomy/`, so running the app needs no downloads or export tools. Each point contains seven little-endian Float32 values: XYZ and RGBA, with no file header. `npm test` validates the bundled data.
