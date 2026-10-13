# Workspace de Cubo

Modo: Operate. Rediseño estructural aprobado por el usuario el 2026-10-13.
Referencias: las siete capturas de Telo en capturas referencia/.

## Direction contract

THESIS: Cubo es un lugar de trabajo persistente. La navegación y el estado operativo sustituyen a la pantalla centrada en una demo.
OWN-WORLD: Conservar íntegramente carbón #101416, superficie #171d20, lima #d9ed91, texto y bordes de Cubo. Geist local, controles compactos, superficies planas, iconos geométricos y separadores finos.
STORY: Entrar al workspace, filtrar ejecuciones reales, inspeccionar progreso y logs, revisar resultados y aprobar una continuación. Las integraciones futuras son visibles sin aparentar actividad inexistente.
FIRST VIEWPORT: Sidebar fija de 232px con marca, nueva tarea, cinco módulos, recientes y sistema. Barra contextual de 56px. Tareas muestra resumen compacto, filtros, listado y un inspector de ejecución a la derecha.
FORM: Workspace dirigido por las capturas y el esquema explícitos del usuario; excepción de seed por estructura ya fijada. Referencias de composición, no comps que deban copiarse píxel a píxel. Construcción mediante código.
QUALITY BAR: Paleta intacta, selección y acciones corresponden al mismo task_id, todos los módulos navegan, pendientes claros, métricas derivadas solo de tareas reales, sidebar accesible en móvil y controles sin desbordamientos.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Alcance confirmado

Solo UI, sin backends nuevos ni cambios al motor durable. Chat y Proyectos tienen
estructura preparada y acciones no disponibles deshabilitadas. Analíticas puede
agrupar las tareas disponibles, pero no inventa tokens, costes, latencias de servidor
ni distribución de modelos. Ajustes muestra estado/configuración observable; agentes
y proveedores pendientes permanecen separados. Mantener autenticación, callbacks,
idempotencia, checkpoints y aprobación del backend existente.

Las etiquetas técnicas de consola fueron solicitadas por el usuario. Son nombres
de campos, navegación o metadatos; no introducir kickers decorativos sobre encabezados.

## Implementación y comprobación

El rediseño está implementado localmente. Tareas conserva creación, consulta,
polling, filtros, logs, checkpoints, resultado y aprobación de continuación del
backend existente. La extracción de su lógica a workspace.ts no cambia el motor.
Chat, Proyectos y proveedores muestran integraciones pendientes y controles
deshabilitados. Analíticas deriva conteos y actividad del historial disponible;
no presenta consumo de modelos ni costes inventados.

En escritorio, sidebar persistente y listado con inspector; en móvil, navegación
y detalle utilizan dialog nativo con aislamiento de foco, Escape y retorno al
control visible. Recientes abre el detalle de la tarea seleccionada.

La revisión visual usa el frontend local con consultas autenticadas de solo
lectura a la API cloud. Capturas en .impeccable/review/ (ignoradas por Git): los
cinco módulos, nueva tarea y vistas móviles. No se crean tareas cloud en esta
revisión. El driver espera el detalle antes de capturar el inspector.

La comprobación del build en navegador usa una D1 local aislada en
artifacts/workspace-local-state, después de encontrar 429 por tareas activas de
pruebas anteriores. No se borraron registros ni se modificaron límites. Creación,
cierre del cliente, recuperación móvil y shell PWA offline pasan en esa instancia.

Tests: 20 pasan, 82 comprobaciones. Lint, typecheck y build pasan; build incluye
solo dry-run de Wrangler. La prueba durable cloud anterior permanece documentada
en cloud-validation.md; esta iteración no repite ejecuciones remotas ni despliega
la UI. El rediseño queda disponible para revisión antes de publicar.

La revisión final confirmó cuatro correcciones resueltas: navegación móvil fuera
del foco al cerrarse, apertura desde Recientes, foco/Escape/retorno del inspector
y actualización de DESIGN.md con su sidecar. Dictamen ship para esas correcciones;
no equivale a autorización de despliegue. Los metadatos de 9–10px existentes se
registran como deuda de legibilidad, sin convertirlos en norma para nuevas vistas.
