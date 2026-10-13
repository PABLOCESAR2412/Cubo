# Activación de la prueba cloud

## Estado preparado

- Cuenta Cloudflare personal verificada: pablocesar.t.g@gmail.com.
- Perfil OAuth separado: ~/.config/cubo/cloudflare-personal.
- Account ID: 6fcab192a8cc2a3458247ef5c8108a07.
- D1 cubo-dev-db creado: 7b9b60fc-5255-42a3-835f-2ec0f05a393c.
- Migración inicial aplicada localmente y en esa D1 de desarrollo.
- Repo PABLOCESAR2412/Cubo verificado como privado y vacío.
- Presupuesto de Actions USD 0 con bloqueo de uso y alertas verificados.
- URL prevista: https://cubo-dev.pctg.workers.dev.
- Worker y Workflow cloud todavía no desplegados.

No es necesario Docker. No modificar la cuenta de trabajo ni recursos ajenos a Cubo.

## Publicación inicial del repositorio

Git local está inicializado en main y origin apunta a
https://github.com/PABLOCESAR2412/Cubo.git. El repositorio remoto sigue vacío en la
última comprobación. Después de revisar los archivos, el usuario puede publicar:

```bash
git add .
git commit -m "feat: initialize Cubo durable task demo"
git push -u origin main
```

Estos comandos son para ejecución manual del usuario. Usar identidad y acceso del
GitHub personal. Si Git solicita autenticación, completar el login personalmente.

El usuario debe publicar la base preparada en main, incluyendo
.github/workflows/cubo-runner.yml, scripts/runner-demo.ts y los paquetes. El bootstrap
no tiene un registro de aprobación de commit/push en Cubo, por eso los agentes no
pueden hacer esa publicación automáticamente. Puede realizarse manualmente con
GitHub Desktop o Git después de revisar el código.

No subir node_modules, .tools, .wrangler, artifacts, dist ni archivos de secretos.
El workflow no se activa por push: solo workflow_dispatch. No crear un README o PR
con Copilot para evitar ejecuciones no solicitadas.

## Credenciales privadas

Crear manualmente un token fine-grained en el GitHub personal:
Resource owner PABLOCESAR2412, repositorio seleccionado Cubo, permisos mínimos
Actions: read/write, Checks: read y Metadata: read. No necesita Contents: write.
Usar caducidad acotada. No pegar el token en chat ni escribirlo en el frontend.

Guardar un archivo privado fuera del repositorio en:
~/.config/cubo/cloudflare-personal/cubo-dev.secrets.json

Contenido esperado, con valores definidos por el usuario:

```json
{
  "GITHUB_TOKEN": "<token fine-grained del repositorio Cubo>",
  "OWNER_PASSWORD": "<clave personal de al menos 12 caracteres>",
  "SESSION_SECRET": "<valor aleatorio de al menos 32 caracteres>"
}
```

El agente no crea ni modifica estas credenciales automáticamente. No se versionan.
Wrangler permite incluirlas con el primer despliegue mediante --secrets-file; no es
necesario publicar previamente un Worker vacío para guardar secrets.

En GitHub, configurar la variable de repositorio CUBO_URL con
https://cubo-dev.pctg.workers.dev. La variable no es un secreto ni lleva credenciales.
Los callbacks usan OIDC: no hay un secreto compartido para runners.

## Despliegue de la vertical completa

Desde PowerShell, después de confirmar Workers Free:

```powershell
$env:CUBO_FREE_PLAN_VERIFIED = 'true'
bun run deploy
```

El script verifica destinos personales, repo privado, workflow activo, credenciales
y guardia de gasto. Ejecuta tests, lint, typecheck y build antes de publicar la PWA,
API y Workflow juntos. El primer despliegue no debe ser un health endpoint aislado.

Para operaciones manuales de Wrangler, seleccionar siempre el perfil correcto:

```powershell
$env:XDG_CONFIG_HOME = Join-Path $env:USERPROFILE '.config/cubo/cloudflare-personal'
$env:CLOUDFLARE_ACCOUNT_ID = '6fcab192a8cc2a3458247ef5c8108a07'
bunx --no-install wrangler whoami
```

## Prueba de aceptación real

1. Entrar a Cubo con la clave personal y crear la demo.
2. Confirmar en Cubo que la tarea está persistida y en Actions que el job inició.
3. Cerrar por completo el navegador. No ejecutar keep-alive ni servidor en el dispositivo.
4. Volver después de al menos un minuto y recuperar estado SUCCEEDED y resultado 91.
5. Repetir con pausa: verificar checkpoint paso 3, WAITING_APPROVAL y job terminado.
6. Aprobar desde Cubo y verificar otro run_id, recuperación de cursor 3 y resultado 91.
7. Guardar evidencia de IDs, timestamps y estados; nunca incluir tokens o claves.

Cerrar el navegador demuestra independencia del cliente. Apagar físicamente el
dispositivo es una comprobación del usuario; no afirmar que ocurrió si no se hizo.

