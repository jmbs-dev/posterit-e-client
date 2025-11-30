import Navigo from 'navigo';
import { renderSecretsPage } from './pages/secrets.js';
import { renderActivationPage } from './pages/activation.js';
import { renderCancellationPage } from './pages/cancellation.js';
import { renderMainPage } from './pages/main.js';
import { renderOtpPage } from './pages/otp.js';
import { renderSecretsDataPage } from './pages/secrets_data.js';
import './style.css';

// --- ROUTER ---
const router = new Navigo('/', { hash: false });

router.on({
  '/': () => renderMainPage(),
  '/secret': () => renderSecretsPage(),
  '/activation': () => renderActivationPage(),
  '/cancel': () => renderCancellationPage(),
  '/otp': () => renderOtpPage(),
  '/secrets/:secretId/data': () => renderSecretsDataPage()
}).resolve();

// Optional: handle internal navigation for anchor tags
document.addEventListener('click', function (e) {
  if (e.target.tagName === 'A' && e.target.href && e.target.origin === window.location.origin) {
    e.preventDefault();
    router.navigate(e.target.pathname + e.target.search);
  }
});
