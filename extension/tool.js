// SKCT 연습 도구 — index.html(단독 실행)과 크롬 확장(링커리어 페이지 위 패널)이 같이 쓰는 파일.
// 확장으로 실행되면 페이지 안에 패널로 뜨기 때문에, 클릭해도 문제 창이 포커스를 잃지 않는다.
(() => {
if (document.getElementById('skct-tool-host')) return;
const PANEL = !!globalThis.chrome?.runtime?.id;

const CSS = `
  :host { all:initial; position:fixed; z-index:2147483647; font-family:-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color:#222; font-size:14px; line-height:1.4;
    --line:#d0d4da; --bg:#f4f5f7; --red:#d63031; --blue:#2563eb; --green:#16a34a; }
  :host(.full) { inset:0; }
  :host(.panel) { top:12px; right:12px; width:380px; height:calc(100vh - 24px); border-radius:10px; box-shadow:0 8px 30px rgba(0,0,0,.25); overflow:hidden; }
  :host(.panel.folded) { height:auto; }
  :host(.wide) { top:0 !important; left:0 !important; right:0 !important; bottom:0 !important; width:auto !important; height:auto !important; border-radius:0; }
  * { box-sizing:border-box; }
  [hidden] { display:none !important; }
  .root { height:100%; display:flex; flex-direction:column; background:var(--bg); }
  button { font:inherit; color:inherit; cursor:pointer; border:1px solid var(--line); background:#fff; border-radius:6px; padding:6px 10px; }
  button:disabled { opacity:.4; cursor:default; }
  button.on { background:#222; color:#fff; border-color:#222; }
  button.primary { background:var(--blue); color:#fff; border-color:var(--blue); }

  .grip { display:flex; align-items:center; justify-content:space-between; padding:4px 8px; background:#222; color:#fff; cursor:move; user-select:none; font-size:12px; }
  .grip button { background:none; color:#fff; border:0; padding:0 6px; font-size:16px; }

  #app { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; padding:8px; }
  :host(.folded) .pad, :host(.folded) .calc { display:none; }
  .box { background:#fff; border:1px solid var(--line); border-radius:8px; }

  .bar { padding:10px 12px; }
  .bar .info { display:flex; justify-content:space-between; gap:8px; color:#555; white-space:nowrap; }
  .bar .sub { margin:-4px 0 8px; font-size:12px; color:#777; }
  :host(:not(.one)) .bar .sub { display:none; }
  .bar .clocks { display:flex; justify-content:space-between; align-items:baseline; margin:4px 0 8px; font-variant-numeric:tabular-nums; }
  .bar .clocks b { font-size:28px; }
  .bar .clocks small { font-size:12px; color:#777; margin-right:6px; }
  .over { color:var(--red); }
  /* 1줄: 시작 · 랩 (크게) / 2줄: 영역 종료 · 결과 · 초기화 (작게) */
  .bar .btns { display:grid; grid-template-columns:repeat(6, 1fr); gap:6px; }
  .bar .btns button { grid-column:span 2; padding:5px 4px; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bar .btns #btnStart, .bar .btns #btnLap { grid-column:span 3; padding:8px 4px; font-size:14px; font-weight:600; }
  :host(.one) .bar .btns #btnStart { grid-column:span 6; }
  :host(.one) .bar .btns #btnRes, :host(.one) .bar .btns #btnReset { grid-column:span 3; }

  .pad { flex:1; min-height:0; display:flex; flex-direction:column; }
  .pad .tabs { display:flex; gap:6px; padding:6px; border-bottom:1px solid var(--line); }
  .pad .tools { margin-left:auto; display:flex; gap:6px; }
  .pad textarea { flex:1; border:0; resize:none; padding:10px; font:inherit; font-size:15px; outline:none; border-radius:0 0 8px 8px; }
  .pad canvas { flex:1; min-height:0; width:100%; touch-action:none; cursor:crosshair; }

  .calc { height:min(40vh, 330px); display:flex; flex-direction:column; padding:8px; gap:6px; }
  .calc.kbd { outline:2px solid var(--blue); }
  :host(.one) #btnLap, :host(.one) #btnEnd { display:none; }
  .calc .screen { text-align:right; padding:4px 8px; background:var(--bg); border-radius:6px; font-variant-numeric:tabular-nums; }
  .calc .expr { font-size:13px; color:#777; min-height:18px; }
  .calc .val { font-size:26px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .calc .keys { flex:1; display:grid; grid-template-columns:repeat(4,1fr); grid-template-rows:repeat(5,1fr); gap:5px; }
  .calc .keys button { font-size:18px; padding:0; }
  .calc .keys .op { background:#eef1f5; }
  .calc .keys .eq { grid-row:span 2; background:var(--blue); color:#fff; border-color:var(--blue); }
  .calc .keys .zero { grid-column:span 2; }

  #res { flex:1; overflow:auto; }
  #res > .in { max-width:900px; margin:0 auto; padding:16px; }
  #res .head { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
  #res .head input, #res .head select { font:inherit; padding:6px 8px; border:1px solid var(--line); border-radius:6px; }
  #res .head .title { flex:1; min-width:200px; font-size:18px; }
  #res .spacer { flex:1; }
  #res .card { padding:14px; margin-bottom:12px; }
  .score { font-size:36px; font-weight:700; }
  .score span { font-size:20px; color:#777; }
  .stats { display:flex; gap:16px; flex-wrap:wrap; color:#555; margin-top:4px; }
  table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
  th, td { padding:6px 8px; border-bottom:1px solid #eee; text-align:left; }
  th { color:#666; font-weight:600; }
  th.barcol { width:30%; }
  .slow td { background:#fff4e5; }
  .tbar { height:6px; background:#cbd5e1; border-radius:3px; }
  .marks button { padding:2px 9px; }
  .marks button.o.on { background:var(--green); border-color:var(--green); }
  .marks button.x.on { background:var(--red); border-color:var(--red); }
  details summary { cursor:pointer; font-weight:600; padding:4px 0; }
  .warn { color:var(--red); font-weight:600; }
  @media print { .noprint, .marks button:not(.on) { display:none !important; } .root { background:#fff; } }
`;

const HTML = `
<div class="root">
  <div class="grip" id="grip" ${PANEL ? '' : 'hidden'}>
    <span id="gripTitle">SKCT 도구 ⠿</span>
    <button id="fold" title="접기/펴기">−</button>
  </div>
  <div id="app">
    <div class="box bar">
      <div class="info"><span id="secName"></span><span id="qNum"></span></div>
      <div class="clocks">
        <span><small>현재 문제</small><b id="qTime">00:00</b></span>
        <span id="remainWrap"><small id="remainLabel">남은 시간</small><b id="remain">15:00</b></span>
      </div>
      <div class="sub" id="sub"></div>
      <div class="btns">
        <button id="btnStart" class="primary"></button>
        <button id="btnLap" title="⌘ + Enter">랩 (⌘↵)</button>
        <button id="btnEnd">영역 종료</button>
        <button id="btnRes">결과</button>
        <button id="btnReset" title="지금 시험 기록을 버리고 처음으로">초기화</button>
      </div>
    </div>
    <div class="box pad">
      <div class="tabs">
        <button data-tab="memo" class="on">메모장</button>
        <button data-tab="draw">그림판</button>
        <div class="tools" id="tools" hidden>
          <button data-tool="pen" class="on">펜</button>
          <button data-tool="eraser">지우개</button>
          <button id="clearCv">전체 지우기</button>
        </div>
      </div>
      <textarea id="memo" placeholder="메모"></textarea>
      <canvas id="cv" hidden></canvas>
    </div>
    <div class="box calc">
      <div class="screen"><div class="expr" id="expr"></div><div class="val" id="val">0</div></div>
      <div class="keys" id="keys">
        <button>C</button><button>←</button><button class="op">÷</button><button class="op">×</button>
        <button>7</button><button>8</button><button>9</button><button class="op">−</button>
        <button>4</button><button>5</button><button>6</button><button class="op">+</button>
        <button>1</button><button>2</button><button>3</button><button class="eq">=</button>
        <button class="zero">0</button><button>.</button>
      </div>
    </div>
  </div>
  <div id="res" hidden></div>
</div>`;

const host = document.createElement('div');
host.id = 'skct-tool-host';
host.className = PANEL ? 'panel' : 'full';
const root = host.attachShadow({ mode: 'open' });
const sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); // 페이지 CSS와 격리
root.adoptedStyleSheets = [sheet];
root.innerHTML = HTML;
document.documentElement.appendChild(host);

const SECTIONS = ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'];
const Q = 20, LIMIT = 15 * 60 * 1000;
const $ = s => root.querySelector(s);
const $$ = s => root.querySelectorAll(s);
const fmt = ms => { const s = Math.floor(Math.abs(ms) / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const today = () => new Date().toLocaleDateString('sv'); // YYYY-MM-DD
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- 패널 이동 / 접기 (확장 모드) ---------- */
const grip = $('#grip');
grip.onpointerdown = e => {
  if (e.target.closest('button, label')) return;
  const r = host.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
  grip.setPointerCapture(e.pointerId);
  grip.onpointermove = m => { host.style.left = m.clientX - dx + 'px'; host.style.top = m.clientY - dy + 'px'; host.style.right = 'auto'; };
  grip.onpointerup = () => grip.onpointermove = null;
};
$('#fold').onclick = () => { $('#fold').textContent = host.classList.toggle('folded') ? '+' : '−'; };

/* ---------- 상태 저장 ---------- */
const newExam = () => ({ title: '', date: today(), sec: 0, phase: 'ready', acc: 0, startedAt: 0,
  sections: SECTIONS.map(name => ({ name, laps: [], marks: Array(Q).fill(''), total: null })) });
const load = k => { try { return JSON.parse(localStorage.getItem('skct-' + k)); } catch { return null; } };
const save = () => { try { localStorage.setItem('skct-exam', JSON.stringify(S)); localStorage.setItem('skct-history', JSON.stringify(H)); } catch {} };
let S = load('exam') || newExam();
let H = load('history') || [];

/* ---------- 스톱워치 / 랩 ---------- */
const cur = () => S.sections[S.sec];
const elapsed = () => S.acc + (S.phase === 'running' ? Date.now() - S.startedAt : 0);

function toggle() {
  if (S.phase === 'finished') return;
  if (S.phase === 'running') { S.acc = elapsed(); S.phase = 'paused'; }
  else { if (S.phase === 'ready') S.acc = 0; S.startedAt = Date.now(); S.phase = 'running'; }
  save(); render();
}
function lap() {
  if (oneMode || S.phase !== 'running') return;
  cur().laps.push(elapsed());
  clearPad();
  if (cur().laps.length >= Q) endSection();
  save(); render();
}
function endSection() {
  const s = cur();
  s.total = elapsed();
  for (let i = s.laps.length; i < Q; i++) s.marks[i] = '-'; // 랩 안 찍은 문제 = 안 품
  S.acc = 0; S.sec++;
  clearPad();
  if (S.sec >= SECTIONS.length) { S.phase = 'finished'; save(); showResults(); }
  else { S.phase = 'running'; S.startedAt = Date.now(); } // 다음 영역 바로 시작
}

function render() {
  if (oneMode) return renderOne();
  $('#qTime').classList.remove('over');
  const done = S.phase === 'finished';
  const s = done ? null : cur();
  const t = done ? 0 : elapsed();
  $('#secName').textContent = done ? '시험 종료' : `${S.sec + 1}/5 ${s.name}${S.phase === 'paused' ? ' (일시정지)' : ''}`;
  $('#qNum').textContent = done ? '' : `${Math.min(s.laps.length + 1, Q)} / ${Q} 번`;
  $('#qTime').textContent = fmt(done ? 0 : t - (s.laps.at(-1) || 0));
  const left = LIMIT - t, over = left < 0;
  $('#remainLabel').textContent = over ? '시간 초과' : '남은 시간';
  $('#remain').textContent = (over ? '+' : '') + fmt(left);
  $('#remainWrap').classList.toggle('over', over);
  $('#btnStart').textContent = done ? '종료됨' : S.phase === 'running' ? '⏸ 일시정지' : S.phase === 'paused' ? '▶ 계속' : `▶ ${s.name} 시작`;
  $('#btnStart').disabled = done;
  $('#btnLap').disabled = S.phase !== 'running';
  $('#btnEnd').disabled = !['running', 'paused'].includes(S.phase);
  $('#btnReset').textContent = '초기화';
}
setInterval(() => { if (S.phase === 'running') render(); }, 200);

$('#btnStart').onclick = () => oneMode ? toggleOne() : toggle();
$('#btnLap').onclick = lap;
$('#btnEnd').onclick = () => {
  if (confirm(`${cur().name} 영역을 끝낼까요? 남은 문제는 '안 품'으로 기록돼요.`)) { endSection(); save(); render(); }
};
$('#btnRes').onclick = showResults;
$('#btnReset').onclick = () => {
  if (oneMode) return resetOneSection();
  if (!confirm('지금 시험 기록을 저장하지 않고 처음으로 되돌릴까요? (지난 기록은 그대로 남아요)')) return;
  S = newExam(); save(); clearPad(); press('C'); render();
};

/* ---------- 링커리어 문제 번호 읽기 ---------- */
let siteEl = null, siteTotal = 100;
function readSite() {
  // "1/100", "66번 / 100" 모두 인식
  // ponytail: 못 찾으면 매번 전체 DOM을 훑음. 느려지면 카운터 셀렉터를 고정할 것
  if (!siteEl?.isConnected) siteEl = [...document.body.querySelectorAll('*')].filter(e => /^\d+\s*번?\s*\/\s*\d+$/.test(e.textContent.trim())).at(-1);
  const m = siteEl?.textContent.match(/(\d+)\s*번?\s*\/\s*(\d+)/);
  if (m) siteTotal = +m[2];
  return m ? +m[1] : null;
}
// 모의고사(/practice) · 한 문제씩(/onequestions) 화면이면 번호 인식 모드. 그 외 페이지는 수동 시험 모드
const SITE_PAGE = /\/(practice|onequestions)\/(\d+)/;
// 모의고사 화면 배치가 '여러 문제씩'이면 하단 숫자가 문제 번호가 아니라 페이지 번호(1/25)라서 문제별 시간을 나눌 수 없음 → 자동 기록 끄기
// 판단: 하단 숫자의 전체 수가 답안표 문항 수(100)보다 작으면 페이지 번호
let twoUp = false;
if (PANEL) setInterval(() => {
  setOneMode(SITE_PAGE.test(location.pathname));
  if (!oneMode) return;
  const n = readSite();
  const omrRows = document.querySelectorAll('[class*="OMR_practice_OMR__"]').length || 100;
  twoUp = location.pathname.includes('/practice') && n !== null && siteTotal < omrRows;
  if (twoUp) { flushOne(); if ($('#res').hidden) render(); }
  else trackOne(n);
}, 300);

/* ---------- 번호 인식 모드: 화면의 문제 번호로 영역 판단, 보고 있는 문제에 시간을 쌓음 ---------- */
const PACE = LIMIT / Q; // 문제당 45초
const secOf = n => SECTIONS[Math.floor((n - 1) / Q)] ?? ''; // 100문제가 영역 순서대로 20개씩이라고 가정
const examId = () => location.pathname.match(SITE_PAGE)?.[2] ?? '';
// oneBase: 이 문제를 예전에 보며 이미 기록된 시간. 다시 오면 거기서부터 이어서 센다
let oneMode = false, oneNum = null, oneExam = '', oneStart = 0, oneAcc = 0, oneBase = 0, onePaused = false;
const O = load('one') || { log: [] };
const saveOne = () => { try { localStorage.setItem('skct-one', JSON.stringify(O)); } catch {} };
const oneElapsed = () => oneAcc + (onePaused || !oneNum ? 0 : Date.now() - oneStart);
// 같은 모의고사 · 같은 영역에 쓴 시간 합계 (다시 본 문제 포함)
const qTotal = (exam, n) => O.log.filter(r => r.exam === exam && r.n === n).reduce((a, r) => a + r.ms, 0);
const secTotal = (exam, sec) => O.log.filter(r => r.exam === exam && secOf(r.n) === sec).reduce((a, r) => a + r.ms, 0);

// 보던 문제를 그 문제의 모의고사 번호로 기록 (1초 미만으로 스쳐간 문제는 제외)
function flushOne() {
  const ms = oneElapsed() - oneBase; // 이번에 본 시간만 기록
  if (oneNum && ms > 1000) { O.log.unshift({ exam: oneExam, n: oneNum, ms, at: Date.now() }); saveOne(); }
  oneNum = null;
}
function setOneMode(on) {
  if (on === oneMode) return;
  flushOne(); // 번호 인식 모드를 떠날 때 마지막 문제도 기록
  oneMode = on;
  host.classList.toggle('one', on);
  $('#gripTitle').textContent = !on ? 'SKCT 도구 ⠿' : location.pathname.includes('/practice') ? 'SKCT 도구 · 모의고사 ⠿' : 'SKCT 도구 · 한 문제씩 ⠿';
  if (!$('#res').hidden) hideResults(); else render();
}
// 탭 닫기 · 새로고침 때는 보던 문제를 임시 저장 → 다시 열었을 때 같은 문제면 이어서 세고, 다른 문제면 그때 기록
addEventListener('pagehide', () => {
  if (!oneMode || !oneNum) return;
  try { localStorage.setItem('skct-one-cur', JSON.stringify({ exam: oneExam, n: oneNum, ms: oneElapsed() - oneBase, paused: onePaused, at: Date.now() })); } catch {}
});
function resumeOne() {
  const saved = load('one-cur');
  if (!saved) return;
  try { localStorage.removeItem('skct-one-cur'); } catch {}
  if (saved.exam === oneExam && saved.n === oneNum) { oneAcc = oneBase + saved.ms; onePaused = saved.paused; }
  else if (saved.ms > 1000) { O.log.unshift({ exam: saved.exam, n: saved.n, ms: saved.ms, at: saved.at }); saveOne(); }
}
function toggleOne() {
  if (onePaused) oneStart = Date.now(); else oneAcc = oneElapsed();
  onePaused = !onePaused;
  render();
}
function trackOne(n) {
  // 번호가 바뀌거나, 번호가 같아도 모의고사가 바뀌면 새 문제
  if (n && (n !== oneNum || examId() !== oneExam)) {
    flushOne();
    oneNum = n; oneExam = examId(); oneStart = Date.now(); clearPad(); // 일시정지 상태는 그대로 유지
    oneAcc = oneBase = qTotal(oneExam, n); // 전에 본 문제면 그 시간부터 이어서
    resumeOne();
  }
  if ($('#res').hidden) render();
}
function renderOne() {
  const t = oneElapsed(), prev = O.log[0], sec = oneNum ? secOf(oneNum) : '';
  const total = oneNum ? secTotal(oneExam, sec) + t - oneBase : 0;
  $('#secName').textContent = twoUp ? '여러 문제 배치 · 자동 기록 꺼짐' : (sec || '문제 번호 찾는 중') + (onePaused ? ' · ⏸ 일시정지' : '');
  $('#qNum').textContent = oneNum ? `${oneNum} / ${siteTotal} 번` : '';
  $('#sub').textContent = prev ? `직전 ${prev.n}번 · 총 ${fmt(qTotal(prev.exam, prev.n))}` : '';
  $('#qTime').textContent = fmt(t);
  $('#qTime').classList.toggle('over', t > PACE);
  $('#remainLabel').textContent = sec ? `${sec} 누적` : '';
  $('#remain').textContent = sec ? fmt(total) : '';
  $('#remainWrap').classList.toggle('over', total > LIMIT);
  $('#btnStart').textContent = onePaused ? '▶ 계속' : '⏸ 일시정지';
  $('#btnStart').disabled = false;
  $('#btnReset').textContent = '누적 초기화';
}
// 지금 보는 모의고사 · 영역의 기록을 지우고 현재 문제도 0부터
function resetOneSection() {
  if (!oneNum) return;
  const sec = secOf(oneNum);
  if (!confirm(`#${oneExam} ${sec} 누적 시간을 0으로 초기화할까요? (이 영역의 문제별 기록도 지워져요)`)) return;
  O.log = O.log.filter(r => !(r.exam === oneExam && secOf(r.n) === sec));
  saveOne(); oneAcc = oneBase = 0; oneStart = Date.now(); render();
}
function renderOneResults() {
  // 모의고사 · 영역별로 묶기. 같은 문제를 여러 번 봤으면 시간을 합친다
  const groups = {};
  O.log.forEach(r => {
    const g = groups[r.exam + '|' + secOf(r.n)] ??= { exam: r.exam, sec: secOf(r.n), qs: {} };
    g.qs[r.n] = (g.qs[r.n] || 0) + r.ms;
  });
  const rows = Object.values(groups).map(g => {
    const times = Object.values(g.qs), total = times.reduce((a, b) => a + b, 0);
    return { ...g, count: times.length, total, avg: total / times.length, slow: times.filter(t => t > PACE).length };
  }).sort((a, b) => a.exam.localeCompare(b.exam) || SECTIONS.indexOf(a.sec) - SECTIONS.indexOf(b.sec));

  $('#res').innerHTML = `<div class="in">
  <div class="head noprint"><button id="back">← 돌아가기</button><span class="spacer"></span><button id="clearLog">기록 지우기</button></div>
  <div class="box card">
    <b>영역별 소요 시간</b> · 기준: 영역 15분, 문제당 45초
    <table>
      <tr><th>모의고사</th><th>영역</th><th>푼 문제 수</th><th>총 시간</th><th>문제당 평균</th><th>45초 초과</th></tr>
      ${rows.map(g => `<tr>
        <td>#${esc(g.exam)}</td><td>${g.sec}</td><td>${g.count} / ${Q}</td>
        <td>${fmt(g.total)}${g.total > LIMIT ? ` <span class="warn">⚠️ +${fmt(g.total - LIMIT)}</span>` : ''}</td>
        <td>${fmt(g.avg)}</td><td>${g.slow}</td></tr>`).join('') || '<tr><td colspan="6">아직 기록이 없어요</td></tr>'}
    </table>
  </div>
  <div class="box card">
    <b>문제별 기록</b> (최근 순)
    <table>
      <tr><th>모의고사</th><th>번호</th><th>영역</th><th>소요 시간</th><th>푼 시각</th></tr>
      ${O.log.map(r => `<tr class="${r.ms > PACE ? 'slow' : ''}">
        <td>#${esc(r.exam)}</td><td>${r.n}</td><td>${secOf(r.n)}</td><td>${fmt(r.ms)}</td><td>${new Date(r.at).toLocaleString('ko')}</td></tr>`).join('')}
    </table>
  </div></div>`;
  $('#back').onclick = hideResults;
  $('#clearLog').onclick = () => { if (confirm('문제별 시간 기록을 모두 지울까요?')) { O.log = []; saveOne(); renderOneResults(); } };
}

/* ---------- 메모장 / 그림판 ---------- */
const memo = $('#memo'), cv = $('#cv'), ctx = cv.getContext('2d');
let tool = 'pen', last = null;

$$('[data-tab]').forEach(b => b.onclick = () => {
  $$('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
  const draw = b.dataset.tab === 'draw';
  memo.hidden = draw; cv.hidden = !draw; $('#tools').hidden = !draw;
});
$$('[data-tool]').forEach(b => b.onclick = () => {
  tool = b.dataset.tool;
  $$('[data-tool]').forEach(x => x.classList.toggle('on', x === b));
});
const clearCanvas = () => ctx.clearRect(0, 0, cv.width, cv.height);
const clearPad = () => { memo.value = ''; clearCanvas(); };
$('#clearCv').onclick = clearCanvas;

// 캔버스 크기를 화면에 맞추되, 리사이즈 때 그린 내용 유지
new ResizeObserver(() => {
  const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
  if (!r.width) return;
  const tmp = document.createElement('canvas');
  tmp.width = cv.width; tmp.height = cv.height;
  tmp.getContext('2d').drawImage(cv, 0, 0);
  cv.width = r.width * d; cv.height = r.height * d;
  ctx.drawImage(tmp, 0, 0);
  ctx.setTransform(d, 0, 0, d, 0, 0);
}).observe(cv);

function stroke(e) {
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.lineWidth = tool === 'eraser' ? 22 : 2;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
  last = [e.offsetX, e.offsetY];
}
cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); last = [e.offsetX, e.offsetY]; stroke(e); };
cv.onpointermove = e => { if (last) stroke(e); };
cv.onpointerup = cv.onpointercancel = () => last = null;

/* ---------- 계산기 (윈도우 기본 계산기처럼 즉시 계산) ---------- */
let val = '0', acc = null, op = null, fresh = true;
const round = x => +x.toPrecision(12); // 0.1+0.2 = 0.3
const calc = (a, o, b) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b;
const withCommas = s => s.replace(/^(-?\d+)/, i => i.replace(/\B(?=(\d{3})+(?!\d))/g, ','));

function press(k) {
  if (/\d/.test(k)) { val = fresh || val === '0' ? k : val + k; fresh = false; }
  else if (k === '.') { if (fresh) { val = '0.'; fresh = false; } else if (!val.includes('.')) val += '.'; }
  else if (k === 'C') { val = '0'; acc = op = null; fresh = true; }
  else if (k === '←') { if (!fresh) { val = val.slice(0, -1); if (val === '' || val === '-') val = '0'; } }
  else if ('+−×÷'.includes(k)) {
    if (op && !fresh) { acc = round(calc(acc, op, +val)); val = String(acc); }
    else if (!op) acc = +val;
    op = k; fresh = true;
  }
  else if (k === '=' && op) { val = String(round(calc(acc, op, +val))); acc = op = null; fresh = true; }
  if (!isFinite(+val)) { val = '0'; acc = op = null; fresh = true; $('#val').textContent = '오류'; $('#expr').textContent = ''; return; }
  $('#val').textContent = withCommas(val);
  $('#expr').textContent = op ? `${withCommas(String(acc))} ${op}` : '';
}
$('#keys').onclick = e => { if (e.target.tagName === 'BUTTON') press(e.target.textContent); };

// 자체 점검: 계산기 로직이 깨지면 콘솔에 에러
[['0.1+0.2=', '0.3'], ['12×3−6÷2=', '15'], ['5÷0=', '0'], ['123←←4=', '14']].forEach(([keys, want]) => {
  press('C'); [...keys.replace('=', '')].forEach(press); if (keys.endsWith('=')) press('=');
  console.assert(val === want, `계산기: ${keys} → ${val}, 기대값 ${want}`);
});
press('C');

/* ---------- 키보드 ---------- */
// 패널에 포커스가 있거나 계산기 위에 마우스가 있으면 키 입력을 도구가 가져가고,
// 문제 페이지 단축키(1~5 선지 선택, Enter 채점)로 새지 않게 막는다.
let calcHover = false;
const calcBox = $('.calc');
calcBox.onpointerenter = () => { calcHover = true; calcBox.classList.add('kbd'); };
calcBox.onpointerleave = () => { calcHover = false; calcBox.classList.remove('kbd'); };
const inTool = () => document.activeElement === host || calcHover;
const KEYMAP = { '+': '+', '-': '−', '*': '×', '/': '÷', 'Enter': '=', '=': '=', 'Backspace': '←', 'Escape': 'C', 'Delete': 'C', '.': '.' };
window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); lap(); return; }
  if (PANEL && !inTool()) return;
  if (PANEL) e.stopPropagation();
  const t = e.composedPath()[0];
  if (e.metaKey || e.ctrlKey || e.altKey || ['TEXTAREA', 'INPUT', 'SELECT'].includes(t.tagName) || !$('#res').hidden) return;
  const k = /^\d$/.test(e.key) ? e.key : KEYMAP[e.key];
  if (k) { e.preventDefault(); press(k); }
}, true);
['keyup', 'keypress'].forEach(type => window.addEventListener(type, e => { if (PANEL && inTool()) e.stopPropagation(); }, true));

/* ---------- 결과 ---------- */
let view = S; // 지금 보고 있는 시험 (현재 or 지난 기록)

function showResults() { view = S; $('#app').hidden = true; $('#res').hidden = false; host.classList.add('wide'); oneMode ? renderOneResults() : renderResults(); $('#res').scrollTop = 0; }
function hideResults() { $('#res').hidden = true; $('#app').hidden = false; host.classList.remove('wide'); render(); }

function renderResults() {
  const E = view;
  let tot = 0, cnt = { o: 0, x: 0, '-': 0, '': 0 };
  const secs = E.sections.map(s => {
    const times = s.laps.map((t, i) => t - (s.laps[i - 1] || 0));
    const total = s.total ?? (s.laps.at(-1) || 0);
    const marks = s.marks.map((m, i) => i < s.laps.length || m ? m : null); // 아직 안 온 문제는 null
    marks.forEach(m => { if (m !== null) cnt[m]++; });
    const score = s.marks.filter(m => m === 'o').length; tot += score;
    const nums = m => s.marks.map((x, i) => x === m ? i + 1 : 0).filter(Boolean);
    const slow = [...times].sort((a, b) => b - a).slice(0, 3).filter(t => t > 0);
    return { s, times, total, marks, score, wrong: nums('x'), skip: nums('-'), slow, max: Math.max(...times, 1) };
  });

  const opts = [`<option value="-1">현재 시험${S.title ? ' · ' + esc(S.title) : ''}</option>`]
    .concat(H.map((h, i) => `<option value="${i}" ${h === E ? 'selected' : ''}>${esc(h.date)} · ${esc(h.title || '제목 없음')}</option>`)).join('');

  $('#res').innerHTML = `<div class="in">
  <div class="head noprint">
    <button id="back">← 돌아가기</button>
    <select id="hist">${opts}</select>
    <span class="spacer"></span>
    <button id="print" ${PANEL ? 'hidden' : ''}>인쇄 / PDF</button>
    <button id="newExam" class="primary">새 시험</button>
  </div>
  <div class="head">
    <input class="title" id="title" placeholder="모의고사 제목 (예: 해커스 SKCT 1회)" value="${esc(E.title)}">
    <input type="date" id="date" value="${esc(E.date)}">
  </div>

  <div class="box card">
    <div class="score">${tot} <span>/ ${SECTIONS.length * Q}</span></div>
    <div class="stats">
      <span>✅ 정답 ${cnt.o}</span><span>❌ 오답 ${cnt.x}</span><span>⬜ 안 품 ${cnt['-']}</span>
      ${cnt[''] ? `<span class="warn">채점 안 함 ${cnt['']}</span>` : ''}
    </div>
  </div>

  <div class="box card">
    <table>
      <tr><th>영역</th><th>점수</th><th>소요 시간</th><th>시간 초과</th><th>틀린 문제</th><th>안 푼 문제</th></tr>
      ${secs.map(({ s, total, score, wrong, skip }) => `<tr>
        <td>${s.name}</td><td><b>${score}</b> / ${Q}</td><td>${total ? fmt(total) : '-'}</td>
        <td>${total > LIMIT ? `<span class="warn">⚠️ +${fmt(total - LIMIT)}</span>` : total ? '없음' : '-'}</td>
        <td>${wrong.join(', ') || '-'}</td><td>${skip.join(', ') || '-'}</td></tr>`).join('')}
    </table>
  </div>

  ${secs.map(({ s, times, total, marks, slow, max }, si) => `
  <div class="box card"><details open>
    <summary>${s.name} · ${total ? fmt(total) : '미응시'}${total > LIMIT ? ` <span class="warn">⚠️ 시간 초과 +${fmt(total - LIMIT)}</span>` : ''}
      ${times.length ? ` · 문제당 평균 ${fmt(times.reduce((a, b) => a + b, 0) / times.length)}` : ''}</summary>
    <table>
      <tr><th>번호</th><th>소요 시간</th><th class="barcol"></th><th>비고</th><th>채점</th></tr>
      ${marks.map((m, i) => m === null ? '' : `<tr class="${slow.includes(times[i]) ? 'slow' : ''}">
        <td>${i + 1}</td><td>${times[i] != null ? fmt(times[i]) : '-'}</td>
        <td>${times[i] != null ? `<div class="tbar" data-w="${times[i] / max * 100}"></div>` : ''}</td>
        <td>${s.laps[i] > LIMIT ? '<span class="warn">⏰ 15분 이후 풂</span>' : times[i] == null ? '안 품' : ''}</td>
        <td class="marks">
          <button class="o ${m === 'o' ? 'on' : ''}" data-s="${si}" data-q="${i}" data-m="o">O</button>
          <button class="x ${m === 'x' ? 'on' : ''}" data-s="${si}" data-q="${i}" data-m="x">X</button>
          <button class="${m === '-' ? 'on' : ''}" data-s="${si}" data-q="${i}" data-m="-">안 품</button>
        </td></tr>`).join('')}
    </table>
  </details></div>`).join('')}</div>`;

  $$('.tbar').forEach(b => b.style.width = b.dataset.w + '%');
  $('#title').oninput = e => { E.title = e.target.value; save(); };
  $('#date').oninput = e => { E.date = e.target.value; save(); };
  $('#back').onclick = hideResults;
  $('#print').onclick = () => print();
  $('#hist').onchange = e => { view = +e.target.value < 0 ? S : H[+e.target.value]; renderResults(); };
  $('#newExam').onclick = () => {
    if (!confirm('새 시험을 시작할까요? 지금 기록은 지난 기록에 보관돼요.')) return;
    if (S.sections.some(s => s.laps.length || s.total)) H.unshift(S);
    S = newExam(); save(); clearPad(); view = S;
    hideResults();
  };
  $$('.marks button').forEach(b => b.onclick = () => {
    const m = E.sections[b.dataset.s].marks, q = +b.dataset.q;
    m[q] = m[q] === b.dataset.m ? '' : b.dataset.m;
    save(); renderResults();
  });
}

render();
if (S.phase === 'finished') showResults();
})();
