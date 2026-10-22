#!/bin/sh
# Delarossi: richtet einmalig das automatische Update aus GitHub ein.
#
# - installiert delarossi-deploy.sh als /usr/local/sbin/delarossi-deploy
# - erzeugt einen eigenen Schlüssel, der auf diesem Server nur
#   delarossi-deploy starten kann (restrict + command=, keine Shell, keine
#   Weiterleitungen)
# - gibt den Wert für das GitHub-Secret als eine Zeile (base64) aus und löscht
#   danach den privaten Schlüssel vom Server; er liegt dann nur noch in GitHub
#
# Erneut ausführen ersetzt den alten Schlüssel (z. B. wenn der Wert nicht
# kopiert wurde). Andere Einträge in authorized_keys (auch der Flowint-Schlüssel)
# bleiben unverändert.
set -eu
cd "$(dirname "$0")"

IP=167.233.57.178
TAG=delarossi-github-deploy
K=$(mktemp -u /root/.ssh/$TAG-XXXXXX)
AK=/root/.ssh/authorized_keys

install -m 755 -o root -g root delarossi-deploy.sh /usr/local/sbin/delarossi-deploy

mkdir -p /root/.ssh
chmod 700 /root/.ssh
ssh-keygen -q -t ed25519 -N '' -C "$TAG" -f "$K"

touch "$AK"
cp -a "$AK" "$AK.vor-delarossi-deploy"
{ grep -v " $TAG\$" "$AK" || true
  printf 'restrict,command="/usr/local/sbin/delarossi-deploy" %s\n' "$(cat "$K.pub")"
} > "$AK.neu"
chmod 600 "$AK.neu"
mv "$AK.neu" "$AK"

echo "--- Test der Verbindung mit dem neuen Schlüssel"
if ssh -F /dev/null -i "$K" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR root@$IP < /dev/null; then
  echo "Test ok"
else
  echo "FEHLER: Test fehlgeschlagen. Bitte die Ausgabe an Claude schicken."
  rm -f "$K" "$K.pub"
  exit 1
fi

echo
echo "=========================================================="
echo "GitHub-Secret   Name: DELAROSSI_DEPLOY_KEY"
echo "Wert: die EINE lange Zeile zwischen den Strichen (ohne die Striche)"
echo "----------------------------------------------------------"
base64 -w0 "$K"
echo
echo "----------------------------------------------------------"
echo "=========================================================="

rm -f "$K" "$K.pub"
echo "Der private Schlüssel ist vom Server gelöscht. Nicht kopiert? Einfach erneut ausführen."
