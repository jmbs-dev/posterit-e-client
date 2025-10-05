// src/pages/secrets.js
import { encryptAndPreparePayload } from '../crypto/crypto.js';
import { showRecoveryInstructionsModal } from '../components/RecoveryInstructionsModal.js';

export function renderSecretsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Posterit-E: Create a New Secret</h1>
    <p>Securely and privately store your digital legacy.</p>
    <form id="secret-form" style="max-width:700px;margin:auto;">
      <h2>1. Your Secret</h2>
      <p>Enter the information you want to protect. This can be text, passwords, keys, etc.</p>
      <textarea id="secret-content" rows="8" placeholder="Paste your secret here..." required></textarea>
      <h2>Owner Information</h2>
      <p>Enter the email address of the secret owner. This is required for notifications and verification.</p>
      <label for="titular-alert-contact">Owner's Email:</label>
      <input type="email" id="titular-alert-contact" placeholder="owner@example.com" required>
      <h2>2. The Beneficiary</h2>
      <p>Who should receive this secret?</p>
      <label for="beneficiary-contact">Beneficiary's Email:</label>
      <input type="email" id="beneficiary-contact" placeholder="beneficiary@example.com" required>
      <h2>3. Recovery Instructions</h2>
      <p>Create a unique password for this secret. The beneficiary will need it to decrypt the content. <strong>Do not forget it; it cannot be recovered.</strong></p>
      <label for="recovery-password">Recovery Password:</label>
      <input type="password" id="recovery-password" required>
      <h2>4. Grace Period</h2>
      <p>How long should pass after the beneficiary starts the recovery process before the secret is released? (This gives you time to cancel if it was a mistake).</p>
      <label for="grace-period">Select a period:</label>
      <select id="grace-period" required>
        <option value="2592000">30 days (Recommended)</option>
        <option value="604800">7 days</option>
        <option value="86400">1 day</option>
        <option value="300">5 minutes (For testing)</option>
      </select>
      <hr>
      <button type="submit">Encrypt and Store Secret</button>
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
      const responseData = await response.json();
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
      document.getElementById('show-instructions-btn').onclick = () => {
        showRecoveryInstructionsModal({
          secretId: lastSecretId,
          recoveryPassword: lastRecoveryPassword,
          onClose: () => {}
        });
      };
      secretForm.reset();
    } catch (error) {
      console.error('[Posterit-E] Error en el proceso:', error);
      resultMessage.innerText = `Error: ${error.message}`;
      resultMessage.style.color = 'red';
    } finally {
      submitButton.disabled = false;
      submitButton.innerText = 'Guardar Secreto';
      resultMessage.style.display = 'block';
    }
  });
}
