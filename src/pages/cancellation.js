export function renderCancellationPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <h1>Confirmar Cancelación</h1>
    <p>¿Estás seguro de que deseas cancelar el proceso de recuperación de tu secreto? Esta acción es irreversible.</p>
    <button id="confirm-cancel-btn">Cancelar Proceso de Recuperación</button>
    <div id="status-message"></div>
  `;

  const token = new URLSearchParams(window.location.search).get('token');
  const btn = document.getElementById('confirm-cancel-btn');
  const status = document.getElementById('status-message');

  if (!token) {
    status.innerHTML = `<strong>Error:</strong> No cancellation token found in the URL.`;
    btn.disabled = true;
    return;
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    status.textContent = 'Processing...';

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        status.innerHTML = '<strong>Error:</strong> La variable de entorno VITE_API_URL no está definida. Por favor, verifica tu archivo .env.';
        btn.disabled = false;
        return;
      }
      const response = await fetch(
        `${API_URL}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancellation_token: token })
        }
      );
      // Log the full response for debugging
      console.log('Cancel API response:', response);
      let data = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          console.error('Error parsing JSON response:', e);
        }
      } else {
        try {
          const text = await response.text();
          if (text) data.message = text;
        } catch (e) {}
      }
      if (response.ok) {
        btn.style.display = 'none';
        status.innerHTML = `
          <h2>Proceso cancelado exitosamente.</h2>
          <p>${data.message ? data.message : 'El intento de recuperación ha sido detenido.'}</p>
        `;
        return;
      }
      status.innerHTML = `<strong>Error:</strong> ${data.message || 'El token es inválido, no autorizado o el proceso ya no puede ser cancelado.'}`;
      btn.disabled = false;
    } catch (err) {
      // Log the error for debugging
      console.error('Network or fetch error:', err);
      status.innerHTML = `<strong>Error:</strong> ${err.message || 'Network error. Please try again.'}`;
      btn.disabled = false;
    }
  });
}
