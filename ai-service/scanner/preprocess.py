"""Image processing (OpenCV) untuk foto resep sebelum dibaca OCR.

Tahapan (setiap tahap disimpan agar bisa ditampilkan/dijelaskan):
  1. Ubah ukuran       : sisi terpanjang dinormalkan agar tinggi huruf layak dibaca
  2. Koreksi perspektif: deteksi tepi kertas -> luruskan (efek "document scanner")
  3. Grayscale         : buang informasi warna
  4. Normalisasi cahaya: hilangkan bayangan/pencahayaan tidak merata
  5. Denoise + kontras : bilateral filter, peregangan histogram, CLAHE
  6. Koreksi kemiringan: deskew dengan proyeksi horizontal
  7. Binarisasi        : Sauvola threshold + buang bintik kecil
  8. Potong area teks  : buang tepi/meja di sekitar kertas
"""
from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

from . import config


@dataclass
class Step:
    key: str
    title: str
    description: str
    image: np.ndarray  # BGR atau grayscale uint8


@dataclass
class Preprocessed:
    gray: np.ndarray  # grayscale hasil perbaikan (untuk OCR varian "gray")
    binary: np.ndarray  # hitam-putih (untuk OCR varian "binary")
    steps: list[Step] = field(default_factory=list)
    info: dict = field(default_factory=dict)


# --------------------------------------------------------------------- util
def _odd(value: int) -> int:
    value = int(value)
    return value if value % 2 == 1 else value + 1


def limit_size(img: np.ndarray, max_side: int, min_side: int) -> np.ndarray:
    """Perkecil gambar yang terlalu besar, perbesar yang terlalu kecil."""
    h, w = img.shape[:2]
    longest = max(h, w)
    if longest > max_side:
        scale = max_side / longest
        interp = cv2.INTER_AREA
    elif longest < min_side:
        scale = min(min_side / longest, 3.0)
        interp = cv2.INTER_CUBIC
    else:
        return img
    return cv2.resize(img, (round(w * scale), round(h * scale)), interpolation=interp)


def order_points(pts: np.ndarray) -> np.ndarray:
    """Urutkan 4 titik: kiri-atas, kanan-atas, kanan-bawah, kiri-bawah."""
    pts = np.asarray(pts, dtype=np.float32).reshape(4, 2)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], dtype=np.float32)


# ---------------------------------------------------------- 2. perspektif
def find_document_quad(img: np.ndarray) -> np.ndarray | None:
    """Cari 4 sudut kertas. Mengembalikan None bila tidak yakin (lebih baik
    tidak memotong daripada memotong salah)."""
    h, w = img.shape[:2]
    scale = min(1.0, 600.0 / max(h, w))
    small = cv2.resize(img, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else img
    gray = cv2.GaussianBlur(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), (7, 7), 0)
    sh, sw = gray.shape
    total = float(sh * sw)

    _, bright = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    edges = cv2.dilate(cv2.Canny(gray, 40, 120), np.ones((3, 3), np.uint8), iterations=2)

    for mask in (bright, edges):
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:4]:
            ratio = cv2.contourArea(contour) / total
            if ratio < 0.30 or ratio > 0.95:
                continue
            hull = cv2.convexHull(contour)
            approx = cv2.approxPolyDP(hull, 0.02 * cv2.arcLength(hull, True), True)
            if len(approx) != 4:
                continue

            quad = approx.reshape(4, 2).astype(np.float32)
            # Kertas seharusnya tidak lebih gelap daripada latar di sekitarnya.
            fill = np.zeros(gray.shape, np.uint8)
            cv2.fillConvexPoly(fill, quad.astype(np.int32), 255)
            inside = gray[fill > 0]
            outside = gray[fill == 0]
            if outside.size and inside.mean() < outside.mean() - 10:
                continue
            return order_points(quad / scale)
    return None


def four_point_transform(img: np.ndarray, quad: np.ndarray) -> np.ndarray | None:
    tl, tr, br, bl = quad
    width = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    height = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    if width < 200 or height < 200:
        return None
    aspect = width / height
    if not 0.3 <= aspect <= 3.3:
        return None
    dst = np.array([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], dtype=np.float32)
    matrix = cv2.getPerspectiveTransform(quad.astype(np.float32), dst)
    return cv2.warpPerspective(img, matrix, (width, height), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


# ------------------------------------------------- 4. normalisasi pencahayaan
def normalize_illumination(gray: np.ndarray) -> np.ndarray:
    """Bagi gambar dengan estimasi latar (closing morfologi) -> kertas rata putih."""
    h, w = gray.shape
    scale = 0.25 if max(h, w) > 800 else 1.0
    small = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale < 1 else gray
    k = _odd(max(9, int(min(small.shape) * 0.06)))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    background = cv2.morphologyEx(small, cv2.MORPH_CLOSE, kernel)
    background = cv2.GaussianBlur(background, (0, 0), k / 3.0)
    background = cv2.resize(background, (w, h), interpolation=cv2.INTER_LINEAR)
    background = np.maximum(background, 1)
    return cv2.divide(gray, background, scale=255)


# ------------------------------------------------- 5. denoise + kontras
def enhance_contrast(gray: np.ndarray) -> np.ndarray:
    denoised = cv2.bilateralFilter(gray, 7, 40, 40)
    lo, hi = np.percentile(denoised, (1, 99))
    if hi - lo > 20:
        stretched = np.clip((denoised.astype(np.float32) - lo) * 255.0 / (hi - lo), 0, 255).astype(np.uint8)
    else:
        stretched = denoised
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    return clahe.apply(stretched)


# ----------------------------------------------------------- 6. deskew
def _adaptive_inverse(gray: np.ndarray, block: int, c: int) -> np.ndarray:
    return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block, c)


def estimate_skew_angle(gray: np.ndarray, max_angle: float = 15.0) -> float:
    """Sudut putar (derajat, berlawanan jarum jam) yang meluruskan baris teks.

    Memutar gambar biner dan memilih sudut yang membuat proyeksi horizontal
    paling "tajam" (varians terbesar): baris teks lurus -> puncak/lembah jelas.
    """
    h, w = gray.shape
    scale = min(1.0, 700.0 / max(h, w))
    small = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale < 1 else gray
    bw = _adaptive_inverse(small, _odd(max(15, small.shape[1] // 40)), 15)

    # Hanya komponen sebesar huruf yang dipakai. Garis panjang (tepi kertas,
    # bingkai gambar, garis tabel) membuang akurasi karena menciptakan puncak
    # proyeksi palsu pada sudut 0 atau pada sudut tepi kertas.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(bw, connectivity=8)
    sh, sw = bw.shape
    keep = np.zeros(count, dtype=bool)
    keep[1:] = (
        (stats[1:, cv2.CC_STAT_WIDTH] < 0.15 * sw)
        & (stats[1:, cv2.CC_STAT_HEIGHT] < 0.15 * sh)
        & (stats[1:, cv2.CC_STAT_AREA] >= 4)
    )
    bw = np.where(keep[labels], 255, 0).astype(np.uint8)
    if cv2.countNonZero(bw) < 50:
        return 0.0

    center = (bw.shape[1] / 2.0, bw.shape[0] / 2.0)
    size = (bw.shape[1], bw.shape[0])

    def score(angle: float) -> float:
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(bw, matrix, size, flags=cv2.INTER_NEAREST)
        return float(np.var(rotated.sum(axis=1, dtype=np.float64)))

    coarse = np.arange(-max_angle, max_angle + 0.01, 1.0)
    best = float(max(coarse, key=score))
    fine = np.arange(best - 1.0, best + 1.01, 0.1)
    return float(max(fine, key=score))


def rotate_bound(img: np.ndarray, angle: float, border: int = 255) -> np.ndarray:
    """Putar tanpa memotong sudut (kanvas diperluas)."""
    h, w = img.shape[:2]
    center = (w / 2.0, h / 2.0)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    cos, sin = abs(matrix[0, 0]), abs(matrix[0, 1])
    new_w = int(h * sin + w * cos)
    new_h = int(h * cos + w * sin)
    matrix[0, 2] += new_w / 2.0 - center[0]
    matrix[1, 2] += new_h / 2.0 - center[1]
    return cv2.warpAffine(
        img, matrix, (new_w, new_h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=border
    )


# --------------------------------------------------------- 7. binarisasi
def sauvola_threshold(gray: np.ndarray, window: int, k: float = 0.3, r: float = 128.0) -> np.ndarray:
    """Binarisasi Sauvola: T = mean * (1 + k * (std / R - 1)).

    Dibanding adaptive threshold biasa, area kertas kosong yang bernoise
    (std kecil) mendapat ambang lebih rendah sehingga tidak ikut menjadi
    bintik hitam, sementara huruf (std besar) tetap tertangkap.
    """
    g = gray.astype(np.float32)
    mean = cv2.boxFilter(g, -1, (window, window), normalize=True, borderType=cv2.BORDER_REPLICATE)
    sq_mean = cv2.boxFilter(g * g, -1, (window, window), normalize=True, borderType=cv2.BORDER_REPLICATE)
    std = np.sqrt(np.maximum(sq_mean - mean * mean, 0.0))
    threshold = mean * (1.0 + k * (std / r - 1.0))
    return np.where(g > threshold, 255, 0).astype(np.uint8)


def binarize(gray: np.ndarray) -> np.ndarray:
    """Teks hitam (0) di atas latar putih (255)."""
    h, w = gray.shape
    window = min(51, max(25, _odd(round(0.02 * max(h, w)))))
    bw = sauvola_threshold(gray, window)

    # Pengaman: bila terlalu banyak piksel hitam (derau/latar gelap), pakai Otsu global.
    if (bw == 0).mean() > 0.30:
        _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return despeckle(bw)


def despeckle(bw: np.ndarray) -> np.ndarray:
    """Hapus bintik hitam yang terlalu kecil untuk menjadi huruf."""
    h, w = bw.shape
    min_area = max(6, int(h * w * 3e-6))
    inverted = (bw == 0).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(inverted, connectivity=8)
    keep = np.zeros(count, dtype=bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= min_area
    cleaned = np.where(keep[labels], 0, 255).astype(np.uint8)
    return cleaned


# --------------------------------------------------------- 8. potong teks
def text_bounding_box(bw: np.ndarray) -> tuple[int, int, int, int] | None:
    """Kotak pembatas area teks, mengabaikan komponen besar yang menempel tepi
    (garis tepi kertas / bayangan meja)."""
    h, w = bw.shape
    inverted = (bw == 0).astype(np.uint8)
    count, _, stats, _ = cv2.connectedComponentsWithStats(inverted, connectivity=8)
    boxes = []
    for i in range(1, count):
        x, y, cw, ch, _area = stats[i]
        touches_edge = x <= 1 or y <= 1 or x + cw >= w - 1 or y + ch >= h - 1
        if touches_edge and (cw > 0.5 * w or ch > 0.5 * h):
            continue
        boxes.append((x, y, x + cw, y + ch))
    if not boxes:
        return None
    arr = np.array(boxes)
    return int(arr[:, 0].min()), int(arr[:, 1].min()), int(arr[:, 2].max()), int(arr[:, 3].max())


def crop_to_text(bw: np.ndarray, *others: np.ndarray) -> tuple[np.ndarray, ...] | None:
    h, w = bw.shape
    box = text_bounding_box(bw)
    if box is None:
        return None
    x0, y0, x1, y1 = box
    pad = int(0.025 * max(h, w))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    if (x1 - x0) * (y1 - y0) < 0.2 * h * w:  # terlalu kecil = kemungkinan salah deteksi
        return None
    return tuple(a[y0:y1, x0:x1] for a in (bw, *others))


# ------------------------------------------------------------ orkestrasi
def preprocess(img_bgr: np.ndarray) -> Preprocessed:
    steps: list[Step] = []
    info: dict = {}

    img = limit_size(img_bgr, config.WORKING_MAX_SIDE, config.WORKING_MIN_SIDE)
    info["working_size"] = [int(img.shape[1]), int(img.shape[0])]
    steps.append(
        Step("original", "Gambar asli", f"Ukuran kerja {img.shape[1]}x{img.shape[0]} px, agar huruf cukup besar untuk dibaca.", img.copy())
    )

    # --- 2. perspektif
    quad = find_document_quad(img)
    warped = four_point_transform(img, quad) if quad is not None else None
    info["perspective_applied"] = warped is not None
    if warped is not None:
        img = warped
        steps.append(
            Step("perspective", "Koreksi perspektif", "Tepi kertas terdeteksi lalu diluruskan menjadi tampak depan.", img.copy())
        )

    # --- 3. grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    steps.append(Step("gray", "Grayscale", "Warna dibuang; yang dipakai hanya tingkat terang-gelap.", gray.copy()))

    # --- 4. normalisasi pencahayaan
    flat = normalize_illumination(gray)
    steps.append(
        Step("illumination", "Normalisasi pencahayaan", "Bayangan dan terang-gelap tidak merata dihilangkan; kertas menjadi rata putih.", flat.copy())
    )

    # --- 5. denoise + kontras
    enhanced = enhance_contrast(flat)
    steps.append(
        Step("enhanced", "Pengurangan noise dan kontras", "Bilateral filter, peregangan histogram, dan CLAHE membuat tulisan lebih tegas.", enhanced.copy())
    )

    # --- 6. deskew
    angle = estimate_skew_angle(enhanced)
    info["skew_angle"] = round(angle, 2)
    if abs(angle) >= 0.4:
        enhanced = rotate_bound(enhanced, angle, 255)
        steps.append(
            Step("deskew", "Koreksi kemiringan", f"Baris teks diluruskan (dikoreksi {angle:+.1f} derajat).", enhanced.copy())
        )

    # --- 7. binarisasi
    binary = binarize(enhanced)
    steps.append(
        Step("binary", "Binarisasi", "Threshold Sauvola mengubah gambar menjadi hitam-putih, bintik kecil dibuang.", binary.copy())
    )

    # --- 8. potong area teks
    cropped = crop_to_text(binary, enhanced)
    info["crop_applied"] = cropped is not None
    if cropped is not None:
        binary, enhanced = cropped
        steps.append(Step("crop", "Pemotongan area teks", "Tepi kosong dan garis pinggir dibuang; hanya area tulisan yang dibaca.", binary.copy()))

    info["components"] = int(cv2.connectedComponents((binary == 0).astype(np.uint8), connectivity=8)[0] - 1)
    info["black_ratio"] = round(float((binary == 0).mean()), 4)
    return Preprocessed(gray=enhanced, binary=binary, steps=steps, info=info)
