import { useState } from "react";
import { kirimFeedback } from "../lib/feedback";
import { jpegUntukFeedback } from "../lib/image";
import { track } from "../lib/analytics";
import { tandaiFeedback } from "../lib/state";
import { IKON_KELAS, varKelas } from "../lib/kelasUi";
import type { AppConfig, Detection, Kelas } from "../lib/types";
import Icon from "./Icon";

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
  const [setuju, setSetuju] = useState(false);
  const [status, setStatus] = useState<"idle" | "kirim" | "ok" | "gagal" | "off">("idle");
  const [alasan, setAlasan] = useState<string | null>(null);
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
    if (hasil.status === "ok") {
      tandaiFeedback(feedbackKey);
      track("feedback_kirim", { predicted, correct: pilih });
      setStatus("ok");
      onSent();
    } else {
      setAlasan(hasil.alasan ?? null);
      setStatus(hasil.status === "tidak-tersedia" ? "off" : "gagal");
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="fb-judul" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="stack-sm">
          <h2 id="fb-judul">Apa yang seharusnya?</h2>
          <p className="muted">Model menyebut ini {cfg.kelasDetail[predicted].nama}. Pilih yang benar.</p>
        </div>

        {status === "ok" ? (
          <div className="stack">
            <div className="alert info">
              <Icon name="check_circle" size={22} />
              <p className="ok-text">Terima kasih, koreksimu terkirim dan akan ditinjau sebelum dipakai melatih model.</p>
            </div>
            <button className="btn penuh" onClick={onClose}>Tutup</button>
          </div>
        ) : (
          <>
            <div className="radio-list" role="radiogroup" aria-label="Kelas yang benar">
              {pilihan.map((p) => (
                <label
                  key={p.id}
                  className={"radio" + (pilih === p.id ? " on" : "")}
                  style={p.kelas ? varKelas(cfg, p.kelas) : undefined}
                >
                  <input type="radio" name="kelas-benar" checked={pilih === p.id} onChange={() => setPilih(p.id)} />
                  <Icon name={p.kelas ? IKON_KELAS[p.kelas] : "block"} size={20} />
                  <span>{p.label.replace("Sampah ", "")}</span>
                </label>
              ))}
            </div>

            <label className="consent consent-check">
              <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
              <Icon name="privacy_tip" size={18} />
              <span>Saya setuju gambar ini disimpan untuk evaluasi dan perbaikan model. Tidak ada data pribadi yang ikut dikirim.</span>
            </label>

            {status === "off" && (
              <div className="alert" role="alert">
                <Icon name="cloud_off" size={20} />
                <span>{alasan ?? "Pengiriman belum aktif di versi ini (Firebase belum dikonfigurasi)."}</span>
              </div>
            )}
            {status === "gagal" && (
              <div className="alert" role="alert">
                <Icon name="error" size={20} />
                <span>{alasan ?? "Belum terkirim. Periksa koneksi, atau tunggu beberapa detik lalu coba lagi."}</span>
              </div>
            )}

            <div className="row">
              <button className="btn ghost grow" onClick={onClose}>Batal</button>
              <button className="btn grow" disabled={!pilih || !setuju || status === "kirim"} onClick={kirim}>
                <Icon name="send" size={18} />
                <span>{status === "kirim" ? "Mengirim..." : "Kirim koreksi"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
