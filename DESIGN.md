---
name: Cubo
description: Workspace oscuro y compacto para consultar ejecuciones persistentes.
colors:
  base: "#101416"
  surface: "#171d20"
  muted: "#a6b3bb"
  line: "#303b42"
  accent: "#d9ed91"
  ink: "#e9f0f3"
  accent-hover: "#e7fab4"
  accent-ink: "#182010"
  notice: "#20292b"
  error-bg: "#321f23"
  error-ink: "#ffc7ca"
  error-line: "#734247"
  approval-bg: "#262b20"
  approval-line: "#65764c"
  waiting: "#f6cb7a"
  failed: "#ffb3b7"
typography:
  headline:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  inspector-title:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  brand:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "-0.025em"
rounded:
  badge: "5px"
  icon: "5px"
  control: "6px"
  task: "8px"
  panel: "9px"
  dialog: "10px"
  composer: "18px"
  model-dialog: "14px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  panel: "28px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "7px 11px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 11px"
  button-secondary-hover:
    backgroundColor: "{colors.notice}"
  input:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "9px 10px"
  nav-item-active:
    backgroundColor: "{colors.notice}"
    textColor: "{colors.ink}"
  tag:
    textColor: "{colors.muted}"
    rounded: "{rounded.badge}"
    padding: "2px 7px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  new-task-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    width: "min(620px, calc(100vw - 24px))"
  notice:
    backgroundColor: "{colors.notice}"
    textColor: "{colors.ink}"
    padding: "10px 16px"
  notice-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-ink}"
  approval:
    backgroundColor: "{colors.approval-bg}"
    rounded: "7px"
    padding: "12px"
---

# Design System: Cubo

## Overview

**Creative North Star: "Consola de trabajo persistido"**

Cubo usa carbón, gris frío y lima suave para una consola operativa. La densidad compacta permite leer tareas, progreso y acciones sin perder la jerarquía. Una barra global y la navegación lateral mantienen el contexto de trabajo; el contenido ocupa el espacio restante.

Las superficies son planas, delimitadas por líneas y cambios de tono. La tipografía local y las esquinas discretas mantienen una lectura sobria. Telo sigue guiando el workspace; el refinamiento aprobado de Chat simplifica su cabecera y conversación siguiendo las referencias ChatGPT/Claude, conservando íntegramente la paleta de Cubo. Proyectos y Chat distinguen las integraciones pendientes de las acciones disponibles. Las capturas actuales de Chat contienen fixtures declaradas en una D1 local aislada; no acreditan inferencia real.

**Key Characteristics:**

- Fondo carbón y superficies de gris frío.
- Lima suave para acciones, selección y progreso.
- Filas compactas y detalle legible.
- Barra global y navegación lateral estables.
- Chat con compositor inferior y detalles abiertos a petición.
- Estados explícitos con texto y foco visible.

## Colors

La paleta combina neutrales oscuros con un acento luminoso y colores semánticos reservados al estado.

### Primary

- **Lima suave**, token `accent`: marca, acción principal, selección de texto, progreso y estados de ejecución o éxito.
- **Lima clara**, token `accent-hover`: respuesta del botón principal al puntero.
- **Tinta sobre lima**, token `accent-ink`: texto de la acción principal.

### Secondary

- **Ámbar de espera**, token `waiting`: aprobación y funciones pendientes.
- **Rosa de fallo**, token `failed`: estado fallido o cancelado.
- **Aviso de error**, tokens `error-bg` y `error-ink`: fondo y texto del error visible. `error-line` conserva el valor semántico existente, sin uso en los avisos actuales.
- **Superficie de aprobación**, tokens `approval-bg` y `approval-line`: recinto de revisión y continuación; el borde también distingue la tarea seleccionada.

### Neutral

- **Carbón**, token `base`: fondo general e inputs.
- **Gris de superficie**, token `surface`: sidebar, tareas, paneles y diálogos.
- **Tinta clara**, token `ink`: lectura principal.
- **Gris de lectura secundaria**, token `muted`: contexto, tiempos y estado neutral.
- **Gris de separación**, token `line`: bordes, divisores y pista de progreso.
- **Gris de aviso**, token `notice`: avisos, pestañas activas y hover de acciones secundarias.

**The Estado con texto Rule.** Cada estado mantiene una etiqueta comprensible; el color acompaña su significado.

## Typography

**Body Font:** Cubo Geist local, con los fallbacks del frontmatter. El archivo variable admite pesos de 100 a 900 y usa `font-display: swap`.
**Label/Mono Font:** La pila monospace del frontmatter se reserva a tiempos del registro y JSON del checkpoint.

La jerarquía distingue títulos por tamaño y peso sin recurrir a mayúsculas ornamentales. No existe una familia de display independiente. La marca tiene su propia composición tipográfica; los encabezados usan la misma Geist que el cuerpo.

### Hierarchy

- **Headline:** título de módulo; en móvil se reduce a 21px.
- **Inspector-title:** nombre de la tarea dentro del inspector.
- **Title:** nombre de tarea y títulos compactos.
- **Body:** base de lectura y controles que heredan la raíz.
- **Label:** etiquetas de campos, descripciones y mensajes.
- **Mono:** tiempos e identificadores técnicos.
- **Brand:** nombre Cubo junto al cubo lineal SVG.

La base de lectura y los campos usan 13px. Los contadores usan 26px, peso 500 y línea 1.35; en móvil usan 25px. Las acciones comunes usan 12px y peso 600. Los tags y estados usan 11px. La cabecera del chat usa 15px y peso 600, reducidos a 13px en móvil. Los metadatos de 10px presentes son deuda de legibilidad y no forman una escala normativa para nuevas superficies.

**The Lectura numérica Rule.** Los contadores de progreso y resultados usan cifras tabulares; los tiempos e identificadores técnicos usan monospace.

## Layout

El workspace ocupa 100dvh. La sidebar de 208px ocupa toda la altura desde el borde superior; la barra global de 42px y el contenido flexible ocupan la segunda columna. Los módulos usan padding de 22px 28px 28px, sin ancho máximo. Recientes tiene desplazamiento interno; Cerrar sesión permanece al fondo y la versión del build aparece debajo. El estado cloud se consulta desde Diagnóstico.

Tareas muestra tres métricas en una fila y un registro de ancho completo. Ver proceso abre a petición un diálogo lateral derecho de hasta 480px bajo la barra global, sin reservar una columna mientras está cerrado. La cabecera del proceso permanece visible durante el desplazamiento.

Hasta 767px desaparece la columna reservada a la sidebar. La barra conserva 42px, el módulo usa padding de 20px 14px 24px y las métricas y campos pasan a una columna. La búsqueda ocupa toda la fila. La navegación abre un diálogo lateral de 230px; proceso y configuración ocupan todo el ancho bajo la barra. Los diálogos nativos aíslan el foco, cierran con Escape y devuelven el foco al control de apertura. Nueva tarea se centra, mide hasta 620px o el viewport menos 24px y limita su altura al viewport menos 32px.

Chat ocupa todo el panel principal, con cabecera de altura mínima de 54px, conversación desplazable y compositor inferior. Su contenedor flexible descuenta el espacio de los avisos globales para mantener el compositor dentro del viewport. Los chats se abren desde proyectos o Recientes, sin Historial adicional. Configuración añade una columna de 320px a petición, de 280px hasta 1199px. Mensajes, estados del turno y compositor comparten ancho máximo de 760px. El selector de modelo usa un diálogo centrado de hasta 520px o el viewport menos 28px, con altura limitada al viewport menos 40px. Proyectos, Analíticas y Ajustes reutilizan paneles, filas y formularios. Los campos usan dos columnas y el resumen de proyecto cuatro, reducidas a una y dos en móvil.

**The Contexto estable Rule.** La navegación y la barra global mantienen su posición; cada módulo concentra filtros, datos y acciones en el contenido.

## Elevation & Depth

La profundidad operativa se obtiene mediante tono y bordes de 1px. Las tareas seleccionadas cambian su borde al color de aprobación; las pestañas y navegación activa cambian la superficie. Los paneles y controles no usan sombras decorativas. Los diálogos oscurecen el fondo con negro al 55%.

**The Superficie plana Rule.** Las superficies operativas se separan por líneas y tono. Los fondos modales marcan el contexto temporal de interacción.

## Shapes

Los controles usan radio de 6px, iconos y tags 5px, tareas 8px, paneles y métricas 9px y diálogos operativos centrados 10px. El compositor refinado usa el token de compositor y el selector de modelo el de model-dialog. Las burbujas del usuario usan esquinas de 16px, con la inferior derecha de 5px; el asistente se presenta directamente sobre el fondo del chat. El envío usa un botón circular de 32px y los adjuntos recintos de radio 8px. Las pestañas tienen recinto de 7px y botones internos de 5px. El proceso lateral ocupa el área de contenido hasta sus bordes. Los indicadores de estado son círculos pequeños. Marca e iconos usan SVG lineal.

## Components

### Buttons

La acción principal usa lima sólida y tinta oscura; la secundaria usa borde neutral y fondo transparente. Ambas usan padding de 7px 11px y altura mínima de 36px. La variante compacta usa altura mínima de 28px y padding de 4px 8px. Los botones de icono miden 30px por lado y tienen nombre accesible.

El hover principal aclara el fondo; el secundario añade tono de aviso. Las transiciones de fondo y borde duran 150ms con `ease`. El foco visible usa contorno lima de 2px y separación de 3px. Los controles deshabilitados usan opacidad 0.5 y cursor de bloqueo. Movimiento reducido elimina las transiciones.

### Chips

Los tags informativos usan borde neutral, radio de badge y texto compacto. Los estados de ejecución reúnen punto y etiqueta en un recinto de borde neutral y radio de badge; el fallo añade fondo y borde semánticos. Las funciones pendientes usan ámbar y una explicación textual cuando corresponde.

### Cards / Containers

Los paneles comparten superficie, borde y radio de panel. Sus cabeceras reúnen título y acciones con padding de 13px 16px. Resumen y contenido del inspector usan padding de 16px. Las tareas llevan padding de 11px 14px y separación de 8px; la selección cambia el borde. Primero muestran el estado; debajo, título y metadata comparten fila con un bloque derecho de 270px para ID, actualización, progreso y acción. En móvil este bloque pasa debajo del título, con un divisor superior. En móvil el padding de tareas pasa a 12px. Los avisos usan menor radio. La aprobación conserva su acción dentro de la tarea seleccionada.

### Inputs / Fields

Los campos usan fondo carbón, borde neutral, texto claro y caret lima. Las etiquetas visibles preceden a campos y selectores. El foco comparte el contorno de botones. Los checkboxes nativos usan acento lima y miden 16px. Los campos usan padding de 8px 10px. La búsqueda integra SVG y campo en un recinto común. Los filtros permiten salto de línea.

### Navigation

La sidebar reúne marca, Nuevo proyecto, Tareas, Proyectos, Analíticas, Ajustes y Recientes. Nuevo proyecto usa lima sólida a todo el ancho y abre el formulario con foco en el nombre. Cubo y Proyectos vuelven al listado. Chat conserva su ruta y se abre desde proyecto o Recientes. Cada enlace usa padding de 9px 10px y altura mínima de 35px. El módulo activo tiene fondo de aviso, texto claro e icono lima; `aria-current` identifica la página.

Recientes contiene títulos de chats y su selección, agrupados en Fijados, Hoy, Ayer, Últimos 7 días y Anteriores. Los grupos usan texto secundario de 11px y padding de 12px 9px 5px. Cada fila añade acciones SVG directas de renombrar, fijar o desfijar y eliminar; tienen nombre accesible y se deshabilitan durante la operación. Renombrar abre un diálogo nativo; eliminar exige confirmación. Los títulos largos usan elipsis. No añade tareas, horas ni captions por chat. En móvil un diálogo nativo sustituye al aside y limita el foco al menú abierto.

### Diagnóstico

La barra global conserva menú móvil, controles PWA y Diagnóstico. Marca y módulo duplicados, hora e icono de Ajustes se retiraron de la barra. Diagnóstico abre un diálogo nativo centrado de hasta 520px o el ancho disponible menos 28px. Reutiliza superficie, borde y radio de diálogo; alinea etiquetas secundarias a la izquierda y valores a la derecha, separados por líneas y padding vertical de 10px. Cerrar y Escape permiten salir.

El diálogo reúne sincronización API, última observación, disponibilidad de Cubo cloud, configuración de GitHub Actions, presupuesto de infraestructura USD 0 y bloqueo de gasto. Explica que acceso a Cubo no mide disponibilidad ni cuota de runners. Conserva etiquetas explícitas cuando faltan datos.

### Inspector y progreso

El inspector muestra estado, tarea, ejecutor, intento, progreso y resultado disponible. Actividad, Checkpoint y Datos cambian el contenido dentro del mismo panel. El detalle usa un diálogo lateral a petición, con cabecera fija durante el desplazamiento. Nueva tarea también usa un diálogo nativo y conserva el formulario separado del registro.

La barra nativa de progreso mide 4px. Lleva pista neutral y relleno lima, acompañada de información textual. El registro alinea tiempos con mensajes. Los identificadores y el checkpoint adicional usan un desplegable nativo. Los cambios de estado se anuncian en una región accesible y los errores usan `role="alert"`.

### Conversación y mensajes

La cabecera muestra el nombre del chat y acciones Exportar y Configuración con iconos; no añade proveedor ni Nuevo chat. Crear conversaciones corresponde al proyecto. Los mensajes distinguen Tú y Asistente según el rol persistido, con hora y Copiar, sin etiqueta Guardado. El usuario se alinea a la derecha, con burbuja de superficie, borde neutral, padding de 13px 16px, línea de lectura 1.65 y saltos de línea preservados. La lista tiene separación de 18px y el usuario ocupa hasta el 80%, ampliado al 94% en móvil. El asistente ocupa el ancho disponible a la izquierda, con texto de 14px y Markdown sobre fondo transparente. Listas, títulos, enlaces, tablas y código conservan jerarquía; tablas y código limitan su desplazamiento al contenido. El renderizado omite HTML crudo e imágenes remotas.

El compositor inferior reúne textarea transparente de 14px, adjuntos, micrófono, modelo con esfuerzo seleccionado y Uso en una sola fila de controles. Modelo y Uso abren el mismo diálogo nativo con búsqueda, catálogo gratuito de OpenRouter, familia y contexto. Solo se ofrecen esfuerzos anunciados por la API; sin niveles no aparece ese campo. La selección usa superficie carbón, borde neutral y marca lima. La cuota muestra únicamente datos recibidos con su calidad y antigüedad; el contexto máximo se explica por separado y el consumo por mensaje se conoce al terminar el turno. Sin conexión general, un aviso dirige a Ajustes y Enviar permanece deshabilitado. Los estados incluyen cola, ejecución y cancelación pendiente de confirmar. Los avisos usan `role="status"`; los errores, `role="alert"`.

Dictado solicita permiso y avisa del servicio de reconocimiento del navegador antes de añadir texto al borrador. El control se deshabilita cuando no hay soporte. Adjuntar o arrastrar TXT, MD, HTML, PDF, DOCX, XLSX y PPTX extrae texto en el navegador; cada adjunto permite desplegar el extracto y retirarlo. La vista previa muestra texto, no la maquetación del archivo. El borde del compositor cambia a lima durante el arrastre. Los límites y errores se describen en [Chat minimalista](docs/chat-refinement.md).

La conexión OpenRouter y las preferencias de respaldo gratuito y aviso por demora se editan en Ajustes / Agentes y proveedores. La conexión es general del propietario; los archivos, mensajes y contexto siguen aislados por proyecto y chat. La clave se introduce desde la PWA, sin revelarla en la UI. La aceptación de inferencia real sigue pendiente. Las capturas actuales usan fixtures explícitas de QA en D1 local aislada y catálogo público real, sin clave configurada.

El menú de tres puntos de la cabecera concentra Renombrar chat, Fijar/Desfijar chat y Eliminar conversación. Renombrar abre la configuración existente. El control SVG mide 32px; el desplegable alineado a la derecha mide 196px, usa superficie plana, borde neutral y radio de 10px. Eliminar conserva color de fallo, separación superior y confirmación nativa. Escape cierra el menú y devuelve el foco al control; salir del menú también lo cierra. Sus acciones se deshabilitan mientras hay una operación en curso o falta una conversación seleccionada. Al enfocar el compositor, su borde se aclara a gris; el contorno lima de los campos conserva el foco visible.

### Métricas y funciones pendientes

Las métricas de tareas y actividad se derivan del historial disponible y explican su alcance. Costes, tokens, modelos y cuotas sin integración muestran indisponibilidad, nunca cifras inventadas. Agentes y proveedores reutilizan campos y estados del sistema, con acciones pendientes deshabilitadas. Nueva tarea separa el formulario futuro de IA de la validación durable existente mediante un desplegable.

### Instalación y actualización PWA

El aviso de actualización es una superficie compacta fija en la esquina inferior derecha, con fondo de superficie, borde neutral y texto claro. Usa radio de 12px, padding de 14px, separación de 12px y margen de 18px al borde; su ancho máximo es el viewport menos 28px. Hasta 767px reduce margen a 14px, padding a 12px y separación a 9px. El icono SVG, título y contexto acompañan la acción lima Actualizar y el control de cierre con nombre accesible. Anuncia disponibilidad mediante `role="status"`; los errores usan `role="alert"`.

Posponer retira el aviso y deja una acción secundaria compacta Actualizar en la barra global. Actualizar abre una confirmación nativa antes de recargar y recuerda guardar borradores. Instalar aparece en la barra únicamente cuando el navegador ofrece la instalación; Ajustes → Apariencia conserva la guía para buscar la opción en el navegador. Estos controles reutilizan la paleta, el foco y los estados de los botones existentes; no cambian el shell ni reservan una columna adicional.

### Proyectos y contexto

Proyectos es el inicio y presenta una cuadrícula de tarjetas reales, con columnas automáticas de al menos 290px cuando caben y separación de 14px. Cada tarjeta usa superficie, borde neutral, radio de 10px y padding de 16px. Reúne nombre de 16px, repositorio, cantidad real de chats y acciones Abrir, Editar y Renombrar. El hover aclara el borde. Renombrar muestra campo y guardado dentro de la tarjeta; Editar abre el contexto del proyecto. En móvil las tarjetas ocupan el ancho disponible y sus acciones permiten salto de línea. Las URLs largas pueden partir palabras. Nuevo proyecto abre nombre y URL GitHub opcional; la importación se inicia desde el detalle.

El detalle conserva Volver a Proyectos, título y Abrir chat, seguido de paneles para resumen, repositorio y conexión, contexto importado, archivos de solo lectura, instrucciones, memoria manual, chats y conexiones pendientes. Guardar contexto confirma persistencia mediante un aviso textual. El resumen muestra repositorio, número de chats, Importación por revisión y versión del contexto. Los chats abren su conversación propia; resumen y configuración identifican el proyecto. Recientes ofrece el índice persistido sin añadir otro historial en Chat. Eliminar proyecto vacío exige confirmación nativa y queda deshabilitado cuando contiene chats; los rechazos del backend se muestran como error.

Skills, MCPs, variables/secretos y tareas mediante agentes se presentan como filas con etiqueta Integración pendiente, divisores y padding vertical de 9px. La memoria editable está disponible; el aprendizaje automático permanece pendiente. Los errores y confirmaciones reutilizan los avisos accesibles del sistema.

### Proveedor general

OpenRouter se configura en Ajustes / Agentes y proveedores. Reutiliza clave en input de contraseña, conexión, selección de modelo gratuito y datos de uso disponibles. Las preferencias de respaldo y tiempo de aviso usan el mismo formulario, separado por un borde superior. La clave se configura en la PWA. La disponibilidad del catálogo es variable; no se fija una cantidad de modelos como regla de diseño. Los datos mantienen calidad exact, estimated, stale o unavailable. El detalle de uso usa columnas automáticas de al menos 200px cuando caben, con separación de 12px. La conexión general nueva y su aceptación de inferencia real siguen pendientes de publicación y clave respectivamente. Este proveedor de texto no habilita agentes ni herramientas.

### Repositorio y archivos importados

Repositorio y conexión reutiliza la cabecera de panel con Actualizar como acción secundaria compacta. El selector de acceso público o privado SSH y la acción lima Importar repositorio comparten el formulario de dos columnas; hasta 767px se apilan. Las explicaciones delimitan la lectura por revisión y los textos acotados. Durante una operación se bloquean sus controles; una importación activa impide iniciar otra desde el panel. Las filas de importación llevan divisor superior, padding vertical de 10px y margen superior de 10px; muestran estado textual, progreso de cuatro etapas, ID abreviado y Ver proceso. En móvil permiten salto de línea.

El acceso SSH muestra un aviso cuando falta configurar el cifrado. Generar clave del proyecto permanece deshabilitado hasta que esté disponible. Una clave creada usa un textarea de solo lectura, fingerprint monospace y Copiar clave pública; la guía ordenada usa texto secundario de 12px y línea 1.7, con enlace a deploy keys de GitHub. El panel explica que debe conservarse el acceso de lectura. La disponibilidad del cifrado y la clave se comunica mediante controles y avisos existentes; no cambia la paleta.

Contexto importado muestra revisión monospace y resumen preformateado. Instrucciones del repositorio identifica AGENTS.md o CLAUDE.md de la raíz; Memoria del repositorio identifica MEMORY.md. Ambos muestran revisión y extracto cuando corresponde, o su ausencia explícita, separados de instrucciones y memoria manual adicionales. Archivos · solo lectura distingue inventario y textos guardados. El explorador usa lista de 240px y visor flexible, separados por 14px; lista y texto limitan su altura a 360px y admiten desplazamiento. Las rutas usan controles de 12px, padding de 7px 9px y radio de 5px; selección y hover comparten fondo carbón y borde neutral. Una ruta sin texto guardado queda deshabilitada y lleva Solo ruta. Hasta 767px el explorador pasa a una columna, con lista de hasta 200px; texto y rutas parten palabras largas. Solo ruta de 10px sigue siendo deuda de legibilidad, sin convertirse en tamaño normativo.

Ver proceso abre el inspector existente en Tareas. El resultado muestra cantidad de textos y SHA; Checkpoint conserva etapa, revisión, digest y fecha en la misma superficie. El shell concentra la marca en la sidebar y el estado técnico en Diagnóstico. Las capturas históricas de repositorio documentan el clone público local y el estado SSH sin cifrado de ese entorno; su aceptación cloud pública posterior se documenta aparte. El acceso privado sigue pendiente.

## Do's and Don'ts

### Do:

- **Do** conservar íntegramente la paleta de Cubo y la arquitectura compacta acordada con Telo.
- **Do** mantener texto explícito junto a cada estado y contador de progreso.
- **Do** conservar el foco visible y las etiquetas accesibles de los controles.
- **Do** mantener navegación e inspector accesibles mediante diálogos en móvil.
- **Do** describir la configuración, los datos y las funciones pendientes con honestidad.

### Don't:

- **Don't** añadir otro historial a Chat ni reservar una columna al proceso cerrado.
- **Don't** presentar métricas inventadas ni capacidades pendientes como funciones activas.
- **Don't** depender solo del color para comunicar un estado.
- **Don't** convertir el detalle operativo en una superficie con sombras decorativas.
- **Don't** ocultar errores de acciones mientras se actualiza el progreso.

