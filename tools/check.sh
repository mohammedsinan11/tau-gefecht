#!/bin/bash
# check.sh – bauen, Syntax prüfen, Figuren-Selbsttest (Rig, Clips, STL/GLB, Shader-Fehler), kurze Spielsimulation
set -e; ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
python3 build.py
for f in 3D_Figuren.html Tau_Gefecht.html; do
  sed -n '/<script type="module">/,/<\/script>/p' "$f" | sed '1d;$d' | sed 's/^import .*$//' > /tmp/_chk.js && node --check /tmp/_chk.js && echo "Syntax ok: $f"
done
F="file://$ROOT/3D_Figuren.html"; F="${F// /%20}"
echo "Figuren-Selbsttest:"; node tools/cdp-eval.mjs "$F?selftest" "document.getElementById('selftest')?.textContent ?? null" 300
echo "Kurze Simulation:"; tools/sim.sh 30
