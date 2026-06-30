const CACHE_NAME = 'caderno-agu-v2';
const SHELL_FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// IMPORTANTE: leis.json tem ~19MB. Cachear esse arquivo a cada carregamento causava
// acúmulo progressivo no Cache Storage do dispositivo, levando a lentidão/travamento
// depois de um tempo de uso. Por isso ele (e qualquer arquivo .json grande de dados)
// é explicitamente ignorado pelo cache do service worker — vai sempre direto na rede.
function ehArquivoGrandeIgnorado(url) {
  return url.includes('leis.json') || url.includes('dados.json');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (ehArquivoGrandeIgnorado(event.request.url)) {
    // Não intercepta nem cacheia — deixa o navegador lidar normalmente.
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
