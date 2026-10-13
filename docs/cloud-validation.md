# Primera ejecución durable real

Aceptación del 2026-10-13. Entorno cubo-dev exclusivamente personal y de desarrollo.
No se incorporaron funcionalidades nuevas de agentes o repositorios de trabajo.

## Entorno y coste

- URL: https://cubo-dev.pctg.workers.dev.
- Cuenta personal: pablocesar.t.g@gmail.com, 6fcab192a8cc2a3458247ef5c8108a07.
- Dashboard personal confirmó Workers Gratuito, 0 USD y Plan actual.
- Worker cubo-dev, D1 cubo-dev-db y Workflow cubo-dev-tasks; Static Assets para PWA.
- Versión Worker aceptada: 7fb87fe9-70da-4a79-87e0-ddc8580ce2f1.
- Repo privado PABLOCESAR2412/Cubo, workflow cubo-runner.yml, ref main.
- Job hospedado GitHub con label ubuntu-latest. Sin larger runners, cache ni artifact uploads.
- Presupuesto de Actions USD 0 con Stop usage y alertas previamente verificados.
- No se contrataron planes ni se activaron Containers/R2. La ejecución consume cuota incluida.

## Identificadores persistidos

| Campo | Valor |
| --- | --- |
| task_id | 6c644134-73f6-4648-b25d-77b381f9ea9a |
| execution_id | 6c644134-73f6-4648-b25d-77b381f9ea9a-1 |
| workflow_run_id GitHub | 38351620464 |
| job_id GitHub | 115145096157 |
| instancia Cloudflare | 6c644134-73f6-4648-b25d-77b381f9ea9a-1-dispatch-0 |
| Estado D1 | SUCCEEDED |
| Resultado D1 | {"sum":91,"steps":6} |
| Progreso | 6/6 |

[Run real de GitHub](https://github.com/PABLOCESAR2412/Cubo/actions/runs/38351620464).
Requiere acceso al repositorio privado.

## Secuencia observada (UTC)

| Evento | Hora |
| --- | --- |
| Tarea creada desde PWA y persistida | 05:29:08.199 |
| Workflow durable iniciado | 05:29:09.000 |
| Job GitHub iniciado | 05:29:18 |
| Navegador de prueba cerrado completamente | 05:29:21.903 |
| Runner remoto reclamó tarea mediante OIDC | 05:29:25.984 |
| Primer checkpoint guardado | 05:29:37.257 |
| Checkpoint final y resultado guardados | 05:30:30.205 |
| Job GitHub completado con success | 05:30:32 |
| Navegador nuevo recuperó tarea/resultado | 05:30:37.947 |
| Workflow Cloudflare terminó complete/success | 05:30:42.771 |

Los seis checkpoints se guardaron después del cierre. El proceso local de
validación observó únicamente GitHub durante ese intervalo; no envió heartbeat
del cliente de prueba a Cubo. No hubo servidor local ejecutando la demo.

## Comprobaciones

- Health API identifica github-actions; solicitudes privadas sin sesión reciben 401.
- Creación real desde la consola PWA devuelve 202 y un task_id estable.
- GitHubActionsExecutionBackend despacha el workflow y el runner real usa OIDC.
- D1 conserva estados, eventos, seis checkpoints y resultado después del cierre.
- Un navegador nuevo, viewport móvil 390x844, recupera la misma tarea y muestra 91.
- Service worker listo y shell PWA accesible tras desconectar y recargar.
- Consulta SQL independiente de D1 remoto confirma el vínculo tarea/run y resultado.
- Workflow Cloudflare describe estado complete, success true.
- 20 tests y 78 comprobaciones; lint, typecheck y build pasaron antes del despliegue.

Evidencia local ignorada por Git: artifacts/cloud-evidence.json, cloud-workflow.json,
cloud-jobs.json, cloud-running.png y cloud-restored-mobile.png. No contienen cookies,
claves ni tokens. Este documento conserva los hechos esenciales aunque no se publiquen capturas.

## Fallos conservados y correcciones

1. Tarea 4d508b15-42a9-4122-b5e5-5c7325e60630: dispatch falló tres veces con
   Illegal invocation. fetch estaba guardado como método del backend y recibía un
   this incorrecto en Workers. Wrapper de llamada y test de regresión corrigieron el fallo.
2. Tarea af610b25-6278-407a-bfdf-c080fb0dab45: Workers rechazó redirect:error.
   Se usa redirect:manual y se rechazan respuestas 3xx; no se sigue una redirección
   con credenciales. Test de regresión añadido. Ambas tareas fallidas siguen en D1.
3. Hook auxiliar Stop de Impeccable corregido por separado. Ver
   [hook-incident.md](hook-incident.md) para comando exacto, reproducción, límites
   de la evidencia y comprobación Windows. No atribuir fallos de Workers al hook.

La [documentación de errores de Workers](https://developers.cloudflare.com/workers/observability/errors/#illegal-invocation-errors)
describe la restricción de this del runtime. El error concreto de redirect se obtuvo
de los intentos persistidos del Workflow.

## Alcance de la conclusión

La tarea vive y termina en infraestructura remota sin el navegador que la creó.
Apagar físicamente PC/teléfono no se probó: debe comprobarlo el usuario si requiere
esa evidencia adicional. Pausa/aprobación/continuación tiene tests locales, pero
necesita su propia prueba cloud. Codex/OpenCode, diff y acciones de Git siguen pendientes.
