# Étape 1 : Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur de production
FROM nginx:stable-alpine
# Copie du build React vers le dossier Nginx (Vite utilise 'dist', CRA utilise 'build')
COPY --from=builder /app/dist /usr/share/nginx/html
# Optionnel : ajouter un fichier nginx.conf personnalisé pour le routing SPA
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]