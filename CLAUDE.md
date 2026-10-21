# Tau-Gefecht & 3D-Figuren

Prozedural gebaute, geriggte 3D-Figuren (Warhammer-40k-T'au-Miniaturen des Besitzers + eine geflügelte Katze) und ein
1-gegen-1-Tabletop-Browserspiel, das sie nutzt. Alles three.js r0.160 per CDN (jsdelivr), keine Build-Abhängigkeiten.
UI und Texte sind **Deutsch**. Der Besitzer will vor allem ein **hochwertiges, spielenswertes Spiel**.

## Struktur
- `src/core.js` Bau-Helfer (B, C, S, prism, side, limb, **loft/shell/loftRing/loftLine/onSurf/basis** für Profilformen), Material mit Schmutz-Shader `grime()`
- `src/fx.js` Nachbearbeitung (GTAO + Kantenlichter/Wash), `src/rig.js` Rig mit IK, gebackene Clips „Gehen“/„Schiessen“
- `src/models/*.js` Figuren: crisisRed/crisisBlue (xv8.js), broadside, stealth, firewarrior, pathfinder (infantry.js), cat (katze.js)
- `src/app.js` + `src/page.html` → **3D_Figuren.html** (Figurenbetrachter, STL/GLB-Export)
- `src/game.js` + `src/game.html` → **Tau_Gefecht.html** (das Spiel)
- `build.py` fügt alles zu den zwei HTML-Dateien zusammen (gebaute Dateien sind mit eingecheckt, damit sie per Doppelklick laufen)
- Veröffentlicht über **GitHub Pages** (Branch `main`, Ordner `/`): `index.html` leitet auf `Tau_Gefecht.html` weiter.
- `docs/formnotizen.md` Formmerkmale der Originalmodelle

## Arbeiten
- Nach jeder Änderung in `src/`: `python3 build.py`
- `tools/check.sh` – bauen, Syntax, Figuren-Selbsttest (Rig/Clips/Export/Shader-Fehler), kurze Simulation
- `tools/sim.sh 200 [params]` – 200 Partien KI gegen KI ohne Animation, JSON-Auswertung (Siegquoten je Seite/Einheit,
  Auslöschungen, Punkteabstand). `tools/sim.sh 150 "greedy=1&diff=schwer"` misst die KI gegen ein simples Referenz-Skript.
- `tools/render.sh <tag> <id>[:Gehen|Schiessen] …` – 4-Ansichten-Renders nach `tools/out/` (zum Ansehen mit Read)
- Chrome/Chromium wird von `tools/chrome.sh` gesucht (auch `/opt/pw-browsers`); auf Linux ggf. `npx -y playwright install chromium`.
- Ohne direkten CDN-Zugriff (Proxy): `npm pack three@0.160.0` nach `tools/.cache/three` entpacken – `tools/cdp-eval.mjs` bedient
  three.js-Anfragen dann lokal. Renders/Screenshots laufen über `cdp-eval.mjs` (`SHOT=datei.png SIZE=1600,1200`).
- KI-Vergleich: `tools/sim.sh 300 "ai=schwer,greedy&mirror=1"` (KI-Stufe je Seite, `mirror` = gleiche Armee für beide;
  immer auch umgekehrt `ai=greedy,schwer` laufen lassen). Gewichte der Schwer-KI per `aiw=thr:.6,dep:.1` (siehe `AIW`).
  Rauschen bei 600 Partien ≈ ±4 %, also erst ab ~1200 Partien Schlüsse ziehen.
- **Online-Spiel** (`src/game.js`, Abschnitt „Online-Spiel“): beide Geräte rechnen dieselbe Partie, übertragen werden nur Aktionen
  (`act(name, …)` → `ACTIONS`), Würfel über gemeinsamen Startwert (`RNG`/`seeded`; Optik-Zufall bleibt `Math.random`!),
  Prüfsumme nach jeder Aktivierung. Neue Spieleraktionen immer über `act()` leiten. Verbindung: PeerJS (WebRTC) per CDN,
  Test ohne Netz: `node tools/net-test.mjs 3` (zwei Fenster, BroadcastChannel `?net=bc`, Zufalls-Bots, prüft Synchronität).
- Im Spiel gibt es Testhilfen auf `window`: `__G` (Zustand), `__UT` (Profile), `__sim(n, opts)`, `__summarize`, `__start(mode, a, b)`,
  `__cam.project(x,y,z)`, `__finish()`. Telefon-Screenshots: `MOBILE=390x844 SHOT=… node tools/cdp-eval.mjs …`. URL-Parameter: `?sim=N`, `?auto=4` (Zuschauen), `?fx=0`, `?cam=x,y,z,tx,ty,tz`.

## Bewährter Ablauf (Qualitätsschleife)
1. Änderung bauen → `tools/check.sh`
2. Figuren: Renders erzeugen und von einem **unabhängigen Gutachter-Subagenten** (Noten Glaubwürdigkeit/Ähnlichkeit/Silhouette 1–10,
   konkrete Verbesserungen) bewerten lassen; ehrlich berichten, auch Rückschritte.
3. Spiel: **Balance per Simulation** (Ziel: alle Einheiten 45–55 % Siegquote, Seiten ausgeglichen, Auslöschungen ≈ 30–35 %),
   dazu ein **Tester-Subagent**, der spielt und Bugs/Verbesserungen liefert.

## Stand (Okt. 2026)
- Balance ausgeglichen (zuletzt 800 Partien: Einheiten 44,5–59 %, Crisis Schild etwas stark, Broadside etwas schwach; Auslöschungen 40 %). Befehlspunkte/Taktiken, Abwehrfeuer, 3 Missionen, 3 KI-Stufen,
  3 Geländeaufstellungen (Ruinenfeld, Depot, Trümmerstadt, je auch gespiegelt), Überspringen per Leertaste, Online-Mehrspieler (Link/Code, PeerJS), Initiative, Revanche, Endstatistik, Porträts.
- Tester-Noten zuletzt: Einstieg 8, Bedienung 7, Taktik 7, Tempo 6, KI 5, Balance 7, Optik 9, Wiederspielwert 7, Stabilität 8, Gesamt 7,5.
- Gutachter-Noten Figuren: Crisis rot 8/8/8, Stealth 8/7/8, Fire Warrior 8/7/7, Katze 6/6/7, Pathfinder 7/7/7, Crisis blau 7/7/7, Broadside 7/7/7.
  Nahansichten für Details: `FOCUS=x,y,z,r tools/render.sh …`.

## Offene Aufgaben (priorisiert)
1. **KI weiter stärken**: „Schwer“ hat jetzt Vorausschau (eigener Zug → schlimmste Gegenantwort → Stellungsbewertung mit
   Material, Siegpunkten, Zielkontrolle, Tempo-Bedrohung), Abschusswahrscheinlichkeit aus der Schadensverteilung, Fokusfeuer-Bonus
   und Aufstellung außer Sicht: ≈ 59 % gegen das Referenz-Skript (1200 Partien, vorher 54 %), ≈ 58 % gegen „Normal“.
   „Normal“ ≈ Referenz-Skript (50 %). Ideen: dritte Ebene (eigene Folgeaktivierung), Missionsziele zum Rundenende gezielt
   sichern, Abwehrfeuer einplanen, Sprint in die Vorausschau aufnehmen.
2. Spieltempo: gestrafft + Überspringen (Leertaste/Klick auf Würfel); von einem Tester bestätigen lassen.
3. Mehr Abwechslung: evtl. weitere Missionen/Taktiken; Auslöschungsquote (40 %) wieder Richtung 30–35 % bringen.
4. Figuren (Gutachter, Okt. 2026): Pathfinder – Übergang Kuppel→Gesichtskeil seitlich schließen (Wangenfase);
   Katze – dunkler Strich am Ohransatz beim Fauchen (Durchdringung Ohr/Kopf), Ohren ~20 % niedriger mit runder Spitze;
   Crisis blau – Kniekolben dicker mit Metallring, Schienbeinblock oben schmaler; Stealth – Schnabel-Oberseite mit Fase/Mittelkante,
   Kreisembleme auf den Schulterscheiben.
5. Mobil: kompakte Oberfläche (≤700 px breit oder ≤500 px hoch: ☰-Menü, Aktionsleiste unten, kompakte Karte), Touch mit
   Vorschau-Tipp + Bestätigungs-Tipp, Grafik „schnell“ als Vorgabe. Offen: Test auf echten Geräten (iOS Safari/Android Chrome),
   evtl. gedrehte Hochformat-Ansicht (Tisch längs), Aufstellung per Touch mit Vorschau.
6. Online: echten Test über zwei Netze (PeerJS-Server/STUN; ohne TURN scheitern manche Mobil-/Firmennetze), evtl. Wiederverbinden.
