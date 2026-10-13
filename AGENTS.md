# Cubo: instrucciones del proyecto

## Propósito y alcance

Cubo es una PWA para lanzar tareas de agentes de IA que pertenecen al backend y
continúan aunque el usuario cierre su teléfono o PC. El MVP es personal, para un
solo usuario, sin registro público, organizaciones ni funciones multiusuario.

La primera entrega completa debe permitir conectar un repositorio de GitHub,
crear una tarea, ejecutar OpenCode o Codex en la nube, guardar logs y progreso,
mostrar el diff, solicitar aprobación y continuar posteriormente. Debe notificar
cuando la tarea termine, falle o necesite aprobación.

## Stack acordado

- TypeScript en el código de aplicación y los contratos del proyecto.
- React y Vite para la PWA.
- Cloudflare Workers y Hono para la API y el control plane.
- Cloudflare D1 para los registros y el estado consultable de las tareas.
- Cloudflare Workflows para la orquestación durable y las aprobaciones.
- GitHub Actions con runners estándar ubuntu-latest como backend inicial de ejecución.
- D1 conserva también eventos, checkpoints y resultados pequeños de la primera demo.
- Coste de infraestructura obligatorio USD 0. No usar Containers, R2 ni Workers Paid.
- Bun como runtime local y gestor de paquetes. Los Workers usan el runtime de
  Cloudflare; no deben depender de APIs exclusivas de Bun.
- OpenCode y Codex como agentes iniciales, integrados mediante adaptadores.
- Separar los agentes de los proveedores de modelos. Contemplar Gemini, Groq y
  NVIDIA, preservando las integraciones existentes cuando las haya. Registrar la
  compatibilidad de cada combinación agente/proveedor/modelo antes de habilitarla.

## Mapa del monorepo

```text
apps/
  web/                  # PWA, vistas de tareas, diffs y aprobaciones
  api/                  # Hono, endpoints y orquestación con Workflows
packages/
  shared/               # Contratos y tipos compartidos
  database/             # Esquema, migraciones y acceso a D1
  agents/               # Contratos y adaptadores de OpenCode y Codex
  providers/            # Contratos y adaptadores de proveedores de modelos
  runner/               # Interfaz de ejecución y backend GitHub Actions
  tasks/                # Motor durable independiente del backend
config/                 # Catálogos declarativos de skills y routing
docs/                   # Documentación ampliada y decisiones
```

Esta estructura es propuesta. Se puede ajustar si la implementación lo justifica,
manteniendo la separación entre UI, API, motor de tareas y adaptadores.

## Reglas de arquitectura

1. La identidad y el estado de una tarea viven en el backend. La sesión de la PWA
   nunca es necesaria para mantener la ejecución o reanudarla.
2. El runner es temporal. Persistir el progreso fuera del runner permite
   reemplazarlo después de una interrupción o una aprobación.
3. Definir una interfaz de ejecución independiente del proveedor. Encapsular las
   APIs de GitHub Actions en su implementación, sin exponerlas en los
   contratos de agentes ni en la UI.
4. Separar el adaptador del agente del proveedor de ejecución. Incorporar otro
   agente no debe exigir reemplazar la orquestación.
5. Diseñar operaciones con identificadores estables, checkpoints versionados,
   reintentos e idempotencia. Una recuperación no debe duplicar efectos externos.
6. Guardar en D1 estado, eventos, checkpoints y resultados de la demo. Reconciliar
   con Workflows y GitHub Actions; no asumir transacciones entre estos servicios.
7. Antes de esperar aprobación, guardar los cambios y el contexto necesario para
   reconstruir el trabajo. Reanudar mediante un entorno nuevo cuando sea necesario.
8. No asumir que un proceso o una sesión interna de un agente puede sobrevivir
   indefinidamente. Documentar las capacidades de recuperación de cada adaptador.
9. Las notificaciones son avisos. El estado persistido sigue siendo la fuente
   consultable cuando un aviso se retrasa, se pierde o se entrega otra vez.
10. El acceso personal requiere autenticación y autorización antes de exponer
    tareas, repositorios, artefactos o acciones en una URL pública.

## Aprobaciones y límites obligatorios

Ningún agente puede hacer commit, push o crear un pull request sin una aprobación
explícita registrada por Cubo. Una instrucción en chat no sustituye ese registro
para las acciones de repositorio ejecutadas por Cubo.

La aprobación debe identificar tarea, acción, repositorio, destino y versión de
los cambios. Si cambia el diff o el destino, solicitar una aprobación nueva.
Validar y registrar la ejecución autorizada para impedir reutilizaciones o efectos
duplicados. El usuario debe poder revisar el diff antes de aprobar.

Aplicar estos límites en el backend y en los permisos del entorno de ejecución;
las instrucciones de un prompt no bastan para proteger las acciones de GitHub.
El entorno del agente no debe tener permisos o credenciales que permitan eludir
la aprobación. La ejecución de acciones autorizadas debe pasar por el control plane.

Nunca modificar automáticamente:

- Secretos, credenciales o archivos `.env` de producción.
- Configuración sensible de infraestructura.
- Historial Git o ramas remotas.
- Commits, pushes o pull requests.

Las acciones de repositorio expresamente aprobadas por Cubo pueden ejecutarse
solo dentro del alcance de esa aprobación. No reescribir el historial ni modificar
ramas remotas como parte de una recuperación automática.

No imprimir secretos en logs, checkpoints, diffs, documentación o respuestas.
No almacenar credenciales dentro de artefactos de recuperación.

## Comandos estándar

Ejecutar desde la raíz cuando exista el scaffold:

```bash
bun install
bun dev
bun test
bun run lint
bun run typecheck
bun run build
bun run deploy
```

Los scripts están implementados. build incluye un despliegue dry-run; no demuestra
continuidad cloud. Documentar en README requisitos y variables sin incluir secretos.
El despliegue debe respetar los límites de configuración sensible y requerir una
instrucción explícita del usuario para el entorno de destino.

## Cuenta y alcance de Cloudflare

- Elegir y registrar la cuenta al iniciar cada proyecto. No volver a preguntar
  en cada despliegue si cuenta, entorno y alcance ya están acordados.
- Para Cubo, usar la cuenta personal `pablocesar.t.g@gmail.com`, account ID
  `6fcab192a8cc2a3458247ef5c8108a07`, exclusivamente para desarrollo/pruebas.
- La cuenta `pablocesar.t.g@simcod.ec` corresponde al trabajo y no es destino de Cubo.
- Invocar Wrangler con el perfil personal aislado: `XDG_CONFIG_HOME` debe apuntar
  a `~/.config/cubo/cloudflare-personal`. Fijar también el account ID personal en
  los comandos o configuración de recursos; no depender de la sesión predeterminada.
- Antes de una operación remota, comprobar que la identidad y account ID efectivos
  coinciden con el destino acordado. Preguntar solo si falta la selección o cambia.
- Está autorizada la creación y configuración de recursos propios `cubo-dev*`:
  Workers Free, D1, Workflows y bindings gratuitos necesarios. No modificar producción,
  dominios, DNS u otros proyectos. No eliminar recursos existentes sin aprobación.
- El primer despliegue debe incluir la vertical durable completa; no publicar
  únicamente una estructura o un health endpoint como si demostrara el objetivo.

## Coste y ejecución efímera

- Infraestructura USD 0. No activar planes pagos, larger runners ni facturación adicional.
- Repositorio privado PABLOCESAR2412/Cubo. Usar solo ubuntu-latest y jobs acotados.
- Presupuesto Actions USD 0 con Stop usage y alertas verificados en la cuenta personal.
- Cuota agotada: EXECUTION_QUOTA_EXHAUSTED, mantener tarea QUEUED y sin fallback pago.
- Guardar checkpoint antes de WAITING_APPROVAL y terminar runner. La aprobación crea
  otra ejecución y recupera el checkpoint; no requiere mantener un proceso vivo.
- Si una integración exige pago, detener esa parte y buscar una alternativa gratuita.
- Ver [docs/cost-policy.md](docs/cost-policy.md), [docs/architecture.md](docs/architecture.md)
  y [docs/cloud-setup.md](docs/cloud-setup.md).

## Forma de trabajo y divulgación progresiva

- Al comenzar una sesión, Codex y OpenCode deben leer este archivo y después
  [MEMORY.md](MEMORY.md), la memoria compartida del desarrollo de Cubo.
- Actualizar MEMORY.md al cerrar avances significativos: decisiones, fases,
  integraciones, limitaciones, problemas o pendientes necesarios para continuar.
  No escribir después de cada comando ni mantener memorias independientes por agente.
- Seguir [docs/memory.md](docs/memory.md) para actualización y gestión del contexto.
  La memoria de los proyectos ejecutados por Cubo es una funcionalidad separada.
- Avanzar por los cinco pasos de inicialización de forma conversacional.
- En los pasos 1 a 4, preguntar antes de generar o instalar los archivos del paso.
- Mantener este archivo por debajo de 300 líneas y como fuente principal.
- Incorporar documentación detallada en `docs/` cuando se necesite y enlazarla
  desde aquí. No inventar rutas a documentación que todavía no existe.
- Si un agente necesita `CLAUDE.md` u otro archivo específico, usar una referencia
  a `AGENTS.md`; no mantener conjuntos independientes de instrucciones.
- Responder en español de forma breve. Escribir documentos persistentes con
  prosa clara y completa. Conservar nombres técnicos y comandos exactos.
- Instalar skills externas confirmadas desde su distribución o biblioteca oficial.
  Crear reglas propias solo para necesidades específicas de Cubo.
- Al iniciar una sesión, aplicar `caveman` y `ponytail` desde la biblioteca global
  `~/.agents/skills/`. Mantener disponible `graphify` desde la copia local
  `.agents/skills/graphify/`; cargar sus instrucciones cuando se consulte el grafo.
- Para cada prompt, seleccionar implícitamente las skills por intención conforme
  a [docs/skill-router.md](docs/skill-router.md). UI/diseño activa `impeccable`;
  pruebas/QA de navegador activa `playwright-cli`; infraestructura activa
  `cloudflare` y despliegue o CLI activa `wrangler`. No exigir comandos `/skill`.
- Respetar la intención y la negación del prompt; no ejecutar herramientas solo
  porque se menciona su nombre. Una skill nunca concede permisos de ejecución.
- Revisar [docs/skills.md](docs/skills.md) para fuentes, instalación y alcance.
  No instalar Graphify globalmente ni usar un runtime global para Cubo.
- Antes de invocar Graphify, definir `GRAPHIFY_NO_AUTO_REFRESH=1` en el proceso.
  Su CLI puede actualizar skills globales incluso al consultar la versión.
- Mantener contexto pequeño: cargar referencias necesarias, buscar antes de leer
  archivos completos y conservar decisiones, aprobaciones y bloqueos al resumir.
  Mantener MEMORY.md como una instantánea concisa; no usarlo como log de acciones
  ni como sustituto de las aprobaciones del backend.
- El router del producto debe resolver agente, proveedor/modelo, skills, proyecto,
  contexto y permisos en el backend. Ver [docs/routing.md](docs/routing.md) y
  [config/routing.json](config/routing.json). Su ejecución aún no está implementada.
- Verificar la documentación oficial vigente antes de fijar APIs, limitaciones,
  versiones o decisiones de integración de Cloudflare y los agentes.
- No ampliar el MVP con multiusuario u otros proveedores antes de demostrar
  ejecución durable, recuperación y aprobación de acciones de repositorio.

## Estado de inicialización

Pasos 1 a 3 configurados. Pasos 4 y 5 acordados: Biome, Tailwind, consola oscura,
primera tarea durable mediante arquitectura real y validación local/cloud.
PWA, API, D1, motor durable, backend GitHub Actions y demo implementados localmente.
D1 cubo-dev-db creada y migrada en la cuenta personal. Validación local documentada
en [docs/validation.md](docs/validation.md). Vertical mínima desplegada y comprobada:
runner GitHub real, cliente cerrado, checkpoints y resultado 91 recuperado de D1.
Ver [docs/cloud-validation.md](docs/cloud-validation.md). Agentes reales siguen pendientes;
pausa/aprobación tiene tests locales y requiere su propia comprobación cloud.
Rediseño UI del workspace implementado y validado localmente; conserva el backend.
Chat, Proyectos y proveedores siguen pendientes. Ver [docs/design-workspace.md](docs/design-workspace.md).
UI publicada en cubo-dev por instrucción explícita del usuario el 2026-10-13;
cinco módulos, móvil, PWA y recuperación del resultado existente comprobados.
