# Registro de Versiones de Cubo (Changelog)

Formato Semántico de Versiones (`MAJOR.MINOR.PATCH`):
- **Primer valor (MAJOR - Cambios Grandes):** Reestructuración profunda de arquitectura, cambios de modelo de datos no retrocompatibles o hitos de gran escala.
- **Segundo valor (MINOR - Cambios Medianos):** Nuevas funcionalidades, nuevos módulos o integraciones (analíticas, adaptadores de agentes, flujos de repositorio).
- **Tercer valor (PATCH - Cambios Mínimos):** Corrección de errores, optimizaciones de rendimiento, modularización y endurecimiento de seguridad.

---

## [2.0.0] - 2026-10-16
### Rediseño Tríptico de Escritorio & Modo Claro de Precisión
* **Cambio Grande (Major):**
  - **Modo Claro "Orquestador Light Precision":** Integración completa de tema claro y sincronización con el sistema (oscuro/claro/sistema) replicando con precisión la captura de Stitch MCP (`a57871ae5901470fb15a22ec5e86eaf0`) y preservando la paleta ámbar industrial (`#d9a441` oscuro / `#b88628` claro).
  - **Paleta de Comandos Global (`Ctrl+K` / `⌘K`):** Centro de comando flotante para saltar a cualquier vista, disparar tareas de agentes (OpenCode/Codex), crear proyectos, alternar temas y ejecutar acciones con búsqueda difusa en tiempo real.
  - **Inspector de Diffs Git (Estilo Codex Desktop):** Visualizador de cambios de código con vistas unificada y dividida (*split view*), conteo de líneas añadidas/eliminadas, pestañas de archivos y barra de aprobación explícita de commits para el control plane de Cubo.
  - **Razonamiento Expandible y Comandos Rápidos (Estilo Claude Desktop):** Bloques `<details className="thought-block">` para inspeccionar el pensamiento interno del modelo y barra de comandos rápidos (`/plan`, `/diff`, `/test`, `/run`, `/status`) con medidor de costo integrado.
  - **Telemetría y LED de Runner en TopBar (Estilo Antigravity Desktop):** Barra superior persistente con indicador LED de salud del runner (`Listo · Cloudflare Workers`), selector de rama activa y disparador rápido `+ Nueva Tarea`.
  - **Módulo de Tareas Programadas:** Soporte para tareas automatizadas recurrentes con programación cron, activación/pausa y ejecución directa.
  - **Rediseño Completo de Analíticas:** Vista idéntica a Stitch con gráfico de barras de volumen a 7 días, distribución de modelos de IA con barras de progreso, métricas de eficiencia de inferencia y tabla paginada con exportación CSV.

---

## [1.3.0] - 2026-10-16
### Notificaciones PWA, Ciclo de Tareas de Agentes y Despliegue Cloudflare
* **Cambio Mediano (Minor):**
  - **Servicio de Notificaciones Web y PWA:** Integración de la Web Notification API para avisos en segundo plano cuando una tarea finalice, falle o requiera aprobación de cambios Git (`WAITING_APPROVAL`). Panel de preferencias interactivo en Ajustes.
  - **Lanzador de Tareas de Agentes:** Formulario interactivo en `NewTask` para despachar tareas a los agentes OpenCode y Codex, con soporte de acciones (`plan`, `edit`, `commit`, `push`) y renderizado de progreso en el inspector de tareas.
  - **Integración de Agentes en Runner Efímero:** Ampliación de `scripts/runner-demo.ts` para procesar `AgentTaskInput`, ejecutar herramientas de código, generar diffs y aplicar la barrera de seguridad de Git antes de cualquier mutación de código.
  - **Despliegue a Cloudflare Workers y D1:** Aplicación remota de la migración `0007_tasks_project_id` en D1 `cubo-dev-db` y publicación del Worker `cubo-dev` con Static Assets bajo política de gasto $0.

---

## [1.2.0] - 2026-10-16
### Adaptadores de Agentes, Optimización de Rendimiento y Seguridad Reforzada
* **Cambio Mediano (Minor):**
  - **Adaptadores de Agentes Autónomos:** Implementación de contratos y adaptadores `OpenCodeAgentAdapter` y `CodexAgentAdapter` con ciclo de checkpoints versionados, soporte para `AbortSignal` y preparación para bucle de herramientas.
  - **Barrera de Aprobación de Acciones Git:** Función de control `verifyGitApproval` que bloquea commits, pushes o PRs sin una aprobación explícita registrada en Cubo con digest de diff verificado.
  - **Historial de Versiones en Interfaz:** Visualizador interactivo de versiones y novedades accesible desde la barra lateral y el panel de Ajustes.
* **Cambio Mínimo (Patch / Optimizaciones):**
  - **Optimización UI de Chat:** Aislamiento del temporizador en el componente hoja `<SlowTurnNotice />`, eliminando re-renderizados masivos por segundo de todo el historial de mensajes.
  - **Modularización Clean Code:** Desacoplamiento de `PreparedViews.tsx` en `Analytics.tsx` y `Settings.tsx` independientes, y exportación limpia de barrels de paquetes.
  - **Criptografía Robusta:** Migración de `passwordMatches` a PBKDF2-SHA-256 con 100.000 iteraciones y salt de dominio en Web Crypto API.
  - **Optimización de Base de Datos D1:** Migración 0007 que introduce la columna indexada `project_id` en la tabla `tasks`, eliminando escaneos completos por `json_extract`.
  - **Testing Exhaustivo:** Incorporación de suites automatizadas para adjuntos (`attachments.test.ts`) y adaptadores de agentes (`agents.test.ts`).

---

## [1.1.0] - 2026-10-16
### Módulo de Analíticas de Consumo y Workspace Unificado
* **Cambio Mediano (Minor):**
  - **Módulo de Analíticas:** Telemetría detallada de tokens consumidos (entrada/salida), gasto en USD 0 verificado, conteo de turnos completados y desglose por proyecto, modelo y proveedor.
  - **Filtros Temporales y Gráficos:** Selección de periodos (Hoy, 7d, 30d, 90d, Todo) y visualizador de barras de actividad diaria.
  - **Ampliación de Layout a 1140px:** Ancho unificado ampliado en un 50% en Chat, Tareas, Proyectos y Ajustes, eliminando la barra superior redundante.

---

## [1.0.2] - 2026-10-15
### Estabilidad de PWA y Recuperación de Shells Obsoletos
* **Cambio Mínimo (Patch):**
  - **Guardia MIME para Assets:** Rechazo estricto de rutas de assets no encontradas con 404 para evitar corrupción de CSS por fallback SPA.
  - **Mecanismo de Recuperación PWA:** Endpoint `/api/pwa-recovery` y actualización segura de caché conservando cookies y sesiones.

---

## [1.0.1] - 2026-10-15
### Refinamiento de Proveedores y Conexión General
* **Cambio Mínimo (Patch):**
  - **Cifrado de Claves de Proveedor:** Almacenamiento con AES-256-GCM y AAD vinculado en Ajustes generales sin exponer claves a agentes ni frontend.
  - **Interfaz Compacta:** Formulario unificado de OpenRouter con verificación estricta de modelos gratuitos y opciones de respaldo.

---

## [1.0.0] - 2026-10-14
### Lanzamiento Inicial de Cubo
* **Cambio Grande (Major):**
  - **Arquitectura Serverless Durable:** Desacoplamiento total del cliente mediante Cloudflare Workers, Hono, D1 y Workflows.
  - **Runner Efímero en GitHub Actions:** Ejecución sin servidores permanentes bajo política obligatoria de USD $0 de infraestructura.
  - **Autenticación OIDC:** Verificación criptográfica con los JWKS de GitHub Actions para autorización del runner.
  - **PWA Instalable:** Interfaz React + Vite con Service Worker offline, chats aislados por proyecto y tareas durables.
