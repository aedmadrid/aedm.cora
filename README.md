# aedm.cora
### El corazón (API pública) para las webs y apps de la AEDM.

## Setup
Clona el repositorio y ejecuta `npm install` para instalar las dependencias.
Configura el cors (index.ts)
Construye el dockerfile y sube la imagen.
```
docker buildx create --use
```
```
docker build -t ghcr.io/aedmadrid/aedm.cora:latest .
```
```
docker push ghcr.io/aedmadrid/aedm.cora:latest
```


Edita el archivo `.env` con las variables de entorno necesarias en el lugar de ejecución.
