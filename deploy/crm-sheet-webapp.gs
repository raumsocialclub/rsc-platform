/**
 * 라움소셜클럽 콜 현황 — 구글 시트를 어드민(/admin/calls)에 보여주기 위한 Apps Script 웹앱.
 * 붙이는 법은 SETUP.md 4-4. 시트에서 바꾸는 것은 CRM관리 탭(새 신청 행 추가)뿐이다.
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
 *  v5 (2026-10-27): CRM관리 탭을 수식 대신 스크립트가 채운다(syncCrm). 1분마다 DB추출용에 새로 들어온 신청(신청 ID 기준)을
 *     CRM관리 맨 아래에 값으로 덧붙인다. 손으로 적는 F~I열(1·2·3차 콜·상담 메모)과 셀 노트는 건드리지 않는다.
 *     행 순서가 '들어온 순서'로 고정되므로 새 신청이 와도 기존 행이 밀리지 않는다(손 입력이 다른 사람 줄로 가는 사고 방지).
 *     처음 한 번, CRM관리가 수식으로 차 있으면 백업 탭(CRM관리_백업_날짜)을 만든 뒤 그 시점 값으로 굳힌다.
 */
var VERSION = 5;
var SRC_TAB = "DB추출용";   // 홈페이지·메타 CSV 를 누적하는 원본 (A~N: id … phone_number)
var CRM_TAB = "CRM관리";    // CRM 팀이 상태를 적는 한 장
var CRM_HEAD = ["수집일", "수집 채널", "이름", "전화번호", "현재 상태", "1차 콜 · 입력", "2차 콜 · 입력", "3차 콜 · 입력", "상담 메모 · 입력", "방문경로", "신청폼", "중복 / 재신청", "추출용 행", "신청 ID"];
var CRM_COL = { date: 0, channel: 1, name: 2, phone: 3, status: 4, c1: 5, c2: 6, c3: 7, memo: 8, platform: 9, form: 10, dup: 11, srcRow: 12, id: 13 };
// 수식으로 만든 보기용 탭 이름. 보기용 탭을 더 만들면 여기에 추가하거나 탭을 숨긴다 (lib/crm/parse.ts DERIVED_TABS 와 같게)
var SKIP_TABS = ["DB관리", "일별현황", "자동정리", "사용안내"]; // CRM관리_백업_… 탭은 숨겨 두므로 자동 제외
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
    try { syncCrm(); } catch (err) { console.error("syncCrm 실패: " + err); } // 동기화가 실패해도 어드민 캐시는 채운다
    writeCache_(buildJson_("cache"));
  } finally {
    lock.releaseLock();
  }
}

/** 지금 바로 CRM관리를 맞추고 캐시도 새로 채우고 싶을 때 편집기에서 실행 */
function syncCrmNow() {
  syncCrm();
  writeCache_(buildJson_("cache"));
  Logger.log("완료: CRM관리 동기화 + 캐시 갱신");
}

/**
 * DB추출용 → CRM관리. 신청 ID(없으면 전화번호)가 CRM관리에 없는 행만 맨 아래에 덧붙인다. 기존 행은 손대지 않는다.
 *  - 수집일: created_time 의 한국 날짜 / 수집 채널: 홈페이지(id 가 UUID 또는 form_id rsc-website) · 메타(id 가 l:…)
 *  - 현재 상태(E): 3차→2차→1차 중 마지막에 적힌 것 (행마다 수식) / 중복·재신청(L): 같은 전화가 앞에 있으면 재신청, 다른 채널이면 채널 중복
 */
function syncCrm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName(SRC_TAB);
  if (!src) return;
  var crm = ss.getSheetByName(CRM_TAB);
  if (!crm) { crm = ss.insertSheet(CRM_TAB); crm.getRange(1, 1, 1, CRM_HEAD.length).setValues([CRM_HEAD]).setFontWeight("bold"); crm.setFrozenRows(1); }
  takeOverCrm_(ss, crm);

  var sv = src.getDataRange().getDisplayValues();
  if (sv.length < 2) return;
  var sh = sv[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = function (name) { return sh.indexOf(name); };
  var S = { id: col("id"), created: col("created_time"), formId: col("form_id"), form: col("form_name"), platform: col("platform"), name: col("full_name"), phone: col("phone_number") };
  if (S.phone < 0 && S.name < 0) return;

  var cv = crm.getDataRange().getDisplayValues();
  var crmLast = cv.length;
  while (crmLast > 1 && cv[crmLast - 1].every(function (c) { return c === ""; })) crmLast--;
  var known = {};        // 신청 키 → true
  var seenPhone = {};    // 전화 숫자 → 채널 목록
  for (var i = 1; i < crmLast; i++) {
    var row = cv[i];
    var k = keyOf_(row[CRM_COL.id], row[CRM_COL.phone]);
    if (k) known[k] = true;
    var pd = digits_(row[CRM_COL.phone]);
    if (pd) { seenPhone[pd] = seenPhone[pd] || []; seenPhone[pd].push(row[CRM_COL.channel]); }
  }

  var add = [];
  for (var r = 1; r < sv.length; r++) {
    var v = sv[r];
    var id = S.id >= 0 ? String(v[S.id]).trim() : "";
    var phone = S.phone >= 0 ? String(v[S.phone]).trim() : "";
    var key = keyOf_(id, phone);
    if (!key || known[key]) continue;
    known[key] = true;
    var formId = S.formId >= 0 ? String(v[S.formId]).trim() : "";
    var form = S.form >= 0 ? String(v[S.form]).trim() : "";
    var channel = channelOf_(id, formId, form);
    var d = digits_(phone);
    var before = d ? (seenPhone[d] || []) : [];
    var dup = before.length === 0 ? "신규" : (before.indexOf(channel) < 0 ? "채널 중복" : "재신청");
    if (d) { seenPhone[d] = before.concat([channel]); }
    var platform = S.platform >= 0 ? String(v[S.platform]).trim().toLowerCase() : "";
    add.push([
      kstDay_(S.created >= 0 ? v[S.created] : ""), channel, S.name >= 0 ? v[S.name] : "", phone, "",
      "", "", "", "",
      platform === "ig" ? "인스타그램" : platform === "fb" ? "페이스북" : platform, form, dup, r + 1, id
    ]);
  }
  if (!add.length) return;
  var start = crmLast + 1;
  crm.getRange(start, 1, add.length, CRM_HEAD.length).setValues(add);
  // E열(현재 상태): 3차 → 2차 → 1차 순으로 마지막에 적힌 것
  var f = [];
  for (var j = 0; j < add.length; j++) f.push(['=IF(RC[3]<>"",RC[3],IF(RC[2]<>"",RC[2],RC[1]))']);
  crm.getRange(start, CRM_COL.status + 1, add.length, 1).setFormulasR1C1(f);
  console.log("CRM관리에 " + add.length + "행 추가");
}

/** CRM관리가 수식(ARRAYFORMULA 등)으로 차 있으면 백업 탭을 만든 뒤 지금 보이는 값으로 굳힌다. 한 번만 일어난다 */
function takeOverCrm_(ss, crm) {
  var lastRow = Math.max(crm.getLastRow(), 1);
  var probe = crm.getRange(1, 1, Math.min(lastRow, 3), CRM_HEAD.length).getFormulas();
  var hasFormula = false;
  for (var i = 0; i < probe.length; i++) for (var c = 0; c < probe[i].length; c++) if (c !== CRM_COL.status && probe[i][c]) hasFormula = true;
  if (!hasFormula) return;
  var stamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd_HHmm");
  crm.copyTo(ss).setName(CRM_TAB + "_백업_" + stamp).hideSheet();
  var range = crm.getDataRange();
  var vals = range.getDisplayValues();
  var last = vals.length;
  while (last > 1 && vals[last - 1].every(function (x) { return x === ""; })) last--;
  range.clearContent();
  crm.getRange(1, 1, last, vals[0].length).setValues(vals.slice(0, last));
  if (last > 1) {
    var f = [];
    for (var j = 0; j < last - 1; j++) f.push(['=IF(RC[3]<>"",RC[3],IF(RC[2]<>"",RC[2],RC[1]))']);
    crm.getRange(2, CRM_COL.status + 1, last - 1, 1).setFormulasR1C1(f);
  }
  console.log("CRM관리를 값으로 굳혔습니다 (백업: " + CRM_TAB + "_백업_" + stamp + ")");
}

function keyOf_(id, phone) {
  var i = String(id || "").trim();
  if (i) return "id:" + i;
  var d = digits_(phone);
  return d ? "p:" + d : "";
}
function digits_(s) { return String(s || "").replace(/\D/g, ""); }
function channelOf_(id, formId, form) {
  if (/^l:\d+/.test(id) || /^f:\d+/.test(formId)) return "메타";
  if (formId === "rsc-website" || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) || /웹사이트/.test(form)) return "홈페이지";
  return "";
}
function kstDay_(s) {
  var t = String(s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  var d = new Date(t);
  return isNaN(d.getTime()) ? t : Utilities.formatDate(d, "Asia/Seoul", "yyyy-MM-dd");
}

/** 한 번만 실행: refreshCache 를 1분마다 돌리는 트리거를 만들고 캐시를 바로 채운다 */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "refreshCache") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("refreshCache").timeBased().everyMinutes(1).create();
  refreshCache();
  Logger.log("완료: 1분마다 CRM관리를 맞추고 시트를 미리 읽습니다. 이제 배포 → 배포 관리 → 새 버전을 진행하세요.");
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
