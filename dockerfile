FROM node:18-alpine
WORKDIR /usr/src/app
<<<<<<< HEAD

# 3. Zuerst package.json kopieren und Pakete installieren
=======
>>>>>>> a646b7d979db590965ba4ae21937733eb7a4588c
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
<<<<<<< HEAD

# 6. Ein Standardbefehl 
=======
>>>>>>> a646b7d979db590965ba4ae21937733eb7a4588c
CMD ["node", "dist/apps/oms/OmsMain.js"]
