import './Footer.css';

async function clearCacheAndReload() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  location.reload();
}

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">
        <span className="footer-lock" aria-hidden="true">🔒</span>
        כל העיבוד מתבצע מקומית בדפדפן — הנתונים לא עוזבים את המכשיר שלך
      </p>
      <button className="footer-clear-btn" onClick={clearCacheAndReload} type="button">
        נקה מטמון ורענן
      </button>
    </footer>
  );
}
