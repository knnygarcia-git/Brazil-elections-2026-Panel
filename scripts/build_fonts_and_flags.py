import base64, io, json, sys, os
from PIL import Image
dl, out = sys.argv[1], sys.argv[2]
b64 = lambda b: base64.b64encode(b).decode()
css = []
for w in (400, 500, 600, 700):
    f = open(f'{dl}/npm/fs/package/files/poppins-latin-{w}-normal.woff2', 'rb').read()
    css.append("@font-face{font-family:'Poppins';font-style:normal;font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (w, b64(f)))
open(f'{out}/fonts.css', 'w').write('\n'.join(css))
uf = {}
for fn in sorted(os.listdir(f'{dl}/bandeiras-br/imagens')):
    im = Image.open(f'{dl}/bandeiras-br/imagens/{fn}').convert('RGBA')
    im = im.resize((48, round(48 * im.height / im.width)), Image.LANCZOS)
    bio = io.BytesIO(); im.save(bio, 'PNG', optimize=True)
    uf[fn[:-4]] = 'data:image/png;base64,' + b64(bio.getvalue())
pais = {}
for nome, code in {'Brasil': 'br', 'França': 'fr', 'Reino Unido': 'gb', 'Portugal': 'pt', 'Estados Unidos': 'us', 'Japão': 'jp'}.items():
    pais[nome] = 'data:image/svg+xml;base64,' + b64(open(f'{dl}/npm/fi/package/flags/4x3/{code}.svg', 'rb').read())
open(f'{out}/bandeiras.js', 'w').write('window.EL_FLAGS = ' + json.dumps({'uf': uf, 'pais': pais}) + ';\n')
