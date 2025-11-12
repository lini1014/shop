# Inventory Service (NestJS)

## Basis-Abhängigkeiten

npm i
npm i @nestjs/swagger swagger-ui-express
npm i -D ts-node tsconfig-paths nodemon
npm i class-validator class-transformer

---

## Service starten

npm run start:dev

Der Service läuft standardmäßig auf:
localhost:3001

---

## API Endpoints (Kurzüberblick)

### POST /InventoryReserve

Verfügbarkeit prüfen & reservieren.

### POST /InventoyRelease

Reservierung wieder freigeben falls Bestellung fehlschlägt.
