import io
import unittest
from unittest import mock

import cv2

from app import create_app
from scanner import config
from scanner.ocr import OcrUnavailable, pick_language
from tests.make_sample import photoize, render_page


def _tesseract_ready() -> bool:
    try:
        pick_language()
        return True
    except OcrUnavailable:
        return False


def sample_jpeg() -> bytes:
    ok, buf = cv2.imencode(".jpg", photoize(render_page(), seed=7, difficulty="medium"))
    assert ok
    return buf.tobytes()


@unittest.skipUnless(_tesseract_ready(), "Tesseract belum terpasang")
class AppTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = create_app().test_client()
        cls.jpeg = sample_jpeg()

    def post_scan(self, data=None, headers=None, **form):
        body = {"image": (io.BytesIO(data if data is not None else self.jpeg), "resep.jpg"), **form}
        return self.client.post("/scan", data=body, content_type="multipart/form-data", headers=headers or {})

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["status"], "ok")
        self.assertGreaterEqual(body["dataset"]["drugs"], 7)
        self.assertIn("tesseract", body)

    def test_scan_success(self):
        response = self.post_scan()
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertGreaterEqual(body["summary"]["matched"], 4)
        self.assertTrue(body["steps"])
        self.assertIn("Rifampisin", body["drug_names"])
        medication = body["medications"][0]
        for field in ("med_name", "dosage", "frequency", "duration_days", "stock", "consumption_schedule", "needs_review"):
            self.assertIn(field, medication)

    def test_scan_without_steps(self):
        body = self.post_scan(include_steps="0").get_json()
        self.assertEqual(body["steps"], [])

    def test_missing_image(self):
        response = self.client.post("/scan", data={}, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "missing_image")

    def test_invalid_image(self):
        response = self.post_scan(data=b"bukan gambar")
        self.assertEqual(response.status_code, 400)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["code"], "invalid_image")

    def test_api_key_is_enforced_when_configured(self):
        with mock.patch.object(config, "API_KEY", "rahasia"):
            self.assertEqual(self.post_scan().status_code, 401)
            self.assertEqual(self.post_scan(headers={"X-API-Key": "salah"}).status_code, 401)
            self.assertEqual(self.post_scan(headers={"X-API-Key": "rahasia"}).status_code, 200)

    def test_health_does_not_require_api_key(self):
        with mock.patch.object(config, "API_KEY", "rahasia"):
            self.assertEqual(self.client.get("/health").status_code, 200)


if __name__ == "__main__":
    unittest.main()
