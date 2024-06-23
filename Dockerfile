# Usa una imagen de Node.js como base para desarrollo
FROM node:22-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package.json .

# Instala todas las dependencias (incluidas las de desarrollo)
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto 1337 en el contenedor
EXPOSE 1337

# Comando para ejecutar la aplicación en modo desarrollo
CMD ["npm", "run", "dev"]