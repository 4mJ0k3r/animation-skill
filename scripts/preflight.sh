#!/usr/bin/env bash
# scripts/preflight.sh — check environment prerequisites and print fixes

set -u

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  local fix="$3"

  printf "Checking %-22s ... " "$name"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "OK"
    PASS=$((PASS + 1))
  else
    echo "MISSING"
    echo "  -> Fix: $fix"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Animation Skill Preflight Check ==="

# 1. Node.js
check "Node.js (>= 18)" \
  "node -e 'const v = parseInt(process.versions.node); if (v < 18) process.exit(1);'" \
  "Install Node.js v18+ from https://nodejs.org/"

# 2. ffmpeg
check "ffmpeg" \
  "ffmpeg -version" \
  "Install ffmpeg and add it to your PATH (e.g. choco install ffmpeg / brew install ffmpeg / apt install ffmpeg)"

# 3. ffprobe
check "ffprobe" \
  "ffprobe -version" \
  "ffprobe comes bundled with ffmpeg; ensure the ffmpeg bin folder is in PATH"

# 4. Python 3
check "Python 3" \
  "python3 --version || python --version" \
  "Install Python 3 from https://python.org/"

# 5. Pillow (PIL)
check "Python Pillow (PIL)" \
  "python3 -c 'from PIL import Image' || python -c 'from PIL import Image'" \
  "Run: pip install pillow"

# 6. Playwright Chromium
check "Playwright Chromium" \
  "node -e 'import(\"playwright\").then(p => p.chromium.launch({ headless: true })).then(b => b.close())'" \
  "Run: npx playwright install chromium"

echo "----------------------------------------"
if [ "$FAIL" -eq 0 ]; then
  echo "All prerequisites satisfied! ($PASS/$PASS passed)"
  exit 0
else
  echo "Preflight failed: $FAIL issue(s) detected ($PASS passed)."
  exit 1
fi
