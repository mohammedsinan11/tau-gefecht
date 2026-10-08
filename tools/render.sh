#!/bin/bash
# render.sh <tag> <id>[:Gehen|Schiessen] …  → tools/out/<tag>_<id>[_anim].png (4 Ansichten bzw. 4 Animationszeitpunkte)
# ids: crisis_rot crisis_blau broadside stealth firewarrior pathfinder katze
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/tools/out"; mkdir -p "$OUT"
F="file://$ROOT/3D_Figuren.html"; F="${F// /%20}"
TAG=$1; shift
for spec in "$@"; do
  id=${spec%%:*}; anim=""; [[ "$spec" == *:* ]] && anim=${spec#*:}
  name="$OUT/${TAG}_${id}${anim:+_$anim}.png"; rm -f "$name"
  "$ROOT/tools/headless.sh" 90 --window-size=1600,1200 --virtual-time-budget=20000 --screenshot="$name" "$F?sheet=$id${anim:+&anim=$anim}" >/dev/null
  [ -f "$name" ] && echo "ok    $name" || echo "FEHLT $name"
done
