# Memoria del desarrollo de Cubo

Actualizado: 2026-10-14. Refinamiento minimalista de Chat implementado y validado
localmente; publicación nueva pendiente. Inferencia real aún sin aceptación.

## Autoridad

Leer AGENTS.md, esta memoria y PLAN.md al iniciar. El alcance objetivo vive en
docs/functional-scope.md; no equivale a funciones entregadas. Esta memoria describe
el desarrollo de Cubo, no es la memoria funcional de proyectos ni concede aprobaciones.

El usuario autorizó commit, push y deploy del trabajo de desarrollo de Cubo.
Esto no autoriza acciones Git de las tareas ejecutadas por Cubo: commit, push y PR
requieren aprobación registrada, vinculada al diff/destino exactos y ejecutada por
el control plane. Esa integración Git de escritura sigue pendiente.

## Decisiones que se conservan

- PWA React/Vite/Tailwind, TypeScript, Bun local, Biome; Hono/Workers, D1,
  Workflows y GitHub Actions estándar ubuntu-latest. Sin Containers, R2 ni Workers Paid.
- Infraestructura USD 0. No planes pagos, larger runners, gasto adicional ni fallback
  pago. GitHub mantiene presupuesto USD 0 con Stop usage y alertas verificados.
- TaskEngine depende de ExecutionBackend; GitHubActionsExecutionBackend es la
  implementación inicial. Agentes, proveedores y skills son conceptos separados.
- Estado, eventos, checkpoints y resultados pequeños viven en D1, fuera del runner.
  Cerrar el cliente no sostiene ni cancela la ejecución. Runner efímero.
- Contexto, claves, APIs/MCPs y skills se autorizan por proyecto. Cada chat tiene
  historial propio; no compartir conversaciones entre proyectos/chats automáticamente.
- Mantener la paleta aprobada de seis tokens y el workspace de Telo. Refinar sobre
  el shell existente, sin reescribir el motor por estética ni fabricar métricas.
- Uso personal sin registro público. Conservar autenticación/autorización en URL pública.

## Cuentas, recursos y comandos

- Cloudflare personal pablocesar.t.g@gmail.com; account ID
  6fcab192a8cc2a3458247ef5c8108a07. simcod.ec es trabajo y nunca destino de Cubo.
- Perfil aislado: XDG_CONFIG_HOME=~/.config/cubo/cloudflare-personal. Verificar
  identidad y account ID antes de mutaciones remotas; no volver a preguntar destino
  mientras siga acordado. Solo recursos cubo-dev* de desarrollo/pruebas gratuitos.
- Worker cubo-dev, Workflow cubo-dev-tasks; D1 cubo-dev-db:
  7b9b60fc-5255-42a3-835f-2ec0f05a393c.
- URL https://cubo-dev.pctg.workers.dev; repositorio privado PABLOCESAR2412/Cubo, main.
  CUBO_URL de Actions verificado. No cambiar dominios, DNS, producción u otros proyectos.
- Wrangler local 4.149.0. bun install/dev/test y bun run lint/typecheck/build/deploy.
  build incluye dry-run, no demuestra continuidad cloud. deploy verifica identidad,
  repo privado, workflow, guardia gratuita, secretos por nombre y migraciones.
- Cuatro Secrets confirmados en Worker: GITHUB_TOKEN, OWNER_PASSWORD, SESSION_SECRET,
  PROJECT_ENCRYPTION_KEY. El usuario configuró el último; no se leyó su valor ni se
  modificaron secretos automáticamente. No rotar la maestra sin migrar ciphertext.
- Archivo privado de acceso fuera del repo, en el perfil personal; no imprimir valores.
  El conector GitHub devuelve 404; Git local/credenciales y Actions funcionan.

## Entregado y comprobado en cloud

- Motor durable demostrativo, OIDC por repo/ref/workflow/run_id, callbacks
  idempotentes, checkpoints, outbox y cuota agotada en cola sin fallback pago.
- Prueba base: tarea 6c644134-73f6-4648-b25d-77b381f9ea9a, run 38351620464,
  seis checkpoints posteriores al cierre del navegador, SUCCEEDED y {sum:91,steps:6}.
  Recuperada desde navegador nuevo; ver docs/cloud-validation.md.
- Chat persistente: crear, renombrar, fijar, eliminar, copiar/exportar y recuperar
  mensajes tras cerrar el cliente. Hasta esta iteración solo guardaba mensajes de usuario.
- Proyectos D1: nombre/repositorio opcional, instrucciones y memoria manual,
  conversaciones con project_id inmutable. Chats anteriores conservados con NULL;
  ocho accesos cruzados rechazados en aceptación previa. Ver docs/projects.md.
- Importación pública GitHub real: tarea 690e3d24-be08-42f3-afc9-b1d4737d3a9a,
  run 38594588505, SUCCEEDED 4/4. Cliente cerrado 16:02:05.525 UTC, runner conectado
  16:02:22.773, resultado persistido 16:02:28.341. SHA Hello-World
  7fd1a60b01f91b314f59955a4e4d4e80d8edf11d y README recuperados en 1440/390 px.
  D1 confirma task_id, run, proyecto, estado y resultado. Demo 91 conservada.
- SSH por proyecto: par Ed25519 válido OpenSSH, privada AES-GCM/AAD cifrada, pública
  únicamente en API del propietario. Cifrado cloud y generación idempotente probados;
  dueño sin OIDC no obtiene credenciales del runner. Importación privada pendiente.
- Proyecto SSH 4e7f8f3e-dff2-4d84-9275-7d7e547459d7 espera que el usuario añada
  la deploy key pública de solo lectura en GitHub. No asumir que ya lo hizo.
- PWA: instalación cuando el navegador ofrece beforeinstallprompt, guía alternativa,
  aviso y botón de actualización de assets publicados, recarga confirmada. Ciclo SW
  real v1/v2 probado en loopback; instalación física aún no validada.
- CSP/headers publicados, SW y shell offline comprobados, API privada 401 y
  recuperación de importación sin violaciones CSP. Estilos inline permitidos para barras.
- Código actual publicado: b5f1250. Worker e979833a-e768-4491-9f7e-5ce992155a1b.
  Migración 0005 aplicada en D1 personal sin borrar resultados anteriores.

## Refinamiento actual, publicación pendiente

- Petición posterior: sidebar ocupa altura completa; Recientes con acciones directas
  de renombrar/fijar/eliminar. Header Chat solo título, iconos de exportar/configurar,
  sin Nuevo chat ni Guardado. Markdown seguro con fondo transparente; medida760px
  compartida con compositor y estado. Paleta conservada. Finish reviewer: ship.
- Nuevo chat se crea en el proyecto; Abrir chat reutiliza el existente y espera la
  carga del historial. Se corrigió una carrera detectada en QA que creaba otro chat.
- Proveedor general en Ajustes, por instrucción nueva. Clave global AES-GCM/AAD;
  se preservan claves antiguas de proyecto sin moverlas automáticamente. Contextos
  de proyecto/chat siguen aislados y solo el runner OIDC autorizado recibe la clave.
- Sesión backend sin expiración temporal, registro revocable en D1. Logout revoca.
  Cookie400d renovada al abrir, por límite de navegador; legacy válido se actualiza.
  Fallos de conexión no simulan logout. Borrar cookies/rotar secreto exige login.
- Selector integra modelo/esfuerzo/uso. Esfuerzos solo anunciados por catálogo;
  cuotas unavailable si no se exponen. No confundir contexto máximo con saldo.
- Respaldo gratuito explícito y único ante HTTP404/503/429. Sin fallback tras
  timeout incierto, respuesta inválida, credencial rechazada ni coste inesperado.
  Coste inesperado bloquea globalmente si se usa conexión general.
- Adjuntos TXT/MD/HTML/PDF/DOCX/XLSX/PPTX: extracción/preview de texto,4 archivos,
  5MB por archivo,12000 caracteres por extracto/24000 total, PDF30 páginas sin OCR.
  No binarios originales en D1; extractos persistidos con mensaje/turno y scope.
  Dictado del navegador con consentimiento; micrófono físico no probado.
- Inicio versión1.0.0; build calcula major/minor/patch desde commits posteriores
  a version.json. Sin commits/tags automáticos. Ver scripts/version.ts.
- Carga de chat directa sin listado previo, polling2s activo/10s inactivo, pausa
  oculto; cuota fuera de carga inicial. Cache catálogo1min y revalidación runner.
  Arranque GitHub Actions sigue añadiendo latencia; no prometer streaming.
- Migración0006 aditiva local: owner_sessions, provider_keys, app_settings,
  chat_messages.attachments. Falta aplicar remota y publicar en cuenta personal.
- 37 tests/206 comprobaciones, lint/typecheck/build correctos. QA1440/390 sin
  overflow/JS/CSP: Markdown con fixture identificada local,7 formatos extraídos,
  dragdrop,gestión Recientes,reutilizar chat y dictado callback simulado.
- Incidente dev: workerd huérfano retenía8851 y devolvía assets404 tras rebuild.
  Proceso propio9444 verificado y detenido; nuevo servidor8852 sirve200.
- Comprobación remota posterior: el usuario guardó la clave a18:12:32.111UTC en
  proyecto077e6b47-e19b-4ff5-afda-77c3f366f9d7. Su turno82ecf4fc-2d71-4fe0-8262-7ce347f7b27a
  SUCCEEDED con nvidia/nemotron-3-ultra-550b-a55b:free, tokens137/675 y USD0exact.
  Otro turno4c8ca6c4-d0a7-45cd-8c90-162a4cc49002 falló PROVIDER_REQUEST_FAILED.
  No se leyó la clave ni se atribuye cierre del cliente a esa ejecución del usuario.
  Conservar conexiónlegacy; el usuario puede guardar su clave en Ajustes generales.
- Próximo cierre: commit/push/deploy autorizado, validar cloud y sesión/logout,
  actualizar esta instantánea. Ver docs/chat-refinement.md.

## Límites y próximos hitos

- Codex/OpenCode, planner, herramientas remotas, skills/MCPs/APIs de agentes,
  diff/aprobaciones Git, memoria aprendida, otros proveedores y notificaciones pendientes.
  Router general de agentes/proveedores/skills/permisos sigue design-only.
- Checkpoints/resultados pequeños en D1; sin artefactos grandes. Importador acota
  inventario/textos y filtra patrones conocidos; no es detector universal de secretos.
- Engine sondea unos 15 minutos; jobs de 10 minutos. Cuota Actions reintenta después
  de 24 horas o acción explícita; no inventar fecha exacta de renovación.
- Pausa/aprobación/nuevo runner probados localmente, aceptación cloud pendiente.
  Cierre del cliente probado; apagado físico de dispositivos no probado.
- No garantizar cancelación del cómputo interno de un proveedor de modelos; sí
  detener runner, bloquear callbacks tardíos y no mostrar confirmación sin evidencia.
- No eliminar proyectos con conexión/historial sin archivado, todavía pendiente.
- Caveman/ponytail globales; Graphify skill/runtime local graphifyy 0.9.88. Definir
  GRAPHIFY_NO_AUTO_REFRESH=1; su CLI puede modificar skills globales. No hay grafo
  generado ni CodeGraphContext. Ponytail no hace poda automática del contexto.
- Hook Impeccable Windows Stop/PostToolUse corregido; evidencia en docs/hook-incident.md.
  No reescribir confianza global. Metadata 10px sigue como deuda, no norma de diseño.

Actualizar esta instantánea al cerrar hitos; conservar decisiones y bloqueos,
no acumular un log de comandos ni memorias divergentes por agente.
