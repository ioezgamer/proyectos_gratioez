# Ezequiel | FlareStore Apps

Fuente personalizada AltStore JSON para usar en FlareStore, AltStore o SideStore, con enlaces de los autores originales.

**URL para agregar en FlareStore:**

```text
https://raw.githubusercontent.com/ioezgamer/proyectos_gratioez/main/flarestore/source.json
```

Incluye **WQ Files** (kolbicz), importado desde su [fuente oficial](https://raw.githubusercontent.com/kolbicz/WQFiles/main/source.json), y **Tetherless Modern** (pwnapplehat) para iOS 26 y posteriores, obtenido desde sus [lanzamientos oficiales](https://github.com/pwnapplehat/TetherlessiOS/releases).

Las versiones se revisan aproximadamente cada seis horas mediante GitHub Actions, con ejecución manual disponible. GitHub puede retrasar los trabajos programados. El actualizador lee los metadatos del `Info.plist` de cada IPA (bundle ID, versión y build) y actualiza el archivo `source.json` si hay novedades. Conserva hasta cinco versiones de Tetherless Modern y el historial que la fuente oficial ofrezca para WQ Files.

**Firma e instalación:** la fuente solo proporciona el catálogo y sus enlaces. FlareStore debe firmar e instalar cada actualización; el resultado depende de conservar el mismo identificador de la app, certificado y permisos. WQ Files requiere que el firmador preserve el App Group; no todos lo hacen. Antes de actualizar, revisá las notas y hacé una copia de seguridad de tus datos.

Este repositorio no altera ni vuelve a alojar las IPA. No afiliado a WQ Files, Tetherless, FlareStore, AltStore ni SideStore.
