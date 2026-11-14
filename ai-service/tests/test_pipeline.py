"""Tes integrasi: image processing OpenCV + Tesseract asli pada gambar sintetis.

Dilewati otomatis bila Tesseract belum terpasang.
"""
import unittest

import cv2
import numpy as np

from scanner import preprocess as P
from scanner.ocr import OcrUnavailable, pick_language
from scanner.pipeline import ScanError, scan_image_bytes
from tests.make_sample import photoize, render_page


def _tesseract_ready() -> bool:
    try:
        pick_language()
        return True
    except OcrUnavailable:
        return False


def encode(img, quality=88) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    assert ok
    return buf.tobytes()


# nama -> (dosis, kali per hari) sesuai isi make_sample.DEFAULT_LINES
EXPECTED = {
    "Rifampisin": ("450 mg", 1),
    "Isoniazid": ("300 mg", 1),
    "Pirazinamid": ("500 mg", 3),
    "Etambutol": ("500 mg", 2),
    "Vitamin B6": ("10 mg", 1),
}


def count_correct(result) -> int:
    meds = {m["med_name"]: m for m in result["medications"]}
    return sum(
        1
        for name, (dose, freq) in EXPECTED.items()
        if name in meds and meds[name]["dosage"] == dose and meds[name]["frequency"] == freq
    )


@unittest.skipUnless(_tesseract_ready(), "Tesseract belum terpasang")
class PipelineTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = render_page()

    def photo(self, difficulty):
        return encode(photoize(self.page, seed=7, difficulty=difficulty))

    # ---------------------------------------------------------- akurasi
    def test_easy_photo(self):
        result = scan_image_bytes(self.photo("easy"), include_steps=False)
        self.assertGreaterEqual(count_correct(result), 4)

    def test_medium_photo_tilted_shadowed(self):
        result = scan_image_bytes(self.photo("medium"), include_steps=False)
        self.assertGreaterEqual(count_correct(result), 4)
        self.assertTrue(result["image"]["perspective_applied"])
        self.assertEqual(result["engine"]["ocr"], "tesseract")

    def test_hard_photo(self):
        result = scan_image_bytes(self.photo("hard"), include_steps=False)
        self.assertGreaterEqual(count_correct(result), 3)
        self.assertEqual(result["summary"]["matched"], 5)  # nama obat tetap terbaca semua

    def test_stock_from_roman_numerals(self):
        result = scan_image_bytes(self.photo("medium"), include_steps=False)
        stock = {m["med_name"]: m["stock"] for m in result["medications"]}
        self.assertEqual(stock.get("Pirazinamid"), 90)  # No. XC
        self.assertEqual(stock.get("Etambutol"), 60)  # No. LX

    # --------------------------------------------------------- tahapan
    def test_steps_are_returned_as_images(self):
        result = scan_image_bytes(self.photo("medium"), include_steps=True)
        keys = [s["key"] for s in result["steps"]]
        for required in ("original", "gray", "illumination", "enhanced", "binary", "ocr"):
            self.assertIn(required, keys)
        for step in result["steps"]:
            self.assertTrue(step["image"].startswith("data:image/jpeg;base64,"))
            self.assertTrue(step["title"] and step["description"])

    def test_steps_can_be_omitted(self):
        result = scan_image_bytes(self.photo("easy"), include_steps=False)
        self.assertEqual(result["steps"], [])

    # ---------------------------------------------------------- deskew
    def test_deskew_estimates_angle(self):
        for angle in (-10, -5, -2, 3, 6, 12):
            with self.subTest(angle=angle):
                rotated = P.rotate_bound(self.page, float(angle), 255)
                rotated = cv2.copyMakeBorder(rotated, 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=(255, 255, 255))
                img = P.limit_size(rotated, 2000, 1500)
                enhanced = P.enhance_contrast(P.normalize_illumination(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)))
                self.assertAlmostEqual(P.estimate_skew_angle(enhanced), -angle, delta=0.6)

    def test_scan_of_rotated_page_without_background(self):
        rotated = P.rotate_bound(self.page, 6.0, 255)
        rotated = cv2.copyMakeBorder(rotated, 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=(255, 255, 255))
        result = scan_image_bytes(encode(rotated), include_steps=False)
        self.assertGreaterEqual(count_correct(result), 4)

    def test_page_rotated_90_degrees_is_recovered(self):
        for code in (cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE):
            with self.subTest(code=code):
                result = scan_image_bytes(encode(cv2.rotate(self.page, code)), include_steps=False)
                self.assertGreaterEqual(result["summary"]["matched"], 3)

    def test_high_resolution_photo(self):
        big = cv2.resize(self.page, (3000, 4000), interpolation=cv2.INTER_CUBIC)
        result = scan_image_bytes(encode(big, 90), include_steps=False)
        self.assertGreaterEqual(count_correct(result), 4)
        self.assertLess(result["timing_ms"]["total"], 15000)

    # ------------------------------------------------------ kasus buruk
    def test_blank_page_returns_no_medications(self):
        result = scan_image_bytes(encode(np.full((1200, 900, 3), 255, np.uint8)), include_steps=False)
        self.assertEqual(result["medications"], [])
        self.assertTrue(result["warnings"])

    def test_noise_is_rejected_quickly(self):
        noise = np.random.default_rng(1).integers(0, 255, (1200, 900, 3), dtype=np.uint8)
        with self.assertRaises(ScanError) as ctx:
            scan_image_bytes(encode(noise), include_steps=False)
        self.assertEqual(ctx.exception.code, "not_a_document")
        self.assertEqual(ctx.exception.status, 422)

    def test_invalid_inputs(self):
        cases = {
            b"": "empty_file",
            b"ini bukan gambar": "invalid_image",
            encode(np.full((100, 100, 3), 255, np.uint8)): "image_too_small",
        }
        for data, code in cases.items():
            with self.subTest(code=code):
                with self.assertRaises(ScanError) as ctx:
                    scan_image_bytes(data)
                self.assertEqual(ctx.exception.code, code)

    def test_oversized_file_is_rejected(self):
        with self.assertRaises(ScanError) as ctx:
            scan_image_bytes(b"\xff" * (9 * 1024 * 1024))
        self.assertEqual(ctx.exception.code, "file_too_large")


if __name__ == "__main__":
    unittest.main()
