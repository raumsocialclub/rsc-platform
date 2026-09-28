"""Subset Pretendard (SIL OFL 1.1) and fetch Nanum Pen Script (OFL, Google Fonts) for the glyphs index.html uses -> fonts/.

    npm i pretendard   # anywhere; then point PRETENDARD at its static woff2 folder
    PRETENDARD=node_modules/pretendard/dist/web/static/woff2 python3 build_fonts.py
"""
import os
import pathlib
import re
import urllib.parse
import urllib.request

from fontTools import subset

here = pathlib.Path(__file__).parent
src = pathlib.Path(os.environ.get('PRETENDARD', 'node_modules/pretendard/dist/web/static/woff2'))
out = here / 'fonts'
out.mkdir(exist_ok=True)

html = (here / 'index.html').read_text(encoding='utf-8')
body = re.sub(r'<script.*?</script>', '', html, flags=re.S)
text = set(re.sub(r'<[^>]+>', '', body))
# strings that are created from JS
text |= {chr(c) for c in range(0x20, 0x7f)} | set('—·↗’‘“”…')
chars = ''.join(sorted(c for c in text if c.isprintable()))

css = []
for weight, name in ((800, 'ExtraBold'), (700, 'Bold'), (600, 'SemiBold')):
    dst = out / f'Pretendard-{name}.subset.woff2'
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk']
    font = subset.load_font(str(src / f'Pretendard-{name}.woff2'), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    subset.save_font(font, str(dst), opts)
    css.append(f"@font-face{{font-family:'Pretendard';font-weight:{weight};font-display:block;"
               f"src:url({dst.name}) format('woff2')}}")
    print(dst.name, dst.stat().st_size // 1024, 'KB')

# handwritten caption lines (class="tl hand"), if any: Nanum Pen Script, subset by the Google Fonts API
hand = ''.join(sorted(set(''.join(re.findall(r'class="tl hand"[^>]*>([^<]+)<', html)))))
if hand.strip():
    UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'}
    q = 'family=Nanum+Pen+Script&display=block&text=' + urllib.parse.quote(hand)
    gcss = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?' + q, headers=UA)).read().decode()
    url = re.search(r'url\((https://[^)]+)\)', gcss).group(1)
    (out / 'NanumPenScript.subset.woff2').write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read())
    css.append("@font-face{font-family:'Nanum Pen Script';font-display:block;src:url(NanumPenScript.subset.woff2) format('woff2')}")
else:
    (out / 'NanumPenScript.subset.woff2').unlink(missing_ok=True)

# SamsungOne (the site's UI face) straight from deploy/
css.append("@font-face{font-family:'SamsungOne';font-weight:700;font-display:block;"
           "src:url(../../../deploy/fonts/SamsungOne-700.ttf) format('truetype')}")
(out / 'fonts.css').write_text('\n'.join(css) + '\n', encoding='utf-8')
print(len(chars), 'glyphs')
