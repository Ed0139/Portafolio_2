const API_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=10';
const DB_NAME = 'PortafolioPWA_CacheDB';
const STORE_NAME = 'apiResponses';
const CACHE_KEY = 'posts-latest';
const message = document.getElementById('message');
const postsContainer = document.getElementById('posts');
let dbPromise;

function updateNetworkStatus() {
  const online = navigator.onLine;
  const box = document.getElementById('networkStatus');
  box.className = `alert ${online ? 'alert-success' : 'alert-warning'}`;
  box.textContent = online ? 'El navegador indica que hay conexión.' : 'Sin conexión. Se intentará mostrar el último respaldo local.';
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function storeAction(mode, callback) {
  return dbPromise.then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let request;
    try { request = callback(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error || request?.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada.'));
  }));
}
const saveLocal = data => storeAction('readwrite', store => store.put({ key: CACHE_KEY, data, savedAt: Date.now() }));
const readLocal = () => storeAction('readonly', store => store.get(CACHE_KEY));
const deleteLocal = () => storeAction('readwrite', store => store.delete(CACHE_KEY));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function renderPosts(posts) {
  postsContainer.innerHTML = posts.map(post => `
    <div class="col-md-6"><article class="card h-100 border-0 bg-light">
      <div class="card-body"><span class="badge text-bg-primary mb-2">Publicación #${post.id}</span>
      <h3 class="h6">${escapeHtml(post.title)}</h3><p class="small text-secondary mb-0">${escapeHtml(post.body)}</p></div>
    </article></div>`).join('');
  document.getElementById('count').textContent = `${posts.length} registros`;
}
function setMessage(text, type = 'light') {
  message.className = `alert alert-${type} ${type === 'light' ? 'border' : ''}`;
  message.textContent = text;
}
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

async function loadData() {
  setMessage('Consultando la API…', 'info');
  try {
    // Network-First: se intenta obtener una respuesta nueva antes de usar el respaldo.
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`La API respondió con HTTP ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('La respuesta de la API no tiene el formato esperado.');
    await saveLocal(data);
    renderPosts(data);
    document.getElementById('sourceLabel').textContent = 'API remota (red)';
    document.getElementById('savedAt').textContent = formatDate(Date.now());
    setMessage('Datos actualizados desde la API y guardados localmente.', 'success');
  } catch (error) {
    try {
      const cached = await readLocal();
      if (cached && Array.isArray(cached.data)) {
        renderPosts(cached.data);
        document.getElementById('sourceLabel').textContent = 'IndexedDB (respaldo local)';
        document.getElementById('savedAt').textContent = formatDate(cached.savedAt);
        setMessage(`No se pudo consultar la red (${error.message}). Se muestran los últimos datos guardados.`, 'warning');
      } else {
        setMessage(`No se pudo consultar la API y todavía no existe respaldo local. Conéctate y vuelve a intentarlo. (${error.message})`, 'danger');
      }
    } catch (dbError) {
      setMessage(`Falló la red y también la lectura local: ${dbError.message}`, 'danger');
    }
  }
}

document.getElementById('refreshData').addEventListener('click', loadData);
document.getElementById('clearLocal').addEventListener('click', async () => {
  try {
    await deleteLocal();
    postsContainer.innerHTML = '';
    document.getElementById('count').textContent = '0 registros';
    document.getElementById('sourceLabel').textContent = 'Sin respaldo';
    document.getElementById('savedAt').textContent = 'Sin datos';
    setMessage('Respaldo de IndexedDB eliminado. La caché HTTP del Service Worker es independiente.', 'secondary');
  } catch (error) {
    setMessage(`No se pudo borrar el respaldo: ${error.message}`, 'danger');
  }
});

(async function init() {
  try {
    dbPromise = openDb();
    await dbPromise;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service Worker no registrado:', error));
    }
    updateNetworkStatus();
    await loadData();
  } catch (error) {
    setMessage(`No se pudo inicializar IndexedDB: ${error.message}`, 'danger');
  }
})();
