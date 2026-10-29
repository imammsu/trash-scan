// Utilitas gambar: orientasi EXIF, perkecil foto besar, JPEG untuk feedback.

export type Sumber = HTMLCanvasElement | HTMLVideoElement | ImageBitmap;

export async function bitmapDariFile(file: File, sisiMaks = 1280): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith("image/")) throw new Error("Format berkas bukan gambar.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Format foto tidak didukung browser ini. Coba JPG atau PNG.");
  }
  const skala = Math.min(1, sisiMaks / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * skala);
  c.height = Math.round(bmp.height * skala);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export function bekukanVideo(video: HTMLVideoElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext("2d")!.drawImage(video, 0, 0);
  return c;
}

/** JPEG base64 (tanpa prefix) dengan sisi terpanjang <= 640 px, di bawah 900.000 karakter. */
export function jpegUntukFeedback(src: HTMLCanvasElement): string {
  const skala = Math.min(1, 640 / Math.max(src.width, src.height));
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * skala);
  c.height = Math.round(src.height * skala);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  let q = 0.7;
  let out = c.toDataURL("image/jpeg", q).split(",")[1];
  while (out.length >= 900000 && q > 0.3) {
    q -= 0.1;
    out = c.toDataURL("image/jpeg", q).split(",")[1];
  }
  return out;
}
