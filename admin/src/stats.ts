// Statistik pre/post berpasangan (PRD 10.3 dan AD-02).

export interface Pasangan {
  uid: string;
  pre: number; // 0..1
  post: number;
}

export interface Ringkasan {
  n: number;
  meanPre: number;
  meanPost: number;
  meanSelisih: number;
  sd: number;
  t: number;
  df: number;
  p: number;
  dz: number;
}

function lnGamma(x: number): number {
  const c = [76.18009172947, -86.505320329417, 24.014098240831, -1.2317395724502, 0.12086509738662e-2, -0.5395239385e-5];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const k of c) ser += k / ++y;
  return -tmp + Math.log((2.5066282746310 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const TINY = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

/** Beta tak lengkap teregularisasi I_x(a,b). */
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export function ujiT(ps: Pasangan[]): Ringkasan | null {
  const n = ps.length;
  if (n < 2) return null;
  const sel = ps.map((p) => p.post - p.pre);
  const mean = sel.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(sel.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const df = n - 1;
  const t = sd === 0 ? (mean === 0 ? 0 : Infinity) : mean / (sd / Math.sqrt(n));
  const p = Number.isFinite(t) ? ibeta(df / (df + t * t), df / 2, 0.5) : 0;
  return {
    n,
    meanPre: ps.reduce((a, b) => a + b.pre, 0) / n,
    meanPost: ps.reduce((a, b) => a + b.post, 0) / n,
    meanSelisih: mean,
    sd,
    t,
    df,
    p,
    dz: sd === 0 ? 0 : mean / sd,
  };
}
