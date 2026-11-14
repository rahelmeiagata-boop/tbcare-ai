"""Membuat gambar resep sintetis (cetak) yang dibuat menyerupai foto dari HP.

Dipakai untuk pengujian otomatis dan demo, tanpa perlu data pasien asli.

    python -m tests.make_sample samples/resep_contoh.jpg
    python -m tests.make_sample samples/resep_sulit.jpg --difficulty hard
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DEFAULT_LINES = [
    ("dr. Andi Pratama, Sp.P", 0),
    ("SIP 123/456/2026", 0),
    ("Praktik: Jl. Merdeka No. 12, Medan", 0),
    ("", 0),
    ("Medan, 12 November 2026", 0),
    ("", 0),
    ("R/ Rifampisin 450 mg      No. XXX", 0),
    ("S 1 dd 1 ac", 1),
    ("R/ Isoniazid 300 mg       No. XXX", 0),
    ("S 1 dd 1 ac", 1),
    ("R/ Pirazinamid 500 mg     No. XC", 0),
    ("S 3 dd 1 pc", 1),
    ("R/ Etambutol 500 mg       No. LX", 0),
    ("S 2 dd 1 pc", 1),
    ("R/ Vitamin B6 10 mg       No. XXX", 0),
    ("S 1 dd 1 pc", 1),
    ("", 0),
    ("Pro: Budi Santoso (35 th)", 0),
]

_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in _FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def render_page(lines=DEFAULT_LINES, size=(1240, 1754), font_size=40) -> np.ndarray:
    """Halaman resep bersih (BGR)."""
    page = Image.new("RGB", size, (248, 247, 243))
    draw = ImageDraw.Draw(page)
    font = _font(font_size)
    y = 120
    for text, indent in lines:
        draw.text((110 + indent * 70, y), text, fill=(25, 25, 30), font=font)
        y += int(font_size * 1.75)
    draw.line([(110, 330), (size[0] - 110, 330)], fill=(60, 60, 60), width=2)
    return cv2.cvtColor(np.array(page), cv2.COLOR_RGB2BGR)


def photoize(page: np.ndarray, *, seed: int = 7, difficulty: str = "medium") -> np.ndarray:
    """Buat halaman tampak difoto: miring, perspektif, bayangan, noise, JPEG."""
    rng = np.random.default_rng(seed)
    cfg = {
        "easy": dict(rot=1.0, persp=0.01, shade=0.15, blur=0.6, noise=3, jpeg=88),
        "medium": dict(rot=4.0, persp=0.04, shade=0.40, blur=1.0, noise=6, jpeg=72),
        "hard": dict(rot=7.0, persp=0.07, shade=0.55, blur=1.5, noise=10, jpeg=55),
    }[difficulty]

    ph, pw = page.shape[:2]
    canvas_w, canvas_h = int(pw * 1.25), int(ph * 1.18)

    # latar meja: abu kecoklatan bertekstur
    bg = np.full((canvas_h, canvas_w, 3), (70, 85, 95), np.uint8)
    texture = rng.normal(0, 8, (canvas_h, canvas_w, 1)).astype(np.float32)
    bg = np.clip(bg.astype(np.float32) + texture, 0, 255).astype(np.uint8)

    # posisi kertas + rotasi + distorsi perspektif acak
    cx, cy = canvas_w / 2, canvas_h / 2
    src = np.float32([[0, 0], [pw, 0], [pw, ph], [0, ph]])
    angle = np.deg2rad(cfg["rot"])
    rot = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    centered = src - [pw / 2, ph / 2]
    dst = (centered @ rot.T) + [cx, cy]
    dst += rng.uniform(-cfg["persp"], cfg["persp"], dst.shape) * [pw, ph]
    matrix = cv2.getPerspectiveTransform(src, dst.astype(np.float32))

    warped = cv2.warpPerspective(page, matrix, (canvas_w, canvas_h), flags=cv2.INTER_LINEAR)
    mask = cv2.warpPerspective(np.full((ph, pw), 255, np.uint8), matrix, (canvas_w, canvas_h))
    mask3 = (cv2.GaussianBlur(mask, (5, 5), 0).astype(np.float32) / 255.0)[..., None]
    shadow = cv2.GaussianBlur(mask, (0, 0), 25).astype(np.float32) / 255.0
    bg = (bg.astype(np.float32) * (0.75 + 0.25 * (1 - shadow[..., None]))).astype(np.uint8)  # bayangan tepi kertas
    photo = (bg.astype(np.float32) * (1 - mask3) + warped.astype(np.float32) * mask3)

    # pencahayaan tidak merata: gradien + bayangan diagonal lembut
    yy, xx = np.mgrid[0:canvas_h, 0:canvas_w].astype(np.float32)
    gradient = 1.0 - cfg["shade"] * (xx / canvas_w * 0.8 + yy / canvas_h * 0.4)
    diagonal = 1.0 - 0.25 * cfg["shade"] * np.clip(np.sin((xx + yy) / 380.0), 0, 1)
    photo *= (gradient * diagonal)[..., None]

    photo = cv2.GaussianBlur(photo, (0, 0), cfg["blur"])
    photo += rng.normal(0, cfg["noise"], photo.shape)
    photo = np.clip(photo, 0, 255).astype(np.uint8)

    ok, enc = cv2.imencode(".jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, cfg["jpeg"]])
    assert ok
    return cv2.imdecode(enc, cv2.IMREAD_COLOR)


def generate(path: str | Path, *, seed: int = 7, difficulty: str = "medium") -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    photo = photoize(render_page(), seed=seed, difficulty=difficulty)
    cv2.imwrite(str(path), photo, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output")
    parser.add_argument("--difficulty", choices=["easy", "medium", "hard"], default="medium")
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    print(generate(args.output, seed=args.seed, difficulty=args.difficulty))
