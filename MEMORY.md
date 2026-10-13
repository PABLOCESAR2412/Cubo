# Memoria del desarrollo de Cubo

Última actualización significativa: 2026-10-13, rediseño publicado en GitHub y cubo-dev, verificado.

## Autoridad y decisiones

MEMORY.md comparte el estado de desarrollo entre Codex y OpenCode. AGENTS.md
contiene las reglas principales. Esta memoria no concede permisos ni sustituye
aprobaciones. La memoria de repositorios ejecutados por Cubo es una función futura separada.

- La tarea pertenece al backend y continúa sin una sesión del cliente.
- MVP personal de un usuario. TypeScript, React/Vite PWA, Hono/Workers, D1 y Workflows.
- Bun local, Biome, Tailwind y consola oscura compacta responsive.
- Infraestructura USD 0: se descartaron Containers y Workers Paid. No activar servicios
  pagos, R2, larger runners ni consumo adicional de Actions.
- GitHub Actions con ubuntu-latest es el primer ExecutionBackend. TaskEngine usa la
  interfaz independiente; agentes, modelos y skills son conceptos separados.
- D1 conserva eventos, checkpoints y resultados pequeños de la primera demo.
- Runners efímeros: checkpoint, WAITING_APPROVAL, terminar; aprobar crea una ejecución nueva.
- Agentes futuros Codex/OpenCode; proveedores Gemini/Groq/NVIDIA contemplados mediante
  contratos. No hay llamadas reales ni compatibilidad de modelos validada.
- Commit, push y PR exigen aprobación explícita registrada por Cubo; no publicar
  automáticamente el bootstrap. La aprobación de la demo solo autoriza continuar.
- Mantener AGENTS.md y esta memoria como fuentes compartidas. Skills globales excepto Graphify local.
- Elegir cuenta una vez al iniciar el proyecto; preguntar otra vez solo si cambia o falta.
- Cloudflare personal pablocesar.t.g@gmail.com, account ID 6fcab192a8cc2a3458247ef5c8108a07.
  simcod.ec es trabajo y nunca destino de Cubo.
- Recursos autorizados únicamente cubo-dev* de desarrollo gratuitos. No producción,
  DNS, dominios, otros proyectos ni eliminación de recursos existentes.
- El primer despliegue debe incluir la vertical completa; no afirmar éxito cloud con pruebas locales.

## Implementado y validado localmente

- Pasos 1–3: guía, skills, routing de desarrollo y memoria compartida.
- Monorepo con web, api, shared, database, tasks, runner, agents y providers.
- Contratos Task, TaskStatus, TaskEvent, Execution, Agent, Provider, Approval, Checkpoint, Project.
- PWA, acceso personal, API de creación/consulta/continuación y demo determinista.
- SQL D1, eventos, checkpoints versionados, aprobaciones de continuación y outbox.
- TaskEngine con pasos durables y backend GitHub Actions sustituible.
- Workflow Actions efímero, OIDC validado por repositorio/ref/workflow/run_id y callbacks idempotentes.
- Guardia de gasto cero, cuota agotada en cola, reintento posterior sin fallback pago.
- Comandos Bun implementados. Tests, lint, typecheck y build pasaron en validación local.
- Prueba de navegador con D1 local: cerrar contexto, reabrir y recuperar tarea; móvil
  sin overflow y shell PWA offline. No demuestra ejecución cloud.
- Revisión UI detectó selección/detalle desincronizados y errores borrados por polling;
  corregidos junto con anuncio accesible del estado. Reviewer confirmó cuatro fixes resueltos.
  Validación final: 20 tests, 78 comprobaciones; lint, typecheck y build pasan.
  Prueba cloud real de PWA/API/runner, cierre del cliente y recuperación también pasó.
- README y docs/architecture.md, cost-policy.md, cloud-setup.md y validation.md describen el estado real.
- DESIGN.md y .impeccable/design.json documentan tokens y patrones observados del diseño final.

## Recursos y acceso verificados

- Wrangler 4.149.0 local. OAuth personal aislado en ~/.config/cubo/cloudflare-personal;
  invocar con XDG_CONFIG_HOME y account ID explícitos.
- D1 cubo-dev-db creada y migrada local/remota:
  7b9b60fc-5255-42a3-835f-2ec0f05a393c.
- Worker cubo-dev y Workflow cubo-dev-tasks desplegados con Static Assets y D1.
  Versión vigente: 43e95747-8588-423d-a37d-3ab6f579cf40.
- URL activa https://cubo-dev.pctg.workers.dev. Workers Free confirmado en dashboard
  personal: Gratuito, USD 0, Plan actual. Navegador personal conectado mediante perfil 2.
- Usuario creó https://github.com/PABLOCESAR2412/Cubo.git privado.
- Git local en main y origin configurado para ese repositorio. Usuario publicó el
  bootstrap d4ffeb095da1abf1b128fdf057693830bbc814fb. Rediseño y correcciones cloud
  publicados en a5c21ae por orden explícita del usuario para commit, push y deploy.
  Workflow y runner incluidos. Archivo privado cubo-dev.secrets.json validado;
  identidad, repo y workflow comprobados sin imprimir secretos. La publicación de
  desarrollo no sustituye las aprobaciones de acciones de tareas ejecutadas por Cubo.
  El conector GitHub no sustituye un PAT del Worker.
- GitHub: presupuesto Actions USD 0, Stop usage Yes y alertas de uso incluido On
  verificados por lectura de la cuenta. No se modificó facturación ni plan.
- La cuenta mostró GitHub Pro con descuento USD 0; no asumir que su cuota coincide
  necesariamente con GitHub Free. El bloqueo de uso adicional es obligatorio.

## Prueba cloud y errores resueltos

- CUBO_URL del repo configurado y verificado con la URL activa; sin ampliar el PAT.
- Tarea aceptada: 6c644134-73f6-4648-b25d-77b381f9ea9a.
- Ejecución: 6c644134-73f6-4648-b25d-77b381f9ea9a-1.
- GitHub workflow_run_id: 38351620464; job ubuntu-latest completado con success.
- Workflow Cloudflare: 6c644134-73f6-4648-b25d-77b381f9ea9a-1-dispatch-0, complete/success.
- Browser de prueba cerrado completamente 05:29:21.903 UTC; runner reclamó la tarea
  05:29:25.984 y guardó seis checkpoints después del cierre.
- D1 conserva SUCCEEDED, progreso 6/6 y resultado {sum:91,steps:6}, fechado
  05:30:30.205 UTC. Consulta SQL remota independiente confirma IDs, estado y resultado.
- Browser nuevo abrió Cubo 05:30:37.947 UTC y recuperó la misma tarea/resultado.
  API privada rechaza solicitudes sin sesión; PWA móvil y shell offline verificados.
- Evidencia durable resumida en docs/cloud-validation.md. JSON/capturas locales en
  artifacts/ quedan fuera de Git y no contienen credenciales.
- Dos fallos del adaptador aparecieron solo en Workers: fetch guardado como método
  causaba Illegal invocation; redirect:error no soportado. Corregidos con wrapper
  de fetch y redirect:manual que rechaza 3xx. Regresiones añadidas; tareas fallidas preservadas.
- Hook global Stop Impeccable usaba sintaxis Unix en Windows y devolvía 1 antes del
  motor. Wrapper Windows conserva códigos y pasa pruebas PowerShell/cmd con 0;
  también corregido PostToolUse. Backup y evidencia en docs/hook-incident.md.
  No se alteraron hashes de confianza; cierre automático final depende del host.

## Próximos pasos

- Rediseño estructural inspirado en las siete capturas de Telo implementado:
  sidebar persistente, barra contextual, cinco módulos, listado e inspector compactos,
  conservando la paleta oscura de Cubo. Ver docs/design-workspace.md.
- Tareas conserva el backend real; lógica UI extraída a workspace.ts con selección
  estable y protección ante respuestas atrasadas. Motor durable sin cambios en esta fase.
- Chat, Proyectos y proveedores preparados visualmente, pendientes/deshabilitados.
  Analíticas solo utiliza historial real de tareas; no inventa métricas de modelos.
- Navegación y detalle móviles usan dialog nativo: foco aislado, Escape, retorno
  visible y apertura desde Recientes. QA visual con API cloud en modo solo lectura.
- Validación actual: 20 tests/82 comprobaciones, lint, typecheck y build pasan.
  Creación local, cierre/reapertura, móvil y shell offline pasan en D1 aislada;
  la D1 local anterior respondió 429 por tareas pendientes y no se borró.
- Rediseño publicado en GitHub main y Cloudflare personal cubo-dev. Se conservan
  secretos, D1 y Workflows existentes; sin servicios pagos ni nuevas tareas cloud.
- Comprobación posterior: bundle index-CZe-IC6e.js actual, cinco módulos, diálogos
  móviles, manifest PWA y API privada (401 sin sesión). Tarea 6c644134 recuperada
  con SUCCEEDED y resultado 91. Capturas ignoradas artifacts/deployed-workspace-*.png.
- DESIGN.md y su sidecar actualizados; reviewer confirmó las cuatro correcciones
  finales resueltas. Metadatos de 9–10px registrados como deuda, no norma de diseño.

- La prioridad de ejecución durable solicitada está demostrada. No se añadieron agentes.
- Cambios de desarrollo publicados por autorización explícita del usuario.
- Pausa/aprobación/nuevo runner está probada localmente, pendiente de prueba cloud específica.
- Apagar físicamente PC/teléfono no se probó; el cierre completo del navegador sí.
- Continuar los hitos de proyectos GitHub y agentes únicamente por nueva instrucción.

## Límites y funcionalidades pendientes

- Primera demo calcula sumas de cuadrados; Codex/OpenCode todavía no ejecutan tareas.
- Router general de agentes/proveedores/skills/proyectos/permisos sigue design-only.
- Pendientes: integración de proyectos GitHub, planner, agentes, diff, permisos de
  commit/push/PR, notificaciones y memoria por proyecto.
- Checkpoints/resultados pequeños viven en D1; no hay almacenamiento de artefactos grandes.
- El motor limita sondeo de cada ejecución a unos 15 minutos; la demo usa jobs de 10 minutos.
- Cuota agotada reintenta tras 24 horas o acción del propietario; no conoce fecha exacta de renovación.
- Graphify local graphifyy 0.9.88 en .tools/graphify/.venv. Definir
  GRAPHIFY_NO_AUTO_REFRESH=1 siempre. Su CLI puede actualizar skills globales.
- Copia global anterior de Graphify restaurada tras actualización inicial accidental;
  usar exclusivamente skill/runtime locales. No hay grafo generado ni CodeGraphContext.
- Ponytail simplifica trabajo; no es un sistema automático de poda del contexto.

## Mantenimiento

Leer al iniciar sesión y actualizar solo decisiones, hitos, bloqueos o pendientes
duraderos. Reemplazar estado obsoleto; no acumular comandos, secretos ni logs completos.
