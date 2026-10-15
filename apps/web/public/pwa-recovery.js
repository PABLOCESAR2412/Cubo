(() => {
  async function recover(button) {
    if (!navigator.onLine) throw new Error("Conéctate a Internet y vuelve a intentarlo.");
    button.disabled = true;
    try {
      const response = await fetch("/api/pwa-recovery?check=1", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo conectar con Cubo. Inténtalo de nuevo.");
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const worker = registration.active ?? registration.waiting ?? registration.installing;
          if (worker && new URL(worker.scriptURL).pathname === "/sw.js")
            await registration.unregister();
        }
      }
      if ("caches" in window) {
        for (const name of await caches.keys()) {
          if (name.startsWith("workbox-precache-") && name.endsWith(`${location.origin}/`))
            await caches.delete(name);
        }
      }
      // API is outside even older Cubo workers' navigation fallback.
      location.replace("/api/pwa-recovery?ready=1");
    } catch (error) {
      button.disabled = false;
      throw error;
    }
  }
  const button = document.getElementById("recover-cubo");
  if (button) {
    if (
      new URLSearchParams(location.search).get("ready") === "1" &&
      !navigator.serviceWorker?.controller
    ) {
      location.replace("/");
      return;
    }
    button.addEventListener("click", () => {
      const status = document.getElementById("recovery-status");
      status.textContent = "Actualizando la aplicación…";
      void recover(button).catch((error) => {
        status.textContent = error.message;
      });
    });
    return;
  }
  window.addEventListener(
    "error",
    (event) => {
      const source = event.target?.src ?? event.target?.href;
      if (!source || !new URL(source, location.href).pathname.startsWith("/assets/")) return;
      if (document.getElementById("cubo-recovery-link")) return;
      const link = document.createElement("a");
      link.id = "cubo-recovery-link";
      link.href = "/api/pwa-recovery";
      link.textContent = "Esta versión de Cubo necesita actualizarse. Recuperar actualización";
      link.style.cssText =
        "position:fixed;inset:12px 12px auto;z-index:10000;padding:16px;background:#d9ed91;color:#182010;font:14px system-ui;border-radius:6px";
      if (document.body) document.body.append(link);
      else
        document.addEventListener("DOMContentLoaded", () => document.body.append(link), {
          once: true,
        });
    },
    true,
  );
})();
