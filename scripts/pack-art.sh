#!/bin/bash
# 把 images/art-<主题>-<id>.png 压缩成 JPEG，输出到 src/static/h5/art/<主题>/<id>.jpg
# H5 直接打包这些文件；小程序把 src/static/h5/art 整个目录上传 CDN（见 src/game/themes.js）
set -eu
cd "$(dirname "$0")/.."
OUT=src/static/h5/art
for f in images/art-*.png; do
  name=$(basename "$f" .png)
  rest=${name#art-}
  theme=${rest%%-*}
  id=${rest#*-}
  case "$id" in
    map) size=1536 ;;
    title) size=1280 ;;
    room) size=900 ;;
    *) size=320 ;;
  esac
  mkdir -p "$OUT/$theme"
  sips -Z "$size" -s format jpeg -s formatOptions 72 "$f" --out "$OUT/$theme/$id.jpg" >/dev/null
done
du -sh "$OUT"/* 2>/dev/null
ls "$OUT"/*/ | wc -l
