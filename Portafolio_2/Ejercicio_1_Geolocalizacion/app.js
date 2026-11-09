const permissionStatus = document.getElementById('permissionStatus');
const result = document.getElementById('result');

async function checkPermission() {
  if (!navigator.permissions || !navigator.permissions.query) {
    permissionStatus.className = 'alert alert-warning';
    permissionStatus.textContent = 'Permissions API no está disponible en este navegador. Puedes probar Solicitar ubicación.';
    return;
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    const render = () => {
      permissionStatus.className = 'alert alert-info';
      permissionStatus.textContent = `Estado del permiso: ${status.state}`;
    };
    render();
    status.onchange = render;
  } catch (error) {
    permissionStatus.className = 'alert alert-warning';
    permissionStatus.textContent = `No fue posible consultar el permiso: ${error.message}`;
  }
}

function getLocation() {
  if (!('geolocation' in navigator)) {
    result.className = 'alert alert-danger';
    result.textContent = 'Este navegador no ofrece la API de geolocalización.';
    return;
  }
  result.className = 'alert alert-info';
  result.textContent = 'Solicitando ubicación al dispositivo…';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      document.getElementById('latitude').textContent = lat.toFixed(6);
      document.getElementById('longitude').textContent = lon.toFixed(6);
      document.getElementById('mapLink').href = `https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lon)}`;
      document.getElementById('coordinates').classList.remove('d-none');
      result.className = 'alert alert-success';
      result.textContent = `Ubicación obtenida. Precisión aproximada: ${Math.round(position.coords.accuracy)} metros.`;
    },
    (error) => {
      const messages = {
        1: 'Permiso denegado. Autoriza la ubicación desde los permisos del sitio.',
        2: 'No se pudo determinar la ubicación. Comprueba el GPS o la conexión.',
        3: 'La solicitud agotó el tiempo de espera. Inténtalo de nuevo.'
      };
      result.className = 'alert alert-danger';
      result.textContent = messages[error.code] || `Error de geolocalización: ${error.message}`;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

document.getElementById('checkPermission').addEventListener('click', checkPermission);
document.getElementById('getLocation').addEventListener('click', getLocation);
checkPermission();
