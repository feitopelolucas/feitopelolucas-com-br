/*
 * ===== CATÁLOGO DE SITES =====
 * Edite este arquivo para adicionar, remover ou alterar os sites da vitrine.
 *
 * Campos de cada site:
 *   id          identificador único, sem espaços (ex.: "restaurante-sabor")
 *   nome        nome exibido
 *   categoria   usada nos filtros (ex.: "Restaurante", "Saúde", "Serviços")
 *   resumo      frase curta que aparece no card
 *   descricao   texto mais completo que aparece ao abrir o site
 *   preco       valor em reais (número). Ex.: 1490
 *   precoAntigo (opcional) valor riscado, para promoções
 *   status      "disponivel" (pronto para comprar), "encomenda" (modelo para pedir com os seus dados)
 *               ou "vendido" (aparece apagado, sem pedido)
 *   exclusivo   true = vendido uma única vez (sai da vitrine depois)
 *   demo        (opcional) link da demonstração ao vivo
 *   imagem      (opcional) caminho de um print do site, ex.: "/img/restaurante.jpg"
 *               (coloque o arquivo dentro de public/img/). Sem imagem, aparece uma capa colorida.
 *   cores       (opcional) duas cores para a capa colorida quando não há imagem
 *   recursos    lista do que o site tem
 *
 * OS SITES ABAIXO SÃO EXEMPLOS — troque pelos seus.
 */

window.CONFIG = {
  // Seu WhatsApp com DDI + DDD, só números. Ex.: "5511999998888"
  whatsapp: "5519996515563",
  email: "contato@feitopelolucas.com.br",
};

window.SITES = [
  {
    id: "brisa-higienizacao",
    nome: "Brisa Higienização",
    categoria: "Serviços",
    resumo: "Página única para prestadores de serviço que recebem clientes pelo Instagram.",
    descricao: "Feito para quem divulga no Instagram e fecha negócio no WhatsApp. Abre rápido no celular, tem um botão de WhatsApp em cada serviço, com a mensagem já escrita, e um botão fixo no canto da tela. O exemplo é de uma empresa fictícia de higienização de estofados.",
    preco: 1200,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/brisa-higienizacao/",
    imagem: "/img/modelos/1686178827149-6d55c72d81df-g.jpg",
    cores: ["#1F6FEB"],
    recursos: ["Feito primeiro para o celular", "Botão de WhatsApp por serviço", "Botão fixo de WhatsApp", "Galeria de fotos", "Horário e contato", "Link para o Instagram"],
  },
  {
    id: "casa-verde-vasos",
    nome: "Casa Verde Vasos",
    categoria: "Loja virtual",
    resumo: "Loja pequena, com catálogo, carrinho e pagamento online.",
    descricao: "Loja para quem vende poucos produtos e quer receber pagamentos sem complicação. Tem catálogo, página de cada produto, carrinho que fica salvo no celular, produtos em falta e telas de pedido recebido e de pagamento cancelado. Na versão de verdade, os pedidos ficam guardados num banco de dados e o pagamento é feito pela Stripe. A demonstração simula o pagamento e usa uma loja fictícia de vasos.",
    preco: 1490,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/casa-verde-vasos/",
    imagem: "/img/modelos/1621512367176-03782e847fa2-g.jpg",
    cores: ["#2f5d46"],
    recursos: ["Catálogo de até 6 produtos", "Página de cada produto", "Carrinho salvo no celular", "Produtos em falta", "Pagamento pela Stripe", "Pedidos guardados no banco"],
  },
  {
    id: "cantinho-do-sabor",
    nome: "Cantinho do Sabor",
    categoria: "Restaurante",
    resumo: "Cardápio por QR code e pedido de reserva, os dois pelo WhatsApp.",
    descricao: "Uma página com duas abas. No cardápio, o cliente escolhe os itens e envia o pedido já escrito para o WhatsApp, com o total calculado e os itens indisponíveis no dia. Na aba de reservas, informa nome, data, horário e número de pessoas; a página confere os dias e horários aceitos, o máximo de pessoas e a antecedência mínima antes de enviar. Para mudar um preço ou um horário, basta editar uma linha. O exemplo é de uma lanchonete fictícia.",
    preco: 1200,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/cantinho-do-sabor/",
    imagem: "/img/modelos/1765894711215-ba5b1bd6d1f7-g.jpg",
    cores: ["#7a1f1f"],
    recursos: ["Abre pelo QR code", "Categorias e preços", "Itens indisponíveis no dia", "Pedido de reserva validado", "Dias, horários e máximo de pessoas", "Tudo enviado pelo WhatsApp"],
  },
  {
    id: "esquina-do-lanche",
    nome: "Esquina do Lanche",
    categoria: "Restaurante",
    resumo: "Página de pedidos para delivery, com combos e entrega por bairro.",
    descricao: "Feita para lanchonetes que recebem pedidos de entrega pelo WhatsApp. O cliente monta o pedido com os botões de mais e menos, vê o total no carrinho fixo e, ao finalizar, informa nome, endereço, bairro, forma de pagamento e troco. O pedido chega escrito, uma informação por linha. Todo o cardápio e os dados da loja ficam num único bloco fácil de editar. O exemplo é de uma lanchonete fictícia.",
    preco: 1200,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/esquina-do-lanche/",
    imagem: "/img/modelos/1568901346375-23c9450c58cd-g.jpg",
    cores: ["#2b211b"],
    recursos: ["Combos em destaque", "Carrinho fixo com o total", "Bairros de entrega", "Pagamento e troco", "Pedido escrito no WhatsApp", "Dados num bloco só"],
  },
  {
    id: "restaurante-sabor",
    nome: "Sabor & Brasa",
    categoria: "Restaurante",
    resumo: "Site para restaurante de carnes, com o que está no fogo hoje e preços por quilo.",
    descricao: "Feito para casas de carne, churrascarias e restaurantes com um prato principal forte. Mostra o que está no fogo no dia, conta o preparo hora a hora, traz a tabela de preços do balcão e da encomenda para levar, e leva a reserva para o WhatsApp.",
    preco: 1290,
    status: "encomenda",
    exclusivo: true,
    demo: "/modelos/sabor-e-brasa/",
    imagem: "/img/modelos/1679711246825-1f2bd51b16d0-g.jpg",
    cores: ["#3a1c0f", "#c2410c"],
    recursos: ["Quadro do que está no fogo hoje", "Preparo contado hora a hora", "Preços do balcão e para levar", "Encomenda pelo WhatsApp", "Reserva de mesa", "Espaço para fotos"],
  },
  {
    id: "clinica-vida",
    nome: "Clínica Vida",
    categoria: "Saúde",
    resumo: "Site para clínicas e consultórios, com quem atende em cada dia.",
    descricao: "Mostra logo de cara quem atende hoje e traz um quadro semanal com os dias de cada especialidade. Tem a lista de profissionais com registro, as orientações para antes da consulta, os convênios e a marcação pelo WhatsApp.",
    preco: 1490,
    status: "encomenda",
    exclusivo: true,
    demo: "/modelos/clinica-vida/",
    imagem: "/img/modelos/1631217868264-e5b90bb7e133-g.jpg",
    cores: ["#0c4a6e", "#14b8a6"],
    recursos: ["Quem atende hoje", "Quadro semanal por especialidade", "Profissionais e registros", "Orientações antes da consulta", "Convênios aceitos", "Marcação pelo WhatsApp"],
  },
  {
    id: "advocacia-pro",
    nome: "Lex Advocacia",
    categoria: "Serviços",
    resumo: "Site sóbrio para escritórios de advocacia, escrito como um documento.",
    descricao: "Organizado como um documento jurídico: as áreas de atuação aparecem como artigos numerados, os sócios assinam a página e os textos do escritório ficam numa lista de escritos. Diz com clareza o que o escritório faz e o que não faz.",
    preco: 1690,
    status: "encomenda",
    exclusivo: true,
    demo: "/modelos/lex-advocacia/",
    imagem: "/img/modelos/1505664194779-8beaceb93744-g.jpg",
    cores: ["#1c1917", "#a16207"],
    recursos: ["Áreas em artigos numerados", "Sócios com assinatura e OAB", "Lista de artigos do escritório", "Primeira conversa pelo WhatsApp", "Visual de papel timbrado", "Texto sóbrio, sem promessas"],
  },
  {
    id: "barbearia-navalha",
    nome: "Navalha Barbearia",
    categoria: "Beleza",
    resumo: "Site para barbearias, com tabela de letras e agenda por barbeiro.",
    descricao: "A tabela de preços aparece num quadro de letras, como os de parede. Cada barbeiro tem a sua cadeira, os seus dias e um botão para marcar direto com ele. Explica como funciona a fila com e sem hora marcada.",
    preco: 1200,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/navalha-barbearia/",
    imagem: "/img/modelos/1585747860715-2ba37e788b70-g.jpg",
    cores: ["#111827", "#b91c1c"],
    recursos: ["Tabela em quadro de letras", "Agenda por barbeiro", "Fila com e sem hora marcada", "Fotos dos cortes", "Horários e endereço"],
  },
  {
    id: "portfolio-foto",
    nome: "Lente Portfólio",
    categoria: "Portfólio",
    resumo: "Portfólio de fotografia montado como uma folha de contato.",
    descricao: "Os trabalhos aparecem como tiras de filme, com as fotos escolhidas pelo cliente marcadas a lápis. Cada foto abre ampliada. Tem a tabela de valores e o contato para consultar datas.",
    preco: 1200,
    status: "encomenda",
    exclusivo: false,
    demo: "/modelos/lente-portfolio/",
    imagem: "/img/modelos/1772989665252-7cb41ae759cc-g.jpg",
    cores: ["#27272a", "#71717a"],
    recursos: ["Trabalhos em tiras de filme", "Fotos escolhidas em destaque", "Foto ampliada ao tocar", "Tabela de valores", "Consulta de datas pelo WhatsApp"],
  },
  {
    id: "academia-forca",
    nome: "Força Fit",
    categoria: "Esportes",
    resumo: "Site para academias e estúdios, com a grade de aulas como capa.",
    descricao: "A primeira coisa que aparece é a grade de hoje, com a próxima aula e o tempo que falta para ela. Dá para ver os outros dias, conhecer as modalidades e os planos, e pedir uma aula experimental já com o dia e o horário escolhidos.",
    preco: 1200,
    status: "encomenda",
    exclusivo: true,
    demo: "/modelos/forca-fit/",
    imagem: "/img/modelos/1689877020200-403d8542d95d-g.jpg",
    cores: ["#052e16", "#65a30d"],
    recursos: ["Grade de aulas do dia", "Próxima aula com contagem", "Grade de cada dia da semana", "Aula experimental com horário", "Modalidades e planos"],
  },
];
