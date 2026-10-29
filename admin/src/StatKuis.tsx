import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { Download, RefreshCw } from "lucide-react";
import { db } from "./firebase";
import { ujiT, type Pasangan } from "./stats";

interface QuizDoc {
  uid: string;
  tipe: "pre" | "post";
  skor: number;
  total: number;
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export default function StatKuis() {
  const [docs, setDocs] = useState<QuizDoc[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [n, setN] = useState(0);
  useEffect(() => {
    let batal = false;
    getDocs(query(collection(db, "quiz"), limit(5000)))
      .then((snap) => !batal && setDocs(snap.docs.map((d) => d.data() as QuizDoc)))
      .catch((e) => !batal && setErr(String((e as Error).message)));
    return () => {
      batal = true;
    };
  }, [n]);
  const muat = () => { setDocs(null); setErr(null); setN((x) => x + 1); };

  if (err) return <p className="err">{err}</p>;
  if (!docs) return <p>Memuat...</p>;

  const per = new Map<string, { pre?: number; post?: number }>();
  for (const d of docs) {
    const r = per.get(d.uid) ?? {};
    r[d.tipe] = d.total ? d.skor / d.total : 0;
    per.set(d.uid, r);
  }
  const pasangan: Pasangan[] = [];
  let hanyaPre = 0;
  let hanyaPost = 0;
  for (const [uid, r] of per) {
    if (r.pre !== undefined && r.post !== undefined) pasangan.push({ uid, pre: r.pre, post: r.post });
    else if (r.pre !== undefined) hanyaPre++;
    else hanyaPost++;
  }
  const h = ujiT(pasangan);

  function unduhCsv() {
    const baris = ["uid,pre,post,selisih", ...pasangan.map((p) => `${p.uid},${p.pre.toFixed(4)},${p.post.toFixed(4)},${(p.post - p.pre).toFixed(4)}`)];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([baris.join("\n")], { type: "text/csv" }));
    a.download = "kuis-pasangan.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="bar-aksi">
        <button className="btn ghost" onClick={muat}><RefreshCw size={16} /> Muat ulang</button>
        <button className="btn" onClick={unduhCsv} disabled={pasangan.length === 0}><Download size={16} /> Unduh CSV pasangan</button>
      </div>
      <div className="grid-stat">
        <div className="stat"><b>{docs.length}</b><span>dokumen kuis</span></div>
        <div className="stat"><b>{pasangan.length}</b><span>pasangan pre dan post</span></div>
        <div className="stat"><b>{hanyaPre}</b><span>hanya pre-test</span></div>
        <div className="stat"><b>{hanyaPost}</b><span>hanya post-test</span></div>
      </div>
      {h ? (
        <table>
          <tbody>
            <tr><th>Rata-rata pre</th><td>{pct(h.meanPre)}</td></tr>
            <tr><th>Rata-rata post</th><td>{pct(h.meanPost)}</td></tr>
            <tr><th>Selisih rata-rata</th><td>{pct(h.meanSelisih)} (SD {pct(h.sd)})</td></tr>
            <tr><th>Uji-t berpasangan</th><td>t({h.df}) = {Number.isFinite(h.t) ? h.t.toFixed(3) : "tak hingga"}, p = {h.p < 0.001 ? "< 0,001" : h.p.toFixed(4)} (dua sisi)</td></tr>
            <tr><th>Ukuran efek (d<sub>z</sub>)</th><td>{h.dz.toFixed(2)}</td></tr>
          </tbody>
        </table>
      ) : (
        <p>Belum cukup pasangan (minimal 2) untuk uji-t.</p>
      )}
      <p className="muted">Skor dinormalisasi per peserta (benar dibagi total soal). Set soal A dan B diacak urutannya per akun, jadi perbedaan tingkat kesulitan antar-set sebagian terimbangi.</p>
    </div>
  );
}
