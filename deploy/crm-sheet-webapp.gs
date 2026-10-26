/**
 * 라움소셜클럽 콜 현황 — 구글 시트를 어드민(/admin/calls)에 보여주기 위한 Apps Script 웹앱.
 * 붙이는 법은 SETUP.md 4-4. 시트는 읽기만 하고 바꾸지 않는다.
 *
 *  1) 시트에서 확장 프로그램 → Apps Script → 이 파일 내용 전체를 붙여 넣고 저장
 *  2) 왼쪽 톱니(프로젝트 설정) → 스크립트 속성 → 속성 추가: TOKEN = 직접 정한 긴 비밀 문자열. 같은 값을 Vercel 환경변수 CRM_SHEET_TOKEN 에도 넣는다
 *  3) 배포 → 새 배포 → 유형 "웹 앱" → 실행 사용자 "나", 액세스 권한 "모든 사용자" → 배포 → 웹 앱 URL 복사
 *  4) 그 URL 을 Vercel 환경변수 CRM_SHEET_URL 에 넣고 재배포. 스크립트를 고치면 "배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포" 로 다시 배포해야 반영된다 (URL 은 그대로)
 */
function doGet(e) {
  var expected = PropertiesService.getScriptProperties().getProperty("TOKEN");
  var given = (e && e.parameter && e.parameter.token) || "";
  if (!expected || given !== expected) return json_({ ok: false, message: "unauthorized" });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ss.getSheets()
    .filter(function (s) { return !s.isSheetHidden(); })
    .map(function (s) {
      var range = s.getDataRange();
      var rows = range.getNumRows() > 0 ? range.getDisplayValues() : [];
      // 셀에 붙인 노트(노란 말풍선) — 인터뷰 내용이 여기 들어 있다. 노트가 있는 칸만 [행, 열, 내용]
      var notes = [];
      if (range.getNumRows() > 0) {
        var all = range.getNotes();
        for (var r = 0; r < all.length; r++) for (var c = 0; c < all[r].length; c++) if (all[r][c]) notes.push([r, c, all[r][c]]);
      }
      return { name: s.getName(), rows: rows, notes: notes };
    });
  return json_({ ok: true, url: ss.getUrl(), updatedAt: new Date().toISOString(), tabs: tabs });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
