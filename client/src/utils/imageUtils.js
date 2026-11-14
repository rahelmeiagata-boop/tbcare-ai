/**
 * Utilitas gambar untuk fitur scan resep.
 *
 * Foto dari kamera HP sering berukuran 5-10 MB. Sebelum dikirim, gambar
 * diperkecil di browser (sisi terpanjang 2000 px, JPEG) supaya upload cepat
 * dan muat di batas body request server (Vercel: sekitar 4,5 MB). Ukuran 2000 px
 * tetap cukup tajam untuk dibaca OCR.
 */

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak dapat dibaca. Coba pilih foto lain."));
    img.src = src;
  });

/** Ubah sumber gambar (object URL / data URL) menjadi Blob JPEG yang sudah diperkecil. */
export const resizeImageToBlob = async (src, { maxSide = 2000, quality = 0.88 } = {}) => {
  const img = await loadImage(src);

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (!width || !height) {
    throw new Error("Gambar tidak valid.");
  }

  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }

  // Latar putih agar PNG transparan tidak menjadi hitam saat dikonversi ke JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memproses gambar."))),
      "image/jpeg",
      quality
    );
  });
};
