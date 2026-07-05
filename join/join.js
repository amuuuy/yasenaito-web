// /join ランディングの唯一のスクリプト（M-E3）。
// 反射XSS対策の要:
//  (1) ?code= は native (src/domain/friends.ts) と同一の正規化 + regex で検証し、不一致は完全破棄
//  (2) DOM への出力は textContent のみ（innerHTML / document.write は使わない）
//  (3) 「アプリで開く」の href は検証を通過した正準形コードのみで組み立てる
//  (4) CSP (script-src 'self') 前提の外部ファイル。インライン化しないこと（'unsafe-inline' は禁止）
(function () {
  'use strict';

  // native の isPlausibleInviteCode と同一 regex（サーバ生成アルファベット: I/O/0/1 除外）。
  var CODE_RE = /^DIET-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{13}$/;

  // native の normalizeInviteCode と同等: 全角→半角・英数のみ・大文字化・'DIET' 接頭辞を剥がして再結合。
  function normalizeInviteCode(raw) {
    var half = String(raw).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
    });
    var alnum = half.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (alnum.length === 0) return '';
    var body = alnum.indexOf('DIET') === 0 ? alnum.slice(4) : alnum;
    if (body.length === 0) return '';
    return 'DIET-' + body;
  }

  var params = new URLSearchParams(window.location.search);
  var raw = params.get('code');
  var code = raw == null ? '' : normalizeInviteCode(raw);
  var valid = CODE_RE.test(code);

  var invite = document.getElementById('invite');
  var invalid = document.getElementById('invalid');
  var steps = document.getElementById('steps');
  var openApp = document.getElementById('open-app');

  if (valid) {
    // (2) 検証済みコードのみ・textContent のみで描画。
    document.getElementById('code-text').textContent = code;
    invite.hidden = false;
    steps.hidden = false;

    // (3) custom scheme fallback（旧ビルド・ユニバーサルリンク不発時の保険）。
    openApp.setAttribute('href', 'yasenaito://join?code=' + code);
    openApp.hidden = false;

    var copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', function () {
      var done = function () {
        copyBtn.textContent = 'コピーしたよ ✓';
        setTimeout(function () {
          copyBtn.textContent = '合言葉をコピー';
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, function () {
          copyBtn.textContent = '長押しでコピーしてね';
        });
      } else {
        // 古いブラウザ: コード表示は user-select: all なのでタップ→コピーで代替。
        copyBtn.textContent = '長押しでコピーしてね';
      }
    });
  } else {
    // (1) 不正・欠落は理由を問わず一切描画しない（安全側の固定文言のみ）。
    invalid.hidden = false;
  }
})();
