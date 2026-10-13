# Memoria compartida y gestión del contexto

## Dos ámbitos distintos

MEMORY.md, en la raíz, conserva el estado de desarrollo del propio sistema Cubo.
Codex y OpenCode leen y actualizan ese mismo archivo. No crear memorias de estado
independientes dentro de directorios específicos de cada agente.

La memoria de los proyectos que Cubo ejecute será una funcionalidad del producto.
Necesitará separación por proyecto, permisos y persistencia propios. No mezclar
su contenido ni sus checkpoints con MEMORY.md. Este paso no implementa esa funcionalidad.

## Inicio de una sesión

1. Leer AGENTS.md y después MEMORY.md desde la raíz de Cubo.
2. Revisar el estado relevante de los archivos antes de actuar. La memoria puede
   quedar desactualizada y no sustituye la evidencia del repositorio.
3. Cargar solo documentos y skills necesarios para la tarea actual.
4. Si hay contradicciones, respetar las instrucciones vigentes y corregir la
   memoria con evidencia. No inferir aprobaciones de notas históricas.

AGENTS.md define cómo trabajar; MEMORY.md conserva qué se acordó y dónde quedó el
trabajo. Las instrucciones actuales del usuario pueden cambiar acuerdos anteriores.

## Actualización por avances significativos

Actualizar automáticamente cuando ocurra alguno de estos hechos:

- Decisión arquitectónica o cambio acordado del stack.
- Cierre de una fase o funcionalidad con su estado real de validación.
- Incorporación, retirada o limitación relevante de una integración.
- Bloqueo, problema o restricción que afecte al trabajo posterior.
- Pendiente necesario para que otro agente pueda continuar sin reconstruir la sesión.

No actualizar después de cada comando, instalación auxiliar, lectura o cambio
menor. Una respuesta sin novedades duraderas no requiere escribir la memoria.
Esta automatización es una obligación de trabajo para los agentes que leen
AGENTS.md; no hay un hook, watcher o proceso de sincronización instalado.

Antes de escribir, releer MEMORY.md para conservar aportes recientes del otro
agente. Evitar escrituras concurrentes del archivo; si se detectan cambios durante
la edición, reconciliarlos antes de guardar. No reemplazar contribuciones nuevas
con una copia anterior de la memoria.

## Contenido y tamaño

Conservar decisiones, cambios importantes, estado, funcionalidades terminadas y
pendientes, bloqueos, problemas, acuerdos que deben mantenerse y próximos pasos.

Mantener una instantánea concisa, con un objetivo de menos de 200 líneas. Sustituir
afirmaciones obsoletas y eliminar detalles temporales. Si una explicación requiere
más espacio, documentarla en docs/ y enlazarla sin duplicarla.

Separar claramente lo acordado, lo implementado y lo comprobado. Una instalación,
un archivo de configuración o un diseño no prueba que una funcionalidad opere.
Una nota de memoria no es un registro de aprobación de Cubo.

No almacenar secretos, credenciales, tokens, logs completos, cada comando ejecutado,
datos privados de repositorios externos ni contenido temporal sin valor futuro.

## Optimización del contexto

- Leer AGENTS.md y MEMORY.md al comenzar; abrir referencias por necesidad.
- Buscar con rg rutas o símbolos antes de leer archivos completos.
- Consultar el grafo local cuando exista y aporte contexto sobre relaciones del código.
  No reconstruirlo ni invocar extracción semántica para cada prompt.
- Resumir salidas de herramientas; conservar solo evidencia relevante para decisiones.
- Antes de un relevo o compactación, actualizar la memoria si existen novedades
  duraderas y dejar claros pendientes, limitaciones y próximos pasos.
- Mantener instrucciones, decisiones y límites de aprobación al reducir contexto.
  No convertir una aprobación histórica en una autorización nueva.

Caveman comprime la conversación. Los documentos persistentes usan prosa clara.
Ponytail limita trabajo innecesario. Ninguna de estas reglas garantiza un porcentaje
fijo de ahorro ni una compactación automática del contexto del host.
