export function renderOtpPage() {
  const app = document.getElementById('app');
  if (!app) return;

  const params = new URLSearchParams(window.location.search);
  const secretIdParam = params.get('secretId') || '';

  app.innerHTML = `
    <h1>Verificación de Identidad (OTP)</h1>
    <form id="otp-form" style="max-width:400px;margin:auto;">
      <label for="otp-secret-id">ID de Secreto</label>
      <input type="text" id="otp-secret-id" name="secretId" value="${secretIdParam}" placeholder="Ingrese el ID del secreto" required style="width:100%;margin-bottom:12px;" />
      <label for="otp-value">Código OTP (6 dígitos)</label>
      <input type="text" id="otp-value" name="otp" pattern="\\d{6}" maxlength="6" minlength="6" placeholder="Ingrese el código OTP" required style="width:100%;margin-bottom:12px;" />
      <button type="submit" id="otp-submit">Verificar Identidad</button>
    </form>
    <div id="otp-status-message" style="margin-top:12px;display:none;"></div>
  `;

  const form = document.getElementById('otp-form');
  const secretIdInput = document.getElementById('otp-secret-id');
  const otpInput = document.getElementById('otp-value');
  const submitBtn = document.getElementById('otp-submit');
  const status = document.getElementById('otp-status-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    submitBtn.disabled = true;

    const secretId = secretIdInput.value.trim();
    const otp = otpInput.value.trim();

    if (!secretId || !otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      status.innerHTML = '<strong>Error:</strong> Debe ingresar un ID de secreto y un código OTP válido de 6 dígitos.';
      submitBtn.disabled = false;
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        status.innerHTML = '<strong>Error:</strong> La variable de entorno VITE_API_URL no está definida.';
        submitBtn.disabled = false;
        return;
      }
      const response = await fetch(`${API_URL}/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretId, otp })
      });
      let data = {};
      let rawText = '';
      try {
        rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          data = { message: rawText };
        }
      } catch (e) {
        data = { message: '' };
      }
      if (response.ok) {
        form.style.display = 'none';
        // Always show a success message, fallback if missing
        const successMsg = data.message && data.message.trim() ? data.message : 'Recibirá un email con instrucciones para recuperar su secreto.';
        status.innerHTML = `<h2>Verificación exitosa</h2><p>${successMsg}</p>`;
        status.style.display = 'block'; // Ensure the message is visible
        return;
      }
      let errorMsg = data.message || rawText || '';
      if (response.status === 401) {
        errorMsg = 'El código OTP es incorrecto o ha expirado.';
      } else if (response.status === 404) {
        errorMsg = 'El ID del secreto no fue encontrado o no está en el estado correcto para la verificación.';
      } else if (!errorMsg) {
        errorMsg = 'Error de verificación. Intente nuevamente.';
      }
      status.innerHTML = `<strong>Error:</strong> ${errorMsg}`;
      status.style.display = 'block';
      submitBtn.disabled = false;
    } catch (err) {
      console.error('Network or fetch error:', err);
      status.innerHTML = `<strong>Error:</strong> ${err.message || 'Error de red. Por favor, inténtalo de nuevo.'}`;
      submitBtn.disabled = false;
    }
  });
}
