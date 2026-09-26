# RSC Showreel — 15s

라움소셜클럽 브랜드 소개용 15초 모션그래픽 쇼릴. 결과물은 `out/`에 있다.

| 파일 | 용도 |
|---|---|
| `out/rsc-showreel-15s.mp4` | 마스터 (1920×1080, 60fps, H.264 CRF 18, AAC 256k) |
| `out/rsc-showreel-15s-web.mp4` | 공유·웹 임베드용 경량본 |
| `out/soundtrack.wav` | 사운드트랙 원본 (48kHz/24bit, 120 BPM) |

## 구성 (120 BPM · 1 beat = 0.5s, 모든 컷은 비트 위)

| 시간 | 장면 | 모션 |
|---|---|---|
| 0.0–2.0 | 01 SPACE | 금색 아치 라인이 그려지고, 아치 창이 화면 전체로 열리며 라움 홀 안으로 진입 |
| 2.0–4.0 | 아름다운 공간에서, | 글자 단위 블러-인, 라이트 리크 |
| 4.0–7.0 | 02 TASTE | ART · WINE · WELLNESS · Music · DINING · TALK — 한 비트마다 다른 전환(슬라이드업, 스플릿, 타이포 마스크, 아이리스, 블라인드, 줌컷) |
| 7.0–9.0 | 03 PEOPLE | 크림 배경 위 세 개의 아치: EXPERIENCE → PEOPLE → RELATIONSHIP / "매칭이 아니라, 커뮤니티." |
| 9.0–10.5 | 04 SEASON | RAUM SOLO — 6주 여정(WEEK 0–6) 틱커 |
| 10.5–12.0 | 05 BEGINNING | 커튼 스플릿 → "서로의 특별함을 발견하는 곳." |
| 12.0–15.0 | LOGO | 타원 아이리스가 엠블럼 링으로 닫히며 로고 리빌 |

디자인 토큰은 `Design.md`(cream/ink/gold/brown), 사진·로고·SamsungOne 폰트는 `deploy/`의 원본을 그대로 쓴다.

## 다시 만들기

```bash
pip install numpy scipy imageio-ffmpeg
python3 fetch_fonts.py          # 웹폰트 (한글은 사용 글자만 서브셋) → fonts/
python3 audio.py                # → out/soundtrack.wav
FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  OUT=/tmp/rsc-render node render.mjs video      # 프레임 렌더 + 인코딩 → out/*.mp4
node render.mjs stills 2.9 7.6 13.5              # 특정 시점 스틸 확인
```

브라우저 미리보기: 저장소 루트에서 정적 서버를 띄우고 `motion/showreel/index.html`을 열면 루프 재생된다(클릭하면 사운드 포함). `?t=7.5`로 특정 프레임 고정.
