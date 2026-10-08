#!/usr/bin/env python3
"""Baut die beiden Seiten aus src/ zusammen (je eine Datei, per Doppelklick zu öffnen):
3D_Figuren.html (Figurenbetrachter) und Tau_Gefecht.html (das Spiel)."""
from pathlib import Path

ROOT = Path(__file__).parent
COMMON = ["core.js", "fx.js", "rig.js", "models/xv8.js", "models/katze.js", "models/broadside.js",
          "models/stealth.js", "models/infantry.js", "models/pathfinder.js", "models/firewarrior.js"]
for page, main, out in [("page.html", "app.js", "3D_Figuren.html"), ("game.html", "game.js", "Tau_Gefecht.html")]:
    js = "".join((ROOT / "src" / f).read_text() for f in COMMON + [main])
    html = (ROOT / "src" / page).read_text().replace("/*@@JS@@*/\n", js)
    (ROOT / out).write_text(html)
    print(out, "gebaut,", len(html.splitlines()), "Zeilen")
