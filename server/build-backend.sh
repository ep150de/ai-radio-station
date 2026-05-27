#!/bin/bash
# Build the Python backend as a standalone executable using PyInstaller

set -e

echo "Building AI Radio Station backend executable..."

# Install PyInstaller if not present
pip install pyinstaller --quiet

# Clean previous builds
rm -rf build dist

# Build using the spec file
pyinstaller ai-radio-backend.spec --clean --noconfirm

echo "Build complete. Executable is in dist/ai-radio-backend"

# On macOS/Linux you may want to make it executable
chmod +x dist/ai-radio-backend 2>/dev/null || true

echo "Done."