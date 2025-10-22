export function renderMainPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Posterit-E</h1>
    <p>Bienvenido al panel de administración de Posterit-E. Selecciona una opción para continuar:</p>
    <div style="display: flex; gap: 16px; margin-bottom: 32px;">
      <button id="main-nav-secret">Secretos</button>
      <button id="main-nav-activation">Activación</button>
      <button id="main-nav-cancel">Cancelación</button>
    </div>
  `;
  // Use the router instance directly instead of window.router
  setTimeout(() => {
    const router = window.router || (typeof getRouter === 'function' ? getRouter() : null);
    document.getElementById('main-nav-secret').onclick = () => router ? router.navigate('/secret') : location.assign('/secret');
    document.getElementById('main-nav-activation').onclick = () => {
      const secretId = prompt('Por favor, ingresa el Secret ID para la activación:');
      if (secretId && secretId.trim()) {
        const url = `/activation?secretId=${encodeURIComponent(secretId.trim())}`;
        router ? router.navigate(url) : location.assign(url);
      }
    };
    document.getElementById('main-nav-cancel').onclick = () => {
      const token = prompt('Por favor, ingresa el token de cancelación:');
      if (token && token.trim()) {
        const url = `/cancel?token=${encodeURIComponent(token.trim())}`;
        router ? router.navigate(url) : location.assign(url);
      }
    };
  }, 0);
}

