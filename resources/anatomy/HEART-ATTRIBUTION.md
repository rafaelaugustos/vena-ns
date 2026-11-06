# Anatomy model attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- Source: [official BodyParts3D archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html).
- Version: BodyParts3D 4.0 (released 2013-05-16), IS-A OBJ archive, polygon reduction rate 99%.
- OrganUI source retrieval date: 2026-09-22. Vena retrieved the prepared GLB on 2026-11-05.
- Model/data license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as specified by the [archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27.
- Prepared model and source mapping: [OrganUI at c72ce665](https://github.com/organui/heart-3d/tree/c72ce6654ff8e282942f97750d3104f55ef4fc3d).
- Original work: Mitsuhashi et al., “BodyParts3D: 3D structure database for anatomical concepts”, Nucleic Acids Research 37 (2009), D782–D785. [DOI](https://doi.org/10.1093/nar/gkn613).

Changes by OrganUI: selected meshes, grouped meshes by source concept, triangulated faces, recentered and uniformly scaled coordinates, changed axes from Z-up to Y-up, recomputed smooth normals, assigned illustrative colors, and converted OBJ to GLB. No further decimation or invented anatomy. The two ventricular walls remain one mesh; separate cavity surfaces represent interior spaces, not muscle tissue.

Changes by Vena: sampled 40,000 points from the external surfaces, omitted the two cavity meshes, scaled and translated the coordinates, assigned red RGBA values, and exported a binary point cloud. Runtime shaders add illustrative pulse, pointer displacement and lighting. These effects are artistic, not a physiological simulation.

Legacy OBJ headers cite CC BY-SA 2.1 Japan and link to the same official archive license URL. This distribution relies on the archive's current CC BY 4.0 grant. OrganUI documents the discrepancy in its [model provenance](https://github.com/organui/heart-3d/blob/c72ce6654ff8e282942f97750d3104f55ef4fc3d/docs/MODEL_PROVENANCE.md).

Application code licensing does not relicense this model or its derived screenshots. Preserve this attribution, the model license link, and the modification notice when redistributing the model or images of it. DBCLS does not endorse this demonstration. The source release notes caution that the database can contain missing or incorrect anatomical representations.
