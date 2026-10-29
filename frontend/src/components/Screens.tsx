interface LoadingProps {
  loaded: number;
  total: number;
}

export function LoadingScreen({ loaded, total }: LoadingProps) {
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;
  return (
    <main className="screen">
      <h1 className="brand">TrashScan</h1>
      <p>Memuat model deteksi sampah…</p>
      <div className="progress" role="progressbar" aria-valuenow={pct ?? undefined} aria-valuemin={0} aria-valuemax={100}>
        <div className={pct === null ? "bar indeterminate" : "bar"} style={pct === null ? undefined : { width: `${pct}%` }} />
      </div>
      <p className="muted">
        {pct === null ? `${mb(loaded)} MB` : `${mb(loaded)} / ${mb(total)} MB (${pct}%)`}
      </p>
      <p className="muted small">Pertama kali agak lama, selanjutnya akan lebih cepat.</p>
    </main>
  );
}

export function ErrorScreen({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <main className="screen">
      <h1 className="brand">TrashScan</h1>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn primary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </main>
  );
}

export function UnsupportedScreen({ reasons }: { reasons: string[] }) {
  return (
    <main className="screen">
      <h1 className="brand">TrashScan</h1>
      <h2>Browser belum didukung</h2>
      <p>TrashScan butuh kamera dan WebAssembly. Yang belum tersedia di browser ini:</p>
      <ul>
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="muted small">Coba Chrome atau Edge terbaru di Android, atau Safari terbaru di iOS, lewat alamat HTTPS.</p>
    </main>
  );
}
