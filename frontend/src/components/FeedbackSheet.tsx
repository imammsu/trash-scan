import { useState } from "react";
import { Flag, Send, ShieldCheck, X, CircleCheck, CircleAlert } from "lucide-react";
import { kirimFeedback } from "../lib/feedback";
import { jpegUntukFeedback } from "../lib/image";
import { track } from "../lib/analytics";
import { tandaiFeedback } from "../lib/state";
import { IKON_KELAS } from "../lib/kelasUi";
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
  const [status, setStatus] = useState<"idle" | "kirim" | "ok" | "antre" | "gagal" | "off">("idle");
  const pilihan: { id: string; label: string; kelas?: Kelas }[] = [
    ...cfg.kelas.filter((k) => k !== predicted).map((k) => ({ id: k, label: cfg.kelasDetail[k].nama, kelas: k })),
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
    if (hasil === "ok" || hasil === "antre") {
      tandaiFeedback(feedbackKey);
      track("feedback_kirim", { predicted, correct: pilih });
      setStatus(hasil === "antre" ? "antre" : "ok");
      onSent();
    } else {
      setStatus(hasil === "tidak-tersedia" ? "off" : "gagal");
    }
  }

  const selesai = status === "ok" || status === "antre";

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-judul" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-kepala">
          <div>
            <h2 id="fb-judul"><Flag size={22} aria-hidden="true" style={{ verticalAlign: "-3px" }} /> Apa yang seharusnya?</h2>
            <p className="muted">Model menyebut ini {cfg.kelasDetail[predicted].nama}. Terima kasih sudah membantu memperbaikinya.</p>
          </div>
          <button className="ikon-btn" onClick={onClose} aria-label="Tutup"><X size={22} aria-hidden="true" /></button>
        </div>

        {selesai ? (
          <>
            <p className="ok-text">
              <CircleCheck size={20} aria-hidden="true" />
              {status === "antre"
                ? "Koneksi lambat. Koreksimu akan terkirim otomatis begitu online, jadi jangan tutup halaman ini dulu."
                : "Terkirim. Koreksimu akan ditinjau sebelum dipakai melatih model."}
            </p>
            <button className="btn" onClick={onClose}>Tutup</button>
          </>
        ) : (
          <>
            <div className="radio-list" role="radiogroup" aria-label="Kelas yang benar">
              {pilihan.map((p) => {
                const Ikon = p.kelas ? IKON_KELAS[p.kelas] : CircleAlert;
                return (
                  <label key={p.id} className={"radio" + (pilih === p.id ? " on" : "")}>
                    <input type="radio" name="kelas-benar" checked={pilih === p.id} onChange={() => setPilih(p.id)} />
                    <Ikon size={20} aria-hidden="true" />
                    {p.label}
                  </label>
                );
              })}
            </div>
            <p className="consent">
              <ShieldCheck size={18} aria-hidden="true" />
              Gambar ini akan disimpan untuk memperbaiki model. Tidak ada data pribadi yang ikut dikirim.
            </p>
            {status === "off" && <p className="err-text"><CircleAlert size={18} aria-hidden="true" />Pengiriman belum aktif di versi ini (Firebase belum dikonfigurasi).</p>}
            {status === "gagal" && <p className="err-text"><CircleAlert size={18} aria-hidden="true" />Belum terkirim. Tunggu beberapa detik lalu coba lagi.</p>}
            <div className="row">
              <button className="btn ghost" onClick={onClose}>Batal</button>
              <button className="btn" disabled={!pilih || status === "kirim"} onClick={kirim}>
                <Send size={18} aria-hidden="true" />
                {status === "kirim" ? "Mengirim..." : "Kirim koreksi"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
