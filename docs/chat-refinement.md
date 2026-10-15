# Chat minimalista y configuración general

Petición del 2026-10-14. Mantener la identidad de Cubo y simplificar la interacción
siguiendo referencias ChatGPT/Claude. El usuario sustituyó la configuración de
proveedor por proyecto por una conexión general del propietario. Esto no autoriza
compartir archivos, memoria ni conversaciones entre proyectos o chats.

## Interfaz

La sidebar ocupa toda la altura en escritorio; la barra superior empieza a su
derecha. En móvil conserva el drawer. Cada chat reciente tiene acciones directas
de renombrar, fijar y eliminar con confirmación. Cerrar sesión es una acción
explícita; debajo se muestra la versión del build.

El encabezado del chat contiene su nombre y acciones con iconos. No incluye proveedor
ni Nuevo chat. Chats del proyecto ofrece Nuevo chat; Abrir chat reutiliza el más
reciente cuando existe. Se elimina Guardado y la segunda fila de esfuerzo del
compositor. Mensajes, estado de ejecución y compositor comparten medida de 760px;
las respuestas del asistente usan el fondo del chat y Markdown seguro, sin HTML
crudo ni imágenes remotas. Código y tablas están acotados al espacio disponible.

Modelo, esfuerzo y uso se consultan desde el selector del compositor. Solo hay
OpenRouter conectado; no se inventan otros catálogos. El selector distingue API
y familia del modelo. Los niveles de esfuerzo proceden de reasoning.supported_efforts
del catálogo, excluyendo none cuando el razonamiento es obligatorio. Si no se
anuncian niveles no aparece ese control. Contexto máximo no equivale a cuota.
Consumo por turno se conoce después; no se inventa una previsión de tokens.

## Sesión y rendimiento

La sesión del backend deja de tener expiración por tiempo. Un JWT firmado identifica
un registro revocable en D1. Cerrar sesión elimina ese registro. Una sesión antigua
válida se actualiza desde /api/session sin pedir de nuevo la contraseña. Cookies
HttpOnly, Secure y SameSite=Strict. El navegador limita cookies persistentes a 400
días; Cubo renueva esa duración al abrir la sesión. Borrar cookies, cambiar el secreto
de sesión o revocar la sesión sí puede exigir autenticación. No se promete controlar
la conservación de datos del navegador.

La consulta directa de chat elimina el listado previo. Turnos activos se consultan
cada dos segundos, conversaciones inactivas cada diez, y se pausa el sondeo del chat
oculto. Las tareas ajenas a esa vista se refrescan con menor frecuencia. La cuota
se consulta al abrir el selector; no bloquea la carga inicial. El catálogo tiene
cache de un minuto en el Worker, y el runner verifica nuevamente el modelo gratuito.
No se promete respuesta inmediata: el arranque de GitHub Actions sigue añadiendo
latencia. QUEUED indica preparación remota; RUNNING indica generación de respuesta.

## Ajustes generales y respaldo

Ajustes / Agentes y proveedores contiene la conexión OpenRouter y preferencias
de respaldo y tiempo de aviso (10 a 180 segundos). La clave la introduce el usuario
y se cifra con AES-GCM y AAD global. No se revela al frontend ni a otros agentes.
El control plane solo la entrega al runner autorizado para su turno y contexto.
Las claves antiguas de proyecto se preservan como compatibilidad; no se descifran,
migran o eligen automáticamente como clave general. La nueva conexión general tiene
prioridad y no se puede reemplazar mientras haya turnos activos.

El respaldo es otro modelo gratuito seleccionado expresamente. Se intenta una vez
ante respuestas HTTP 404/503 (modelo no disponible) o 429 (cuota). No ante una respuesta
incierta, timeout de red, contenido inválido, credencial rechazada o coste inesperado.
El modelo real usado se guarda en el resultado. No se habilitan agentes nuevos ni
fallback pago. El aviso por demora informa y permite detener; no vuelve a invocar
silenciosamente una petición que podría seguir ejecutándose.

## Dictado y adjuntos

Dictado usa SpeechRecognition del navegador, con permiso y aviso previo: algunos
navegadores envían audio a su servicio de reconocimiento. El texto va al borrador,
sin enviarse automáticamente. Puede detenerse; navegadores incompatibles muestran
el control deshabilitado. No se añade un servicio de transcripción de pago.

Arrastrar o elegir archivos extrae texto en el navegador. Formatos: TXT, MD, HTML,
PDF, DOCX, XLSX y PPTX. Vista previa del texto y opción de retirar. Máximo cuatro
archivos de 5MB cada uno, 12000 caracteres por extracto y 24000 en total. Office se
descomprime con límites y se leen solo documentos/hojas/diapositivas; no macros ni
fórmulas ejecutadas. HTML se trata como texto. PDF limita lectura a 30 páginas;
sin OCR para escaneados. DOC/XLS/PPT antiguos, archivos cifrados o sin texto dan un
error explícito. La vista previa no reproduce la maquetación original.

D1 conserva nombre, extracto y marca de truncado asociados al mensaje, en la misma
transacción del turno. El archivo binario original no se conserva. Solo el chat
actual aporta extractos anteriores, dentro del límite del historial. Patrones de
secretos conocidos se rechazan en la API; el filtro no es un detector universal.
No se introducen R2, Containers ni servicios pagos.

## Versiones

La primera entrega de esta política empieza en 1.0.0. version.json fija la base;
el build calcula incrementos con los commits posteriores: BREAKING CHANGE o tipo!
incrementa major, feat incrementa minor, fix y mantenimiento incrementan patch.
Docs, tests, CI y estilo sin comportamiento no cambian versión. Minor reinicia
patch; major reinicia ambos. No se crean commits ni tags automáticamente. Usar
historial Git completo para un build de publicación reproducible.

## Referencias verificadas

- [Esfuerzo por modelo](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).
- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
- [PDF.js](https://mozilla.github.io/pdf.js/examples/).
- [fflate](https://github.com/101arrowz/fflate).
- [react-markdown](https://github.com/remarkjs/react-markdown).

Estado de publicación y aceptación: ver MEMORY.md. No equiparar pruebas con fixtures
a inferencia real ni a dictado comprobado con micrófono físico.
