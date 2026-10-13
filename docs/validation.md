# Validación de Cubo

## Evidencia local actual

Validación del 2026-10-12: bun test (18 tests, 71 comprobaciones), lint, typecheck,
build y check:browser pasaron. La revisión UI confirmó resueltos sus cuatro hallazgos:
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
- D1 real de desarrollo creado y migrado; no hay tareas remotas ejecutadas todavía.

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

## Pendiente para aceptación cloud

Publicación inicial manual en main, token fine-grained, clave de acceso y secreto
de sesión privados, variable CUBO_URL del repositorio y despliegue completo.

Después se ejecutará el protocolo de docs/cloud-setup.md. No marcar pasos 4/5
completos ni atribuir continuidad cloud a pruebas locales o mocks.

## Limitaciones

- Una respuesta de dispatch perdida puede crear un job duplicado; D1 evita efectos
  duplicados, pero no elimina los minutos usados por el job rechazado.
- El polling de Actions tiene plazo máximo de 15 minutos; una cola larga puede
  excederlo y producir fallo explícito.
- La detección de cuota en jobs depende de anotaciones de GitHub y permisos Checks: read.
- Solo hay runner determinista. Codex/OpenCode, repositorios de trabajo, diff y acciones
  de commit/push/PR quedan para los siguientes hitos.
- Checkpoints y resultados son pequeños y residen en D1. Archivos grandes no están implementados.

