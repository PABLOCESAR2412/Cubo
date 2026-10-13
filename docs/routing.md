# Router central de Cubo

## Estado

Este documento y `config/routing.json` fijan el contrato de diseño. Todavía no hay
un router ejecutable de agentes/modelos. La demo ya tiene endpoints, TaskEngine y
GitHubActionsExecutionBackend; todavía no selecciona agentes ni proveedores. No tratar el catálogo
como una configuración de seguridad aplicada por código.

## Responsabilidades separadas

- Un adaptador de agente integra Codex u OpenCode: ejecución, eventos, resultados,
  checkpoints y capacidades de reanudación.
- Un adaptador de proveedor describe modelos, autenticación y capacidades de un
  servicio de modelos. Gemini, Groq y NVIDIA quedan contemplados inicialmente.
- Un proveedor de ejecución crea o recupera entornos aislados. El primero será
  GitHub Actions; no es un proveedor de modelos.
- Una skill es una capacidad adicional con origen y versión verificables. Su
  catálogo no contiene lógica de credenciales o llamadas a proveedores de modelos.
- Un proyecto define repositorio, revisión base y contexto permitido.
- Una política de permisos decide operaciones autorizadas y aprobaciones requeridas.

Mantener estos contratos independientes. El motor de tareas consultará registros
de adaptadores y capacidades; no tendrá condiciones específicas por proveedor.
No habilitar todas las combinaciones automáticamente. La compatibilidad real de
Codex y OpenCode con cada proveedor debe verificarse al implementar los adaptadores.

El repositorio inicial no contenía proveedores configurados. Por eso no se inventa
una lista de «proveedores existentes». Cualquier integración que se incorpore
durante el scaffold debe conservarse al ampliar el registro. Registrar también
el proveedor nativo necesario para cada agente al verificar su configuración.

## Decisión de ejecución

La entrada incluirá tarea, proyecto, selección explícita opcional de agente y
proveedor/modelo, skills solicitadas y permisos del usuario.

El backend deberá:

1. Autorizar el proyecto y resolver el repositorio y contexto permitidos.
2. Respetar selecciones explícitas; resolver valores omitidos mediante una política
   configurada. Si no hay una opción válida, guardar un bloqueo claro.
3. Validar la combinación de agente, proveedor y modelo mediante capacidades
   declaradas por los adaptadores. No cambiar a otro proveedor silenciosamente.
4. Resolver skills disponibles, integridad, versión y permisos necesarios.
   La disponibilidad global en un PC no implica disponibilidad en la nube.
5. Calcular permisos efectivos como la intersección de política, tarea, proyecto
   y capacidad del entorno. Las palabras clave nunca conceden permisos.
6. Persistir la decisión antes de crear el entorno: agente, proveedor/modelo,
   versiones, skills, repositorio, revisión base, alcance de contexto, permisos,
   proveedor de ejecución y versión de política. Usar referencias a secretos.
7. Ejecutar mediante las interfaces comunes y registrar eventos y checkpoints.
8. Suspender operaciones que necesiten aprobación. Validar la aprobación registrada
   para la acción y el diff concretos antes de cualquier commit, push o PR.

Al reanudar, cargar la decisión persistida y el checkpoint. Revalidar permisos,
credenciales y capacidades actuales. Si cambian de forma incompatible, guardar el
bloqueo y solicitar intervención; no reemplazar silenciosamente el modelo o agente.

## Skills en entornos de ejecución

El catálogo local sirve para desarrollo. En la nube será necesario materializar
únicamente las skills autorizadas en la imagen o entorno temporal, con su origen,
versión e integridad. No montar todo el directorio personal del desarrollador.

Graphify mantiene instalación y datos separados por proyecto. Cuando se use en
la nube, sus datos recuperables necesitarán almacenamiento durable; un directorio
de un runner efímero no basta. Ninguna skill puede eludir el control de GitHub.
