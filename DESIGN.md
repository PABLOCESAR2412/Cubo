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
  composer: "16px"
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

Las superficies son planas, delimitadas por líneas y cambios de tono. La tipografía local y las esquinas discretas mantienen una lectura sobria. La arquitectura, distribución y densidad siguen directamente las siete referencias de Telo, conservando íntegramente la paleta de Cubo. Los módulos preparados distinguen funciones pendientes de los datos disponibles. Las capturas documentan la UI local.

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

El workspace ocupa 100dvh. Una barra global de 42px abarca todo el ancho; debajo, la sidebar de 208px comparte fila con contenido flexible. Los módulos usan padding de 22px 28px 28px, sin ancho máximo. Recientes tiene desplazamiento interno y el pie cloud permanece al fondo de la sidebar con tamaño estable.

Tareas muestra tres métricas en una fila y un registro de ancho completo. Ver proceso abre a petición un diálogo lateral derecho de hasta 480px bajo la barra global, sin reservar una columna mientras está cerrado. La cabecera del proceso permanece visible durante el desplazamiento.

Hasta 767px desaparece la columna reservada a la sidebar. La barra conserva 42px, el módulo usa padding de 20px 14px 24px y las métricas y campos pasan a una columna. La búsqueda ocupa toda la fila. La navegación abre un diálogo lateral de 230px; proceso y configuración ocupan todo el ancho bajo la barra. Los diálogos nativos aíslan el foco, cierran con Escape y devuelven el foco al control de apertura. Nueva tarea se centra, mide hasta 620px o el viewport menos 24px y limita su altura al viewport menos 32px.

Chat ocupa todo el panel principal, con cabecera de altura mínima de 54px, conversación desplazable y compositor inferior. Su contenedor flexible descuenta el espacio de los avisos globales para mantener el compositor dentro del viewport. Historial siempre abre un diálogo de hasta 440px, con margen mínimo de 12px; no crea otra columna permanente. Configuración añade una columna de 320px a petición, de 280px hasta 1199px. Mensajes y compositor se limitan a 920px y 940px respectivamente. Proyectos, Analíticas y Ajustes reutilizan paneles, filas y formularios. Los campos usan dos columnas y el resumen de proyecto cuatro, reducidas a una y dos en móvil.

**The Contexto estable Rule.** La navegación y la barra contextual mantienen su posición; cada módulo concentra filtros, datos y acciones en el contenido.

## Elevation & Depth

La profundidad operativa se obtiene mediante tono y bordes de 1px. Las tareas seleccionadas cambian su borde al color de aprobación; las pestañas y navegación activa cambian la superficie. Los paneles y controles no usan sombras decorativas. Los diálogos oscurecen el fondo con negro al 55%.

**The Superficie plana Rule.** Las superficies operativas se separan por líneas y tono. Los fondos modales marcan el contexto temporal de interacción.

## Shapes

Los controles usan radio de 6px, iconos y tags 5px, tareas 8px, paneles y métricas 9px, diálogos centrados 10px y compositor 16px. Las burbujas de mensajes usan esquinas de 16px, con la inferior derecha de 5px. Las pestañas tienen recinto de 7px y botones internos de 5px. El proceso lateral ocupa el área de contenido hasta sus bordes. Los indicadores de estado son círculos pequeños. Marca e iconos usan SVG lineal.

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

La sidebar reúne marca, Nueva tarea, cinco módulos, recientes y estado del sistema. Nueva tarea usa la acción principal de lima sólida a todo el ancho. Recientes se separa de los módulos mediante un divisor; los contadores tienen recinto compacto de borde neutral y fondo carbón. Cada enlace usa padding de 9px 10px y altura mínima de 35px. El módulo activo tiene fondo de aviso, texto claro e icono lima; `aria-current` identifica la página. Recientes recupera la selección de una tarea. En móvil un diálogo nativo sustituye al aside y limita el foco al menú abierto.

### Inspector y progreso

El inspector muestra estado, tarea, ejecutor, intento, progreso y resultado disponible. Actividad, Checkpoint y Datos cambian el contenido dentro del mismo panel. El detalle usa un diálogo lateral a petición, con cabecera fija durante el desplazamiento. Nueva tarea también usa un diálogo nativo y conserva el formulario separado del registro.

La barra nativa de progreso mide 4px. Lleva pista neutral y relleno lima, acompañada de información textual. El registro alinea tiempos con mensajes. Los identificadores y el checkpoint adicional usan un desplegable nativo. Los cambios de estado se anuncian en una región accesible y los errores usan `role="alert"`.

### Historial y mensajes

El historial usa botones compactos de borde neutral y radio de control, separados por 4px. La selección cambia el borde a lima; el título puede partir palabras largas y la fecha usa texto secundario. El listado siempre aparece en un diálogo a petición.

Los mensajes guardados se alinean a la derecha, con autor, fecha, estado textual Guardado, burbuja de superficie, saltos de línea preservados y acción Copiar. Las burbujas llevan borde neutral, padding de 13px 16px y línea de lectura 1.65. La lista tiene separación de 18px y ancho máximo de mensaje del 80%, ampliado al 94% en móvil. El compositor inferior reúne textarea transparente, adjuntos, configuración, selector de modelo/agente, guardado y esfuerzo en una superficie común. El esfuerzo forma un grupo delimitado con fondo carbón; sus opciones siguen deshabilitadas. La cabecera muestra el estado de modelo y la configuración abierta tiene estado activo visible. El resumen persistente de conversación precede a los mensajes con un divisor. Guardar persiste el mensaje; inferencia, herramientas y esfuerzo permanecen pendientes y deshabilitados. La configuración permite renombrar, fijar y eliminar conversaciones. La eliminación requiere confirmación nativa. Los avisos usan `role="status"`; los errores, `role="alert"`.

El menú de tres puntos de la cabecera concentra Renombrar chat, Fijar/Desfijar chat y Eliminar conversación. Renombrar abre la configuración existente. El control SVG mide 32px; el desplegable alineado a la derecha mide 196px, usa superficie plana, borde neutral y radio de 10px. Eliminar conserva color de fallo, separación superior y confirmación nativa. Escape cierra el menú y devuelve el foco al control; salir del menú también lo cierra. Sus acciones se deshabilitan mientras hay una operación en curso o falta una conversación seleccionada. Al enfocar el compositor, su borde se aclara a gris; el contorno lima de los campos conserva el foco visible.

### Métricas y funciones pendientes

Las métricas de tareas y actividad se derivan del historial disponible y explican su alcance. Costes, tokens, modelos y cuotas sin integración muestran indisponibilidad, nunca cifras inventadas. Proyectos, agentes y proveedores reutilizan campos y estados del sistema, con acciones pendientes deshabilitadas. Nueva tarea separa el formulario futuro de IA de la validación durable existente mediante un desplegable.

## Do's and Don'ts

### Do:

- **Do** conservar íntegramente la paleta de Cubo y la arquitectura compacta acordada con Telo.
- **Do** mantener texto explícito junto a cada estado y contador de progreso.
- **Do** conservar el foco visible y las etiquetas accesibles de los controles.
- **Do** mantener navegación e inspector accesibles mediante diálogos en móvil.
- **Do** describir la configuración, los datos y las funciones pendientes con honestidad.

### Don't:

- **Don't** reservar una columna permanente al historial de chat o al proceso cerrado.
- **Don't** presentar métricas inventadas ni capacidades pendientes como funciones activas.
- **Don't** depender solo del color para comunicar un estado.
- **Don't** convertir el detalle operativo en una superficie con sombras decorativas.
- **Don't** ocultar errores de acciones mientras se actualiza el progreso.

