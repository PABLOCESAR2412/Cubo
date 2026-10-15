# Plan de evolución de Cubo

Actualizado: 2026-10-14. Fuente del alcance: conversación del usuario y
[docs/functional-scope.md](docs/functional-scope.md). Este plan distingue trabajo
entregado de funcionalidades objetivo. No concede permisos de Git ni de gasto.

## Base que se conserva

Motor durable demostrativo validado en cloud, backend GitHub Actions sustituible,
PWA con acceso personal, D1 y Workflows. Chat guarda conversaciones y mensajes;
todavía no ejecuta agentes. Mantener infraestructura USD 0 y la paleta de Cubo.
Diseño actual aprobado: refinarlo sin reemplazar shell, navegación ni identidad.
ChatGPT y Claude son referencias de interacción del chat, no nuevas paletas.

## Iteración actual: refinamiento de chat y ajustes generales

Publicación 1.0.0 y pruebas terminadas para la solicitud posterior del usuario:
sesión persistente, acciones directas en Recientes, chat Markdown minimalista,
selector integrado, proveedor general, respaldo gratuito, dictado y extractos de
adjuntos. Ver [contrato de esta iteración](docs/chat-refinement.md). Revisión visual
ship y cloud comprobados, incluida inferencia con cliente cerrado. No guardar ni
mover claves sin una
acción del usuario; conservar compatibilidad con conexiones antiguas de proyecto.

## Iteración anterior: proyectos, diagnóstico y OpenRouter gratuito

Solicitud posterior del usuario: inicio en Proyectos, tarjetas con acciones reales,
Nuevo proyecto en sidebar, Recientes solo chats agrupados, sin pestaña general de
Chat ni historial duplicado. Diagnóstico reúne estado técnico. Paleta preservada.
Identificar instrucciones/memoria del repositorio sin sobrescribir campos adicionales.
Ver [flujo del workspace](docs/workspace-project-flow.md).

El usuario eligió OpenRouter para el primer chat real, solo modelos gratuitos.
Publicados en cubo-dev adaptador, clave cifrada por proyecto, turno durable,
respuesta/uso persistidos y cancelación con confirmación remota. Aceptación real
pendiente de configurar la clave desde la PWA; no pedirla por chat. No son agentes
Codex/OpenCode ni herramientas habilitadas. Ver [OpenRouter](docs/openrouter-chat.md).
Esta prioridad autorizada adelanta la API de texto; no adelanta operaciones Git.

## Iteración anterior: documentación y gestión visual del chat

Implementada y validada localmente. Publicación registrada en MEMORY.md al cierre.

- Registrar flujo centrado en proyectos y aislamiento de proyectos/chats.
- Facilitar renombrar, fijar y eliminar mediante acciones del chat existentes.
- Refinar burbujas, compositor y estados de foco con el sistema visual actual.
- Verificar gestión real y responsive; no simular inferencia ni proyectos creados.

Ampliación solicitada: instalación PWA y aviso de nueva versión publicada, botón
Actualizar, recarga confirmada y tareas remotas conservadas. Implementado y probado
con dos service workers reales; ver docs/pwa.md. La importación GitHub es el trabajo
funcional activo de Proyectos.

### Importación GitHub en curso

Implementada localmente: importador remoto de lectura, cuatro checkpoints, archivos
acotados por proyecto y claves SSH generadas por Cubo, privadas cifradas en D1.
Una ejecución global se reserva en el backend; las demás quedan en cola.
Ver [docs/repository-import.md](docs/repository-import.md). Importación pública
validada en cloud con cliente cerrado y recuperación; aceptación privada pendiente
de deploy key de lectura. El usuario confirmó crear PROJECT_ENCRYPTION_KEY como Secret;
su presencia en cubo-dev fue verificada por nombre, sin leer su valor.
Para acceso privado deberá añadir la pública del proyecto como deploy key de lectura.
No avanzar a agentes antes de cerrar esta aceptación.

## Siguiente vertical: proyectos y chats asociados

Base implementada: creación/listado D1, detalle, instrucciones y memoria manual,
chats asociados e historial anterior conservado. Aceptación en docs/projects.md.
Importación pública por tarea ya validada; privada espera deploy key de lectura.
Herramientas, variables de agentes y tareas con inferencia continúan pendientes;
el hito completo de integración GitHub no se declara terminado.

1. Listar y crear proyectos persistentes: nombre y repositorio GitHub opcional.
2. Asociar conversaciones y tareas a un proyecto; conservar y migrar de forma
   explícita los chats existentes sin asignarlos silenciosamente al proyecto equivocado.
3. Abrir el detalle: resumen, instrucciones, memoria propia, archivos de lectura,
   skills, conexiones API/MCP, variables y acción Abrir chat.
4. Aplicar autorización por project_id y conversation_id en consultas y ejecución.
   Un chat no hereda historial de otros chats; accede solo al contexto autorizado
   del proyecto. Compartir contexto entre proyectos/chats queda fuera de alcance.
5. Importar el repositorio mediante una tarea remota durable y efímera. Guardar
   revisión, inventario y conocimiento relevante; no copiar indiscriminadamente
   secretos, dependencias, binarios ni todos los archivos a la memoria.
6. Validar recuperación tras cerrar cliente e intentos de acceso cruzado antes
   de declarar funcional el módulo.

Repositorio privado: preparar conexión SSH por proyecto con guía basada en la
documentación oficial. La clave se genera; GitHub recibe la parte pública y Cubo
custodia la privada cifrada. Para importar, preferir permisos de lectura. Nunca
entregar al agente credenciales que permitan commit/push/PR sin aprobación.
No confundir autenticación SSH de lectura con autorización para publicar cambios.
Repositorio público: importación de lectura sin exigir credenciales del repositorio.

## Ejecución de agentes y herramientas

- Codex/OpenCode por adaptadores. Claude puede añadirse tras verificar compatibilidad.
- Orquestador, ejecutores y analizador/revisor con subtareas y permisos explícitos.
  Los resultados requieren evidencia; delegar no garantiza ausencia de errores.
- APIs, MCPs, skills y allowlist de variables propios de cada proyecto.
  Credenciales y contexto no se comparten entre proyectos ni subagentes no autorizados.
- Navegador remoto y herramientas especializadas, incluidos modelos multimedia,
  solo cuando exista adaptador compatible y solución de coste autorizada.
- Visor persistido de comandos, herramientas, errores y resultados. Una terminal
  interactiva es una capacidad posterior, no una sesión permanente de servidor.
- Detener/cancelar debe confirmarse en el backend. Checkpoint antes de aprobación;
  runner termina y la continuación usa uno nuevo. Un único trabajo activo global;
  subagentes internos también quedan sujetos al presupuesto y límite del runner.
- Diff exacto y aprobación registrada antes de commit, push o PR.

## Proveedores y conexiones

Groq, con Q; la interpretación temporal Grok/xAI fue corregida por el usuario.
Contemplar Gemini/Google, NVIDIA y OpenCode Zen/Go; separar proveedor de agente.
Validar individualmente acceso por cuenta ChatGPT/Codex, Google y Claude frente
al acceso por API. No asumir que un plan de consumidor habilita API u OAuth de
terceros. Preferir opciones gratuitas verificadas; no activar gasto automáticamente.

Cada combinación expone capacidades, modelos, credenciales necesarias, condiciones
del plan y calidad de datos de uso. Fallback respeta permisos, presupuesto y
compatibilidad. No inventar saldo, límites ni disponibilidad gratuita.

## Analíticas y ajustes posteriores

- Períodos 7/30/90 días y rango personalizado; filtros por proyecto, agente,
  proveedor y modelo. Tokens procesados, coste estimado, duración, llamadas,
  distribución por modelo y ejecuciones recientes cuando existan datos.
- Calidad exact/estimated/stale/unavailable, fecha y procedencia; saldo manual
  estimado diferenciado del saldo verificado y del bloqueo real de gasto.
- Apariencia clara/oscura, notificaciones, instalación PWA, conexiones, skills,
  presupuestos y almacenamiento: qué se guarda, ubicación, consumo y retención.
  Modo oscuro sigue siendo el actual; modo claro es funcionalidad pendiente.
- Adjuntos por explorador o arrastre, documentos y audio, según capacidades reales
  del modelo y almacenamiento gratuito comprobado. No activar R2 por defecto.
- Versiones major.minor.patch por compatibilidad, funcionalidades y correcciones.
  1.0.0 es un hito futuro de entrega; no elevarlo por cantidad arbitraria de edits.

## Límites transversales

Uso personal, sin registro público ni multiusuario. Mantener acceso privado y
autorización existentes al publicar; ausencia de registro no implica API pública.
MEMORY.md pertenece al desarrollo de Cubo, no a la memoria de sus proyectos.
No ampliar todos los módulos simultáneamente ni rehacer el motor validado.
Documentar aceptación y limitaciones reales al terminar cada vertical.
