import type { AppConfig } from "../lib/config.ts";
import type { Outcome } from "../lib/decision.ts";

interface Props {
  outcome: Outcome;
  config: AppConfig;
  onRescan: () => void;
}

export function ResultPanel({ outcome, config, onRescan }: Props) {
  return (
    <section className="result" aria-live="polite">
      {outcome.kind === "none" && (
        <div className="notice">
          <h2>Tidak ada sampah terdeteksi</h2>
          <p>Arahkan kamera ke sampah dengan jelas, lalu coba lagi.</p>
        </div>
      )}

      {outcome.kind === "unsure" && (
        <div className="notice">
          <h2>Tidak yakin, coba dari sudut lain</h2>
          <p>Pastikan objek terang, tidak terhalang, dan memenuhi sebagian besar layar.</p>
        </div>
      )}

      {outcome.kind === "ok" &&
        outcome.classes.map(({ classId }) => {
          const name = config.classes[classId];
          const c = config.content[name];
          return (
            <article className="card" key={classId} style={{ borderLeftColor: c.tong.warna }}>
              <header>
                <h2>{c.nama}</h2>
                <span className="chip" style={{ background: c.tong.warna }}>
                  Tong {c.tong.namaWarna}: {c.tong.label}
                </span>
              </header>

              {c.peringatan && (
                <p className="warning" role="alert">
                  ⚠ {c.peringatan}
                </p>
              )}

              <h3>Cara membuang</h3>
              <ul>
                {c.panduan.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>

              <h3>Tahukah kamu?</h3>
              <p>
                <strong>Waktu terurai:</strong> {c.edukasi.waktuTerurai}
              </p>
              <p>{c.edukasi.dampak}</p>
              <p className="muted small">Terkait: {c.edukasi.sdg.join(", ")}</p>
            </article>
          );
        })}

      <button type="button" className="btn primary wide" onClick={onRescan}>
        Scan lagi
      </button>
    </section>
  );
}
