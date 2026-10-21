#!/bin/bash
# render.sh <tag> <id>[:Gehen|Schiessen] …   (FOCUS=x,y,z,r für eine Nahansicht, z. B. FOCUS=0,25,0,5)  → tools/out/<tag>_<id>[_anim].png (4 Ansichten bzw. 4 Animationszeitpunkte)
# ids: crisis_rot crisis_blau broadside stealth firewarrior pathfinder katze
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/tools/out"; mkdir -p "$OUT"
F="file://$ROOT/3D_Figuren.html"; F="${F// /%20}"
TAG=$1; shift
for spec in "$@"; do
  id=${spec%%:*}; anim=""; [[ "$spec" == *:* ]] && anim=${spec#*:}
  name="$OUT/${TAG}_${id}${anim:+_$anim}.png"; rm -f "$name"
  SHOT="$name" SIZE=1600,1200 node "$ROOT/tools/cdp-eval.mjs" "$F?sheet=$id${anim:+&anim=$anim}${FOCUS:+&focus=$FOCUS}" \
    "document.querySelectorAll('.vlabel').length ? new Promise(r => setTimeout(() => r(1), 1500)) : null" 120 >/dev/null
  [ -f "$name" ] && echo "ok    $name" || echo "FEHLT $name"
done
