# Chat durable con OpenRouter gratuito

Actualización posterior: la configuración se trasladó a Ajustes generales por
petición del usuario. El aislamiento de contextos se conserva. Los apartados de
configuración por proyecto documentan la primera entrega y su compatibilidad;
el contrato actual es [Chat refinado](chat-refinement.md).

## Alcance de esta vertical

Implementación publicada en cubo-dev con pruebas: proveedor de texto OpenRouter, modelos gratuitos,
turnos remotos, mensajes de asistente y uso persistidos. La aceptación con una clave
real está pendiente. No es ejecución de Codex/OpenCode: no hay herramientas, edición
de archivos ni operaciones Git disponibles para el modelo.

El usuario eligió OpenRouter como primera integración. OpenCode Zen, Groq, NVIDIA,
Gemini y otros proveedores mantienen sus estados pendientes. Cada implementación
de proveedor conserva su adaptador; el TaskEngine no importa OpenRouter.

## Configuración y permisos

En el detalle de un proyecto, Proveedor del proyecto permite introducir una clave
OpenRouter. La API valida la clave mediante GET /api/v1/key antes de guardarla.
Se persiste cifrada con AES-GCM y AAD de proyecto, proveedor e identificador de clave,
usando el Secret existente del Worker. El valor nunca vuelve en la API del propietario.
El formulario usa un input de contraseña, limpia su estado al terminar y no usa
localStorage. No enviar claves por chat ni añadirlas al repositorio.

Solo un runner autenticado por OIDC para la ejecución RUNNING actual puede obtener
la solicitud y su clave. La entrega se concede una vez; repetirla se rechaza para
evitar invocaciones duplicadas tras una entrega incierta. La clave no se inyecta en
variables de agentes ni en procesos Git. No puede reemplazarse mientras el proyecto
tiene turnos activos. El cambio de identificador invalida usos de la versión anterior.

## Ejecución y recuperación

Enviar crea en una transacción el mensaje del usuario, Task CHAT_TURN, ejecución y
contexto congelado. Incluye solo historial de ese chat y contexto autorizado de ese
proyecto: instrucciones y memoria adicionales, y documentos importados de contexto.
Otros chats y proyectos no forman parte del prompt. Los últimos mensajes se acotan
a 12000 caracteres, incluido el mensaje nuevo; documentos de contexto tienen sus
límites de importación. No implica contexto ilimitado ni una sesión interna permanente.

Workflows usa el TaskEngine y ExecutionBackend existentes. GitHub Actions ejecuta
una solicitud no streaming, con máximo 1024 tokens de salida y timeout de dos minutos.
Respuesta, tokens cuando se exponen y coste se guardan en D1. La PWA consulta el estado;
cerrarla no mantiene ni cancela el runner. El resultado se guarda atómicamente y un
callback idéntico no duplica mensajes. Un callback distinto se rechaza.

La primera respuesta está limitada a 12000 caracteres. Si el proveedor informa que
se alcanzó el límite de tokens se muestra ese estado. No se reintenta automáticamente
una petición de inferencia cuyo resultado sea incierto. El usuario puede iniciar otro
turno conservando el historial; reanudar una sesión de agente es otra integración.

## Coste y calidad de datos

El catálogo procede de GET /api/v1/models. Solo se habilitan IDs `:free` u
`openrouter/free` con precios de entrada/salida cero y sin tarifa por solicitud
cuando se declara. Se verifica de nuevo en el runner antes de la inferencia. No
se envían plugins, herramientas, contenido multimedia ni fallback de modelos.
Si desaparece el modelo elegido se exige seleccionar otro; no se sustituye en silencio.

Tokens son exactos cuando el proveedor los devuelve; si faltan son unavailable.
Coste cero es exact cuando la respuesta lo declara y estimated si se infiere del
catálogo gratuito. Un coste declarado distinto de cero falla el turno y bloquea
nuevas solicitudes de OpenRouter para ese proyecto hasta una revisión. No hay
actualización de presupuesto, plan ni fallback pago.

GET /api/v1/key puede exponer `free_model_daily_requests.remaining` y `.limit`.
Se muestran solo los campos recibidos; nunca se deriva un número de llamadas de un
saldo monetario. `limit_remaining` es el límite monetario restante de la clave, no
el saldo total de la cuenta. Las cuotas gratuitas pueden compartirse entre claves
de una misma cuenta; no son presupuestos aislados de cada proyecto. La observación
tiene fecha; la UI la marca stale después de cinco minutos, una política de frescura
de Cubo. Sin datos, unavailable. Ver [límites oficiales](https://openrouter.ai/docs/api_reference/limits).

## Cancelación

Detener solicita cancelación en el backend y revoca nuevos callbacks y entregas de
credenciales. Si no comenzó ningún despacho puede confirmarse sin crear un runner.
Si pudo comenzar, el TaskEngine solicita cancelación al ExecutionBackend y espera
un estado remoto terminal antes de marcar CANCELLED. Mientras tanto conserva
QUEUED/RUNNING con CANCELLATION_REQUESTED. El cron reconcilia solicitudes pendientes.
Una caída remota no se presenta como cancelación confirmada.

GitHub puede detener el runner; no se afirma que una API de modelos permita detener
su cálculo interno una vez recibida la petición. Su resultado tardío no se acepta.
Una ejecución ya terminada conserva su resultado y no se renombra como cancelada.

## Migración y compatibilidad

0005_chat_turns añade rol con default user a mensajes anteriores, claves cifradas,
turnos y flags de despacho/cancelación. Triggers preservan scope, capacidad y un
turno activo por chat. La reserva global sigue limitando a una ejecución remota.

El flag de despacho se inicializa conservadoramente para escritores antiguos;
los nuevos declaran explícitamente que aún no comenzaron. Publicar primero el
runner compatible: sin protocolVersion 2 mantiene el formato antiguo de importación.
El Worker nuevo emite protocolo 2 y solo entonces habilita CHAT_TURN. No volver a
lectores que etiqueten respuestas como mensajes del usuario ni ignoren project_id.
La migración no borra resultados, chats o checkpoints anteriores.

## Aceptación pendiente

Publicación, cancelación real y límites de la prueba están registrados en
[validación cloud](openrouter-cloud-validation.md).

Pruebas unitarias usan respuestas identificadas como fixtures; no son prueba de
inferencia real. Catálogo público real comprobado desde Node 24: 15 modelos gratuitos
en la observación inicial. Falta configurar una clave desde Cubo y probar un turno
real con cierre/reapertura del cliente. Las métricas de esa prueba deberán registrarse
sin inventar tokens o coste si el proveedor no los expone.
