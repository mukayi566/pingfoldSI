// ============================================================
// Logo component
// ============================================================

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { imgH: 36, text: '0.9375rem' },
    md: { imgH: 48, text: '1.125rem' },
    lg: { imgH: 64, text: '1.375rem' },
  };
  const s = sizes[size];

  return (
    <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      <img
        src="/Ribbon P Logo.png"
        alt="PingFold logo"
        style={{
          height: s.imgH,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <span className="logo-text" style={{ fontSize: s.text }}>
        ing<span>Fold</span>
      </span>
    </div>
  );
}
