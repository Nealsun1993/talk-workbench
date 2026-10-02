#!/usr/bin/env bash
# 预览联系表：bash scripts/contact.sh <episode> <秒> <秒> ...   → out/<episode>-contact.jpg
# 例：bash scripts/contact.sh talking-workflow-v2 3 20 35 60
set -e
EP=$1; shift
BROWSER=${BROWSER_EXECUTABLE:+--browser-executable=$BROWSER_EXECUTABLE}
mkdir -p out/stills
npx remotion bundle src/index.tsx --out-dir build --log=error >/dev/null
FILES=()
for s in "$@"; do
  f=$(python3 -c "print(round($s*30))")
  npx remotion still build Episode "out/stills/$EP-$f.png" --frame=$f --props="{\"episode\":\"$EP\"}" $BROWSER --log=error >/dev/null
  FILES+=("out/stills/$EP-$f.png")
done
python3 - "$EP" "${FILES[@]}" <<'PY'
import sys
from PIL import Image
ep, files = sys.argv[1], sys.argv[2:]
W, H, cols = 360, 640, min(6, len(files))
rows = (len(files) + cols - 1) // cols
c = Image.new('RGB', (W * cols, H * rows), 'white')
for i, f in enumerate(files):
    c.paste(Image.open(f).convert('RGB').resize((W, H)), ((i % cols) * W, (i // cols) * H))
c.save(f'out/{ep}-contact.jpg', quality=88)
print(f'out/{ep}-contact.jpg')
PY
