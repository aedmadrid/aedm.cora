# aedm.cora
### El corazón (API pública) para las webs y apps de la AEDM.

## Desarrollo de apps

Si quieres usar este api, puedes experimentar con localhost:3000 en tu máquina. Para añadir una nueva url al cors, haz un pull request.

## Setup (no necesitas hacer esto si no mantienes este api)
Clona el repositorio y ejecuta `npm install` para instalar las dependencias.
Construye el dockerfile y sube la imagen.
```
docker buildx build --platform linux/amd64 -t ghcr.io/aedmadrid/aedm.cora:latest --push .
```


Edita el archivo `.env` con las variables de entorno necesarias en el lugar de ejecución.
