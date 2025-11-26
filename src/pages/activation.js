// src/pages/activation.js

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function renderActivationPage() {
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const secretId = params.get('secretId') || '';

  app.innerHTML = `
    <h2>Activación de Secreto</h2>
    <form id="activation-form" style="max-width:400px;margin:auto;">
      <label>Código de Secreto</label>
      <input type="text" id="secret-id" value="${secretId}" disabled style="width:100%;margin-bottom:12px;" />
      <label>Contraseña de Activación</label>
      <input type="password" id="activation-password" required style="width:100%;margin-bottom:12px;" />
      <button type="submit" id="activation-submit">Activar</button>
      <div id="activation-spinner" style="display:none;margin:12px 0;">⏳ Verificando...</div>
      <div id="activation-message" style="margin-top:12px;"></div>
    </form>
  `;

  const form = document.getElementById('activation-form');
  const passwordInput = document.getElementById('activation-password');
  const submitBtn = document.getElementById('activation-submit');
  const spinner = document.getElementById('activation-spinner');
  const message = document.getElementById('activation-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';
    spinner.style.display = 'block';
    submitBtn.disabled = true;

    try {
      console.log('[Posterit-E] Iniciando proceso de activación...');
      const apiUrl = import.meta.env.VITE_API_URL;
      console.log('[Posterit-E] Solicitando saltCr para secretId:', secretId);
      const saltRes = await fetch(`${apiUrl}/activation/${secretId}`);
      let saltData = {};
      const saltContentType = saltRes.headers.get('content-type') || '';
      if (saltContentType.includes('application/json')) {
        try { saltData = await saltRes.json(); } catch (e) { console.error('Error parsing salt JSON:', e); }
      } else {
        try { const text = await saltRes.text(); if (text) saltData.message = text; } catch (e) {}
      }
      if (!saltRes.ok) {
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        let errorMsg = saltData.message || '';
        if (saltRes.status === 404) {
          errorMsg = 'El ID del secreto no fue encontrado.';
        } else if (!errorMsg) {
          errorMsg = 'No se pudo obtener la sal.';
        }
        message.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
        return;
      }
      const saltCr = saltData.saltCr;
      console.log('[Posterit-E] saltCr recibido:', saltCr);
      if (!saltCr) throw new Error('No se recibió la sal del servidor.');

      const password = passwordInput.value;
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const saltBuffer = base64ToArrayBuffer(saltCr);
      console.log('[Posterit-E] Derivando hash con PBKDF2...');
      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 600000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );
      const clientHash = arrayBufferToBase64(derivedBits);
      console.log('[Posterit-E] clientHash generado:', clientHash);

      console.log('[Posterit-E] Enviando clientHash para verificación...');
      const verifyRes = await fetch(`${apiUrl}/activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretId, clientHash })
      });
      let verifyData = {};
      const verifyContentType = verifyRes.headers.get('content-type') || '';
      if (verifyContentType.includes('application/json')) {
        try { verifyData = await verifyRes.json(); } catch (e) { console.error('Error parsing verify JSON:', e); }
      } else {
        try { const text = await verifyRes.text(); if (text) verifyData.message = text; } catch (e) {}
      }
      if (!verifyRes.ok) {
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        message.innerHTML = `<strong>Error:</strong> ${verifyData.message || 'La contraseña es incorrecta.'}`;
        return;
      }
      console.log('[Posterit-E] Verificación exitosa:', verifyData);
      app.innerHTML = `
        <h2>Activación de Secreto</h2>
        <div style="color:green;font-weight:bold;margin-top:24px;">
          ¡Verificación exitosa! El proceso de activación ha comenzado...
        </div>
      `;
    } catch (err) {
      console.error('[Posterit-E] Error en el proceso de activación:', err);
      spinner.style.display = 'none';
      submitBtn.disabled = false;
      message.innerHTML = `<strong>Error:</strong> ${err.message || 'Error de red. Por favor, inténtalo de nuevo.'}`;
    }
  });
}
