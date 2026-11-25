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

## Endpoints

| Endpoint | Qué devuelve |
| --- | --- |
| `GET /{DB}.json` | Items de una base de datos de Notion |
| `GET /id/{id}.json` | Página de Notion como bloques JSON (tablas, columnas, toggles, callouts, listas anidadas...) |
| `GET /media/{blockId}` | Fichero (imagen, vídeo, adjunto) de un bloque |

### Imágenes y ficheros

Notion sirve los ficheros subidos con URLs firmadas que **caducan en 1 hora**. Por eso
los bloques `image`, `video` y `file` incluyen `proxy_url` (`/media/{blockId}`): una URL
estable que siempre devuelve el fichero actualizado, cacheable por el navegador y por
CDN. Las webs y apps deben usar `proxy_url`, nunca `url`.

