export type VersionType = "major" | "minor" | "patch";

export interface VersionChangeItem {
  category: "feature" | "security" | "performance" | "refactor" | "infra";
  label: string;
  description: string;
}

export interface VersionRelease {
  version: string;
  type: VersionType;
  typeLabel: string;
  date: string;
  title: string;
  summary: string;
  changes: VersionChangeItem[];
}

export const versionHistory: VersionRelease[] = [
  {
    version: "2.0.0",
    type: "major",
    typeLabel: "Cambio Grande (Major)",
    date: "2026-10-16",
    title: "Rediseño Tríptico de Escritorio & Modo Claro de Precisión",
    summary:
      "Transformación integral de la experiencia de usuario inspirada en Claude Desktop, Antigravity Desktop y Codex Desktop. Incorpora modo claro de alta fidelidad basado en Stitch MCP, Command Palette (Ctrl+K), inspector de diffs Git side-by-side/unificado, telemetría y runner status LED, tareas programadas y analíticas avanzadas.",
    changes: [
      {
        category: "feature",
        label: "Modo Claro 'Orquestador Light Precision' (Stitch MCP)",
        description:
          "Implementación completa del tema claro y sincronización con el sistema (oscuro/claro/sistema) preservando la paleta ámbar industrial (#d9a441/#b88628), con tokens CSS variables para fondos, tarjetas y tipografía de precisión.",
      },
      {
        category: "feature",
        label: "Paleta de Comandos Global (Ctrl+K / ⌘K)",
        description:
          "Acceso rápido a cualquier sección, ejecución de agentes, creación de proyectos, cambio de tema y acciones de desarrollo mediante teclado con búsqueda difusa en tiempo real.",
      },
      {
        category: "feature",
        label: "Inspector de Diffs Git (Estilo Codex Desktop)",
        description:
          "Visualizador de cambios de código con vistas unificada y dividida (split view), conteo de adiciones/eliminaciones por archivo, pestañas interactivas y barra de aprobación de commits.",
      },
      {
        category: "feature",
        label: "Bloques de Razonamiento Expandibles & Quick Commands (Estilo Claude Desktop)",
        description:
          "Integración de bloques <details className='thought-block'> para visualizar el pensamiento interno del modelo y barra de comandos rápidos (/plan, /diff, /test, /run, /status) en Chat.",
      },
      {
        category: "feature",
        label: "Barra Superior de Telemetría (Estilo Antigravity Desktop)",
        description:
          "Cabecera global con indicador LED de estado del runner (Workers/Actions), selector de rama activa, acceso directo a la paleta y conmutador rápido de tema.",
      },
      {
        category: "feature",
        label: "Módulo de Tareas Programadas",
        description:
          "Soporte para tareas recurrentes con frecuencias cron (cada hora, diario, nocturno), control de pausa/reanudación y ejecución inmediata.",
      },
      {
        category: "feature",
        label: "Rediseño Completo de Analíticas (Stitch MCP Screen a57871ae)",
        description:
          "Reconstrucción idéntica de la vista de analíticas con gráfico de barras de 7 días, distribución de modelos de IA, eficiencia de inferencia y tabla paginada con exportación CSV.",
      },
    ],
  },
  {
    version: "1.3.0",
    type: "minor",
    typeLabel: "Cambio Mediano (Minor)",
    date: "2026-10-16",
    title: "Notificaciones PWA, Ciclo de Tareas de Agentes y Despliegue Cloudflare",
    summary:
      "Lanzamiento de servicio de notificaciones web en segundo plano, integración del ciclo de ejecución de OpenCode/Codex en el runner con creación de tareas interactivas y despliegue del sistema a Cloudflare Workers con D1.",
    changes: [
      {
        category: "feature",
        label: "Servicio de notificaciones web y PWA",
        description:
          "Integración de la Web Notification API para avisos en segundo plano cuando una tarea termine, falle o requiera aprobación de cambios Git, con panel interactivo de preferencias en Ajustes.",
      },
      {
        category: "feature",
        label: "Lanzador y ciclo de tareas para OpenCode / Codex",
        description:
          "Formulario interactivo en NewTask para despachar tareas a los agentes OpenCode y Codex, con soporte de acciones (plan, edit, commit, push) y renderizado de progreso en el inspector.",
      },
      {
        category: "infra",
        label: "Integración de agentes en runner efímero",
        description:
          "Ampliación de scripts/runner-demo.ts para procesar AgentTaskInput, ejecutar herramientas, persistir diffs y congelar runner en WAITING_APPROVAL antes de cualquier mutación de código.",
      },
      {
        category: "infra",
        label: "Despliegue a Cloudflare Workers y D1",
        description:
          "Aplicación remota de la migración 0007_tasks_project_id en D1 cubo-dev-db y publicación del Worker cubo-dev con Static Assets bajo política de gasto $0.",
      },
    ],
  },
  {
    version: "1.2.0",
    type: "minor",
    typeLabel: "Cambio Mediano (Minor)",
    date: "2026-10-16",
    title: "Adaptadores de Agentes, Optimización de Rendimiento y Seguridad Reforzada",
    summary:
      "Implementación de adaptadores para OpenCode y Codex con barrera de aprobación de acciones Git, optimización de renderizado en Chat (SlowTurnNotice), derivación PBKDF2 en contraseñas y columna indexada project_id en D1.",
    changes: [
      {
        category: "feature",
        label: "Adaptadores de agentes autónomos",
        description:
          "Implementación de OpenCodeAgentAdapter y CodexAgentAdapter con ciclo de checkpoints versionados, soporte para cancelación y preparación para ejecución de herramientas.",
      },
      {
        category: "security",
        label: "Barrera de aprobación para operaciones Git",
        description:
          "Función de control verifyGitApproval que impide commits, pushes o creación de PRs sin una aprobación explícita registrada en Cubo con coincidencia exacta del digest del diff.",
      },
      {
        category: "performance",
        label: "Desacoplamiento de temporizador en Chat",
        description:
          "Aislamiento del temporizador en el componente hoja SlowTurnNotice, eliminando la reconciliación y re-renderizado masivo de todo el historial de mensajes cada segundo.",
      },
      {
        category: "security",
        label: "Derivación PBKDF2-SHA-256 para contraseñas",
        description:
          "Migración de passwordMatches a PBKDF2 con 100.000 iteraciones y salt de dominio en Web Crypto API para máxima resistencia contra ataques de fuerza bruta offline.",
      },
      {
        category: "performance",
        label: "Indexación de project_id en D1 (Migración 0007)",
        description:
          "Incorporación de la columna project_id con índice compuesto en la tabla tasks, erradicando los escaneos completos de tabla mediante json_extract.",
      },
      {
        category: "refactor",
        label: "Modularización de vistas y barrera de paquetes",
        description:
          "Separación de PreparedViews en Analytics.tsx y Settings.tsx independientes, y exportación limpia de OpenRouterProvider, executeDemo e importRepository en los barrels públicos.",
      },
      {
        category: "feature",
        label: "Visor interactivo de versiones y changelog",
        description:
          "Historial completo de versiones disponible directamente desde la interfaz web con detalle de cambios mayores, medianos y mínimos.",
      },
    ],
  },
  {
    version: "1.1.0",
    type: "minor",
    typeLabel: "Cambio Mediano (Minor)",
    date: "2026-10-16",
    title: "Módulo de Analíticas de Consumo y Workspace Unificado",
    summary:
      "Telemetría completa de tokens, cálculo de costes USD 0 verificados, desglose por proyecto y modelo, y expansión unificada del ancho del workspace a 1140px.",
    changes: [
      {
        category: "feature",
        label: "Módulo de Analíticas de consumo",
        description:
          "Telemetría detallada de tokens consumidos, gasto estimado, conteo de turnos y desglose exhaustivo por proyecto, proveedor y modelo.",
      },
      {
        category: "feature",
        label: "Filtros temporales y gráficos",
        description:
          "Selector de rangos (Hoy, 7d, 30d, 90d, Todo) y gráficos de barras de actividad diaria por tokens y turnos.",
      },
      {
        category: "refactor",
        label: "Ampliación de layout a 1140px",
        description:
          "Ampliación del ancho de visualización en un 50% compartido entre Chat, Tareas, Proyectos y Ajustes, eliminando la barra superior redundante.",
      },
    ],
  },
  {
    version: "1.0.2",
    type: "patch",
    typeLabel: "Cambio Mínimo (Patch)",
    date: "2026-10-15",
    title: "Estabilidad de PWA y Recuperación de Shells Obsoletos",
    summary:
      "Protección contra respuestas HTML accidentales en assets y script de recuperación para clientes con Service Worker desactualizado.",
    changes: [
      {
        category: "infra",
        label: "Guardia MIME para assets",
        description:
          "Filtro de rutas en /assets para evitar que archivos CSS o JS eliminados devuelvan HTML 200 debido al fallback de SPA.",
      },
      {
        category: "feature",
        label: "Endpoint de recuperación PWA",
        description:
          "Ruta pública /api/pwa-recovery y script para forzar la recarga limpia de shells obsoletos sin perder cookies ni sesiones.",
      },
    ],
  },
  {
    version: "1.0.1",
    type: "patch",
    typeLabel: "Cambio Mínimo (Patch)",
    date: "2026-10-15",
    title: "Refinamiento de Proveedores y Conexión General",
    summary:
      "Reubicación de claves de proveedores en Ajustes generales con cifrado AES-GCM y validación de modelos gratuitos.",
    changes: [
      {
        category: "security",
        label: "Cifrado general de proveedores",
        description:
          "Almacenamiento de credenciales con AES-256-GCM y AAD vinculado para evitar revelación al frontend o mezcla entre contextos.",
      },
      {
        category: "refactor",
        label: "Formulario compacto de configuración",
        description:
          "Reorganización de campos en Ajustes: clave y guardado agrupados, opciones de respaldo y desplegables compactos.",
      },
    ],
  },
  {
    version: "1.0.0",
    type: "major",
    typeLabel: "Lanzamiento Inicial (Major)",
    date: "2026-10-14",
    title: "Lanzamiento Inicial de Cubo",
    summary:
      "Primera versión funcional de Cubo: motor durable en Cloudflare Workers y D1, runner efímero en GitHub Actions ($0 USD) y PWA offline.",
    changes: [
      {
        category: "infra",
        label: "Arquitectura durable sin coste",
        description:
          "Orquestación durable con Cloudflare Workers, Hono, D1 y Workflows en combinación con GitHub Actions para ejecución efímera.",
      },
      {
        category: "security",
        label: "Seguridad y autenticación OIDC",
        description:
          "Verificación criptográfica estricta de identidad del runner mediante tokens OIDC RS256 oficiales de GitHub Actions.",
      },
      {
        category: "feature",
        label: "Chat persistente y PWA instalable",
        description:
          "Conversaciones durables por proyecto que persisten al cerrar el cliente o apagar el dispositivo.",
      },
    ],
  },
];

export const currentAppVersion = versionHistory[0]?.version ?? "1.0.0";
