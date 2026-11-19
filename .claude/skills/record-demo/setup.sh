#!/usr/bin/env bash
# One-time setup (inside WSL, no root needed): Playwright + Chromium, the system libraries
# Chromium misses on this Ubuntu, and an emoji font. Safe to run again.
set -euo pipefail
source ~/.nvm/nvm.sh

TOOLS="${MELODY_VIDEO_TOOLS:-$HOME/.cache/melody-jump-video}"
mkdir -p "$TOOLS/debs" "$TOOLS/libs"
cd "$TOOLS"

if [ ! -d node_modules/playwright ]; then
  [ -f package.json ] || npm init -y >/dev/null
  npm i -D playwright@1 >/dev/null
fi
# The full Chromium (the slim headless shell cannot decode the MP3 samples)
npx playwright install chromium >/dev/null

# Libraries Chromium needs but Ubuntu 22.04 in WSL lacks; unpacked locally instead of installed (no sudo)
cd "$TOOLS/debs"
for pkg in libnss3 libnspr4 libxcomposite1 libxdamage1 libxrandr2 fonts-noto-color-emoji; do
  ls "${pkg}"_*.deb >/dev/null 2>&1 || apt-get download "$pkg" >/dev/null
done
for f in *.deb; do dpkg-deb -x "$f" "$TOOLS/libs"; done

# Emoji font for the user only (the HUD uses emoji such as ⏸ and 💬)
mkdir -p ~/.local/share/fonts
cp "$TOOLS"/libs/usr/share/fonts/truetype/noto/*.ttf ~/.local/share/fonts/
fc-cache -f ~/.local/share/fonts >/dev/null 2>&1 || true

command -v ffmpeg >/dev/null || echo "WARNING: ffmpeg is missing (needed to turn the recording into an MP4)"
echo "setup done: $TOOLS"
