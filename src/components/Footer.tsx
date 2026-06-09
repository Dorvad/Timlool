import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">
        <span className="footer-lock" aria-hidden="true">🔒</span>
        כל העיבוד מתבצע מקומית בדפדפן — הנתונים לא עוזבים את המכשיר שלך
      </p>
    </footer>
  );
}
