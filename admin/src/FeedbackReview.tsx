import { useEffect, useState } from "react";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Check, RefreshCw, RotateCcw, X } from "lucide-react";
import { auth, db, KELAS } from "./firebase";

export interface Fb {
  id: string;
  predicted: string;
  correct: string;
  box?: [number, number, number, number];
  imageB64: string;
  status?: "approved" | "rejected";
}

type Filter = "menunggu" | "approved" | "rejected" | "semua";
const OPSI = [...KELAS, "bukan_sampah"];

export default function FeedbackReview() {
  const [items, setItems] = useState<Fb[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("menunggu");

  const [n, setN] = useState(0);
  useEffect(() => {
    let batal = false;
    getDocs(query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(200)))
      .then((snap) => !batal && setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Fb, "id">) }))))
      .catch((e) => !batal && setErr(String((e as Error).message)));
    return () => {
      batal = true;
    };
  }, [n]);
  const muat = () => { setItems(null); setErr(null); setN((x) => x + 1); };

  if (err) return <p className="err">{err}</p>;
  if (!items) return <p>Memuat...</p>;

  const tampil = items.filter((f) => (filter === "semua" ? true : filter === "menunggu" ? !f.status : f.status === filter));
  const ubah = (id: string, patch: Partial<Fb>) => setItems((arr) => arr!.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  async function simpan(f: Fb, status: "approved" | "rejected" | null) {
    const data = { correct: f.correct, box: f.box ?? null, status, reviewedAt: serverTimestamp(), reviewedBy: auth.currentUser?.uid ?? null };
    await updateDoc(doc(db, "feedback", f.id), data);
    ubah(f.id, { status: status ?? undefined });
  }

  return (
    <div>
      <div className="bar-aksi">
        {(["menunggu", "approved", "rejected", "semua"] as Filter[]).map((k) => (
          <button key={k} className={"chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
            {{ menunggu: "Menunggu", approved: "Disetujui", rejected: "Ditolak", semua: "Semua" }[k]}
          </button>
        ))}
        <button className="btn ghost" onClick={muat}><RefreshCw size={16} /> Muat ulang</button>
      </div>
      <p className="muted">{tampil.length} item (200 terbaru dimuat). Koreksi label dan kotak sebelum menyetujui.</p>
      {tampil.length === 0 && <p>Tidak ada item.</p>}
      <div className="grid-fb">
        {tampil.map((f) => (
          <article key={f.id} className="fb">
            <div className="gambar">
              <img src={`data:image/jpeg;base64,${f.imageB64}`} alt="" />
              {f.box && <div className="kotak" style={{ left: `${f.box[0] * 100}%`, top: `${f.box[1] * 100}%`, width: `${f.box[2] * 100}%`, height: `${f.box[3] * 100}%` }} />}
            </div>
            <p>Model: <b>{f.predicted}</b></p>
            <label>
              Label benar
              <select value={f.correct} onChange={(e) => ubah(f.id, { correct: e.target.value })}>
                {OPSI.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            {f.box && (
              <div className="box-edit">
                {(["x", "y", "lebar", "tinggi"] as const).map((n, i) => (
                  <label key={n}>
                    {n}
                    <input
                      type="range" min={0} max={1} step={0.005} value={f.box![i]}
                      onChange={(e) => {
                        const b = [...f.box!] as [number, number, number, number];
                        b[i] = Number(e.target.value);
                        ubah(f.id, { box: b });
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="bar-aksi">
              <button className="btn" onClick={() => simpan(f, "approved")}><Check size={16} /> Setujui</button>
              <button className="btn ghost" onClick={() => simpan(f, "rejected")}><X size={16} /> Tolak</button>
              {f.status && <button className="btn ghost" onClick={() => simpan(f, null)}><RotateCcw size={16} /> Reset</button>}
            </div>
            {f.status && <p className="muted">Status: {f.status === "approved" ? "disetujui" : "ditolak"}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
