# Cubo
## Platform
web / PWA.
## Stack
TypeScript, React, Vite, Tailwind, Bun, Hono, Cloudflare Workers Free, D1 y Workflows; GitHub Actions estándar.
## Users
Un usuario personal que lanza y consulta tareas desde PC o móvil.
## Product Purpose
La tarea vive en el backend y sigue ejecutándose cuando se apaga el dispositivo.
## Capabilities and Constraints
El alcance funcional objetivo y sus puertas de cierre se definen en
[docs/functional-scope.md](docs/functional-scope.md). Es un objetivo aprobado,
no una lista de capacidades ya implementadas.
Primera vertical: crear tarea demostrativa, persistir, ejecutar remotamente, guardar progreso y consultar resultado.
Checkpoint antes de aprobación; nueva ejecución para continuar. Codex/OpenCode se incorporan después.
Infraestructura del MVP USD 0. Cuenta Cloudflare personal y repositorio privado PABLOCESAR2412/Cubo.
## Confirmed visual preference
Chat dispone de persistencia y gestión de conversaciones/mensajes, sin inferencia.
Ver [docs/chat.md](docs/chat.md) para el estado de aceptación y publicación.
Consola oscura, compacta y responsive. Sin datos ficticios presentados como ejecuciones reales.
Telo es referencia directa de arquitectura de interfaz, distribución, densidad,
jerarquía y comportamiento. Conservar paleta Cubo. Shell global, sidebar estrecha,
workspace completo y Chat con compositor inferior; no reinterpretar como dashboard.

## Prioridad funcional

Motor durable, UI definitiva, Chat, Proyectos/GitHub, agentes, aprobaciones Git,
memoria, proveedores, notificaciones y analíticas/cuotas. Avanzar por verticales
funcionales. Preservar el motor validado; no reescribirlo por estética.

Actualización 2026-10-14: diseño actual y paleta aprobados. Refinar Chat con
interacciones de ChatGPT/Claude. Siguiente vertical: proyectos persistentes con
repositorio opcional y chats asociados; APIs, MCPs, skills, memoria y secretos
aislados por proyecto, historial aislado por chat. Ver [PLAN.md](PLAN.md).
Groq con Q; no Grok. Modelos/cuentas gratuitas o suscripciones requieren verificar
compatibilidad y condiciones antes de habilitarse. Sin registro público; conservar
acceso privado existente. Analíticas, modo claro y herramientas avanzadas siguen
siendo funcionalidades objetivo, no integraciones disponibles.

