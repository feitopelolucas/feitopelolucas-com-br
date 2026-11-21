// Selo "aberto agora" padrão das prévias. Copie para dentro do <script> da página e preencha HORARIOS.
// Testado para: dia fechado no meio da semana, pausa de almoço, virada da meia-noite (ex.: 16h às 6h).
//
// HORARIOS: 0 = domingo ... 6 = sábado. Cada dia é uma lista de faixas [abre, fecha] em horas:
//   12.5 = 12h30, 24 = meia-noite. Dia fechado = [].
//   Se a faixa passa da meia-noite, use fecha menor que abre: [16, 6] = das 16h às 6h do dia seguinte.
// No HTML: <span id="agora">Horários</span> e as linhas da tabela com data-d="0..6" (ganham a classe "hoje").
var HORARIOS = {0: [], 1: [[8, 12], [13, 18]], 2: [[8, 12], [13, 18]], 3: [[8, 12], [13, 18]], 4: [[8, 12], [13, 18]], 5: [[8, 12], [13, 18]], 6: [[8, 12]]};

function seloHorario(H, agora) {
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var fmt = function (h) { h = h % 24; var m = Math.round((h % 1) * 60); return Math.floor(h) + "h" + (m ? (m < 10 ? "0" : "") + m : ""); };
  var p = new Intl.DateTimeFormat("en-US", {timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hour12: false}).formatToParts(agora || new Date());
  var g = function (t) { return (p.find(function (x) { return x.type === t; }) || {}).value; };
  var d = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  var h = (parseInt(g("hour"), 10) % 24) + parseInt(g("minute"), 10) / 60;
  // faixas que valem agora: as de hoje e as de ontem que passaram da meia-noite
  var ontem = (d + 6) % 7, i, f;
  for (i = 0; i < (H[ontem] || []).length; i++) { f = H[ontem][i]; if (f[1] < f[0] && h < f[1]) return {d: d, aberto: true, texto: "Aberto agora · até " + fmt(f[1])}; }
  for (i = 0; i < (H[d] || []).length; i++) {
    f = H[d][i];
    var fim = f[1] < f[0] ? f[1] + 24 : f[1];
    if (h >= f[0] && h < fim) return {d: d, aberto: true, texto: "Aberto agora · até " + (fim >= 24 && f[1] === 24 ? "meia-noite" : fmt(fim))};
  }
  // fechado: próxima abertura hoje?
  for (i = 0; i < (H[d] || []).length; i++) {
    if (H[d][i][0] > h) return {d: d, aberto: false, texto: (i > 0 ? "Pausa · volta às " : "Abre hoje às ") + fmt(H[d][i][0])};
  }
  // próximos dias
  for (var k = 1; k <= 7; k++) {
    var dd = (d + k) % 7;
    if ((H[dd] || []).length) return {d: d, aberto: false, texto: "Fechado agora · abre " + (k === 1 ? "amanhã" : (dd === 6 || dd === 0 ? "no " : "na ") + DIAS[dd]) + " às " + fmt(H[dd][0][0])};
  }
  return {d: d, aberto: false, texto: "Fechado"};
}

(function () {
  try {
    var s = seloHorario(HORARIOS);
    var el = document.getElementById("agora");
    if (el) { el.textContent = s.texto; if (s.aberto) el.classList.add("sim"); }
    var tr = document.querySelector('[data-d="' + s.d + '"]'); if (tr) tr.classList.add("hoje");
  } catch (e) {}
})();

if (typeof module !== "undefined") module.exports = {seloHorario: seloHorario};
