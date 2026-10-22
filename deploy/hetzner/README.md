# Automatisches Deployment auf den Hetzner-Server

Jeder Push auf `claude/musical-framer-style-8jnsxo` startet den GitHub-Workflow
`.github/workflows/deploy.yml`. Der verbindet sich mit einem eigenen,
eingeschränkten SSH-Schlüssel mit dem Server (167.233.57.178). Dieser Schlüssel
kann dort nur `/usr/local/sbin/delarossi-deploy` starten, sonst nichts.

Das Skript holt den Branch per `git fetch` und spult `/var/www/delarossi` vor
(nur fast-forward), prüft danach die Seiten und stellt bei einem Fehler den
vorigen Stand wieder her. Von Hand geänderte Dateien im Server-Ordner blockieren
das Update (es wird dann nichts geändert).

Gleicher Aufbau wie bei Flowint, getrennter Schlüssel und getrenntes Secret.

## Einmalige Einrichtung

1. Auf dem Server (als root) den neuen Stand holen und das Setup starten:
   ```sh
   cd /var/www/delarossi && git pull
   sh /var/www/delarossi/deploy/hetzner/setup-auto-deploy.sh
   ```
2. Die ausgegebene lange Zeile in GitHub als Secret eintragen:
   Repo `delarossi/Delarossi-Website-` → Settings → Secrets and variables →
   Actions → New repository secret, Name `DELAROSSI_DEPLOY_KEY`.
3. Unter Actions → „Deploy www.delarossi.de“ → „Run workflow“ einmal testen.

Danach ist kein `git pull` von Hand mehr nötig.
