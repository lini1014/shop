# Copyright: Niklas Lisker, Maximilian Zaharia, David Daglioglu, Emirhan Yasa

# Setup-Anleitung - Shop-Projekt

## 1. Installation

1. **Repository klonen**
   ```bash
   git clone <deine-repository-url>
   ```

2. **In das Projektverzeichnis wechseln**
   ```bash
   cd shop
   ```

3. **Abhängigkeiten installieren**  
   (z. B. `nodemon`, `ts-node`, `nestjs`, etc.)
   ```bash
   npm install
   ```

---

## 2. Ausführung

> **Voraussetzung:** Docker Desktop muss ausgeführt werden.

1. **In das Projektverzeichnis wechseln**
   ```bash
   cd shop
   ```

2. **RabbitMQ starten**
   ```bash
   docker compose up rabbitmq
   ```

3. **Zweites PowerShell-Fenster öffnen**

4. **Alle Services im Entwicklungsmodus starten**
   ```bash
   npm run start:dev:all
   ```

---

## 3. Postman

1. **Postman-Collection importieren**  
   → Datei unter `/libs/postman` auswählen und importieren.

2. **API-Anfragen senden**  
   - Die Anfragen sind nach dem Import verfügbar.
   - Überprüfe Antworten und Log-Ausgaben.

3. **Logs einsehen**  
   - Im Verzeichnis `/log` findest du das aktuelle Log-File.

---
