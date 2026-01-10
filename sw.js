self.addEventListener("install", () => {    // Evento cuando se instala el service worker
  self.skipWaiting();                       // Se activa inmediatamente, sin esperar
});

self.addEventListener("fetch", event => {   // Intercepta peticiones de la app
  if (event.request.method !== "GET") return; // Ignora POST/PUT/DELETE (no toca APIs)
});