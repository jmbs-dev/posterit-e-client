import Navigo from 'navigo';
import { renderSecretsPage } from './pages/secrets.js';
import { renderActivationPage } from './pages/activation.js';
import './style.css';

// --- ROUTER ---
const router = new Navigo('/', { hash: false });

router.on({
  '/secret': () => renderSecretsPage(),
  '/activation': () => renderActivationPage()
}).resolve();

// Optional: handle internal navigation for anchor tags
document.addEventListener('click', function (e) {
  if (e.target.tagName === 'A' && e.target.href && e.target.origin === window.location.origin) {
    e.preventDefault();
    router.navigate(e.target.pathname + e.target.search);
  }
});
