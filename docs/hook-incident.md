# Hook de Impeccable en Windows

Investigación del 2026-10-13, antes del despliegue cloud de Cubo.

## Hook y comando

El manifiesto global `C:/Users/pablo/.codex/hooks.json` registra un hook Stop con
statusMessage `Design deep pass`. También registra el mismo lanzador en PostToolUse
para Edit, Write y apply_patch. La verificación anterior solo ejecutó comandos de
lectura; el fallo informado al terminar corresponde al hook Stop, no al matcher de edición.

El campo command era:

```text
[ ! -f 'C:\Users\pablo\.agents\skills\impeccable\scripts\impeccable' ] || 'C:\Users\pablo\.agents\skills\impeccable\scripts\impeccable' hook
```

## Evidencia y causa

Se reprodujo ese command mediante Windows PowerShell -NoProfile -Command: código 1,
ParserError MissingTypename, «Falta el nombre de tipo después de '['» y rechazo de
`||`. Es sintaxis Unix, no PowerShell. El motor Impeccable no llegó a ejecutarse.
El manifiesto tenía commandWindows separado; su existencia no hace portable el
campo command que el ejecutor consume.

No se encontró un registro original del hook en la base de logs o el transcript de
la sesión: identificación por manifiesto, momento del fallo y reproducción. No se
presenta la reproducción como un log original recuperado.

La verificación de identidad/repositorio/workflow terminó con código 0. El script
scripts/deploy.ts no invoca este hook; ejecuta validaciones Bun y Wrangler. Por eso
el error del hook no invalida las respuestas de GitHub ni cambia los recursos cloud.
Sí ensucia el cierre de la sesión de desarrollo y debía corregirse antes de continuar.

## Corrección y pruebas

- Backup del manifiesto: ~/.codex/hooks.json.backup-cubo-20261013.
- Nuevo wrapper: ~/.codex/impeccable-hook.ps1.
- Stop y PostToolUse llaman al mismo wrapper de Windows:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\pablo\.codex\impeccable-hook.ps1"
```

El wrapper conserva stdout, stderr y código del motor. Si falta el lanzador, devuelve
127; no reemplaza fallos por éxito ni desactiva el detector. Con payload Stop de
Cubo, ejecución directa mediante PowerShell y cmd devolvió 0 sin stderr.

Una primera prueba de cmd con escaping automático de Bun produjo un error de ruta;
se corrigió el arnés usando windowsVerbatimArguments y se repitió con salida limpia.
Ese error del arnés no se omitió ni se confundió con el hook del usuario.

La comprobación directa valida el comando configurado. El cierre automático del
turno solo puede observarse cuando el host vuelva a disparar Stop. No se alteraron
los hashes de confianza ni se eludieron protecciones del host.
