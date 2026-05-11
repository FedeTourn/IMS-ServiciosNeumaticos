# 1. Usamos una imagen ligera de Node.js
FROM node:18-alpine

# 2. Creamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Instalamos solo dependencias de producción (evita devDependencies)
RUN npm install --only=production

# 5. Copiamos el resto del código fuente
COPY . .

# 6. Exponemos el puerto que usa la API
EXPOSE 3001

# 7. Comando para iniciar la aplicación
CMD ["node", "server.js"]