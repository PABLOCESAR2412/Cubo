# Aceptación de Cubo 1.0.0

Fecha local: 2026-10-14, America/Guayaquil. Timestamps de la prueba remota en UTC
del 2026-10-15. Código publicado 1d8250a; Worker
a4843c5e-deae-48bc-b4b1-43008873bbe4. Cuenta personal, cubo-dev, servicios gratuitos
existentes. Migración 0006 aplicada sin borrar conexiones, chats ni resultados.

## Validación local y visual

37 pruebas y 206 comprobaciones pasaron antes del despliegue, junto con lint,
typecheck y build. Se añadió después una prueba del guardado general de la clave
con fixture local, sin credenciales reales ni cambios de comportamiento.
Suite final: 38 pruebas y 211 comprobaciones, todas correctas.

QA en Chrome a 1440 y 390px: cero errores JS/CSP y sin scroll horizontal. Mensajes,
compositor y estado comparten medida. Acciones directas de renombrar/fijar/eliminar,
reutilizar chat del proyecto y dictado mediante callback simulado funcionaron.
El test detectó y corrigió una carrera de Abrir chat durante la carga del historial.

Se extrajeron y previsualizaron TXT, MD, HTML, PDF, DOCX, XLSX y PPTX de fixture.
Arrastrar y elegir archivo funcionaron. HTML no ejecutó scripts. No se probaron
macros, OCR ni reproducción de la maquetación original: no forman parte del alcance.
El dictado con micrófono físico sigue pendiente. Las fixtures están identificadas
en una base D1 local aislada y no se publicaron como respuestas de agentes.

Finish reviewer devolvió ship; la evidencia adicional del formulario general
también fue aprobada. Incidente local: un workerd huérfano en 8851 servía assets404
tras rebuild y EPERM del watcher. Se verificó PID/ruta/puerto y se detuvo solo ese
proceso propio; un servidor nuevo sirvió assets200. No se cambió código para ocultarlo.

El primer intento de deploy falló conectando a api.github.com/user antes de mutar
Cloudflare. Una comprobación HTTPS posterior devolvió200 y el segundo intento
terminó limpio, con validaciones, migración y publicación correctas.

## Inferencia real con cliente cerrado

Se utilizó la conexión existente del proyecto, sin leer su clave ni copiarla a otro
proyecto. Se envió desde la PWA una instrucción breve al modelo gratuito
nvidia/nemotron-3-ultra-550b-a55b:free y se cerró completamente el navegador.

| Campo | Valor |
| --- | --- |
| project_id | 077e6b47-e19b-4ff5-afda-77c3f366f9d7 |
| conversation_id | 2fa9ca7a-44ca-4ebb-93bf-a2b8c93d0e22 |
| task_id | f91dbf75-5b20-4d5c-95c1-8a863c0f45e8 |
| execution_id | f91dbf75-5b20-4d5c-95c1-8a863c0f45e8-1 |
| workflow_run_id | 38663139233 |
| Cliente cerrado | 00:59:31.212 UTC |
| Runner conectado | 00:59:38.853 UTC |
| Respuesta persistida | 00:59:40.726 UTC |
| Cliente reabierto | 00:59:53.299 UTC |
| Estado / respuesta | SUCCEEDED / CUBO_OK |
| Tokens entrada / salida | 138 / 31 |
| Coste declarado | USD 0, exact |

El runner empezó después del cierre. D1 confirmó task/run/estado/resultado y un
solo mensaje de asistente. La respuesta se recuperó en contextos nuevos a 1440 y
390px sin overflow. Un acceso con otro project_id devolvió404. No se atribuye a
esta prueba un apagado físico de los dispositivos.

## Sesión, PWA y preservación

Una segunda prueba envió un Markdown real desde la PWA y cerró el cliente. El
modelo leyó el extracto y devolvió CUBO_FILE_OK. Tarea
92e3b545-6b3e-4867-a05e-bac0c5e5c3e9, run 38663634664, chat
d304b242-b97d-4f2c-a31e-972dcf48ca23 del mismo proyecto con conexión anterior.
Cliente cerrado 01:04:41.099 UTC, runner conectado 01:04:48.628 y cliente reabierto
01:05:02.159. SUCCEEDED, 179 tokens de entrada, 69 de salida y USD 0 exactos.
Nombre/extracto del adjunto y respuesta se recuperaron en 1440 y 390px. Esta prueba
no valida una conexión general todavía ausente.

Una sesión creada en cloud no tiene exp en el JWT y sí identificador revocable.
Cerrar y reabrir el navegador con su cookie conservó acceso. Logout eliminó la
sesión del backend: reutilizar ese token devolvió401. No se revocaron sesiones
del usuario ni se modificó SESSION_SECRET. La duración de almacenamiento de la
cookie sigue sometida a las políticas del navegador; ver contrato de sesión.

Se comprobó versión1.0.0, sidebar desktop desde y0, formulario general habilitado,
preview de Markdown adjunto y ausencia de Guardado. PWA/SW/offline, CSP sin
violaciones, snapshot anterior del repositorio y resultado91 se conservaron.

## Límites y cierre pendiente

La configuración general está publicada y su API pasó guardado/cifrado con fixture.
El usuario confirmó guardado general, pero la observación posterior encontró
provider_keys vacío y la conexión anterior intacta. No había turnos activos. Se
pidió versión visible y mensaje de Guardar clave para distinguir caché de UI,
validación de credencial o error real; todavía no se asigna una causa sin evidencia.

Inferencia mediante conexión general espera configuración. El intento en otro
proyecto se detuvo antes de despachar un job al detectar que faltaba esa conexión.
La prueba de adjunto posterior usó explícitamente el proyecto con conexión anterior.
El respaldo remoto no se forzó:
los rechazos, límites e incertidumbre tienen cobertura unitaria. No se promete
streaming ni eliminar la latencia de arranque de GitHub Actions.
