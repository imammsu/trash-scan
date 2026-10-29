import type { AppConfig } from "./config.ts";
import type { Detection } from "./postprocess.ts";

/** Gambar kotak + label kelas (tanpa angka confidence). Koordinat dalam piksel sumber. */
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  dets: Detection[],
  cfg: AppConfig,
  width: number,
  height: number,
): void {
  const k = Math.max(width, height) / 720; // skala agar garis dan teks terbaca di resolusi berapa pun
  const fontPx = Math.round(24 * k);
  ctx.lineWidth = Math.max(2, 3 * k);
  ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
  ctx.textBaseline = "top";

  for (const d of dets) {
    const name = cfg.classes[d.classId];
    const { warna, label } = cfg.content[name].tong;
    const [x1, y1, x2, y2] = d.box;

    ctx.strokeStyle = warna;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    const pad = 5 * k;
    const textW = ctx.measureText(label).width;
    const boxH = fontPx + pad * 2;
    const ly = y1 - boxH >= 0 ? y1 - boxH : y1; // label di atas kotak; di dalam bila mentok atas
    ctx.fillStyle = warna;
    ctx.fillRect(x1, ly, textW + pad * 2, boxH);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x1 + pad, ly + pad);
  }
}
