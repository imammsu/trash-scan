# TrashScan

Aplikasi web pemilah sampah berbasis kamera (SDG 12 dan SDG 4). Model YOLO11n berjalan di browser lewat ONNX Runtime Web, tanpa backend dan tanpa akun. Spesifikasi lengkap: `PRD-TrashScan-v0_2.md`.

## Menjalankan lokal

```bash
cd frontend
cp .env.example .env      # isi nilai Firebase (boleh dikosongkan untuk uji scan, kamus, peta)
npm install
npm run dev               # https://<IP-laptop>:5173 (HTTPS self-signed agar kamera HP bisa dipakai)
```

`predev` dan `prebuild` menyalin model dari `model/` dan berkas WASM ONNX Runtime ke `frontend/public/` (tidak di-commit).

Tanpa `.env`, scan, kamus, dan peta tetap jalan. Kuis tercatat, feedback, dan analitik menjadi tidak aktif.

## Menyiapkan Firebase (sekali saja)

1. Konsol Firebase > Authentication > Sign-in method: aktifkan **Anonymous**.
2. Firestore Database: buat database (mode produksi).
3. Publikasikan aturan: `cd frontend && npx firebase deploy --only firestore:rules`. Uji dulu di Rules Playground atau emulator.
4. Analytics: aktifkan Google Analytics, salin Measurement ID ke `VITE_FIREBASE_MEASUREMENT_ID`.
5. Secret GitHub (Settings > Secrets > Actions): `FIREBASE_SERVICE_ACCOUNT_TRASHSCAN_BEAFD`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, dan opsional `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_APPCHECK_SITE_KEY`.
6. Admin: tambah dokumen `admins/{uid}` lewat konsol untuk akun yang boleh membaca feedback dan kuis.

## Alur penggunaan (pengguna)

1. **Buka** lewat QR poster (`?src=poster-kantin`). Muncul pemberitahuan analitik anonim, lalu model dimuat dengan progres dan fakta singkat.
2. **Scan.** Kamera belakang menampilkan kotak dan label kelas secara live. Atau tekan **Unggah foto**.
3. **Jepret.** Frame dibekukan dan diproses:
   - tidak ada kandidat: "Tidak ada sampah terdeteksi";
   - keyakinan di bawah ambang: "Tidak yakin, coba dari sudut lain" (tanpa panduan);
   - keyakinan memadai: **ringkasan**, lalu kartu per kelas berisi cara membuang, edukasi, dan satu aksi kecil. Ketuk kotak di foto untuk menyorot kartunya.
4. Dari hasil: **Cari tempat setor** (kelas anorganik, kertas, B3) membuka peta yang sudah terfilter. **Klasifikasi salah?** mengirim koreksi setelah persetujuan. **Scan lagi** kembali ke kamera.
5. **Kuis:** pre-test (boleh dilewati), post-test (terbuka setelah 3 scan atau 1 hari), dan latihan tanpa pencatatan. Penjelasan jawaban tampil setelah selesai.
6. **Kamus:** ketik nama benda, dapat kelas, alasan, dan tips.
7. **Lokasi:** peta OpenStreetMap, filter kelas, tombol **Ke lokasiku**, daftar terurut jarak, dan tautan rute Google Maps.

## Mengubah konten (lewat pull request)

| Berkas | Isi |
| --- | --- |
| `frontend/public/config.json` | Ambang, panduan dan edukasi per kelas, warna tong, pusat peta, aturan kuis |
| `frontend/public/data/kamus.json` | Entri kamus |
| `frontend/public/data/kuis.json` | Bank soal (set A dan B) |
| `frontend/public/data/lokasi.json` | Titik setor (skema di PRD bagian 9.2). **Masih kosong, isi bersama mitra.** |

Urutan `kelas` di `config.json` harus sama dengan urutan model: `anorganik, b3, kertas, organik, residu`.

## Alur pengembangan

`fitur/*` → PR → `dev` → PR → `main` (otomatis deploy). Lihat PRD bagian 16.

## Status terhadap PRD

| Area | Status |
| --- | --- |
| P0: scan kamera dan unggah, ringkasan, panduan, edukasi, ragu dan kosong, kuis pre/post, keterbatasan | Dibangun |
| P1: feedback, multi-objek, kamus, lokasi dan peta, analitik, Tentang, mode latihan, App Check (opsional) | Dibangun |
| P2: situs admin, PWA | Belum (lihat PRD 6.5 dan FR-27) |

## Yang masih perlu diputuskan atau diuji

- Uji di HP nyata (kecepatan FPS, izin kamera, Safari iOS, WebGPU) dan setel ambang di `config.json`.
- Evaluasi model per kelas (PRD 7.6) sebelum ambang dianggap final.
- Warna tong, pusat peta, data titik setor, nama mitra, dan waktu terurai per kelas (sengaja dikosongkan, tampil hanya bila diisi).
- Verifikasi isi panduan dan kamus ke mitra bank sampah.
- Aturan Firestore adalah rancangan: uji dulu sebelum dipublikasikan.
