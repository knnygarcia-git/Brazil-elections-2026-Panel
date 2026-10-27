import sys
from collections import deque
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(f'{src}/2.png').convert('RGB'); W, H = im.size; px = im.load()
mask = Image.new('L', (W, H), 255); m = mask.load()
seen = bytearray(W * H); q = deque()
for x in range(W):
    q.append((x, 0))
for y in range(H):
    q.append((0, y)); q.append((W - 1, y))
def bg(c): r, g, b = c; return r > 200 and g > 205 and b > 210 and max(r, g, b) - min(r, g, b) < 30
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= W or y >= H or seen[y * W + x]: continue
    seen[y * W + x] = 1
    if not bg(px[x, y]): continue
    m[x, y] = 0
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
lula = im.convert('RGBA'); lula.putalpha(mask)
lula = lula.resize((int(W * 560 / H), 560), Image.LANCZOS)
lula.save(f'{out}/lula.webp', 'WEBP', quality=82)
fl = Image.open(f'{src}/3.webp').convert('RGBA')
fl = fl.crop((0, 0, 1041, 1300))
fl = fl.resize((int(1041 * 560 / 1300), 560), Image.LANCZOS)
fl.save(f'{out}/flavio.webp', 'WEBP', quality=82)
# preview on white
for n in ('lula', 'flavio'):
    a = Image.open(f'{out}/{n}.webp'); bgc = Image.new('RGBA', a.size, (255, 230, 230, 255)); bgc.alpha_composite(a); bgc.convert('RGB').save(f'{out}/prev_{n}.png')
