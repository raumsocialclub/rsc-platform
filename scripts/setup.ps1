# RSC 플랫폼 로컬 실행 (Windows PowerShell)
# 사용법: PowerShell에서  .\scripts\setup.ps1
#   (실행 정책 오류가 나면:  powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 )
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Node.js가 설치되어 있지 않습니다."
  Write-Host "   https://nodejs.org 에서 LTS(권장) 버전을 설치한 뒤 이 스크립트를 다시 실행해주세요."
  exit 1
}

$nodeVersion = (node -v).TrimStart("v")
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -lt 20) {
  Write-Host "❌ Node.js 20 이상이 필요합니다. 현재: v$nodeVersion"
  Write-Host "   https://nodejs.org 에서 최신 LTS로 업데이트해주세요."
  exit 1
}
Write-Host "✅ Node.js v$nodeVersion"

Write-Host "📦 패키지를 설치합니다 (처음 한 번은 몇 분 걸릴 수 있습니다)…"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "📝 .env.local 파일을 만들었습니다. (외부 서비스 키는 나중 단계에서 채웁니다)"
}

Write-Host ""
Write-Host "🚀 개발 서버를 시작합니다. 브라우저에서 http://localhost:3000 을 열어주세요."
Write-Host "   종료하려면 이 창에서 Ctrl + C 를 누르세요."
Write-Host ""
npm run dev
