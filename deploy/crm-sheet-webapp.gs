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
 *  v6 (2026-10-27): 백업을 탭 복사 대신 값 복사로 (5,000행 수식 탭 복사가 몇 분 걸리다 실패하던 것)
 *  v7 (2026-10-27): syncCrmNow 도 잠금 사용(1분 자동 작업과 겹침 방지). 겹쳐서 두 번 들어간 신청은 손 입력 없는 복사본만 자동 제거
 *  v8 (2026-10-27): 깨진 행 자가 복구(healCrm_) — #REF! 행 제거, 날짜 숫자(46321) 복원, 현재 상태 수식 복구, 계산 칸을 원본 기준으로 맞춤
 *  v9 (2026-10-27): 전화번호가 두 번 이상이면 CRM관리 D열·DB추출용 phone_number 열을 주황색으로 (조건부 서식)
 */
var VERSION = 9;
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
    try { markDuplicatePhones_(); } catch (err2) { console.error("중복 표시 실패: " + err2); }
    writeCache_(buildJson_("cache"));
  } finally {
    lock.releaseLock();
  }
}

/** 지금 바로 CRM관리를 맞추고 캐시도 새로 채우고 싶을 때 편집기에서 실행. 1분 자동 작업과 겹치지 않게 잠금을 건다 */
function syncCrmNow() {
  var lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    syncCrm();
    markDuplicatePhones_();
    writeCache_(buildJson_("cache"));
    Logger.log("완료: CRM관리 동기화 + 중복 전화 표시 + 캐시 갱신");
  } finally {
    lock.releaseLock();
  }
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
  dedupeCrm_(crm);

  var sv = src.getDataRange().getDisplayValues();
  if (sv.length < 2) return;
  var sh = sv[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = function (name) { return sh.indexOf(name); };
  var S = { id: col("id"), created: col("created_time"), formId: col("form_id"), form: col("form_name"), platform: col("platform"), name: col("full_name"), phone: col("phone_number") };
  if (S.phone < 0 && S.name < 0) return;

  // 원본 행 → 계산 칸 (수집일·채널·이름·전화 / 방문경로·신청폼·추출용 행·신청 ID)
  var srcByKey = {};
  for (var q = 1; q < sv.length; q++) {
    var w = sv[q];
    var qid = S.id >= 0 ? String(w[S.id]).trim() : "";
    var qphone = S.phone >= 0 ? String(w[S.phone]).trim() : "";
    var qkey = keyOf_(qid, qphone);
    if (!qkey || srcByKey[qkey]) continue;
    var qformId = S.formId >= 0 ? String(w[S.formId]).trim() : "";
    var qform = S.form >= 0 ? String(w[S.form]).trim() : "";
    var qplat = S.platform >= 0 ? String(w[S.platform]).trim().toLowerCase() : "";
    srcByKey[qkey] = {
      head: [kstDay_(S.created >= 0 ? w[S.created] : ""), channelOf_(qid, qformId, qform), S.name >= 0 ? w[S.name] : "", qphone],
      tail: [qplat === "ig" ? "인스타그램" : qplat === "fb" ? "페이스북" : qplat, qform, null, q + 1, qid] // null = 중복/재신청 칸은 건드리지 않음
    };
  }
  healCrm_(crm, srcByKey);

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
  for (var j = 0; j < add.length; j++) f.push([STATUS_FORMULA]);
  crm.getRange(start, CRM_COL.status + 1, add.length, 1).setFormulasR1C1(f);
  console.log("CRM관리에 " + add.length + "행 추가 (DB추출용 " + (sv.length - 1) + "행 / CRM관리 " + (crmLast - 1 + add.length) + "행)");
}

var STATUS_FORMULA = '=IF(RC[3]<>"",RC[3],IF(RC[2]<>"",RC[2],RC[1]))';
var isErr_ = function (v) { return /^#(REF|N\/A|VALUE|NAME|DIV\/0|NUM|ERROR)/.test(String(v || "")); };

/**
 * 깨진 행 자가 복구 (매번 실행, 바뀐 칸만 쓴다). 손 입력(F~I)과 셀 노트는 절대 건드리지 않는다.
 *  - 모든 칸이 #REF! 같은 오류인 행(손 입력 없음)은 지운다
 *  - 원본(DB추출용)에 있는 신청은 수집일·채널·이름·전화·방문경로·신청폼·추출용 행·신청 ID 를 원본 기준으로 맞춘다 (46321 같은 날짜 숫자도 복원)
 *  - 현재 상태(E)는 행마다 수식이어야 한다 — 값으로 굳어 있으면("미연락" 등) 수식으로 되돌린다
 */
function healCrm_(crm, srcByKey) {
  var cv = crm.getDataRange().getDisplayValues();
  var last = cv.length;
  while (last > 1 && cv[last - 1].every(function (c) { return c === ""; })) last--;
  if (last < 2) return;
  var fixed = 0;
  var drop = [];
  for (var i = 1; i < last; i++) {
    var row = cv[i];
    var manual = [row[CRM_COL.c1], row[CRM_COL.c2], row[CRM_COL.c3], row[CRM_COL.memo]].some(function (x) { return String(x || "").trim() !== ""; });
    var allErr = [row[CRM_COL.date], row[CRM_COL.name], row[CRM_COL.phone], row[CRM_COL.id]].every(function (x) { return isErr_(x) || String(x || "").trim() === ""; }) && isErr_(row[CRM_COL.id]);
    if (allErr && !manual) {
      var notes = crm.getRange(i + 1, 1, 1, CRM_HEAD.length).getNotes()[0];
      if (!notes.some(function (n) { return n; })) { drop.push(i + 1); continue; }
    }
    var src = srcByKey[keyOf_(row[CRM_COL.id], row[CRM_COL.phone])];
    if (!src) continue;
    var head = [row[CRM_COL.date], row[CRM_COL.channel], row[CRM_COL.name], row[CRM_COL.phone]];
    if (String(head.join("\u0001")) !== String(src.head.join("\u0001"))) { crm.getRange(i + 1, 1, 1, 4).setValues([src.head]); fixed++; }
    var tailNow = [row[CRM_COL.platform], row[CRM_COL.form], row[CRM_COL.dup], row[CRM_COL.srcRow], row[CRM_COL.id]];
    var tailNew = src.tail.map(function (v, j) { return v === null ? (isErr_(tailNow[j]) ? "" : tailNow[j]) : v; });
    if (String(tailNow.join("\u0001")) !== String(tailNew.join("\u0001"))) { crm.getRange(i + 1, CRM_COL.platform + 1, 1, 5).setValues([tailNew]); fixed++; }
  }
  // E열 수식 복구
  var ef = crm.getRange(2, CRM_COL.status + 1, last - 1, 1).getFormulasR1C1();
  var norm = function (f) { return String(f || "").replace(/\s/g, "").toUpperCase(); };
  var fixE = 0;
  for (var e = 0; e < ef.length; e++) if (norm(ef[e][0]) !== norm(STATUS_FORMULA)) fixE++;
  if (fixE) { var fs = []; for (var x = 0; x < last - 1; x++) fs.push([STATUS_FORMULA]); crm.getRange(2, CRM_COL.status + 1, last - 1, 1).setFormulasR1C1(fs); } // 한 번에
  for (var d = drop.length - 1; d >= 0; d--) crm.deleteRow(drop[d]);
  if (fixed || fixE || drop.length) console.log("CRM관리 복구: 칸 " + fixed + "곳 · 상태 수식 " + fixE + "행 · 오류 행 " + drop.length + "개 제거");
}

/**
 * 같은 신청(신청 ID, 없으면 전화)이 CRM관리에 두 번 이상 있으면 뒤의 것을 지운다 — 단, 손 입력(F~I)과 셀 노트가 모두 빈 행만.
 * (실행이 겹쳐 같은 행이 두 번 들어간 경우를 정리. 사람이 적은 내용이 있는 행은 절대 지우지 않는다)
 */
function dedupeCrm_(crm) {
  var cv = crm.getDataRange().getDisplayValues();
  var seen = {};
  var drop = [];
  for (var i = 1; i < cv.length; i++) {
    var row = cv[i];
    var k = keyOf_(row[CRM_COL.id], row[CRM_COL.phone]);
    if (!k) continue;
    if (!seen[k]) { seen[k] = true; continue; }
    var manual = [row[CRM_COL.c1], row[CRM_COL.c2], row[CRM_COL.c3], row[CRM_COL.memo]].some(function (x) { return String(x || "").trim() !== ""; });
    if (manual) continue;
    var notes = crm.getRange(i + 1, 1, 1, CRM_HEAD.length).getNotes()[0];
    if (notes.some(function (n) { return n; })) continue;
    drop.push(i + 1);
  }
  for (var d = drop.length - 1; d >= 0; d--) crm.deleteRow(drop[d]);
  if (drop.length) console.log("CRM관리 중복 " + drop.length + "행 제거 (손 입력 없는 복사본만)");
}

/**
 * CRM관리가 수식(ARRAYFORMULA 등)으로 차 있으면 지금 보이는 값으로 굳힌다. 한 번만 일어난다.
 * 백업은 탭 복사(copyTo)가 아니라 값만 새 탭에 적는다 — 5,000행 수식 탭을 통째로 복사하면 재계산 때문에 몇 분씩 걸리다 실패한다.
 */
function takeOverCrm_(ss, crm) {
  var lastRow = Math.max(crm.getLastRow(), 1);
  var probe = crm.getRange(1, 1, Math.min(lastRow, 3), CRM_HEAD.length).getFormulas();
  var hasFormula = false;
  for (var i = 0; i < probe.length; i++) for (var c = 0; c < probe[i].length; c++) if (c !== CRM_COL.status && probe[i][c]) hasFormula = true;
  if (!hasFormula) return;
  // 1) 지금 보이는 값을 먼저 읽는다 (수식 결과 그대로)
  var range = crm.getDataRange();
  var vals = range.getDisplayValues();
  var last = vals.length;
  while (last > 1 && vals[last - 1].every(function (x) { return x === ""; })) last--;
  var snapshot = vals.slice(0, last);
  // 2) 값만 담은 백업 탭 (숨김). 이름: CRM관리_백업_날짜_시각
  var stamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd_HHmm");
  var backup = ss.insertSheet(CRM_TAB + "_백업_" + stamp);
  backup.getRange(1, 1, snapshot.length, snapshot[0].length).setValues(snapshot);
  backup.hideSheet();
  // 3) 원래 탭의 수식을 지우고 같은 값으로 채운다 (F~I 손 입력과 셀 노트는 그대로)
  range.clearContent();
  crm.getRange(1, 1, last, vals[0].length).setValues(snapshot);
  if (last > 1) {
    var f = [];
    for (var j = 0; j < last - 1; j++) f.push([STATUS_FORMULA]);
    crm.getRange(2, CRM_COL.status + 1, last - 1, 1).setFormulasR1C1(f);
  }
  console.log("CRM관리를 값으로 굳혔습니다 (백업: " + CRM_TAB + "_백업_" + stamp + ")");
}

/**
 * 전화번호가 두 번 이상 나오면 그 칸을 전부 주황색으로 (조건부 서식). CRM관리 D열과 DB추출용 phone_number 열.
 * 규칙이 이미 있으면 다시 만들지 않는다. 하이픈 유무가 달라도 같은 번호로 본다.
 */
var DUP_BG = "#FCE8B2";
var DUP_FG = "#9C4A00";
function markDuplicatePhones_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var crm = ss.getSheetByName(CRM_TAB);
  if (crm) dupRule_(crm, CRM_COL.phone + 1);
  var src = ss.getSheetByName(SRC_TAB);
  if (src && src.getLastRow() > 0) {
    var head = src.getRange(1, 1, 1, src.getLastColumn()).getDisplayValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var pc = head.indexOf("phone_number");
    if (pc >= 0) dupRule_(src, pc + 1);
  }
}
function dupRule_(sheet, col) {
  var letter = colLetter_(col);
  // 같은 글자의 번호가 둘 이상이면 (CSV 는 010-1234-5678 꼴로 일정하다. 가볍게 두려고 숫자만 비교하는 식은 쓰지 않는다)
  var formula = '=AND($' + letter + '2<>"",COUNTIF($' + letter + '$2:$' + letter + ',$' + letter + '2)>1)';
  var rules = sheet.getConditionalFormatRules();
  for (var i = 0; i < rules.length; i++) {
    var bc = rules[i].getBooleanCondition();
    if (bc && bc.getCriteriaValues().some(function (v) { return String(v).indexOf("COUNTIF($" + letter + "$2:$" + letter) >= 0; })) return; // 이미 있음
  }
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground(DUP_BG)
    .setFontColor(DUP_FG)
    .setBold(true)
    .setRanges([sheet.getRange(2, col, Math.max(1, sheet.getMaxRows() - 1), 1)])
    .build();
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
  console.log(sheet.getName() + " " + letter + "열에 중복 전화 표시 규칙 추가");
}
function colLetter_(col) {
  var s = "";
  while (col > 0) { var m = (col - 1) % 26; s = String.fromCharCode(65 + m) + s; col = Math.floor((col - 1) / 26); }
  return s;
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
