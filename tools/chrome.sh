#!/bin/bash
# Findet ein Chrome/Chromium für kopflose Renders (macOS, Linux, Playwright-Cache). Ausgabe: Pfad.
for c in "$CHROME" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" google-chrome google-chrome-stable chromium chromium-browser \
         $(ls -d ~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome ${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}/chromium-*/chrome-linux*/chrome 2>/dev/null | tail -1) \
         ${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}/chromium; do
  [ -n "$c" ] || continue
  if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then echo "$c"; exit 0; fi
done
echo "Kein Chrome/Chromium gefunden. Installieren z. B. mit: npx -y playwright install chromium" >&2
exit 1
