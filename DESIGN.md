---
name: Cubo
description: Consola oscura, compacta y responsive para consultar trabajo persistido.
colors:
  base: "#101416"
  surface: "#171d20"
  muted: "#a6b3bb"
  line: "#303b42"
  accent: "#d9ed91"
  ink: "#e9f0f3"
  accent-hover: "#e7fab4"
  accent-ink: "#182010"
  quiet-hover: "#ffffff"
  row-hover: "#1c2428"
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
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  section:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: "calc(1.75 / 1.125)"
  body:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "calc(1.25 / 0.875)"
  metadata:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "calc(1 / 0.75)"
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "calc(1 / 0.75)"
  brand:
    fontFamily: '"Cubo Geist", ui-sans-serif, system-ui, sans-serif'
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.03em"
rounded:
  badge: "4px"
  control: "6px"
  approval: "8px"
  panel: "12px"
spacing:
  unit: "0.25rem"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  panel: "28px"
  section: "32px"
  wide: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-quiet:
    textColor: "{colors.accent}"
    padding: "2px 0"
  button-quiet-hover:
    textColor: "{colors.quiet-hover}"
  input:
    backgroundColor: "{colors.base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  task-row:
    textColor: "{colors.ink}"
    padding: "16px 12px"
    width: "100%"
  task-row-hover:
    backgroundColor: "{colors.row-hover}"
  task-row-selected:
    backgroundColor: "{colors.surface}"
  status-label:
    rounded: "{rounded.badge}"
    padding: "6px 9px"
  detail:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  notice:
    backgroundColor: "{colors.notice}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
  notice-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-ink}"
  approval:
    backgroundColor: "{colors.approval-bg}"
    rounded: "{rounded.approval}"
    padding: "18px"
---

# Design System: Cubo

## Overview

**Creative North Star: "Consola de trabajo persistido"**

Cubo usa carbón, gris frío y lima suave para una consola operativa. La densidad compacta permite leer tareas, progreso y acciones sin perder la jerarquía. La tarea guardada es el centro de la experiencia y el detalle amplía la selección.

Las superficies son planas, delimitadas por líneas y cambios de tono. La tipografía local y las esquinas discretas mantienen una lectura sobria. El sistema documenta la implementación local aprobada; las capturas no demuestran continuidad cloud.

**Key Characteristics:**

- Fondo carbón y superficies de gris frío.
- Lima suave para acciones, selección y progreso.
- Filas compactas y detalle legible.
- Lectura secuencial en móvil.
- Estados explícitos con texto y foco visible.

## Colors

La paleta combina neutrales oscuros con un acento luminoso y colores semánticos reservados al estado.

### Primary

- **Lima suave**, token `accent`: marca, acción principal, selección de texto, progreso y estados de ejecución o éxito.
- **Lima clara**, token `accent-hover`: respuesta del botón principal al puntero.
- **Tinta sobre lima**, token `accent-ink`: texto de la acción principal.

### Secondary

- **Ámbar de espera**, token `waiting`: texto de aprobación pendiente.
- **Rosa de fallo**, token `failed`: estado fallido.
- **Aviso de error**, tokens `error-bg`, `error-ink` y `error-line`: mensaje de error visible con fondo, texto y borde específicos.
- **Superficie de aprobación**, tokens `approval-bg` y `approval-line`: recinto de revisión y continuación.

### Neutral

- **Carbón**, token `base`: fondo general e inputs.
- **Gris de superficie**, token `surface`: detalle, acceso personal y fila seleccionada.
- **Tinta clara**, token `ink`: lectura principal.
- **Gris de lectura secundaria**, token `muted`: contexto, tiempos y estado neutral.
- **Gris de separación**, token `line`: bordes, divisores y pista de progreso.
- **Gris de aviso**, token `notice`: contexto operativo.
- **Gris de interacción**, token `row-hover`: fila bajo el puntero.
- **Blanco**, token `quiet-hover`: respuesta de la acción textual.

**The Estado con texto Rule.** Cada estado mantiene una etiqueta comprensible; el color acompaña su significado.

## Typography

**Body Font:** Cubo Geist local, con los fallbacks del frontmatter. El archivo variable admite pesos de 100 a 900 y usa `font-display: swap`.
**Label/Mono Font:** La pila monospace del frontmatter se reserva a tiempos del registro y JSON del checkpoint.

La jerarquía distingue títulos por tamaño y peso sin recurrir a mayúsculas ornamentales. No existe una familia de display independiente. La marca tiene su propia composición tipográfica; los encabezados usan la misma Geist que el cuerpo.

### Hierarchy

- **Headline:** encabezado principal; la cifra del resultado comparte su tamaño, con peso normal y cifras tabulares.
- **Title:** detalle, acceso y estado vacío.
- **Section:** título del formulario.
- **Body:** lectura y título de cada fila; títulos pequeños de sección usan peso medio.
- **Label:** descripciones, controles y mensajes.
- **Metadata:** tiempos, contador secundario, badge y pie.
- **Mono:** registro y datos técnicos desplegables.
- **Brand:** nombre Cubo junto al cubo lineal SVG.

**The Lectura numérica Rule.** Los contadores de progreso y resultados usan cifras tabulares; los tiempos del registro usan monospace.

## Layout

El contenedor se centra y tiene un máximo de 80rem. Usa 20px de margen interior horizontal y 32px verticales; desde 48rem el margen interior horizontal pasa a 40px. La cabecera usa 20px verticales y el mismo cambio horizontal.

La consola tiene una columna hasta 64rem. Desde ese ancho muestra una columna lateral de 320px y otra flexible con `minmax(0, 1fr)`, separadas por 32px. Ambas admiten reducción de ancho. En móvil, formulario y lista preceden al detalle; no se añade navegación móvil independiente.

El ritmo parte de 0.25rem y usa pasos repetidos para separaciones entre texto, controles y secciones. El detalle lleva 28px de padding, reducido a 20px hasta 600px. El acceso tiene un ancho máximo de 400px. Los textos introductorios tienen un máximo de 36rem; el texto del vacío, 24rem.

El estado vacío tiene altura mínima de 340px, reducida a 240px hasta 600px. Las cabeceras de detalle y el pie permiten salto de línea. El JSON puede desplazarse horizontalmente dentro de su propio contenedor.

## Elevation & Depth

La profundidad operativa se obtiene mediante tono y bordes de 1px. La fila seleccionada añade una línea interior lima mediante `box-shadow: inset 0 0 0 1px var(--color-accent)`. Es una señal de selección, no elevación física.

**The Superficie plana Rule.** Los controles y paneles operativos se separan por líneas y tono; la selección mantiene su contorno interior.

El pequeño cuadrado del estado vacío lleva una sombra aislada en el código. No se incorpora al vocabulario reutilizable: no aparece en controles ni paneles operativos.

## Shapes

Los controles y avisos comparten esquinas discretas; los badges son más ajustados, la aprobación usa un radio intermedio y los paneles amplios usan el mayor radio del frontmatter. Las filas de tareas conservan esquinas rectas. El indicador de conexión es un círculo de 6px. La marca usa un cubo lineal SVG, sin imagen de fondo.

## Components

### Buttons

La acción principal es sólida, legible y compacta. Su tamaño de texto es 14px, su peso es 600 y su altura mínima es 44px. El botón del formulario ocupa toda la columna; otros botones conservan ancho de contenido. La acción textual usa lima y subrayado mediante borde inferior.

Las transiciones cambian fondo y color durante 160ms con `ease`. El foco visible tiene contorno lima de 2px y separación de 4px. Los botones deshabilitados mantienen una opacidad de 0.5 y cursor de bloqueo. Con movimiento reducido se eliminan las transiciones.

### Chips

El badge de estado tiene borde neutral de 1px y texto pequeño. Es informativo; el estado se escribe completo. El color depende del estado, con neutral para cola o cancelación, lima para ejecución o éxito, ámbar para espera y rosa para fallo.

### Cards / Containers

El detalle y el acceso comparten superficie, borde y radio de panel. Los avisos operativos usan menor radio. El aviso de error cambia fondo, tinta y borde. La aprobación tiene un recinto propio; su acción permanece dentro de ese contexto.

### Inputs / Fields

Los campos usan fondo carbón, borde neutral de 1px, texto claro y caret lima. Conservan el mismo foco visible que los botones. El checkbox mide 18px, usa acento lima y queda alineado con el comienzo del texto. El campo de acceso tiene etiqueta visible.

### Navigation

La cabecera incluye marca enlazada al inicio, estado de conexión y acción textual de salida. La lista de tareas actúa como selección: cada fila es un botón con `aria-pressed`. Bajo el puntero cambia de tono; al seleccionar, muestra superficie y contorno interior lima. Este patrón se conserva en móvil dentro del flujo secuencial.

### Progreso y registro

El progreso es una barra nativa de 5px, con pista neutral y relleno lima, acompañada de etiqueta y contador. El registro alinea tiempos monospace con mensajes; separa eventos por 16px. Los identificadores y checkpoint se mantienen en un desplegable nativo. Los cambios de estado se anuncian en una región accesible; los errores usan `role="alert"`.

## Do's and Don'ts

### Do:

- **Do** usar el acento para acciones y señales de estado.
- **Do** mantener texto explícito junto a cada estado y contador de progreso.
- **Do** conservar el foco visible y las etiquetas accesibles de los controles.
- **Do** ordenar formulario, lista y detalle secuencialmente en móvil.
- **Do** describir la configuración y los datos reales con honestidad.

### Don't:

- **Don't** presentar una demo local como prueba de continuidad cloud.
- **Don't** depender solo del color para comunicar un estado.
- **Don't** convertir el detalle operativo en una superficie con sombras decorativas.
- **Don't** ocultar errores de acciones mientras se actualiza el progreso.

