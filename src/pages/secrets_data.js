// ...existing imports...
import { decryptSecret } from '../crypto/crypto.js';

export function renderSecretsDataPage() {
  const app = document.getElementById('app');
  if (!app) return;

  // Extract secretId from path and token from query
  const pathMatch = window.location.pathname.match(/\/secrets\/(.+)\/data/);
  const secretId = pathMatch ? pathMatch[1] : '';
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  app.innerHTML = `<h1>Descargar Secreto Cifrado</h1>
    <div id="secrets-data-status" style="margin-bottom:16px;"></div>
    <div id="secrets-data-form-container"></div>
  `;

  const status = document.getElementById('secrets-data-status');
  const formContainer = document.getElementById('secrets-data-form-container');

  if (!secretId || !token) {
    status.innerHTML = '<strong>Error:</strong> Faltan parámetros requeridos en la URL.';
    return;
  }

  // Fetch encrypted data from backend
  const API_URL = import.meta.env.VITE_API_URL;
  fetch(`${API_URL}/secrets/${secretId}/data?token=${encodeURIComponent(token)}`)
    .then(async (response) => {
      let data = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await response.json(); } catch (e) { console.error('Error parsing JSON response:', e); }
      } else {
        try { const text = await response.text(); if (text) data.message = text; } catch (e) {}
      }
      if (response.ok) {
        // Show password form
        formContainer.innerHTML = `
          <form id="decrypt-form" style="max-width:400px;margin:auto;">
            <label for="decrypt-password">Contraseña</label>
            <input type="password" id="decrypt-password" name="password" required style="width:100%;margin-bottom:12px;" />
            <button type="submit" id="decrypt-submit">Descifrar Secreto</button>
            <div id="decrypt-status-message" style="margin-top:12px;"></div>
          </form>
        `;
        const decryptForm = document.getElementById('decrypt-form');
        const passwordInput = document.getElementById('decrypt-password');
        const decryptBtn = document.getElementById('decrypt-submit');
        const decryptStatus = document.getElementById('decrypt-status-message');
        decryptForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          decryptStatus.textContent = '';
          decryptBtn.disabled = true;
          const password = passwordInput.value;
          if (!password) {
            decryptStatus.innerHTML = '<strong>Error:</strong> Debe ingresar la contraseña.';
            decryptBtn.disabled = false;
            return;
          }
          try {
            // Logging decryption steps
            console.log('[Decryption] Iniciando proceso de descifrado...');
            console.log('[Decryption] Contraseña recibida:', password ? '***' : '(vacía)');
            console.log('[Decryption] saltKek:', data.saltKek);
            console.log('[Decryption] encryptedDek:', data.encryptedDek);
            console.log('[Decryption] encryptedSecret:', data.encryptedSecret);

            // Decrypt using the provided password and backend payload
            const decrypted = await decryptSecret(
              password,
              data.saltKek,
              data.encryptedDek,
              data.encryptedSecret
            );
            console.log('[Decryption] Descifrado exitoso.');
            decryptStatus.innerHTML = `<strong>Secreto descifrado:</strong> <pre>${decrypted}</pre>`;
            decryptBtn.disabled = false;
          } catch (err) {
            console.error('[Decryption] Error durante el descifrado:', err);
            decryptStatus.innerHTML = `<strong>Error:</strong> ${err.message || 'Error al descifrar el secreto.'}`;
            decryptBtn.disabled = false;
          }
        });
        return;
      }
      let errorMsg = data.message || '';
      if (response.status === 401) {
        errorMsg = 'El token es inválido, ha expirado o ya fue utilizado.';
      } else if (response.status === 404) {
        errorMsg = 'El ID del secreto no fue encontrado.';
      } else if (!errorMsg) {
        errorMsg = 'Error al obtener el secreto cifrado. Intente nuevamente.';
      }
      status.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
    })
    .catch((err) => {
      status.innerHTML = `<strong>Error:</strong> ${err.message || 'Error de red. Por favor, inténtalo de nuevo.'}`;
    });
}
