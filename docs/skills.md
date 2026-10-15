# Skills de Cubo

## Instalación y fuentes

Las skills de terceros son globales, salvo Graphify. La biblioteca compartida es
`~/.agents/skills/`, disponible para Codex y OpenCode. El inventario de esta
inicialización se registra en `config/skills.json`; no constituye un lock de todos
los equipos. Skills CLI mantiene sus propios registros de instalación.

| Skill | Fuente | Alcance |
| --- | --- | --- |
| `impeccable` | https://github.com/pbakaus/impeccable | Global, CLI oficial |
| `caveman` y familia existente | https://github.com/JuliusBrussee/caveman | Global, reutilizada |
| `playwright-cli` | https://github.com/microsoft/playwright-cli | Global |
| `cloudflare`, `wrangler` | https://github.com/cloudflare/skills | Global |
| `ponytail` | https://github.com/DietrichGebert/ponytail | Global |
| `graphify` | https://github.com/Graphify-Labs/graphify | Local |

Impeccable se actualizó con la CLI oficial; se verificó su repositorio en los
metadatos del paquete npm. Codex usa `~/.agents/skills/impeccable/` y OpenCode
su biblioteca global `~/.config/opencode/skills/impeccable/`.
Se conservan las demás skills previamente instaladas. Disponibilidad no implica
activación de todas ellas ni inclusión automática en los contenedores de Cubo.

## Comando proporcionado por el usuario

Se ejecutó exactamente:

```bash
npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli
```

La CLI detectó Codex e instaló sin interacción en el proyecto. Para respetar el
alcance global solicitado, se retiró esa instalación local y se instaló con alcance
explícito. La retirada notificó éxito y luego un error de cierre de Node en Windows;
la inspección posterior confirmó que la copia local ya no existía.

```bash
npx skills remove playwright-cli -y
npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli --global --agent codex opencode --yes
npx skills add https://github.com/cloudflare/skills --skill cloudflare wrangler --global --agent codex opencode --yes
npx skills add https://github.com/DietrichGebert/ponytail --skill ponytail --global --agent codex opencode --yes
npx skills add https://github.com/Graphify-Labs/graphify --skill graphify --agent codex opencode --yes
```

Para futuros comandos del usuario, preservar el comando exacto y verificar dónde
instaló. No añadir flags al comando proporcionado sin explicarlo. Corregir el
alcance mediante una operación explícita cuando el comportamiento de la CLI lo
requiera. Revisar origen y duplicados antes de instalar skills sin URL indicada.

Las skills nuevas estarán disponibles para descubrimiento en el siguiente turno
o sesión del agente. No se instalaron aquí los binarios de Playwright o Wrangler;
sus herramientas y dependencias se configurarán con la aplicación.

## Actualización solicitada el 2026-10-14

Se ejecutaron exactamente los dos comandos suministrados:

```bash
npx skills use "https://github.com/microsoft/playwright-cli" --skill "playwright-cli"
npx impeccable install
```

El primero cargó instrucciones temporales; su salida completa se leyó desde un
archivo temporal y sus referencias se resolvieron desde el directorio de soporte
indicado. Playwright también se actualizó globalmente mediante el comando `add`
anterior. La herramienta local existente permite `npx --no-install playwright cli`;
no se añadió un ejecutable global innecesario.

El segundo eligió alcance local por defecto. Se corrigió explícitamente:

```bash
npx impeccable install --providers=codex,opencode --global --no-hooks --yes
```

Las copias y hooks locales recién generados se apartaron en una carpeta temporal
fuera del repositorio, tras verificar los destinos. La limpieza por borrado fue
bloqueada por la revisión automática; se utilizó un traslado reversible. Graphify,
los workflows y los hooks globales anteriores se conservaron. La skill global de
Impeccable declara 4.5.2; el motor instalado declara 0.1.14. La CLI informó una
versión anterior en su resumen de actualización; el archivo instalado es la fuente
de la versión aquí registrada. Las skills se descubren de nuevo en el próximo turno.

## Graphify aislado

Fuente verificada: Graphify-Labs/graphify, rama predeterminada `v8`. El paquete
oficial en PyPI es `graphifyy`, con ejecutable `graphify`. No es CodeGraphContext;
no se instaló ni se sustituyó por ese proyecto.

- Skill local: `.agents/skills/graphify/SKILL.md`.
- Lock de skill: `skills-lock.json`, generado por Skills CLI.
- Runtime local: `.tools/graphify/.venv/`, Python 3.12.
- Paquete fijado: `graphifyy==0.9.88`.
- Dependencias resueltas: `config/graphify-requirements.txt`.
- Datos generados previstos: `graphify-out/`, separados por proyecto.

En Windows, crear o recuperar la herramienta con:

```powershell
uv venv --python 3.12 .tools/graphify/.venv
uv pip install --python .tools/graphify/.venv/Scripts/python.exe graphifyy==0.9.88
# Si ya existe el lock de dependencias, preferir:
uv pip sync --python .tools/graphify/.venv/Scripts/python.exe config/graphify-requirements.txt
```

Invocar con el ejecutable del entorno local:

```powershell
$env:GRAPHIFY_NO_AUTO_REFRESH = '1'
& ./.tools/graphify/.venv/Scripts/graphify.exe --help
```

En Linux, el ejecutable estará en `.tools/graphify/.venv/bin/graphify`.
Definir también `GRAPHIFY_NO_AUTO_REFRESH=1` en su entorno antes de ejecutarlo.
La petición del usuario prevalece sobre el instalador global que sugiere la skill:
no ejecutar `uv tool install`, `pip install` global ni `graphify install` para Cubo.

Había una copia global anterior en `~/.claude/skills/graphify/`, versión 0.9.61.
La comprobación inicial de versión activó una actualización automática de esa copia.
Se restauraron SKILL.md desde el backup generado, el marcador 0.9.61 y las referencias
desde el paquete 0.9.61 que ya estaba instalado. Una segunda comprobación con la
actualización desactivada conservó el archivo global y el marcador anterior.
Cubo debe cargar la copia
local explícita y usar su runtime local, sin depender de la resolución de duplicados
del host. No se instaló ningún hook Git ni se generó todavía un grafo.

## Fuentes de compatibilidad

- OpenCode descubre `.agents/skills/` tanto local como global:
  https://opencode.ai/docs/skills/
- Opciones de alcance y agente de Skills CLI:
  https://skills.sh/docs/cli
- Metadatos del paquete Graphify:
  https://pypi.org/project/graphifyy/

La selección automática durante el desarrollo se define en `skill-router.md`.
El router del producto se define en `routing.md`; todavía no está implementado.
