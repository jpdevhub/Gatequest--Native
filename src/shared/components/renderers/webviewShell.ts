/**
 * webviewShell — builds the HTML document that renders question content.
 *
 * One document per WebView instance. KaTeX is inlined (offline), and the page
 * reports its height back so the native side can size the WebView exactly.
 */
import { katexScript, katexStyle } from './katexAssets';

// Mirrors src/shared/theme/material.ts so the rendered document sits on the
// same surface ladder as the native chrome around it.
export const theme = {
    bg: 'transparent',
    text: '#E7EDF5',
    muted: '#A8B6C9',
    border: '#2B3A50',
    card: '#151F33',
    accent: '#8AB4FF',
    correctBg: '#14512C',
    correctBorder: '#7FD69A',
    wrongBg: '#5C1A16',
    wrongBorder: '#FFB4AB',
    selectedBg: '#2B4C87',
    selectedBorder: '#8AB4FF',
};

const baseCss = (fontSize: number) => `
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: transparent;
    color: ${theme.text};
    font-family: -apple-system, "Roboto", system-ui, sans-serif;
    font-size: ${fontSize}px;
    line-height: 1.6;
    overflow-x: hidden;
    word-break: break-word;
    -webkit-text-size-adjust: 100%;
  }
  #root { padding: 0; }
  b, strong { font-weight: 700; color: #f1f5f9; }
  ul { margin: 8px 0; padding-left: 22px; }
  li { margin: 4px 0; }
  sub, sup { font-size: 0.75em; }

  .km { display: inline-block; vertical-align: middle; }
  .kb { display: block; margin: 10px 0; overflow-x: auto; overflow-y: hidden; }
  .katex { color: ${theme.text}; font-size: 1.05em; }
  .katex-display { margin: 0; }

  .img-wrap { display: flex; justify-content: center; margin: 14px 0; }
  .img-wrap img {
    max-width: 100%; height: auto; border-radius: 8px;
    background: #fff; padding: 6px;
  }

  .code-wrap { margin: 12px 0; border: 1px solid ${theme.border}; border-radius: 10px; overflow: hidden; background: #0b1220; }
  .code-lang { font: 600 11px/1 ui-monospace, Menlo, monospace; color: ${theme.muted}; padding: 8px 12px; border-bottom: 1px solid ${theme.border}; text-transform: uppercase; letter-spacing: 0.08em; }
  pre.code { margin: 0; padding: 12px; overflow-x: auto; }
  pre.code code { font-family: ui-monospace, Menlo, "Roboto Mono", monospace; font-size: 13px; line-height: 1.55; color: #cbd5e1; white-space: pre; }
  code.ic { font-family: ui-monospace, Menlo, monospace; font-size: 0.9em; background: rgba(148,163,184,0.16); padding: 1px 5px; border-radius: 4px; color: #93c5fd; }
  .tk-kw { color: #c084fc; }
  .tk-str { color: #86efac; }
  .tk-com { color: #64748b; font-style: italic; }
  .tk-num { color: #fbbf24; }

  .tbl-scroll { overflow-x: auto; margin: 12px 0; -webkit-overflow-scrolling: touch; }
  .tbl-caption { font-weight: 600; font-size: 0.9em; color: ${theme.muted}; margin-bottom: 6px; }
  table { border-collapse: collapse; min-width: 100%; font-size: 0.9em; }
  th, td { border: 1px solid ${theme.border}; padding: 8px 12px; text-align: left; white-space: nowrap; }
  th { background: rgba(148,163,184,0.1); font-weight: 600; color: #f1f5f9; }
  tbody tr:nth-child(even) { background: rgba(148,163,184,0.04); }

  .opts { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
  .opt {
    display: flex; align-items: flex-start; gap: 12px;
    min-height: 48px;
    padding: 14px 16px; border: 1px solid ${theme.border}; border-radius: 12px;
    background: ${theme.card};
    transition: background-color .18s ease, border-color .18s ease, transform .12s ease;
  }
  .opt:active { transform: scale(0.99); }
  .opt.selected { border-color: ${theme.selectedBorder}; background: ${theme.selectedBg}; }
  .opt.correct { border-color: ${theme.correctBorder}; background: ${theme.correctBg}; }
  .opt.wrong { border-color: ${theme.wrongBorder}; background: ${theme.wrongBg}; }
  .opt.locked { opacity: 1; }
  .opt .mark {
    flex: 0 0 auto; width: 22px; height: 22px; margin-top: 1px;
    border: 2px solid ${theme.border}; display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 12px; font-weight: 700;
    transition: background-color .18s ease, border-color .18s ease;
  }
  .opt .mark.radio { border-radius: 50%; }
  .opt .mark.check { border-radius: 6px; }
  .opt.selected .mark { border-color: ${theme.selectedBorder}; background: ${theme.selectedBorder}; }
  .opt.correct .mark { border-color: ${theme.correctBorder}; background: ${theme.correctBorder}; }
  .opt.wrong .mark { border-color: ${theme.wrongBorder}; background: ${theme.wrongBorder}; }
  .opt .label { flex: 0 0 auto; font: 600 12px/22px ui-monospace, Menlo, monospace; color: ${theme.muted}; }
  .opt .body { flex: 1 1 auto; min-width: 0; }
`;

const runtime = `
  function renderMath(root) {
    var nodes = root.querySelectorAll('.km:not([data-done]), .kb:not([data-done])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      try {
        katex.render(el.getAttribute('data-m') || '', el, {
          displayMode: el.classList.contains('kb'),
          throwOnError: false,
          strict: false,
          trust: true,
        });
      } catch (e) {
        el.textContent = el.getAttribute('data-m') || '';
      }
      el.setAttribute('data-done', '1');
    }
  }

  function send(payload) {
    var msg = JSON.stringify(payload);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    else if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
  }

  var lastHeight = 0;
  function postHeight() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h > 0 && h !== lastHeight) {
      lastHeight = h;
      send({ type: 'height', height: h });
    }
  }
  window.postHeight = postHeight;

  function boot() {
    renderMath(document);
    postHeight();
    // Images and fonts settle after first paint.
    setTimeout(postHeight, 60);
    setTimeout(postHeight, 300);
    setTimeout(postHeight, 900);
    if (window.ResizeObserver) {
      new ResizeObserver(postHeight).observe(document.documentElement);
    }
    document.addEventListener('load', postHeight, true);

    document.addEventListener('click', function (event) {
      var opt = event.target && event.target.closest ? event.target.closest('.opt') : null;
      if (!opt || opt.getAttribute('data-locked') === '1') return;
      send({ type: 'select', index: Number(opt.getAttribute('data-i')) });
    });
  }

  // Applied from the native side when selection or reveal state changes.
  window.applyState = function (state) {
    var opts = document.querySelectorAll('.opt');
    for (var i = 0; i < opts.length; i++) {
      var el = opts[i];
      var idx = Number(el.getAttribute('data-i'));
      el.className = 'opt' + (state.classes[idx] ? ' ' + state.classes[idx] : '');
      el.setAttribute('data-locked', state.locked ? '1' : '0');
      var mark = el.querySelector('.mark');
      if (mark) mark.textContent = state.marks[idx] || '';
    }
    postHeight();
  };

  window.addEventListener('message', function (event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type === 'applyState') window.applyState(data.state);
    } catch (e) {
      // Not a message for us.
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot);
`;

/** Wraps rendered body HTML in the full KaTeX-enabled document. */
export function buildDocument(bodyHtml: string, fontSize = 15): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<style>${katexStyle}</style>
<style>${baseCss(fontSize)}</style>
</head>
<body>
<div id="root">${bodyHtml}</div>
<script>${katexScript}</script>
<script>${runtime}</script>
</body>
</html>`;
}
