/**
 * 라움소셜클럽 콜 현황 — 구글 시트를 어드민(/admin/calls)에 보여주기 위한 Apps Script 웹앱.
 * 붙이는 법은 SETUP.md 4-4. 시트는 읽기만 하고 바꾸지 않는다.
 *
 *  1) 시트에서 확장 프로그램 → Apps Script → 이 파일 내용 전체를 붙여 넣고 저장
 *  2) 왼쪽 톱니(프로젝트 설정) → 스크립트 속성 → 속성 추가: TOKEN = 직접 정한 긴 비밀 문자열. 같은 값을 Vercel 환경변수 CRM_SHEET_TOKEN 에도 넣는다
 *  3) 편집기 위쪽 함수 목록에서 "setup" 을 고르고 ▶ 실행 → 권한 허용. (1분마다 시트를 미리 읽어 두는 자동 작업을 만든다. 한 번만)
 *  4) 배포 → 새 배포 → 유형 "웹 앱" → 실행 사용자 "나", 액세스 권한 "모든 사용자" → 배포 → 웹 앱 URL 복사
 *  5) 그 URL 을 Vercel 환경변수 CRM_SHEET_URL 에 넣고 재배포. 스크립트를 고치면 "배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포" 로 다시 배포해야 반영된다 (URL 은 그대로)
 *
 *  v3 (2026-10-27): 수식 탭 건너뛰기 + 끝의 빈 행 잘라내기
 *  v4 (2026-10-27): 1분마다 미리 읽어 캐시에 두고(refreshCache), 어드민 요청(doGet)은 캐시를 즉시 돌려준다.
 *     5,000행짜리 수식(중복 판별 등)이 시트를 열 때마다 다시 계산돼 읽기에 20초 넘게 걸리는 것을 어드민이 기다리지 않게.
 *     캐시가 비어 있으면(처음·10분 넘게 갱신 안 됨) 그 자리에서 읽는다.
 */
var VERSION = 4;
// 수식으로 만든 보기용 탭 이름. 보기용 탭을 더 만들면 여기에 추가하거나 탭을 숨긴다 (lib/crm/parse.ts DERIVED_TABS 와 같게)
var SKIP_TABS = ["DB관리", "일별현황", "자동정리", "사용안내"];
var CACHE_KEY = "crm_json";
var CACHE_TTL_SEC = 600;      // 자동 작업이 멈춰도 10분 뒤엔 doGet 이 직접 읽는다
var CHUNK = 30000;            // CacheService 값 하나 100KB 제한 → 글자 단위로 나눠 저장 (한글 3바이트 기준 여유)

/** 어드민이 부르는 곳. 토큰 확인 → 캐시 있으면 즉시, 없으면 직접 읽어서 채운 뒤 응답 */
function doGet(e) {
  var expected = PropertiesService.getScriptProperties().getProperty("TOKEN");
  var given = (e && e.parameter && e.parameter.token) || "";
  if (!expected || given !== expected) return text_(JSON.stringify({ ok: false, message: "unauthorized" }));

  var cached = readCache_();
  if (cached) return text_(cached);
  var json = buildJson_("live");
  writeCache_(json);
  return text_(json);
}

/** 1분마다 자동 실행 (setup 이 만든 트리거). 시트를 읽어 캐시를 새로 채운다 */
function refreshCache() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return; // 앞 작업이 아직 읽는 중이면 이번 회차는 건너뜀
  try {
    writeCache_(buildJson_("cache"));
  } finally {
    lock.releaseLock();
  }
}

/** 한 번만 실행: refreshCache 를 1분마다 돌리는 트리거를 만들고 캐시를 바로 채운다 */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "refreshCache") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("refreshCache").timeBased().everyMinutes(1).create();
  refreshCache();
  Logger.log("완료: 1분마다 시트를 미리 읽습니다. 이제 배포 → 새 배포(또는 배포 관리 → 새 버전)를 진행하세요.");
}

/** 시트 → JSON 문자열. source 는 어드민이 '캐시에서 왔는지/직접 읽었는지' 보여주는 표시 */
function buildJson_(source) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ss.getSheets()
    // 숨긴 탭과 수식 보기용 탭(DB관리·일별현황·자동정리·사용안내)은 읽지 않는다 — 수천 행짜리 수식 표라 느리고, 어드민도 쓰지 않는다
    .filter(function (s) { return !s.isSheetHidden() && SKIP_TABS.indexOf(s.getName().trim()) < 0; })
    .map(function (s) {
      var range = s.getDataRange();
      var rows = range.getNumRows() > 0 ? range.getDisplayValues() : [];
      // 끝의 빈 행(수식이 빈 글자를 내는 자리)은 잘라낸다 — CRM관리처럼 5,000행을 잡아 둔 탭도 실제 글이 있는 데까지만 보낸다
      var last = rows.length;
      while (last > 0 && rows[last - 1].every(function (c) { return c === ""; })) last--;
      rows = rows.slice(0, last);
      // 셀에 붙인 노트(노란 말풍선) — 인터뷰 내용이 여기 들어 있다. 노트가 있는 칸만 [행, 열, 내용]
      var notes = [];
      if (last > 0) {
        var all = s.getRange(1, 1, last, range.getNumColumns()).getNotes();
        for (var r = 0; r < all.length; r++) for (var c = 0; c < all[r].length; c++) if (all[r][c]) notes.push([r, c, all[r][c]]);
      }
      return { name: s.getName(), rows: rows, notes: notes };
    });
  // version: 어드민이 "새 버전으로 배포됐는지" 알아보는 표시. updatedAt: 시트를 실제로 읽은 시각
  return JSON.stringify({ ok: true, version: VERSION, source: source, url: ss.getUrl(), updatedAt: new Date().toISOString(), tabs: tabs });
}

function writeCache_(json) {
  var cache = CacheService.getScriptCache();
  var parts = {};
  var n = 0;
  for (var i = 0; i < json.length; i += CHUNK) parts[CACHE_KEY + "_" + n++] = json.substring(i, i + CHUNK);
  parts[CACHE_KEY + "_n"] = String(n);
  cache.putAll(parts, CACHE_TTL_SEC);
}

function readCache_() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(CACHE_KEY + "_n") || 0);
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(CACHE_KEY + "_" + i);
  var got = cache.getAll(keys);
  var out = "";
  for (var j = 0; j < n; j++) { var p = got[CACHE_KEY + "_" + j]; if (p == null) return null; out += p; }
  return out;
}

function text_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
