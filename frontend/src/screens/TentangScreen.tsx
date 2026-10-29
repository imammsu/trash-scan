import { Cpu, Download, Scale, ShieldCheck, Target, TriangleAlert, Recycle } from "lucide-react";
import type { AppConfig } from "../lib/types";

export default function TentangScreen({ cfg, pwa }: { cfg: AppConfig; pwa: { bisa: boolean; pasang: () => Promise<void> } }) {
  return (
    <div className="tentang">
      <h2><Recycle size={26} aria-hidden="true" style={{ verticalAlign: "-4px" }} /> Tentang TrashScan</h2>
      <p>TrashScan membantu memilah sampah lewat kamera atau foto. Proyek ini bagian dari kampanye pemilahan sampah bersama mitra lokal untuk tugas Pendidikan dan Pembangunan Berkelanjutan. Versi {cfg.versi}.</p>
      {pwa.bisa && (
        <p><button className="btn" onClick={pwa.pasang}><Download size={18} aria-hidden="true" /> Pasang di layar utama</button></p>
      )}

      <section>
        <h3><Target size={20} aria-hidden="true" /> SDGs yang disasar</h3>
        <ul>
          <li>SDG 12 (utama): konsumsi dan produksi bertanggung jawab, target 12.5 tentang pengurangan sampah.</li>
          <li>SDG 4 (utama): pendidikan berkualitas, target 4.7 tentang pendidikan untuk pembangunan berkelanjutan.</li>
          <li>SDG 11, 13, dan 17 sebagai tujuan pendukung.</li>
        </ul>
      </section>

      <section>
        <h3><Cpu size={20} aria-hidden="true" /> Cara kerja</h3>
        <p>Model YOLO11 berjalan langsung di browsermu. Gambar tidak dikirim ke server. Aplikasi hanya menampilkan panduan bila model cukup yakin.</p>
      </section>

      <section>
        <h3><TriangleAlert size={20} aria-hidden="true" /> Keterbatasan</h3>
        <p>Model bisa keliru, terutama untuk benda yang jarang ada di data latih atau foto yang gelap dan buram. Untuk B3 dan benda yang meragukan, cek pedoman resmi atau tanya petugas bank sampah. Panduan dan lokasi diverifikasi bersama mitra lokal dan bisa berubah.</p>
      </section>

      <section>
        <h3><ShieldCheck size={20} aria-hidden="true" /> Privasi</h3>
        <ul>
          <li>Tidak perlu akun. Identitas teknis anonim dipakai hanya untuk kuis dan koreksi.</li>
          <li>Gambar hanya terkirim bila kamu menekan kirim pada koreksi, setelah persetujuan.</li>
          <li>Lokasimu hanya diproses di browser.</li>
          <li>Analitik anonim (jumlah buka aplikasi, hasil scan, penyelesaian kuis). Tidak ada data pribadi.</li>
        </ul>
      </section>

      <section>
        <h3><Scale size={20} aria-hidden="true" /> Atribusi dan lisensi</h3>
        <ul>
          <li>Dataset: Roboflow Universe (workspace yolo-y9ms0, apaciapacu, dan dataset kaleng), CC BY 4.0. Cantumkan judul, pembuat, dan URL lengkap di laporan.</li>
          <li>Peta: data © OpenStreetMap contributors, lisensi ODbL.</li>
          <li>Model dan library: Ultralytics YOLO11 (AGPL-3.0), ONNX Runtime Web, React, Vite, Firebase, Leaflet, Lucide.</li>
          <li>Data statistik: SIPSN KLHK (dilaporkan GoodStats dan Republika).</li>
        </ul>
      </section>
    </div>
  );
}
