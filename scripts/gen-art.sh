#!/bin/bash
# 批量生成绘本风插画：bash scripts/gen-art.sh
# 已存在的图片会跳过；生成结果在 images/，再用 scripts/pack-art.sh 压缩到 src/static/h5/art/
set -u
cd "$(dirname "$0")/.."
GEN=/Users/pro/.comate/skills/.system/create-image/scripts/generate-image.sh

style() {
  case "$1" in
    watercolor) echo "Children's picture book illustration, soft watercolor washes on warm cream textured paper, gentle thin pencil outlines, pastel muted colors, cozy and warm" ;;
    crayon) echo "Children's picture book illustration, wax crayon and colored pencil drawing, bold saturated colors, thick wobbly hand-drawn outlines, playful naive style, on white drawing paper with visible crayon texture" ;;
    wafu) echo "Japanese-style light-color picture book illustration, thin sumi ink outlines, flat soft washes in a traditional Japanese palette of indigo, vermilion, matcha green and ochre, on off-white washi paper texture, woodblock print feeling" ;;
  esac
}

SINGLE="three-quarter front view, a single isolated subject centered with wide empty margins, plain paper background. No text, no letters, no numbers, no logos, no brand trade dress, no people."

# id|画幅|描述
ITEMS=$(cat <<'EOF'
map|3:4|Top-down illustrated city map background for a cozy fictional Japanese town, portrait orientation. A winding river crosses the middle from left to right, a large blue bay fills the bottom-right corner, green parks with cherry trees, small hills, tree-lined streets forming a loose grid, open empty plazas. Absolutely no buildings, no text, no labels, no letters, no numbers, no people. Calm, uncluttered, lots of empty space.
room|1:1|Interior of an empty small Japanese apartment room seen from above at a high three-quarter angle, light wooden floor filling most of the frame, back wall with a window and curtains, no furniture, no people, no text.
title|9:16|Picture book cover scene of a cozy Japanese city at dusk: a tall lattice tower, temple roofs, a red shrine gate, little houses with warm windows, paper lanterns, starry sky, large empty sky area at the top for a title. No text, no letters.
home|1:1|A small cozy two-story Japanese apartment house with a balcony and potted plants, SINGLE
konbini|1:1|A small generic 24-hour corner shop with a plain single-color awning and a glass front showing shelves, not resembling any real store chain, no stripes, SINGLE
ramen|1:1|A small ramen shop with red paper lanterns and a plain noren curtain and a steaming bowl sign, SINGLE
tsukiji|1:1|An open-air fish market stall with wooden crates of fresh fish under a canvas roof, SINGLE
marunouchi|1:1|A tall elegant brick-and-glass office building, SINGLE
shibuya_tech|1:1|A modern glass startup office building with plants on the rooftop and a laptop-shaped sign, SINGLE
gym|1:1|A small fitness gym building with big windows showing dumbbells, SINGLE
library|1:1|A public library building with columns and an open-book shaped sign, SINGLE
karaoke|1:1|A colorful karaoke building with a big microphone shaped sign and music notes, SINGLE
izakaya|1:1|A traditional wooden izakaya pub with red lanterns and a plain noren curtain, SINGLE
club|1:1|A nightclub building glowing with neon lights and a disco ball on the roof, night sky behind, SINGLE
onsen|1:1|A traditional Japanese public bathhouse with a tall chimney and rising steam, SINGLE
shrine|1:1|A small hillside shrine with a row of red torii gates and fox statues, SINGLE
temple|1:1|An old Buddhist temple with a large curved tiled roof and a big red paper lantern at the gate, SINGLE
park|1:1|A small park with blooming cherry trees, a wooden bench and a little pond, SINGLE
akiba|1:1|A busy electronics and video game shop building with colorful screens and a game controller shaped sign, SINGLE
hospital|1:1|A clean white hospital building with a green plus-shaped sign on the facade (not a red cross), SINGLE
police|1:1|A small Japanese police box with a red lamp above the door, SINGLE
ginza|1:1|A luxury department store building with large display windows and a clock on top, SINGLE
furniture|1:1|A furniture store with a sofa and a floor lamp displayed in the window, SINGLE
livehouse|1:1|A small live music venue with a guitar shaped sign and colorful stage lights, SINGLE
cityhall|1:1|A grand city hall building with twin towers and a flag, SINGLE
estate|1:1|A small real estate agency shop with little house models in the window, SINGLE
beach|1:1|A sandy beach scene with a surfboard, a striped parasol and a small beach hut by the sea, SINGLE
airport|1:1|A small airport terminal with an airplane taking off, SINGLE
fuji|1:1|A majestic snow-capped volcano mountain with soft clouds, SINGLE
EOF
)

jobs=()
for theme in watercolor crayon wafu; do
  while IFS='|' read -r id ratio desc; do
    [ -z "$id" ] && continue
    out="art-$theme-$id.png"
    [ -f "images/$out" ] && continue
    prompt="$(style "$theme"). ${desc//SINGLE/$SINGLE}"
    jobs+=("$out|$ratio|$prompt")
  done <<< "$ITEMS"
done

echo "to generate: ${#jobs[@]}"
LANES=6

gen_one() {
  local line="$1" out ratio prompt rest
  out="${line%%|*}"; rest="${line#*|}"; ratio="${rest%%|*}"; prompt="${rest#*|}"
  for try in 1 2; do
    if bash "$GEN" -p "$prompt" -o "$out" -a "$ratio" -r 1K >/dev/null 2>"/tmp/gen-$out.err"; then
      echo "ok $out"
      return 0
    fi
  done
  echo "FAIL $out: $(tail -1 "/tmp/gen-$out.err")"
}

# 分成几条并行通道，每条通道内顺序生成（macOS 自带 bash 3.2 没有 wait -n）
for ((lane = 0; lane < LANES; lane++)); do
  (
    for ((i = lane; i < ${#jobs[@]}; i += LANES)); do
      gen_one "${jobs[$i]}"
    done
  ) &
done
wait
