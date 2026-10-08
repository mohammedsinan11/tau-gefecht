#!/bin/bash
# headless.sh <timeout_s> <extra chrome args…> <url>  – startet Chrome kopflos mit eigenem Profil und Watchdog
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; CH="$("$ROOT/tools/chrome.sh")" || exit 1
T=$1; shift
PROF=$(mktemp -d); ARGS=(--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --user-data-dir="$PROF")
[ "$(id -u)" = 0 ] && ARGS+=(--no-sandbox)
"$CH" "${ARGS[@]}" "$@" 2>/dev/null & pid=$!
( sleep "$T"; kill $pid 2>/dev/null ) & wd=$!
wait $pid 2>/dev/null; kill $wd 2>/dev/null; rm -rf "$PROF"
