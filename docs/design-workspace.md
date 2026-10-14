# Workspace de Cubo

Actualizado: 2026-10-14. Refinamiento local del workspace aprobado, con paleta
intacta. Telo sigue siendo referencia directa de arquitectura, proporciones,
densidad y comportamiento. Ver [comparación](telo-interface-comparison.md),
[flujo actual](workspace-project-flow.md) y [sistema visual](../DESIGN.md).

## Dirección conservada

Cubo es una consola de trabajo persistido: carbón, superficie gris fría, acento
lima, Geist local, controles compactos, bordes finos y superficies planas.
El estado pertenece al backend y la UI muestra datos persistidos y capacidades
disponibles. Una captura o una función implementada no sustituyen su aceptación cloud.

El shell conserva barra de 42px, sidebar de 208px y contenido flexible. Hasta
767px, la navegación abre un diálogo lateral de 230px. Los módulos usan padding
de 22px 28px 28px, reducido a 20px 14px 24px en móvil. La paleta y los tokens
normativos existentes de DESIGN.md se conservan.

## Composición actual

La barra global reúne controles de instalación/actualización PWA y Diagnóstico,
además del menú móvil. Se retiraron Cubo/módulo duplicados, hora y acceso de Ajustes
de esta barra. Diagnóstico abre un diálogo nativo centrado que reúne sincronización
API, última observación, disponibilidad de la API, configuración de GitHub Actions, presupuesto
USD 0 y bloqueo de gasto. Explica que sincronización no demuestra cuota ni
disponibilidad de runners.

La sidebar conserva marca Cubo y acción principal Nuevo proyecto. Navega a Tareas,
Proyectos, Analíticas y Ajustes. Chat mantiene su ruta y se abre desde un proyecto
o Recientes. Recientes solo muestra títulos de chats agrupados en Fijados, Hoy,
Ayer, Últimos 7 días y Anteriores, sin tareas, horas ni captions por conversación.
Su área desplaza internamente; Cerrar sesión queda al fondo.

Proyectos es el inicio. Navegar a Proyectos o pulsar Cubo vuelve al listado.
Las tarjetas compactas muestran nombre, repositorio y número real de chats;
Abrir, Editar y Renombrar usan las operaciones persistentes existentes. La cuadrícula
usa columnas automáticas desde 290px cuando caben, separación de 14px, padding de
16px y radio de 10px. Nuevo proyecto abre el formulario y enfoca el nombre.

El detalle conserva resumen, repositorio y acceso SSH, importación por revisión,
archivos de solo lectura, chats y contexto editable. Instrucciones del repositorio
identifica AGENTS.md o CLAUDE.md de la raíz; Memoria del repositorio identifica
MEMORY.md. Ambos explicitan revisión, extracto o ausencia. Las instrucciones y
memoria manual adicionales se guardan por separado. No hay aprendizaje automático
de memoria. La aceptación pública cloud y la privada pendiente se describen en
[importación de repositorios](repository-import.md).

Chat ocupa el panel completo con cabecera, origen del proyecto, conversación
desplazable y compositor inferior. No añade ventana Historial ni columna de
conversaciones. Conserva renombrar, fijar, eliminar, copiar y exportar. El rol
persistido determina Tú a la derecha y Asistente a la izquierda; las capturas
actuales no contienen respuestas ficticias de un modelo. El selector obtiene
modelos del catálogo API. Proveedor pendiente, Sin herramientas y los estados de
turno expresan la capacidad disponible. Configuración abre a petición y ocupa
todo el ancho en móvil.

El panel Proveedor del proyecto permite configurar OpenRouter desde la PWA con
un campo de contraseña. La integración de texto gratuito está implementada
localmente; agentes, herramientas y escritura Git siguen pendientes. Sin clave,
Chat permite guardar mensajes y muestra el proveedor pendiente. Con configuración
válida, el código ofrece Enviar y turnos persistidos. La aceptación real de
inferencia sigue pendiente de una clave introducida por el usuario; no se solicitan
claves por chat. Ver [alcance y recuperación](openrouter-chat.md).

Tareas conserva tres métricas, filtros, registro completo e inspector a petición.
Analíticas conserva actividad derivada de tareas y calidades de datos explícitas;
no inventa gasto, tokens ni cuota. Ajustes mantiene agentes y proveedores separados.
La validación durable existente permanece como operación secundaria en Nueva tarea.

## Evidencia de esta iteración

Las capturas finales están en `artifacts/`, en escritorio (1440px) y móvil (390px):

| Superficie | Escritorio | Móvil |
| --- | --- | --- |
| Proyectos | [Listado](../artifacts/workspace-projects-1440.png) | [Listado](../artifacts/workspace-projects-390.png) |
| Proyecto | [Detalle](../artifacts/workspace-project-1440.png) | [Detalle](../artifacts/workspace-project-390.png) |
| Chat | [Conversación](../artifacts/workspace-chat-1440.png) | [Conversación](../artifacts/workspace-chat-390.png) |
| Proveedor | [OpenRouter](../artifacts/workspace-provider-1440.png) | [OpenRouter](../artifacts/workspace-provider-390.png) |
| Diagnóstico | [Modal](../artifacts/workspace-diagnostics-1440.png) | [Modal](../artifacts/workspace-diagnostics-390.png) |
| Recientes | — | [Navegación](../artifacts/workspace-recents-390.png) |

Estas imágenes documentan datos reales de una D1 local aislada y operaciones
de UI. Los mensajes introducidos para validar persistencia no son respuestas de
un modelo. El catálogo público de OpenRouter se consultó realmente: se observaron
15 modelos gratuitos, una cantidad que puede cambiar. El formulario se comprobó
sin clave; no demuestra inferencia ni uso de credenciales reales.

La revisión local cubrió tarjetas, renombrado y edición persistentes, chat guardado
y fijado, cierre y recuperación, retorno al listado, diagnóstico y proveedor. El
registro de QA informa ausencia de overflow y errores JavaScript. La validación
de implementación de esta iteración informa lint, typecheck, build y 29 tests con
166 assertions. El bundle revisado es `index-jb7_0pFr.js`, con CSS `index-DwGuiYYU.css`.
Este pase documental no volvió a ejecutar pruebas ni publicó recursos.

DESIGN.md y `.impeccable/design.json` describen la composición implementada y
conservan los tokens aprobados. Los metadatos heredados de 10px, incluido Solo ruta,
siguen documentados como deuda de legibilidad; no se convierten en regla para
nuevas superficies. Las rampas de color del sidecar son muestras sintetizadas,
no nuevos tokens de aplicación.

## Límites de aceptación

Esta iteración está implementada y revisada localmente. Publicación y aceptación
real del turno OpenRouter con cierre/reapertura siguen pendientes. Las pruebas de
proveedor usan fixtures identificadas y no prueban inferencia real. El renderizado
de mensajes de asistente y métricas refleja soporte del código, no una ejecución
real completada durante esta revisión.

La publicación anterior de la UI y Chat persistente corresponde a `fba6305`, Worker
`31e51af7-74f0-42df-ada1-ea28b058c0dc`. Su aceptación remota conserva resultado 91
de la tarea previa y persistencia de Chat. La continuidad cloud del motor tiene
evidencia independiente en [validación cloud](cloud-validation.md). Esas pruebas
anteriores no validan automáticamente el nuevo proveedor ni esta composición local.
