import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { BarChart3, Database, Inbox, LogIn, LogOut } from "lucide-react";
import { auth, db } from "./firebase";
import StatKuis from "./StatKuis";
import FeedbackReview from "./FeedbackReview";
import Ekspor from "./Ekspor";

type Tab = "kuis" | "feedback" | "ekspor";

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("feedback");

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // Hak admin ditentukan oleh aturan Firestore (admins/{uid}); cek dengan satu pembacaan kecil.
  useEffect(() => {
    if (!user) return;
    let batal = false;
    getDocs(query(collection(db, "feedback"), limit(1)))
      .then(() => !batal && setAdmin(true))
      .catch(() => !batal && setAdmin(false));
    return () => {
      batal = true;
    };
  }, [user]);

  if (user === undefined) return <p className="pad">Memuat...</p>;

  if (!user) {
    return (
      <main className="masuk">
        <h1>TrashScan Admin</h1>
        <p>Masuk dengan akun Google yang sudah didaftarkan sebagai admin.</p>
        <button className="btn" onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}><LogIn size={18} /> Masuk dengan Google</button>
      </main>
    );
  }

  if (admin === false && user) {
    return (
      <main className="masuk">
        <h1>Akses ditolak</h1>
        <p>Akun {user.email} bukan admin. Minta pemilik proyek menambahkan dokumen <code>admins/{user.uid}</code> di Firestore.</p>
        <button className="btn ghost" onClick={() => signOut(auth)}><LogOut size={18} /> Keluar</button>
      </main>
    );
  }

  return (
    <div className="shell">
      <header>
        <h1>TrashScan Admin</h1>
        <nav>
          <button className={tab === "feedback" ? "on" : ""} onClick={() => setTab("feedback")}><Inbox size={16} /> Feedback</button>
          <button className={tab === "kuis" ? "on" : ""} onClick={() => setTab("kuis")}><BarChart3 size={16} /> Statistik kuis</button>
          <button className={tab === "ekspor" ? "on" : ""} onClick={() => setTab("ekspor")}><Database size={16} /> Ekspor YOLO</button>
        </nav>
        <button className="btn ghost" onClick={() => signOut(auth)}><LogOut size={16} /> Keluar</button>
      </header>
      <main>
        {admin === null ? <p>Memeriksa akses...</p> : tab === "feedback" ? <FeedbackReview /> : tab === "kuis" ? <StatKuis /> : <Ekspor />}
      </main>
    </div>
  );
}
