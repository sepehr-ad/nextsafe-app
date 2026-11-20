importScripts('./engine/bundle.js?v=3');

const CACHE = 'amanstep-shell-v40';
const GUIDANCE_CACHE = 'amanstep-guidance-v1';
const APP_ROOT = new URL('./', self.location.href);

function assetUrl(path = '') {
  return new URL(String(path).replace(/^\/+/, ''), APP_ROOT).href;
}

const HOME_URL = assetUrl('');
const HOME_PATH = new URL(HOME_URL).pathname;
const SHARE_PATH = new URL(assetUrl('share')).pathname;
const BASELINE_PATH = new URL(assetUrl('study-baseline')).pathname;
const LIVE_BUNDLE_PATH = new URL(assetUrl('data/advisory_bundle.json')).pathname;
const LAST_GOOD_BUNDLE = assetUrl('data/advisory_bundle.last-good.json');
const LAST_GOOD_BUNDLE_PATH = new URL(LAST_GOOD_BUNDLE).pathname;
const ASSETS = [
  HOME_URL,
  assetUrl('styles.css?v=30'),
  assetUrl('about.html'),
  assetUrl('privacy.html'),
  assetUrl('terms.html'),
  assetUrl('contact.html'),
  assetUrl('engine/paths.js?v=1'),
  assetUrl('engine/bundle.js?v=3'),
  assetUrl('engine/risk.js?v=1'),
  assetUrl('engine/case.js?v=2'),
  assetUrl('engine/safety.js?v=1'),
  assetUrl('engine/agent.js?v=1'),
  assetUrl('engine/trace.js?v=1'),
  assetUrl('engine/action-feed.js?v=4'),
  assetUrl('engine/trust-map.js?v=1'),
  assetUrl('engine/intake.js?v=1'),
  assetUrl('engine/qwen.js?v=2'),
  assetUrl('engine/redact.js?v=1'),
  assetUrl('engine/ask.js?v=1'),
  assetUrl('engine/trusted-store.js?v=1'),
  assetUrl('engine/followups.js?v=1'),
  assetUrl('app.js?v=36'),
  assetUrl('manifest.webmanifest'),
  assetUrl('icon.svg'),
  assetUrl('runtime-policies.js'),
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function localShareResponse(request) {
  const formData = await request.formData();
  const sharedText = ['title', 'text', 'url']
    .map((field) => String(formData.get(field) || '').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 20_000);
  const shellResponse = await caches.match(HOME_URL) || await fetch(HOME_URL);
  const shell = await shellResponse.text();
  const marker = '<template id="shared-payload"></template>';
  const payload = `<template id="shared-payload">${escapeHtml(sharedText)}</template>`;
  const headers = new Headers(shellResponse.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(shell.replace(marker, payload), { status: 200, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        // Delete only caches owned by AmanStep. WebLLM keeps model artifacts
        // in its own Cache Storage namespaces and must survive app updates.
        .filter((key) => key.startsWith('amanstep-') && ![CACHE, GUIDANCE_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

const FOLLOW_UP_COPY = Object.freeze({
  bank_reference: Object.freeze({
    en: 'Did the bank give you a reference number?',
    ar: 'هل أعطاك البنك رقماً مرجعياً؟',
  }),
  ecrime_report: Object.freeze({
    en: 'Have you filed the eCrime report?',
    ar: 'هل قدّمت بلاغ eCrime؟',
  }),
  statement_check: Object.freeze({
    en: 'Check your statement for new transactions.',
    ar: 'تحقق من كشف حسابك بحثاً عن معاملات جديدة.',
  }),
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_VERIFIED_BUNDLE') {
    event.waitUntil((async () => {
      try {
        const bundle = await globalThis.AmanStepBundle.verifyBundle(event.data.bundle);
        const response = new Response(JSON.stringify(bundle), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
        await (await caches.open(GUIDANCE_CACHE)).put(LAST_GOOD_BUNDLE, response);
      } catch (error) {
        // Invalid messages never replace the last verified guidance.
      }
    })());
    return;
  }
  if (event.data?.type !== 'SHOW_LOCAL_FOLLOW_UP') return;
  const kind = String(event.data.kind || '');
  const language = event.data.language === 'ar' ? 'ar' : 'en';
  const body = FOLLOW_UP_COPY[kind]?.[language];
  if (!body) return;
  event.waitUntil(self.registration.showNotification('AmanStep', {
    body,
    tag: `amanstep-${kind}`,
    icon: assetUrl('icon.svg'),
    badge: assetUrl('icon.svg'),
    data: { kind },
    renotify: false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  if (!Object.hasOwn(FOLLOW_UP_COPY, event.notification?.data?.kind)) return;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).pathname.startsWith(HOME_PATH));
    if (existing) return existing.focus();
    return self.clients.openWindow(HOME_URL);
  })());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method === 'POST' && requestUrl.pathname === SHARE_PATH) {
    // Consume the share locally. Never forward the message-bearing request or
    // write its generated response to Cache Storage.
    event.respondWith(localShareResponse(event.request));
    return;
  }
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  if (requestUrl.pathname === LAST_GOOD_BUNDLE_PATH) {
    event.respondWith(caches.match(LAST_GOOD_BUNDLE).then((cached) => (
      cached || new Response('', { status: 404 })
    )));
    return;
  }
  if (requestUrl.pathname === LIVE_BUNDLE_PATH) {
    // Verification happens in the app. Only its verified postMessage may
    // update LAST_GOOD_BUNDLE; the network response is never cached here.
    return;
  }
  if (requestUrl.search && event.request.mode === 'navigate') {
    // Never let legacy message-bearing query URLs reach the network. The
    // current share target uses the local POST interception above.
    event.respondWith(caches.match(HOME_URL).then((cached) => cached || fetch(HOME_URL)));
    return;
  }
  // The controlled research baseline must never fall back to the agent shell,
  // which would contaminate the assigned study condition.
  if (requestUrl.pathname.startsWith(BASELINE_PATH)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match(HOME_URL);
        return new Response('', { status: 503, statusText: 'Offline' });
      }))
  );
});
