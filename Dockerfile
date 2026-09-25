FROM --platform=linux/amd64 node:20-alpine
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (incluye devDependencies: @types/* y typescript son necesarios para compilar)
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer el puerto (cambia según tu app)
EXPOSE 8000
EXPOSE 8080

# Comando para iniciar
CMD ["node", "dist/index.js"]
