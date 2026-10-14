# Publicación y aceptación parcial de OpenRouter

Fecha: 2026-10-14. Cuenta personal, entorno cubo-dev. Código b5f1250;
Worker e979833a-e768-4491-9f7e-5ce992155a1b. Infraestructura existente gratuita;
sin servicios nuevos, cambios de plan ni modificaciones automáticas de secretos.

## Comprobaciones terminadas

- bun test: 29 pruebas, 168 comprobaciones, sin fallos.
- bun run lint, bun run typecheck y bun run build: correctos.
- Migración aditiva 0005 aplicada en D1 remoto. No había tareas activas antes.
- Revisión visual final: ship después de cambiar «Cubo cloud» por «API de Cubo»
  en Diagnóstico. La sincronización no acredita disponibilidad de runners.
- UI publicada comprobada en 1440 y 390 px sin errores JS ni desbordamiento.
- Formulario de clave habilitado por el cifrado ya configurado; catálogo público
  real de 15 modelos gratuitos en esa observación. Sin clave, cuota unavailable.
- Acceso anónimo al proveedor rechazado con 401. La respuesta del propietario
  no incluye clave, ciphertext ni IV.
- CSP aplicada sin violaciones, service worker listo y shell recuperado offline.
- Snapshot público anterior y README recuperados; tarea original SUCCEEDED con
  resultado 91 conservada.

Las capturas y JSON de prueba se conservan localmente en artifacts/, ignorado por
Git. No son evidencia de una respuesta de modelo ni sustituyen la prueba pendiente.

## Cancelación remota real

Se lanzó una tarea demostrativa acotada con runner estándar ubuntu-latest para
comprobar el nuevo camino de cancelación. No hizo inferencia ni operaciones Git.

| Campo | Valor |
| --- | --- |
| task_id | 6c2e8129-1482-4d6a-80f2-7da1699109ba |
| execution_id | 6c2e8129-1482-4d6a-80f2-7da1699109ba-1 |
| workflow_run_id | 38612464241 |
| Runner conectado | 18:07:35.731 UTC |
| Cancelación solicitada | 18:07:40.057 UTC |
| Estado inicial tras solicitar | RUNNING / CANCELLATION_REQUESTED |
| Confirmación persistida | 18:08:27.852 UTC |
| Estado final en Cubo | CANCELLED, progreso 0, resultado null |
| Estado de GitHub | completed / cancelled |

La API no mostró CANCELLED inmediatamente. Conservó la solicitud pendiente hasta
la comprobación remota. Los únicos eventos fueron queued, claimed y cancelled;
no se guardaron checkpoints ni resultado después de solicitar la cancelación.

## Inferencia todavía pendiente

El usuario eligió OpenRouter gratuito y confirmó haber guardado una clave. La
comprobación posterior de D1 encontró cero conexiones de proveedor. En el proyecto
077e6b47-e19b-4ff5-afda-77c3f366f9d7, API 200 confirmó configured=false,
encryptionConfigured=true y catálogo disponible. No se lanzó una inferencia.

El navegador del usuario mostró runtime.lastError y errores en globals-front.js y
content.js. Esos archivos no están entre los scripts publicados de Cubo. La misma
vista en Chrome aislado cargó index-Dwu3aXS9.js y Workbox sin errores JS.
Esto respalda un origen en extensiones para esos mensajes, pero no identifica
por sí solo la causa del guardado fallido. Se pidió el mensaje visible de Cubo
tras Guardar clave, sin compartir credenciales.

Para cerrar aceptación: guardar la clave desde el proyecto, verificar configured,
enviar una petición breve gratuita, cerrar navegador antes de conectar el runner,
recuperar respuesta y uso desde otro contexto, y registrar task/run/timestamps.
Si el proveedor exige pago, detener esa integración; no cargar saldo ni cambiar plan.
