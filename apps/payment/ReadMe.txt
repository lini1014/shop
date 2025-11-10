#Swagger Installieren
npm install @nestjs/swagger swagger-ui-express class-validator class-transformer

#amqplib
npm install amqplib

#testen
nest build payment
node dist/apps/payment/Paymentmain.js

#Swagger
http://localhost:3003/docs

#rabbitmq
http://localhost:15672/
cd in docker rein
docker compose up rabbitmq

#Zum testen POST-Erfolgreich
{
  "orderId": 1001,
  "amount": 99.99
}



#Post-fehler
{
  "orderId": 1002,
  "amount": 99.13
}

#Logs prüfen
Get-Content -Path .\log\central.log -Tail 50 -Wait

