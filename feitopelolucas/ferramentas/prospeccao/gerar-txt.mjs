// Gera, a partir das fichas, um .txt por negócio na pasta da cidade, pronto para o Lucas mandar a mensagem.
//
// Uso (na pasta feitopelolucas):
//   node ferramentas/prospeccao/gerar-txt.mjs "<Cidade - UF>"       ex.: "Valinhos - SP"
//
// Lê   <pastaCidades>/<Cidade - UF>/_controle/fichas/*.json   (formato: ficha-modelo.json)
// Grava <pastaCidades>/<Cidade - UF>/NN - Nome.txt             (só fichas com situacao "mensagem pronta")
//       <pastaCidades>/<Cidade - UF>/00 - LEIA-ME.txt          (lista do lote, em ordem de envio)
//       <pastaCidades>/<Cidade - UF>/Enviadas/                 (o Lucas arrasta o .txt para cá depois de mandar;
//                                                               quem já está aqui não é gerado de novo)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(AQUI, 'config.json'), 'utf8'));
const cidade = process.argv[2];
if (!cidade) { console.error('Uso: node ferramentas/prospeccao/gerar-txt.mjs "<Cidade - UF>"'); process.exit(1); }
const DIR = path.join(cfg.pastaCidades, cidade);
const FICHAS = path.join(DIR, '_controle', 'fichas');
if (!fs.existsSync(FICHAS)) { console.error('Não achei as fichas em ' + FICHAS); process.exit(1); }
fs.mkdirSync(path.join(DIR, 'Enviadas'), { recursive: true });

const fichas = fs.readdirSync(FICHAS).filter((f) => f.endsWith('.json')).map((f) => {
  try { return JSON.parse(fs.readFileSync(path.join(FICHAS, f), 'utf8')); } catch (e) { console.error('Ficha com erro: ' + f + ' (' + e.message + ')'); return null; }
}).filter(Boolean).sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

const NL = '\r\n'; // o Bloco de Notas do Windows lê melhor com CRLF
const limpar = (s) => String(s || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
const digitos = (s) => String(s || '').replace(/\D/g, '');
const zap = (s) => { const d = digitos(s); if (!d) return ''; return d.startsWith('55') ? d : '55' + d; };
const linha = (rot, val) => (val ? `${rot.padEnd(14)}${val}` : null);
const quebra = (txt, w = 78) => String(txt || '').split(/\r?\n/).flatMap((par) => {
  const out = []; let cur = '';
  for (const p of par.split(' ')) { if ((cur + ' ' + p).trim().length > w) { out.push(cur.trim()); cur = p; } else cur += ' ' + p; }
  out.push(cur.trim()); return out;
});
const enviadas = new Set(fs.readdirSync(path.join(DIR, 'Enviadas')).map((f) => f.replace(/^\d+ - /, '').replace(/\.txt$/i, '').toLowerCase()));
const nomeArq = (f) => `${String(f.ordem || 0).padStart(2, '0')} - ${limpar(f.nome)}.txt`;

// apaga .txt antigos do lote (os da pasta Enviadas ficam)
for (const f of fs.readdirSync(DIR)) if (/^\d\d - .*\.txt$/i.test(f)) fs.unlinkSync(path.join(DIR, f));

let feitos = 0;
const prontas = fichas.filter((f) => f.situacao === 'mensagem pronta');
for (const f of prontas) {
  if (enviadas.has(limpar(f.nome).toLowerCase())) continue;
  const c = f.contatos || {};
  const w = zap(c.whatsapp);
  const L = [];
  L.push(f.nome.toUpperCase(), `${f.ramo || ''}${f.bairro ? ' · ' + f.bairro : ''} · ${f.cidade}/${f.uf}`, '');
  L.push('PRÉVIA DO SITE', f.previa, '');
  L.push('=== COMO FALAR COM ELES ' + '='.repeat(50));
  L.push(...[
    linha('Melhor canal:', f.melhorCanal),
    linha('WhatsApp:', c.whatsapp),
    linha('Telefone:', c.telefone),
    linha('Instagram:', c.instagram ? `${c.instagram}  (https://www.instagram.com/${c.instagram.replace(/^@/, '')}/)` : ''),
    linha('E-mail:', c.email),
    linha('Facebook:', c.facebook),
    linha('Outros:', c.outros),
    linha('Dono/contato:', f.dono),
  ].filter(Boolean));
  if (w) {
    L.push('', 'Abrir o WhatsApp já com a mensagem escrita (copie o link no navegador):');
    L.push(`https://wa.me/${w}?text=${encodeURIComponent(f.mensagem || '')}`);
  }
  if (!w && !c.telefone && !c.instagram && !c.email) L.push('ATENÇÃO: nenhum contato público encontrado. Ir pessoalmente ou pelo Facebook.');
  L.push('', '=== MENSAGEM (copie e cole) ' + '='.repeat(46), '');
  L.push(...String(f.mensagem || '').split(/\r?\n/));
  L.push('', '='.repeat(74), '');
  if (f.atencao) L.push('ATENÇÃO ANTES DE MANDAR', ...quebra(f.atencao.charAt(0).toUpperCase() + f.atencao.slice(1)), '');
  L.push('=== DADOS DO NEGÓCIO ' + '='.repeat(53));
  L.push(...[
    linha('Endereço:', f.endereco), linha('Horário:', f.horario),
    linha('Google:', f.nota ? `nota ${f.nota} (${f.avaliacoes} avaliações)` : ''),
    linha('Desde:', f.desde), linha('Site hoje:', f.siteHoje), linha('Prioridade:', f.prioridade),
    linha('Google Maps:', f.googleMaps),
  ].filter(Boolean));
  if (f.peloQueVi) L.push('', 'PELO QUE VI', ...quebra(f.peloQueVi));
  L.push('', `Depois de mandar, arraste este arquivo para a pasta "Enviadas".`);
  fs.writeFileSync(path.join(DIR, nomeArq(f)), '﻿' + L.join(NL) + NL);
  feitos++;
}

// LEIA-ME do lote
const R = [];
R.push(`PROSPECÇÃO · ${cidade.toUpperCase()}`, `Atualizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, '');
R.push('Cada arquivo "NN - Nome.txt" tem a mensagem pronta, os contatos e os dados do negócio.');
R.push('Mande na ordem dos números (os primeiros são os mais promissores).');
R.push('Depois de mandar, arraste o arquivo para a pasta "Enviadas" para não mandar duas vezes.', '');
R.push(`PRONTAS PARA ENVIAR (${prontas.length})`);
for (const f of prontas) {
  const c = f.contatos || {};
  const env = enviadas.has(limpar(f.nome).toLowerCase()) ? '  [já enviada]' : '';
  const canal = f.melhorCanal || 'sem canal definido';
  const contato = /\d{4}|@/.test(canal) ? '' : ': ' + (c.whatsapp || c.instagram || c.telefone || c.email || 'sem contato');
  R.push(`  ${String(f.ordem).padStart(2, '0')}. ${f.nome} · ${canal}${contato}${env}`);
}
const outras = fichas.filter((f) => f.situacao !== 'mensagem pronta');
const pul = outras.filter((f) => /^pulado/.test(f.situacao || ''));
const and = outras.filter((f) => !/^pulado/.test(f.situacao || ''));
if (and.length) { R.push('', `AINDA EM ANDAMENTO (${and.length})`); and.forEach((f) => R.push(`  ${f.nome} · ${f.situacao}`)); }
if (pul.length) { R.push('', `PULADOS (${pul.length})`); pul.forEach((f) => R.push(...quebra(`${f.nome} · ${f.motivoPulado || f.situacao}`, 74).map((l, i) => (i ? '      ' : '  ') + l))); }
fs.writeFileSync(path.join(DIR, '00 - LEIA-ME.txt'), '﻿' + R.join(NL) + NL);

console.log(`${feitos} arquivo(s) .txt gerados em ${DIR}`);
