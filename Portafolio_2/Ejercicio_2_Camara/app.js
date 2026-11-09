const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');
const statusBadge = document.getElementById('cameraStatus');
let stream = null;

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    message.textContent = 'getUserMedia no está disponible. Usa localhost o HTTPS y un navegador compatible.';
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    await video.play();
    statusBadge.className = 'badge text-bg-success';
    statusBadge.textContent = 'Cámara activa';
    message.textContent = 'Cámara activa. Pulsa “Tomar fotografía” para capturar un fotograma.';
    document.getElementById('capture').disabled = false;
    document.getElementById('stopCamera').disabled = false;
    document.getElementById('startCamera').disabled = true;
  } catch (error) {
    message.textContent = error.name === 'NotAllowedError'
      ? 'Acceso denegado. Permite el uso de la cámara en los permisos del sitio.'
      : `No se pudo iniciar la cámara: ${error.message}`;
  }
}

function capturePhoto() {
  if (!stream || video.videoWidth === 0) {
    message.textContent = 'Espera a que la cámara muestre video antes de capturar.';
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const link = document.getElementById('download');
  link.href = canvas.toDataURL('image/png');
  link.classList.remove('disabled');
  message.textContent = `Fotografía capturada (${canvas.width} × ${canvas.height}).`;
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  statusBadge.className = 'badge text-bg-secondary';
  statusBadge.textContent = 'Cámara detenida';
  document.getElementById('capture').disabled = true;
  document.getElementById('stopCamera').disabled = true;
  document.getElementById('startCamera').disabled = false;
  message.textContent = 'Cámara detenida. Puedes volver a activarla cuando quieras.';
}

document.getElementById('startCamera').addEventListener('click', startCamera);
document.getElementById('capture').addEventListener('click', capturePhoto);
document.getElementById('stopCamera').addEventListener('click', stopCamera);
window.addEventListener('pagehide', stopCamera);
