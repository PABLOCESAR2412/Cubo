# Cubo

PWA personal para tareas que viven en el backend y continúan con el cliente cerrado.
MVP de infraestructura **USD 0**: Workers Free, D1, Workflows y GitHub Actions con
runners Linux estándar. Containers y R2 no se utilizan.

## Estado real

Implementados localmente: consola React/Vite/Tailwind, API Hono, contratos, persistencia,
motor durable, GitHubActionsExecutionBackend, runner demostrativo, checkpoints,
aprobación de continuación y control de cuota. Codex/OpenCode y proveedores reales
siguen pendientes. La vertical cloud ya fue validada: runner GitHub real, navegador
cerrado, seis checkpoints en D1 y recuperación de resultado 91 en un navegador nuevo.

Repositorio privado: https://github.com/PABLOCESAR2412/Cubo
URL activa: https://cubo-dev.pctg.workers.dev

Rediseño publicado: workspace oscuro con sidebar, Chat, Tareas, Proyectos, Analíticas
y Ajustes. Tareas usa el backend existente; las integraciones futuras aparecen
como pendientes. El rediseño está publicado en la URL activa de desarrollo.
Ver [alcance y comprobación de la interfaz](docs/design-workspace.md).

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
  activo antes de ejecutar todos los checks y desplegar la vertical.
- `bun run db:migrate`: aplica migraciones solo a D1 local.

La PWA guarda el shell offline, no las respuestas privadas de API. Al volver a tener
conexión recupera las tareas desde el backend. En desarrollo sin GitHub configurado
las tareas quedan en cola con un motivo explícito; no se simula ejecución cloud.

## Arquitectura y configuración

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

