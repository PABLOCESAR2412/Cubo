# Workspace de Cubo

Actualizado: 2026-10-14. Chat minimalista implementado y validado localmente;
la publicación de esta nueva iteración sigue pendiente. Se conserva la identidad
aprobada de Cubo. Ver [comparación Telo](telo-interface-comparison.md),
[flujo de proyectos](workspace-project-flow.md), [sistema visual](../DESIGN.md)
y [contrato del refinamiento](chat-refinement.md).

## Dirección conservada

Cubo es una consola de trabajo persistido: carbón, superficie gris fría, acento
lima, Geist local, controles compactos, bordes finos y superficies planas.
Telo sigue guiando la arquitectura del workspace. El refinamiento de Chat aprobado
por el usuario incorpora la simplificación de las referencias ChatGPT/Claude.
No cambia la paleta ni introduce una dirección visual nueva.

El shell ocupa 100dvh. En escritorio, la sidebar de 208px empieza en el borde
superior y ocupa toda la altura; la barra de 42px empieza a su derecha. Hasta
767px se conserva el drawer nativo de 230px. Los módulos usan padding de
22px 28px 28px, reducido a 20px 14px 24px en móvil. La paleta base de seis tokens
y sus variantes semánticas existentes se conservan en DESIGN.md.

## Composición actual

La barra global reúne instalación/actualización PWA, Diagnóstico y menú móvil.
Diagnóstico conserva sincronización API, última observación, disponibilidad de
la API, configuración de Actions y presupuesto USD 0. El acceso a Cubo no demuestra
cuota ni disponibilidad de runners.

La sidebar conserva marca, Nuevo proyecto, Tareas, Proyectos, Analíticas y Ajustes.
Recientes muestra chats agrupados en Fijados, Hoy, Ayer, Últimos 7 días y Anteriores.
Cada fila incorpora acciones directas con SVG para renombrar, fijar o desfijar y
eliminar. Renombrar abre un diálogo; eliminar pide confirmación. Los títulos largos
usan elipsis y los controles tienen nombre accesible. Recientes desplaza dentro
de su área; Cerrar sesión queda al fondo y Cubo 1.0.0 aparece debajo en este build.
La versión procede del build; no es un texto que deba fijarse en futuras entregas.

Proyectos sigue siendo el inicio. Sus tarjetas reales conservan Abrir, Editar y
Renombrar. El detalle conserva importación, repositorio y contexto manual separado
del contexto importado. Nuevo chat está en los chats del proyecto; Abrir chat
reutiliza el más reciente cuando existe. La importación privada sigue dependiendo
de la deploy key del propietario; ver [importación](repository-import.md).

Chat ocupa el panel con nombre, acciones Exportar y Configuración con iconos,
conversación desplazable y compositor inferior. La cabecera no añade proveedor
ni Nuevo chat; tampoco existe un historial duplicado. El menú de tres puntos
conserva renombrar, fijar y eliminar. Configuración del chat se abre a petición
en una columna de 320px, de 280px hasta 1199px y a ancho completo en móvil.

Mensajes, estados de turno y compositor comparten ancho máximo de 760px. El usuario
mantiene su burbuja a la derecha. El asistente ocupa el ancho disponible sobre fondo
transparente, con Markdown seguro: títulos, listas, enlaces, código y tablas,
sin HTML crudo ni imágenes remotas. Código y tablas limitan su desplazamiento al
contenido. Hora, rol y Copiar permanecen; la etiqueta Guardado se retiró.

El compositor usa radio de 18px, textarea de 14px y una fila para adjuntos, dictado,
modelo con esfuerzo seleccionado, Uso y envío circular. Modelo y Uso abren el mismo
diálogo centrado de hasta 520px, con búsqueda y catálogo público real de OpenRouter.
La API y la familia del modelo se identifican por separado. Los esfuerzos solo
aparecen cuando el catálogo anuncia niveles; no se inventan opciones por familia.
La selección usa superficie carbón, borde y marca lima. El contexto máximo no se
presenta como saldo. Cuota y fecha muestran datos recibidos o indisponibilidad;
el consumo del mensaje se conoce al terminar el turno.

Ajustes / Agentes y proveedores contiene la conexión general de OpenRouter,
respaldo gratuito elegido expresamente y aviso por demora. Se sustituyó el panel
de conexión por proyecto. La clave se introduce desde la PWA; no se solicita por
chat ni se muestra una vez guardada. El contexto, los archivos y las conversaciones
siguen separados por proyecto y chat. OpenCode, Codex y herramientas conservan
su estado pendiente. Sin conexión válida, Chat dirige a Ajustes y no permite enviar.

Dictado usa SpeechRecognition del navegador y añade texto al borrador tras permiso
y aviso previo del posible envío de audio al servicio del navegador. Incompatibilidad
deshabilita el control. Adjuntar o arrastrar TXT, MD, HTML, PDF, DOCX, XLSX y PPTX
extrae texto en el navegador, con vista previa desplegable y retirada. La vista
previa no reproduce la maquetación. Se permiten cuatro archivos de hasta 5MB,
12000 caracteres por extracto y 24000 en total; PDF limita lectura a 30 páginas,
sin OCR. El binario original no se conserva. Ver [límites](chat-refinement.md).

La sesión backend se conserva sin expiración temporal y puede revocarse al cerrar
sesión. La conservación de cookies por el navegador tiene sus propios límites;
no se promete una sesión que sobreviva a borrar cookies. El detalle de renovación,
autorización y compatibilidad se documenta en [Chat minimalista](chat-refinement.md).

## Evidencia de esta iteración

Capturas finales locales en escritorio (1440px) y móvil (390px):

| Superficie | Escritorio | Móvil |
| --- | --- | --- |
| Chat | [Conversación](../artifacts/refined-chat-1440.png) | [Conversación](../artifacts/refined-chat-390.png) |
| Modelo y uso | [Selector](../artifacts/refined-models-1440.png) | [Selector](../artifacts/refined-models-390.png) |
| Ajustes generales | [Ajustes](../artifacts/refined-settings-1440.png) | [Ajustes](../artifacts/refined-settings-390.png) |
| Recientes | — | [Acciones](../artifacts/refined-recents-390.png) |

Las conversaciones y respuestas de estas capturas son fixtures declaradas de QA
almacenadas en D1 local aislada. No son inferencia real ni datos añadidos en cloud.
El catálogo público sí se consultó realmente; su disponibilidad cambia y no se fija
un número de modelos como requisito. La conexión se revisó sin clave configurada.

El cierre de validación comunicado para esta iteración informa 36 tests con 203
assertions y lint, typecheck y build correctos. La QA de navegador informa extracción
de los siete formatos, revisión 1440/390 y ausencia de errores JavaScript,
violaciones CSP y overflow. Artefactos finales: `index-voL4CcLu.js` y
`index-CEZ_fnF4.css`. La revisión de documentación contrasta código y capturas;
no vuelve a ejecutar los comandos de validación.

DESIGN.md y el sidecar local ignorado `.impeccable/design.json` se reconcilian con
la implementación. Los metadatos heredados de 10px siguen siendo deuda de
legibilidad; no forman una escala normativa. Las rampas del sidecar son muestras
sintetizadas y no tokens nuevos de aplicación.

## Límites de aceptación

La publicación de este refinamiento sigue pendiente. El despliegue anterior en
cubo-dev corresponde a `b5f1250`, Worker
`e979833a-e768-4491-9f7e-5ce992155a1b`; ver [aceptación cloud anterior](openrouter-cloud-validation.md).
Esa aceptación no valida la sesión revocable, conexión general ni composición nueva.

Sigue pendiente inferencia real con clave introducida por el usuario en la PWA,
incluida recuperación tras cerrar el cliente. Las fixtures no demuestran consumo
real, respaldo remoto ni cuotas autenticadas. El dictado requiere aceptación con
micrófono físico y navegador compatible; la instalación física PWA sigue pendiente.
La continuidad durable previa conserva evidencia independiente en
[validación cloud](cloud-validation.md).
