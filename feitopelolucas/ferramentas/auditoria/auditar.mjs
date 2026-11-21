// Auditoria completa das prévias (feitopelolucas.com.br/previa/<pasta>/), em 11 etapas.
//
// Uso (na pasta feitopelolucas):
//   node ferramentas/auditoria/auditar.mjs pardal karioka            -> só essas
//   node ferramentas/auditoria/auditar.mjs --todas                   -> todas as prévias
//   node ferramentas/auditoria/auditar.mjs --cidade "Valinhos - SP"  -> as prévias das fichas dessa cidade
//   opções: --sem-fotos (sem capturas, mais rápido) · --sem-rede (não confere links externos)
//
// Etapas: 1 Estrutura e SEO · 2 Links e contatos · 3 Fotos · 4 Dados x ficha · 5 Textos ·
//         6 Layout em 6 telas · 7 Legibilidade e acessibilidade · 8 Interação (formulários e botões) ·
//         9 Selo de horário · 10 Desempenho · 11 Revisão visual (capturas + checklist para preencher)
//
// Saída em feitopelolucas/.auditoria/<data-hora>/ (fora do git):
//   relatorio.md            resumo geral + cada página com TODOS os achados (nada é cortado)
//   paginas/<pasta>.md      a página sozinha: achados com linha do HTML, seletor e recorte, e o checklist visual
//   revisao-visual.md       modelo para registrar a revisão visual de cada página (obrigatória)
//   relatorio.json          tudo, para máquina
//   telas/<pasta>-celular.jpg, -desktop.jpg   página inteira em colunas
//   telas/detalhes/<pasta>-NN.png             recorte de cada elemento com problema
// Se a prévia tem ficha numa pasta de cidade, uma cópia do relatório vai para <cidade>/_controle/auditorias/.
// Cada rodada também entra em .auditoria/historico.md.
//
// ERRO = corrigir antes de mandar. AVISO = conferir; corrigir ou justificar na revisão.
// Usa o Microsoft Edge do Windows (playwright-core, sem baixar navegador).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const PUBLIC = path.join(RAIZ, 'public');
const PREVIA = path.join(PUBLIC, 'previa');
const CFG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ferramentas', 'prospeccao', 'config.json'), 'utf8'));
const LUCAS = CFG.whatsappLucas;
const ARQ_CONF = path.join(AQUI, 'fotos-conferidas.txt');
const CONFERIDAS = new Set(fs.existsSync(ARQ_CONF) ? fs.readFileSync(ARQ_CONF, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : []);

const ETAPAS = ['', 'Estrutura e SEO', 'Links e contatos', 'Fotos', 'Dados x ficha', 'Textos', 'Layout em 6 telas', 'Legibilidade e acessibilidade', 'Interação', 'Selo de horário', 'Desempenho', 'Revisão visual'];
const TELAS = [[360, 740, 'celular pequeno'], [375, 812, 'celular'], [390, 844, 'iPhone'], [768, 1024, 'tablet'], [1366, 768, 'desktop'], [1920, 1080, 'desktop grande']];

// ---------- argumentos ----------
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const cidadeArg = valor('--cidade');
let pastas = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--cidade');
if (flag('--todas')) pastas = fs.readdirSync(PREVIA).filter((d) => fs.existsSync(path.join(PREVIA, d, 'index.html'))).sort();

// fichas de todas as cidades, por pasta
const FICHAS = {};
if (fs.existsSync(CFG.pastaCidades)) for (const c of fs.readdirSync(CFG.pastaCidades)) {
  const d = path.join(CFG.pastaCidades, c, '_controle', 'fichas');
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
    try { const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); if (j.pasta) FICHAS[j.pasta] = { ...j, _cidade: c, _arq: path.join(d, f) }; } catch {}
  }
}
if (cidadeArg) pastas = [...new Set([...pastas, ...Object.values(FICHAS).filter((f) => f._cidade === cidadeArg && f.pasta && !/^pulado/.test(f.situacao || '')).map((f) => f.pasta)])];
pastas = pastas.filter((p) => fs.existsSync(path.join(PREVIA, p, 'index.html')));
if (!pastas.length) { console.error('Diga quais prévias auditar (pastas), use --todas ou --cidade "<Cidade - UF>".'); process.exit(1); }
const semFotos = flag('--sem-fotos'), semRede = flag('--sem-rede');
const carimbo = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const SAIDA = path.join(RAIZ, '.auditoria', carimbo);
for (const d of ['telas/detalhes', 'paginas']) fs.mkdirSync(path.join(SAIDA, d), { recursive: true });

// ---------- utilidades ----------
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
const linhaDe = (src, idx) => (idx < 0 ? null : src.slice(0, idx).split('\n').length);
const digitos = (s) => String(s || '').replace(/\D/g, '');
const com55 = (s) => { const d = digitos(s); return !d ? '' : d.startsWith('55') ? d : '55' + d; };
// acha a linha do HTML de um elemento descrito pelo navegador
function localizar(src, onde) {
  if (!onde) return null;
  const tentativas = [];
  if (onde.id) tentativas.push(`id="${onde.id}"`);
  if (onde.src) tentativas.push(`src="${onde.src}"`);
  if (onde.href) tentativas.push(`href="${onde.href}"`);
  if (onde.inicio) tentativas.push(onde.inicio.slice(0, 50), onde.inicio.slice(0, 25));
  if (onde.texto) tentativas.push(onde.texto.slice(0, 30), onde.texto.slice(0, 15));
  for (const t of tentativas) { if (!t || t.length < 4) continue; const i = src.indexOf(t); if (i >= 0) return linhaDe(src, i); }
  return null;
}

// ---------- etapas estáticas (1, 2, 3, 5 parcial) ----------
function estatica(pasta, A) {
  const dir = path.join(PREVIA, pasta), h = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const at = (re) => { const m = typeof re === 'string' ? h.indexOf(re) : (h.match(re) || { index: -1 }).index; return linhaDe(h, m); };
  const tit = (h.match(/<title>([^<]+)/) || [])[1] || '';
  const nome = tit.split('·')[0].trim();

  // 1 Estrutura e SEO
  if (!/<meta charset="utf-8">\s*<meta http-equiv="Content-Security-Policy"/i.test(h)) A(1, 'ERRO', 'A meta Content-Security-Policy precisa vir logo depois de <meta charset> (sem ela a publicação falha).', { linha: at('<meta charset') });
  if (!/<html[^>]+lang="pt-BR"/i.test(h)) A(1, 'ERRO', 'Falta lang="pt-BR" no <html>.', { linha: 2 });
  if (!/<meta name="viewport" content="width=device-width, initial-scale=1/.test(h)) A(1, 'ERRO', 'Falta a meta viewport (a página fica minúscula no celular).');
  if (!/<meta name="robots" content="noindex/.test(h)) A(1, 'ERRO', 'Falta <meta name="robots" content="noindex, nofollow"> (a prévia não pode aparecer no Google).');
  if (!tit) A(1, 'ERRO', 'Falta <title>.'); else if (tit.length > 70) A(1, 'AVISO', `Título com ${tit.length} caracteres (até 70 aparece inteiro): "${tit}"`, { linha: at('<title>') });
  if (!/<meta name="description" content="[^"]{30,}/.test(h)) A(1, 'AVISO', 'Meta description ausente ou curta demais.');
  if (!h.includes(`og:url" content="https://feitopelolucas.com.br/previa/${pasta}/"`)) A(1, 'ERRO', 'og:url não aponta para https://feitopelolucas.com.br/previa/' + pasta + '/.', { linha: at('og:url') });
  for (const p of ['og:title', 'og:description', 'og:type']) if (!h.includes(`property="${p}"`)) A(1, 'AVISO', `Falta ${p} (aparece quando o link é compartilhado).`);
  if (!/twitter:card/.test(h)) A(1, 'AVISO', 'Falta twitter:card.');
  const ogi = (h.match(/og:image" content="([^"]+)"/) || [])[1];
  if (!ogi) A(1, 'ERRO', 'Falta og:image (o link chega sem imagem no WhatsApp).');
  else {
    const rel = ogi.replace(`https://feitopelolucas.com.br/previa/${pasta}/`, '');
    if (rel === ogi) A(1, 'ERRO', 'og:image aponta para fora da pasta da prévia: ' + ogi, { linha: at('og:image') });
    else if (!fs.existsSync(path.join(dir, rel))) A(1, 'ERRO', 'og:image não existe: ' + rel, { linha: at('og:image') });
    else { const d = dimensoes(path.join(dir, rel)); if (d && (d.w !== 1200 || d.h !== 630)) A(1, 'AVISO', `og:image tem ${d.w}x${d.h}; o padrão é 1200x630 (gerar com ferramentas/fotos/compartilhar.mjs).`, { linha: at('og:image') }); }
  }
  if (!/<link rel="icon"/.test(h)) A(1, 'AVISO', 'Sem ícone da aba (favicon).');
  if (!/class="previa"/.test(h)) A(1, 'ERRO', 'Falta a faixa "Prévia · não é o site oficial" no topo.');
  else { const faixa = (h.match(/class="previa"[\s\S]*?<\/div>\s*<\/div>/) || [''])[0]; const chave = nome.split(' ').find((w) => w.length > 3) || nome; if (!faixa.toLowerCase().includes(chave.toLowerCase())) A(1, 'AVISO', `A faixa de prévia não cita "${nome}".`, { linha: at('class="previa"') }); }
  const h1 = (h.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) A(1, 'ERRO', `A página tem ${h1} <h1> (deve ter exatamente 1).`);
  if (!/<footer/.test(h)) A(1, 'AVISO', 'Sem <footer>.'); else if (!/feitopelolucas\.com\.br/.test(h.slice(h.indexOf('<footer')))) A(1, 'AVISO', 'O rodapé não tem "Prévia de site por feitopelolucas.com.br".', { linha: at('<footer') });
  const ids = {}; for (const m of h.matchAll(/\sid="([^"]+)"/g)) ids[m[1]] = (ids[m[1]] || 0) + 1;
  for (const [k, v] of Object.entries(ids)) if (v > 1) A(1, 'ERRO', `id repetido "${k}" (${v} vezes).`, { linha: at(`id="${k}"`) });
  if (/<script[^>]+src="https?:/.test(h)) A(1, 'AVISO', 'Script externo na página (a CSP precisa permitir).', { linha: at(/<script[^>]+src="https?:/) });

  // 2 Links e contatos
  if (!h.includes('wa.me/' + LUCAS)) A(2, 'ERRO', 'Falta o link "Gostou? Fale com o Lucas" (WhatsApp do Lucas).');
  const msgL = (h.match(new RegExp('wa\\.me/' + LUCAS + '\\?text=([^"]+)"')) || [])[1];
  if (msgL) {
    const t = decodeURIComponent(msgL).toLowerCase();
    const genericas = /^(padaria|panificadora|bar|restaurante|lanchonete|lanches|oficina|auto|centro|automotivo|borracharia|barbearia|salão|studio|pet|shop|casa|açaí|pastelaria|mecânica|elétrica|confeitaria|cafe|café|espaço|beleza|hair)$/;
    const chave = nome.toLowerCase().split(/[\s·&-]+/).filter((w) => w.length >= 3 && !genericas.test(w));
    if (chave.length && !chave.some((w) => t.includes(w))) A(2, 'AVISO', 'O link do Lucas não cita o negócio: "' + decodeURIComponent(msgL) + '"', { linha: at('wa.me/' + LUCAS) });
  } else if (h.includes('wa.me/' + LUCAS)) A(2, 'AVISO', 'O link do Lucas não tem mensagem pronta (?text=...).', { linha: at('wa.me/' + LUCAS) });
  const zaps = new Set([...h.matchAll(/wa\.me\/(\d+)/g)].map((m) => m[1])); zaps.delete(LUCAS);
  for (const n of zaps) if (!/^55\d{10,11}$/.test(n)) A(2, 'ERRO', 'WhatsApp em formato errado: wa.me/' + n, { linha: at('wa.me/' + n) });
  for (const m of h.matchAll(/wa\.me\/(\d+)\?text=([^"&]*)/g)) { try { const t = decodeURIComponent(m[2]); if (/undefined|NaN|\bnull\b/.test(t)) A(2, 'ERRO', 'Mensagem pronta do WhatsApp com texto quebrado: ' + t, { linha: at(m[0]) }); } catch { A(2, 'ERRO', 'Mensagem pronta do WhatsApp com codificação inválida.', { linha: at(m[0]) }); } }
  for (const m of h.matchAll(/href="tel:([^"]+)"/g)) if (!/^\+55\d{10,11}$/.test(m[1])) A(2, 'ERRO', 'Telefone em formato errado: tel:' + m[1] + ' (use tel:+55DDDNUMERO).', { linha: at('tel:' + m[1]) });
  if (!zaps.size && !/href="tel:/.test(h)) A(2, 'AVISO', 'Nenhum WhatsApp nem telefone do negócio na página (confirme que ele não publica nenhum).');
  if (zaps.size > 1) A(2, 'AVISO', 'Mais de um WhatsApp do negócio: ' + [...zaps].join(', ') + ' (confirme que é de propósito, ex.: setores).');
  for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) A(2, 'ERRO', 'Link com target=_blank sem rel="noopener".', { linha: at(m[0]) });
  for (const m of h.matchAll(/href="#([^"]+)"/g)) if (!h.includes(`id="${m[1]}"`)) A(2, 'ERRO', 'Âncora quebrada: #' + m[1], { linha: at(`href="#${m[1]}"`) });
  for (const m of h.matchAll(/<a\b(?![^>]*href=)[^>]*>/g)) A(2, 'AVISO', 'Link <a> sem href.', { linha: at(m[0]) });
  if (/href=""|href="#"[\s>]/.test(h)) A(2, 'ERRO', 'Link vazio (href="" ou href="#").', { linha: at(/href=""|href="#"[\s>]/) });
  if (!/<iframe[^>]+google\.com\/maps/.test(h)) A(2, 'AVISO', 'Sem mapa do Google.');
  if (!/google\.com\/maps\/dir|maps\/search|maps\?daddr|Como chegar/i.test(h)) A(2, 'AVISO', 'Sem botão "Como chegar".');
  const externos = [...new Set([...h.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')).filter((u) => !/wa\.me|feitopelolucas\.com\.br|google\.com\/maps|fonts\.g/.test(u)))];

  // 3 Fotos
  const usadas = {};
  for (const m of h.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0], src = (t.match(/\ssrc="([^"]+)"/) || [])[1], ln = at(t);
    if (!src) { A(3, 'ERRO', '<img> sem src.', { linha: ln }); continue; }
    if (/^https?:/.test(src)) { A(3, 'ERRO', 'Imagem externa (a CSP bloqueia): ' + src, { linha: ln }); continue; }
    if (src.startsWith('data:')) continue;
    const arq = path.join(dir, src);
    if (!fs.existsSync(arq)) { A(3, 'ERRO', 'Imagem não existe: ' + src, { linha: ln }); continue; }
    usadas[src] = (usadas[src] || 0) + 1;
    if (!/\salt="/.test(t)) A(3, 'ERRO', 'Imagem sem alt: ' + src, { linha: ln });
    const W = +(t.match(/\swidth="(\d+)"/) || [])[1], H = +(t.match(/\sheight="(\d+)"/) || [])[1];
    if (!W || !H) A(3, 'AVISO', 'Imagem sem width/height (a página pula ao carregar): ' + src, { linha: ln });
    const d = dimensoes(arq);
    if (d && W && H && Math.abs(W / H - d.w / d.h) > 0.03) A(3, 'AVISO', `width/height de ${src} (${W}x${H}) não batem com o arquivo (${d.w}x${d.h}).`, { linha: ln });
  }
  for (const m of h.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const s = m[1]; if (/^(data:|https?:|#)/.test(s)) continue;
    if (!fs.existsSync(path.join(dir, s))) A(3, 'ERRO', 'Imagem do CSS não existe: ' + s, { linha: at(s) }); else usadas[s] = (usadas[s] || 0) + 1;
  }
  for (const [s, n] of Object.entries(usadas)) if (n > 1) A(3, 'AVISO', `A mesma foto aparece ${n} vezes: ${s} (linhas ${[...h.matchAll(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].map((m) => linhaDe(h, m.index)).join(', ')}).`);
  const fd = path.join(dir, 'fotos'), hashes = {};
  let pesoFotos = 0;
  if (fs.existsSync(fd)) for (const x of fs.readdirSync(fd)) {
    const arq = path.join(fd, x), buf = fs.readFileSync(arq), kb = Math.round(buf.length / 1024);
    if (h.includes('fotos/' + x)) pesoFotos += buf.length;
    if (kb > 450) A(3, 'AVISO', `Foto pesada (${kb} KB): fotos/${x} (reduzir para até 1400 px).`);
    if (!h.includes('fotos/' + x)) A(3, 'AVISO', 'Foto sem uso na pasta: fotos/' + x);
    const hs = crypto.createHash('md5').update(buf).digest('hex'); (hashes[hs] = hashes[hs] || []).push(x);
    const d = dimensoes(arq);
    const conferida = CONFERIDAS.has(`${pasta}/fotos/${x}`) || buf.includes('reprojetada-360');
    if (d && d.w >= 1000 && Math.abs(d.w / d.h - 2) < 0.05 && x !== 'compartilhar.jpg' && !conferida)
      A(3, 'AVISO', `fotos/${x} tem proporção 2:1: se for 360° do Street View (teto curvo, chão dobrado), reprojetar com ferramentas/fotos/reprojetar-360.py; se não for, anotar em ferramentas/auditoria/fotos-conferidas.txt.`);
  }
  for (const v of Object.values(hashes)) if (v.length > 1) A(3, 'AVISO', 'Arquivos com a mesma foto (nomes diferentes): ' + v.join(', '));

  // 5 Textos (no HTML; o texto visível é conferido no navegador)
  const texto = h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
  for (const [re, o] of [[/lorem ipsum/i, 'lorem ipsum'], [/\bTODO\b|\bFIXME\b|\bXXX\b/, 'TODO/XXX'], [/\[nome|\[cidade|\[telefone|\{\{/i, 'marcador de modelo'], [/99999-9999|\(00\)|0000-0000/, 'telefone de exemplo'], [/�|Ã[£§©¡³ª­]/, 'acento quebrado']])
    if (re.test(texto)) A(5, 'ERRO', 'Texto esquecido/suspeito: ' + o, { linha: at(re) });

  return { nome, titulo: tit, html: h, zaps: [...zaps], externos, pesoFotos };
}

// ---------- 4 Dados x ficha ----------
function contraFicha(pasta, est, textoVisivel, A) {
  const f = FICHAS[pasta];
  if (!f) { A(4, 'AVISO', 'Sem ficha desta prévia numa pasta de cidade: não deu para conferir os dados com a apuração.'); return; }
  const h = est.html, c = f.contatos || {};
  const tv = textoVisivel.toLowerCase();
  const w = com55(c.whatsapp);
  if (w && !h.includes('wa.me/' + w)) A(4, 'ERRO', `O WhatsApp da ficha (${c.whatsapp}) não está nos botões da página.`);
  const conhecidos = [c.whatsapp, c.telefone, ...(String(c.outros || '').match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g) || [])].map(com55).filter(Boolean);
  for (const z of est.zaps) if (!conhecidos.includes(z)) A(4, 'AVISO', `A página tem o WhatsApp ${z}, que não está na ficha.`);
  for (const m of h.matchAll(/href="tel:\+?(\d+)"/g)) if (!conhecidos.includes(com55(m[1]))) A(4, 'AVISO', `A página liga para ${m[1]}, que não está na ficha.`);
  if (c.telefone && !h.includes(digitos(c.telefone).slice(-8)) && !tv.includes(String(c.telefone).toLowerCase())) A(4, 'AVISO', `O telefone da ficha (${c.telefone}) não aparece na página.`);
  if (c.instagram && !h.toLowerCase().includes(c.instagram.replace('@', '').toLowerCase())) A(4, 'AVISO', `O Instagram da ficha (${c.instagram}) não aparece na página.`);
  if (f.nota && !tv.includes(String(f.nota))) A(4, 'AVISO', `A nota da ficha (${f.nota}) não aparece na página.`);
  if (f.avaliacoes) { const a = digitos(f.avaliacoes); if (a && !digitos(tv.replace(/\s/g, '')).includes(a)) A(4, 'AVISO', `O número de avaliações da ficha (${f.avaliacoes}) não aparece na página (se arredondou, ex.: "mais de mil", tudo bem).`); }
  const num = (String(f.endereco || '').match(/,\s*(\d+)/) || [])[1];
  if (num && !tv.includes(num)) A(4, 'AVISO', `O número do endereço da ficha (${num}) não aparece na página.`);
  const horas = (s) => new Set((String(s).toLowerCase().match(/\d{1,2}h\d{0,2}/g) || []).map((x) => x.replace(/h00$/, 'h')));
  const hf = horas(f.horario), hp = horas(tv);
  const faltam = [...hf].filter((x) => !hp.has(x));
  if (hf.size && faltam.length) A(4, 'AVISO', `Horários da ficha que não aparecem na página: ${faltam.join(', ')} (ficha: ${f.horario}).`);
  const tituloLimpo = est.titulo.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").toLowerCase();
  if (f.nome && !tituloLimpo.includes(f.nome.toLowerCase().split(' ')[0].replace(/&amp;/g, '&'))) A(4, 'AVISO', `O título da página ("${est.titulo}") não começa pelo nome da ficha ("${f.nome}").`);
}

// ---------- servidor local ----------
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };
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
const navegador = await chromium.launch({ channel: 'msedge' });

async function abrir(pasta, W, H) {
  const ctx = await navegador.newContext({ viewport: { width: W, height: H }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', isMobile: W < 600, hasTouch: W < 600 });
  const page = await ctx.newPage();
  const problemas = [], capturados = [];
  page.on('pageerror', (e) => problemas.push(['ERRO', 'Erro de JavaScript: ' + e.message]));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/google|gstatic|maps|favicon|DevTools/i.test(m.text())) problemas.push([m.type() === 'error' ? 'ERRO' : 'AVISO', 'Console: ' + m.text()]); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) problemas.push(['ERRO', 'Arquivo não carregou: ' + r.url().replace(BASE, '')]); });
  await ctx.route(/wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|instagram\.com|ifood|facebook\.com|tel:/, (r) => { capturados.push(r.request().url()); r.abort(); });
  await page.goto(`${BASE}/previa/${pasta}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy],iframe[loading=lazy]').forEach((i) => (i.loading = 'eager'));
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    scrollTo(0, 0);
    await Promise.race([Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => (i.onload = i.onerror = r))))), new Promise((r) => setTimeout(r, 8000))]);
    await document.fonts.ready;
  });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(900);
  return { ctx, page, problemas, capturados };
}

// Medições dentro da página (etapas 6 e 7). Elementos com problema ganham data-aud=N para o recorte.
function medir({ tela, contatoAte }) {
  const R = []; let n = 0;
  const iw = innerWidth;
  const marca = (e) => { if (!e || n >= 40) return null; if (!e.dataset.aud) e.dataset.aud = String(++n); const r = e.getBoundingClientRect(); return { n: e.dataset.aud, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const caminho = (e) => { const p = []; let x = e; while (x && x !== document.body && p.length < 5) { let s = x.tagName.toLowerCase(); if (x.id) { s += '#' + x.id; p.unshift(s); break; } const cl = (typeof x.className === 'string' ? x.className.trim().split(/\s+/).filter((c) => !/^(some|sim|hoje|on)$/.test(c)).slice(0, 2) : []); if (cl.length) s += '.' + cl.join('.'); p.unshift(s); x = x.parentElement; } return p.join(' > '); };
  const onde = (e) => ({ seletor: caminho(e), id: e.id || '', src: e.getAttribute('src') || '', href: e.getAttribute('href') || '', inicio: e.outerHTML.slice(0, 80).split('>')[0], texto: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), recorte: marca(e) });
  const add = (etapa, nivel, msg, e) => R.push({ etapa, nivel, msg, onde: e ? onde(e) : null });
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const cortaX = (e) => { let p = e.parentElement; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (/auto|scroll/.test(o)) return 'rolagem'; if (/hidden|clip/.test(o)) return p; p = p.parentElement; } return null; };

  // 6 Layout
  if (document.documentElement.scrollWidth > iw + 1) {
    const fora = [...document.body.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > iw + 1 && !cortaX(e); });
    const raiz = fora.filter((e) => !fora.includes(e.parentElement));
    add(6, 'ERRO', `A página rola para o lado (${document.documentElement.scrollWidth}px numa tela de ${iw}px). ${raiz.length} elemento(s) passam da borda; o primeiro está no recorte.`, raiz[0]);
    raiz.slice(1, 6).forEach((e) => add(6, 'ERRO', 'Também passa da borda direita.', e));
  }
  document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,span,b,strong,small,figcaption,td,th,label,blockquote,cite,em').forEach((e) => {
    if (!vis(e) || e.closest('[aria-hidden=true]')) return;
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && /hidden|clip/.test(cs.overflowX) && !/ellipsis/.test(cs.textOverflow)) add(6, 'AVISO', `Texto cortado: "${e.textContent.trim().slice(0, 60)}"`, e);
    const r = e.getBoundingClientRect();
    if (e.children.length === 0 && e.textContent.trim().length > 1) {
      const pai = cortaX(e);
      if (pai && pai !== 'rolagem') { const rp = pai.getBoundingClientRect(); if (r.right > rp.right + 2 || r.left < rp.left - 2) add(6, 'AVISO', `Texto escondido pela borda do bloco: "${e.textContent.trim().slice(0, 60)}"`, e); }
    }
  });
  const h1 = document.querySelector('h1'); if (h1) { const r = h1.getBoundingClientRect(); if (r.left < 0 || r.right > iw + 1) add(6, 'ERRO', 'O título principal sai da tela.', h1); if (r.top > innerHeight * 0.8) add(6, 'AVISO', 'O título principal não aparece na primeira tela.', h1); }
  [...document.images].forEach((i) => { if (!i.naturalWidth && vis(i)) add(6, 'ERRO', 'Imagem quebrada: ' + i.getAttribute('src'), i); });
  [...document.images].forEach((i) => { if (!vis(i) || !i.naturalWidth) return; const r = i.getBoundingClientRect(); const cs = getComputedStyle(i); if (cs.objectFit === 'fill' || cs.objectFit === '') { const real = i.naturalWidth / i.naturalHeight, mostra = r.width / r.height; if (Math.abs(real - mostra) / real > 0.06) add(6, 'ERRO', `Foto esticada/achatada (${i.getAttribute('src')}): falta object-fit:cover.`, i); } if (r.width * devicePixelRatio > i.naturalWidth * 1.6 && r.width > 300) add(6, 'AVISO', `Foto ampliada além da resolução (${i.naturalWidth}px exibida a ${Math.round(r.width)}px): pode ficar borrada.`, i); });
  [...document.fonts].forEach((f) => { if (f.status === 'error') add(6, 'ERRO', 'Fonte não carregou: ' + f.family); });
  // sobreposição de botões e textos (fixos não contam)
  const blocos = [...document.querySelectorAll('a.btn,button,.btn,h1,h2,h3')].filter((e) => vis(e) && getComputedStyle(e).position !== 'fixed' && !e.closest('[aria-hidden=true],.previa'));
  for (let i = 0; i < blocos.length; i++) for (let j = i + 1; j < blocos.length; j++) {
    const a = blocos[i], b = blocos[j]; if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ix > 6 && iy > 6) add(6, 'ERRO', `Elementos sobrepostos: "${a.textContent.trim().slice(0, 30)}" e "${b.textContent.trim().slice(0, 30)}".`, a);
  }
  if (contatoAte) {
    const contato = [...document.querySelectorAll('a[href*="wa.me"],a[href^="tel:"],a.btn,button.btn')].filter((a) => !a.closest('.previa') && vis(a) && getComputedStyle(a).position !== 'fixed').map((a) => a.getBoundingClientRect()).filter((r) => r.top >= 0 && r.bottom <= contatoAte);
    if (!contato.length) add(6, 'AVISO', `Nenhum botão de contato aparece na primeira tela (até ${contatoAte}px). Compactar a abertura ou pôr um botão no cabeçalho.`);
  }

  // 7 Legibilidade e acessibilidade
  const lum = (c) => { const m = (c.match(/[\d.]+/g) || []).map(Number); if (m.length < 3) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return { L: 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]), a: m.length > 3 ? m[3] : 1 }; };
  const fundo = (e) => { while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const l = lum(cs.backgroundColor); if (l && l.a > 0.9) return l.L; e = e.parentElement; } return 1; };
  const midias = [...document.querySelectorAll('img,video,iframe,picture')].filter(vis).map((m) => m.getBoundingClientRect());
  const sobreMidia = (e) => { const r = e.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; return midias.some((m) => cx >= m.left && cx <= m.right && cy >= m.top && cy <= m.bottom); };
  const vistos = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let nd;
  while ((nd = tw.nextNode())) {
    const t = nd.textContent.trim(); if (t.length < 2 || /^[★☆✓✔•·→←↗\s]+$/.test(t)) continue;
    const e = nd.parentElement; if (vistos.has(e) || !vis(e) || e.closest('[aria-hidden=true],iframe')) continue; vistos.add(e);
    const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize);
    if (fs < 12) add(7, 'AVISO', `Letra de ${fs}px (mínimo 12px; corpo de texto 13px+): "${t.slice(0, 50)}"`, e);
    const fg = lum(cs.color), bg = fundo(e); if (!fg || bg === null || sobreMidia(e)) continue;
    const cr = (Math.max(fg.L, bg) + 0.05) / (Math.min(fg.L, bg) + 0.05);
    const grande = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
    if (cr < (grande ? 3 : 4.5) - 0.05) add(7, cr < 2.2 ? 'ERRO' : 'AVISO', `Contraste ${cr.toFixed(2)}:1 (mínimo ${grande ? '3' : '4,5'}:1) em "${t.slice(0, 50)}" (cor ${cs.color})`, e);
  }
  // texto sobre foto: precisa de sombra ou camada escura/clara
  // camada que escurece/clareia a foto: fundo do próprio bloco, ::before/::after com cor ou degradê, ou bloco irmão posicionado por cima
  const camada = (s) => { const l = lum(s.backgroundColor); return (l && l.a > 0.3) || s.backgroundImage.includes('gradient') || (s.backdropFilter && s.backdropFilter !== 'none'); };
  document.querySelectorAll('h1,h2,p,figcaption,span,b').forEach((e) => { if (!vis(e) || !sobreMidia(e) || e.children.length > 2) return; const cs = getComputedStyle(e); const temFundo = (() => { let x = e; for (let k = 0; k < 7 && x && x !== document.body; k++, x = x.parentElement) { if (camada(getComputedStyle(x)) || camada(getComputedStyle(x, '::before')) || camada(getComputedStyle(x, '::after'))) return true; for (const irmao of x.children) { if (irmao.contains(e) || /IMG|VIDEO|PICTURE/.test(irmao.tagName)) continue; const si = getComputedStyle(irmao); if (/absolute|fixed/.test(si.position) && camada(si)) return true; } } return false; })(); if (!temFundo && cs.textShadow === 'none' && e.textContent.trim().length > 3) add(7, 'AVISO', `Texto direto sobre foto, sem sombra nem fundo: "${e.textContent.trim().slice(0, 40)}" (confira se dá para ler)`, e); });
  if (tela === 'celular') {
    [...document.querySelectorAll('a.btn,button,.btn,input[type=submit],select,input:not([type=hidden]):not([type=checkbox]):not([type=radio])')].filter((b) => vis(b) && !b.closest('.previa')).forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 40) add(7, 'AVISO', `Alvo de toque com ${Math.round(r.height)}px de altura (mínimo 44px): "${(b.textContent || b.getAttribute('aria-label') || b.name || '').trim().slice(0, 30)}"`, b); });
    const ins = [...document.querySelectorAll('input,select,textarea')].filter(vis); ins.forEach((i) => { if (parseFloat(getComputedStyle(i).fontSize) < 16 && !['checkbox', 'radio', 'range'].includes(i.type)) add(7, 'AVISO', 'Campo com letra < 16px: o iPhone dá zoom ao tocar.', i); });
  }
  [...document.querySelectorAll('a,button')].filter(vis).forEach((a) => { const nome = (a.textContent || '').trim() || a.getAttribute('aria-label') || a.getAttribute('title') || [...a.querySelectorAll('img')].map((i) => i.alt).join(''); if (!nome) add(7, 'ERRO', 'Botão/link sem nome (leitor de tela não sabe o que é).', a); });
  [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]),select,textarea')].filter(vis).forEach((i) => { const ok = (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.title; if (!ok) add(7, 'AVISO', 'Campo de formulário sem rótulo (label).', i); });
  let ult = 1; [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).forEach((hh) => { const n = +hh.tagName[1]; if (n > ult + 1) add(7, 'AVISO', `Títulos pulam de h${ult} para h${n}: "${hh.textContent.trim().slice(0, 40)}"`, hh); ult = n; });
  [...document.querySelectorAll('iframe')].forEach((f) => { if (!f.title) add(7, 'AVISO', 'iframe sem title.', f); });
  [...document.querySelectorAll('img[alt=""]')].filter((i) => vis(i) && !i.closest('[aria-hidden=true]') && i.getBoundingClientRect().width > 150).forEach((i) => add(7, 'AVISO', 'Foto grande com alt vazio (descreva o que mostra).', i));
  // botão flutuante x rodapé
  const fixo = [...document.querySelectorAll('body *')].find((e) => getComputedStyle(e).position === 'fixed' && /wa\.me|tel:|#/.test(e.getAttribute('href') || '') && !e.closest('.previa'));
  const rod = document.querySelector('footer');
  if (fixo && rod) {
    const corDe = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor; const l = lum(c); if (l && l.a > 0.9) return c; e = e.parentElement; } return 'rgb(255,255,255)'; };
    const ca = corDe(fixo), cb = corDe(rod), a = lum(ca).L, b = lum(cb).L, cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const dist = Math.hypot(...rgb(ca).map((v, i) => v - rgb(cb)[i]));
    const cs = getComputedStyle(fixo); const aro = /0px 0px 0px [1-9]/.test(cs.boxShadow) || parseFloat(cs.borderTopWidth) >= 2;
    if (cr < 1.6 && dist < 90 && !aro) add(7, 'AVISO', `O botão flutuante tem quase a cor do rodapé (${cr.toFixed(2)}:1) e some no fim da página: box-shadow: 0 0 0 2px rgba(255,255,255,.92), <sombra>.`, fixo);
  }
  // primeira imagem visível não pode ser lazy
  const prim = [...document.images].find((i) => vis(i) && i.getBoundingClientRect().top < innerHeight);
  if (prim && prim.getAttribute('loading') === 'lazy') add(10, 'AVISO', 'A primeira foto da tela está com loading="lazy" (demora a aparecer). Use fetchpriority="high".', prim);
  return { achados: R, texto: document.body.innerText };
}

// 8 Interação: preenche e envia cada formulário, aperta botões de +/- e os demais botões.
// Cada passo roda separado: se um envio navegar para fora (ex.: location = wa.me), a página é reaberta e o teste continua.
async function interagir(page, capturados, url) {
  const antes = capturados.length, R = [];
  const passo = async (fn, arg) => {
    try { return await page.evaluate(fn, arg); }
    catch (e) {
      if (!/destroyed|navigat|Target closed/i.test(e.message)) { R.push(['AVISO', 'Teste de interação interrompido: ' + e.message.split('\n')[0]]); return null; }
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      if (!page.url().startsWith(url)) await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
      return { navegou: true };
    }
  };
  const linksZap = () => [...document.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp.com"]')].map((a) => a.href);
  const zapAntes = new Set((await passo(linksZap)) || []);
  const nForms = (await passo(() => [...document.querySelectorAll('form')].filter((f) => f.getBoundingClientRect().height > 0).length)) || 0;
  for (let k = 0; k < nForms; k++) {
    const r = await passo(async (k) => {
      const f = [...document.querySelectorAll('form')].filter((f) => f.getBoundingClientRect().height > 0)[k]; if (!f) return null;
      const disparar = (e) => { e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
      const amanha = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
      f.querySelectorAll('input,select,textarea').forEach((i) => {
        if (i.disabled || ['hidden', 'submit', 'button'].includes(i.type)) return;
        if (i.tagName === 'SELECT') { const o = [...i.options].find((o) => o.value && !o.disabled); if (o) i.value = o.value; }
        else if (i.type === 'checkbox') i.checked = true;
        else if (i.type === 'radio') { if (!f.querySelector(`input[type=radio][name="${i.name}"]:checked`)) i.checked = true; }
        else if (i.type === 'date') i.value = amanha;
        else if (i.type === 'time') i.value = '10:00';
        else if (i.type === 'number') i.value = i.min && +i.min > 0 ? i.min : 2;
        else if (i.type === 'range') i.value = i.max ? Math.round((+i.min + +i.max) / 2) : 5;
        else if (i.type === 'tel') i.value = '19999990000';
        else if (i.type === 'email') i.value = 'teste@teste.com';
        else if (!i.value) i.value = 'Teste da auditoria';
        disparar(i);
      });
      // usa os botões de escolha do próprio formulário (chips), se houver
      f.querySelectorAll('button[type=button]').forEach((b, j) => { if (j < 6) b.click(); });
      await new Promise((r) => setTimeout(r, 150));
      // formulário cujo "enviar" é um link de WhatsApp montado pelo script: lê o link já preenchido
      const links = [...f.querySelectorAll('a[href*="wa.me"],a[href*="whatsapp.com"]')].map((a) => a.href);
      const env = f.querySelector('[type=submit],button:not([type=button])');
      if (env) env.click(); else if (!links.length) f.requestSubmit();
      await new Promise((r) => setTimeout(r, 500));
      return { links };
    }, k);
    if (r === null) R.push(['AVISO', `Não deu para testar o formulário ${k + 1}.`]);
    else if (r.links) capturados.push(...r.links);
  }
  const resto = await passo(async () => {
    const R = [], vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const mais = [...document.querySelectorAll('button')].filter((b) => vis(b) && (/^\s*[+＋]\s*$/.test(b.textContent) || /mais|adicionar|aumentar/i.test(b.getAttribute('aria-label') || '')));
    for (const b of mais.slice(0, 25)) { b.click(); await new Promise((r) => setTimeout(r, 40)); }
    const outros = [...document.querySelectorAll('button')].filter((b) => vis(b) && !b.closest('form') && !mais.includes(b));
    for (const b of outros.slice(0, 30)) { try { b.click(); } catch {} await new Promise((r) => setTimeout(r, 60)); }
    await new Promise((r) => setTimeout(r, 400));
    const t = document.body.innerText;
    for (const ruim of ['NaN', 'undefined', '[object Object]', 'Infinity']) if (new RegExp('(^|[^\\w])' + ruim.replace(/[[\]]/g, '\\$&') + '([^\\w]|$)').test(t)) R.push(['ERRO', `Depois de usar os botões e formulários aparece "${ruim}" na página.`]);
    return { R, mais: mais.length, outros: outros.length };
  });
  if (resto?.R) R.push(...resto.R);
  // links de WhatsApp que os scripts montaram na página (sem navegar) também contam
  const novos = ((await passo(linksZap)) || []).filter((u) => !zapAntes.has(u));
  return { R, forms: nForms, mais: resto?.mais || 0, outros: resto?.outros || 0, urls: [...new Set([...capturados.slice(antes), ...novos])] };
}

// 9 Selo de horário: roda os scripts de horário nos 7 dias, de meia em meia hora.
function simularHorario(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => /DateTimeFormat|getDay|getHours/.test(s));
  if (!scripts.length) return null;
  const base = new DOMParser().parseFromString(html, 'text/html');
  const bt = [...base.body.querySelectorAll('*')].map((e) => e.textContent);
  const RealDate = Date, IO = function () { return { observe() {}, unobserve() {}, disconnect() {} }; };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const abrev = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, 'sáb': 6, sab: 6 };
  const diaDe = (w) => { w = w.toLowerCase(); for (let i = 0; i < 7; i++) if (w.startsWith(DIAS[i].slice(0, 3))) return i; return abrev[w.slice(0, 3)] ?? null; };
  const tabela = {};
  base.querySelectorAll('tr, li, .linha, .hora, [data-d], [data-dia]').forEach((r) => {
    const cel = r.children.length >= 2 ? [...r.children].map((c) => c.textContent.trim()) : null; if (!cel) return;
    const rot = cel[0].toLowerCase(), val = cel.slice(1).join(' ').toLowerCase();
    if (!/dom|seg|ter|qua|qui|sex|s[áa]b|todos os dias|todo dia/.test(rot)) return;
    let dias = [];
    if (/todos os dias|todo dia/.test(rot)) dias = [0, 1, 2, 3, 4, 5, 6];
    else {
      const toks = [...rot.matchAll(/(domingo|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|dom|seg|ter|qua|qui|sex|sáb|sab)\b/g)].map((m) => ({ d: diaDe(m[1].replace('terca', 'terça')), i: m.index, f: m.index + m[1].length }));
      for (let k = 0; k < toks.length; k++) {
        const t = toks[k], prox = toks[k + 1];
        if (prox && /^\s*(a|à|até|-|–)\s*$/.test(rot.slice(t.f, prox.i).replace(/^-feira/, ''))) { for (let d = t.d; ; d = (d + 1) % 7) { dias.push(d); if (d === prox.d) break; } k++; }
        else dias.push(t.d);
      }
    }
    if (/fechad/.test(val)) { dias.forEach((d) => { if (!(d in tabela)) tabela[d] = []; }); return; }
    if (/a partir|desde as/.test(val)) return;
    const rngs = [...val.matchAll(/(\d{1,2})h(\d{2})?\s*(?:às|as|-|–|a|até)\s*(\d{1,2})h(\d{2})?|(\d{1,2})h(\d{2})?\s*(?:às|à|-|–|a|até)\s*(?:a\s*)?meia-noite/g)]
      .map((m) => m[5] ? [+m[5] + (+(m[6] || 0)) / 60, 24] : [+m[1] + (+(m[2] || 0)) / 60, (+m[3] || 24) + (+(m[4] || 0)) / 60]);
    if (rngs.length) dias.forEach((d) => { if (!(d in tabela)) tabela[d] = rngs; });
  });
  const temTabela = Object.keys(tabela).length >= 5;
  const aberto = (d, h) => (tabela[d] || []).some(([a, b]) => (b > a ? h >= a && h < b : h >= a)) || (tabela[(d + 6) % 7] || []).some(([a, b]) => b < a && h < b);
  const linhas = [], E = [], A = [];
  for (let d = 0; d < 7; d++) {
    const per = []; let ultimo = null;
    for (let h = 0; h < 24; h += 0.5) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const T = RealDate.UTC(2026, 10, 22 + d, Math.floor(h) + 3, Math.round((h % 1) * 60)); // 22/11/2026 é domingo
      const FD = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(T); } static now() { return T; } };
      let erro = '';
      for (const s of scripts) { try { new Function('document', 'Date', 'IntersectionObserver', 'window', s)(doc, FD, IO, { IntersectionObserver: IO, addEventListener() {}, scrollY: 0, innerWidth: 400, matchMedia() { return { matches: false, addEventListener() {} }; }, location: { href: '' } }); } catch (e) { erro = 'ERRO ' + e.message; } }
      // só os textos que mudaram e falam de horário (scripts que também montam cardápio etc. ficam de fora)
      const ch = []; [...doc.body.querySelectorAll('*')].forEach((e, i) => { if (e.children.length === 0 && e.textContent !== bt[i]) { const t = e.textContent.trim(); if (t && t.length < 120 && /abert|fechad|abre|volta|hoje|amanhã|agora|até|folga|pausa|atendendo|aceso|ligad|\d{1,2}h/i.test(t)) ch.push(t); } });
      const v = (erro || ch.join(' / ')).replace(/\s+/g, ' ');
      const hh = Math.floor(h) + 'h' + (h % 1 ? '30' : '');
      if (erro) E.push(`O script de horário quebra (${DIAS[d]} ${hh}): ${erro}`);
      if (/\bNaN\b|undefined|\bnull\b/.test(v)) E.push(`Texto quebrado no selo (${DIAS[d]} ${hh}): ${v}`);
      const amanha = (d + 1) % 7;
      if (temTabela && /amanhã/i.test(v) && amanha in tabela && !(tabela[amanha] || []).length) E.push(`${DIAS[d]} ${hh}: o selo diz "${v}", mas ${DIAS[amanha]} é fechado.`);
      if (temTabela && ch.length) {
        const L = v.toLowerCase();
        const diz = /abert[oa]s?\b.*agora|agora.*abert|aberto ·|atendendo agora|forno aceso|chapa ligada|rolando agora/.test(L) && !/fechad[oa] agora/.test(L);
        const dizFechado = /fechad|abre (hoje|amanhã|às|na|no|segunda|terça|quarta|quinta|sexta|sábado|domingo)|volta (amanhã|na|no|às)|folga|pausa/.test(L);
        const esp = aberto(d, h);
        if ((esp && dizFechado && !diz) || (!esp && diz)) A.push(`${DIAS[d]} ${hh}: a tabela diz ${esp ? 'ABERTO' : 'FECHADO'}, o selo diz "${v}"`);
        const ate = L.match(/até (?:as |às )?(\d{1,2})h(\d{2})?/);
        if (diz && ate) { const fim = +ate[1] + (+(ate[2] || 0)) / 60; const certo = [...(tabela[d] || []), ...(tabela[(d + 6) % 7] || []).filter(([a, b]) => b < a)].some(([a, b]) => Math.abs((b % 24) - (fim % 24)) < 0.01); if (!certo && (tabela[d] || []).length) A.push(`${DIAS[d]} ${hh}: o selo diz "${v}", mas a tabela fecha em outro horário.`); }
      }
      if (v !== ultimo) { per.push(`${hh} ${v || '(sem texto)'}`); ultimo = v; }
    }
    linhas.push(`${DIAS[d]}: ${per.join(' | ')}`);
  }
  if (linhas.every((l) => / 0h \(sem texto\)$/.test(l))) linhas.splice(0, 7, 'O script só destaca o dia de hoje na tabela (não escreve selo).');
  return { linhas, erros: [...new Set(E)], avisos: [...new Set(A)], temTabela, tabela: Object.fromEntries(Object.entries(tabela).map(([d, r]) => [DIAS[d], r.length ? r.map(([a, b]) => `${a}-${b}`).join(', ') : 'fechado'])) };
}

// Página inteira -> folha em colunas.
async function folha(page, arq, altCol, escala) {
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

// links externos (etapa 2), com cache entre páginas
const cacheLinks = new Map();
async function conferirLink(u) {
  if (cacheLinks.has(u)) return cacheLinks.get(u);
  const p = (async () => {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(u, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'Accept-Language': 'pt-BR' } });
      clearTimeout(t); return r.status;
    } catch (e) { return 'falhou: ' + (e.cause?.code || e.name); }
  })();
  cacheLinks.set(u, p); return p;
}

// ---------- auditoria de uma página ----------
async function auditar(pasta) {
  const achados = [];
  const A = (etapa, nivel, msg, extra = {}) => achados.push({ etapa, nivel, msg, ...extra });
  const est = estatica(pasta, A);
  const html = est.html;
  const recortes = [];
  let textoVisivel = '', horario = null, interacao = null, telas = [];

  for (const [W, H, tipo] of TELAS) {
    const principal = tipo === 'celular' || tipo === 'desktop';
    const { ctx, page, problemas, capturados } = await abrir(pasta, W, H);
    const m = await page.evaluate(medir, { tela: tipo, contatoAte: tipo === 'celular' ? 700 : tipo === 'desktop' ? 768 : 0 });
    if (tipo === 'desktop') textoVisivel = m.texto;
    for (const x of m.achados) {
      const linha = localizar(html, x.onde);
      let recorte = null;
      if (x.onde?.recorte && !semFotos && recortes.length < 30 && (principal || x.nivel === 'ERRO')) {
        const r = x.onde.recorte, pad = 14;
        const arq = path.join(SAIDA, 'telas', 'detalhes', `${pasta}-${String(recortes.length + 1).padStart(2, '0')}.png`);
        try {
          const H2 = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.screenshot({ path: arq, fullPage: true, clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(W, r.w + pad * 2), height: Math.min(Math.max(20, r.h + pad * 2), 700, H2 - Math.max(0, r.y - pad)) } });
          recorte = path.relative(SAIDA, arq).replace(/\\/g, '/'); recortes.push(recorte);
        } catch {}
      }
      A(x.etapa, x.nivel, `[${tipo} ${W}px] ${x.msg}`, { linha, seletor: x.onde?.seletor, recorte });
    }
    for (const s of new Set(problemas.map((p) => JSON.stringify(p)))) { const [nv, msg] = JSON.parse(s); A(1, nv, `[${tipo} ${W}px] ${msg}`); }
    if (tipo === 'celular') {
      interacao = await interagir(page, capturados, `${BASE}/previa/${pasta}/`);
      for (const r of interacao.R) if (r[0] !== 'FORM') A(8, r[0], r[1]);
      const nums = new Set([...est.zaps, ...(FICHAS[pasta] ? [com55(FICHAS[pasta].contatos?.whatsapp)] : [])].filter(Boolean));
      const zapsGerados = interacao.urls.filter((u) => /wa\.me|whatsapp/.test(u));
      for (const u of zapsGerados) {
        let num = '', texto = '';
        try { const url = new URL(u); num = (url.pathname.match(/\d{10,}/) || [])[0] || url.searchParams.get('phone') || ''; texto = url.searchParams.get('text') || ''; } catch {}
        if (num === LUCAS) continue;
        if (num && nums.size && !nums.has(num)) A(8, 'ERRO', `Um botão/formulário manda para o WhatsApp ${num}, que não é o do negócio (${[...nums].join(', ')}).`);
        if (!texto.trim()) A(8, 'AVISO', `Um botão/formulário abre o WhatsApp ${num} sem mensagem pronta.`);
        if (/undefined|NaN|\bnull\b|\[object/.test(texto)) A(8, 'ERRO', `Mensagem gerada pelo formulário com texto quebrado: "${texto}"`);
      }
      if (interacao.forms && !zapsGerados.length) A(8, 'AVISO', `A página tem ${interacao.forms} formulário(s), mas nenhum gerou link de WhatsApp ao ser enviado (confira se ele faz o que promete).`);
      interacao.resumo = `${interacao.forms} formulário(s), ${interacao.mais} botão(ões) de quantidade e ${interacao.outros} outro(s) botão(ões) testados; ${zapsGerados.length} link(s) de WhatsApp gerados${zapsGerados.length ? ':\n' + zapsGerados.map((u) => { try { const x = new URL(u); return `  - ${x.pathname.replace('/', '')} → "${x.searchParams.get('text') || ''}"`; } catch { return '  - ' + u; } }).join('\n') : '.'}`;
      const ctx2 = await navegador.newContext({ bypassCSP: true });
      const p2 = await ctx2.newPage(); await p2.goto(`${BASE}/robots.txt`).catch(() => {});
      horario = await p2.evaluate(simularHorario, html).catch((e) => ({ linhas: [], erros: ['A simulação do horário falhou: ' + e.message], avisos: [] }));
      await ctx2.close();
      if (horario) { horario.erros.forEach((e) => A(9, 'ERRO', e)); horario.avisos.forEach((e) => A(9, 'AVISO', 'O selo diverge da tabela: ' + e)); }
    }
    if (principal && !semFotos) {
      // recarrega limpo para a captura (os testes de interação mexeram na página)
      const { ctx: c3, page: p3 } = tipo === 'celular' ? await abrir(pasta, W, H) : { ctx: null, page };
      const arq = path.join(SAIDA, 'telas', `${pasta}-${tipo}.jpg`);
      await folha(p3, arq, tipo === 'celular' ? 1650 : 2600, tipo === 'celular' ? 0.5 : 0.3);
      telas.push(path.relative(SAIDA, arq).replace(/\\/g, '/'));
      if (c3) await c3.close();
    }
    await ctx.close();
  }

  // 2 Links externos
  if (!semRede) for (const u of est.externos) {
    const st = await conferirLink(u);
    if (st === 404 || st === 410 || (typeof st === 'string' && /ENOTFOUND|ECONNREFUSED/.test(st))) A(2, 'ERRO', `Link externo quebrado (${st}): ${u}`, { linha: localizar(html, { href: u.replace(/&/g, '&amp;') }) });
    else if (typeof st === 'string' || st >= 500) A(2, 'AVISO', `Não deu para conferir o link (${st}): ${u}`);
  }
  // 4 Dados x ficha · 5 Textos visíveis
  contraFicha(pasta, est, textoVisivel, A);
  const tv = textoVisivel;
  for (const [re, o] of [[/\b(\p{L}{2,})[ \t]+\1\b/iu, 'palavra repetida'], [/\s[,.;:!?](?=\s|$)/, 'espaço antes de pontuação'], [/\bWhatsapp\b|\bwhatsapp\b(?![.\/])/, '"WhatsApp" escrito errado'], [/R\$\d/, '"R$" colado no número (use R$ 10,00)'], [/R\$ ?\d+\.\d{2}\b/, 'preço com ponto no lugar da vírgula'], [/\bà partir\b/i, '"à partir" (o certo é "a partir")'], [/\bconcerto\b/i, '"concerto" (reparo é "conserto")'], [/\bderrepente\b|\bseje\b|\bmenas\b|\bfazem \d+ anos\b|\bhaviam\b/i, 'erro de português comum'], [/\bagente\b(?= (faz|vai|tem|conversa|monta|atende|cuida|entrega))/i, '"agente" (o certo é "a gente")'], [/!!|\?\?/, 'pontuação repetida'], [/\bmais melhor\b|\bmais pior\b/i, '"mais melhor/pior"']]) {
    const m = tv.match(re); if (m) { const i = tv.indexOf(m[0]); A(5, 'AVISO', `Texto: ${o} → "…${tv.slice(Math.max(0, i - 30), i + m[0].length + 30).replace(/\s+/g, ' ')}…"`, { linha: localizar(html, { texto: m[0].trim() }) }); }
  }
  const variantes = new Set((tv.match(new RegExp(est.nome.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\wÀ-ú\' &]{0,25}', 'gi')) || []).map((s) => s.trim()));
  // 10 Desempenho
  const pesoHtml = Buffer.byteLength(html);
  const total = (pesoHtml + est.pesoFotos) / 1024 / 1024;
  if (total > 3) A(10, 'AVISO', `A página pesa ${total.toFixed(1)} MB (HTML + fotos). Acima de 3 MB demora no 4G: reduza as fotos.`);
  if (pesoHtml > 120 * 1024) A(10, 'AVISO', `HTML com ${Math.round(pesoHtml / 1024)} KB.`);

  // 11 Revisão visual (vai como checklist no relatório)
  const ordenados = achados.map((a, i) => ({ ...a, i })).sort((a, b) => a.etapa - b.etapa || (a.nivel === b.nivel ? a.i - b.i : a.nivel === 'ERRO' ? -1 : 1));
  // deduplica mensagens iguais em várias telas: mantém a primeira e lista as telas
  const vistos = new Map();
  for (const a of ordenados) {
    const chave = a.etapa + a.nivel + a.msg.replace(/^\[[^\]]+\] /, '');
    const tela = (a.msg.match(/^\[([^\]]+)\]/) || [])[1];
    if (vistos.has(chave)) { const v = vistos.get(chave); if (tela && !v.telas.includes(tela)) v.telas.push(tela); continue; }
    vistos.set(chave, { ...a, msg: a.msg.replace(/^\[[^\]]+\] /, ''), telas: tela ? [tela] : [] });
  }
  const final = [...vistos.values()];
  return { pasta, nome: est.nome, titulo: est.titulo, ficha: FICHAS[pasta] ? FICHAS[pasta]._cidade : null, achados: final, erros: final.filter((a) => a.nivel === 'ERRO').length, avisos: final.filter((a) => a.nivel === 'AVISO').length, horario, interacao: interacao?.resumo, telas, variantes: [...variantes] };
}

// ---------- roda em paralelo ----------
const resultados = []; let feitas = 0;
const fila = [...pastas];
await Promise.all(Array.from({ length: Math.min(4, fila.length) }, async () => {
  while (fila.length) {
    const p = fila.shift();
    try { resultados.push(await auditar(p)); } catch (e) { resultados.push({ pasta: p, nome: p, achados: [{ etapa: 1, nivel: 'ERRO', msg: 'A auditoria não conseguiu abrir a página: ' + e.message, telas: [] }], erros: 1, avisos: 0, telas: [] }); }
    process.stdout.write(`\r${++feitas}/${pastas.length} prévias auditadas`);
  }
}));
await navegador.close(); servidor.close();
resultados.sort((a, b) => a.pasta.localeCompare(b.pasta));

// ---------- relatórios ----------
const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const tot = { e: resultados.reduce((s, r) => s + r.erros, 0), a: resultados.reduce((s, r) => s + r.avisos, 0) };
const fmtAchado = (a) => `- **${a.nivel}** ${a.msg}${a.telas?.length ? ` _(${a.telas.join(', ')})_` : ''}${a.linha ? ` · linha ${a.linha}` : ''}${a.seletor ? ` · \`${a.seletor}\`` : ''}${a.recorte ? ` · recorte: \`${a.recorte}\`` : ''}`;
const CHECK = [
  'Primeira tela do celular: nome do negócio, título forte, botão de contato e foto real do lugar',
  'Fotos: reais, do próprio lugar, nítidas, bem enquadradas, sem 360° distorcida, sem repetição, sem rosto de cliente em destaque',
  'Textos: português correto, tom do negócio, nada inventado (preço, prêmio, "desde", nº de avaliações conferem com a ficha)',
  'Layout: alinhamentos, espaços vazios grandes, cartões órfãos na grade, títulos quebrando feio, sobreposições',
  'Consistência: selo de horário = tabela; endereço = mapa; nome igual em toda a página; avaliações com autor',
  'Desktop: abertura acima da dobra, grades completas, nada esticado',
  'Imagem de compartilhamento (fotos/compartilhar.jpg): nome certo, foto boa, legível',
  'Rodapé, faixa de prévia e botão flutuante corretos',
];
function paginaMd(r, nivel = '##') {
  let md = `${nivel} ${r.pasta}${r.nome ? ' · ' + r.nome : ''}\n\n`;
  md += `**${r.erros} erros · ${r.avisos} avisos**${r.ficha ? ` · ficha em ${r.ficha}` : ' · sem ficha'}\n\n`;
  md += '| Etapa | Situação |\n|---|---|\n';
  for (let e = 1; e <= 10; e++) { const l = r.achados.filter((a) => a.etapa === e); const ne = l.filter((a) => a.nivel === 'ERRO').length; md += `| ${e}. ${ETAPAS[e]} | ${ne ? `❌ ${ne} erro(s)` : ''}${l.length - ne ? ` ⚠️ ${l.length - ne} aviso(s)` : ''}${!l.length ? '✅' : ''} |\n`; }
  md += '| 11. Revisão visual | ⬜ pendente (preencher em revisao-visual.md) |\n\n';
  for (let e = 1; e <= 10; e++) { const l = r.achados.filter((a) => a.etapa === e); if (l.length) md += `**${e}. ${ETAPAS[e]}**\n${l.map(fmtAchado).join('\n')}\n\n`; }
  if (r.interacao) md += `**8. Interação (o que foi testado)**\n${r.interacao}\n\n`;
  if (r.horario) md += `**9. Selo de horário simulado** (${r.horario.temTabela ? 'comparado com a tabela: ' + Object.entries(r.horario.tabela).map(([d, v]) => `${d} ${v}`).join(' · ') : 'sem tabela legível para comparar'})\n${r.horario.linhas.map((l) => '- ' + l).join('\n')}\n\n`;
  else md += '**9. Selo de horário**: a página não tem script de horário.\n\n';
  if (r.telas?.length) md += `**11. Revisão visual**: abrir ${r.telas.map((t) => '`' + t + '`').join(' e ')} e conferir:\n${CHECK.map((c) => '- [ ] ' + c).join('\n')}\n\n`;
  return md;
}
let md = `# Auditoria das prévias · ${agora}\n\n${resultados.length} prévias · **${tot.e} erros** · ${tot.a} avisos\n\n`;
md += '| Prévia | Erros | Avisos | Etapas com problema |\n|---|---|---|---|\n';
for (const r of resultados) md += `| ${r.pasta} | ${r.erros} | ${r.avisos} | ${[...new Set(r.achados.map((a) => a.etapa))].sort((a, b) => a - b).map((e) => e + '. ' + ETAPAS[e]).join(', ') || '—'} |\n`;
md += `\nCada prévia também tem um arquivo só dela em \`paginas/\`. A revisão visual (etapa 11) é obrigatória: preencha \`revisao-visual.md\`.\n\n---\n\n`;
md += resultados.map((r) => paginaMd(r)).join('\n---\n\n');
fs.writeFileSync(path.join(SAIDA, 'relatorio.md'), md);
fs.writeFileSync(path.join(SAIDA, 'relatorio.json'), JSON.stringify(resultados, null, 2));
for (const r of resultados) fs.writeFileSync(path.join(SAIDA, 'paginas', r.pasta + '.md'), paginaMd(r, '#'));
fs.writeFileSync(path.join(SAIDA, 'revisao-visual.md'), `# Revisão visual · ${agora}\n\nPara cada prévia: abrir as telas, marcar o checklist e anotar o que foi visto/corrigido. Não deixe nenhuma em branco.\n\n` + resultados.map((r) => `## ${r.pasta}\nTelas: ${(r.telas || []).join(', ')}\n${CHECK.map((c) => '- [ ] ' + c).join('\n')}\n\nObservações:\n\n`).join('\n'));
fs.appendFileSync(path.join(RAIZ, '.auditoria', 'historico.md'), `- ${agora} · ${resultados.length} prévias · ${tot.e} erros · ${tot.a} avisos · ${carimbo}${cidadeArg ? ' · ' + cidadeArg : ''}\n`);
// cópia para a pasta da cidade
for (const c of new Set(resultados.map((r) => r.ficha).filter(Boolean))) {
  const d = path.join(CFG.pastaCidades, c, '_controle', 'auditorias', carimbo);
  fs.mkdirSync(path.join(d, 'paginas'), { recursive: true });
  const daqui = resultados.filter((r) => r.ficha === c);
  fs.writeFileSync(path.join(d, 'relatorio.md'), `# Auditoria · ${c} · ${agora}\n\n(Capturas em feitopelolucas/.auditoria/${carimbo}/)\n\n` + daqui.map((r) => paginaMd(r)).join('\n---\n\n'));
  for (const r of daqui) fs.writeFileSync(path.join(d, 'paginas', r.pasta + '.md'), paginaMd(r, '#'));
}
console.log(`\n\n${tot.e} erros, ${tot.a} avisos em ${resultados.length} prévias.\nRelatório: ${path.relative(process.cwd(), path.join(SAIDA, 'relatorio.md'))}`);
process.exit(tot.e ? 2 : 0);
