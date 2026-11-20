(function () {
  const cfg = window.CONFIG || {};
  const sites = window.SITES || [];
  const I18N = window.I18N || { en: {}, ui: { pt: {}, en: {} } };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const whatsLink = (msg) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
  const mailLink = (subject, body) => `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || "")}`;
  const isSold = (s) => s.status === "vendido";
  const isOrder = (s) => s.status === "encomenda";

  /* ---------- Idioma ---------- */
  // Categorias em inglês (o português vem do sites.js)
  const CAT_EN = {
    "Todos": "All", "Serviços": "Services", "Loja virtual": "Online store", "Restaurante": "Food", "Saúde": "Health",
    "Beleza": "Beauty", "Portfólio": "Portfolio", "Esportes": "Fitness", "Link na bio": "Link in bio", "Eventos": "Events",
    "Pet": "Pets", "Educação": "Education", "Imobiliária": "Real estate",
  };
  let lang = document.documentElement.dataset.idioma === "en" ? "en" : "pt";
  const T = () => I18N.ui[lang];
  const brl = (n) => n.toLocaleString(lang === "en" ? "en-US" : "pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const cat = (c) => (lang === "en" ? CAT_EN[c] || c : c);
  // Texto do site no idioma atual: usa s.en quando existe, senão o português
  const tx = (s, campo) => (lang === "en" && s.en && s.en[campo] != null ? s.en[campo] : s[campo]);

  const PT = {}; // guarda o português original de cada elemento
  function aplicarIdioma() {
    const en = I18N.en;
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    document.documentElement.dataset.idioma = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      if (!(k in PT)) PT[k] = el.innerHTML;
      if (lang === "en" && en[k] != null) el.innerHTML = en[k];
      else if (lang === "pt") el.innerHTML = PT[k];
    });
    [["data-i18n-ph", "placeholder"], ["data-i18n-aria", "aria-label"], ["data-i18n-alt", "alt"]].forEach(([attr, alvo]) => {
      document.querySelectorAll("[" + attr + "]").forEach((el) => {
        const k = el.getAttribute(attr), chave = alvo + ":" + k;
        if (!(chave in PT)) PT[chave] = el.getAttribute(alvo);
        el.setAttribute(alvo, lang === "en" && en[k] != null ? en[k] : PT[chave]);
      });
    });
    if (!("titulo" in PT)) { PT.titulo = document.title; PT.descricao = $('meta[name="description"]').content; PT.atual = $("#lang-atual").textContent; }
    document.title = lang === "en" ? en.titulo : PT.titulo;
    $('meta[name="description"]').content = lang === "en" ? en.descricao : PT.descricao;
    $("#lang-atual").textContent = lang === "en" ? en["lang.atual"] : PT.atual;
    document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));

    document.querySelectorAll(".ask").forEach((a) => { a.href = whatsLink(lang === "en" ? a.dataset.msgEn : a.dataset.msg); a.target = "_blank"; a.rel = "noopener"; });
    $("#cta-whats").href = whatsLink(T().msgContato);
    // Esses dois podem faltar numa página antiga guardada no cache do navegador
    ["#cta-hero", "#cta-fixo"].forEach((id) => { const el = $(id); if (el) el.href = whatsLink(T().msgContato); });
    $("#cta-mail").href = mailLink(T().assuntoEmail, T().corpoEmail);

    desenharFiltros();
    render();
    if (modal.open && atual) preencher(atual);
  }
  document.querySelector(".lang-switch").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lang]");
    if (!b || b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem("idioma", lang); } catch (err) {}
    const u = new URL(location.href);
    if (lang === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
    aplicarIdioma();
  });

  /* ---------- Cartões ---------- */
  // No cartão, a versão pequena (-p, 400px) serve na tela comum; a grande (-g) fica para telas densas e para a janela
  function cover(s, cartao) {
    if (s.imagem && cartao && /-g\.jpg$/.test(s.imagem)) {
      const p = s.imagem.replace(/-g\.jpg$/, "-p.jpg");
      return `<img src="${esc(p)}" srcset="${esc(p)} 400w, ${esc(s.imagem)} 1375w" sizes="(max-width:700px) calc(100vw - 32px), 340px" alt="${esc(T().fotoModelo)} ${esc(s.nome)}" loading="lazy">`;
    }
    if (s.imagem) return `<img src="${esc(s.imagem)}" alt="${esc(T().fotoModelo)} ${esc(s.nome)}" loading="lazy">`;
    const bg = (s.cores && s.cores[0]) || "#2b2a26";
    return `<div class="flat" style="background:${esc(bg)};color:#f3efe6"><span>${esc(s.nome)}</span></div>`;
  }
  function stamp(s) {
    if (isSold(s)) return `<span class="stamp">${T().vendido}</span>`;
    return "";
  }
  function priceHtml(s) {
    if (isSold(s)) return T().vendido;
    if (isOrder(s)) return `<small>${T().apartir}</small> ${brl(s.preco)}`;
    return (s.precoAntigo ? `<s>${brl(s.precoAntigo)}</s>` : "") + brl(s.preco);
  }

  // Filtros
  const peso = (s) => (isSold(s) ? 2 : isOrder(s) ? 1 : 0);
  const ordered = [...sites].sort((a, b) => peso(a) - peso(b));
  const count = (c) => (c === "Todos" ? sites.length : sites.filter((s) => s.categoria === c).length);
  const cats = ["Todos", ...new Set(sites.map((s) => s.categoria))];
  let current = "Todos";
  const filters = $("#filters");
  function desenharFiltros() {
    filters.innerHTML = cats
      .map((c) => `<button type="button" aria-pressed="${c === current}" data-cat="${esc(c)}">${esc(cat(c))}<sup>${count(c)}</sup></button>`)
      .join("");
  }
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    current = btn.dataset.cat;
    filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
    render();
  });

  // Em "Todos", só os sites com destaque aparecem; o resto fica atrás do botão "Ver mais"
  let aberto = false;
  const verMais = $("#ver-mais");
  verMais.addEventListener("click", () => {
    aberto = !aberto;
    render();
    if (!aberto) $("#grid").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function render() {
    let list = ordered.filter((s) => current === "Todos" || s.categoria === current);
    const escondidos = current === "Todos" ? list.filter((s) => !s.destaque).length : 0;
    if (current === "Todos") list = [...list.filter((s) => s.destaque), ...(aberto ? list.filter((s) => !s.destaque) : [])];
    verMais.hidden = escondidos === 0;
    verMais.textContent = aberto ? T().verMenos : T().verMais(escondidos);
    verMais.setAttribute("aria-expanded", aberto);
    $("#grid").innerHTML = list
      .map(
        (s) => `<button type="button" class="item${isSold(s) ? " sold" : ""}" data-id="${esc(s.id)}">
          <div class="cover">${cover(s, true)}${stamp(s)}</div>
          <div class="item-line"><h3>${esc(s.nome)}</h3><span class="price">${isSold(s) ? "—" : priceHtml(s)}</span></div>
          <p>${esc(tx(s, "resumo"))}</p>
          <p class="meta">${esc(cat(s.categoria))}</p>
        </button>`
      )
      .join("");
    $("#empty").hidden = list.length > 0;
  }

  /* ---------- Janela de detalhes ---------- */
  const modal = $("#modal");
  let atual = null;
  function preencher(s) {
    $("#m-media").innerHTML = cover(s) + stamp(s);
    $("#m-meta").textContent = cat(s.categoria);
    $("#m-title").textContent = s.nome;
    $("#m-desc").textContent = tx(s, "descricao") || tx(s, "resumo");
    $("#m-features").innerHTML = (tx(s, "recursos") || []).map((r) => `<li>${esc(r)}</li>`).join("");
    $("#m-price").innerHTML = priceHtml(s);
    $("#m-aviso").hidden = !(s.demo && T().avisoDemo);
    $("#m-aviso").textContent = T().avisoDemo;
    const demo = $("#m-demo");
    if (s.demo) { demo.href = s.demo; demo.removeAttribute("aria-disabled"); demo.textContent = T().verFuncionando; }
    else { demo.removeAttribute("href"); demo.setAttribute("aria-disabled", "true"); demo.textContent = T().emBreve; }
    $("#m-ir").textContent = isSold(s) ? T().queroSemelhante : T().quero;
  }
  function open(id) {
    const s = sites.find((x) => x.id === id);
    if (!s) return;
    atual = s;
    preencher(s);
    $("#p-erro").textContent = "";
    modal.querySelectorAll(".invalido").forEach((el) => el.classList.remove("invalido"));
    modal.showModal();
    modal.scrollTop = 0;
    history.replaceState(null, "", location.pathname + location.search + "#site-" + s.id);
  }
  modal.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  $("#grid").addEventListener("click", (e) => {
    const item = e.target.closest(".item");
    if (item) open(item.dataset.id);
  });
  $("#m-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $("#m-ir").addEventListener("click", (e) => {
    e.preventDefault();
    $("#m-pedido").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("#p-nome").focus({ preventScroll: true }), 350);
  });

  // Pedido com os dados do cliente (a mensagem sai no idioma escolhido)
  $("#m-pedido").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!atual) return;
    const v = (id) => $(id).value.trim();
    const faltando = ["#p-nome", "#p-negocio"].filter((id) => !v(id));
    ["#p-nome", "#p-negocio"].forEach((id) => $(id).classList.toggle("invalido", faltando.includes(id)));
    if (faltando.length) {
      $("#p-erro").textContent = T().erroPedido;
      $(faltando[0]).focus();
      return;
    }
    $("#p-erro").textContent = "";
    const t = T();
    const tenho = [...modal.querySelectorAll(".tenho input:checked")].map((c) => (lang === "en" ? c.dataset.en : c.value));
    const linhas = [t.msgPedido(atual.nome), "", `${t.rotNome}: ${v("#p-nome")}`, `${t.rotNegocio}: ${v("#p-negocio")}`];
    if (v("#p-ramo")) linhas.push(`${t.rotRamo}: ${v("#p-ramo")}`);
    if (v("#p-cidade")) linhas.push(`${t.rotCidade}: ${v("#p-cidade")}`);
    if (v("#p-cores")) linhas.push(`${t.rotCores}: ${v("#p-cores")}`);
    linhas.push(`${t.rotTenho}: ${tenho.length ? tenho.join(", ") : t.nadaAinda}`);
    if (v("#p-info")) linhas.push("", t.rotInfo, v("#p-info"));
    window.open(whatsLink(linhas.join("\n")), "_blank", "noopener");
  });

  $("#y").textContent = new Date().getFullYear();

  // Botão fixo de WhatsApp: aparece depois da abertura e some quando o contato está na tela
  const fixo = $("#cta-fixo");
  if (fixo && "IntersectionObserver" in window) {
    const visivel = new Map();
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => visivel.set(en.target, en.isIntersecting));
      fixo.hidden = [...visivel.values()].some(Boolean);
    });
    io.observe($(".intro"));
    io.observe($("#contato"));
  }

  aplicarIdioma();
  // Link direto para um site: feitopelolucas.com.br/#site-<id>
  const m = location.hash.match(/^#site-(.+)$/);
  if (m) open(decodeURIComponent(m[1]));
})();
