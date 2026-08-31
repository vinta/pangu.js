#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <text> <output.png>" >&2
  exit 64
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick 7 is required. Install it with: brew install imagemagick" >&2
  exit 127
fi

font='/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'
if [ ! -f "$font" ]; then
  echo "Error: Required font not found at $font. Run this script on macOS with Hiragino Sans W3 installed." >&2
  exit 1
fi

magick -size 1280x800 xc:black -alpha on -font "$font" -pointsize 451 -kerning 8 -fill white -gravity center -annotate +1+26 "$1" -units PixelsPerCentimeter -density 28.35 -define png:color-type=6 "$2"
