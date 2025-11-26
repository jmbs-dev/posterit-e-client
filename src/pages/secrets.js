// src/pages/secrets.js
import { encryptAndPreparePayload } from '../crypto/crypto.js';
import { showRecoveryInstructionsModal } from '../components/RecoveryInstructionsModal.js';

export function renderSecretsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Posterit-E: Crear un Nuevo Secreto</h1>
    <p>Almacena tu legado digital de forma segura y privada.</p>
    <form id="secret-form" style="max-width:700px;margin:auto;">
      <h2>1. Tu Secreto</h2>
      <p>Ingresa la información que deseas proteger. Esto puede ser texto, contraseñas, claves, etc.</p>
      <textarea id="secret-content" rows="8" placeholder="Pega tu secreto aquí..." required></textarea>
      <h2>Información del Propietario</h2>
      <p>Ingresa la dirección de correo electrónico del propietario del secreto. Esto es necesario para notificaciones y verificación.</p>
      <label for="titular-alert-contact">Correo del Propietario:</label>
      <input type="email" id="titular-alert-contact" placeholder="propietario@ejemplo.com" required>
      <h2>2. El Beneficiario</h2>
      <p>¿Quién debería recibir este secreto?</p>
      <label for="beneficiary-contact">Correo del Beneficiario:</label>
      <input type="email" id="beneficiary-contact" placeholder="beneficiario@ejemplo.com" required>
      <h2>3. Instrucciones de Recuperación</h2>
      <p>Crea una contraseña única para este secreto. El beneficiario la necesitará para desencriptar el contenido. <strong>No la olvides; no se puede recuperar.</strong></p>
      <label for="recovery-password">Contraseña de Recuperación:</label>
      <input type="password" id="recovery-password" required>
      <h2>4. Período de Gracia</h2>
      <p>¿Cuánto tiempo debe pasar después de que el beneficiario inicie el proceso de recuperación antes de que se libere el secreto? (Esto te da tiempo para cancelar si fue un error).</p>
      <label for="grace-period">Selecciona un período:</label>
      <select id="grace-period" required>
        <option value="2592000">30 días (Recomendado)</option>
        <option value="604800">7 días</option>
        <option value="86400">1 día</option>
        <option value="300">5 minutos (Para pruebas)</option>
      </select>
      <hr>
      <button type="submit">Cifrar y Almacenar Secreto</button>
      <div id="result-message" style="margin-top:12px;"></div>
    </form>
  `;

  const secretForm = document.getElementById('secret-form');
  const secretContent = document.getElementById('secret-content');
  const beneficiaryContact = document.getElementById('beneficiary-contact');
  const recoveryPassword = document.getElementById('recovery-password');
  const gracePeriod = document.getElementById('grace-period');
  const resultMessage = document.getElementById('result-message');
  const submitButton = secretForm.querySelector('button');
  const titularAlertContact = document.getElementById('titular-alert-contact');

  let lastSecretId = null;
  let lastRecoveryPassword = null;

  secretForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.innerText = 'Guardando...';
    resultMessage.style.display = 'none';

    try {
      console.log('[Posterit-E] Iniciando proceso de cifrado y almacenamiento de secreto...');
      const secret = secretContent.value;
      const beneficiary = beneficiaryContact.value;
      const password = recoveryPassword.value;
      const gracePeriodSeconds = parseInt(gracePeriod.value, 10);
      const ownerEmail = titularAlertContact.value;
      const API_URL = import.meta.env.VITE_API_URL;
      const API_KEY = import.meta.env.VITE_API_KEY;

      const cryptoPayload = await encryptAndPreparePayload(secret, password);
      console.log('[Posterit-E] Payload criptográfico generado:', cryptoPayload);
      const apiPayload = {
        ...cryptoPayload,
        beneficiaryContact: beneficiary,
        gracePeriodSeconds: gracePeriodSeconds,
        titularAlertContact: ownerEmail,
      };
      const fetchBody = JSON.stringify(apiPayload);
      console.log('[Posterit-E] Payload final enviado al backend:', fetchBody);
      const response = await fetch(`${API_URL}/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: fetchBody,
      });
      let responseData = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { responseData = await response.json(); } catch (e) { console.error('Error parsing secrets JSON:', e); }
      } else {
        try { const text = await response.text(); if (text) responseData.message = text; } catch (e) {}
      }
      if (!response.ok) throw new Error(responseData.message || `Server Error: ${response.status}`);
      console.log('[Posterit-E] Secreto almacenado exitosamente:', responseData);
      lastSecretId = responseData.secretId;
      lastRecoveryPassword = password;
      resultMessage.innerHTML = `
        <span style="color:green;">¡Éxito! Se ha almacenado tu secreto. Secret ID: ${lastSecretId}</span>
        <br>
        <button id="show-instructions-btn" style="margin-top:12px; padding:8px 16px;">Generar Instrucciones de Recuperación</button>
      `;
      resultMessage.style.display = 'block';
      showRecoveryInstructionsModal({
        secretId: lastSecretId,
        recoveryPassword: lastRecoveryPassword,
        onClose: () => {}
      });
      submitButton.disabled = false;
      submitButton.innerText = 'Cifrar y Almacenar Secreto';
    } catch (err) {
      console.error('[Posterit-E] Error en el proceso de almacenamiento:', err);
      resultMessage.innerHTML = `<strong>Error:</strong> ${err.message || 'Error de red. Por favor, inténtalo de nuevo.'}`;
      resultMessage.style.display = 'block';
      submitButton.disabled = false;
      submitButton.innerText = 'Cifrar y Almacenar Secreto';
    }
  });
}
