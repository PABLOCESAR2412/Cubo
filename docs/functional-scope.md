# Alcance funcional objetivo de Cubo

Estado: alcance aprobado por el usuario el 2026-10-13. Este documento describe el
producto objetivo; no afirma que todas las capacidades estén implementadas.
AGENTS.md conserva las reglas de trabajo y MEMORY.md el estado del desarrollo.

## Principio central

Una tarea pertenece a Cubo, no al dispositivo. El usuario puede iniciarla, cerrar
el navegador o apagar PC/teléfono y recuperar después progreso, decisiones
pendientes y resultado. El dispositivo es un cliente del control plane.

El objetivo es cubrir las capacidades funcionales de Telo/Orquestador adaptadas
a Cubo. No se incorporan requisitos técnicos de su antigua VM.

## Arquitectura y restricciones permanentes

```text
PWA
  Cubo API / Control Plane
    Task Engine
      Workflows / persistencia
        ExecutionBackend
          GitHub Actions inicialmente
            Codex / OpenCode
```

- Mantener el motor durable ya validado. Solo cambiarlo ante una necesidad
  funcional concreta o un problema técnico demostrado, preservando su comportamiento.
- GitHubActionsExecutionBackend implementa una interfaz sustituible. El núcleo
  no depende de APIs de GitHub Actions ni de agentes concretos.
- Agentes, proveedores de modelos, skills y backend de ejecución son conceptos distintos.
- MVP personal, un usuario. Infraestructura USD 0: no activar automáticamente
  servicios pagos, larger runners, Containers, R2 ni Workers Paid.
- Una integración que exige pago se detiene y documenta; buscar primero una
  alternativa gratuita. No usar un fallback que pueda generar cargos silenciosamente.
- El presupuesto de infraestructura no autoriza gasto en modelos. Cualquier
  integración de modelos debe identificar condiciones de uso y gasto antes de habilitarse.
- Los límites y la cuota pueden bloquear tareas, sin destruirlas ni migrarlas
  automáticamente a infraestructura de pago.

## Chat

- Conversaciones persistentes con sesiones que mantengan contexto disponible.
- Selección de agente, proveedor, modelo y nivel de esfuerzo según compatibilidad real.
- Título, renombrar, fijar y eliminar conversaciones.
- Tokens, uso y coste por turno cuando el agente/proveedor exponga información suficiente.
- Fallback ante errores compatibles, con política explícita y registro de la
  decisión; no repetir efectos ni cambiar de proyecto, permisos o presupuesto.
- Proceso del agente visible en vivo y consultable posteriormente: lectura,
  búsqueda, edición, ejecución, errores y resultados.
- Respuestas que expliquen qué hará, cambios realizados y cómo se verificaron.
- Comandos `/`, paleta rápida, atajos de teclado e historial de prompts.
- Dictado si el navegador lo permite; estado claro cuando no está disponible.
- Adjuntos, copiar, reintentar y guardar respuestas como documentos.
- Enviar un turno que ejecuta trabajo crea una operación durable del backend;
  cerrar el chat no debe detenerla. El streaming es una vista de eventos persistidos.

## Tareas

- Una sola ejecución activa en Cubo; las demás permanecen en cola. El límite se
  aplica en el backend, también ante dispatch, reintentos y recuperación concurrentes.
- Ejecución remota independiente del dispositivo y tareas programadas.
- Estados objetivo: queued, running, waiting approval, interrupted, failed,
  cancelled y completed, con transiciones y motivos claros.
- Cancelación que detenga completamente la ejecución: solicitar parada al backend,
  bloquear nuevas acciones/callbacks del intento y confirmar fin del runner antes
  de afirmar que está detenido. Un timeout de cancelación se muestra explícitamente.
- Continuación/reanudación con el contexto disponible y recuperación tras interrupciones.
- Checkpoints versionados, eventos/logs y resultado fuera del runner efímero.
- Antes de esperar aprobación, guardar checkpoint y terminar runner. Reanudar
  crea otra ejecución que recupera contexto; no exige mantener vivo el proceso anterior.
- Notificaciones al completar, fallar o requerir decisión; aprobaciones humanas
  antes de acciones sensibles. Los avisos no sustituyen el estado persistido.

Los nombres anteriores describen el producto objetivo. No implican renombrar ahora
los contratos existentes: SUCCEEDED representa la finalización actual de la demo.
La exclusión global, cancelación y recuperación completas aún requieren implementación.

## Git y GitHub

- Conectar proyectos/repositorios y trabajar con una copia/revisión aislada por ejecución.
- Generar, conservar y mostrar el diff antes de solicitar aprobación.
- Commit, push y PR solo mediante el control plane y aprobación explícita registrada.
- Vincular aprobación a tarea, acción, repositorio, destino y versión exacta del diff.
  Cambios posteriores del diff o destino invalidan la autorización y exigen una nueva.
- Auditar autorización y efecto ejecutado; impedir reutilización y duplicación.
- Escanear secretos antes de operaciones Git; bloquear y explicar hallazgos sin exponerlos.
- El agente no recibe credenciales/permisos que permitan eludir esta barrera.

## Proyectos

- Listar, crear y administrar proyectos con nombre y repositorio GitHub opcional.
- Proyecto primero, chats y tareas asociados después. Cada chat mantiene historial
  propio y solo recibe el contexto autorizado del proyecto al que pertenece.
- Importación remota durable de repositorios públicos o privados. Acceso SSH
  privado por proyecto, guía de configuración y credenciales cifradas; la memoria
  registra conocimiento relevante con referencia a la revisión importada.
- Instrucciones, memoria, skills disponibles y secretos propios por proyecto.
- Conexiones API, servidores MCP y variables de entorno propios del proyecto.
- Aislamiento estricto de contextos, archivos, ejecuciones y credenciales.
- Explorar archivos en modo lectura, con historial de chats y tareas relacionados.
- Estadísticas y estado del proyecto basados en datos disponibles.

## Memoria

- MEMORY.md sigue siendo memoria del desarrollo de Cubo, compartida por sus agentes
  de desarrollo; no es memoria funcional de proyectos ni registro de aprobación.
- Cada proyecto de Cubo dispone de memoria propia persistida y autorizada por proyecto.
- Evitar contaminación de contexto. Registrar conocimiento relevante aprendido en
  ejecuciones anteriores y distinguirlo de datos temporales o checkpoints de trabajo.

## Agentes y proveedores

- Codex y OpenCode inicialmente, mediante interfaz común y adaptadores ampliables.
- Task Engine independiente de sus implementaciones y sesiones internas.
- Orquestación mediante subagentes ejecutores y revisores con subtareas, contexto
  mínimo y permisos delimitados. Herramientas de navegador y multimedia por
  adaptadores, sujetas a capacidades, aislamiento y coste autorizado.
- Separar agentes de proveedores. Preservar integraciones definidas y contemplar
  Gemini, Groq y NVIDIA; admitir varios modelos por proveedor.
- Groq se escribe con Q; no añadir Grok/xAI por la interpretación errónea del audio.
  OpenCode Zen/Go y conexiones por cuentas ChatGPT/Codex, Google y Claude son
  integraciones objetivo que requieren comprobación individual de autenticación,
  capacidades y condiciones; no asumir equivalencia entre suscripción y API.
- Registrar capacidades y compatibilidad antes de habilitar combinaciones.
- Fallback solo cuando sea técnicamente compatible y autorizado por la política.
- Registrar tokens, uso y costes cuando se puedan conocer; no completar datos ausentes
  con cifras ficticias ni prometer que todas las combinaciones serán compatibles.

## Uso, analíticas y cuotas

- KPIs, tareas realizadas, duración, actividad por período y gráficos.
- Filtros 7/30/90 días y rango personalizado, proyecto y modelo; volumen de llamadas,
  distribución por modelo y ejecuciones recientes cuando haya datos suficientes.
- Uso y tokens por agente/modelo/proveedor, con gasto estimado si hay datos suficientes.
- Calidad explícita de cada dato: `exact`, `estimated`, `stale` o `unavailable`.
  Conservar procedencia y fecha; una estimación debe explicar cómo se calculó.
- No inventar límites, cuotas o saldo que el proveedor no exponga.
- Permitir saldo manual estimado cuando no exista API de cuota real; distinguirlo
  del saldo verificado y de los bloqueos efectivos de gasto de infraestructura.

## Ajustes

- Agente/modelo predeterminado, esfuerzo, notificaciones y apariencia.
- Proveedores, conexiones, skills instaladas y backend de ejecución.
- Uso/cuotas y estado general de Cubo con estados reales de configuración.
- Apariencia clara/oscura, instalación PWA, almacenamiento con ubicación, uso y
  retención visibles. Versionado major.minor.patch por tipo de entrega; 1.0.0 futuro.

## Seguridad

- Ningún secreto en frontend, chats, logs, errores, diffs o artefactos de recuperación.
- Secretos cifrados en persistencia, con claves fuera de esos registros; no enviar
  material de descifrado al frontend ni guardarlo en checkpoints.
- Mínimos permisos, aislamiento por proyecto y allowlist de variables para cada agente.
  Nunca entregar secretos de otro proyecto ni todas las variables del entorno.
- Commit/push/PR fuera del control directo del agente.
- Autenticación/autorización personal, sesiones y cookies seguras, CSP y políticas
  web estrictas; auditoría de aprobaciones y operaciones sensibles.
- Aplicar estas reglas en código y permisos, no únicamente mediante instrucciones al agente.
- No compartir contextos entre chats ni proyectos por defecto. Compartirlos mediante
  permisos explícitos queda fuera de esta fase. No añadir registro público; mantener
  el acceso personal existente mientras Cubo controle datos y ejecuciones remotas.

## Interfaz

- Conservar paleta oscura de Cubo y workspace de las capturas de Telo: sidebar
  persistente, Chat, Tareas, Proyectos, Analíticas y Ajustes.
- Densidad compacta, escritorio sólido y móvil responsive, sin scroll horizontal.
- Estados reales. Funciones sin backend identificadas como pendientes o deshabilitadas.
- No confundir estructura visual lista con capacidad funcional implementada.
- Refinamiento de Chat con interacciones de ChatGPT/Claude, manteniendo shell,
  composición general y paleta aprobados; no realizar otro rediseño completo.

## Equivalencias cloud, no herencia de VM

| Solución anterior | Dirección en Cubo |
| --- | --- |
| Azure VM, systemd | Orquestación durable y ExecutionBackend; runners efímeros |
| Tailscale, 127.0.0.1 como acceso al producto | PWA/API remotas con autenticación y autorización |
| bubblewrap | Aislamiento y permisos del backend de ejecución elegido; validar garantías reales |
| Carpetas permanentes del servidor | Persistencia explícita, checkpoints y reconstrucción del workspace |
| Backup de VM hacia PC | Recuperación/exportación del estado cloud con solución compatible con USD 0 |

Loopback sigue siendo válido para desarrollo local, pero no es dependencia funcional
del producto. No asumir que un runner hospedado garantiza por sí solo aislamiento
de secretos o almacenamiento persistente. Adjuntos, artefactos grandes y recuperación
de archivos requieren una solución gratuita comprobada; no habilitar R2 por defecto.

## Roadmap vertical y puertas de cierre

| Orden | Módulo | Puerta funcional antes de ampliar el siguiente |
| --- | --- | --- |
| 1 | Motor durable | Crear, ejecutar remotamente, cerrar cliente y recuperar estado/resultado |
| 2 | UI definitiva | Workspace compacto, móvil usable, tareas reales y pendientes honestos |
| 3 | Chat | Conversaciones/turnos persistentes, contexto y proceso recuperables; capacidades habilitadas con backend real |
| 4 | Proyectos/GitHub | Proyecto conectado, revisión/contexto aislados e historial vinculado |
| 5 | Agentes | Codex/OpenCode por adaptadores; ejecución real, eventos y recuperación disponibles |
| 6 | Aprobaciones Git | Diff revisable, autorización exacta, escaneo y acciones controladas sin evasión |
| 7 | Memoria | Memoria por proyecto con aislamiento y separación de datos temporales |
| 8 | Proveedores | Combinaciones verificadas, configuración, fallback seguro y uso con procedencia |
| 9 | Notificaciones | Avisos de fin/fallo/decisión y recuperación del estado aunque se pierda el aviso |
| 10 | Analíticas/cuotas | Métricas reales, calidad/fecha/origen, saldo manual estimado y bloqueos claros |

Seguridad, aprobaciones de operaciones sensibles y coste cero son transversales,
no trabajo que se pospone hasta el final. Las dependencias mínimas entre fases
pueden habilitarse cuando son necesarias; no construir módulos enteros en paralelo.
Chat puede comenzar por conversación y turnos persistentes; la inferencia real
exige el adaptador de agente/proveedor correspondiente y no se simula como terminada.

## Estado actual y siguiente fase

- Motor durable demostrativo validado en cloud: runner real, checkpoints, cliente
  cerrado y recuperación de SUCCEEDED/91. No es todavía ejecución de agentes de IA.
- UI de workspace publicada. Tareas tiene backend; Chat tiene persistencia de
  conversaciones/mensajes y gestión, sin inferencia. Proyectos ya guarda registros,
  instrucciones, memoria manual y chats asociados. GitHub, herramientas de proyecto
  y proveedores siguen pendientes. Analíticas usa solo el historial disponible de tareas.
- Aprobación de continuación probada localmente; aprobación Git no implementada.
- No considerar implementados por este documento el scheduler, cancelación completa,
  exclusión global, aprendizaje/importación automáticos de memoria ni telemetría de modelos.
  Memoria manual por proyecto ya disponible.
- Primera vertical de Chat publicada y comprobada en cloud; consultar
  docs/chat.md para aceptación y publicación. La conversación del 2026-10-14 fija
  como siguiente ampliación proyectos reales y chats asociados, antes de conectar
  inferencia y eventos de agente. Ver PLAN.md para dependencias y puertas de cierre.

Cada fase debe documentar capacidades implementadas, aceptación comprobada,
limitaciones gratuitas y pendientes en MEMORY.md y en su documentación específica.
