import json, math, sys
src, outdir = sys.argv[1], sys.argv[2]
d = json.load(open(src))
K = math.cos(math.radians(15))
W = 1000
# bounds
xs, ys = [], []
for f in d['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    for p in polys:
        for r in p:
            for x,y in r: xs.append(x*K); ys.append(-y)
minx,maxx,miny,maxy = min(xs),max(xs),min(ys),max(ys)
s = W/(maxx-minx); H = round((maxy-miny)*s)
def proj(pt): return ((pt[0]*K-minx)*s, (-pt[1]-miny)*s)
def dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-9
    for i in range(1, len(pts)-1):
        p = pts[i]
        dd = abs(dy*(p[0]-a[0]) - dx*(p[1]-a[1]))/L if (dx or dy) else math.hypot(p[0]-a[0], p[1]-a[1])
        if dd > dmax: dmax, idx = dd, i
    if dmax > eps: return dp(pts[:idx+1], eps)[:-1] + dp(pts[idx:], eps)
    return [a, b]
rows = []
for f in d['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    parts = []; cx=cy=n=0; best=0
    for p in polys:
        for r in p[:1]:
            pts = [proj(q) for q in r]
            sp = dp(pts, 0.6)
            if len(sp) < 4: continue
            area = abs(sum(sp[i][0]*sp[i+1][1]-sp[i+1][0]*sp[i][1] for i in range(len(sp)-1)))/2
            if area < 2: continue
            parts.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x,y in sp) + 'Z')
            if area > best:
                best = area; cx = sum(x for x,_ in sp)/len(sp); cy = sum(y for _,y in sp)/len(sp)
    rows.append({'uf': f['properties']['sigla'], 'path': ''.join(parts), 'cx': round(cx,1), 'cy': round(cy,1)})
json.dump({'rows': rows, 'width': W, 'height': H}, open(f'{outdir}/mapa_uf.json','w'), separators=(',',':'))
print(H, sum(len(r['path']) for r in rows))
