# RSC Reel — 15s (1080×1920)

라움소셜클럽 인스타그램 릴스용 15초 소개 모션그래픽. 키네틱 타이포그래피와 도형으로 구성했다. 결과물은 `out/`에 있다.

| 파일 | 용도 |
|---|---|
| `out/rsc-reel-15s.mp4` | 마스터 (1080×1920, 60fps, H.264 CRF 16, AAC 256k) |
| `out/rsc-reel-15s-30fps.mp4` | 인스타그램 업로드·메신저 공유용 (30fps) |
| `out/soundtrack.wav` | 사운드트랙 원본 (48kHz/24bit, 128 BPM) |

## 콘셉트

- **히어로 오브젝트는 엠블럼의 타원 링**이다. RS 엠블럼의 세로 타원을 three.js에서 실제 3D 골드 메탈로 만들었고, 따뜻한 스튜디오 환경광을 반사한다. 브랜딩 영상의 캔들 톤을 반영한 것이다.
- **컬러**: 사이트 토큰 cream `#f7f3ec`, ink `#211e19`, cognac `#9c6b3e`, gold `#e2b478`, brown `#5a3d24`. 장면마다 배경을 풀블리드로 교차한다.
- **타입**: Pretendard Black(헤드라인)과 SamsungOne(사이트 UI 서체, 크롬 라벨)을 쓴다.
- **리듬**: 128 BPM에서 8마디가 정확히 15.0초다. 장면 컷은 모두 마디선 위에 있고, 요소는 16분·32분음표 간격으로 들어온다.
- **루프**: 마지막 마디가 첫 프레임을 다시 조립한다. 오디오도 15초를 넘긴 리버브 꼬리를 0초로 감싸 두었다. 그래서 릴스가 반복 재생돼도 이음새가 없다.

## 구성 (1마디 = 1.875s)

| 시간 | 장면 | 모션 |
|---|---|---|
| 0.00 | RAUM SOCIAL CLUB. | 오프닝 락업과 3D 링. 링이 정면으로 돌아서며 구멍 안에 다음 장면이 열리고(포털), 카메라가 링을 통과한다 |
| 1.88 | 만남을 세지 않고, 관계를 쌓습니다. | 원 다섯 개가 16분음표로 카운트된다(결정사 만남 5회). 금색 선으로 지운 뒤 하나로 합쳐지고, 그 점이 다음 장면으로 번진다 |
| 3.75 | SOCIAL ×3 | 링이 텍스트 평면을 관통한다(앞·뒤 반쪽을 각각 렌더해 타입 사이에 끼움). 박자마다 아웃라인이 전환된다 |
| 5.63 | 01 / EXPERIENCE — 취향으로 만나고 | ART·WINE·WELLNESS·MUSIC·DINING·TALK 아이콘 타일이 대각선 순서로 팝업한다. WELLNESS 타일이 화면을 채운다 |
| 7.50 | 02 / PEOPLE — 사람으로 이어지고 | 브론즈 링 궤도를 도는 멤버 구체들이 선으로 연결된다. VERIFIED BY RAUM 스탬프가 나온다 |
| 9.38 | 03 / RELATIONSHIP — 관계로 완성되다. | 링이 엠블럼처럼 서고 그 안에 라움 다이닝 사진이 보인다. WEEK 01→06 틱 끝에 두 구체가 만난다 |
| 11.25 | RAUM SOCIAL CLUB. | 커튼 스플릿 뒤 글자 단위 라이즈. "서로의 특별함을 발견하는 곳." |
| 13.13 | 락업 | 떨어진 골드 구체가 크림 원으로 번진다. Founding Member 선착순 100명 · 2026.12.02 런칭. 이어서 오프닝으로 되돌아간다 |

## 다시 만들기

```bash
pip install numpy scipy fonttools brotli imageio-ffmpeg
npm i pretendard                                   # 폰트 원본 (OFL-1.1)
PRETENDARD=node_modules/pretendard/dist/web/static/woff2 python3 build_fonts.py   # → fonts/ (사용 글자만 서브셋)
python3 audio.py                                   # → out/soundtrack.wav
FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  OUT=/tmp/rsc-reel WORKERS=6 node render.mjs video   # 프레임 렌더(WebGL/SwiftShader) + 인코딩 → out/*.mp4
node render.mjs stills 4.4 10.5                    # 특정 시점 스틸
node render.mjs sheet 0.25                         # 0.25s 간격 콘택트 시트용 프레임
```

`vendor/three.min.js`는 three.js(MIT)와 RoomEnvironment를 esbuild로 묶은 단일 ESM 번들이다.

브라우저 미리보기: 저장소 루트에서 정적 서버를 띄우고 `motion/reel/index.html`을 연다. 루프 재생되고, 클릭하면 사운드가 나온다. `?t=10.4`를 붙이면 해당 프레임에 고정된다.
