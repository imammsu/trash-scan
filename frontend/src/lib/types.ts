export type Kelas = "anorganik" | "b3" | "kertas" | "organik" | "residu";

export interface Detection {
  cls: number;
  kelas: Kelas;
  score: number;
  x: number; // piksel pada gambar sumber
  y: number;
  w: number;
  h: number;
}

export interface Edukasi {
  apa: string;
  kenapa: string;
  waktuTerurai: string | null;
  aksiKecil: string;
  kurangiDulu: string;
  fakta: { teks: string; sumber: string } | null;
  sdg: string[];
}

export interface KelasDetail {
  nama: string;
  tong: { warna: string; label: string };
  titikSetor: boolean;
  peringatan?: string;
  panduan: string[];
  edukasi: Edukasi;
}

export interface Ambang {
  live: number;
  capture: number;
  floor: number;
  nmsIou: number;
  perKelas: Partial<Record<Kelas, { live?: number; capture?: number }>>;
}

export interface AppConfig {
  versi: string;
  kelas: Kelas[];
  model: { url: string; ukuran: number };
  ambang: Ambang;
  peta: { pusat: [number, number]; zoom: number };
  kuis: { soalPerSesi: number; postMinScan: number; postMinHari: number; versi: string };
  faktaMuat: string[];
  kelasDetail: Record<Kelas, KelasDetail>;
}

export interface KamusEntry {
  nama: string;
  alias: string[];
  kelas: Kelas;
  alasan: string;
  tips: string;
}

export interface Soal {
  id: string;
  set: "A" | "B";
  tanya: string;
  opsi: string[];
  benar: number;
  penjelasan: string;
}

export interface Lokasi {
  id: string;
  nama: string;
  jenis: "bank_sampah" | "b3" | "kompos";
  menerima: Kelas[];
  lat: number;
  lng: number;
  alamat: string;
  jam: string;
  kontak: string;
  diperbarui: string;
}

export type HasilScan = "ok" | "ragu" | "kosong";
