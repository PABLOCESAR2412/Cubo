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
