"""TBCare AI service: pemindaian resep dengan OpenCV + Tesseract.

Endpoint
  GET  /health   status layanan, versi Tesseract, bahasa, dan dataset obat
  POST /scan     multipart/form-data: image=<file>, include_steps=1|0

Jalankan lokal : python app.py
Produksi       : gunicorn -w 2 -t 120 -b 0.0.0.0:$PORT app:app
"""
from __future__ import annotations

import hmac
import logging
import os

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge

from scanner import config
from scanner.ocr import OcrUnavailable, available_languages, pick_language, tesseract_version
from scanner.pipeline import ScanError, get_matcher, scan_image_bytes

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("tbcare-ai")


def _error(message: str, status: int, code: str):
    return jsonify({"success": False, "code": code, "message": message}), status


def create_app() -> Flask:
    app = Flask(__name__)
    # Sedikit lebih besar dari batas gambar agar overhead multipart tidak ikut terhitung.
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_IMAGE_BYTES + 512 * 1024

    @app.get("/health")
    def health():
        matcher = get_matcher()
        payload = {
            "service": "tbcare-ai",
            "dataset": {"version": matcher.version, "drugs": len(matcher.entries)},
            "requested_lang": config.TESSERACT_LANG,
        }
        try:
            payload.update(
                status="ok",
                tesseract=tesseract_version(),
                languages=sorted(available_languages()),
                lang_in_use=pick_language(),
            )
            return jsonify(payload)
        except OcrUnavailable as exc:
            payload.update(status="degraded", error=str(exc))
            return jsonify(payload), 503

    @app.post("/scan")
    def scan():
        if config.API_KEY:
            provided = request.headers.get("X-API-Key", "")
            if not hmac.compare_digest(provided, config.API_KEY):
                return _error("API key tidak valid.", 401, "unauthorized")

        upload = request.files.get("image")
        if upload is None:
            return _error("Kirim file gambar pada field 'image'.", 400, "missing_image")

        include_steps = request.form.get("include_steps", "1").lower() not in ("0", "false", "no")
        result = scan_image_bytes(upload.read(), include_steps=include_steps)
        log.info(
            "scan selesai: %s obat, OCR %.0f%%, %d ms, varian=%s",
            result["summary"]["detected"],
            result["ocr"]["mean_confidence"],
            result["timing_ms"]["total"],
            result["engine"]["variant"],
        )
        return jsonify(result)

    @app.errorhandler(ScanError)
    def handle_scan_error(exc: ScanError):
        log.warning("scan ditolak (%s): %s", exc.code, exc.message)
        return _error(exc.message, exc.status, exc.code)

    @app.errorhandler(RequestEntityTooLarge)
    def handle_too_large(_exc):
        return _error(f"Ukuran gambar melebihi {config.MAX_IMAGE_MB} MB.", 413, "file_too_large")

    @app.errorhandler(Exception)
    def handle_unexpected(exc: Exception):
        if isinstance(exc, HTTPException):  # 404, 405, dll. dijawab apa adanya, bukan "kesalahan tak terduga"
            return _error(exc.description or exc.name, exc.code or 500, "http_error")
        log.exception("kesalahan tak terduga saat scan")
        return _error("Terjadi kesalahan saat memproses gambar.", 500, "internal_error")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
