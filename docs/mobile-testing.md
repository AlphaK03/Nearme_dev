# Pruebas móviles por HTTPS desde Visual Studio Code

La aplicación vigente está en `web/` (React/Leaflet) y `backend/src/` (Node.js). Los comandos se ejecutan desde la raíz. `frontend/` contiene el cliente Flutter anterior.

## Iniciar la aplicación

```powershell
npm install
npm run build
npm start
```

Abrir http://127.0.0.1:8787. Si el servidor ya está activo, no iniciar una segunda instancia en ese puerto. Para aplicar cambios al backend o a `backend/.env`, detener la instancia anterior y ejecutar `npm start` otra vez. Para cambios de interfaz, volver a compilar.

## Crear el enlace HTTPS

1. En VS Code, abrir la paleta (`Ctrl+Shift+P`) y ejecutar `Ports: Focus on Ports View` (Puertos).
2. Pulsar **Forward a Port / Reenviar un puerto** y escribir **8787**. Iniciar sesión con GitHub cuando se solicite.
3. Copiar la dirección HTTPS de **Forwarded Address**. El destino local sigue usando HTTP; el túnel proporciona HTTPS al teléfono.
4. Autorizar esa dirección exacta en el servidor:

   ```powershell
   npm run preview:url -- https://TU-ENLACE.devtunnels.ms
   ```

   El comando guarda `PUBLIC_APP_URL` en `backend/.env`, sin modificar las claves ni los límites de IA. Reiniciar el servidor para aplicarlo. Repetir si cambia el enlace.

5. Abrir el enlace en el navegador del móvil. Con la visibilidad **Private**, iniciar sesión con la misma cuenta de GitHub usada en VS Code. Si Microsoft muestra la pantalla inicial del túnel, continuar para acceder a la app.

Mantener la computadora, el servidor y el reenvío de VS Code activos. Es un enlace temporal de pruebas, no un despliegue permanente. El móvil puede usar otra red o datos móviles.

La visibilidad **Public** permite entrar sin iniciar sesión; cualquier persona con el enlace podrá usar la aplicación y sus consultas de IA. Se recomienda mantenerlo privado para las pruebas personales.

## GPS e instalación

- **Ubicación:** pulsar «Usar mi ubicación» y conceder el permiso. Comprobar también los permisos del navegador y la ubicación del sistema. HTTPS habilita el contexto seguro requerido; no concede automáticamente los permisos.
- **Android:** abrir en Chrome, usar «Instalar aplicación» dentro de NearMe o la opción de instalación del menú del navegador, si está disponible.
- **iOS:** abrir en Safari, pulsar Compartir y «Añadir a pantalla de inicio». Si solicita autenticación al abrir la app instalada, usar la misma cuenta del túnel.
- Evitar los navegadores integrados de aplicaciones de mensajería para estas pruebas.
- La PWA necesita el build de producción del puerto 8787. El modo de desarrollo (`npm run dev`, puerto 5173) no registra el service worker.
- Las preferencias y rutas se guardan por origen: el enlace HTTPS tendrá almacenamiento separado de la dirección IP local.

## Si el mapa muestra «Access blocked»

Microsoft dev tunnels puede sustituir la cabecera `Referrer-Policy` por `same-origin`. OpenStreetMap requiere que las peticiones de imágenes del mapa incluyan el origen real de la web. La capa Leaflet fija `referrerPolicy: 'strict-origin-when-cross-origin'` en cada imagen para conservar esa identificación incluso detrás del túnel, sin enviar la ruta ni los parámetros de la página.

Después de actualizar el código, ejecutar `npm run build` y recargar la app. Las imágenes se solicitan directamente a OpenStreetMap, con atribución visible y la caché HTTP normal del navegador. No se falsifica el origen ni se utiliza un proxy para evitar bloqueos. Si el mensaje persiste, anotar su código y texto exactos, pues también puede indicar otro motivo.

Referencias: [cabeceras de dev tunnels](https://github.com/microsoft/dev-tunnels/issues/508), [bloqueos de imágenes de OpenStreetMap](https://wiki.openstreetmap.org/wiki/Blocked_tiles).

## Comparación de modelos

El modelo predeterminado es `gpt-4.1`. Para volver al anterior, cambiar solo `OPENAI_MODEL=gpt-4.1-mini` en `backend/.env` y reiniciar el servidor. `/api/health` muestra el modelo activo, sin mostrar la clave.

Se mantienen el prompt, los datos de entrada, el esquema de respuesta, 650 tokens máximos de salida, el tiempo de espera, la caché y los límites de pruebas existentes. La caché distingue ambos modelos. No se reinicia el contador de uso al cambiar el modelo.

GPT-4.1 tiene una tarifa por token cinco veces mayor que GPT-4.1 mini (entrada, entrada cacheada y salida). La reserva local de USD 0.01 por intento se conserva; es un contador de pruebas, no una medición del costo real ni del saldo de OpenAI. Consultar el uso real en la cuenta del proveedor.

## Validación

```powershell
npm test
npm run build
npm run test:e2e
```

Las pruebas automáticas de IA y navegador simulan los proveedores y no gastan crédito. La comprobación de GPS real y la instalación final se realiza en los dispositivos.

Fuentes: [reenvío de puertos de VS Code](https://code.visualstudio.com/docs/debugtest/port-forwarding), [seguridad de Microsoft dev tunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/security), [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
