const swStatus = document.getElementById('swStatus');
const permissionStatus = document.getElementById('permissionStatus');
const sendButton = document.getElementById('sendNotification');
let registration = null;

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    swStatus.className = 'alert alert-danger';
    swStatus.textContent = 'Este navegador no admite Service Workers.';
    return;
  }
  try {
    registration = await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    swStatus.className = 'alert alert-success';
    swStatus.textContent = 'Service Worker registrado y listo.';
    updatePermissionStatus();
  } catch (error) {
    swStatus.className = 'alert alert-danger';
    swStatus.textContent = `No se pudo registrar el Service Worker: ${error.message}`;
  }
}

function updatePermissionStatus() {
  const permission = ('Notification' in window) ? Notification.permission : 'unsupported';
  permissionStatus.className = permission === 'granted' ? 'alert alert-success' : 'alert alert-light border';
  permissionStatus.textContent = permission === 'unsupported' ? 'Las notificaciones no están disponibles en este navegador.' : `Permiso actual: ${permission}`;
  sendButton.disabled = !(registration && permission === 'granted');
}

async function requestPermission() {
  if (!('Notification' in window)) {
    permissionStatus.className = 'alert alert-danger';
    permissionStatus.textContent = 'Este navegador no admite la API Notification.';
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    updatePermissionStatus();
    if (permission !== 'granted') {
      permissionStatus.className = 'alert alert-warning';
      permissionStatus.textContent = 'No se concedió el permiso. Puedes modificarlo desde los ajustes del sitio.';
    }
  } catch (error) {
    permissionStatus.className = 'alert alert-danger';
    permissionStatus.textContent = `No se pudo solicitar el permiso: ${error.message}`;
  }
}

async function sendNotification() {
  if (!registration || Notification.permission !== 'granted') {
    updatePermissionStatus();
    return;
  }
  try {
    await registration.showNotification('¡PWA funcionando!', {
      body: 'Esta es una notificación local de prueba.',
      icon: './icon.svg',
      badge: './icon.svg',
      vibrate: [200, 100, 200],
      tag: 'pwa-demo-local',
      data: { url: './' }
    });
    permissionStatus.className = 'alert alert-success';
    permissionStatus.textContent = 'Notificación enviada al sistema. La vibración depende del navegador y dispositivo.';
  } catch (error) {
    permissionStatus.className = 'alert alert-danger';
    permissionStatus.textContent = `No se pudo mostrar la notificación: ${error.message}`;
  }
}

document.getElementById('requestPermission').addEventListener('click', requestPermission);
sendButton.addEventListener('click', sendNotification);
setupServiceWorker();
