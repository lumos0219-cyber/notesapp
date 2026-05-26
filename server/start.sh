#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Klog OCR server..."
./venv/bin/python ocr_server.py
