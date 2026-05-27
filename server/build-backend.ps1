# Build script for Windows
Write-Host "Building AI Radio Station backend executable (Windows)..."

pip install pyinstaller --quiet

if (Test-Path build) { Remove-Item -Recurse -Force build }
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

pyinstaller ai-radio-backend.spec --clean --noconfirm

Write-Host "Build complete. Check dist/ai-radio-backend.exe"