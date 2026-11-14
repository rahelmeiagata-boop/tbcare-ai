# Layanan scan resep (OpenCV + Tesseract). Cocok untuk Render / Railway / Hugging Face Spaces (Docker).
FROM python:3.12-slim

# Tesseract + data bahasa Indonesia & Inggris
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV PORT=8000 HOST=0.0.0.0
EXPOSE 8000
CMD ["sh", "-c", "gunicorn -w 2 -t 120 -b 0.0.0.0:${PORT} app:app"]
