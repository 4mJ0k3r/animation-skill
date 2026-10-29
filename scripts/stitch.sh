#!/usr/bin/env bash
set -euo pipefail

# scripts/stitch.sh — stitch captured PNG frames to MP4 and/or GIF
# Usage:
#   bash scripts/stitch.sh [frames_dir] [out_dir] [fps] [format: mp4|gif|both]
# Default:
#   bash scripts/stitch.sh out/frames out 30 both

FRAMES_DIR="${1:-out/frames}"
OUT_DIR="${2:-out}"
FPS="${3:-30}"
FORMAT="${4:-both}"

mkdir -p "$OUT_DIR"

if [ ! -f "$FRAMES_DIR/frame-0000.png" ]; then
  echo "Error: no frames found in $FRAMES_DIR (expected frame-0000.png)" >&2
  exit 1
fi

# Detect frame dimensions to pick scale filter
DIM=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$FRAMES_DIR/frame-0000.png" 2>/dev/null || echo "1920x1080")
WIDTH=$(echo "$DIM" | cut -d'x' -f1)
HEIGHT=$(echo "$DIM" | cut -d'x' -f2)

if [ "$WIDTH" -eq "$HEIGHT" ]; then
  SCALE_VF="scale=1080:1080:flags=lanczos"
elif [ "$WIDTH" -lt "$HEIGHT" ]; then
  SCALE_VF="scale=1080:1920:flags=lanczos"
else
  SCALE_VF="scale=1920:1080:flags=lanczos"
fi

if [ "$FORMAT" = "mp4" ] || [ "$FORMAT" = "both" ]; then
  echo "Stitching MP4 @ ${FPS}fps ($SCALE_VF)..."
  ffmpeg -y -framerate "$FPS" -i "$FRAMES_DIR/frame-%04d.png" \
    -vf "$SCALE_VF" \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -movflags +faststart "$OUT_DIR/animation.mp4"
  echo "Wrote $OUT_DIR/animation.mp4"
fi

if [ "$FORMAT" = "gif" ] || [ "$FORMAT" = "both" ]; then
  echo "Stitching GIF (two-pass palette)..."
  ffmpeg -y -framerate "$FPS" -i "$FRAMES_DIR/frame-%04d.png" \
    -vf "fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=196:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg" \
    -loop 0 "$OUT_DIR/animation.gif"
  echo "Wrote $OUT_DIR/animation.gif"
fi
