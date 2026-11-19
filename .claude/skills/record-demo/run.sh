#!/usr/bin/env bash
# Records a demo video and saves it as MP4. All arguments go to record.mjs, plus:
#   --mp4 <path>   where the MP4 goes (default: ~/melody-jump-demo.mp4)
# Example: run.sh --level folk-2 --lang en --mp4 /mnt/c/Users/devri/Videos/melody-jump-ode.mp4
set -euo pipefail
source ~/.nvm/nvm.sh

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(cd "$SKILL_DIR/../../.." && pwd)"
TOOLS="${MELODY_VIDEO_TOOLS:-$HOME/.cache/melody-jump-video}"
export LD_LIBRARY_PATH="$TOOLS/libs/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

[ -d "$TOOLS/node_modules/playwright" ] || bash "$SKILL_DIR/setup.sh"

# Split off --mp4, pass everything else on
MP4="$HOME/melody-jump-demo.mp4"
ARGS=()
while [ $# -gt 0 ]; do
  if [ "$1" = "--mp4" ]; then MP4="$2"; shift 2; else ARGS+=("$1"); shift; fi
done

# The bot needs the dev server (the hook window.__melodyJump exists only there)
SERVER_PID=""
if ! curl -s -o /dev/null http://localhost:5173/; then
  echo "starting dev server …"
  # Own process group, so the whole server can be stopped afterwards
  setsid bash -c "cd '$PROJECT' && exec npx vite --port 5173 --strictPort" >/tmp/melody-jump-vite.log 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://localhost:5173/ && break; sleep 1; done
fi

WEBM="$(mktemp --suffix=.webm)"
node "$SKILL_DIR/record.mjs" --out "$WEBM" "${ARGS[@]}"

ffmpeg -v error -y -i "$WEBM" -vf fps=30 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$MP4"
rm -f "$WEBM"
[ -n "$SERVER_PID" ] && kill -- "-$SERVER_PID" 2>/dev/null || true
ffprobe -v error -show_entries format=duration,size -of compact "$MP4"
echo "video: $MP4"
