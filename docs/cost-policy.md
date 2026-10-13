# Infraestructura USD 0

Acuerdo obligatorio del usuario: no contratar planes, activar facturación de
excesos ni cambiar a un proveedor pago. Detener la parte que no pueda funcionar
gratis y buscar una alternativa antes de habilitarla.

## Destinos y controles

- Cloudflare personal: Workers Free, D1 y Workflows, más Static Assets del Worker.
- GitHub personal: repositorio privado PABLOCESAR2412/Cubo y ubuntu-latest estándar.
- Sin Containers, R2, larger runners, caches ni uploads de artifacts en la demo.
- Sin llamadas a modelos pagas ni fallback a otro proveedor.

Verificación realizada el 2026-10-12 en GitHub, cuenta PABLOCESAR2412:
Actions tiene presupuesto **USD 0**, **Stop usage: Yes** y alertas de uso incluido
**On**. Estos controles ya existían; no se modificaron otros productos ni presupuestos.
La cuenta muestra GitHub Pro con descuento; no se contrató ni cambió ese plan.
El usuario además confirmó que el repo y controles estaban listos.

GitHub Free incluye 2.000 minutos/mes para repositorios privados estándar. Una cuenta
puede tener otra cuota según su plan y uso en otros repositorios. El control duro de
GitHub impide gasto adicional; los límites internos de Cubo no sustituyen ese control.
No habilitar GITHUB_ZERO_SPEND_VERIFIED sin revisar el bloqueo del proveedor.

## Cuota agotada

Cuando GitHub reporta bloqueo por cuota o facturación, el adaptador comunica
EXECUTION_QUOTA_EXHAUSTED. TaskEngine deja la tarea QUEUED con ese motivo, conserva
checkpoints y termina el Workflow. La UI muestra el bloqueo sin cambiar de backend.

Se comprueba capacidad después de 24 horas mediante el outbox, o antes por solicitud
del propietario. No se presupone que el ciclo de facturación comienza el día 1.
Si GitHub sigue bloqueando, la tarea vuelve a quedar pendiente. No se mantiene un
runner vivo esperando una aprobación, renovación de cuota o interacción.

Para fallos de jobs, el adaptador consulta anotaciones de checks cuando hay
check_suite_id, y reconoce mensajes de cuota/facturación. El PAT debe permitir
Checks: read. Errores desconocidos se presentan como fallo; no se atribuyen a cuota
sin evidencia ni se solicita un upgrade como respuesta automática.

## Cuotas Cloudflare y almacenamiento

Workflows Free dispone de 3.000 pasos/día, 1 GB-mes y CPU de 10 ms por invocación.
Workers Free comparte el límite de 100.000 solicitudes/día. D1 Free tiene cuotas de
lecturas, escrituras y tamaño; alcanzarlas puede detener operaciones. No se incrementa
el plan para resolver ese límite.

Los estados propios de la aplicación permanecen en D1 aunque caduque la retención
de la instancia Workflows. La PWA reduce polling cuando está oculta; cerrar el
cliente termina solo sus consultas. Los límites de Cubo acotan carga, no garantizan
capacidad cuando otros proyectos consumen la misma cuota gratuita.

Fuentes:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/billing/how-tos/set-up-budgets
- https://developers.cloudflare.com/workflows/reference/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/

