# Chat persistente: primera vertical

## Alcance real

Conversaciones y mensajes viven en D1. La PWA permite crear, renombrar, fijar,
desfijar, abrir y eliminar conversaciones con confirmación. Se puede guardar
texto, copiar mensajes y exportar una conversación como Markdown. Un cliente
nuevo puede recuperar el historial y el contenido confirmado desde la API.

No se generan respuestas de IA: los mensajes tienen role user y estado STORED,
e inference es unavailable. Guardar no lanza una tarea ni un runner. Selección de
agente/modelo/proveedor/esfuerzo, adjuntos, dictado, comandos, respuestas de agentes,
fallback y telemetría continúan pendientes. No existe memoria de proyectos todavía.

## Contratos y almacenamiento

- Contratos Conversation, ChatMessage y ConversationDetail en shared/src/chat.ts.
- D1ChatStore separado de D1TaskStore; Task Engine y runner no cambian.
- Migración aditiva 0002_chat.sql: conversations y chat_messages, índices y trigger
  que incrementa la versión del padre únicamente al insertar un mensaje nuevo.
- Un identificador UUID estable por creación/mensaje permite reintentar la misma
  solicitud sin duplicar datos. Reusar una clave con contenido diferente devuelve 409.
- Renombrar, fijar y eliminar exige la versión actual; una edición obsoleta devuelve 409.
- Eliminar conversación borra sus mensajes por cascade. No afecta tareas ni sus tablas.
- Límite interno de almacenamiento: 100 conversaciones, 200 mensajes por conversación,
  2000 caracteres por mensaje y 120 por título. Son límites de Cubo, no cuotas que
  se atribuyan a Cloudflare o a proveedores de modelos; exceso devuelve 429 o 400.

## API

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | /api/conversations | Historial, fijadas primero |
| POST | /api/conversations | Crear con Idempotency-Key UUID |
| GET | /api/conversations/:id | Conversación y mensajes ordenados |
| PUT | /api/conversations/:id | Título/fijado con versión |
| DELETE | /api/conversations/:id | Borrar con versión |
| POST | /api/conversations/:id/messages | Guardar texto con Idempotency-Key UUID |

Las rutas usan la autenticación personal existente, origen validado en mutaciones,
no-store, límite de cuerpo y errores sanitizados. El cliente conserva su selección
en el parámetro chat de la URL; no guarda mensajes privados en localStorage ni
en el service worker. Los datos se renderizan como texto, sin interpretar HTML.

Se rechazan los valores de las credenciales conocidas del Worker y algunos patrones
comunes de tokens/claves privadas antes de persistir títulos o mensajes. Esto no
es un detector universal de secretos: no pegar credenciales ni información de
otros proyectos. El almacenamiento cifrado de secretos por proyecto no está
implementado en esta fase y no se guardan credenciales como configuración de Chat.

## Comprobación y limitaciones

Prueba local sobre D1 y build actual: creación idempotente, mensaje persistido,
retry sin duplicar mensaje/versión, conflicto 409, patrón de token rechazado con
400 y origen ajeno rechazado con 403. Desde la UI: renombrar, fijar, exportar,
cerrar contexto completo, abrir otro en móvil, recuperar el mismo texto y eliminar.
Móvil sin overflow; historial y configuración usan diálogos con Escape y foco aislado.
Evidencia ignorada: artifacts/chat-proof.json y capturas chat-persistence-*.png
en .impeccable/review/. Revisión final confirmó el arreglo de cascada del layout.

Las solicitudes ya persistidas sobreviven al cliente. Una respuesta perdida puede
verificarse consultando el historial; el cliente conserva la clave para reintentos
mientras está abierto. Un borrador sin confirmar no tiene persistencia garantizada.
La prueba no demuestra una conversación con un agente ni reanudación de inferencia.

Wrangler local que ya servía un build anterior devolvió fallback HTML para un nuevo
hash JS. La comprobación se repitió sobre un servidor nuevo con el build vigente;
el problema no se ocultó como fallo de Chat. Antes de comprobar un build nuevo,
arrancar el servidor de assets después del build y verificar su Content-Type.

## Despliegue

El usuario autorizó commit, push y deploy al terminar. bun run deploy valida cuenta,
repo y gasto cero, ejecuta las puertas existentes, verifica nombres de secretos
registrados, aplica migraciones remotas pendientes y publica. Conserva secretos
existentes; si faltan, detiene la publicación. No añade servicios pagos.

La migración es aditiva: si la publicación falla, las tablas de tareas existentes
siguen intactas. No borrar tablas ni revertir datos remotos automáticamente.

## Publicación y aceptación cloud

Publicado el 2026-10-13: commit 43a8577 en GitHub main y versión Worker
db214341-8b7b-46ee-bdcd-77d94e597b59 en la cuenta personal cubo-dev.
Migración 0002 aplicada a cubo-dev-db. Secretos existentes conservados.
URL: https://cubo-dev.pctg.workers.dev.

La misma vertical pasó en cloud con conversación de prueba
673bce9f-dd88-41ed-9043-5e1a61864cc7: creación, mensaje, idempotencia, renombrado,
fijado, exportación, cierre completo del cliente y recuperación en otro navegador
móvil. También se verificaron los rechazos 409/400/403 y eliminación de esa
conversación recién creada; no se borraron conversaciones previas. Evidencia local
ignorada en artifacts/chat-proof-cloud.json. No se ejecutó inferencia ni otro runner.

La API de Chat devuelve 401 sin sesión. La prueba de conservación de Tareas
recuperó SUCCEEDED/91 de 6c644134-73f6-4648-b25d-77b381f9ea9a. Cinco módulos,
manifest PWA y móvil pasan; bundle actual index-CiP8oFGt.js. Puertas del despliegue:
20 tests/83 comprobaciones, lint, typecheck y build correctos.
