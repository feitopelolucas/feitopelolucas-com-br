// Gera a imagem de compartilhamento (1200x630) que aparece quando o link da prévia é mandado no WhatsApp.
// Padrão: faixa de cor à esquerda com o nome e o bairro, foto real do lugar à direita.
//
// Uso (na pasta feitopelolucas):
//   node ferramentas/fotos/compartilhar.mjs <pasta> "<Nome do negócio>" "<Bairro · Cidade>" <cor-de-fundo> <foto> [cor-do-detalhe] [fonte-do-titulo]
// Exemplo:
//   node ferramentas/fotos/compartilhar.mjs pardal "Pardal Panificadora" "Vila Pompéia · Campinas" "#9e1027" fotos/fachada.jpg "#ffd3b0" "Young Serif"
// Salva em public/previa/<pasta>/fotos/compartilhar.jpg. Use a cor principal e a fonte de título da própria prévia.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const [pasta, nome, local, cor, foto, detalhe = '#ffd3b0', fonte = 'Georgia'] = process.argv.slice(2);
if (!foto) { console.error('Uso: node ferramentas/fotos/compartilhar.mjs <pasta> "<Nome>" "<Bairro · Cidade>" <cor> <foto> [cor-do-detalhe] [fonte]'); process.exit(1); }
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = path.join(RAIZ, 'public', 'previa', pasta);
const arqFoto = path.join(dir, foto);
if (!fs.existsSync(arqFoto)) { console.error('Foto não encontrada: ' + arqFoto); process.exit(1); }
const ext = path.extname(arqFoto).slice(1).replace('jpg', 'jpeg');
const img = `data:image/${ext};base64,${fs.readFileSync(arqFoto).toString('base64')}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const familia = encodeURIComponent(fonte).replace(/%20/g, '+');

const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=${familia}:wght@400;700&display=block" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;display:grid;grid-template-columns:640px 560px;font-family:Arial,Helvetica,sans-serif}
.esq{background:${cor};color:#fff;padding:110px 70px 0;position:relative}
.esq i{display:block;width:80px;height:8px;background:${detalhe};margin-bottom:44px}
h1{font:700 ${nome.length > 22 ? 64 : 76}px/1.08 "${fonte}",Georgia,serif;margin:0}
p{color:${detalhe};font-size:28px;margin:26px 0 0}
small{position:absolute;left:70px;bottom:44px;font-size:21px;color:rgba(255,255,255,.85)}
.dir{background:url(${img}) center/cover}
</style></head><body><div class="esq"><i></i><h1>${esc(nome)}</h1><p>${esc(local)}</p><small>Prévia de site · feitopelolucas.com.br</small></div><div class="dir"></div></body></html>`);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
const saida = path.join(dir, 'fotos', 'compartilhar.jpg');
fs.mkdirSync(path.dirname(saida), { recursive: true });
await p.screenshot({ path: saida, type: 'jpeg', quality: 85 });
await b.close();
console.log('Salvo: ' + path.relative(process.cwd(), saida));
