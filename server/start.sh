#!/bin/bash
cd "$(dirname "$0")"
echo "Starting NoteSnap OCR server..."
./venv/bin/python ocr_server.py
