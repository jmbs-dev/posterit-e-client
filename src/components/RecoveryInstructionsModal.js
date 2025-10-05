// src/components/RecoveryInstructionsModal.js
import QRCode from 'qrcode';

const printLink = `<a href="#" id="print-link" style="color:#343a40; text-decoration:underline; font-size:16px; position:absolute; top:18px; right:18px;">[imprimir]</a>`;

export function showRecoveryInstructionsModal({ secretId, recoveryPassword, onClose }) {
  const modal = document.createElement('div');
  modal.id = 'recovery-modal';
  modal.style = `
    position: fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;
  modal.innerHTML = `
    <div id="recovery-modal-content" style="background:#fff; padding:32px; border-radius:8px; max-width:400px; width:100%; box-shadow:0 4px 24px rgba(0,0,0,0.2); text-align:center; position:relative;">
      ${printLink}
      <h2 style="margin-bottom:10px;">Instrucciones para la Recuperación</h2>
      <p style="margin-bottom:18px;">Estas son las instrucciones vitales para que tu beneficiario pueda recuperar tu secreto. Asegúrate de guardarlas en un lugar seguro y compartirlas con la persona designada de manera confiable. No compartas tu contraseña de recuperación directamente. El beneficiario necesitará este código QR y la contraseña de activación que creaste para iniciar el proceso.</p>
      <div style="margin:16px 0;">
        <strong>Contraseña de Recuperación:</strong>
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px;">
          <span id="recovery-password" style="font-family:monospace; background:#eee; padding:6px 12px; border-radius:4px;">${recoveryPassword}</span>
        </div>
        <div style="margin-top:8px; display:flex; justify-content:center;">
          <button id="copy-password" style="padding:4px 8px;">Copiar</button>
        </div>
        <div style="margin-top:8px; font-size:small; color:#495057;">Código de Secreto: <span style="font-family:monospace;">${secretId}</span></div>
      </div>
      <div style="margin:16px 0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <strong style="margin-bottom:8px;">Código QR de activación:</strong>
        <div style="display:flex; justify-content:center;">
          <canvas id="qr-canvas" style="margin-top:8px;"></canvas>
        </div>
      </div>
      <button id="close-modal" style="margin-top:16px; padding:8px 16px;">Cerrar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const qrUrl = `${import.meta.env.VITE_APP_FRONTEND_BASE_URL}/activation?secretId=${secretId}`;
  QRCode.toCanvas(document.getElementById('qr-canvas'), qrUrl, { width: 200 }, error => {
    if (error) console.error(error);
  });

  document.getElementById('copy-password').onclick = () => {
    navigator.clipboard.writeText(recoveryPassword);
    const copyBtn = document.getElementById('copy-password');
    copyBtn.innerText = '¡Copiado!';
    setTimeout(() => {
      copyBtn.innerText = 'Copiar';
    }, 1500);
  };

  document.getElementById('close-modal').onclick = () => {
    document.body.removeChild(modal);
    if (onClose) onClose();
  };

  document.getElementById('print-link').onclick = e => {
    e.preventDefault();
    const modalContent = document.getElementById('recovery-modal-content');
    const clone = modalContent.cloneNode(true);
    const qrCanvas = clone.querySelector('#qr-canvas');
    if (qrCanvas) {
      const img = document.createElement('img');
      img.src = document.getElementById('qr-canvas').toDataURL('image/png');
      img.style = qrCanvas.style.cssText;
      img.width = qrCanvas.width;
      img.height = qrCanvas.height;
      qrCanvas.parentNode.replaceChild(img, qrCanvas);
    }
    clone.querySelectorAll('button').forEach(btn => btn.remove());
    clone.querySelectorAll('a').forEach(a => a.remove());
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write(`
      <html><head><title>Instrucciones de Recuperación</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #343a40; }
        h2 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 15px; }
        strong { color: #007bff; }
        .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .qr-section img { margin-top: 8px; }
      </style>
      </head><body><div>${clone.innerHTML}</div></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

