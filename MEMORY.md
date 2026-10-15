# Memoria del desarrollo de Cubo

Actualizado: 2026-10-14. Cubo 1.0.0 publicado. Chat minimalista y sesión revocable
comprobados en cloud. Inferencia real aceptada con cierre y recuperación del cliente.

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
- Código actual publicado: 1d8250a. Worker a4843c5e-deae-48bc-b4b1-43008873bbe4.
  Migraciones 0005/0006 aplicadas en D1 personal sin borrar resultados anteriores.

## Cubo 1.0.0 publicado y validado

- Sidebar de altura completa y acciones directas en Recientes. Chat sin proveedor
  en el encabezado, sin Nuevo chat ni Guardado; exportación/configuración con iconos.
  Markdown seguro y fondo transparente. Paleta intacta.
  Barra superior y botón de diagnóstico eliminados; PwaControls reubicado en la sidebar.
  Ancho unificado ampliado un 50% de 760px a 1140px compartido entre Chat, Tareas,
  Proyectos, Analíticas y Ajustes.
  Módulo de Analíticas implementado con telemetría de tokens, gasto, modelos, proveedores,
  desglose por proyecto y modelo, y filtros por periodo (Hoy, 7d, 30d, 90d, Todo).
  Finish reviewer: ship, incluida evidencia adicional del formulario general.
- Nuevo chat se crea desde el proyecto. Abrir chat reutiliza el existente y espera
  la carga del historial; se corrigió una carrera detectada durante la prueba.
- Proveedores se configuran en Ajustes generales por petición del usuario. La clave
  general usa AES-GCM/AAD; claves antiguas de proyecto se conservan sin moverlas.
  Contextos y conversaciones continúan aislados. Solo el runner OIDC autorizado
  recibe la clave; no se entrega a agentes ni se revela al frontend.
- Sesión sin expiración temporal en el backend y con registro revocable en D1.
  Logout revoca el token. Cookie de 400 días renovada al abrir, sometida a políticas
  del navegador; sesión antigua válida se actualiza. Un error de red no simula logout.
  Borrar cookies o rotar el secreto puede exigir autenticación.
- Selector integra modelo, esfuerzo y uso. Los niveles proceden del catálogo;
  cuotas no expuestas permanecen unavailable. Contexto máximo no equivale a saldo.
  Respaldo gratuito explícito, una vez ante HTTP 404/503/429; no tras timeout incierto,
  credencial rechazada o coste inesperado. Este último bloquea la conexión general.
- Adjuntos TXT/MD/HTML/PDF/DOCX/XLSX/PPTX con extracción y preview de texto. Límite:
  cuatro archivos de 5MB, 12000 caracteres por extracto y 24000 totales; PDF hasta
  30 páginas, sin OCR. D1 conserva extractos y nombres, no binarios originales.
  Dictado del navegador con consentimiento; micrófono físico todavía no probado.
- Versión inicial 1.0.0. El build calcula major/minor/patch según commits posteriores
  a version.json, sin crear commits ni tags automáticamente. Ver scripts/version.ts.
- Chat consulta directamente su detalle; polling de dos segundos activo y diez
  inactivo, suspendido cuando está oculto. La cuota no bloquea la carga inicial.
  Catálogo en cache un minuto y revalidación en el runner. GitHub Actions aún añade
  latencia de arranque; no hay streaming. Migración 0006 aplicada en cloud.
- 38 tests y 211 comprobaciones, lint/typecheck/build correctos. QA 1440/390 sin
  overflow, errores JS ni CSP. Se probaron siete formatos, arrastrar archivos,
  acciones en Recientes, reutilización de chat y dictado con callback simulado.
- Incidente local: workerd huérfano en 8851 servía assets404 tras rebuild y fallo
  EPERM del watcher. Se verificó y detuvo solo el proceso propio; servidor nuevo200.
  Primer deploy falló por conexión a GitHub antes de mutar recursos; reintento limpio.
- Turno real: tarea f91dbf75-5b20-4d5c-95c1-8a863c0f45e8, run 38663139233 y chat
  2fa9ca7a-44ca-4ebb-93bf-a2b8c93d0e22 del proyecto 077e6b47-e19b-4ff5-afda-77c3f366f9d7.
  UTC 2026-10-15: cliente cerrado 00:59:31.212, runner conectado 00:59:38.853,
  resultado 00:59:40.726 y reabierto 00:59:53.299. SUCCEEDED / CUBO_OK; tokens
  138/31 y USD 0 exact. D1 confirma task/run/resultado y una respuesta. Recuperación
  en 1440/390; acceso con otro project_id rechazado con 404.
- Adjunto real: tarea 92e3b545-6b3e-4867-a05e-bac0c5e5c3e9, run 38663634664.
  Cliente cerrado 01:04:41.099 UTC, runner conectado 01:04:48.628 y reabierto
  01:05:02.159. SUCCEEDED / CUBO_FILE_OK, tokens 179/69, USD 0 exact. Nombre,
  extracto y respuesta recuperados en escritorio y móvil. Usó la conexión anterior
  del mismo proyecto; no prueba una conexión general todavía sin configurar.
- Sesión cloud sin exp y con jti; cierre/reapertura autenticado. Logout revoca y
  reutilizar su token devuelve401. PWA/CSP/SW/offline y resultado91 conservados.
- El usuario guardó la clave anterior a las 18:12:32.111 UTC. Su turno anterior
  82ecf4fc-2d71-4fe0-8262-7ce347f7b27a tuvo éxito con NVIDIA vía OpenRouter;
  otro falló PROVIDER_REQUEST_FAILED. No se inspeccionaron sus mensajes privados.
- El usuario confirmó guardado general, pero provider_keys sigue vacío y solo
  existe la conexión anterior. No hay turnos activos. La API de guardado general
  pasó prueba con fixture. El usuario confirmó la interfaz nueva. Observación sin
  secretos: GET /api/providers/openrouter y PUT /api/providers/openrouter/preferences
  devolvieron 200, pero no llegó PUT /api/providers/openrouter durante la ventana.
  Se explicó la diferencia entre Guardar preferencias y Guardar clave. Falta esa
  última acción y su mensaje visible; no pedir claves por chat.
- Ver docs/chat-refinement.md y docs/chat-refinement-validation.md. No se leyó ni
  copió ninguna clave del usuario; no se activaron servicios pagos. Próximo paso:
  resolver la configuración general y verificar uso desde otro proyecto.

## Límites y próximos hitos

- Incidente PWA: asset CSS retirado devolvía HTML200 por fallback SPA; confirmado
  contra cloud. Guardia de MIME para /assets, exclusión offline y recuperación
  pública /api/pwa-recovery implementadas. Prueba con caché real de shell antiguo
  recupera app y conserva cookies/localStorage/caché ajena; docs/pwa.md y
  scripts/pwa-recovery-check.ts. No limpia datos de D1 ni credenciales.
  Publicado como1.0.2, código d0bef84, Worker f497132f-6b4d-44ec-bf4e-b8a2584ee0fc.
  Recuperación de shell obsoleto probada también contra cloud: CSS antiguo404,
  CSS actualtext/css, app recuperada y cookies/localStorage/caché ajena conservados.

- Refinamiento acotado de proveedores: clave/Guardar clave/Obtener clave con icono
  externo juntos; uso y respaldo desplegables; integraciones pendientes compactas.
  Playwright CLI revisó cinco vistas en 1440/390, teclado y error de guardado con
  fixture sin secretos. 38 tests/211 comprobaciones, lint/typecheck/build correctos.
  Ver docs/provider-settings-refinement.md. No cambia el backend ni configura claves.
  Publicado como Cubo 1.0.1: código 70b078d, documentación 058b378, Worker
  2e844cf5-ee0f-4929-aa87-5c8235ce38ba. Revisión visual ship; QA cloud 1440/390
  sin overflow ni errores JS, versión y formulario nuevos recuperados y resultado91
  conservado. Sin nuevas migraciones, secretos modificados ni turnos de inferencia.
  La comprobación posterior confirma OpenRouter general configured=true y
  encryptionConfigured=true: el usuario completó el guardado antes pendiente.
  Falta comprobar un turno desde otro proyecto con esa conexión general.
- Skills oficiales actualizadas globalmente: Impeccable 4.5.2 y playwright-cli;
  comandos exactos del usuario ejecutados. Copias locales accidentales apartadas
  reversiblemente fuera del repo; Graphify permanece local. Ver docs/skills.md.

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
