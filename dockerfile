# 1. Basis-Image: Ein schlankes Linux mit Node.js
FROM node:18-alpine

# 2. Arbeitsverzeichnis im Container festlegen
WORKDIR /usr/src/app

# 3. Zuerst package.json kopieren und Pakete installieren
COPY package*.json ./
RUN npm install

# 4. Den gesamten restlichen Quellcode (alle apps, libs etc.) kopieren
COPY . .

# 5. Die TypeScript-Anwendung bauen (erstellt den 'dist'-Ordner)
RUN npm run build

# 6. Ein Standardbefehl 
CMD ["node", "dist/apps/oms/OmsMain.js"]
