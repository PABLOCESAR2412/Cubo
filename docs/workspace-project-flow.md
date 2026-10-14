# Workspace centrado en proyectos

Solicitud del usuario: refinamiento sobre el diseño aprobado, conservando paleta.
La barra superior elimina marca/breadcrumb duplicados, hora y acceso a Ajustes.
Diagnóstico reúne sincronización, última observación, estado cloud, configuración
de Actions y política de presupuesto. El botón de actualización/instalación PWA sigue
disponible. El diagnóstico distingue configuración de disponibilidad de runners.

La sidebar conserva Cubo y ahora ofrece Nuevo proyecto. La navegación muestra
Tareas, Proyectos, Analíticas y Ajustes. Chat se abre desde un proyecto o Recientes;
su ruta sigue existiendo. Recientes contiene únicamente metadata de chats del
propietario, agrupada en Fijados, Hoy, Ayer, Últimos 7 días y Anteriores. No incluye
tareas ni metadata de hora bajo cada chat. Leer o editar mensajes sigue exigiendo
el project_id correcto; el índice de navegación no concede contexto a un modelo.

Proyectos es la vista inicial y entrar desde navegación siempre muestra el listado.
Las tarjetas incluyen nombre, repositorio, cantidad real de chats y acciones de
abrir, editar y renombrar. Edición y renombrado usan el backend y control de versión
existentes. Crear desde sidebar abre el formulario y enfoca el nombre. Se conservan
resumen, conexión SSH, contexto importado, archivos y chats del proyecto.

La importación identifica AGENTS.md/CLAUDE.md y MEMORY.md de la raíz del repositorio.
Se priorizan antes del inventario acotado. Los documentos de contexto de hasta 64 KiB
pueden guardarse como extractos de 4000 caracteres, marcados como tales después de
escanear el contenido completo con los filtros existentes. Si no están disponibles
se indica; no se inventan instrucciones ni memoria. Campos manuales adicionales
siguen siendo independientes y no se sobrescriben. No hay aprendizaje automático
de memoria todavía. MEMORY.md del desarrollo de Cubo sigue separado.

Chat elimina la ventana adicional de historial y la entrada general de conversaciones
persistentes. Mantiene renombrar, fijar, eliminar, copiar y exportar. Un proyecto puede
tener varios chats. Añade selección de modelo y conexión OpenRouter desde el proyecto;
ver [chat con OpenRouter](openrouter-chat.md). Agentes y herramientas siguen pendientes.

QA local en 1440/390: tarjetas, renombrado/edición reales, chat guardado, fijado,
cierre y recuperación, navegación al listado, diagnóstico y proveedor sin clave.
No overflow ni errores JS. El catálogo proviene de la API pública, no de datos simulados.
Inferencia real todavía pendiente de clave. Los screenshots usan una base D1 local
aislada; los mensajes de validación no representan respuestas de un modelo.

Prueba de origen real: openai/openai-agents-python, revisión
2938d87a2837537138dc7839003317a27ed3441f, AGENTS.md recuperado como
extracto de 4000 caracteres marcado. La sonda inicial openai/codex no tenía ese
archivo en la raíz; se corrigió el supuesto de la prueba, sin inventar instrucciones.
