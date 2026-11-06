#!/usr/bin/env bash
# RSC 플랫폼 로컬 실행 (mac / linux)
# 사용법: 터미널에서  bash scripts/setup.sh
set -e
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js가 설치되어 있지 않습니다."
  echo "   https://nodejs.org 에서 LTS(권장) 버전을 설치한 뒤 이 스크립트를 다시 실행해주세요."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "❌ Node.js 20 이상이 필요합니다. 현재: $(node -v)"
  echo "   https://nodejs.org 에서 최신 LTS로 업데이트해주세요."
  exit 1
fi
echo "✅ Node.js $(node -v)"

echo "📦 패키지를 설치합니다 (처음 한 번은 몇 분 걸릴 수 있습니다)…"
npm install

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "📝 .env.local 파일을 만들었습니다. (외부 서비스 키는 나중 단계에서 채웁니다)"
fi

echo ""
echo "🚀 개발 서버를 시작합니다. 브라우저에서 http://localhost:3000 을 열어주세요."
echo "   종료하려면 이 창에서 Ctrl + C 를 누르세요."
echo ""
npm run dev
