FROM node:20-alpine
WORKDIR /app
# Installation de l'CLI Ionic globalement
RUN npm install -g @ionic/cli
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8100
# Commande pour lancer le serveur de preview accessible de l'extérieur
CMD ["ionic", "serve", "--external", "--port", "8100"]