# Workspace de Cubo

Modo: Operate. Rediseño estructural aprobado por el usuario el 2026-10-13.
Referencias: las siete capturas de Telo en capturas referencia/.

## Direction contract

THESIS: Cubo es un lugar de trabajo persistente. La navegación y el estado operativo sustituyen a la pantalla centrada en una demo.
OWN-WORLD: Conservar íntegramente carbón #101416, superficie #171d20, lima #d9ed91, texto y bordes de Cubo. Geist local, controles compactos, superficies planas, iconos geométricos y separadores finos.
STORY: Entrar al workspace, filtrar ejecuciones reales, inspeccionar progreso y logs, revisar resultados y aprobar una continuación. Las integraciones futuras son visibles sin aparentar actividad inexistente.
FIRST VIEWPORT: Barra global de 42px a todo el ancho. Sidebar de 208px debajo, cinco módulos, recientes y estado cloud. Chat ocupa todo el pane con cabecera de 48px, conversación desplazable y compositor inferior; el historial no crea otra columna permanente. Tareas tiene tres métricas y listado de ancho completo; el proceso se abre a petición.
FORM: Las siete capturas de Telo son referencia directa de arquitectura, densidad, jerarquía y comportamiento, junto con el esquema obligatorio del usuario. Construcción mediante código, sin comp inventada. Preservar la paleta de Cubo y adaptar únicamente las verdades del backend cloud; no reinterpretar libremente la distribución.
QUALITY BAR: Paleta intacta, selección y acciones corresponden al mismo task_id, todos los módulos navegan, pendientes claros, métricas derivadas solo de tareas reales, sidebar accesible en móvil y controles sin desbordamientos.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Alcance confirmado

Solo UI: conservar motor durable, API, esquema y Chat persistente existentes.
Telo es referencia directa, no inspiración libre. La paleta de Cubo no cambia.
Conexiones sin backend permanecen explícitamente pendientes/deshabilitadas.

Chat conserva crear, abrir, renombrar, fijar, eliminar, guardar mensajes, copiar y
exportar. No hay respuestas de IA, modelos conectados ni acciones de agentes
simuladas. Tareas usa estados, eventos, checkpoints, aprobaciones y resultado reales.
La validación durable sigue disponible dentro de Nueva tarea como operación
secundaria; ejecutar instrucciones de agentes todavía está deshabilitado.

## Arquitectura visual actual

- TopBar global a todo el ancho; Sidebar estrecha debajo y workspace restante.
- Chat con cabecera, mensajes propios a la derecha, conversación desplazable,
  compositor inferior y configuración a la derecha. Historial mediante acción y
  recientes, sin tercera columna permanente. Capacidades futuras preparadas.
- Tareas: tres métricas, filtros, listado completo y proceso abierto a petición.
- Proyectos: listado vacío real y vista de configuración/detalle preparada con
  resumen, instrucciones, memoria propia, skills, secretos y actividad.
- Analíticas: filtros, tres métricas, actividad real de tareas y distribución
  por modelo vacía. Gasto y tokens unavailable, sin números inventados.
- Ajustes: seis tabs; agentes y proveedores separados, con estado pendiente real.
- En móvil: drawer nativo, paneles de ancho completo, métricas en una columna y
  compositor usable. El footer cloud permanece visible; recientes desplaza su área.

AppShell, Sidebar, TopBar, PageHeader, StatusBadge, MetricCard, SectionCard, Tabs,
EmptyState, TaskRow, ProjectRow, AgentBadge, ProviderCard, ChatComposer, ProcessEvent
y RightPanel comparten implementación y estilos en ui.tsx y style.css.

## Comparación y validación

La revisión comparó las siete referencias con 25 capturas en 1440×900 y 390×844,
incluidos paneles y zonas inferiores. Ver
[comparación vista por vista](telo-interface-comparison.md).
Los mensajes de Chat están guardados en D1 local; las tareas se consultaron en
cloud por GET autenticado. No se lanzaron ejecuciones remotas para esta revisión.

El reviewer confirmó la composición general y pidió centrar Nueva tarea. Tras
margin:auto y recaptura, dio ship a la corrección. DESIGN.md y su sidecar describen
el sistema final. La procedencia de los dos iconos PNG existentes está completa;
no se añadieron imágenes de referencia como assets del producto.

Paleta comprobada contra Git: seis tokens idénticos. Lint, typecheck, build y 20
tests/85 comprobaciones pasan. D1/browser confirma persistencia de Chat y recuperación
de tareas después de cerrar el cliente. Una regresión de enlaces antiguos #task_id
se detectó y corrigió; sigue abriendo Tareas aunque el inicio general sea Chat.
Móvil sin overflow y shell PWA offline comprobados. El motor cloud previo conserva
su aceptación independiente en cloud-validation.md.

La publicación de esta corrección usa la cuenta personal y cubo-dev, con la
autorización existente para commit, push y deploy. Su versión y aceptación remota
se registran al terminar en MEMORY.md.
