# Memoria del desarrollo de Cubo

Actualizado: 2026-10-14. Nueva UI centrada en proyectos y OpenRouter de texto
implementados localmente; publicación y aceptación real de inferencia pendientes.

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
- Último código publicado antes de esta iteración: b821214, documentación a5a6009.
  Worker vigente antes del siguiente deploy: 715b6ee7-a14d-4e4e-aaa6-e4cc1f0672b0.

## Iteración actual, todavía local

- Por petición posterior: Diagnóstico sustituye breadcrumb, hora y ajustes del topbar;
  reúne API/cloud/Actions/presupuesto. Sidebar Nuevo proyecto, Recientes solo chats
  agrupados, sin horas. Chat no figura en navegación; abre desde proyecto o recientes.
- Proyectos inicia en listado de tarjetas con abrir/editar/renombrar reales.
  Fuente de instrucciones/memoria desde AGENTS.md/CLAUDE.md y MEMORY.md de la raíz;
  campos adicionales manuales no se sobrescriben. No hay aprendizaje automático.
- Documentos de contexto hasta 64 KiB se escanean y pueden guardarse como extractos
  de 4000 caracteres señalados. Clone público local de openai/openai-agents-python,
  SHA 2938d87a2837537138dc7839003317a27ed3441f, recuperó AGENTS.md con esa marca.
  La primera sonda openai/codex no tenía AGENTS.md raíz; no era fallo del importador.
- Usuario eligió OpenRouter, solo modelos gratuitos. Adaptador de API de texto,
  clave AES-GCM por proyecto, catálogo verificado, sin plugins ni fallback pago.
  No equivale a Codex/OpenCode. GET /key muestra solo cuotas recibidas, fecha/calidad;
  nunca convertir saldo en llamadas. UI marca datos stale tras cinco minutos.
- CHAT_TURN crea usuario/tarea/contexto congelado atómicamente, usa el backend
  efímero existente y guarda respuesta/uso. Contexto solo del proyecto y chat actual.
  Entrega de solicitud/clave una vez; no reinvocar automáticamente tras incertidumbre.
- Cancelación añade ledger de intención y solicitud durable. Revoca callbacks;
  confirma CANCELLED solo sin despacho posible o tras estado remoto terminal.
  Workflow/cron reconcilian; un fallo remoto conserva cancelación sin confirmar.
- Migración 0005 aditiva aún sin aplicar en cloud. Conserva mensajes viejos como
  user. Legacy writers inicializan intención conservadora; nuevos writers la ponen 0.
  Runner compatible detecta protocolo 2; publicar runner primero y Worker después.
  No hacer rollback a lectores que confundan roles o ignoren project_id.
- 29 tests/168 comprobaciones, lint/typecheck/build pasan. QA local 1440/390:
  tarjetas, edición, chat real guardado/fijado, cierre y recuperación, diagnóstico,
  metadata real del catálogo; sin overflow ni errores JS. Inferencia aún no probada.
- Ver docs/workspace-project-flow.md y docs/openrouter-chat.md. Falta finish reviewer,
  documenter, commit/push/deploy, prueba cloud de cancelación y clave manual para
  aceptar un turno real OpenRouter con cliente cerrado. No pedir claves por chat.

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

