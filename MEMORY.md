# Memoria del desarrollo de Cubo

Última actualización significativa: 2026-10-12, vertical local y preparación cloud.

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
  Validación final local: 18 tests, 71 comprobaciones; lint, typecheck, build y navegador pasan.
- README y docs/architecture.md, cost-policy.md, cloud-setup.md y validation.md describen el estado real.
- DESIGN.md y .impeccable/design.json documentan tokens y patrones observados del diseño final.

## Recursos y acceso verificados

- Wrangler 4.149.0 local. OAuth personal aislado en ~/.config/cubo/cloudflare-personal;
  invocar con XDG_CONFIG_HOME y account ID explícitos.
- D1 cubo-dev-db creada y migrada local/remota:
  7b9b60fc-5255-42a3-835f-2ec0f05a393c.
- Worker previsto cubo-dev, Workflow cubo-dev-tasks; todavía no desplegados.
- URL prevista https://cubo-dev.pctg.workers.dev.
- Usuario creó https://github.com/PABLOCESAR2412/Cubo.git privado.
- Git local inicializado en main y origin configurado para ese repositorio.
  Todavía no hay commits ni publicación. Comprobación actual: remoto vacío y archivo
  privado cubo-dev.secrets.json ausente. El conector GitHub no sustituye un PAT del Worker.
- GitHub: presupuesto Actions USD 0, Stop usage Yes y alertas de uso incluido On
  verificados por lectura de la cuenta. No se modificó facturación ni plan.
- La cuenta mostró GitHub Pro con descuento USD 0; no asumir que su cuota coincide
  necesariamente con GitHub Free. El bloqueo de uso adicional es obligatorio.

## Bloqueos y próximos pasos

1. Usuario publica manualmente la base en main, incluido .github/workflows/cubo-runner.yml.
2. Usuario prepara token fine-grained Actions read/write, Checks read, Metadata read
   y claves privadas fuera del repo según docs/cloud-setup.md. Nunca pedir valores en chat.
3. Configurar variable GitHub CUBO_URL y verificar Workers Free antes de desplegar
   PWA/API/Workflow juntos. No crear un Worker vacío.
4. Probar ejecución real con navegador cerrado, resultado 91 y pausa/reanudación
   desde checkpoint con run_id nuevo. Registrar evidencia; apagar dispositivo requiere prueba del usuario.

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
