import { useState } from "react";
import { kirimFeedback } from "../lib/feedback";
import { jpegUntukFeedback } from "../lib/image";
import { track } from "../lib/analytics";
import { tandaiFeedback } from "../lib/state";
import type { AppConfig, Detection, Kelas } from "../lib/types";

interface Props {
  cfg: AppConfig;
  predicted: Kelas;
  deteksi: Detection;
  canvas: HTMLCanvasElement;
  feedbackKey: string;
  onClose: () => void;
  onSent: () => void;
}

export default function FeedbackSheet({ cfg, predicted, deteksi, canvas, feedbackKey, onClose, onSent }: Props) {
  const [pilih, setPilih] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "kirim" | "ok" | "gagal" | "off">("idle");
  const pilihan: { id: string; label: string }[] = [
    ...cfg.kelas.filter((k) => k !== predicted).map((k) => ({ id: k, label: cfg.kelasDetail[k].nama })),
    { id: "bukan_sampah", label: "Bukan sampah" },
  ];

  async function kirim() {
    if (!pilih || status === "kirim") return;
    setStatus("kirim");
    const hasil = await kirimFeedback({
      predicted,
      correct: pilih,
      box: [deteksi.x / canvas.width, deteksi.y / canvas.height, deteksi.w / canvas.width, deteksi.h / canvas.height],
      imageB64: jpegUntukFeedback(canvas),
    });
    if (hasil === "ok") {
      tandaiFeedback(feedbackKey);
      track("feedback_kirim", { predicted, correct: pilih });
      setStatus("ok");
      onSent();
    } else {
      setStatus(hasil === "tidak-tersedia" ? "off" : "gagal");
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-judul" onClick={(e) => e.stopPropagation()}>
        <h2 id="fb-judul">Apa yang seharusnya?</h2>
        <p className="muted">Model menyebut ini {cfg.kelasDetail[predicted].nama}. Pilih yang benar.</p>
        {status === "ok" ? (
          <>
            <p className="ok-text">Terima kasih, koreksimu terkirim dan akan ditinjau sebelum dipakai melatih model.</p>
            <button className="btn" onClick={onClose}>Tutup</button>
          </>
        ) : (
          <>
            <div className="radio-list" role="radiogroup" aria-label="Kelas yang benar">
              {pilihan.map((p) => (
                <label key={p.id} className={"radio" + (pilih === p.id ? " on" : "")}>
                  <input type="radio" name="kelas-benar" checked={pilih === p.id} onChange={() => setPilih(p.id)} />
                  {p.label}
                </label>
              ))}
            </div>
            <p className="consent">Gambar ini akan disimpan untuk memperbaiki model. Tidak ada data pribadi yang ikut dikirim.</p>
            {status === "off" && <p className="err-text">Pengiriman belum aktif di versi ini (Firebase belum dikonfigurasi).</p>}
            {status === "gagal" && <p className="err-text">Belum terkirim. Periksa koneksi, atau tunggu beberapa detik lalu coba lagi.</p>}
            <div className="row">
              <button className="btn ghost" onClick={onClose}>Batal</button>
              <button className="btn" disabled={!pilih || status === "kirim"} onClick={kirim}>
                {status === "kirim" ? "Mengirim..." : "Kirim koreksi"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
