#!/usr/bin/env python3
"""
contact_sheet.py — assemble sampled frames into an NxM contact sheet.

Usage:
  python scripts/contact_sheet.py <frames_dir> [grid] [out_file]
Example:
  python scripts/contact_sheet.py out/frames 8x8 out/contact.jpg
"""

import sys
import os
import glob
import re
from PIL import Image, ImageDraw, ImageFont

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/contact_sheet.py <frames_dir> [grid: 8x8] [out_file: contact.jpg]")
        sys.exit(1)

    frames_dir = sys.argv[1]
    grid_str = sys.argv[2] if len(sys.argv) > 2 else "8x8"
    out_file = sys.argv[3] if len(sys.argv) > 3 else os.path.join(frames_dir, "..", "contact.jpg")

    m = re.match(r"^(\d+)[xX](\d+)$", grid_str)
    if m:
        cols, rows = int(m.group(1)), int(m.group(2))
    else:
        cols, rows = 8, 8

    # Gather frames
    pattern = os.path.join(frames_dir, "frame-*.png")
    frames = sorted(glob.glob(pattern), key=natural_sort_key)
    if not frames:
        # Fallback to any png
        frames = sorted(glob.glob(os.path.join(frames_dir, "*.png")), key=natural_sort_key)

    if not frames:
        print(f"Error: no frames found in {frames_dir}", file=sys.stderr)
        sys.exit(2)

    total_frames = len(frames)
    total_cells = cols * rows

    # Sample total_cells frames across [0, total_frames - 1]
    if total_frames <= total_cells:
        sample_indices = list(range(total_frames))
        # If fewer frames than grid, adjust rows if possible
        if total_frames < cols:
            cols = total_frames
            rows = 1
        else:
            rows = (total_frames + cols - 1) // cols
        total_cells = cols * rows
    else:
        sample_indices = [
            round(i * (total_frames - 1) / max(1, total_cells - 1))
            for i in range(total_cells)
        ]

    # Open first frame to get aspect ratio
    with Image.open(frames[0]) as first:
        fw, fh = first.size

    # Thumb size: ~240px wide cell
    tw = 240
    th = int(tw * (fh / fw))
    margin = 4
    header_h = 16

    cell_w = tw
    cell_h = th + header_h

    sheet_w = cols * cell_w + (cols + 1) * margin
    sheet_h = rows * cell_h + (rows + 1) * margin

    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(240, 238, 233))
    draw = ImageDraw.Draw(sheet)

    for i, idx in enumerate(sample_indices):
        c = i % cols
        r = i // cols
        x = margin + c * (cell_w + margin)
        y = margin + r * (cell_h + margin)

        if idx < len(frames):
            frame_path = frames[idx]
            frame_name = os.path.basename(frame_path)
            # Extract number from frame-0004.png
            fn_match = re.search(r"\d+", frame_name)
            fnum_str = f"f:{int(fn_match.group(0))}" if fn_match else frame_name

            with Image.open(frame_path) as im:
                thumb = im.resize((tw, th), Image.Resampling.LANCZOS)
                sheet.paste(thumb, (x, y + header_h))

            # Header text
            draw.text((x + 4, y + 2), fnum_str, fill=(80, 80, 80))
            # Border around thumb
            draw.rectangle([x, y + header_h, x + tw - 1, y + header_h + th - 1], outline=(200, 195, 185))

    out_dir = os.path.dirname(out_file)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    fmt = "JPEG" if out_file.lower().endswith((".jpg", ".jpeg")) else "PNG"
    sheet.save(out_file, fmt, quality=90)
    print(f"Wrote contact sheet: {out_file} ({cols}x{rows} grid, {sheet_w}x{sheet_h}px)")

if __name__ == "__main__":
    main()
