1. Installation: 
-Klone das Projekt
 git clone <deine-repository-url>

-Wechsle in den Projektordner
 cd shop

-Installiere alle Abhängigkeiten (nodemon, ts-node, nestjs, etc.)
 npm install

2. Ausführung
-Docker Desktop muss laufen

-In der Powershell in das Projektverzeichnis wechseln

-folgenden Befehl ausführen
 docker compose up rabbitmq

-2. Powershell Fenster öffnen

-folgenden Befehl eingeben
 npm run start:dev:all

3. Postman
-in Postman die Datei unter /libs/postman importieren

-Anfragen können nun gesendet werden

-Überprüft werden können diese unter /log im log-file