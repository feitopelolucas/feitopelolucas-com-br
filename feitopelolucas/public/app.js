(function () {
  const cfg = window.CONFIG || {};
  const sites = window.SITES || [];
  const $ = (s) => document.querySelector(s);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const whatsLink = (msg) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
  const mailLink = (subject, body) => `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || "")}`;
  const isSold = (s) => s.status === "vendido";
  const isOrder = (s) => s.status === "encomenda";

  // Capa: print do site, ou um bloco de cor com o nome
  function cover(s) {
    if (s.imagem) return `<img src="${esc(s.imagem)}" alt="Foto do modelo ${esc(s.nome)}" loading="lazy">`;
    const bg = (s.cores && s.cores[0]) || "#2b2a26";
    return `<div class="flat" style="background:${esc(bg)};color:#f3efe6"><span>${esc(s.nome)}</span></div>`;
  }
  function stamp(s) {
    if (isSold(s)) return `<span class="stamp">Vendido</span>`;
    if (isOrder(s)) return `<span class="stamp encomenda">Sob encomenda</span>`;
    return "";
  }
  function priceHtml(s) {
    if (isSold(s)) return "Vendido";
    if (isOrder(s)) return `<small>a partir de</small> ${brl(s.preco)}`;
    return (s.precoAntigo ? `<s>${brl(s.precoAntigo)}</s>` : "") + brl(s.preco);
  }

  $("#meta").textContent = "Todos os modelos podem ser feitos com o seu nome, as suas cores e as suas informações.";

  // Filtros
  const peso = (s) => (isSold(s) ? 2 : isOrder(s) ? 1 : 0);
  const ordered = [...sites].sort((a, b) => peso(a) - peso(b));
  const count = (c) => (c === "Todos" ? sites.length : sites.filter((s) => s.categoria === c).length);
  const cats = ["Todos", ...new Set(sites.map((s) => s.categoria))];
  let current = "Todos";
  const filters = $("#filters");
  filters.innerHTML = cats
    .map((c) => `<button type="button" aria-pressed="${c === current}" data-cat="${esc(c)}">${esc(c)}<sup>${count(c)}</sup></button>`)
    .join("");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    current = btn.dataset.cat;
    filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === btn));
    render();
  });

  function render() {
    const list = ordered.filter((s) => current === "Todos" || s.categoria === current);
    $("#grid").innerHTML = list
      .map(
        (s) => `<button type="button" class="item${isSold(s) ? " sold" : ""}" data-id="${esc(s.id)}">
          <div class="cover">${cover(s)}${stamp(s)}</div>
          <div class="item-line"><h3>${esc(s.nome)}</h3><span class="price">${isSold(s) ? "—" : priceHtml(s)}</span></div>
          <p>${esc(s.resumo)}</p>
          <p class="meta">${esc(s.categoria)}${isOrder(s) ? " · feito com os seus dados" : s.exclusivo ? " · exclusivo" : ""}</p>
        </button>`
      )
      .join("");
    $("#empty").hidden = list.length > 0;
  }

  // Janela de detalhes
  const modal = $("#modal");
  let atual = null;
  function open(id) {
    const s = sites.find((x) => x.id === id);
    if (!s) return;
    atual = s;
    $("#m-media").innerHTML = cover(s) + stamp(s);
    $("#m-meta").textContent = s.categoria + (isOrder(s)
      ? " · sob encomenda, feito com os seus dados"
      : s.exclusivo ? " · exclusivo: vendido uma única vez" : "");
    $("#m-title").textContent = s.nome;
    $("#m-desc").textContent = s.descricao || s.resumo;
    $("#m-features").innerHTML = (s.recursos || []).map((r) => `<li>${esc(r)}</li>`).join("");
    $("#m-price").innerHTML = priceHtml(s);

    const demo = $("#m-demo");
    if (s.demo) { demo.href = s.demo; demo.removeAttribute("aria-disabled"); demo.textContent = "Ver funcionando ↗"; }
    else { demo.removeAttribute("href"); demo.setAttribute("aria-disabled", "true"); demo.textContent = "Demonstração em breve"; }
    $("#m-ir").textContent = isSold(s) ? "Quero um semelhante" : "Quero um assim";

    $("#p-erro").textContent = "";
    modal.querySelectorAll(".invalido").forEach((el) => el.classList.remove("invalido"));
    modal.showModal();
    modal.scrollTop = 0;
    history.replaceState(null, "", "#site-" + s.id);
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

  // Pedido com os dados do cliente
  $("#m-pedido").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!atual) return;
    const v = (id) => $(id).value.trim();
    const faltando = ["#p-nome", "#p-negocio"].filter((id) => !v(id));
    ["#p-nome", "#p-negocio"].forEach((id) => $(id).classList.toggle("invalido", faltando.includes(id)));
    if (faltando.length) {
      $("#p-erro").textContent = "Preencha o seu nome e o nome do negócio para eu saber com quem estou falando.";
      $(faltando[0]).focus();
      return;
    }
    $("#p-erro").textContent = "";
    const tenho = [...modal.querySelectorAll(".tenho input:checked")].map((c) => c.value);
    const linhas = [
      `Olá, Lucas! Quero um site no estilo do modelo "${atual.nome}".`,
      "",
      `Meu nome: ${v("#p-nome")}`,
      `Negócio: ${v("#p-negocio")}`,
    ];
    if (v("#p-ramo")) linhas.push(`O que faz: ${v("#p-ramo")}`);
    if (v("#p-cidade")) linhas.push(`Cidade: ${v("#p-cidade")}`);
    if (v("#p-cores")) linhas.push(`Cores: ${v("#p-cores")}`);
    linhas.push(`Já tenho: ${tenho.length ? tenho.join(", ") : "nada ainda"}`);
    if (v("#p-info")) linhas.push("", "Informações:", v("#p-info"));
    window.open(whatsLink(linhas.join("\n")), "_blank", "noopener");
  });

  // Pedidos de orçamento dos serviços
  document.querySelectorAll(".ask").forEach((a) => {
    a.href = whatsLink(a.dataset.msg);
    a.target = "_blank";
    a.rel = "noopener";
  });

  $("#cta-whats").href = whatsLink("Olá, Lucas! Vi o seu site e gostaria de conversar.");
  $("#cta-mail").href = mailLink("Contato pelo site", "Olá, Lucas!");
  $("#y").textContent = new Date().getFullYear();

  render();
  // Link direto para um site: feitopelolucas.com.br/#site-<id>
  const m = location.hash.match(/^#site-(.+)$/);
  if (m) open(decodeURIComponent(m[1]));
})();
