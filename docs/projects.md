# Proyectos y conversaciones asociadas

## Entrega actual

Crear y listar proyectos persistentes en D1 con nombre y URL HTTPS opcional de
GitHub. El detalle guarda instrucciones y memoria funcional manuales, conserva
una versión del contexto y permite abrir chats propios. Cada conversación tiene
un project_id inmutable o NULL para las conversaciones anteriores.

La URL es una referencia: aún no valida visibilidad, clona archivos ni importa
memoria. No se presentan skills, APIs/MCPs, secretos, archivos ni tareas del
proyecto como integraciones activas. Memoria manual no significa aprendizaje
automático. Inferencia y agentes reales siguen pendientes.

## Persistencia y aislamiento

- Migración 0003 crea projects y añade project_id a conversations. Mantiene todos
  los chats anteriores sin proyecto y no modifica tablas del motor durable.
- project_id tiene clave foránea y no se puede reasignar mediante UPDATE. Eliminar
  un proyecto con chats está prohibido en SQL; la UI permite borrar solo uno vacío.
- Todas las operaciones de chats usan scope en la consulta SQL. Sin parámetro de
  proyecto, solo acceden a conversaciones anteriores con project_id NULL.
- Con project=id, el backend verifica existencia del proyecto y exige coincidencia
  antes de listar, leer, editar, borrar o añadir mensajes. Una combinación incorrecta
  devuelve 404 sin exponer mensajes. El historial no se comparte entre chats.
- La sesión personal del propietario puede administrar todos sus proyectos. Esta
  entrega no implementa credenciales de ejecución de agentes ni afirma aislamiento
  de herramientas remotas todavía inexistentes. Esos permisos se añadirán al runner.
- Contexto manual con control de versión: un cambio atrasado devuelve 409. Creación
  con UUID e Idempotency-Key; reutilización con otro nombre/repositorio devuelve 409.

Límites internos de Cubo: 100 proyectos y 100 conversaciones totales, 200 mensajes
por conversación. Nombre de 120 caracteres; instrucciones y memoria de 3000 cada
una. Solicitud API limitada a 8 KiB, también para texto Unicode. No son cuotas de
modelos. Patrones habituales y secretos conocidos del Worker se rechazan antes
de persistir; no equivale a un detector universal de secretos.

## API

| Operación | Ruta |
| --- | --- |
| Listar y crear | GET /api/projects; POST /api/projects |
| Consultar y guardar contexto | GET /api/projects/:id; PUT /api/projects/:id |
| Eliminar proyecto vacío | DELETE /api/projects/:id, con version |
| Chats del proyecto | /api/conversations?project=:id |
| Conversación y mensajes | /api/conversations/:chatId?project=:id; /api/conversations/:chatId/messages?project=:id |

La autenticación personal y validación de Origin existentes cubren estas rutas.
El frontend conserva selección de proyecto/chat en URL; instrucciones y memoria
no se copian automáticamente a mensajes ni a otro proyecto.

## Compatibilidad y recuperación

Expandir primero D1 y publicar después el Worker. El cliente anterior puede seguir
usando conversaciones sin proyecto; los clientes nuevos filtran los chats propios.
No asignar chats existentes arbitrariamente ni realizar migración destructiva.
El registro de migraciones y su aplicación siguen la
[documentación oficial de D1](https://developers.cloudflare.com/d1/reference/migrations/).

Para retirar la UI nueva, conservar tablas y columna. Después de crear chats de
proyectos, no volver a un backend anterior al filtrado por project_id: sus consultas
globales mezclarían historiales. Cualquier rollback debe mantener la capa de scope
o bloquear las rutas nuevas; no eliminar datos como recuperación automática.

## Aceptación

Prueba D1 local/browser a 1440×900 y 390×844: crear dos proyectos, guardar contextos
diferentes, abrir y guardar chats propios, cerrar cliente y recuperar correctamente.
Ocho intentos de lectura/mutación bajo proyecto distinto o scope anterior devuelven
404. Conflicto de versión y borrado de proyecto con chats devuelven 409; URL con
credenciales y patrón de secreto se rechazan. Conversaciones anteriores intactas,
sin overflow ni compositor cortado. Capturas projects-*.png en .impeccable/review/.
La prueba no lanza nuevos runners; conserva el motor previo.

Siguiente ampliación: importar GitHub en una tarea durable, autenticar repositorios
privados con credenciales de lectura cifradas por proyecto y guardar revisión/
inventario/conocimiento relevante. Antes de habilitarla, verificar acceso, permisos,
cuota gratuita y guía SSH oficial. No publicar cambios Git mediante el agente.

## Publicación verificada

Commit 3db24b3 en main. Migración 0003 aplicada en cubo-dev-db de la cuenta personal;
Worker cubo-dev versión a21025b3-ca79-49ab-bb0f-23c2a1afb21f.
URL: https://cubo-dev.pctg.workers.dev. Bundle index-d1baOXPe.js comprobado.

La aceptación se repitió sobre D1 cloud: crear dos proyectos, contextos distintos,
chats asociados, cierre y recuperación móvil, rechazo de ocho lecturas/mutaciones
con scope incorrecto y conservación de chats anteriores. Se eliminaron solamente
los registros creados por esta prueba; la limpieza quedó verificada.
La API projects devuelve 401 sin sesión. Cinco vistas, PWA, móvil y gestión de
Chat anterior siguen pasando. Tarea durable previa SUCCEEDED/91 conservada.
No se lanzaron runners nuevos ni se modificaron valores de secretos. La revisión
visual final dio ship tras corregir documentación anterior del estado de Proyectos.
