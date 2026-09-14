# Nuvio - Fuente Autorizada Demo

Repositorio de demostracion para cargar un proveedor local en Nuvio.

## URL del manifest

Usa esta URL en Nuvio:

https://raw.githubusercontent.com/ioezgamer/proyectos_gratioez/main/nuvio-fuente-autorizada/manifest.json

## Instalacion

1. Abre Nuvio.
2. Ve a Settings > Plugins.
3. Pulsa Add new repository.
4. Pega la URL del manifest.
5. Activa `Fuente Autorizada Demo`.

## Que hace

El proveedor implementa `getStreams(tmdbId, mediaType, season, episode)` y devuelve un HLS publico de demostracion para comprobar que Nuvio carga correctamente el plugin.

No extrae ni resuelve enlaces desde sitios de terceros. Para usar contenido real, conecta el proveedor a una API/CDN propia o a una fuente para la que tengas autorizacion.
