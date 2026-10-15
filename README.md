# Cubo

PWA personal para tareas que viven en el backend y continúan con el cliente cerrado.
MVP de infraestructura **USD 0**: Workers Free, D1, Workflows y GitHub Actions con
runners Linux estándar. Containers y R2 no se utilizan.

## Estado real

Refinamiento actual: chat Markdown minimalista, acciones directas en Recientes,
selector de modelo/esfuerzo/uso, sesión persistente revocable, proveedor general en
Ajustes, dictado según navegador y adjuntos con previsualización de texto. Alcance,
límites y versionado 1.0.0 en [Chat refinado](docs/chat-refinement.md). Estado real
de publicación e inferencia en MEMORY.md.

Implementados localmente: consola React/Vite/Tailwind, API Hono, contratos, persistencia,
motor durable, GitHubActionsExecutionBackend, runner demostrativo, checkpoints,
aprobación de continuación y control de cuota. Codex/OpenCode siguen pendientes.
OpenRouter de texto gratuito está publicado en desarrollo; aceptación real pendiente
de clave del proyecto. La vertical base cloud ya fue validada: runner GitHub real, navegador
cerrado, seis checkpoints en D1 y recuperación de resultado 91 en un navegador nuevo.

Repositorio privado: https://github.com/PABLOCESAR2412/Cubo
URL activa: https://cubo-dev.pctg.workers.dev

Rediseño publicado: workspace oscuro con sidebar, Chat, Tareas, Proyectos, Analíticas
y Ajustes. Tareas usa el backend existente; las integraciones futuras aparecen
como pendientes. El rediseño está publicado en la URL activa de desarrollo.
Chat tiene ahora una primera vertical de persistencia: conversaciones, mensajes,
renombrado, fijado, eliminación y exportación. La nueva inferencia de texto espera
validación real; ver [OpenRouter durable](docs/openrouter-chat.md).
Ver [alcance real de Chat](docs/chat.md) y su estado de publicación.
Proyectos tiene creación/listado, instrucciones y memoria manual, y conversaciones
propias persistentes. La importación GitHub de lectura, archivos acotados y claves
SSH cifradas están implementados. Importación pública validada en cloud con cliente
cerrado; acceso privado pendiente de añadir deploy key de lectura.
Herramientas y tareas mediante agentes siguen pendientes. Ver
[alcance de Proyectos](docs/projects.md) e [importación GitHub](docs/repository-import.md).
Ver [alcance y comprobación de la interfaz](docs/design-workspace.md).
La corrección estructural directa contra las capturas está documentada en
[comparación de interfaz con Telo](docs/telo-interface-comparison.md).

La iteración publicada actual inicia en Proyectos, muestra tarjetas y Recientes solo de
chats, y reúne información técnica en Diagnóstico. Conserva la paleta y permite
identificar instrucciones/memoria del repositorio. Ver [flujo actual](docs/workspace-project-flow.md).

## Comandos

Requisitos: Bun 1.4 o posterior y Chrome para la comprobación de navegador.

```bash
bun install
bun dev
bun test
bun run lint
bun run typecheck
bun run build
bun run check:browser
bun run deploy
```

- `bun dev`: migra únicamente D1 local, prepara assets y arranca API en 8787 y Vite
  en 5173. El bypass de acceso solo funciona en loopback y se pasa al comando local.
- `bun test`: SQL real en SQLite, engine, API, adaptador, seguridad e independencia
  entre paquetes. Las llamadas a GitHub están simuladas en estas pruebas.
- `bun run build`: compila PWA y ejecuta Wrangler con `--dry-run`; no publica.
- `bun run check:browser`: con `bun dev` activo, verifica el build servido en 8787,
  cierre/reapertura del cliente, viewport móvil y shell offline. No prueba cloud.
- `bun run deploy`: valida cuenta personal, coste cero, token, repo privado y workflow
  activo antes de ejecutar todos los checks, verificar secretos existentes, aplicar
  migraciones D1 pendientes y desplegar la vertical. No modifica secretos.
- `bun run db:migrate`: aplica migraciones solo a D1 local.

La PWA guarda el shell offline, no las respuestas privadas de API. Al volver a tener
conexión recupera las tareas desde el backend. En desarrollo sin GitHub configurado
las tareas quedan en cola con un motivo explícito; no se simula ejecución cloud.

## Arquitectura y configuración

- [Alcance funcional objetivo y roadmap](docs/functional-scope.md).
- [Plan actual por verticales](PLAN.md).
- [Proyectos y chats asociados](docs/projects.md).
- [Importación de repositorios y conexión SSH](docs/repository-import.md).
- [Instalación PWA y botón de actualización](docs/pwa.md).
- [Arquitectura durable](docs/architecture.md).
- [Configuración cloud y credenciales](docs/cloud-setup.md).
- [Política de coste cero](docs/cost-policy.md).
- [Validación y pendientes](docs/validation.md).
- [Prueba real con cliente cerrado](docs/cloud-validation.md).
- [Incidente y corrección del hook Windows](docs/hook-incident.md).
- [Memoria compartida del desarrollo](MEMORY.md).
- [Sistema visual implementado](DESIGN.md).

## Próximos hitos

1. Prueba cloud de pausa/aprobación y continuación en otro runner (demo ya implementada).
2. GitHub y proyectos.
3. Planner y agentes Codex/OpenCode.
4. Checkpoints de agentes y continuación.
5. Diff y aprobaciones antes de commit/push/PR.
6. Notificaciones.
7. Múltiples agentes/proveedores.
8. Memoria separada por proyecto.

