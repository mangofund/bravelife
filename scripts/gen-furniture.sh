#!/bin/bash
# 生成等轴视角家具插画（品红底，之后用 scripts/pack-furniture.py 抠图）：bash scripts/gen-furniture.sh
# 已存在的图片会跳过
set -u
cd "$(dirname "$0")/.."
GEN=/Users/pro/.comate/skills/.system/create-image/scripts/generate-image.sh

style() {
  case "$1" in
    watercolor) echo "soft watercolor picture-book style with gentle thin pencil outlines and pastel muted colors" ;;
    crayon) echo "wax crayon and colored pencil picture-book style with bold saturated colors and thick wobbly hand-drawn outlines" ;;
    wafu) echo "Japanese light-color picture-book style with thin sumi ink outlines and flat soft washes in indigo, vermilion, matcha green and ochre" ;;
  esac
}

ASSET="isometric game asset in 2:1 isometric projection (true 30 degree angle), seen from the front corner, the object stands on an invisible diamond floor tile whose edges run diagonally down-left and down-right, a single object centered and filling about 80 percent of the frame, placed on a perfectly flat solid pure magenta #FF00FF background, no floor, no cast shadow on the background, no text, no people"

ITEMS=$(cat <<'EOF'
futon|a folded Japanese futon mattress laid flat with a pillow and a blanket
bed|a simple wooden single bed with white sheets and a pillow
kingbed|a luxurious large double bed with a padded headboard, plump pillows and a soft quilt
stove|a small portable gas cooking stove with a pot on top, sitting on a low wooden stand
kitchen|a compact kitchen counter unit with a sink, stovetop and cupboards
fridge|a tall two-door refrigerator
desk|a wooden study desk with a chair, books and a desk lamp
pc|a computer desk with a monitor, keyboard and an office chair
tv|a flat television on a low wooden TV cabinet
console|a low table with a video game console and two controllers
sofa|a cozy two-seat fabric sofa with cushions
treadmill|a home treadmill exercise machine
piano|an upright piano with a small bench
plant|a large leafy potted house plant
lamp|a tall floor lamp with a fabric shade
rug|a round woven floor rug lying flat
aquarium|a fish tank aquarium on a wooden cabinet with small colorful fish
art|a framed landscape painting standing on a wooden easel
robovac|a round robot vacuum cleaner on the floor
cat|a cat tree tower with a sleeping orange cat on top
EOF
)

jobs=()
for theme in watercolor crayon wafu; do
  while IFS='|' read -r id desc; do
    [ -z "$id" ] && continue
    out="furn-$theme-$id.png"
    [ -f "images/$out" ] && continue
    jobs+=("$out|$(style "$theme"). $desc, $ASSET.")
  done <<< "$ITEMS"
done

echo "to generate: ${#jobs[@]}"
LANES=6
gen_one() {
  local line="$1" out prompt
  out="${line%%|*}"; prompt="${line#*|}"
  for try in 1 2; do
    if bash "$GEN" -p "$prompt" -o "$out" -a 1:1 -r 1K >/dev/null 2>"/tmp/gen-$out.err"; then
      echo "ok $out"
      return 0
    fi
  done
  echo "FAIL $out: $(tail -1 "/tmp/gen-$out.err")"
}
for ((lane = 0; lane < LANES; lane++)); do
  (
    for ((i = lane; i < ${#jobs[@]}; i += LANES)); do
      gen_one "${jobs[$i]}"
    done
  ) &
done
wait
exit 0
