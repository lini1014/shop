🧪 Startreihenfolge (lokal)

RabbitMQ starten:

docker compose -f docker/docker-compose.yml up -d


Dienste starten:

pnpm start:inventory-svc
pnpm start:payment-api
pnpm start:wms-sim
pnpm start:oms


Swagger öffnen → http://localhost:3000/api