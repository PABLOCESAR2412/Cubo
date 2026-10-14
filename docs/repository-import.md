# Importación de repositorios por proyecto

## Alcance

La importación usa el mismo TaskEngine, Workflows y ExecutionBackend GitHub Actions
que la demo durable. Lee una revisión de GitHub desde un runner temporal, conserva
cuatro checkpoints en D1 y termina. El navegador no mantiene la ejecución.
No ejecuta agentes, scripts del repositorio, instalación de dependencias ni acciones
de escritura en Git. La memoria manual del proyecto no se sobrescribe.

El snapshot contiene SHA, inventario de hasta 100 rutas, hasta 12 textos de hasta
4000 bytes y un resumen de hechos. No es análisis generado por un modelo. Archivos
grandes, binarios, symlinks, submódulos y rutas sensibles se excluyen. El filtro de
patrones conocidos reduce exposición de secretos; no constituye un detector universal.
El escaneo requerido para futuras operaciones Git sigue pendiente.

## Acceso público y privado

Un repositorio público usa HTTPS sin credenciales de ese repositorio. Para uno
privado, Cubo genera un par Ed25519 exclusivo del proyecto y muestra solo la clave
pública y su fingerprint. En GitHub: Settings → Deploy keys → Add deploy key;
pegar la pública y dejar **Allow write access** desmarcado. Véase la
[guía oficial de deploy keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys).
Una clave pública añadida a GitHub no equivale a una conexión ya verificada.
La primera importación confirma el acceso real.

La privada se guarda cifrada con AES-GCM, IV aleatorio y AAD que vincula proyecto
e identificador de clave. La clave maestra `PROJECT_ENCRYPTION_KEY` es un Secret del
Worker: base64 de 32 bytes aleatorios. El propietario debe configurarlo, sin enviarlo
por chat ni guardarlo en el repositorio. No rotarlo sin migrar las claves cifradas;
las claves existentes quedarían ilegibles. No existe todavía flujo de rotación.

La API del propietario nunca devuelve la privada. Solo un runner con OIDC válido,
vinculado a la ejecución actual RUNNING y al proyecto/clave de la tarea, puede
recibirla. El runner limita las variables del proceso Git, escribe la identidad en
directorio temporal con permisos 0600, fija el host Ed25519 de GitHub y limpia el
directorio al terminar. El host procede de los
[fingerprints oficiales](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).
No se confía en `ssh-keyscan` en tiempo de ejecución.

## Durabilidad y aislamiento

Etapas: revisión fijada, inventario, archivos/contexto y resultado final. Los
callbacks validan orden, revisión, digest, ejecución y versión antes de persistir.
Repetir el checkpoint actual con el mismo digest es idempotente. Cambiar el contenido
o llamar desde otra ejecución se rechaza. El contexto se consulta por project_id.
Cada chat mantiene su historial; esta entrega no inyecta archivos en un agente.

Un slot global en D1 permite una sola ejecución reservada. Los contendientes quedan
QUEUED con `EXECUTION_SLOT_BUSY` y reintento desde un minuto; el cron de cinco
minutos determina cuándo se vuelve a despachar. Actions también serializa los jobs.
El presupuesto y bloqueo de gasto existentes siguen siendo obligatorios. Agotar
cuota mantiene tareas en cola sin fallback pago.

La recuperación del importador acepta un checkpoint de la misma revisión. Si HEAD
cambió, exige una nueva importación. La interfaz de reanudación automática de
importaciones interrumpidas todavía no está completa. Borrar proyectos con claves,
chats o historial de importación se bloquea para conservar relaciones; archivar y
retención son funcionalidades pendientes.

## Migración y despliegue

`0004_repository_imports.sql` agrega claves cifradas, snapshots y slot global.
Conserva tareas y chats previos. Publicar el runner/workflow de main antes del
Worker que habilita el nuevo tipo de tarea. No volver a una versión que ignore
importaciones, project_id o el slot después de crear datos nuevos. Un rollback de
código no revierte D1; cualquier retirada debe conservar lectura y aislamiento.

## Evidencia actual

Pruebas locales: 24 tests, 114 comprobaciones; lint, typecheck y build pasan.
Clave OpenSSH comprobada con `ssh-keygen -y`, cifrado y AAD entre proyectos probados.
Clone público real de octocat/Hello-World: revisión
`7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`, README recuperado y cuatro etapas
persistidas en D1 compatible local. Esto no demuestra todavía ejecución cloud de
esta nueva importación. La aceptación cloud se registra a continuación.

## Aceptación cloud pública: 2026-10-14

- Commit de implementación: `7989798`; Worker personal cubo-dev versión
  `fce538cf-68d7-49a0-bb7d-21a230bcf47e`. Migración 0004 aplicada.
- Proyecto de validación `22a6bcfa-14b7-4679-a114-bb0dcd867a2f`.
- Tarea `690e3d24-be08-42f3-afc9-b1d4737d3a9a`; ejecución con sufijo `-1`.
- GitHub run `38594588505`: runner ubuntu-latest, conclusión success.
- Navegador cerrado 16:02:05.525 UTC; runner conectado 16:02:22.773 UTC.
- Cuatro checkpoints posteriores al cierre; SUCCEEDED a las 16:02:28.341 UTC.
- Reapertura posterior en 1440/390 px recuperó SHA, README y estado sin overflow.
  SQL remoto confirma backend_run_id, proyecto, secuencia 4 y resultado.
- Demo anterior SUCCEEDED/91 conservada. Un solo runner nuevo para esta prueba.
  No se probó apagado físico del dispositivo ni agotamiento real de cuota.

El Secret remoto funciona: generación/cifrado de clave de proyecto completados;
API devuelve solo pública y fingerprint. Sesión del propietario no autoriza el
endpoint de credenciales del runner; sin sesión el contexto devuelve 401.
Importación privada aún pendiente de que el usuario añada la deploy key de lectura.
El proyecto de validación permanece como historial real, sin borrar datos existentes.

La prueba inicial de login QA omitió Origin en una solicitud y recibió rechazo;
se corrigió el script de prueba, sin cambiar autenticación del producto. La prueba
de cabeceras detectó ausencia real de CSP y motivó `_headers` para Static Assets,
conforme a la [documentación oficial de Cloudflare](https://developers.cloudflare.com/workers/static-assets/headers/).
Se restringen scripts, conexiones, fuentes y workers al origen; estilos inline
siguen permitidos para las barras de las analíticas existentes.
