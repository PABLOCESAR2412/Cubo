# Configuración compacta de proveedores

Refinamiento visual solicitado el 2026-10-14. Conserva el motor durable, la API,
la paleta y las conexiones existentes. No incorpora proveedores nuevos.

## Composición

- OpenRouter tiene un solo encabezado con estado. La clave y las acciones
  Guardar clave y Obtener clave comparten fila en escritorio; en móvil se apilan.
- Obtener clave es un enlace presentado como botón secundario, con SVG de enlace
  externo. Abre la página oficial de claves de OpenRouter en otra pestaña.
- Uso y límites conserva modelos gratuitos verificados, solicitudes restantes,
  límite monetario, calidad y fecha cuando existen, y Actualizar uso.
- Respaldo y tiempos de respuesta conserva el formulario completo de preferencias.
  Está separado del guardado de la clave para distinguir ambas operaciones.
- Las integraciones pendientes conservan estado, modelos, configuración y uso
  en un desplegable nativo. Continúan deshabilitadas y marcadas como pendientes.

## Validación local

Se utilizó la skill oficial playwright-cli con la herramienta ya disponible
`npx --no-install playwright cli`. Navegador Chrome, viewports 1440×900 y 390×900.
Se revisaron capturas de Chat, Tareas, Proyectos, Analíticas y Ajustes con los datos
locales cargados. No hubo scroll horizontal ni errores JavaScript no controlados.
El chat y proyecto de prueba son fixtures explícitas, no inferencia nueva.

Se comprobó apertura por teclado de Uso y límites, acceso a las preferencias,
destino e icono de Obtener clave, y un rechazo de guardado mediante interceptación
local declarada: se envía una sola petición y se limpia el input. No se utilizaron
ni modificaron claves reales. El error HTTP 400 de esa fixture es esperado.

El panel OpenRouter cerrado midió 326px en escritorio y 359px en móvil, incluido
el aviso de cifrado ausente en el entorno local. Los detalles siguen accesibles.
Los artefactos `artifacts/compact-final-*.png` y el guion de QA son locales ignorados.
Las primeras capturas prematuras se reemplazaron por capturas con carga terminada
y un servidor nuevo para evitar los assets anteriores del proceso de desarrollo.

`bun test`: 38 tests y 211 comprobaciones. Lint, typecheck y build correctos.
La validación de esta iteración es visual y de regresión; no repite ejecuciones de
Actions ni demuestra de nuevo la aceptación cloud del motor durable.

## Publicación

Código `70b078d`, revisión documentada `058b378`, Cubo 1.0.1. Desplegado en el Worker
de desarrollo personal `cubo-dev`, versión `2e844cf5-ee0f-4929-aa87-5c8235ce38ba`.
La ruta autorizada de despliegue verificó identidad y cuenta personal, repositorio
privado y guardia gratuita. No había migraciones nuevas. QA autenticada cloud en
1440/390 confirmó la versión, formulario y desplegables nuevos, sin overflow ni
errores JavaScript, y el resultado durable anterior 91 conservado. No se modificaron
secretos ni se iniciaron nuevos turnos de inferencia. Reviewer: `ship`.

## Continuidad del sistema visual

La comparación de `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, los
componentes modificados y las cuatro capturas finales de Ajustes y sus detalles
abiertos confirma una extensión del sistema existente. Se conservan las seis
variables de color, Geist local, controles de radio 6px, paneles planos con borde
neutral, foco lima y el breakpoint móvil de 767px. Los desplegables reorganizan
información; el enlace externo reutiliza el botón secundario y el sistema SVG.
No se añaden tokens ni se regeneran `DESIGN.md` o su sidecar.

Hay descripciones históricas pendientes de actualización fuera de este alcance:
`PRODUCT.md` todavía presenta la inferencia como pendiente de clave, y la sección
Proveedor general de `DESIGN.md` conserva el estado anterior de publicación y
describe el formulario previo. Las limitaciones actuales se consultan en
`docs/openrouter-chat.md`; la composición de esta iteración se describe arriba.
Esa deriva documental no se convierte en una regla visual ni se corrige aquí.
