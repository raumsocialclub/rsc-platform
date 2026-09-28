# RSC Mood — 15s (1080×1920)

라움소셜클럽의 분위기를 전하는 인스타그램 릴스용 무드 필름이다. 라움의 실제 공간 사진을 느린 디졸브로 잇고, 아치 창 모양의 도형과 빛(라이트 리크, 촛불 보케, 필름 그레인)으로 공기감을 만든다.

| 파일 | 용도 |
|---|---|
| `out/rsc-mood-15s-30fps.mp4` | 인스타그램 업로드용 (30fps) |
| `out/rsc-mood-15s.mp4` | 마스터 (60fps, H.264 CRF 16, AAC 256k) |
| `out/soundtrack.wav` | 사운드트랙 원본 (48kHz/24bit) |

## 구성

| 시간 | 화면 | 문구 |
|---|---|---|
| 0.0–3.6 | 어둠 속에 금색 아치 선이 그려지고, 창 안에 촛불이 켜진 뒤 창이 화면 전체로 열린다 | THE SPACE — 아름다운 공간에서, |
| 3.0–6.8 | 샹들리에 | THE PEOPLE — 서로의 특별함을 |
| 6.2–9.9 | 고딕 홀과 붉은 카네이션 | THE BEGINNING — 발견하는 곳. |
| 9.3–12.8 | 테이블 세팅 | *A private community for remarkable singles.* |
| 12.2–15.0 | 외관 아치. 화면이 다시 아치 창으로 닫히고 엠블럼과 워드마크가 떠오른다 | RAUM SOCIAL CLUB · Founding Members 2026 |

- 문구는 한 줄씩 나오고, 한 줄이 약 3초 동안 화면에 머문다. 글자마다 블러에서 선명해지며 천천히 들어온다.
- 사진은 `브랜딩압축.mp4`(4K)에서 가져왔다. 샷마다 가운데에 워드마크가 박혀 있어서, 그 띠를 피해 위쪽 또는 아래쪽만 9:16으로 잘라 썼다(`prep_images.py`).
- 사운드는 드럼 없는 앰비언트다. 피아노, 현악, 촛불 소리로 채웠고, 문구가 나올 때마다 코드가 바뀐다. 엠블럼이 나올 때 F장조로 해결되며 벨이 울린다. 전부 직접 합성해 저작권 문제가 없다.

## 다시 만들기

```bash
pip install numpy scipy pillow imageio-ffmpeg
SRC=path/to/브랜딩압축.mp4 python3 prep_images.py   # → img/*.jpg
python3 fetch_fonts.py                              # → fonts/ (Cormorant Garamond, Noto Serif KR 서브셋)
python3 audio.py                                    # → out/soundtrack.wav
FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  OUT=/tmp/rsc-mood WORKERS=6 node render.mjs video   # → out/*.mp4
```

브라우저 미리보기: 저장소 루트에서 정적 서버를 띄우고 `motion/mood/index.html`을 연다. 클릭하면 사운드와 함께 재생되고, `?t=8`을 붙이면 해당 프레임에 고정된다.
