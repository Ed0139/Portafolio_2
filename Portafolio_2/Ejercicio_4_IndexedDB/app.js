const DB_NAME = 'PortafolioPWA_DB';
const DB_VERSION = 1;
const STORE_NAME = 'registros';
const message = document.getElementById('message');
const recordsContainer = document.getElementById('records');
let dbPromise;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
  });
}

function transactionRequest(mode, action) {
  return dbPromise.then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let request;
    try { request = action(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error || request?.error || new Error('Falló la transacción.'));
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada.'));
  }));
}

async function addRecord(record) {
  return transactionRequest('readwrite', store => store.add(record));
}
async function getAllRecords() {
  return transactionRequest('readonly', store => store.getAll());
}
async function deleteRecord(id) {
  return transactionRequest('readwrite', store => store.delete(id));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

async function renderRecords() {
  try {
    const records = await getAllRecords();
    records.sort((a, b) => b.createdAt - a.createdAt);
    if (!records.length) {
      recordsContainer.innerHTML = '<div class="list-group-item text-secondary">Todavía no hay registros. Agrega el primero con el formulario.</div>';
      return;
    }
    recordsContainer.innerHTML = records.map(record => `
      <div class="list-group-item py-3">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div><div class="fw-semibold">${escapeHtml(record.name)}</div>
          <div class="text-secondary small">${escapeHtml(record.notes || 'Sin descripción')}</div>
          <div class="text-secondary small mt-1">ID ${record.id} · ${new Date(record.createdAt).toLocaleString()}</div></div>
          <button class="btn btn-sm btn-outline-danger" data-delete="${record.id}" aria-label="Eliminar registro ${record.id}">Eliminar</button>
        </div>
      </div>`).join('');
  } catch (error) {
    message.className = 'small text-danger mt-3';
    message.textContent = `Error al consultar: ${error.message}`;
  }
}

document.getElementById('recordForm').addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('recordName').value.trim();
  const notes = document.getElementById('recordNotes').value.trim();
  if (!name) return;
  try {
    await addRecord({ name, notes, createdAt: Date.now() });
    event.target.reset();
    message.className = 'small text-success mt-3';
    message.textContent = 'Registro guardado en IndexedDB.';
    await renderRecords();
  } catch (error) {
    message.className = 'small text-danger mt-3';
    message.textContent = `No se pudo guardar: ${error.message}`;
  }
});

recordsContainer.addEventListener('click', async event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  try {
    await deleteRecord(Number(button.dataset.delete));
    message.className = 'small text-success mt-3';
    message.textContent = 'Registro eliminado.';
    await renderRecords();
  } catch (error) {
    message.className = 'small text-danger mt-3';
    message.textContent = `No se pudo eliminar: ${error.message}`;
  }
});
document.getElementById('refresh').addEventListener('click', renderRecords);

(async function init() {
  if (!('indexedDB' in window)) {
    message.className = 'small text-danger mt-3';
    message.textContent = 'IndexedDB no está disponible en este navegador.';
    return;
  }
  try {
    dbPromise = openDatabase();
    await dbPromise;
    message.className = 'small text-success mt-3';
    message.textContent = 'Base de datos lista. Los datos se guardan localmente.';
    await renderRecords();
  } catch (error) {
    message.className = 'small text-danger mt-3';
    message.textContent = `Error al inicializar IndexedDB: ${error.message}`;
  }
})();
