# Ceklis implementasi terhadap PRD v0.2

Keterangan: ✅ sudah ada di kode · ⚠️ ada, tetapi butuh keputusan, data, atau pengujian di luar kode · ❌ belum.

## Kebutuhan fungsional (bagian 6)

| ID | Kebutuhan | Status | Catatan |
| --- | --- | --- | --- |
| FR-01 | Kamera belakang, petunjuk bila izin ditolak, opsi unggah | ✅ | |
| FR-02 | Deteksi live dengan kotak dan label, tanpa angka confidence | ✅ | Ambang live dari `config.json` |
| FR-03 | Jepret membekukan frame dan menghentikan loop live | ✅ | |
| FR-04 | Unggah foto, orientasi EXIF, pesan bila format tak didukung | ✅ | Foto >1280 px diperkecil |
| FR-05 | Satu pipeline untuk kamera dan unggah | ✅ | |
| FR-06 | Keputusan: kosong, ragu, ok (ambang per kelas bisa diubah) | ✅ | |
| FR-07 | Ringkasan: jumlah, dominan, tong, satu langkah, aksi kecil | ✅ | |
| FR-08 | Kartu per kelas: panduan, edukasi, aksi kecil, SDGs | ⚠️ | Fakta berdata hanya ada untuk organik, anorganik, kertas. Waktu terurai kosong (PRD masih TBD). |
| FR-09 | Peringatan khusus B3 | ✅ | |
| FR-10 | Multi-objek, ketuk kotak menyorot kartu | ✅ | |
| FR-11 | Scan lagi kembali ke kamera | ✅ | |
| FR-12 | Progres muat model dan fakta singkat | ✅ | |
| FR-13 | Semua kelas di atas ambang tampil | ✅ | |
| FR-14 | Fallback bila kamera, WASM, atau HTTPS tidak tersedia | ✅ | |
| FR-15 | Feedback dengan persetujuan, sekali per hasil | ✅ | Koneksi lambat: diantre otomatis |
| FR-16 | Keterbatasan model ditampilkan | ✅ | Di hasil dan Tentang |
| FR-17 | Pre-test sekali per perangkat, boleh dilewati | ✅ | |
| FR-18 | Post-test setelah 3 scan atau 1 hari | ✅ | Diatur di `config.json` |
| FR-19 | Mode latihan tanpa pencatatan | ✅ | |
| FR-20 | Kamus: pencarian, alias, filter kelas | ✅ | 34 entri, perlu diverifikasi mitra |
| FR-21 | Peta titik setor, filter kelas | ✅ | `lokasi.json` masih kosong |
| FR-22 | Lokasi pengguna opsional, tetap tampil bila ditolak | ✅ | |
| FR-23 | Tombol "Cari tempat setor" dari hasil | ✅ | |
| FR-24 | Daftar terurut jarak dan tautan rute | ✅ | |
| FR-25 | Halaman Tentang: SDGs, privasi, atribusi, lisensi | ✅ | ODbL ditambahkan |
| FR-26 | Analitik anonim dan pemberitahuan | ✅ | `app_open`, `scan_result`, `feedback_kirim`, `quiz_complete`, `kamus_cari`, `lokasi_dibuka` |
| FR-27 | PWA: dapat dipasang, model ter-cache (P2) | ✅ | Ditambahkan di versi ini: manifest, ikon, service worker, tombol Pasang |

## Situs admin (P2)

| ID | Kebutuhan | Status |
| --- | --- | --- |
| AD-01 | Masuk dengan Google, akses dibatasi `admins/{uid}` | ✅ (folder `admin/`) |
| AD-02 | Statistik kuis: pasangan, rata-rata, uji-t berpasangan, CSV | ✅ (divalidasi terhadap scipy) |
| AD-03 | Tinjau feedback: koreksi label dan kotak, setujui atau tolak | ✅ |
| AD-04 | Ekspor feedback disetujui ke format YOLO | ✅ |

## Keamanan, ketahanan, performa

| Butir | Status | Catatan |
| --- | --- | --- |
| Aturan Firestore (users, feedback, quiz, admins) | ⚠️ | Ditulis, **belum diuji** di emulator atau Rules Playground |
| Pembatasan laju feedback (15 detik, maks 30) | ⚠️ | Bagian dari aturan di atas |
| App Check | ⚠️ | Aktif bila `VITE_APPCHECK_SITE_KEY` diisi (reCAPTCHA Enterprise perlu disiapkan) |
| Ketahanan jaringan putus (kuis dan feedback) | ✅ | Batas waktu 12 detik, tulis tertahan terkirim otomatis |
| Tema terang dan gelap, ukuran sentuh ≥ 44 px, `prefers-reduced-motion` | ✅ | |
| Responsif: HP (bottom-nav) dan layar lebar (sidebar, dua kolom) | ✅ | |
| Cache `.onnx` dan `.wasm` di Hosting | ✅ | |
| Kebijakan retensi data feedback | ❌ | Keputusan kebijakan, bukan kode (PRD 13.4) |

## Di luar cakupan kode (perlu dikerjakan tim)

- Pengujian di HP nyata: FPS, izin kamera, Safari iOS, WebGPU, mode hemat daya, cahaya redup. Belum ada yang teruji di perangkat.
- Evaluasi model per kelas (PRD 7.6) dan penetapan ambang final di `config.json`.
- Isi `lokasi.json` dan pusat peta bersama mitra.
- Verifikasi panduan, kamus, dan bank soal bersama mitra bank sampah.
- Warna tong (konvensi umum dipakai sementara), waktu terurai, dan fakta berdata untuk B3 dan residu.
- Uji aksesibilitas formal (pembaca layar, Lighthouse) dan uji kegunaan dengan calon pengguna.
