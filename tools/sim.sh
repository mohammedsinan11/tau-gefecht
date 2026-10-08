#!/bin/bash
# sim.sh [n=200] [weitere URL-Parameter, z. B. "greedy=1&diff=schwer" oder "mission=kopfgeld"]
# Spielt n Partien KI gegen KI ohne Animation und gibt die Auswertung als JSON aus
# (sides = Siege Seite A / Seite B / Unentschieden, wipes = Auslöschungen, margin = Ø Punkteabstand,
#  units = je Einheit Punkte, Siegquote, Ø Schaden, Überlebensrate).
# greedy=1: Seite B spielt ein simples Referenz-Skript (nur zu Zielen laufen und schießen) – Maß für die KI-Stärke von Seite A.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; N=${1:-200}; EXTRA=${2:+&$2}
F="file://$ROOT/Tau_Gefecht.html"; F="${F// /%20}"
node "$ROOT/tools/cdp-eval.mjs" "$F?sim=$N&fx=0$EXTRA" "document.getElementById('simresult') ? JSON.parse(document.getElementById('simresult').textContent) : null" 900
