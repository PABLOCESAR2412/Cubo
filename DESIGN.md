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
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  inspector-title:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 500
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
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.03em"
rounded:
  badge: "4px"
  icon: "5px"
  control: "6px"
  task: "7px"
  panel: "8px"
  dialog: "10px"
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
    padding: "9px 13px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  button-secondary-hover:
    backgroundColor: "{colors.notice}"
  input:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
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
    width: "min(480px, calc(100vw - 32px))"
  notice:
    backgroundColor: "{colors.notice}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  notice-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-ink}"
  approval:
    backgroundColor: "{colors.approval-bg}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
---

# Design System: Cubo

## Overview

**Creative North Star: "Consola de trabajo persistido"**

Cubo usa carbón, gris frío y lima suave para una consola operativa. La densidad compacta permite leer tareas, progreso y acciones sin perder la jerarquía. La navegación estable permite cambiar entre módulos y volver a las ejecuciones recientes. El inspector amplía la tarea seleccionada.

Las superficies son planas, delimitadas por líneas y cambios de tono. La tipografía local y las esquinas discretas mantienen una lectura sobria. La estructura inspirada en Telo conserva la paleta de Cubo. Los módulos preparados distinguen funciones pendientes de los datos disponibles. Las capturas documentan la UI local.

**Key Characteristics:**

- Fondo carbón y superficies de gris frío.
- Lima suave para acciones, selección y progreso.
- Filas compactas y detalle legible.
- Navegación lateral y barra contextual estables.
- Diálogos nativos para navegación e inspector en móvil.
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
- **Aviso de error**, tokens `error-bg`, `error-ink` y `error-line`: mensaje de error visible con fondo, texto y borde específicos.
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

- **Headline:** título de módulo; en móvil se reduce a 22px.
- **Inspector-title:** nombre de la tarea dentro del inspector.
- **Title:** nombre de tarea y títulos compactos.
- **Body:** base de lectura y controles que heredan la raíz.
- **Label:** etiquetas de campos, descripciones y mensajes.
- **Mono:** tiempos e identificadores técnicos.
- **Brand:** nombre Cubo junto al cubo lineal SVG.

Los contadores usan 26px, peso 500 y línea 1.3; en móvil usan 24px. Las acciones comunes usan 13px y peso 500. Los tags y estados usan 11px. Los metadatos de 9–10px presentes son deuda de legibilidad y no forman una escala normativa para nuevas superficies.

**The Lectura numérica Rule.** Los contadores de progreso y resultados usan cifras tabulares; los tiempos e identificadores técnicos usan monospace.

## Layout

El workspace ocupa el viewport. La sidebar fija de escritorio mide 232px y el contenido usa una columna flexible con `minmax(0, 1fr)`. La barra contextual permanece arriba, mide 56px y lleva 28px de padding horizontal. El módulo tiene ancho máximo de 1680px y padding de 28px 28px 32px.

Tareas separa registro e inspector mediante 22px. El inspector mide 330px, permanece a 78px del borde superior y limita su altura al viewport menos 100px. Desde 1600px mide 370px, la separación pasa a 26px y el módulo usa padding de 32px 36px. Hasta 1199px el inspector vuelve al flujo y Proyectos pasa a una columna.

Hasta 767px desaparece la columna reservada a la sidebar. La barra mide 52px, el módulo usa padding de 20px 14px 28px y las métricas pasan de cuatro a dos columnas. La búsqueda ocupa toda la fila y los filtros se ajustan al ancho disponible. La navegación abre un diálogo lateral de 248px; el inspector abre un diálogo a 10px de los bordes laterales y 62px del superior. Ambos usan aislamiento de foco y cierre con Escape mediante `dialog` nativo.

Chat separa historial, conversación y compositor. El historial ocupa 220px en escritorio; hasta 1199px lo sustituye un diálogo nativo de ancho máximo 420px, con 12px de margen mínimo al viewport. Su configuración ocupa 320px en escritorio y 280px hasta 1199px; hasta 767px abre un diálogo nativo que ocupa el contenido bajo la barra de 52px. Mensajes y compositor se limitan a 920px. Proyectos, Analíticas y Ajustes reutilizan paneles, filas y formularios del workspace.

**The Contexto estable Rule.** La navegación y la barra contextual mantienen su posición; cada módulo concentra filtros, datos y acciones en el contenido.

## Elevation & Depth

La profundidad operativa se obtiene mediante tono y bordes de 1px. Las tareas seleccionadas cambian su borde al color de aprobación; las pestañas y navegación activa cambian la superficie. Los paneles y controles no usan sombras decorativas. Los diálogos de navegación e inspector oscurecen el fondo con negro al 55%; Nueva tarea usa 65%.

**The Superficie plana Rule.** Las superficies operativas se separan por líneas y tono. Los fondos modales marcan el contexto temporal de interacción.

## Shapes

Los controles y avisos tienen esquinas discretas; los badges son más ajustados y los diálogos más amplios. Los radios del frontmatter describen las familias presentes. Las tareas tienen un radio propio y los paneles comparten el siguiente paso. Los indicadores de estado son círculos pequeños. Marca e iconos usan SVG lineal.

## Components

### Buttons

La acción principal usa lima sólida y tinta oscura; la secundaria usa borde neutral y fondo transparente. Ambas tienen altura mínima de 36px. La variante compacta usa altura mínima de 30px y padding de 5px 9px. Los botones de icono miden 32px por lado y tienen nombre accesible.

El hover principal aclara el fondo; el secundario añade tono de aviso. Las transiciones de fondo y borde duran 150ms con `ease`. El foco visible usa contorno lima de 2px y separación de 3px. Los controles deshabilitados usan opacidad 0.5 y cursor de bloqueo. Movimiento reducido elimina las transiciones.

### Chips

Los tags informativos usan borde neutral, radio de badge y texto compacto. Los estados de ejecución se muestran como punto y etiqueta sin recinto propio. Las funciones pendientes usan ámbar y una explicación textual cuando corresponde.

### Cards / Containers

Los paneles comparten superficie, borde y radio de panel. Sus cabeceras separan título y acciones mediante un divisor. Resumen y contenido del inspector usan padding de 16px. Las tareas llevan padding de 14px 15px y separación de 10px; la selección cambia el borde. En móvil el padding de tareas pasa a 12px. Los avisos usan menor radio. La aprobación conserva su acción dentro de la tarea seleccionada.

### Inputs / Fields

Los campos usan fondo carbón, borde neutral, texto claro y caret lima. Las etiquetas visibles preceden a campos y selectores. El foco comparte el contorno de botones. Los checkboxes nativos usan acento lima y miden 16px. La búsqueda integra SVG y campo en un recinto de 33px de altura. Los filtros permiten salto de línea.

### Navigation

La sidebar reúne marca, Nueva tarea, cinco módulos, recientes y estado del sistema. Cada enlace usa padding de 9px 11px y altura mínima de 38px. El módulo activo tiene fondo de aviso, texto claro e icono lima; `aria-current` identifica la página. Recientes recupera la selección de una tarea. En móvil un diálogo nativo sustituye al aside y limita el foco al menú abierto.

### Inspector y progreso

El inspector muestra estado, tarea, ejecutor, intento, progreso y resultado disponible. Actividad, Checkpoint y Datos cambian el contenido dentro del mismo panel. El detalle usa un aside en escritorio y un diálogo modal en móvil. Nueva tarea también usa un diálogo nativo y conserva el formulario separado del registro.

La barra nativa de progreso mide 4px; dentro de una tarea mide 3px. Lleva pista neutral y relleno lima, acompañada de información textual. El registro alinea tiempos con mensajes. Los identificadores y el checkpoint adicional usan un desplegable nativo. Los cambios de estado se anuncian en una región accesible y los errores usan `role="alert"`.

### Historial y mensajes

Las conversaciones del historial son botones de fondo carbón, borde neutral y radio de control, separados por 8px. La selección cambia el borde a lima; el título puede partir palabras largas y la fecha usa texto secundario. El mismo listado aparece en el diálogo de historial cuando desaparece la columna lateral.

Los mensajes forman una lista con separadores de 1px y separación de 18px. Cada mensaje reúne autor, fecha y estado textual Guardado, conserva los saltos de línea y permite copiar el contenido. El compositor tiene etiqueta visible y una acción Guardar mensaje; los controles de integraciones pendientes permanecen deshabilitados y su estado se explica con texto. La configuración usa campos existentes para nombre y acciones de conversación. La eliminación requiere confirmación nativa del navegador. Los avisos de guardado se anuncian con `role="status"`; los errores mantienen `role="alert"`.

## Do's and Don'ts

### Do:

- **Do** usar el acento para acciones y señales de estado.
- **Do** mantener texto explícito junto a cada estado y contador de progreso.
- **Do** conservar el foco visible y las etiquetas accesibles de los controles.
- **Do** mantener navegación e inspector accesibles mediante diálogos en móvil.
- **Do** describir la configuración, los datos y las funciones pendientes con honestidad.

### Don't:

- **Don't** presentar una demo local como prueba de continuidad cloud.
- **Don't** depender solo del color para comunicar un estado.
- **Don't** convertir el detalle operativo en una superficie con sombras decorativas.
- **Don't** ocultar errores de acciones mientras se actualiza el progreso.

