# Comparación directa de interfaz: Telo y Cubo

Revisión del 2026-10-13. El usuario rechazó la interpretación anterior y fijó las
capturas de Telo como referencia directa de arquitectura, distribución, densidad,
jerarquía y comportamiento. La paleta de Cubo permanece aprobada e intacta.

## Comparación vista por vista

Las siete imágenes están en capturas referencia/ y tienen el prefijo
Captura de pantalla 2026-10-13. Las capturas actuales están en
.impeccable/review/, ignoradas por Git, con el prefijo telo-.

| Referencia | Vista actual | Distribución y adaptación comprobadas |
| --- | --- | --- |
| 003151.png | chat-1440 / chat-390 | Cabecera compacta con modelo, título y acciones; mensajes propios alineados a la derecha; conversación con scroll independiente y compositor inferior. Historial mediante acción y recientes, sin tercera columna permanente. |
| 003237.png | chat-config-1440 / chat-config-390 | Configuración lateral a la derecha, título, agente/modelo, esfuerzo y proyecto. Operaciones de conversación existentes siguen activas; integraciones futuras deshabilitadas. En móvil usa diálogo de ancho completo. |
| 003207.png | tareas-1440 / tareas-390 / proceso-* | Tres métricas, grupo de agentes a la izquierda, filtros, filas amplias y metadatos. Proceso abierto a petición, no inspector que ocupe permanentemente el listado. Estado, eventos, checkpoint, aprobación y resultado proceden del backend. |
| 003217.png | proyectos-1440 / proyectos-390 | Listado primero y acción Nuevo proyecto. El estado vacío sustituye registros inexistentes; la acción abre configuración preparada, sin fingir creación. |
| 003228.png | proyecto-detalle-* / proyecto-contexto-* | Regreso al listado, resumen, instrucciones, memoria, skills, secretos y actividad, en ese orden. La memoria funcional del proyecto no usa MEMORY.md. Todas las operaciones sin backend están deshabilitadas. |
| 003247.png | analiticas-1440 / analiticas-390 | Proyecto/modelo, 7d/30d/90d, tres métricas, actividad y distribución por modelo. Gasto/tokens unavailable; ejecución y gráfica derivadas de tareas reales. No se presentan llamadas de modelos ni consumo ficticio. |
| 003254.png | ajustes-* / proveedores-* / ejecucion-* | Pantalla amplia con seis tabs. Módulos de agentes OpenCode/Codex separados de proveedores OpenAI/Gemini/Groq/NVIDIA. Estado cloud real sustituye daemon, RAM, uptime y métricas de VM. |

Nueva tarea se comprueba adicionalmente en nueva-tarea-1440 y nueva-tarea-390:
proyecto, agente, modelo, esfuerzo, instrucción y adjuntos preparados. Ejecutar
instrucciones está deshabilitado. La validación durable real permanece en un
desplegable secundario, identificado expresamente como validación del motor.

## Proporciones y sistema compartido

- Barra global de 42px a todo el ancho y sidebar de 208px debajo en escritorio.
- Workspace utiliza el espacio restante; módulos con padding de 32px horizontal,
  sin contenedor central flotante ni hero. Cabecera de Chat de 48px.
- Chat reserva scroll a la conversación y mantiene el compositor al pie del pane;
  ancho de lectura máximo de 940px para el compositor y 920px para mensajes.
- A 390px la sidebar es un drawer de 230px, paneles de ancho completo y métricas
  en una columna. Esfuerzo pasa a tres columnas para preservar legibilidad.
- Seis tokens de color idénticos a la versión publicada: base, surface, muted,
  line, accent e ink. Geist local e iconos SVG geométricos conservados.
- AppShell, Sidebar, TopBar, PageHeader, StatusBadge, MetricCard, SectionCard,
  Tabs, EmptyState, TaskRow, ProjectRow, AgentBadge, ProviderCard, ChatComposer,
  ProcessEvent y RightPanel están centralizados en apps/web/src/ui.tsx.

## Evidencia y cierre

Se compararon las siete referencias con 25 capturas de 1440×900 y 390×844.
Chat utiliza mensajes realmente guardados en D1 local; Tareas y sesión se consultan
en cloud en modo GET autenticado, sin crear ejecuciones remotas. No se simulan
respuestas de agentes. El compositor está dentro del viewport y no hay overflow
horizontal. También se comprobaron los módulos inferiores de proyectos/proveedores.

El reviewer confirmó fidelidad general y detectó un ajuste material: centrar Nueva
tarea. Tras aplicar margin:auto y recapturar, lo puntuó como resuelto y dio ship
a esa corrección. DESIGN.md y su sidecar se actualizan desde el código final.

La prueba local de tareas encontró una regresión de navegación al cambiar el inicio
a Chat: enlaces antiguos #task_id abrían Chat. El fallback se corrigió para mantener
Tareas; creación, cierre/reapertura, recuperación móvil y shell offline vuelven a pasar.
Chat conserva creación, mensajes, edición, fijado, exportación y eliminación,
verificados sobre D1. Motor durable, API y esquema no se modificaron en esta iteración.

Puertas locales: 20 tests, 85 comprobaciones, lint, typecheck y build pasan.
build es dry-run y no equivale a publicación. El estado de despliegue se registra
en MEMORY.md después de completar la operación autorizada.
