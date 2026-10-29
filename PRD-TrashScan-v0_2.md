# PRD — TrashScan

**Product Requirements Document, versi 0.2 (Draft)**

|                   |                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Nama produk**   | TrashScan                                                                                                                 |
| **Versi dokumen** | 0.2 (menggantikan 0.1)                                                                                                    |
| **Tanggal**       | 29 Oktober 2026                                                                                                           |
| **Konteks**       | Tugas akhir mata kuliah Pendidikan dan Pembangunan Berkelanjutan (project-based SDGs, kelompok)                           |
| **Tim**           | [TBD: nama anggota dan pembagian tugas]                                                                                   |
| **Repositori**    | `github.com/imammsu/trash-scan`                                                                                           |
| **Produksi**      | `https://trashscan-beafd.web.app` (Firebase Hosting)                                                                      |
| **Status**        | Build lokal berhasil. Push pertama dan uji pipeline CI/CD masih menunggu. Model sudah ada, fitur aplikasi belum dibangun. |

> Tanda **[TBD]** menandai hal yang belum diputuskan atau belum diukur. Angka berlabel _usulan_ adalah nilai awal yang akan disetel setelah evaluasi.

---

## 0. Riwayat perubahan

| Versi   | Perubahan                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | Dokumen awal: deteksi real-time, jepret, hasil, panduan, edukasi, feedback, arsitektur Firebase tanpa backend Python, CI/CD.                                                                                                                                                                                                                                                                                                                                                 |
| **0.2** | **Ditambah:** scan lewat upload foto; ringkasan scan; kuis pengetahuan pre/post yang terpisah dari scan; Kamus Sampah; halaman Lokasi setor dengan peta dan posisi pengguna; analitik anonim dengan dashboard terpisah; situs admin (statistik kuis dan tinjau feedback); bagian kampanye, mitra, evaluasi, dan keberlanjutan sesuai template project-based SDGs; analisis aplikasi sejenis. **Dikeluarkan secara eksplisit:** tombol bagikan ke WhatsApp atau media sosial. |

## 1. Ringkasan

TrashScan adalah aplikasi web (dibuka di HP, tanpa instalasi dan tanpa akun) yang membantu pengguna **memilah sampah**. Pengguna dapat mengarahkan kamera atau mengunggah foto. Model YOLO yang berjalan langsung di browser mendeteksi objek dan menampilkan kotak serta label kelasnya. Hasilnya berupa **ringkasan, panduan pembuangan, edukasi singkat dengan aksi kecil**, dan, bila relevan, **lokasi terdekat untuk menyetor** sampah tersebut.

Selain alat scan, aplikasi memuat **Kamus Sampah** (cari nama benda) dan **kuis pengetahuan** yang mengukur apakah pengguna benar-benar belajar. Aplikasi ini adalah salah satu bagian dari proyek yang lebih besar: **kampanye pemilahan sampah bersama mitra lokal**, dengan evaluasi terukur (jangkauan, peningkatan pengetahuan, dan tinjauan perilaku).

## 2. Latar belakang dan masalah

### 2.1 Masalah

- Banyak orang tidak yakin suatu sampah masuk kategori mana (organik, anorganik, kertas, B3, atau residu), sehingga sampah tercampur dan sulit didaur ulang.
- Sampah B3 (baterai, lampu, elektronik) yang tercampur dengan sampah biasa berisiko mencemari lingkungan.
- Informasi pemilahan umumnya berupa poster statis, tidak membantu saat orang memegang suatu benda dan harus memutuskan sekarang.
- Setelah tahu kategorinya, pengguna sering tidak tahu **dibuang atau disetor ke mana** secara lokal.

### 2.2 Data pendukung (verifikasi ke sumber primer sebelum dikutip di laporan)

- Menurut data SIPSN KLHK 2025, timbulan sampah nasional mencapai **25,14 juta ton** dari 244 kabupaten/kota yang melapor, dan **40,76%** di antaranya sisa makanan (dilaporkan GoodStats: `goodstats.id/article/sampah-indonesia-didominasi-sisa-makanan-pada-2025-Yttj3`).
- Komposisi tahun 2022 menurut SIPSN (dilaporkan Republika): sisa makanan 41,9%, plastik 18,7%, kertas atau karton 10,7%, dan sumber terbesar adalah rumah tangga (37,6%) (`news.republika.co.id/berita/rpcog6451/klhk-ajak-masyarakat-kelola-sampah-secara-mandiri`).
- Sumber primer: portal SIPSN (`portal-sipsn.kemenlh.go.id/data/komposisi-sampah`). Angka antar tahun dan laporan berbeda, jadi cantumkan tahunnya.
- Implikasi desain: kelas **organik** paling berdampak, sehingga panduan organik (kompos, biopori) mendapat porsi terbesar.

### 2.3 Aplikasi sejenis dan celah yang diisi

| Aplikasi atau studi                                                      | Fokus                                                                       | Celah                                                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Westa** (FEB UGM)                                                      | Foto sampah → jenis dan estimasi berat, geotagging, dashboard profil sampah | Fokus data dan pemantauan, bukan edukasi individu                                                        |
| **Bank sampah digital** (Nampah, Smart-Go, Pegadaian Peduli, SmartReuse) | Transaksi, poin, saldo, penjemputan                                         | Fokus insentif dan logistik. Tantangan yang diakui: jangkauan, harga tidak stabil, literasi digital      |
| **Aplikasi riset** (DeepWaste, MWaste, RootTrash)                        | Klasifikasi gambar, sebagian dengan feedback pengguna dan mitra daur ulang  | Terbatas pada fasilitas setempat. Praktik baik: samakan kategori dengan mitra dan minta koreksi pengguna |
| **Makalah aplikasi mahasiswa**                                           | Scan, riwayat, dompet digital, kadang kuis                                  | Jarang ada pengukuran pengetahuan atau lokasi setor lokal                                                |

Referensi: `ugm.ac.id/id/berita/dosen-ugm-kembangkan-aplikasi-identifikasi-jenis-sampah-dan-sumbernya-berbasis-ai/`, `goodnewsfromindonesia.id/2025/10/31/nabung-sampah-nampah-aplikasi-bank-sampah-digital-dari-kolaka`, `arxiv.org/pdf/2101.05960`, `rootstrap.com/blog/how-to-build-a-waste-classifier-app-using-ai`.

**Diferensiasi TrashScan:** (1) edukasi yang berujung aksi, (2) kuis yang mengukur pengetahuan, (3) Kamus Sampah untuk benda di luar jangkauan model, (4) lokasi setor lokal hasil verifikasi mitra, (5) inferensi di perangkat tanpa login (privat), dan (6) dikemas dalam kampanye dengan evaluasi terukur.

### 2.4 Keterkaitan SDGs

| SDG                                                             | Target                                                                                | Kaitan                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **SDG 12** (Konsumsi dan Produksi Bertanggung Jawab), **utama** | 12.5 Pengurangan timbulan sampah lewat pencegahan, daur ulang, dan penggunaan kembali | Panduan pemilahan, daur ulang, dan pengurangan                 |
| **SDG 4** (Pendidikan Berkualitas), **utama**                   | 4.7 Pendidikan untuk pembangunan berkelanjutan                                        | Edukasi, kamus, kuis, dan kampanye                             |
| SDG 11 (Kota dan Permukiman Berkelanjutan), sekunder            | 11.6 Pengelolaan limbah kota                                                          | Pemilahan dari sumber, lokasi setor                            |
| SDG 13 (Penanganan Perubahan Iklim), sekunder                   | Aksi iklim                                                                            | Edukasi dampak sampah organik terhadap emisi                   |
| SDG 17 (Kemitraan untuk Mencapai Tujuan), sekunder              | 17.17 Kemitraan lintas sektor                                                         | Kerja sama dengan bank sampah, komunitas, dan pengelola kampus |

## 3. Tujuan, non-tujuan, dan indikator

### 3.1 Tujuan

1. Mendeteksi dan melabeli sampah dari kamera atau foto unggahan, di browser, tanpa mengirim gambar ke server.
2. Memberi ringkasan, panduan, dan edukasi yang benar dan berujung aksi untuk lima kelas sampah.
3. **Mengukur peningkatan pengetahuan** pengguna lewat kuis pre/post yang anonim.
4. Membantu pengguna menemukan **tempat setor** terdekat untuk kelas yang memerlukannya.
5. Menangani ketidakpastian model dengan jujur (tidak memberi panduan jika model ragu).
6. Mengumpulkan koreksi pengguna secara aman untuk memperbaiki model.
7. Menjalankan **kampanye bersama mitra** dan mengevaluasinya sesuai template tugas.
8. Memakai alur pengembangan yang rapi untuk kerja kelompok (branch, pull request, CI/CD).

### 3.2 Non-tujuan (di luar scope, disebut sebagai pengembangan lanjutan)

- Backend Python (Flask atau FastAPI) dan retraining model otomatis.
- Multi-bahasa (versi ini hanya Bahasa Indonesia).

### 3.3 Indikator keberhasilan

| Area        | Indikator                                                       | Target awal (usulan)                                    |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Model       | mAP@0.5 pada data uji                                           | [TBD setelah evaluasi `merged_v2`]                      |
| Model       | Recall per kelas pada foto lapangan                             | Tidak ada kelas yang hampir tidak terdeteksi            |
| Performa    | Kecepatan deteksi live di HP menengah                           | Minimal 3 FPS (diuji di perangkat nyata)                |
| Performa    | Waktu memuat model pertama kali                                 | Di bawah 10 detik pada 4G                               |
| Jangkauan   | Pengguna unik dan jumlah scan selama kampanye                   | [TBD, target ditetapkan bersama mitra]                  |
| Pengetahuan | Selisih skor pre-test dan post-test (pasangan yang sama)        | Naik secara bermakna, minimal 30 pasangan data (usulan) |
| Perilaku    | Penurunan item salah tempat pada sampel tong di lokasi kampanye | [TBD, audit kecil sebelum dan sesudah]                  |
| Data        | Feedback valid yang siap dipakai retraining                     | [TBD]                                                   |

## 4. Pengguna dan skenario

**Pengguna utama:** mahasiswa, siswa, dan warga umum di lingkungan kampanye. Tidak perlu akun atau keahlian teknis.

**Skenario:**

1. Rani bingung membuang bungkus snack. Ia membuka TrashScan lewat QR di kantin, mengarahkan kamera, melihat kotak dan label, lalu menjepret. Aplikasi menampilkan ringkasan, tong yang sesuai, dan satu aksi kecil.
2. Dimas memotret baterai bekas. Hasilnya **B3** dengan peringatan tidak boleh dibuang ke tempat sampah biasa, dan tombol **Cari tempat setor** menampilkan titik pengumpulan terdekat di peta.
3. Sinta tidak punya benda di tangan, hanya penasaran apakah struk belanja bisa didaur ulang. Ia mencari "struk" di **Kamus Sampah**.
4. Budi memilih foto dari galeri untuk dipindai karena kameranya tidak diizinkan.
5. Dimas menekan "Klasifikasi salah?" lalu mengirim koreksi.
6. Di hari pertama Sinta mengerjakan **pre-test**. Setelah beberapa hari dan beberapa scan, ia mengerjakan **post-test**.

## 5. Struktur aplikasi dan alur

### 5.1 Layar

| Layar              | Isi                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Scan** (beranda) | Kamera live dengan kotak dan label, tombol **Jepret**, tombol **Unggah foto**                                              |
| **Hasil**          | Ringkasan scan, kartu per kelas (panduan dan edukasi), tombol **Cari tempat setor**, **Klasifikasi salah?**, **Scan lagi** |
| **Kuis**           | Pre-test, post-test, dan mode latihan                                                                                      |
| **Kamus**          | Pencarian nama benda → kelas, alasan, tips                                                                                 |
| **Lokasi**         | Peta dan daftar tempat setor dengan filter kelas                                                                           |
| **Tentang**        | SDGs, cara kerja, keterbatasan model, privasi, atribusi dan lisensi                                                        |

Navigasi bawah memuat Scan, Kuis, Kamus, dan Lokasi. Tentang diakses lewat menu.

### 5.2 Alur scan

```
Buka aplikasi (dapat membawa ?src=... dari QR/poster)
   │
   ▼
Muat model (indikator progres) ──gagal──► Layar error + [Coba lagi]
   │
   ▼
Pilih sumber:  [Kamera live]                      [Unggah foto]
   │  izin kamera ditolak ──► petunjuk + tawarkan Unggah foto
   ▼
Mode LIVE: deteksi berulang, kotak + label (tanpa angka confidence)
   │  [Jepret]                                     │ foto dipilih, orientasi EXIF dibenahi
   ▼                                               ▼
        Inferensi pada frame beku / gambar unggahan
   │
   ├─ tidak ada kandidat sama sekali ──► "Tidak ada sampah terdeteksi" + [Scan lagi]
   ├─ keyakinan tertinggi < ambang    ──► "Tidak yakin, coba dari sudut lain" + [Scan lagi]
   └─ keyakinan memadai               ──► HASIL: ringkasan, panduan, edukasi, aksi kecil,
                                           [Cari tempat setor], [Klasifikasi salah?], [Scan lagi]
```

## 6. Kebutuhan fungsional

Prioritas: **P0** wajib untuk demo dan evaluasi tugas, **P1** penting, **P2** tambahan bila waktu cukup.

### 6.1 Scan dan hasil

| ID    | Kebutuhan                                                                                                                                                                   | Prioritas | Kriteria penerimaan                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-01 | **Akses kamera.** Meminta izin, memakai kamera belakang sebagai default.                                                                                                    | P0        | Kamera aktif di Chrome Android dan Safari iOS lewat HTTPS. Jika ditolak, tampil petunjuk dan tawaran Unggah foto.                                      |
| FR-02 | **Deteksi real-time.** Menggambar kotak dan label kelas pada overlay, **tanpa** menampilkan confidence.                                                                     | P0        | Kotak dan label mengikuti objek. Hanya deteksi dengan skor di atas ambang live yang digambar.                                                          |
| FR-03 | **Jepret.** Membekukan frame dan menghentikan loop live.                                                                                                                    | P0        | Hasil muncul tanpa mengambil ulang gambar.                                                                                                             |
| FR-04 | **Unggah foto.** Memilih gambar dari galeri atau kamera sistem, lalu diproses dengan pipeline yang sama.                                                                    | P0        | Orientasi EXIF benar, foto besar diperkecil sebelum inferensi, kotak dan label tampil pada gambar statis. Format tak didukung memunculkan pesan jelas. |
| FR-05 | **Hasil klasifikasi.** Label kelas yang terdeteksi pada frame atau foto.                                                                                                    | P0        | Sesuai logika keputusan (bagian 7.4).                                                                                                                  |
| FR-06 | **Ringkasan scan.** Jumlah objek per kelas, kelas dominan, panduan inti, dan satu aksi kecil.                                                                               | P0        | Ringkasan sesuai deteksi dan tampil di atas kartu detail.                                                                                              |
| FR-07 | **Panduan pembuangan** per kelas (tong dan cara penanganan).                                                                                                                | P0        | Tersedia untuk lima kelas, bersumber dari `config.json`.                                                                                               |
| FR-08 | **Edukasi tiga lapis:** _apa_ (kelas), _kenapa_ (dampak bila salah), _aksi kecil_ (satu tindakan konkret, termasuk tips mengurangi sampah). Memuat fakta berdata bersumber. | P0        | Tersedia untuk lima kelas, singkat. Kelas B3 memuat peringatan.                                                                                        |
| FR-09 | **Model ragu.** Teks "Tidak yakin, coba dari sudut lain", tanpa panduan.                                                                                                    | P0        | Muncul saat keyakinan tertinggi di bawah ambang jepret.                                                                                                |
| FR-10 | **Tidak ada objek.** Teks "Tidak ada sampah terdeteksi".                                                                                                                    | P0        | Muncul saat tidak ada kandidat di atas batas bawah.                                                                                                    |
| FR-11 | **Scan lagi.** Kembali ke mode live.                                                                                                                                        | P0        | Satu ketukan.                                                                                                                                          |
| FR-12 | **Status pemuatan dan error model.** Progres unduh dan layar error dengan tombol coba lagi. Waktu tunggu boleh dipakai untuk menampilkan fakta singkat.                     | P0        | Tidak ada layar kosong saat model dimuat.                                                                                                              |
| FR-13 | **Multi-objek.** Kartu per kelas, mengetuk kotak menyorot kartu terkait.                                                                                                    | P1        | Semua kelas di atas ambang tampil, urut keyakinan tertinggi.                                                                                           |
| FR-14 | **Fallback browser tidak didukung.** Pesan jelas bila kamera atau WebAssembly tidak tersedia.                                                                               | P1        | Tidak muncul layar kosong atau error mentah.                                                                                                           |
| FR-15 | **Feedback koreksi.** "Klasifikasi salah?" → pilih kelas benar (5 kelas dan "bukan sampah") → kirim ke Firestore setelah persetujuan.                                       | P1        | Dokumen tersimpan, tombol dinonaktifkan setelah terkirim, ada konfirmasi.                                                                              |
| FR-16 | **Catatan keterbatasan.** Keterangan bahwa model bisa keliru dan panduan B3 perlu dicek ke pedoman resmi.                                                                   | P0        | Terlihat di layar hasil dan halaman Tentang.                                                                                                           |

### 6.2 Kuis

| ID    | Kebutuhan                                                                                                     | Prioritas | Kriteria penerimaan                                             |
| ----- | ------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| FR-17 | **Pre-test dan post-test tercatat** (bagian 10). Skor tersimpan anonim, satu pre dan satu post per perangkat. | P0        | Dokumen kuis ter-create sekali per tipe dan tidak bisa ditimpa. |
| FR-18 | **Mode latihan** tanpa pencatatan, soal acak dari seluruh bank.                                               | P1        | Dapat diulang tanpa batas dan tidak menulis ke database.        |
| FR-19 | **Penjelasan jawaban** setelah kuis selesai.                                                                  | P1        | Setiap soal menampilkan jawaban benar dan alasan singkat.       |

### 6.3 Kamus dan lokasi

| ID    | Kebutuhan                                                                                                               | Prioritas | Kriteria penerimaan                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| FR-20 | **Kamus Sampah.** Pencarian nama atau alias benda → kelas, alasan, tips. Pencarian sisi klien dengan normalisasi huruf. | P1        | Hasil muncul saat mengetik. Istilah tak ditemukan memunculkan pesan dan dicatat sebagai kejadian analitik. |
| FR-21 | **Halaman Lokasi.** Peta dan daftar tempat setor, filter per kelas.                                                     | P1        | Titik tampil sesuai data dan filter.                                                                       |
| FR-22 | **Posisi pengguna.** Titik biru dengan lingkaran akurasi, daftar terurut jarak.                                         | P1        | Berfungsi dengan izin lokasi. Jika ditolak, peta tetap tampil di pusat area dan daftar tanpa urutan jarak. |
| FR-23 | **Cari tempat setor dari hasil scan** untuk kelas yang punya titik (anorganik, kertas, B3; organik opsional).           | P1        | Membuka peta dengan filter kelas yang sesuai.                                                              |
| FR-24 | **Rute** lewat tautan ke Google Maps (tanpa API key).                                                                   | P1        | Tautan membuka rute ke titik yang dipilih.                                                                 |

### 6.4 Lainnya

| ID    | Kebutuhan                                                                                     | Prioritas | Kriteria penerimaan                                                  |
| ----- | --------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| FR-25 | **Halaman Tentang.** SDGs, cara kerja, privasi, atribusi dataset, OpenStreetMap, dan lisensi. | P1        | Atribusi CC BY 4.0 dan ODbL/OSM tercantum.                           |
| FR-26 | **Kejadian analitik anonim** (bagian 11) dan pembacaan parameter `?src=`.                     | P1        | Kejadian terlihat di laporan GA4. Ada pemberitahuan analitik anonim. |
| FR-27 | **PWA.** Dapat dipasang dan model ter-cache.                                                  | P2        | Lolos pemeriksaan installable dan berjalan dengan model ter-cache.   |

### 6.5 Situs admin (terpisah dari aplikasi, bagian 11.3)

| ID    | Kebutuhan                                                                   | Prioritas |
| ----- | --------------------------------------------------------------------------- | --------- |
| AD-01 | Login Google dan daftar admin (`admins/{uid}`)                              | P2        |
| AD-02 | Statistik kuis (jumlah pasangan pre/post, rata-rata skor, selisih)          | P2        |
| AD-03 | Tinjau feedback (lihat gambar, setujui atau tolak, koreksi label dan kotak) | P2        |
| AD-04 | Ekspor feedback yang disetujui ke format YOLO                               | P2        |

## 7. Spesifikasi model dan machine learning

### 7.1 Kelas

Urutan class id **harus** sama di model, `config.json`, dan seluruh kode.

| ID  | Kelas       | Contoh                                |
| --- | ----------- | ------------------------------------- |
| 0   | `anorganik` | plastik, kaca, logam                  |
| 1   | `b3`        | baterai, lampu, elektronik            |
| 2   | `kertas`    | kertas, kardus                        |
| 3   | `organik`   | sisa makanan, daun, kulit buah        |
| 4   | `residu`    | puntung rokok, popok, styrofoam kotor |

Objek non-sampah (tangan, meja, ruangan) **bukan kelas**. Model tidak menggambar kotak bila tidak ada sampah.

### 7.2 Model saat ini

| Atribut           | Nilai                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Arsitektur        | YOLO11n (Ultralytics 8.4.191), task detect                         |
| File              | `sampah_yolo11n.onnx` (±10,6 MB), opset 12                         |
| Input             | `images`: `1×3×416×416`, float32, RGB, nilai 0–1                   |
| Output            | `output0`: `1×9×3549` (4 koordinat + 5 skor kelas × 3549 kandidat) |
| Koordinat         | `cx, cy, w, h` dalam piksel ruang 416×416                          |
| Skor              | Sudah berupa probabilitas, tanpa objectness                        |
| NMS               | Tidak ada di dalam model, dibuat di JavaScript                     |
| Sumber data latih | `merged_v2` (dataset gabungan)                                     |
| Lisensi           | AGPL-3.0 (Ultralytics)                                             |

### 7.3 Pra-proses dan pasca-proses di browser

1. **Letterbox:** perkecil ke 416 dengan menjaga rasio aspek, isi sisa dengan abu-abu (114), konversi ke NCHW dan bagi 255. Jangan meregangkan gambar. Untuk foto unggahan, benahi orientasi EXIF dan perkecil foto besar lebih dulu.
2. **Inferensi** dengan `onnxruntime-web` (backend WASM, WebGPU bila tersedia).
3. **Dekode output:** untuk tiap dari 3549 kandidat ambil kelas dengan skor tertinggi, saring dengan ambang.
4. **Kembalikan koordinat** ke ukuran video atau gambar asli (kurangi padding, bagi skala letterbox).
5. **NMS per kelas** (IoU awal 0,45, usulan) dan batasi jumlah deteksi per frame.
6. **Mode live** dijalankan berkala, tidak harus setiap frame.

### 7.4 Ambang dan logika keputusan

Disimpan di `config.json`, dapat dioverride per kelas (kelas minoritas kemungkinan butuh ambang berbeda).

| Parameter | Nilai awal (usulan) | Fungsi                                                                   |
| --------- | ------------------- | ------------------------------------------------------------------------ |
| `live`    | 0,5                 | Skor minimum agar kotak digambar di mode live                            |
| `capture` | 0,6                 | Skor tertinggi minimum agar hasil ditampilkan setelah jepret atau unggah |
| `floor`   | 0,25                | Di bawah ini dianggap tidak ada objek                                    |
| `nmsIou`  | 0,45                | Ambang tumpang tindih NMS                                                |

**Keputusan setelah jepret atau unggah:**

- Tidak ada kandidat ≥ `floor` → "Tidak ada sampah terdeteksi".
- Skor tertinggi di antara `floor` dan `capture` → "Tidak yakin, coba dari sudut lain" (tanpa panduan).
- Skor tertinggi ≥ `capture` → tampilkan ringkasan, panduan, dan edukasi.

### 7.5 Dataset

| Dataset (Roboflow Universe, CC BY 4.0)           | Kelas asli                             | Catatan                                                                  |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------ |
| Sampah Indonesia (`yolo-y9ms0/sampah-indonesia`) | anorganik, b3, organik                 | Polygon, sekitar 83 gambar asli, B3 hanya beberapa box                   |
| Sampah (`apaciapacu/sampah-xlkse`)               | Anorganik, B3, Kertas, Organik, Residu | 249 gambar, sumber utama kertas dan residu                               |
| Can (`can_v1i`)                                  | metal-can                              | Kaleng makanan dan minuman. Pemetaan ke kelas final **[TBD, bagian 18]** |

**Alur penyatuan:** petakan kelas → seragamkan format (polygon → box, potong box di luar gambar, buang box < 1% gambar) → buang duplikat dan salinan augmentasi Roboflow → batasi maksimal 400 box per kelas dengan memilih gambar utuh → bagi ulang 70/20/10 per gambar asli → perkecil sisi terpanjang ke 640 px.

**Kelemahan yang diketahui:** kelas b3, kertas, dan residu sangat sedikit pada penggabungan awal (sekitar 30–45 box), dan foto sampah lokal minim. Komposisi akhir `merged_v2` [TBD]. Mitra lokal dapat membantu menambah foto sampah lokal.

### 7.6 Evaluasi model (wajib sebelum UI dianggap selesai)

- mAP@0.5 dan mAP@0.5:0.95, keseluruhan dan **per kelas**.
- Precision, recall, dan confusion matrix per kelas.
- Uji lapangan dengan foto dari HP (usulan: minimal 20 foto per kelas, termasuk sampah lokal).
- Pastikan ukuran gambar training sama dengan ukuran ekspor 416 **[TBD, cek log training]**.

### 7.7 Siklus perbaikan model

Feedback pengguna → ditinjau di situs admin atau skrip lokal (`firebase-admin`) → **tinjau manual** → ekspor ke format YOLO → tambahkan ke dataset (termasuk gambar "bukan sampah" sebagai background) → training ulang → versi model baru (`sampah_yolo11n_vN.onnx`) → deploy lewat pull request. Tidak ada retraining otomatis.

## 8. Konten

Semua konten adalah berkas statis di `frontend/public/` yang diubah lewat pull request.

| Berkas             | Isi                                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| `config.json`      | Urutan kelas, ambang, konten panduan dan edukasi per kelas, pusat peta default |
| `data/kamus.json`  | Entri Kamus Sampah                                                             |
| `data/kuis.json`   | Bank soal kuis (set A dan set B)                                               |
| `data/lokasi.json` | Titik setor                                                                    |

**Struktur per kelas (`config.json`):**

```json
{
  "organik": {
    "nama": "Sampah Organik",
    "tong": { "warna": "[TBD]", "label": "Organik" },
    "panduan": ["Langkah 1", "Langkah 2"],
    "edukasi": {
      "apa": "…",
      "kenapa": "…",
      "waktuTerurai": "[TBD]",
      "aksiKecil": "Kompos atau lubang biopori …",
      "kurangiDulu": "…",
      "sdg": ["SDG 12", "SDG 4"]
    }
  }
}
```

**Struktur entri kamus (`kamus.json`):**

```json
{
  "nama": "Struk belanja",
  "alias": ["nota", "struk kasir"],
  "kelas": "residu",
  "alasan": "Kertas termal berlapis kimia sehingga tidak ideal didaur ulang.",
  "tips": "Minta struk digital bila tersedia."
}
```

**Aturan konten:**

- Bahasa Indonesia, singkat, edukatif (tidak menyalahkan). Warna tidak boleh menjadi satu-satunya penanda, selalu sertakan teks.
- Warna tong mengikuti konvensi setempat **[TBD, dikonfirmasi bersama mitra]**.
- Kelas B3 wajib memuat peringatan tidak boleh dibuang ke tempat sampah biasa. Panduan B3 dicek ke pedoman resmi atau mitra.
- Kelas `kertas`: panduan sendiri (jaga tetap kering dan bersih) atau digabung dengan daur ulang **[TBD]**.
- Setiap fakta berdata mencantumkan sumber dan tahun.
- Panduan **diselaraskan dengan sistem pemilahan mitra lokal** supaya konsisten dengan praktik di lapangan.

## 9. Peta dan lokasi setor

### 9.1 Kelas mana yang punya titik setor

| Kelas     | Titik setor?            | Jenis lokasi                                                                  |
| --------- | ----------------------- | ----------------------------------------------------------------------------- |
| Anorganik | Ya                      | Bank sampah, pengepul, TPS3R                                                  |
| Kertas    | Ya                      | Bank sampah, pengepul kertas                                                  |
| **B3**    | **Ya (paling penting)** | Titik pengumpulan baterai dan elektronik bekas, drop-off B3 kampus atau pemda |
| Organik   | Opsional                | Komposter komunal atau TPS3R (umumnya ditangani di sumber)                    |
| Residu    | Tidak                   | Masuk pengangkutan sampah biasa, cukup keterangan                             |

Tombol **Cari tempat setor** di layar hasil hanya muncul untuk kelas yang punya titik, dan peta otomatis terfilter.

### 9.2 Skema data (`lokasi.json`)

```json
{
  "id": "bs-001",
  "nama": "Bank Sampah [nama]",
  "jenis": "bank_sampah",
  "menerima": ["anorganik", "kertas"],
  "lat": 0.0,
  "lng": 0.0,
  "alamat": "…",
  "jam": "…",
  "kontak": "…",
  "diperbarui": "2026-10-29"
}
```

`jenis`: `bank_sampah`, `b3`, atau `kompos`. Data dikumpulkan dan **diverifikasi manual bersama mitra**. Cantumkan tanggal pembaruan. Pusat peta default: [TBD, koordinat area kampanye].

### 9.3 Teknologi peta

| Pilihan                                            | Keputusan     | Alasan                                                                                                                                |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Leaflet + react-leaflet 5 + tile OpenStreetMap** | **Dipakai**   | Tanpa API key dan tanpa kartu. Cocok untuk trafik kecil. Atribusi wajib tampil                                                        |
| Google Maps JavaScript API                         | Tidak dipakai | Mewajibkan akun billing dengan metode pembayaran, bertentangan dengan pilihan paket Spark tanpa kartu                                 |
| Penyedia tile lain                                 | Cadangan      | Bila trafik tinggi, ganti URL tile (server publik OSM berbasis donasi, tanpa SLA, dan dapat memblokir klien yang melanggar kebijakan) |

**Perilaku:** penanda berwarna per jenis (`CircleMarker`, menghindari masalah ikon bawaan Leaflet di Vite), popup berisi nama, yang diterima, jam, dan jarak, titik biru dan lingkaran akurasi untuk posisi pengguna (`navigator.geolocation.watchPosition`, HTTPS dan izin pengguna), serta tautan rute `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`.

**Catatan:** `center` pada `MapContainer` hanya dibaca saat peta dibuat, sehingga tombol "Ke lokasiku" memakai `useMap().flyTo`. GPS di dalam gedung bisa meleset puluhan meter. Lokasi pengguna **hanya diproses di browser** dan tidak dikirim ke server.

## 10. Kuis dan pengukuran pengetahuan

Kuis **terpisah dari scan** (tidak ada tebakan setelah scan) dan bertujuan mengukur pengetahuan untuk evaluasi tugas.

### 10.1 Desain

- **Bank soal:** 15–20 soal pilihan ganda, dibagi **set A** dan **set B** yang setara (konsep sama, benda berbeda). Pre-test memakai set A dan post-test set B, atau diacak per pengguna, agar kenaikan skor mencerminkan pemahaman dan bukan hafalan jawaban.
- **Jumlah soal per sesi:** 5–8 soal acak dari set yang berlaku.
- **Pre-test:** ditawarkan pada kunjungan pertama (boleh dilewati).
- **Post-test:** dibuka setelah syarat terpenuhi (usulan: minimal 3 scan atau minimal 1 hari sejak pre-test) **[TBD]**.
- **Mode latihan:** tersedia kapan saja, tidak tercatat.
- Penjelasan jawaban ditampilkan **setelah** kuis selesai.
- **Cakupan soal:** jenis sampah per kelas, benda yang sering salah (baterai, struk, kemasan berlapis, kardus berminyak), dan mitos vs fakta.

### 10.2 Data

Satu dokumen per `uid` dan tipe, dengan ID dokumen `{uid}_pre` atau `{uid}_post`. Karena hanya `create` yang diizinkan, setiap perangkat hanya punya satu pre dan satu post.

| Field       | Tipe      | Keterangan                      |
| ----------- | --------- | ------------------------------- |
| `uid`       | string    | UID anonim                      |
| `tipe`      | string    | `pre` atau `post`               |
| `skor`      | number    | Jumlah benar                    |
| `total`     | number    | Jumlah soal                     |
| `jawaban`   | array     | `{ id, pilih, benar }` per soal |
| `versi`     | string    | Versi bank soal                 |
| `createdAt` | timestamp | Waktu server                    |

### 10.3 Analisis

Bandingkan skor pre dan post pada **uid yang sama** (uji berpasangan), laporkan jumlah pasangan, rata-rata, dan selisih. Sampaikan keterbatasan dengan jujur: UID anonim bisa berganti bila data browser dihapus, peserta post-test bisa lebih sedikit daripada pre-test, dan tidak ada kelompok kontrol. Klaim yang sah adalah peningkatan pengetahuan pada peserta yang menyelesaikan keduanya, bukan pengurangan sampah.

## 11. Analitik dan situs admin

Pengguna tidak bisa mengakses dashboard apa pun. Aplikasi hanya mengirim kejadian anonim, sedangkan dashboard berada di luar aplikasi.

### 11.1 Kejadian analitik anonim (Firebase Analytics / GA4)

| Kejadian         | Parameter                                                                     | Tujuan                                          |
| ---------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `app_open`       | `src` (dari `?src=`)                                                          | Jumlah peserta dan efektivitas saluran kampanye |
| `scan_result`    | `kelas`, `sumber` (kamera atau upload), `hasil` (ok, ragu, kosong)            | Distribusi scan dan seberapa sering model ragu  |
| `quiz_complete`  | `tipe`, `skor`                                                                | Penyelesaian kuis                               |
| `kamus_cari`     | `ditemukan` (ya atau tidak), `istilah` (hanya bila tidak ditemukan, dipotong) | Item kamus yang perlu ditambah                  |
| `lokasi_dibuka`  | `kelas`, `izin_lokasi`                                                        | Penggunaan fitur lokasi                         |
| `feedback_kirim` | `predicted`, `correct`                                                        | Keterlibatan dan kualitas model                 |

Tidak ada data pribadi pada kejadian. Tampilkan pemberitahuan singkat soal analitik anonim di aplikasi.

### 11.2 Dashboard tingkat A (tanpa kode)

Laporan Firebase Analytics di konsol, ditambah **Looker Studio** (gratis) bila ingin tampilan yang rapi dan dapat dibagikan ke anggota kelompok dan dosen.

### 11.3 Situs admin (tingkat B, opsional)

- Situs kedua di Firebase Hosting (misalnya folder `admin/` dengan target hosting `admin`).
- **Login Google**. Hanya UID yang terdaftar di dokumen `admins/{uid}` yang boleh membaca data.
- Fitur: statistik kuis (pasangan pre/post, rata-rata, selisih), **tinjau feedback** (gambar, label prediksi vs koreksi, setujui atau tolak, koreksi label dan kotak, tandai `status`), dan ekspor feedback yang disetujui ke format YOLO.
- Akses dikunci oleh **security rules**, bukan oleh menyembunyikan alamat. Pastikan domain situs admin ada di daftar _Authorized domains_ Firebase Authentication.

## 12. Arsitektur dan tech stack

```
HP / Browser (HTTPS)
  ├─ React + TypeScript (Vite) — situs utama
  │   ├─ Kamera (getUserMedia) dan unggah foto
  │   ├─ onnxruntime-web: sampah_yolo11n.onnx → letterbox → inferensi → NMS
  │   ├─ Overlay kanvas (box + label), ringkasan, panduan, edukasi
  │   ├─ Kuis, Kamus, Lokasi (Leaflet + tile OSM + Geolocation API)
  │   └─ Firebase SDK ──► Firestore (feedback, kuis) + Anonymous Auth + Analytics
  │
Firebase Hosting ──► situs utama (statis: aplikasi, model, WASM, JSON konten)
                 ──► situs admin (login Google, dilindungi rules)
GitHub Actions   ──► build dan deploy otomatis (preview di PR, live di main)
Looker Studio    ──► dashboard dari GA4 (tanpa kode)
```

| Lapisan   | Pilihan                                                   | Alasan                                                                                     |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Frontend  | Vite + React + TypeScript (TypeScript dikunci `~6.0.3`)   | Cepat dan ekosistem luas. TypeScript 7 belum kompatibel dengan `typescript-eslint` terbaru |
| Inferensi | `onnxruntime-web`                                         | Berjalan di perangkat, privat, tanpa server inferensi                                      |
| Peta      | `leaflet` + `react-leaflet` 5 (React 19)                  | Gratis, tanpa kunci                                                                        |
| Hosting   | Firebase Hosting (Spark)                                  | HTTPS otomatis (wajib untuk kamera dan geolokasi), tanpa kartu                             |
| Database  | Firestore (Spark)                                         | Menyimpan feedback dan hasil kuis tanpa backend sendiri                                    |
| Auth      | Anonymous Auth (pengguna), Google Sign-In (admin)         | Identitas teknis untuk rules                                                               |
| Analitik  | Firebase Analytics (GA4) + Looker Studio                  | Data jangkauan tanpa membangun dashboard                                                   |
| CI/CD     | GitHub Actions + `FirebaseExtended/action-hosting-deploy` | Preview di PR, deploy live saat merge ke `main`                                            |
| Backend   | **Tidak ada**                                             | Cukup Firebase SDK dan security rules                                                      |

**Struktur repositori:**

```
trash-scan/
├── .github/workflows/          # firebase-hosting-merge.yml, firebase-hosting-pull-request.yml
├── model/                      # sumber tunggal model .onnx
├── frontend/
│   ├── public/
│   │   ├── config.json
│   │   └── data/               # kamus.json, kuis.json, lokasi.json
│   ├── scripts/sync-model.mjs
│   ├── src/                    # firebase.ts, feedback.ts, quiz.ts, inferensi, peta, UI
│   ├── firebase.json
│   └── .env                    # VITE_FIREBASE_* (tidak di-commit)
└── admin/                      # situs admin (opsional, terpisah)
```

## 13. Data, keamanan, dan privasi

### 13.1 Koleksi Firestore

| Koleksi           | Dokumen                                                                                | Baca oleh klien | Tulis oleh klien                   |
| ----------------- | -------------------------------------------------------------------------------------- | --------------- | ---------------------------------- |
| `feedback/{id}`   | `uid`, `predicted`, `correct`, `box?`, `imageB64`, `createdAt`, `status` (diisi admin) | Hanya admin     | Hanya `create`                     |
| `users/{uid}`     | `lastAt`, `count` (pembatasan laju)                                                    | Tidak           | Hanya lewat batch bersama feedback |
| `quiz/{uid_tipe}` | lihat bagian 10.2                                                                      | Hanya admin     | Hanya `create`                     |
| `admins/{uid}`    | penanda admin                                                                          | Tidak           | Tidak (dikelola lewat konsol)      |

Gambar feedback disimpan sebagai base64 JPEG (sisi terpanjang 640 px, kualitas ±0,7, di bawah 900.000 karakter) di Firestore karena Cloud Storage for Firebase kini mensyaratkan paket Blaze. Batas satu dokumen Firestore adalah 1 MiB.

### 13.2 Aturan keamanan (ringkasan, rancangan)

Untuk `feedback` dan `users`, gunakan aturan dari v0.1: hanya `create`, daftar field dibatasi, nilai `correct` divalidasi, ukuran gambar dibatasi, jeda minimal 15 detik, dan maksimal 30 feedback per akun lewat batch yang memperbarui `users/{uid}`. Tambahan untuk v0.2:

```
function isAdmin() {
  return request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

match /admins/{uid} { allow read, write: if false; }

match /quiz/{id} {
  allow create: if request.auth != null
    && request.resource.data.tipe in ['pre', 'post']
    && id == request.auth.uid + '_' + request.resource.data.tipe
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.keys().hasOnly(['uid','tipe','skor','total','jawaban','versi','createdAt'])
    && request.resource.data.skor is int && request.resource.data.total is int
    && request.resource.data.skor >= 0 && request.resource.data.skor <= request.resource.data.total
    && request.resource.data.total <= 20
    && request.resource.data.createdAt == request.time;
  allow read: if isAdmin();
  allow update, delete: if false;
}

// pada match /feedback/{id}: ganti "allow read, update, delete: if false" menjadi
//   allow read, update: if isAdmin();   allow delete: if false;
```

Aturan ini adalah rancangan dan **wajib diuji** di Rules Playground atau emulator sebelum dipublikasikan.

### 13.3 Lapisan anti-spam

1. **App Check** (reCAPTCHA Enterprise): pantau dahulu, lalu enforce untuk Firestore dan Authentication.
2. **Security rules:** validasi field, ukuran, jeda, dan batas per akun.
3. **UI:** tombol kirim dinonaktifkan setelah sekali tekan, satu hasil hanya bisa dikoreksi sekali.
4. **Data tidak tepercaya:** semua feedback ditinjau manual sebelum masuk dataset.

### 13.4 Privasi

- Inferensi berjalan di perangkat. **Tidak ada gambar yang dikirim** kecuali pengguna menekan kirim pada feedback.
- Lokasi pengguna hanya diproses di browser.
- Analitik anonim dan hasil kuis tidak memuat data pribadi. Tampilkan pemberitahuan singkat.
- Persetujuan eksplisit sebelum mengirim gambar feedback ("Gambar ini akan disimpan untuk memperbaiki model").
- Hanya admin proyek yang dapat membaca data. Kebijakan retensi dan penghapusan data **[TBD]**.

## 14. Kebutuhan non-fungsional

| Aspek              | Kebutuhan                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performa**       | Deteksi live ±3 FPS di HP menengah (usulan). Model dan WASM di-cache browser (header cache 1 hari untuk `.onnx` dan `.wasm`). Halaman Kamus dan Lokasi dimuat tanpa menunggu model |
| **Kompatibilitas** | Chrome/Edge Android dan Safari iOS versi terbaru, diuji di minimal dua perangkat nyata                                                                                             |
| **Keamanan**       | Wajib HTTPS (kamera, geolokasi). Kunci Firebase di frontend bukan rahasia, keamanan bertumpu pada rules dan App Check                                                              |
| **Aksesibilitas**  | Kontras cukup, teks terbaca, informasi tidak hanya lewat warna, tombol besar, operasi satu tangan                                                                                  |
| **Ketahanan**      | Penanganan error: model gagal dimuat, kamera atau lokasi ditolak, jaringan putus saat kirim feedback atau kuis                                                                     |
| **Kuota**          | Paket Spark memiliki kuota harian. Spam hanya bisa menghabiskan kuota, aplikasi inti tetap berjalan karena inferensi di browser                                                    |
| **Peta**           | Patuhi kebijakan tile OSM (atribusi, tidak untuk trafik berat). Siapkan penyedia tile cadangan                                                                                     |
| **Lisensi**        | Atribusi CC BY 4.0 (dataset), OpenStreetMap contributors (peta), AGPL-3.0 (Ultralytics)                                                                                            |

## 15. Kampanye, mitra, evaluasi, dan keberlanjutan

Bagian ini memetakan project ke template **project-based SDGs**.

### 15.1 Pemetaan ke template

| Template                      | Dokumen ini                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| 1. Judul                      | "TrashScan: Pilah Sampah Pintar dengan Kamera (SDG 12 dan SDG 4)" |
| 2. Latar belakang             | Bagian 2                                                          |
| 3. Tujuan                     | Bagian 3.1                                                        |
| 4. Target SDG                 | Bagian 2.4                                                        |
| 5. Kegiatan dan lini masa     | Bagian 15.4 dan 16.3                                              |
| 6. Peran dan tanggung jawab   | Bagian 16.4                                                       |
| 7. Hasil yang diharapkan      | Bagian 15.5                                                       |
| 8. Evaluasi dan keberlanjutan | Bagian 15.6 dan 15.7                                              |

### 15.2 Kampanye

- **Nama gerakan:** [TBD].
- **Audiens sasaran:** [TBD, usulan: mahasiswa satu fakultas, penghuni kos, atau satu RT] agar mudah dijangkau dan diukur.
- **Periode:** 2–3 minggu agar ada waktu untuk pre-test, penggunaan, dan post-test.
- **Saluran** (masing-masing dengan tautan `?src=` berbeda):

| Saluran                                                       | Contoh `src`    | Keterangan                                                         |
| ------------------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| Poster QR di titik tong sampah dan kantin                     | `poster-kantin` | Dipindai saat orang memegang sampah                                |
| Konten media sosial (3–4 konten, video pendek "tebak sampah") | `ig-reels`      | Tanpa tombol bagikan di aplikasi, penyebaran lewat konten kampanye |
| Booth atau sesi singkat di acara kampus                       | `booth`         | Layar aplikasi dipakai bergiliran                                  |
| Komunitas atau UKM lingkungan                                 | `ukm`           | Mengajak anggota mengisi kuis                                      |

### 15.3 Mitra

| Mitra                                | Yang diminta                                                                                  | Bukti untuk laporan                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Bank sampah atau TPS3R setempat**  | Memeriksa panduan dan aturan pemilahan lokal, menyediakan data titik setor, foto sampah lokal | Surat dukungan, foto kunjungan, testimoni |
| UKM atau komunitas lingkungan kampus | Saluran kampanye, booth, responden kuis                                                       | Dokumentasi kegiatan, daftar peserta      |
| Pengelola kampus atau kantin         | Izin menempel poster QR                                                                       | Foto pemasangan, izin tertulis            |
| Dosen atau dinas lingkungan hidup    | Masukan materi edukasi dan keberlanjutan                                                      | Catatan bimbingan                         |

Minimal **satu mitra yang benar-benar terlibat**. Nama mitra [TBD].

### 15.4 Aktivitas dan lini masa

Minggu disesuaikan dengan kalender perkuliahan [TBD].

| Fase                       | Kegiatan                                                                                         | Keluaran                                      | Minggu |
| -------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------ |
| 1. Perencanaan             | Pemetaan masalah dan data dasar, menentukan audiens dan mitra, menyiapkan bank soal              | Rencana proyek, data dasar, bank soal         | [TBD]  |
| 2. Desain                  | Evaluasi dan penyempurnaan model, desain UI, materi kampanye, konten edukasi, kamus, data lokasi | Model terevaluasi, prototipe, materi kampanye | [TBD]  |
| 3. Implementasi            | Rilis aplikasi di URL publik, kampanye 2–3 minggu, pre-test dan post-test                        | Aplikasi live, kegiatan kampanye              | [TBD]  |
| 4. Pemantauan dan refleksi | Analisis data kuis dan analitik, tinjau feedback, audit tong, revisi                             | Hasil evaluasi, perbaikan                     | [TBD]  |
| 5. Presentasi              | Laporan akhir, demo, dokumentasi                                                                 | Laporan, presentasi                           | [TBD]  |

### 15.5 Hasil yang diharapkan

- **Berwujud:** aplikasi web publik, poster QR, 3–4 konten media sosial, video demo, draft berita, laporan akhir dengan hasil evaluasi.
- **Tidak berwujud:** peningkatan pengetahuan pemilahan, kolaborasi tim, kemitraan dengan bank sampah dan komunitas, kesadaran di lingkungan kampanye.

### 15.6 Evaluasi

| Metrik                        | Cara mengukur                                                                                      | Sumber data      |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| Jumlah peserta yang dijangkau | Pengguna aktif dan pengguna unik per `src`                                                         | GA4              |
| Aktivitas                     | Jumlah scan, distribusi kelas, proporsi hasil ragu atau kosong                                     | GA4              |
| **Peningkatan pengetahuan**   | Selisih skor pre dan post (berpasangan)                                                            | Firestore `quiz` |
| Persepsi (opsional)           | Survei singkat tentang kejelasan dan kegunaan                                                      | Google Form      |
| Perilaku (opsional)           | Audit kecil: hitung item salah tempat pada sampel tong di satu lokasi sebelum dan sesudah kampanye | Catatan lapangan |
| Teknis                        | mAP per kelas dan uji lapangan                                                                     | Hasil training   |
| Tantangan program             | Kendala lapangan, saran, kualitas data                                                             | Refleksi tim     |

**Batasan klaim:** jumlah scan **bukan** jumlah limbah berkurang. Jangan mengklaim CO₂ yang dihemat tanpa metodologi.

### 15.7 Keberlanjutan

- Pengembangan skala lebih besar bersama bank sampah, dinas lingkungan hidup, atau unit universitas.
- Pembaruan data lokasi oleh mitra, retraining berkala dari feedback yang ditinjau.
- Pengembangan lanjutan: poin dan gamifikasi, riwayat scan, login, crowdsourcing titik lokasi, integrasi dengan platform bank sampah, perluasan wilayah.
- Penyerahan konten dan pengelolaan situs ke mitra atau unit kampus [TBD].

## 16. Pengembangan dan rilis

### 16.1 Alur branch

```
fitur/* ──PR──► dev ──PR──► main ──► deploy LIVE
```

- `main`: situs live, dilindungi (wajib PR dan minimal 1 review). Merge ke `main` otomatis men-deploy.
- `dev`: integrasi fitur, tidak men-deploy.
- Pull request menghasilkan URL preview (fitur feedback dan kuis dapat gagal di URL preview karena domain berbeda, uji di URL live).
- Secret GitHub: `FIREBASE_SERVICE_ACCOUNT_TRASHSCAN_BEAFD` dan `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
- Build memakai Node 22 dan `npm ci`, sehingga `package-lock.json` wajib di-commit.
- Deploy situs admin (target hosting kedua) [TBD, workflow terpisah bila dipakai].

### 16.2 Prioritas

1. **P0 (wajib):** scan kamera dan unggah, ringkasan, panduan, edukasi, ragu dan kosong, kuis pre/post, keterbatasan, plus kampanye dan satu mitra.
2. **P1 (sangat disarankan):** feedback, multi-objek, kamus, lokasi dan peta, analitik, halaman Tentang, mode latihan.
3. **P2 (bila sempat):** situs admin, PWA.

### 16.3 Milestone teknis

| Tahap                    | Cakupan                                                   | Status                                                       |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------ |
| M0 Fondasi               | Vite, Firebase Hosting, CI/CD, struktur repo              | Build lokal berhasil, push pertama dan uji pipeline menunggu |
| M1 Evaluasi model        | mAP per kelas, confusion matrix, ambang awal              | Belum                                                        |
| M2 Inferensi             | Kamera, unggah, letterbox, ONNX Runtime Web, NMS, overlay | Belum                                                        |
| M3 UI inti               | Jepret, ringkasan, hasil, ragu, kosong, panduan, edukasi  | Belum                                                        |
| M4 Kuis dan konten       | Kuis pre/post, kamus, bank soal, `config.json`            | Belum                                                        |
| M5 Lokasi                | Data titik setor, peta, geolokasi                         | Belum                                                        |
| M6 Feedback dan keamanan | Anonymous Auth, Firestore, rules, App Check, analitik     | Belum                                                        |
| M7 Admin (opsional)      | Situs admin, tinjau feedback, ekspor YOLO                 | Belum                                                        |
| M8 Uji lapangan          | Uji di HP nyata, setel ambang, perbaiki data              | Belum                                                        |
| M9 Kampanye dan evaluasi | Kampanye, pre/post, analisis                              | Belum                                                        |
| M10 Pengumpulan          | Laporan, atribusi, demo                                   | Belum                                                        |

### 16.4 Peran dan tanggung jawab

Sesuai template, ditambah peran teknis. Nama anggota [TBD].

| Peran                | Tanggung jawab                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| Pemimpin proyek      | Koordinasi tugas, jadwal, dan komunikasi dengan mitra                       |
| Tim riset            | Data latar belakang, bank soal, survei, analisis kuis, audit lapangan       |
| Tim kreatif/desain   | Poster QR, konten media sosial, desain UI, konten edukasi                   |
| Penghubung komunitas | Hubungan dengan bank sampah, UKM, pengelola kampus, pengumpulan data lokasi |
| Tim model            | Dataset, training, evaluasi, ekspor ONNX                                    |
| Tim web              | Aplikasi, Firebase, CI/CD, peta, situs admin                                |

## 17. Risiko dan mitigasi

| Risiko                                                                            | Dampak                                 | Mitigasi                                                                            |
| --------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Data b3, kertas, residu sangat sedikit                                            | Kelas sulit terdeteksi                 | Tambah foto dan anotasi sendiri (dibantu mitra), ambang per kelas, jujur di laporan |
| Pergeseran domain (sampah lokal)                                                  | Akurasi lapangan lebih rendah          | Uji dengan foto lokal, siklus feedback                                              |
| Ukuran training dan ekspor model berbeda                                          | Akurasi turun di 416                   | Verifikasi dari log, ekspor ulang bila perlu                                        |
| Label bentrok antar dataset (kaleng)                                              | Panduan salah                          | Tinjau visual, satu aturan pemetaan, dokumentasikan                                 |
| Performa lambat di HP                                                             | Pengalaman real-time buruk             | Inferensi berkala, coba WebGPU, model atau resolusi lebih kecil                     |
| Panduan atau data lokasi keliru atau usang                                        | Pengguna salah buang atau salah alamat | Verifikasi bersama mitra, tanggal pembaruan, catatan keterbatasan                   |
| Kebijakan tile OSM dan trafik naik                                                | Peta kosong atau diblokir              | Atribusi, trafik kecil, siapkan penyedia tile cadangan                              |
| Akurasi GPS rendah, izin lokasi ditolak                                           | Urutan jarak tidak tepat               | Fallback pusat peta dan daftar tanpa urutan                                         |
| Bias pengukuran kuis (UID per browser, peserta post lebih sedikit, tanpa kontrol) | Klaim peningkatan pengetahuan lemah    | Soal set setara, hanya analisis pasangan, sampaikan keterbatasan                    |
| Spam feedback dan kuis                                                            | Kuota habis, data kotor                | App Check, rate limit di rules, create-only, tinjau manual                          |
| Akses admin bocor                                                                 | Data feedback terbaca                  | Rules `isAdmin()`, daftar admin sedikit, login Google                               |
| Terlalu banyak fitur dibanding waktu                                              | Fitur setengah jadi                    | Patuhi prioritas P0/P1/P2, fitur P2 boleh dipotong                                  |
| Ketergantungan pada mitra                                                         | Kampanye atau data tertunda            | Pendekatan mitra sejak fase awal, siapkan alternatif                                |
| Kewajiban lisensi AGPL-3.0                                                        | Kode wajib dibuka bila dipublikasikan  | Catat di laporan, buka repositori bila perlu                                        |
| Peringatan `npm audit` pada dependensi gRPC Firebase                              | Tampak mengkhawatirkan                 | Hanya relevan untuk server gRPC di Node.js. Jangan jalankan `npm audit fix --force` |

## 18. Pertanyaan terbuka dan keputusan tertunda

1. **Pemetaan `metal-can`.** Contoh gambarnya kaleng makanan dan minuman biasa yang umumnya anorganik, sedangkan pemetaan ke b3 berisiko bertabrakan dengan data anorganik lain. Keputusan akhir: [TBD, disarankan anorganik].
2. Hasil evaluasi per kelas `merged_v2`, komposisi akhir, dan ukuran gambar saat training.
3. Warna tong, aturan khusus `kertas`, dan nama mitra untuk memverifikasi panduan.
4. Wilayah peta (pusat peta default) dan sumber data titik setor.
5. Syarat dibukanya post-test (jumlah scan atau jeda hari) dan komposisi set soal A dan B.
6. Audiens, nama gerakan, dan periode kampanye.
7. Apakah situs admin dibangun atau cukup GA4 dan Looker Studio.
8. Apakah App Check dipasang di versi pertama atau menyusul.
9. Kebijakan retensi data feedback dan kuis.
10. Perilaku multi-objek yang final (kartu per kelas atau pilih lewat ketuk kotak).
11. Pembagian tugas anggota kelompok.

## 19. Lampiran

### 19.1 Glosarium

| Istilah              | Arti                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| Bounding box         | Kotak yang membungkus objek terdeteksi                                     |
| Confidence           | Tingkat keyakinan model (tidak ditampilkan ke pengguna)                    |
| Letterbox            | Mengubah ukuran gambar tanpa mengubah rasio, sisanya diberi padding        |
| NMS                  | Non-Maximum Suppression, membuang kotak yang menumpuk pada objek yang sama |
| mAP                  | Mean Average Precision, metrik utama akurasi deteksi objek                 |
| B3                   | Bahan Berbahaya dan Beracun                                                |
| Residu               | Sampah yang sulit didaur ulang atau diolah                                 |
| TPS3R                | Tempat Pengolahan Sampah Reduce, Reuse, Recycle                            |
| Spark / Blaze        | Paket Firebase gratis / bayar sesuai pemakaian                             |
| App Check            | Layanan Firebase yang memastikan permintaan berasal dari aplikasi asli     |
| GA4                  | Google Analytics 4, dipakai Firebase Analytics                             |
| Pre-test / post-test | Kuis sebelum dan sesudah menggunakan aplikasi                              |

### 19.2 Atribusi dan lisensi

- **Dataset:** Roboflow Universe (workspace `yolo-y9ms0`, `apaciapacu`, dan sumber dataset kaleng), CC BY 4.0. Cantumkan judul, pembuat, dan URL di halaman Tentang dan laporan.
- **Peta:** data © OpenStreetMap contributors (atribusi wajib tampil pada peta).
- **Model dan library:** Ultralytics YOLO11 (AGPL-3.0), ONNX Runtime Web, React, Vite, Firebase, Leaflet dan react-leaflet.
- **Data statistik sampah:** SIPSN KLHK (sumber primer), dilaporkan oleh GoodStats dan Republika. Verifikasi ke portal SIPSN sebelum dikutip.
