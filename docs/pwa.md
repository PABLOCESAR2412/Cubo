# Instalación y actualización de Cubo

## Comportamiento

Cubo conserva su manifest, iconos y caché de assets. La opción Instalar aparece
cuando el navegador entrega beforeinstallprompt; el botón abre la instalación
nativa y desaparece tras consumir el evento. Si no hay botón, Ajustes → Apariencia
explica cómo buscar Instalar aplicación o Añadir a la pantalla de inicio en el
menú del navegador. No se afirma disponibilidad universal ni se instala sin gesto
del usuario. Ver [BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent).

Un nuevo service worker con assets publicados muestra Actualización disponible.
Actualizar pide confirmar la recarga y recuerda guardar borradores. Al confirmar,
activa el worker en espera y recarga la página con la nueva versión. No cancela
tareas del backend. Posponer oculta el aviso y conserva Actualizar en la barra.
Un error de recarga permite reintentar sin quedar permanentemente bloqueado.

Se comprueban actualizaciones al recuperar conexión, foco o visibilidad y cada
cinco minutos cuando la ventana está visible y online. El navegador puede retrasar
trabajo en segundo plano; no se promete detección instantánea. No consulta GitHub
ni usa credenciales para comparar main: un commit no desplegado no es una versión
disponible. Cambios solo de backend o documentación sin assets nuevos no requieren
actualizar el frontend ni generan un aviso de service worker.

Se usa registerType prompt y updateSW de la integración existente, conforme a
la [guía de actualización de Vite PWA](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html).
Los callbacks se registran una vez; React StrictMode no duplica el registro.
La caché es del navegador y almacena assets de la aplicación; la API continúa
fuera del fallback offline. Tareas, proyectos y chats permanecen en D1/backend.

## Primera entrega

Una pestaña que todavía ejecute código anterior a este aviso no puede mostrarlo.
Cerrar todas las ventanas/pestañas de Cubo y volver a abrir permite activar el
worker nuevo. Después se utiliza el botón Actualizar para entregas posteriores.
La instalación en el sistema operativo sigue dependiendo del navegador/dispositivo.

## Prueba y límites

### Recuperación de una versión atascada

El incidente del CSS `index-CEZ_fnF4.css` devolvía `200 text/html`: el fallback SPA
respondía con el shell cuando el asset antiguo ya no existía. El navegador
rechazaba ese HTML como stylesheet. No se desactiva `nosniff` ni se falsea el MIME.
Los assets pasan por una guardia que responde 404 al recibir HTML, y las nuevas
versiones del service worker excluyen `/assets/` del fallback de navegación.

Abrir `/api/pwa-recovery` permite recuperar incluso shells antiguos: `/api/` ya
estaba excluido de su fallback offline. El botón comprueba conexión, retira solo
el registro `/sw.js` y su precaché Workbox de este origen, y vuelve a abrir Cubo.
Conserva cookies, localStorage, IndexedDB y todas las entidades del backend.
Puede perderse un borrador no enviado; la página pide guardarlo primero.
No hay recuperación automática destructiva ni limpieza de todas las cachés.
Una carga futura con assets rotos muestra el enlace de recuperación sin depender
del bundle React. El error del botón Actualizar también ofrece esa salida.

La prueba reproducible es `bun run scripts/pwa-recovery-check.ts`, con Wrangler
local en 8855 y `LOCAL_DEV=true`. Simula un shell antiguo en una caché real y
comprueba MIME, recuperación, conservación de cookies/localStorage y de una caché
ajena, con capturas 1440/390. No inicia runners ni consume modelos.
El comportamiento del fallback está documentado por
[Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/).

Corrección publicada como Cubo 1.0.2, commit `d0bef84`, Worker
`f497132f-6b4d-44ec-bf4e-b8a2584ee0fc`. La misma prueba pasó contra cloud:
CSS antiguo 404, CSS vigente text/css, recuperación de shell obsoleto y conservación
de cookies, localStorage y caché ajena. Tests 38/211, lint, tipos y build correctos.

Prueba de navegador con dos versiones reales del service worker en loopback:
detectar worker en espera, mostrar aviso, comprobar que no recarga automáticamente,
posponer/cancelar confirmación sin perder la página, confirmar y comprobar recarga
y activación. Capturas a 1440×900 y 390×844, aviso dentro del viewport.

La prueba de instalación inyecta un evento sintético para comprobar que el botón
invoca prompt una vez y desaparece después. No demuestra instalación real en PC
o móvil. La primera prueba falló por Content-Encoding gzip incorrecto del proxy
local de QA; se corrigió solo ese proxy y la prueba completa pasó después.
No se modificó backend ni se lanzaron nuevos runners para esta prueba.

## Publicación comprobada

Commit c99fa84 publicado en main; Worker cubo-dev de la cuenta personal, versión
4edfee3f-544e-426d-8f64-dcab50670c51. URL: https://cubo-dev.pctg.workers.dev.
Bundle index-Ksojf9oq.js comprobado. SW servido con 200, text/javascript y
Cache-Control public, max-age=0, must-revalidate; registro real confirmado.
La guía aparece en Ajustes → Apariencia. Cinco vistas, móvil, manifest y API privada
pasan; la tarea durable anterior conserva SUCCEEDED/91. No hubo migraciones,
secretos modificados ni nuevos runners. Ciclo de actualización v1→v2 probado en
loopback; no se realizó un despliegue cloud adicional solo para inducir una versión.
