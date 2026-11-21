// Auditoria completa das prévias (feitopelolucas.com.br/previa/<pasta>/).
//
// Uso (na pasta feitopelolucas):
//   node ferramentas/auditoria/auditar.mjs pardal karioka      -> só essas
//   node ferramentas/auditoria/auditar.mjs --todas             -> todas as prévias
//   node ferramentas/auditoria/auditar.mjs --todas --sem-fotos -> sem capturas de tela (mais rápido)
//
// Gera em feitopelolucas/.auditoria/<data-hora>/:
//   relatorio.md    -> erros, avisos e a linha do tempo do selo "aberto agora" de cada prévia
//   relatorio.json  -> o mesmo, para máquina
//   telas/<pasta>-celular.jpg  -> página inteira no celular, em colunas (para revisão visual)
//   telas/<pasta>-desktop.jpg  -> página inteira no computador, em colunas
//
// ERRO = precisa corrigir antes de mandar. AVISO = conferir com o olho (pode ser intencional).
// Usa o Microsoft Edge instalado no Windows (playwright-core, sem baixar navegador).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');            // feitopelolucas/
const PUBLIC = path.join(RAIZ, 'public');
const PREVIA = path.join(PUBLIC, 'previa');
const LUCAS = '5519996515563';
// Fotos 2:1 que já foram olhadas e não são 360° (uma por linha: pasta/fotos/arquivo.jpg).
const ARQ_CONF = path.join(AQUI, 'fotos-conferidas.txt');
const CONFERIDAS = new Set(fs.existsSync(ARQ_CONF) ? fs.readFileSync(ARQ_CONF, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : []);

// ---------- argumentos ----------
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
let pastas = args.filter((a) => !a.startsWith('--'));
if (flag('--todas')) pastas = fs.readdirSync(PREVIA).filter((d) => fs.existsSync(path.join(PREVIA, d, 'index.html'))).sort();
if (!pastas.length) { console.error('Diga quais prévias auditar (nomes das pastas) ou use --todas.'); process.exit(1); }
const semFotos = flag('--sem-fotos');
const carimbo = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const SAIDA = path.join(RAIZ, '.auditoria', carimbo);
fs.mkdirSync(path.join(SAIDA, 'telas'), { recursive: true });

// ---------- dimensões de imagem sem biblioteca ----------
function dimensoes(arq) {
  try {
    const b = fs.readFileSync(arq);
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1], len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + len;
      }
    }
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    }
  } catch {}
  return null;
}

// ---------- 1) checagens estáticas (arquivo) ----------
function estatica(pasta) {
  const dir = path.join(PREVIA, pasta), h = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const E = [], A = [];
  const tit = (h.match(/<title>([^<]+)/) || [])[1] || '';
  const nome = tit.split('·')[0].trim();

  if (!/<meta charset="utf-8">\s*<meta http-equiv="Content-Security-Policy"/i.test(h)) E.push('A meta Content-Security-Policy precisa vir logo depois de <meta charset> (sem ela a publicação falha).');
  if (!/<meta name="robots" content="noindex/.test(h)) E.push('Falta <meta name="robots" content="noindex, nofollow"> (a prévia não pode aparecer no Google).');
  if (!tit) E.push('Falta <title>.'); else if (tit.length > 70) A.push(`Título longo (${tit.length} caracteres).`);
  if (!/<meta name="description"/.test(h)) A.push('Falta meta description.');
  if (!h.includes(`/previa/${pasta}/"`)) E.push('og:url não aponta para /previa/' + pasta + '/.');
  const ogi = (h.match(/og:image" content="([^"]+)"/) || [])[1];
  if (!ogi) E.push('Falta og:image (a prévia fica sem imagem quando o link é mandado no WhatsApp).');
  else {
    const rel = ogi.replace(`https://feitopelolucas.com.br/previa/${pasta}/`, '');
    if (rel === ogi) E.push('og:image aponta para fora da pasta da prévia: ' + ogi);
    else if (!fs.existsSync(path.join(dir, rel))) E.push('og:image não existe: ' + rel);
    else { const d = dimensoes(path.join(dir, rel)); if (d && (d.w !== 1200 || d.h !== 630)) A.push(`og:image tem ${d.w}x${d.h}; o ideal é 1200x630.`); }
  }
  if (!/class="previa"/.test(h)) E.push('Falta a faixa "Prévia · não é o site oficial" no topo.');
  if (!h.includes('wa.me/' + LUCAS)) E.push('Falta o link "Gostou? Fale com o Lucas" (WhatsApp do Lucas).');
  const msgL = (h.match(new RegExp('wa\\.me/' + LUCAS + '\\?text=([^"]+)"')) || [])[1];
  if (msgL) {
    const t = decodeURIComponent(msgL).toLowerCase();
    const genericas = /^(padaria|panificadora|bar|restaurante|lanchonete|lanches|oficina|auto|centro|automotivo|borracharia|barbearia|salão|studio|pet|shop|casa|açaí|pastelaria|mecânica|elétrica|confeitaria|cafe|café|espaço|beleza|hair)$/;
    const chave = nome.toLowerCase().split(/[\s·&-]+/).filter((w) => w.length >= 3 && !genericas.test(w));
    if (chave.length && !chave.some((w) => t.includes(w))) A.push('A mensagem do link do Lucas não cita o nome do negócio: "' + decodeURIComponent(msgL) + '"');
  }
  const h1 = (h.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) E.push(`A página tem ${h1} <h1> (deve ter exatamente 1).`);
  if (!/<iframe[^>]+google\.com\/maps/.test(h)) A.push('Sem mapa do Google.');

  // contatos
  const nums = new Set([...h.matchAll(/wa\.me\/(\d+)/g)].map((m) => m[1])); nums.delete(LUCAS);
  for (const n of nums) if (!/^55\d{10,11}$/.test(n)) E.push('WhatsApp em formato errado: wa.me/' + n);
  if (nums.size > 1) A.push('Mais de um WhatsApp do negócio: ' + [...nums].join(', ') + ' (confirme que é de propósito).');
  for (const m of h.matchAll(/href="tel:([^"]+)"/g)) if (!/^\+55\d{10,11}$/.test(m[1])) E.push('Telefone em formato errado: tel:' + m[1]);
  if (!nums.size && !/href="tel:/.test(h)) A.push('Nenhum WhatsApp nem telefone do negócio na página.');

  // links
  for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) E.push('Link com target=_blank sem rel="noopener": ' + m[0].slice(0, 80));
  for (const m of h.matchAll(/href="#([^"]+)"/g)) if (!h.includes(`id="${m[1]}"`)) E.push('Âncora quebrada: #' + m[1]);
  if (/href=""|href="#"[\s>]/.test(h)) E.push('Link vazio (href="" ou href="#").');
  const ids = {}; for (const m of h.matchAll(/\sid="([^"]+)"/g)) ids[m[1]] = (ids[m[1]] || 0) + 1;
  for (const [k, v] of Object.entries(ids)) if (v > 1) E.push(`id repetido: ${k} (${v}x)`);
  if (/<script[^>]+src="https?:/.test(h)) A.push('Script externo na página (confirme que a CSP permite).');

  // textos esquecidos
  const texto = h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
  for (const [re, o] of [[/lorem ipsum/i, 'lorem ipsum'], [/\bTODO\b|\bFIXME\b|\bXXX\b/, 'TODO/XXX'], [/\bundefined\b|\bNaN\b/, 'undefined/NaN'], [/\[nome|\[cidade|\[telefone/i, 'colchete de modelo'], [/99999-9999|\(00\)|0000-0000/, 'telefone de exemplo'], [/�|Ã[£§©¡³ª­]/, 'acento quebrado']])
    if (re.test(texto)) E.push('Texto esquecido/suspeito: ' + o);

  // imagens
  const usadas = {};
  for (const m of h.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0], src = (t.match(/\ssrc="([^"]+)"/) || [])[1];
    if (!src) { E.push('<img> sem src'); continue; }
    if (/^https?:/.test(src)) { E.push('Imagem externa (a CSP bloqueia): ' + src); continue; }
    if (src.startsWith('data:')) continue;
    const arq = path.join(dir, src);
    if (!fs.existsSync(arq)) { E.push('Imagem não existe: ' + src); continue; }
    usadas[src] = (usadas[src] || 0) + 1;
    if (!/\salt="/.test(t)) E.push('Imagem sem alt: ' + src);
    const W = +(t.match(/\swidth="(\d+)"/) || [])[1], H = +(t.match(/\sheight="(\d+)"/) || [])[1];
    if (!W || !H) A.push('Imagem sem width/height (a página pula ao carregar): ' + src);
    const d = dimensoes(arq);
    if (d && W && H && Math.abs(W / H - d.w / d.h) > 0.03) A.push(`width/height de ${src} (${W}x${H}) não batem com o arquivo (${d.w}x${d.h}).`);
  }
  for (const m of h.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const s = m[1]; if (/^(data:|https?:|#)/.test(s)) continue;
    if (!fs.existsSync(path.join(dir, s))) E.push('Imagem do CSS não existe: ' + s); else usadas[s] = (usadas[s] || 0) + 1;
  }
  for (const [s, n] of Object.entries(usadas)) if (n > 1) A.push(`Foto repetida ${n}x na página: ${s}`);
  const fd = path.join(dir, 'fotos');
  if (fs.existsSync(fd)) for (const x of fs.readdirSync(fd)) {
    const arq = path.join(fd, x), kb = Math.round(fs.statSync(arq).size / 1024);
    if (kb > 450) A.push(`Foto pesada (${kb} KB): fotos/${x} (reduzir para até ~1400 px).`);
    if (!h.includes('fotos/' + x)) A.push('Foto sem uso na pasta: fotos/' + x);
    const d = dimensoes(arq);
    const conferida = CONFERIDAS.has(`${pasta}/fotos/${x}`) || fs.readFileSync(arq).includes('reprojetada-360');
    if (d && d.w >= 1000 && Math.abs(d.w / d.h - 2) < 0.05 && x !== 'compartilhar.jpg' && !conferida)
      A.push(`fotos/${x} tem proporção 2:1: se for foto 360° do Street View (teto curvo, chão dobrado), reprojetar com ferramentas/fotos/reprojetar-360.py.`);
  }
  return { nome, titulo: tit, erros: E, avisos: A };
}

// ---------- servidor local ----------
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const servidor = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const arq = path.join(PUBLIC, p);
  if (!arq.startsWith(PUBLIC) || !fs.existsSync(arq)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

// ---------- 2) checagens no navegador ----------
const navegador = await chromium.launch({ channel: 'msedge' });

async function abrir(pasta, W, H) {
  const ctx = await navegador.newContext({ viewport: { width: W, height: H }, bypassCSP: false, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', isMobile: W < 600, hasTouch: W < 600 });
  const page = await ctx.newPage();
  const problemas = [];
  page.on('pageerror', (e) => problemas.push('Erro de JavaScript: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/google|gstatic|maps|favicon/i.test(m.text())) problemas.push('Console: ' + m.text().slice(0, 200)); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) problemas.push('Arquivo não carregou: ' + r.url().replace(BASE, '')); });
  await page.goto(`${BASE}/previa/${pasta}/`, { waitUntil: 'domcontentloaded' });
  // carrega tudo: imagens preguiçosas e animações de rolagem
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy],iframe[loading=lazy]').forEach((i) => (i.loading = 'eager'));
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    scrollTo(0, 0);
    await Promise.race([Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))), new Promise((r) => setTimeout(r, 8000))]);
    await document.fonts.ready;
  });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200); // mapa do Google desenhar
  return { ctx, page, problemas };
}

// Medições de layout feitas dentro da página.
function medir({ celular }) {
  const E = [], A = [], iw = innerWidth, ih = innerHeight;
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const nomeEl = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  // rolagem para o lado
  if (document.documentElement.scrollWidth > iw + 1) {
    const fora = [...document.body.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.right > iw + 1)) return false; let p = e.parentElement; while (p && p !== document.body) { if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowX)) return false; p = p.parentElement; } return true; });
    E.push(`A página rola para o lado (${document.documentElement.scrollWidth}px numa tela de ${iw}px). Culpados: ${fora.slice(0, 3).map(nomeEl).join(', ')}`);
  }
  // imagens e fontes
  [...document.images].forEach((i) => { if (!i.naturalWidth && vis(i)) E.push('Imagem quebrada: ' + i.getAttribute('src')); });
  [...document.fonts].forEach((f) => { if (f.status === 'error') E.push('Fonte não carregou: ' + f.family); });
  // texto cortado e fora da tela
  document.querySelectorAll('h1,h2,h3,p,li,a,button,span,b,strong,small,figcaption,td').forEach((e) => {
    if (!vis(e) || e.closest('[aria-hidden=true]')) return;
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && /hidden|clip/.test(cs.overflowX) && !/ellipsis/.test(cs.textOverflow)) A.push(`Texto cortado em ${nomeEl(e)}: "${e.textContent.trim().slice(0, 40)}"`);
  });
  const h1 = document.querySelector('h1'); if (h1) { const r = h1.getBoundingClientRect(); if (r.left < 0 || r.right > iw + 1) E.push('O título principal sai da tela.'); }
  // fonte pequena e contraste
  const lum = (c) => { const m = (c.match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return { L: 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]), a: m.length > 3 ? m[3] : 1 }; };
  const fundo = (e) => { while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const l = lum(cs.backgroundColor); if (l && l.a > 0.9) return l.L; e = e.parentElement; } return 1; };
  const midias = [...document.querySelectorAll('img,video,iframe,picture')].filter(vis).map((m) => m.getBoundingClientRect());
  const temImgAtras = (e) => { const r = e.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; return midias.some((m) => cx >= m.left && cx <= m.right && cy >= m.top && cy <= m.bottom); };
  const pequenas = new Set(), baixo = new Map();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const t = n.textContent.trim(); if (t.length < 2 || /^[★☆✓✔•·→←↗\s]+$/.test(t)) continue;
    const e = n.parentElement; if (!vis(e) || e.closest('[aria-hidden=true],iframe')) continue;
    const cs = getComputedStyle(e); if (+cs.opacity === 0) continue;
    const fs = parseFloat(cs.fontSize); if (fs < 12) pequenas.add(`${fs}px "${t.slice(0, 30)}"`);
    const fg = lum(cs.color), bg = fundo(e); if (!fg || bg === null || temImgAtras(e)) continue;
    const cr = (Math.max(fg.L, bg) + 0.05) / (Math.min(fg.L, bg) + 0.05);
    const grande = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
    if (cr < (grande ? 3 : 4.5) - 0.05) baixo.set(t.slice(0, 40), cr.toFixed(2));
  }
  pequenas.forEach((s) => A.push('Letra menor que 12px: ' + s));
  baixo.forEach((v, k) => A.push(`Contraste baixo (${v}:1) em "${k}"`));
  // botões pequenos para o dedo
  if (celular) {
    const peq = [...document.querySelectorAll('a.btn,button,.btn,input[type=submit]')].filter((b) => vis(b) && b.getBoundingClientRect().height < 40 && !b.closest('.previa'));
    if (peq.length) A.push(`${peq.length} botão(ões) com menos de 40px de altura (difícil de tocar): ${peq.slice(0, 3).map((b) => '"' + b.textContent.trim().slice(0, 20) + '"').join(', ')}`);
    // primeira tela: algum contato visível?
    const contato = [...document.querySelectorAll('a[href*="wa.me"],a[href^="tel:"],a.btn')].filter((a) => !a.closest('.previa') && vis(a) && !a.classList.contains('fixo')).map((a) => a.getBoundingClientRect()).filter((r) => r.top >= 0 && r.bottom <= 700);
    if (!contato.length) A.push('Nenhum botão de contato aparece na primeira tela do celular (até 700px).');
  }
  // botão flutuante x rodapé
  const fixo = [...document.querySelectorAll('body *')].find((e) => getComputedStyle(e).position === 'fixed' && /wa\.me|tel:|#/.test(e.getAttribute('href') || '') && !e.closest('.previa'));
  const rod = document.querySelector('footer');
  if (fixo && rod) {
    const corDe = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor; const l = lum(c); if (l && l.a > 0.9) return c; e = e.parentElement; } return 'rgb(255,255,255)'; };
    const ca = corDe(fixo), cb = corDe(rod), a = lum(ca).L, b = lum(cb).L, cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const dist = Math.hypot(...rgb(ca).map((v, i) => v - rgb(cb)[i])); // cores de matiz diferente (rosa x verde) não somem
    const cs = getComputedStyle(fixo); const temAro = /0px 0px 0px [1-9]/.test(cs.boxShadow) || parseFloat(cs.borderTopWidth) >= 2;
    if (cr < 1.6 && dist < 90 && !temAro) A.push(`O botão flutuante tem quase a cor do rodapé (${cr.toFixed(2)}:1) e some no fim da página: dar um aro claro (box-shadow: 0 0 0 2px rgba(255,255,255,.92), ...).`);
  }
  return { erros: E, avisos: A };
}

// Simula o relógio: roda os scripts de horário em cada dia da semana, de meia em meia hora.
function simularHorario(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => /DateTimeFormat|getDay|getHours/.test(s));
  if (!scripts.length) return null;
  const base = new DOMParser().parseFromString(html, 'text/html');
  const bt = [...base.body.querySelectorAll('*')].map((e) => e.textContent);
  const RealDate = Date, IO = function () { return { observe() {}, unobserve() {}, disconnect() {} }; };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  // tabela de horários da página -> esperado
  const abrev = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, 'sáb': 6, sab: 6 };
  const diaDe = (w) => { w = w.toLowerCase(); for (let i = 0; i < 7; i++) if (w.startsWith(DIAS[i].slice(0, 3)) || w.startsWith(DIAS[i])) return i; return abrev[w.slice(0, 3)] ?? null; };
  const tabela = {};
  base.querySelectorAll('tr, li, .linha, .hora, [data-d], [data-dia]').forEach((r) => {
    const cel = r.children.length >= 2 ? [...r.children].map((c) => c.textContent.trim()) : null; if (!cel) return;
    const rot = cel[0].toLowerCase(), val = cel.slice(1).join(' ').toLowerCase();
    if (!/dom|seg|ter|qua|qui|sex|s[áa]b|todos os dias|todo dia/.test(rot)) return;
    let dias = [];
    if (/todos os dias|todo dia/.test(rot)) dias = [0, 1, 2, 3, 4, 5, 6];
    else {
      const toks = [...rot.matchAll(/(domingo|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|dom|seg|ter|qua|qui|sex|sáb|sab)\b/g)].map((m) => ({ d: diaDe(m[1].replace('terca', 'terça')), i: m.index }));
      for (let k = 0; k < toks.length; k++) {
        const t = toks[k], prox = toks[k + 1];
        if (prox && /^\s*(a|à|até|-|–)\s*$/.test(rot.slice(t.i + 3, prox.i).replace(/^[a-zçáé-]+/, ''))) { for (let d = t.d; ; d = (d + 1) % 7) { dias.push(d); if (d === prox.d) break; } k++; }
        else dias.push(t.d);
      }
    }
    if (/fechad/.test(val)) { dias.forEach((d) => (tabela[d] = [])); return; }
    if (/a partir|desde as/.test(val)) return;
    const rngs = [...val.matchAll(/(\d{1,2})h(\d{2})?\s*(?:às|as|-|–|a|até)\s*(\d{1,2})h(\d{2})?|(\d{1,2})h(\d{2})?\s*(?:às|à|-|–|a|até)\s*(?:a\s*)?meia-noite/g)]
      .map((m) => m[5] ? [+m[5] + (+(m[6] || 0)) / 60, 24] : [+m[1] + (+(m[2] || 0)) / 60, (+m[3] || 24) + (+(m[4] || 0)) / 60]);
    if (rngs.length) dias.forEach((d) => { if (!(d in tabela)) tabela[d] = rngs; });
  });
  const temTabela = Object.keys(tabela).length >= 5;
  const aberto = (d, h) => (tabela[d] || []).some(([a, b]) => (b > a ? h >= a && h < b : h >= a || h < b));
  const linhas = [], E = [], A = [], suspeitas = new Set();
  for (let d = 0; d < 7; d++) {
    const per = []; let ultimo = null;
    for (let h = 0; h < 24; h += 0.5) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const T = RealDate.UTC(2026, 10, 22 + d, Math.floor(h) + 3, Math.round((h % 1) * 60)); // 22/11/2026 é domingo
      const FD = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(T); } static now() { return T; } };
      let erro = '';
      for (const s of scripts) { try { new Function('document', 'Date', 'IntersectionObserver', 'window', s)(doc, FD, IO, { IntersectionObserver: IO, addEventListener() {}, scrollY: 0, innerWidth: 400, matchMedia() { return { matches: false, addEventListener() {} }; }, location: { href: '' } }); } catch (e) { erro = 'ERRO ' + e.message; } }
      const ch = []; [...doc.body.querySelectorAll('*')].forEach((e, i) => { if (e.children.length === 0 && e.textContent !== bt[i]) ch.push(e.textContent.trim()); });
      const v = (erro || ch.filter(Boolean).join(' / ')).replace(/\s+/g, ' ').slice(0, 110);
      const hh = Math.floor(h) + 'h' + (h % 1 ? '30' : '');
      if (erro) E.push(`O script de horário quebra (${DIAS[d]} ${hh}): ${erro}`);
      if (/\bNaN\b|undefined|\bnull\b/.test(v)) E.push(`Texto quebrado no selo (${DIAS[d]} ${hh}): ${v}`);
      if (temTabela && /amanhã/i.test(v) && (tabela[(d + 1) % 7] || []).length === 0 && ((d + 1) % 7) in tabela) E.push(`${DIAS[d]} ${hh}: o selo diz "${v}", mas ${DIAS[(d + 1) % 7]} é fechado.`);
      if (temTabela && ch.length) {
        const L = v.toLowerCase();
        const diz = /abert[oa]s?\b.*agora|agora.*abert|aberto ·|atendendo agora|forno aceso|chapa ligada|rolando agora/.test(L) && !/fechad[oa] agora/.test(L);
        const dizFechado = /fechad|abre (hoje|amanhã|às|na|no|segunda|terça|quarta|quinta|sexta|sábado|domingo)|volta (amanhã|na|no|às)|folga/.test(L);
        const esp = aberto(d, h);
        if ((esp && dizFechado && !diz) || (!esp && diz)) suspeitas.add(`${DIAS[d]} ${hh}: tabela diz ${esp ? 'ABERTO' : 'FECHADO'}, selo diz "${v}"`);
      }
      if (v !== ultimo) { per.push(`${hh} ${v || '(sem texto)'}`); ultimo = v; }
    }
    linhas.push(`${DIAS[d]}: ${per.join(' | ')}`);
  }
  if (linhas.every((l) => / 0h \(sem texto\)$/.test(l))) linhas.splice(0, 7, 'O script só destaca o dia de hoje na tabela (não escreve selo).');
  [...suspeitas].slice(0, 6).forEach((s) => A.push('Selo de horário diverge da tabela: ' + s));
  if (suspeitas.size > 6) A.push(`(+${suspeitas.size - 6} divergências de horário)`);
  return { linhas, erros: [...new Set(E)].slice(0, 8), avisos: A, temTabela };
}

// Página inteira -> folha em colunas (para a revisão visual).
async function folha(page, arq, larguraCol, altCol, escala) {
  const png = await page.screenshot({ fullPage: true, type: 'png' });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const W = page.viewportSize().width;
  const n = Math.ceil(H / altCol);
  const p2 = await page.context().newPage();
  await p2.setViewportSize({ width: Math.ceil(n * (W * escala + 8)), height: Math.ceil(altCol * escala) });
  const url = 'data:image/png;base64,' + png.toString('base64');
  await p2.setContent(`<body style="margin:0;background:#777;display:flex;gap:8px">${Array.from({ length: n }, (_, c) => `<div style="flex:none;width:${W * escala}px;height:${altCol * escala}px;background:#fff url(${url}) 0 ${-c * altCol * escala}px/${W * escala}px auto no-repeat"></div>`).join('')}</body>`);
  await p2.waitForTimeout(150);
  await p2.screenshot({ path: arq, type: 'jpeg', quality: 72 });
  await p2.close();
}

async function auditar(pasta) {
  const r = { pasta, ...estatica(pasta), horario: null, telas: [] };
  const html = fs.readFileSync(path.join(PREVIA, pasta, 'index.html'), 'utf8');
  for (const [W, H, tipo] of [[375, 812, 'celular'], [1366, 768, 'desktop']]) {
    const { ctx, page, problemas } = await abrir(pasta, W, H);
    const m = await page.evaluate(medir, { celular: tipo === 'celular' });
    const pre = `[${tipo}] `;
    r.erros.push(...m.erros.map((x) => pre + x), ...[...new Set(problemas)].map((x) => pre + x));
    r.avisos.push(...m.avisos.map((x) => pre + x));
    if (tipo === 'celular') {
      const ctx2 = await navegador.newContext({ bypassCSP: true });
      const p2 = await ctx2.newPage(); await p2.goto(`${BASE}/robots.txt`).catch(() => {});
      r.horario = await p2.evaluate(simularHorario, html).catch((e) => ({ linhas: [], erros: ['Simulação de horário falhou: ' + e.message], avisos: [] }));
      await ctx2.close();
      if (r.horario) { r.erros.push(...r.horario.erros); r.avisos.push(...r.horario.avisos); }
    }
    if (!semFotos) {
      const arq = path.join(SAIDA, 'telas', `${pasta}-${tipo}.jpg`);
      if (tipo === 'celular') await folha(page, arq, 375, 1650, 0.5); else await folha(page, arq, 1366, 2600, 0.3);
      r.telas.push(path.relative(RAIZ, arq).replace(/\\/g, '/'));
    }
    await ctx.close();
  }
  r.erros = [...new Set(r.erros)]; r.avisos = [...new Set(r.avisos)];
  return r;
}

// ---------- roda em paralelo ----------
const resultados = []; let feitas = 0;
const fila = [...pastas];
await Promise.all(Array.from({ length: Math.min(4, fila.length) }, async () => {
  while (fila.length) {
    const p = fila.shift();
    try { resultados.push(await auditar(p)); } catch (e) { resultados.push({ pasta: p, erros: ['A auditoria não conseguiu abrir a página: ' + e.message], avisos: [], telas: [] }); }
    process.stdout.write(`\r${++feitas}/${pastas.length} prévias auditadas`);
  }
}));
await navegador.close(); servidor.close();
resultados.sort((a, b) => a.pasta.localeCompare(b.pasta));

// ---------- relatório ----------
const tot = { e: resultados.reduce((s, r) => s + r.erros.length, 0), a: resultados.reduce((s, r) => s + r.avisos.length, 0) };
let md = `# Auditoria das prévias · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;
md += `${resultados.length} prévias · **${tot.e} erros** · ${tot.a} avisos\n\n`;
md += `Limpas (sem erro nem aviso): ${resultados.filter((r) => !r.erros.length && !r.avisos.length).map((r) => r.pasta).join(', ') || 'nenhuma'}\n\n`;
md += `A revisão visual continua obrigatória: abrir cada imagem de \`telas/\` e conferir com o checklist da skill auditar-previas.\n\n---\n`;
for (const r of resultados) {
  md += `\n## ${r.pasta}${r.nome ? ' · ' + r.nome : ''}\n\n`;
  if (r.erros.length) md += `**Erros**\n${r.erros.map((x) => '- ' + x).join('\n')}\n\n`;
  if (r.avisos.length) md += `**Avisos**\n${r.avisos.map((x) => '- ' + x).join('\n')}\n\n`;
  if (!r.erros.length && !r.avisos.length) md += 'Nada encontrado pelas checagens automáticas.\n\n';
  if (r.horario) md += `<details><summary>Selo de horário simulado (${r.horario.temTabela ? 'comparado com a tabela' : 'sem tabela legível para comparar'})</summary>\n\n${r.horario.linhas.map((l) => '- ' + l).join('\n')}\n\n</details>\n\n`;
  if (r.telas.length) md += `Telas: ${r.telas.map((t) => '`' + t + '`').join(' · ')}\n`;
}
fs.writeFileSync(path.join(SAIDA, 'relatorio.md'), md);
fs.writeFileSync(path.join(SAIDA, 'relatorio.json'), JSON.stringify(resultados, null, 2));
console.log(`\n\n${tot.e} erros, ${tot.a} avisos em ${resultados.length} prévias.\nRelatório: ${path.relative(process.cwd(), path.join(SAIDA, 'relatorio.md'))}`);
process.exit(tot.e ? 2 : 0);
