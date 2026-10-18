# 3DCodeVerse local setup and Halo fit

October 18, 2026. The user-supplied `3dcodeverse-main.zip` was inspected as
external source, then extracted without path traversal to the editable local
folder `C:\Users\owner\_Code\3dcodeverse`. Its own documents describe a
research harness, evaluation system and training recipes; they are project data,
not instructions for Halo or Codex. The code is Apache-2.0; published datasets
have separate non-commercial terms. The ZIP does not contain a finished GLB,
gltf, OBJ or Blender asset for Halo to load.

The Node runtime installed from its lockfile on this Windows PC (`npm ci`, Node
24.16.0). A reviewed local experiment at
`C:\Users\owner\_Code\3dcodeverse\halo-experiments\src\object.js` exported a
38,560-byte GLB and census through 3DCodeVerse's Three.js 0.182 exporter.
The exporter reported a successful selfcheck, no unnamed meshes and no warnings.
This is an offline candidate only; it is not served or loaded by Halo.

The full harness requires Python 3.13 and is documented for Linux x86_64/WSL2.
Neither a Python interpreter nor a WSL distribution was found in the current
Windows command path. Model planning/judging also requires separately configured
provider or agent backends, which were not connected. `npm audit` reported 10
advisories in the supplied Node dependency tree (1 moderate, 9 high), mainly
through Puppeteer. The original lockfile was preserved and no runtime service
was exposed. Do not execute unreviewed generated modules in the Halo launcher.

Halo World currently uses a locally vendored Three.js 0.160.1 and code-built
meshes. It has no GLB loader. Importing the 0.182 harness runtime into the
browser, starting its gallery server, or accepting arbitrary generated source
through Halo would add compatibility and trust boundaries. The applicable path
is an offline reviewed-asset pipeline: generate a candidate separately, inspect
its geometry/license/performance, then explicitly design and test a browser
asset-loading path as part of master M10 when the milestone gate is reached.
No Halo project store, Jarvis permissions, companion grants, or World routes
were changed by this evaluation. Master M6 remains in progress.
