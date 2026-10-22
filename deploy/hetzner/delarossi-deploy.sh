#!/bin/sh
# Delarossi: automatisches Update aus GitHub (Workflow .github/workflows/deploy.yml).
#
# Läuft auf dem Server als erzwungener Befehl des Upload-Schlüssels (siehe
# setup-auto-deploy.sh): Der Schlüssel kann nur dieses Skript starten, sonst
# nichts. Liest optional eine Commit-ID von stdin, holt den Branch per git und
# spult /var/www/delarossi vor (nur fast-forward). Ändert nichts anderes:
# nginx, Flowint und Mail bleiben unverändert. Schlägt eine Prüfung fehl, wird
# der vorige Stand automatisch wiederhergestellt.
#
# DELAROSSI_* Variablen gibt es nur für lokale Tests; sshd reicht sie nicht durch.
set -eu
umask 022

DIR=${DELAROSSI_DIR:-/var/www/delarossi}
BRANCH=claude/musical-framer-style-8jnsxo
LOCK=${DELAROSSI_LOCK:-/run/delarossi-deploy.lock}
SITE=${DELAROSSI_SITE:-https://www.delarossi.de}

exec 9>"$LOCK"
flock -n 9 || { echo "FEHLER: Ein anderes Update läuft gerade, nichts geändert."; exit 1; }

# Erwartete Commit-ID (40 Hex-Zeichen), sonst ignoriert. Leer = Verbindungstest.
WANT=$(head -c 200 | tr -d ' \r\n\t' | grep -Ex '[0-9a-f]{40}' || true)

g() { git -c safe.directory="$DIR" -C "$DIR" "$@"; }

if [ -z "$WANT" ]; then
  echo "Verbindung ok (keine Commit-ID gesendet, nichts geändert). Stand: $(g rev-parse --short HEAD)"
  exit 0
fi

if [ -n "$(g status --porcelain --untracked-files=no)" ]; then
  echo "FEHLER: Im Server-Ordner wurden Dateien von Hand geändert, nichts geändert:"
  g status --short --untracked-files=no
  exit 1
fi

OLD=$(g rev-parse HEAD)
g fetch --quiet origin "$BRANCH"
NEW=$(g rev-parse FETCH_HEAD)

if [ "$NEW" != "$WANT" ]; then
  # Neuerer Push schon unterwegs: der kommt mit seinem eigenen Lauf.
  if ! g merge-base --is-ancestor "$WANT" "$NEW"; then
    echo "FEHLER: Commit $WANT ist nicht im Branch $BRANCH, nichts geändert."; exit 1
  fi
fi

if [ "$OLD" = "$NEW" ]; then
  echo "Schon aktuell ($(g rev-parse --short HEAD)), nichts geändert."
  exit 0
fi

g merge --quiet --ff-only FETCH_HEAD || { echo "FEHLER: Kein fast-forward möglich, nichts geändert."; exit 1; }
chmod -R a+rX "$DIR" 2>/dev/null || true
echo "Aktualisiert: $(g rev-parse --short "$OLD") -> $(g rev-parse --short HEAD)"
g log --oneline "$OLD..HEAD" | head -20

echo "--- Prüfung"
FAILED=0
check() { # name, ist, soll
  if [ "$2" = "$3" ]; then
    printf 'ok      %-16s %s\n' "$1" "$2"
  else
    printf 'FEHLER  %-16s %s (erwartet %s)\n' "$1" "$2" "$3"
    FAILED=1
  fi
}
for p in / /impressum.html /datenschutz.html /style.css /script.js /robots.txt /sitemap.xml; do
  check "$p" "$(curl -sL -o /dev/null -w '%{http_code}' "$SITE$p")" 200
done
check "ohne www" "$(curl -sL -o /dev/null -w '%{http_code}' https://delarossi.de/)" 200

if [ "$FAILED" -ne 0 ]; then
  g reset --quiet --hard "$OLD"
  echo "FEHLER: Prüfung fehlgeschlagen. Der vorige Stand $(g rev-parse --short HEAD) ist wiederhergestellt."
  exit 1
fi

logger -t delarossi-deploy "Update ok: $OLD -> $(g rev-parse HEAD)" 2>/dev/null || true
echo "Fertig. Live ist der neue Stand."
