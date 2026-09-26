"""Download the web fonts used by index.html into ./fonts (Korean families subset to the glyphs used)."""
import re, urllib.request, urllib.parse, pathlib, hashlib
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'}
here = pathlib.Path(__file__).parent
html = (here / 'index.html').read_text(encoding='utf-8')
hangul = ''.join(sorted(set(c for c in html if '가' <= c <= '힣')))
text = hangul + ' ,.&·—' + 'abcdefghijklmnopqrstuvwxyz'
fams = [
    ('Cormorant Garamond', 'ital,wght@0,300;0,400;0,500;0,600;1,300;1,400', None),
    ('Noto Serif KR', 'wght@300;400', text),
    ('Noto Sans KR', 'wght@400', text),
]
out = here / 'fonts'; out.mkdir(exist_ok=True)
css_all = []
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
for fam, axes, sub in fams:
    q = f'family={urllib.parse.quote_plus(fam)}:{axes}&display=block'
    if sub: q += '&text=' + urllib.parse.quote(sub)
    css = get('https://fonts.googleapis.com/css2?' + q).decode()
    # keep only latin/latin-ext blocks for Cormorant
    blocks = re.findall(r'(/\*[^*]*\*/\s*)?(@font-face\s*{[^}]*})', css)
    for comment, block in blocks:
        if not sub and comment and not re.search(r'latin', comment):
            continue
        url = re.search(r'url\((https://[^)]+)\)', block).group(1)
        name = hashlib.md5(url.encode()).hexdigest()[:12] + '.woff2'
        (out / name).write_bytes(get(url))
        css_all.append(block.replace(url, name))
(out / 'fonts.css').write_text('\n'.join(css_all) + '\n')
print(len(css_all), 'faces;', len(hangul), 'hangul glyphs')
