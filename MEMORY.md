# Memoria del desarrollo de Cubo

Última actualización significativa: 2026-10-14, proyectos persistentes y chats asociados publicados y comprobados en cloud.

Alcance objetivo ampliado y registrado en docs/functional-scope.md: equivalencia
funcional de Telo adaptada a cloud, sin heredar soluciones de VM. Orden aprobado:
motor durable, UI, Chat, Proyectos/GitHub, agentes, aprobaciones Git, memoria,
proveedores, notificaciones y analíticas/cuotas. Una ejecución activa global,
cancelación completa y métricas exact/estimated/stale/unavailable son requisitos
objetivo, no capacidades implementadas. Chat persistente ya entregado;
inferencia y sesiones de agentes siguen pendientes.
Mantener USD 0, aislamiento y aprobación Git como reglas transversales; conservar
motor validado. El alcance no equivale a capacidades implementadas.

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
  Versión vigente: 31e51af7-74f0-42df-ada1-ea28b058c0dc.
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

## Estado entregado y próximos pasos

- Shell Telo y paleta Cubo aprobados. Barra 42px, sidebar 208px, cinco módulos,
  Chat con scroll propio/compositor inferior, Tareas con proceso abierto a petición.
  Componentes compartidos en ui.tsx; legacy #task_id recupera Tareas correctamente.
- Chat persistente D1 con renombrar, fijar, eliminar, copiar y exportar. Migración
  0002 aditiva, idempotencia y CAS; inferencia unavailable. Ver docs/chat.md.
- Pruebas cloud de Chat: cierre completo, recuperación móvil, gestión, exportación,
  eliminación y rechazos por conflicto/origen/token pasan. API sin sesión 401.
  Demo durable previa SUCCEEDED/91 conservada; no se ejecutaron agentes reales.
- Deploy comprueba identidad, recursos gratuitos, secretos existentes por nombre
  y migraciones; no reescribe credenciales. Ver docs/ui-refinement.md para versión.
- Proyectos persisten registros, instrucciones, memoria manual y chats vinculados.
  Proveedores, importación GitHub, MCPs, APIs y skills del proyecto pendientes.
  Analíticas solo usa tareas reales. Seguir PLAN.md y docs/projects.md.
- Pausa/aprobación/nuevo runner probados localmente; aceptación cloud pendiente.
  Cierre completo del cliente probado; apagado físico de dispositivos no probado.
- Metadata de 10px conservada como deuda de legibilidad, no norma de diseño.

## Refinamiento visual del 2026-10-14

- Segunda pasada sobre el shell aprobado, sin cambiar paleta ni backend.
  Sidebar con acción primaria sólida, recientes y contadores más claros;
  Chat con cabecera, burbujas y compositor refinados; Tareas con filas compactas
  y bloque derecho alineado de ID, actualización, progreso y acción.
- Chat desplaza los mensajes nuevos al final. Esfuerzo/modelos/agentes continúan
  pendientes; no se simulan respuestas. Ver docs/ui-refinement.md.
- 25 capturas en 1440×900 y 390×844, sin overflow horizontal. Chat D1 local
  recuperado tras cerrar cliente; tareas cloud consultadas sin nuevos runners.
  Reviewer final: ship, sin correcciones materiales. Paleta: seis tokens intactos.
- Tests 20/85, lint, typecheck y build pasan. Commit 489f660 en main;
  Worker cubo-dev versión b68049fd-b364-49bf-a78a-cfb7beaf2504, cuenta personal.
  Bundle index-CrMG5Lq1.js comprobado, cinco módulos, móvil, PWA y API privada 401.
  Tarea anterior SUCCEEDED/91 conservada; Chat D1 cloud recuperado tras cerrar
  cliente y registro de prueba eliminado. Sin nuevos runners, migraciones o secretos.
  Primer intento de deploy falló por ConnectionRefused en GitHub antes de mutar
  Cloudflare; segundo intento completo correcto, sin cambiar código ni credenciales.

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

## Alcance aclarado y siguiente vertical: 2026-10-14

- Diseño actual y paleta aprobados: refinar Chat con interacciones de ChatGPT/Claude,
  conservar shell y motor. PLAN.md registra secuencia, dependencias y aceptación.
- Proyecto con nombre y repositorio opcional primero; chats y tareas asociados
  después. Base de proyectos y chats implementada; importación pendiente. No perder chats existentes
  al asociarlos ni compartir historial entre chats automáticamente.
- APIs, MCPs, skills, variables, archivos y memoria autorizados por proyecto;
  agentes/subagentes reciben solo contexto y permisos de su ejecución.
  Compartir entre proyectos/chats queda fuera de alcance. Mantener acceso privado.
- Groq con Q confirmado; Grok/xAI fue interpretación errónea. OpenCode Zen/Go,
  cuentas ChatGPT/Codex, Google y Claude requieren compatibilidad y condiciones
  verificadas. Herramientas remotas/multimedia y orquestación son capacidades futuras.
- Analíticas 7/30/90/rango, modo claro, almacenamiento visible y versiones semánticas
  registrados como objetivo. No inventar cuotas ni acceso gratis a APIs.
- La iteración de acciones directas de Chat conservó endpoints existentes.
  La ampliación posterior añade proyectos D1 y scope de conversaciones, sin proveedores.
- Menú Acciones del chat: renombrar, fijar/desfijar y eliminar con confirmación;
  cierre por Escape y salida de foco. Burbujas/compositor refinados sin cambiar
  tokens de paleta. Layout flexible corrige recorte del compositor con avisos.
- QA local: gestión desde menú, recuperación tras cerrar cliente, borrado del
  registro de prueba, menú y compositor dentro de 390px con aviso activo; escritorio
  1440px, cinco módulos y sin overflow. Reviewer ship, sin correcciones pendientes.
  20 tests/85, lint, typecheck y build pasan. Commit 08b0581 en main;
  Worker b94e3e55-2d74-4c4a-a859-bb4653c628ca, cubo-dev personal.
  Bundle index-C1TF_vXu.js comprobado; PWA, móvil, cinco vistas y API privada pasan.
  Menú y gestión de Chat probados en D1 cloud, cierre/reapertura y borrado del
  registro propio; demo previa SUCCEEDED/91. Sin runners nuevos ni cambios de secretos.

## Base de proyectos y chats asociados

- Migración aditiva 0003: projects y conversations.project_id NULL para chats
  anteriores. FK y trigger impiden reasignación; borrado de proyecto con chats bloqueado.
- Crear/listar/detalle, nombre y URL GitHub opcional, instrucciones y memoria manual,
  chats del proyecto y recuperación por URL implementados. No clona repositorios.
- API autenticada y scope SQL obligatorio en consultas/mutaciones de Chat;
  sin project= solo se accede a chats anteriores. No compartir historiales.
  La sesión del propietario administra todos los proyectos; permisos de runner pendientes.
- D1 local: dos proyectos/contextos distintos, chats, ocho accesos cruzados rechazados,
  cliente cerrado y recuperación móvil; chats anteriores intactos. 1440/390 sin overflow.
  Tests 20/86, lint, typecheck y build pasan; motor sin cambios, ningún runner nuevo.
- Importación SSH/GitHub, secretos cifrados, herramientas y tareas por proyecto
  pendientes. docs/projects.md define compatibilidad y rollback sin borrar datos.
- Commit 3db24b3 publicado; migración 0003 aplicada a cubo-dev-db personal.
  Worker a21025b3-ca79-49ab-bb0f-23c2a1afb21f; bundle index-d1baOXPe.js comprobado.
  Prueba D1 cloud confirma dos proyectos, contextos/chats aislados, ocho rechazos
  de scope, cierre y recuperación. Registros propios borrados; anteriores intactos.
  Chat anterior, cinco vistas, PWA, móvil y API privada (incluido projects 401) pasan.
  Demo anterior SUCCEEDED/91 conservada; sin nuevos runners o secretos modificados.

## Mantenimiento

Leer al iniciar sesión y actualizar solo decisiones, hitos, bloqueos o pendientes
duraderos. Reemplazar estado obsoleto; no acumular comandos, secretos ni logs completos.
