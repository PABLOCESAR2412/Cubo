# Validación de Cubo

## Evidencia local actual

Validación local del 2026-10-13: bun test (20 tests, 78 comprobaciones), lint, typecheck
y build pasaron. check:browser pasó en la fase local del 2026-10-12. La revisión UI confirmó resueltos sus cuatro hallazgos:
identidad selección/detalle, errores persistentes, anuncio accesible y contrato de diseño.

- Contratos y paquetes compilan con TypeScript.
- Tests cubren SQL real con SQLite, creación idempotente, callbacks ordenados,
  reclamación de runner, checkpoints, pausa/aprobación/nueva ejecución y cuota agotada.
- Tests del adaptador usan HTTP simulado. No representan ejecuciones reales de Actions.
- Prueba de navegador: API/PWA local recupera una tarea tras cerrar contexto; viewport
  móvil sin overflow y shell de producción disponible offline.
- Capturas locales en artifacts/console-desktop.png y artifacts/console-mobile.png.
- Build: Vite/PWA y empaquetado Wrangler mediante dry-run, sin publicar.
- Node 24 ejecutó directamente el módulo TypeScript del runner sin instalar dependencias:
  resultado 91. No cubre autenticación OIDC ni callbacks remotos.
- Detector de diseño sin hallazgos; ambos iconos geométricos conservan procedencia embebida.
- D1 real de desarrollo creada, migrada y consultada después de una tarea cloud real.

## Puertas de entrega

```bash
bun test
bun run lint
bun run typecheck
bun run build
bun run check:browser
```

El último comando requiere bun dev activo. Debe ejecutarse después de construir
los assets actuales para que las capturas correspondan al código vigente.

## Aceptación cloud comprobada

El 2026-10-13, bun run scripts/cloud-check.ts pasó contra el Worker publicado:
API protegida, tarea creada desde PWA, GitHub Actions ubuntu-latest, cierre completo
del navegador, seis checkpoints posteriores, SUCCEEDED/91 y recuperación en otro
navegador. Consulta SQL remota confirma task_id, workflow_run_id, estado y resultado.
Ver [cloud-validation.md](cloud-validation.md) para IDs, tiempos y errores corregidos.

La prueba usa claves del archivo privado; nunca genera traces ni guarda cookies.
Solo ejecutarla expresamente para aceptación: crea una tarea real y consume cuota
incluida. artifacts/ contiene evidencia local ignorada por Git.

Pendientes específicos: apagado físico del dispositivo por el usuario y prueba
cloud de pausa/aprobación/continuación. No atribuir esas pruebas a la aceptación actual.

## Limitaciones

El rediseño de workspace tiene una comprobación adicional de los cinco módulos,
filtros y diálogos accesibles en móvil con datos cloud de solo lectura. El build
actual también pasó creación/recuperación local y shell offline en D1 aislada,
sin borrar las tareas anteriores que alcanzaron el límite de concurrencia (429).
Ver [diseño del workspace](design-workspace.md). Esta revisión no es un nuevo
despliegue ni una prueba de agentes reales.

- Una respuesta de dispatch perdida puede crear un job duplicado; D1 evita efectos
  duplicados, pero no elimina los minutos usados por el job rechazado.
- El polling de Actions tiene plazo máximo de 15 minutos; una cola larga puede
  excederlo y producir fallo explícito.
- La detección de cuota en jobs depende de anotaciones de GitHub y permisos Checks: read.
- Solo hay runner determinista. Codex/OpenCode, repositorios de trabajo, diff y acciones
  de commit/push/PR quedan para los siguientes hitos.
- Checkpoints y resultados son pequeños y residen en D1. Archivos grandes no están implementados.

