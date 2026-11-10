# 画像を並べて 1枚の一覧にする: python3 tools/sheet.py out.jpg cols scale img1 img2 ...
import sys
from PIL import Image
out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
ims = [Image.open(p).convert('RGB') for p in sys.argv[4:]]
w, h = ims[0].size; w2, h2 = int(w * scale), int(h * scale)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w2, rows * h2), (20, 20, 20))
for i, im in enumerate(ims): S.paste(im.resize((w2, h2), Image.LANCZOS), ((i % cols) * w2, (i // cols) * h2))
S.save(out, quality=88)
