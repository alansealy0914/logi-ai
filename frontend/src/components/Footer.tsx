export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #e1e4e8',
      padding: '14px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f6f8fa',
      fontSize: 13,
      color: '#6a737d',
      flexShrink: 0,
    }}>
      <span>🚛 <strong style={{ color: '#1a1f2e' }}>LogiAI</strong> — Intelligent Transportation Logistics</span>
      <span>Omaha, Nebraska</span>
      <span>© 2026 LogiAI. All rights reserved.</span>
    </footer>
  );
}
