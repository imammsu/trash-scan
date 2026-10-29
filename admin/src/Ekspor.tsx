import { useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import JSZip from "jszip";
import { Download, LoaderCircle } from "lucide-react";
import { db, KELAS } from "./firebase";
import type { Fb } from "./FeedbackReview";

/** Pembagian train/val yang stabil berdasarkan id. */
const untukVal = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 5 === 0;

export default function Ekspor() {
  const [status, setStatus] = useState<string>("");
  const [sibuk, setSibuk] = useState(false);

  async function ekspor() {
    setSibuk(true);
    setStatus("Mengambil data yang disetujui...");
    try {
      const snap = await getDocs(query(collection(db, "feedback"), where("status", "==", "approved"), limit(2000)));
      const zip = new JSZip();
      let berlabel = 0;
      let negatif = 0;
      let dilewati = 0;
      for (const d of snap.docs) {
        const f = { id: d.id, ...(d.data() as Omit<Fb, "id">) };
        const idx = KELAS.indexOf(f.correct as (typeof KELAS)[number]);
        let label = "";
        if (idx >= 0) {
          if (!f.box) { dilewati++; continue; }
          const [x, y, w, h] = f.box;
          label = `${idx} ${(x + w / 2).toFixed(6)} ${(y + h / 2).toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}\n`;
          berlabel++;
        } else if (f.correct === "bukan_sampah") {
          negatif++; // gambar tanpa label = contoh negatif
        } else { dilewati++; continue; }
        const bagian = untukVal(d.id) ? "val" : "train";
        zip.file(`images/${bagian}/${d.id}.jpg`, f.imageB64, { base64: true });
        zip.file(`labels/${bagian}/${d.id}.txt`, label);
      }
      zip.file("data.yaml", `path: .\ntrain: images/train\nval: images/val\nnames:\n${KELAS.map((k, i) => `  ${i}: ${k}`).join("\n")}\n`);
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trashscan-feedback-yolo.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus(`Selesai: ${berlabel} berlabel, ${negatif} contoh negatif, ${dilewati} dilewati (tanpa kotak atau label tidak valid).`);
    } catch (e) {
      setStatus(`Gagal: ${(e as Error).message}`);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div>
      <p>Mengekspor feedback berstatus <b>disetujui</b> ke format YOLO (gambar, label, dan <code>data.yaml</code>). Urutan kelas sama dengan model: {KELAS.join(", ")}.</p>
      <p className="muted">Gambar feedback berukuran maksimum 640 px. Gabungkan dengan dataset asli sebelum melatih ulang, dan evaluasi per kelas sebelum mengganti model produksi.</p>
      <button className="btn" onClick={ekspor} disabled={sibuk}>
        {sibuk ? <LoaderCircle className="putar" size={16} /> : <Download size={16} />} Unduh ZIP dataset YOLO
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
