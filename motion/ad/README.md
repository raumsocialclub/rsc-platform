# RSC Ad Reel — 15s (1080×1920)

라움소셜클럽 인스타그램 광고 릴스. 끊김 없이 한 번에 파고드는 줌인으로 **라움 외관에서 시작해 사람과 사람이 만나는 순간**까지 들어간 뒤, 초대장 형식의 엔드카드로 행동을 유도한다.

| 파일 | 용도 |
|---|---|
| `out/rsc-ad-15s.mp4` | 인스타그램 업로드용 (1080×1920, 30fps, H.264, AAC) |
| `out/soundtrack.wav` | 사운드트랙 원본 (48kHz/24bit, 96 BPM) |

## 구성

| 시간 | 화면 | 카피 |
|---|---|---|
| 0.0–3.1 | 밤의 라움 외관. 불 켜진 1층 창으로 줌인 | *가입 심사를 통과한* / 라움의 **검증된 싱글**들과 |
| 3.1–5.0 | 창 안으로 들어가면 소셜 나이트가 열린 홀 | |
| 5.0–7.5 | 둘을 위한 와인 테이블. 와인잔 속으로 줌인 | 이번 주말, **와인 소셜** 어때요? |
| 7.5–10.0 | 잔이 건배하는 손들로 이어진다(잔이 부딪히는 순간 반짝임) | *만남 횟수 말고,* / 아름다운 공간에서 / **관계**가 시작되는 곳. |
| 10.0–15.0 | 엔드카드: 라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티. 폰 화면 속 초대장(주 1회 취향 소셜 · 월 1회 SOCIAL NIGHT · RAUM SOLO · Founding Member 선착순 100명)에서 **PREVIEW 신청하기**를 탭한다 | |

- **줌 방식**: 각 사진 안의 한 지점(창, 사람들, 와인잔)이 다음 사진의 프레임이 된다. 카메라는 그 지점을 향해 고정점 줌을 하고, 줌 속도에 비례한 방사형 모션 블러를 준다. 통과할 때는 빠르고, 장면에 도착하면 느려진다(단조 3차 보간 곡선).
- **사진**: 외관은 제공받은 라움 사진이다. 실내는 `deploy/`의 raum-solo(소셜 나이트), after-hours(와인 테이블), about(건배)을 썼다.
- **사운드**: 96 BPM 라운지 그루브를 직접 합성했다. 창과 잔을 통과할 때 휙 소리가 나고, 잔이 부딪히는 소리, UI 팝, 버튼 탭 소리를 넣었다.

## 다시 만들기

```bash
pip install numpy scipy fonttools brotli imageio-ffmpeg
PRETENDARD=node_modules/pretendard/dist/web/static/woff2 python3 build_fonts.py   # Pretendard + Nanum Pen Script 서브셋
python3 audio.py
FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  OUT=/tmp/rsc-ad WORKERS=6 node render.mjs video
```
