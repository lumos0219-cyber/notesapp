"""
NoteSnap Local OCR Server
Listens on http://localhost:8765 and provides OCR via PaddleOCR.
Start with: python3 ocr_server.py
"""

import sys
import io
import base64
import traceback

import numpy as np
import cv2

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("Missing dependencies. Run: pip3 install -r requirements.txt")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# Lazy-load PaddleOCR (downloads models on first run, ~200MB)
_ocr = None


def get_ocr():
    global _ocr
    if _ocr is None:
        try:
            from paddleocr import PaddleOCR
        except ImportError:
            raise RuntimeError(
                "PaddleOCR not installed. Run: pip3 install paddleocr paddlepaddle"
            )
        print("Loading PaddleOCR models (first run downloads ~200MB)...")
        _ocr = PaddleOCR(
            lang="ch",
            use_textline_orientation=True,
            text_detection_model_name="PP-OCRv5_mobile_det",
            text_recognition_model_name="PP-OCRv5_mobile_rec",
        )
        print("PaddleOCR ready.")
    return _ocr


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/ocr", methods=["POST"])
def ocr_endpoint():
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "Missing 'image' field (base64 string)"}), 400

    raw = data["image"]
    # Strip data URL prefix if present
    if "," in raw and raw.startswith("data:"):
        raw = raw.split(",", 1)[1]

    try:
        # Clean up base64 string
        raw = raw.strip().replace('\n', '').replace('\r', '').replace(' ', '')
        img_bytes = base64.b64decode(raw)

        print(f"Image bytes: {len(img_bytes)}, header: {img_bytes[:10].hex()}", flush=True)

        # Use OpenCV to decode (supports JPEG, PNG, WebP, BMP, TIFF, etc.)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_array is None:
            raise Exception(
                "Unable to decode image. Supported formats: JPEG, PNG, WebP, BMP. "
                "If using iPhone photos (HEIC), please convert to JPEG first."
            )

        # OpenCV loads as BGR, convert to RGB
        img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        print(f"Image loaded: {img_array.shape}", flush=True)

        ocr = get_ocr()
        result = list(ocr.predict(img_array))

        # PaddleOCR 3.x: result is list[OCRResult dict]
        # Each dict has 'rec_texts' (list[str])
        lines = []
        for page in result:
            if isinstance(page, dict):
                lines.extend(page.get("rec_texts", []))
            elif hasattr(page, "rec_texts"):
                lines.extend(page.rec_texts)

        text = "\n".join(lines)
        print(f"OCR: {len(lines)} text lines recognized")
        return jsonify({"text": text})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting NoteSnap OCR server on http://localhost:8765 ...")
    print("Pre-loading PaddleOCR models (first run downloads ~50MB)...")
    get_ocr()  # Pre-load so first request is fast
    app.run(host="127.0.0.1", port=8765, debug=False, threaded=True)
