<?php
/*
 * =====================================================================
 *  Feito pelo Lucas — página inicial em PHP
 * =====================================================================
 *
 *  Versão em PHP do index.html. Tudo é montado no servidor:
 *    - catálogo de sites (o mesmo conteúdo do sites.js)
 *    - filtros por categoria   →  ?categoria=Saúde
 *    - detalhes de um site     →  ?site=clinica-vida
 *    - formulário "Peça o seu" →  enviado por POST, validado aqui e
 *                                  redirecionado para o WhatsApp
 *
 *  Funciona mesmo com o JavaScript desligado. Usa o mesmo style.css.
 *
 *  Precisa de PHP 7.4 ou mais novo (hospedagem comum, XAMPP etc.).
 *  Para testar no computador:  php -S localhost:8000
 *  e abrir http://localhost:8000/index.php
 * =====================================================================
 */

declare(strict_types=1);
mb_internal_encoding('UTF-8');

/* ---------------------------------------------------------------------
 *  CONFIGURAÇÃO
 * ------------------------------------------------------------------- */

$CONFIG = [
    // WhatsApp com DDI + DDD, só números
    'whatsapp' => '5519996515563',
    'email'    => 'contato@feitopelolucas.com.br',
    'dominio'  => 'https://feitopelolucas.com.br',
];

/* ---------------------------------------------------------------------
 *  CATÁLOGO DE SITES
 *
 *  Campos de cada site:
 *    id          identificador único, sem espaços
 *    nome        nome exibido
 *    categoria   usada nos filtros
 *    resumo      frase curta do card
 *    descricao   texto completo dos detalhes
 *    preco       valor em reais (número)
 *    precoAntigo (opcional) valor riscado, para promoções
 *    status      "disponivel", "encomenda" ou "vendido"
 *    exclusivo   true = vendido uma única vez
 *    demo        (opcional) link da demonstração
 *    imagem      (opcional) print do site, ex.: "/img/restaurante.jpg"
 *    cores       (opcional) cores da capa quando não há imagem
 *    recursos    lista do que o site tem
 * ------------------------------------------------------------------- */

$SITES = [
    [
        'id' => 'brisa-higienizacao',
        'nome' => 'Brisa Higienização',
        'categoria' => 'Serviços',
        'resumo' => 'Página única para prestadores de serviço que recebem clientes pelo Instagram.',
        'descricao' => 'Feito para quem divulga no Instagram e fecha negócio no WhatsApp. Abre rápido no celular, tem um botão de WhatsApp em cada serviço, com a mensagem já escrita, e um botão fixo no canto da tela. O exemplo é de uma empresa fictícia de higienização de estofados.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/brisa-higienizacao/',
        'imagem' => '',
        'cores' => ['#1F6FEB'],
        'recursos' => ['Feito primeiro para o celular', 'Botão de WhatsApp por serviço', 'Botão fixo de WhatsApp', 'Galeria de fotos', 'Horário e contato', 'Link para o Instagram'],
    ],
    [
        'id' => 'casa-verde-vasos',
        'nome' => 'Casa Verde Vasos',
        'categoria' => 'Loja virtual',
        'resumo' => 'Loja pequena, com catálogo, carrinho e pagamento online.',
        'descricao' => 'Loja para quem vende poucos produtos e quer receber pagamentos sem complicação. Tem catálogo, página de cada produto, carrinho que fica salvo no celular, produtos em falta e telas de pedido recebido e de pagamento cancelado. Na versão de verdade, os pedidos ficam guardados num banco de dados e o pagamento é feito pela Stripe. A demonstração simula o pagamento e usa uma loja fictícia de vasos.',
        'preco' => 1490,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/casa-verde-vasos/',
        'imagem' => '',
        'cores' => ['#2f5d46'],
        'recursos' => ['Catálogo de até 6 produtos', 'Página de cada produto', 'Carrinho salvo no celular', 'Produtos em falta', 'Pagamento pela Stripe', 'Pedidos guardados no banco'],
    ],
    [
        'id' => 'cantinho-do-sabor',
        'nome' => 'Cantinho do Sabor',
        'categoria' => 'Restaurante',
        'resumo' => 'Cardápio por QR code e pedido de reserva, os dois pelo WhatsApp.',
        'descricao' => 'Uma página com duas abas. No cardápio, o cliente escolhe os itens e envia o pedido já escrito para o WhatsApp, com o total calculado e os itens indisponíveis no dia. Na aba de reservas, informa nome, data, horário e número de pessoas; a página confere os dias e horários aceitos, o máximo de pessoas e a antecedência mínima antes de enviar. Para mudar um preço ou um horário, basta editar uma linha. O exemplo é de uma lanchonete fictícia.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/cantinho-do-sabor/',
        'imagem' => '',
        'cores' => ['#7a1f1f'],
        'recursos' => ['Abre pelo QR code', 'Categorias e preços', 'Itens indisponíveis no dia', 'Pedido de reserva validado', 'Dias, horários e máximo de pessoas', 'Tudo enviado pelo WhatsApp'],
    ],
    [
        'id' => 'esquina-do-lanche',
        'nome' => 'Esquina do Lanche',
        'categoria' => 'Restaurante',
        'resumo' => 'Página de pedidos para delivery, com combos e entrega por bairro.',
        'descricao' => 'Feita para lanchonetes que recebem pedidos de entrega pelo WhatsApp. O cliente monta o pedido com os botões de mais e menos, vê o total no carrinho fixo e, ao finalizar, informa nome, endereço, bairro, forma de pagamento e troco. O pedido chega escrito, uma informação por linha. Todo o cardápio e os dados da loja ficam num único bloco fácil de editar. O exemplo é de uma lanchonete fictícia.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/esquina-do-lanche/',
        'imagem' => '',
        'cores' => ['#2b211b'],
        'recursos' => ['Combos em destaque', 'Carrinho fixo com o total', 'Bairros de entrega', 'Pagamento e troco', 'Pedido escrito no WhatsApp', 'Dados num bloco só'],
    ],
    [
        'id' => 'restaurante-sabor',
        'nome' => 'Sabor & Brasa',
        'categoria' => 'Restaurante',
        'resumo' => 'Site para restaurante de carnes, com o que está no fogo hoje e preços por quilo.',
        'descricao' => 'Feito para casas de carne, churrascarias e restaurantes com um prato principal forte. Mostra o que está no fogo no dia, conta o preparo hora a hora, traz a tabela de preços do balcão e da encomenda para levar, e leva a reserva para o WhatsApp.',
        'preco' => 1290,
        'status' => 'encomenda',
        'exclusivo' => true,
        'demo' => '/modelos/sabor-e-brasa/',
        'imagem' => '',
        'cores' => ['#3a1c0f', '#c2410c'],
        'recursos' => ['Quadro do que está no fogo hoje', 'Preparo contado hora a hora', 'Preços do balcão e para levar', 'Encomenda pelo WhatsApp', 'Reserva de mesa', 'Espaço para fotos'],
    ],
    [
        'id' => 'clinica-vida',
        'nome' => 'Clínica Vida',
        'categoria' => 'Saúde',
        'resumo' => 'Site para clínicas e consultórios, com quem atende em cada dia.',
        'descricao' => 'Mostra logo de cara quem atende hoje e traz um quadro semanal com os dias de cada especialidade. Tem a lista de profissionais com registro, as orientações para antes da consulta, os convênios e a marcação pelo WhatsApp.',
        'preco' => 1490,
        'status' => 'encomenda',
        'exclusivo' => true,
        'demo' => '/modelos/clinica-vida/',
        'imagem' => '',
        'cores' => ['#0c4a6e', '#14b8a6'],
        'recursos' => ['Quem atende hoje', 'Quadro semanal por especialidade', 'Profissionais e registros', 'Orientações antes da consulta', 'Convênios aceitos', 'Marcação pelo WhatsApp'],
    ],
    [
        'id' => 'advocacia-pro',
        'nome' => 'Lex Advocacia',
        'categoria' => 'Serviços',
        'resumo' => 'Site sóbrio para escritórios de advocacia, escrito como um documento.',
        'descricao' => 'Organizado como um documento jurídico: as áreas de atuação aparecem como artigos numerados, os sócios assinam a página e os textos do escritório ficam numa lista de escritos. Diz com clareza o que o escritório faz e o que não faz.',
        'preco' => 1690,
        'status' => 'encomenda',
        'exclusivo' => true,
        'demo' => '/modelos/lex-advocacia/',
        'imagem' => '',
        'cores' => ['#1c1917', '#a16207'],
        'recursos' => ['Áreas em artigos numerados', 'Sócios com assinatura e OAB', 'Lista de artigos do escritório', 'Primeira conversa pelo WhatsApp', 'Visual de papel timbrado', 'Texto sóbrio, sem promessas'],
    ],
    [
        'id' => 'barbearia-navalha',
        'nome' => 'Navalha Barbearia',
        'categoria' => 'Beleza',
        'resumo' => 'Site para barbearias, com tabela de letras e agenda por barbeiro.',
        'descricao' => 'A tabela de preços aparece num quadro de letras, como os de parede. Cada barbeiro tem a sua cadeira, os seus dias e um botão para marcar direto com ele. Explica como funciona a fila com e sem hora marcada.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/navalha-barbearia/',
        'imagem' => '',
        'cores' => ['#111827', '#b91c1c'],
        'recursos' => ['Tabela em quadro de letras', 'Agenda por barbeiro', 'Fila com e sem hora marcada', 'Fotos dos cortes', 'Horários e endereço'],
    ],
    [
        'id' => 'portfolio-foto',
        'nome' => 'Lente Portfólio',
        'categoria' => 'Portfólio',
        'resumo' => 'Portfólio de fotografia montado como uma folha de contato.',
        'descricao' => 'Os trabalhos aparecem como tiras de filme, com as fotos escolhidas pelo cliente marcadas a lápis. Cada foto abre ampliada. Tem a tabela de valores e o contato para consultar datas.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => false,
        'demo' => '/modelos/lente-portfolio/',
        'imagem' => '',
        'cores' => ['#27272a', '#71717a'],
        'recursos' => ['Trabalhos em tiras de filme', 'Fotos escolhidas em destaque', 'Foto ampliada ao tocar', 'Tabela de valores', 'Consulta de datas pelo WhatsApp'],
    ],
    [
        'id' => 'academia-forca',
        'nome' => 'Força Fit',
        'categoria' => 'Esportes',
        'resumo' => 'Site para academias e estúdios, com a grade de aulas como capa.',
        'descricao' => 'A primeira coisa que aparece é a grade de hoje, com a próxima aula e o tempo que falta para ela. Dá para ver os outros dias, conhecer as modalidades e os planos, e pedir uma aula experimental já com o dia e o horário escolhidos.',
        'preco' => 1200,
        'status' => 'encomenda',
        'exclusivo' => true,
        'demo' => '/modelos/forca-fit/',
        'imagem' => '',
        'cores' => ['#052e16', '#65a30d'],
        'recursos' => ['Grade de aulas do dia', 'Próxima aula com contagem', 'Grade de cada dia da semana', 'Aula experimental com horário', 'Modalidades e planos'],
    ],
];

/* ---------------------------------------------------------------------
 *  SERVIÇOS, ETAPAS E PERGUNTAS FREQUENTES
 * ------------------------------------------------------------------- */

$SERVICOS = [
    [
        'titulo' => 'Sites',
        'texto'  => 'Para quem precisa estar na internet: restaurantes, clínicas, escritórios, lojas e portfólios. Você pode <a href="#catalogo">escolher um site pronto</a>, que eu adapto à sua marca, ou encomendar um projeto do zero.',
        'msg'    => 'Olá, Lucas! Gostaria de um orçamento para um site.',
    ],
    [
        'titulo' => 'Aplicativos para celular',
        'texto'  => 'Aplicativos que funcionam em Android e iPhone: catálogo de produtos, pedidos, área do cliente, cartão fidelidade e controle interno da equipe. Não é preciso passar por loja de aplicativos: o usuário abre um link e instala o aplicativo diretamente na tela inicial do celular. As atualizações são automáticas, sem necessidade de baixar nada novamente.',
        'msg'    => 'Olá, Lucas! Gostaria de um orçamento para um aplicativo de celular.',
    ],
    [
        'titulo' => 'Programas para computador',
        'texto'  => 'Sistemas para Windows que organizam a rotina do seu negócio. Um exemplo é a agenda para consultório: cadastro de pacientes, marcação de horários por profissional, lembretes pelo WhatsApp e histórico de atendimentos. Também desenvolvo sistemas de controle de estoque, caixa e cadastro de clientes.',
        'msg'    => 'Olá, Lucas! Gostaria de um orçamento para um programa de computador.',
    ],
    [
        'titulo' => 'Jogos',
        'texto'  => 'Jogos para PC e navegador, do protótipo ao lançamento. O Fossil Crown, apresentado logo abaixo, é um jogo que fiz sozinho e que já está disponível.',
        'msg'    => 'Olá, Lucas! Gostaria de conversar sobre um jogo.',
    ],
];

$ETAPAS = [
    ['Você escolhe um site', 'e entra em contato comigo. Se estiver em dúvida entre dois modelos, posso indicar qual combina mais com o seu negócio.'],
    ['Combinamos o pagamento.', 'Pix ou transferência: metade no início e metade quando o site estiver no ar.'],
    ['Você me envia o material', ': logotipo, fotos, textos, telefone e endereço. Se não tiver os textos prontos, eu ajudo a escrevê-los.'],
    ['Eu adapto e publico', 'o site no seu domínio. O prazo costuma ser de uma semana após o recebimento do material.'],
];

$INCLUIDO = [
    'Troca de nome, logotipo, cores, fotos e textos',
    'Botão de WhatsApp e seus contatos',
    'Configuração do domínio',
    'Pequenos ajustes durante 30 dias após a entrega',
    'Os arquivos do site, que passam a ser seus',
];

$POR_CONTA = [
    'O registro do domínio (um .com.br custa cerca de R$ 40 por ano)',
    'Novas páginas ou funcionalidades, orçadas à parte',
    'Fotos profissionais, caso deseje',
];

$FAQ = [
    'Outra pessoa pode ter um site igual ao meu?' =>
        'Não. O modelo mostra o estilo e o que o site faz, e eu monto o seu com o seu nome, as suas cores e as suas informações. Dois clientes podem partir do mesmo modelo, mas cada um recebe um site com a cara do próprio negócio.',
    'Há cobrança de mensalidade?' =>
        'Para sites, não. Você paga apenas o domínio e, na maioria dos casos, a hospedagem é gratuita. Aplicativos e sistemas que dependem de servidor podem ter um custo mensal, que informo antes do início do projeto.',
    'O aplicativo fica na Play Store ou na App Store?' =>
        'Não. Ele fica disponível em um endereço na internet, e qualquer pessoa pode instalá-lo na tela inicial do celular com poucos toques. Assim, você não paga taxas de loja, não depende de aprovação e qualquer alteração chega imediatamente a todos os usuários.',
    'A agenda do consultório funciona sem internet?' =>
        'Sim, se for necessário. Ela pode funcionar apenas no computador da recepção ou ser acessada por vários computadores e pelo celular. Tudo depende da necessidade do consultório.',
    'Você faz projetos que não estão listados aqui?' =>
        'Provavelmente sim. Entre em contato e conte-me do que você precisa.',
];

$TENHO_OPCOES = ['logotipo' => 'Logotipo', 'fotos' => 'Fotos', 'textos' => 'Textos', 'domínio' => 'Domínio'];

/* ---------------------------------------------------------------------
 *  FUNÇÕES AUXILIARES
 * ------------------------------------------------------------------- */

/** Escapa texto para HTML. */
function e($s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Formata em reais, sem centavos: R$ 1.200 */
function brl($n): string
{
    return 'R$ ' . number_format((float) $n, 0, ',', '.');
}

function whatsLink(string $msg): string
{
    global $CONFIG;
    return 'https://wa.me/' . $CONFIG['whatsapp'] . '?text=' . rawurlencode($msg);
}

function mailLink(string $assunto, string $corpo = ''): string
{
    global $CONFIG;
    return 'mailto:' . $CONFIG['email'] . '?subject=' . rawurlencode($assunto) . '&body=' . rawurlencode($corpo);
}

function vendido(array $s): bool   { return ($s['status'] ?? '') === 'vendido'; }
function encomenda(array $s): bool { return ($s['status'] ?? '') === 'encomenda'; }

/** Só aceita cores no formato #rgb / #rrggbb, para não injetar CSS. */
function corSegura(?string $c, string $padrao = '#2b2a26'): string
{
    return ($c !== null && preg_match('/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/', $c)) ? $c : $padrao;
}

/** Capa: print do site ou bloco de cor com o nome. */
function capa(array $s): string
{
    if (!empty($s['imagem'])) {
        return '<img src="' . e($s['imagem']) . '" alt="Página inicial do site ' . e($s['nome']) . '" loading="lazy">';
    }
    $bg = corSegura($s['cores'][0] ?? null);
    return '<div class="flat" style="background:' . $bg . ';color:#f3efe6"><span>' . e($s['nome']) . '</span></div>';
}

function selo(array $s): string
{
    if (vendido($s))   return '<span class="stamp">Vendido</span>';
    return '';
}

function precoHtml(array $s): string
{
    if (vendido($s))   return 'Vendido';
    if (encomenda($s)) return '<small>a partir de</small> ' . brl($s['preco']);
    $antigo = !empty($s['precoAntigo']) ? '<s>' . brl($s['precoAntigo']) . '</s>' : '';
    return $antigo . brl($s['preco']);
}

/** Monta a URL da página mantendo só os parâmetros que interessam. */
function url(array $params = [], string $ancora = ''): string
{
    $params = array_filter($params, fn($v) => $v !== null && $v !== '' && $v !== 'Todos');
    $q = $params ? '?' . http_build_query($params) : '';
    return ($q === '' ? './' : $q) . ($ancora ? '#' . $ancora : '');
}

function texto(string $chave, int $max = 500): string
{
    $v = isset($_POST[$chave]) && is_string($_POST[$chave]) ? trim($_POST[$chave]) : '';
    $v = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

/* ---------------------------------------------------------------------
 *  ESTADO DA PÁGINA
 * ------------------------------------------------------------------- */

// Cabeçalhos de segurança básicos
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

// Ordem: disponíveis, depois sob encomenda, depois vendidos
$peso = fn(array $s): int => vendido($s) ? 2 : (encomenda($s) ? 1 : 0);
$ordenados = $SITES;
usort($ordenados, fn($a, $b) => $peso($a) <=> $peso($b));

// Categorias e contagem
$categorias = ['Todos' => count($SITES)];
foreach ($SITES as $s) {
    $categorias[$s['categoria']] = ($categorias[$s['categoria']] ?? 0) + 1;
}

$categoriaAtual = isset($_GET['categoria']) && is_string($_GET['categoria']) && isset($categorias[$_GET['categoria']])
    ? $_GET['categoria']
    : 'Todos';

$lista = array_values(array_filter(
    $ordenados,
    fn($s) => $categoriaAtual === 'Todos' || $s['categoria'] === $categoriaAtual
));

// Site aberto nos detalhes
$siteId = $_POST['site'] ?? $_GET['site'] ?? null;
$atual = null;
if (is_string($siteId)) {
    foreach ($SITES as $s) {
        if ($s['id'] === $siteId) { $atual = $s; break; }
    }
}
$siteInexistente = is_string($siteId) && $siteId !== '' && $atual === null;
if ($siteInexistente) {
    http_response_code(404);
}

/* ---------------------------------------------------------------------
 *  FORMULÁRIO "PEÇA O SEU" (POST)
 * ------------------------------------------------------------------- */

$form = [
    'nome' => '', 'negocio' => '', 'ramo' => '', 'cidade' => '', 'cores' => '', 'info' => '', 'tenho' => [],
];
$erro = '';
$invalidos = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $atual) {
    $form['nome']    = texto('nome', 120);
    $form['negocio'] = texto('negocio', 120);
    $form['ramo']    = texto('ramo', 120);
    $form['cidade']  = texto('cidade', 120);
    $form['cores']   = texto('cores', 200);
    $form['info']    = texto('info', 2000);
    $marcados = isset($_POST['tenho']) && is_array($_POST['tenho']) ? $_POST['tenho'] : [];
    $form['tenho'] = array_values(array_intersect(array_keys($TENHO_OPCOES), $marcados));

    // Campo-armadilha contra robôs: pessoas não veem nem preenchem
    $robo = texto('website', 200) !== '';

    if ($form['nome'] === '')    $invalidos[] = 'nome';
    if ($form['negocio'] === '') $invalidos[] = 'negocio';

    if ($invalidos) {
        $erro = 'Preencha o seu nome e o nome do negócio para eu saber com quem estou falando.';
    } elseif (!$robo) {
        $linhas = [
            'Olá, Lucas! Quero um site no estilo do modelo "' . $atual['nome'] . '".',
            '',
            'Meu nome: ' . $form['nome'],
            'Negócio: ' . $form['negocio'],
        ];
        if ($form['ramo'] !== '')   $linhas[] = 'O que faz: ' . $form['ramo'];
        if ($form['cidade'] !== '') $linhas[] = 'Cidade: ' . $form['cidade'];
        if ($form['cores'] !== '')  $linhas[] = 'Cores: ' . $form['cores'];
        $linhas[] = 'Já tenho: ' . ($form['tenho'] ? implode(', ', $form['tenho']) : 'nada ainda');
        if ($form['info'] !== '') {
            array_push($linhas, '', 'Informações:', $form['info']);
        }

        header('Location: ' . whatsLink(implode("\n", $linhas)), true, 303);
        exit;
    } else {
        // Robô: finge que deu certo e volta para a página
        header('Location: ' . url(), true, 303);
        exit;
    }
}

/* ---------------------------------------------------------------------
 *  TÍTULO E METADADOS
 * ------------------------------------------------------------------- */

$titulo = $atual
    ? $atual['nome'] . ' — site à venda · Feito pelo Lucas'
    : 'Feito pelo Lucas — sites, aplicativos e jogos';
$descricao = $atual
    ? ($atual['resumo'] ?? '')
    : 'Sites prontos à venda, aplicativos para celular, programas para computador e jogos. Feitos pelo Lucas.';
$canonica = $CONFIG['dominio'] . '/' . ($atual ? '?site=' . rawurlencode($atual['id']) : '');
$ano = date('Y');

?><!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($titulo) ?></title>
<meta name="description" content="<?= e($descricao) ?>">
<link rel="canonical" href="<?= e($canonica) ?>">
<meta property="og:type" content="website">
<meta property="og:title" content="<?= e($titulo) ?>">
<meta property="og:description" content="<?= e($descricao) ?>">
<meta property="og:url" content="<?= e($canonica) ?>">
<meta property="og:image" content="<?= e($CONFIG['dominio']) ?><?= e($atual && !empty($atual['imagem']) ? $atual['imagem'] : '/img/fossilcrown.png') ?>">
<meta name="theme-color" content="#f4efe4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#16130f" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" href="/favicon.svg?v=1" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png?v=1" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=1">
<link rel="stylesheet" href="/style.css">
<style>
  /* Os filtros aqui são links (funcionam sem JavaScript) */
  .filters a{color:var(--soft);text-decoration:none}
  .filters a:hover{color:var(--ink)}
  .filters a[aria-current="true"]{color:var(--ink);text-decoration:underline;text-underline-offset:4px}
  .filters sup{font:11px var(--mono);margin-left:2px}
  a.item{text-decoration:none}
  .modal-close{text-decoration:none}
  .armadilha{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
</style>
<script type="application/ld+json">
<?= json_encode([
    '@context' => 'https://schema.org',
    '@type'    => 'ProfessionalService',
    'name'     => 'Feito pelo Lucas',
    'url'      => $CONFIG['dominio'],
    'email'    => $CONFIG['email'],
    'image'    => $CONFIG['dominio'] . '/img/lucas.jpg',
    'description' => 'Sites, aplicativos para celular, programas para computador e jogos.',
    'makesOffer' => array_map(fn($s) => [
        '@type' => 'Offer',
        'name'  => 'Site ' . $s['nome'],
        'price' => $s['preco'],
        'priceCurrency' => 'BRL',
        'availability'  => vendido($s) ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    ], $SITES),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_PRETTY_PRINT) ?>
</script>
</head>
<body>

<header class="wrap top">
  <a class="name" href="./">Feito pelo Lucas</a>
  <nav>
    <a href="#servicos">O que eu faço</a>
    <a href="#catalogo">Sites à venda</a>
    <a href="#contato">Contato</a>
  </nav>
</header>

<main>
  <!-- ===================== APRESENTAÇÃO ===================== -->
  <section class="wrap intro">
    <div class="intro-main">
      <h1>Eu faço sites, aplicativos <br>e <i>jogos</i>.</h1>
      <div class="intro-text">
        <p>Sou o Lucas. Desenvolvo sites, aplicativos para celular, programas para computador e jogos. Alguns sites já estão prontos e à venda nesta página; os demais projetos são feitos sob medida, de acordo com a necessidade do seu negócio.</p>
        <p class="meta">Todos os modelos podem ser feitos com o seu nome, as suas cores e as suas informações.</p>
      </div>
    </div>
    <figure class="portrait">
      <img src="/img/lucas.jpg" alt="Foto do Lucas, de óculos, terno preto e gravata-borboleta dourada" width="640" height="640">
      <figcaption>Lucas</figcaption>
    </figure>
  </section>

  <!-- ===================== SERVIÇOS ===================== -->
  <section id="servicos" class="wrap services">
    <h2>O que eu faço</h2>
    <?php foreach ($SERVICOS as $i => $sv): ?>
    <div class="service">
      <span class="num"><?= sprintf('%02d', $i + 1) ?></span>
      <h3><?= e($sv['titulo']) ?></h3>
      <p><?= $sv['texto'] /* HTML fixo, escrito acima */ ?></p>
      <a class="ask" href="<?= e(whatsLink($sv['msg'])) ?>" target="_blank" rel="noopener">Pedir orçamento</a>
    </div>
    <?php endforeach; ?>
  </section>

  <!-- ===================== FOSSIL CROWN ===================== -->
  <section class="wrap showcase">
    <a class="showcase-img" href="https://fossilcrown.com" target="_blank" rel="noopener">
      <img src="/img/fossilcrown.png" alt="Capa do jogo Fossil Crown, com dinossauros num rancho e um vulcão ao fundo" width="920" height="430" loading="lazy">
    </a>
    <div class="showcase-text">
      <p class="meta">Jogo · PC · projeto próprio · não está à venda</p>
      <h2>Fossil Crown</h2>
      <p>Um jogo <i>idle</i> de dinossauros para PC. O rancho fica em uma faixa na parte inferior da tela enquanto você usa o computador: é possível criar dinossauros, chocar ovos, enviá-los em expedições e subir no ranking da arena. É gratuito e não oferece vantagens pagas.</p>
      <p>Fiz tudo sozinho: o jogo, o servidor do ranking, as atualizações automáticas e o site.</p>
      <p>O Fossil Crown não está à venda. Ele está aqui para mostrar o tipo de projeto que eu consigo tocar do começo ao fim.</p>
      <a class="link" href="https://fossilcrown.com" target="_blank" rel="noopener">fossilcrown.com ↗</a>
    </div>
  </section>

  <!-- ===================== CATÁLOGO ===================== -->
  <section id="catalogo" class="wrap catalog">
    <div class="catalog-head">
      <div>
        <h2>Sites à venda</h2>
        <p class="sub">Escolha um modelo e eu faço o seu com o seu nome, as suas cores, as suas fotos e os seus textos, publicado no seu endereço.</p>
      </div>
      <nav class="filters" aria-label="Filtrar por tipo de negócio">
        <?php foreach ($categorias as $cat => $qtd): ?>
        <a href="<?= e(url(['categoria' => $cat], 'catalogo')) ?>" aria-current="<?= $cat === $categoriaAtual ? 'true' : 'false' ?>"><?= e($cat) ?><sup><?= $qtd ?></sup></a>
        <?php endforeach; ?>
      </nav>
    </div>

    <div class="grid">
      <?php foreach ($lista as $s): ?>
      <a class="item<?= vendido($s) ? ' sold' : '' ?>" href="<?= e(url(['categoria' => $categoriaAtual, 'site' => $s['id']], 'detalhes')) ?>">
        <div class="cover"><?= capa($s) ?><?= selo($s) ?></div>
        <div class="item-line">
          <h3><?= e($s['nome']) ?></h3>
          <span class="price"><?= vendido($s) ? '—' : precoHtml($s) ?></span>
        </div>
        <p><?= e($s['resumo']) ?></p>
        <p class="meta"><?= e($s['categoria']) ?><?= !empty($s['exclusivo']) ? ' · exclusivo' : '' ?></p>
      </a>
      <?php endforeach; ?>
    </div>

    <?php if (!$lista): ?>
    <p class="empty">Nenhum site nesta categoria no momento.</p>
    <?php endif; ?>

    <?php if ($siteInexistente): ?>
    <p class="empty" role="alert">Esse modelo não existe mais ou o link está errado. Veja os outros acima.</p>
    <?php endif; ?>
  </section>

  <!-- ===================== COMO FUNCIONA ===================== -->
  <section id="como" class="wrap how">
    <h2>Como funciona a compra de um site</h2>
    <ol>
      <?php foreach ($ETAPAS as [$negrito, $resto]): ?>
      <li><b><?= e($negrito) ?></b><?= $resto[0] === ':' ? '' : ' ' ?><?= e($resto) ?></li>
      <?php endforeach; ?>
    </ol>
    <p class="note">Aplicativos, programas e jogos são feitos sob medida; portanto, o prazo e o preço dependem de cada projeto. Conte-me a sua ideia e eu envio um orçamento.</p>

    <div class="terms">
      <div>
        <h3>Incluído no preço do site</h3>
        <ul>
          <?php foreach ($INCLUIDO as $item): ?>
          <li><?= e($item) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <div>
        <h3>Por conta do cliente</h3>
        <ul>
          <?php foreach ($POR_CONTA as $item): ?>
          <li><?= e($item) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    </div>
  </section>

  <!-- ===================== PERGUNTAS FREQUENTES ===================== -->
  <section class="wrap faq">
    <h2>Perguntas frequentes</h2>
    <dl>
      <?php foreach ($FAQ as $pergunta => $resposta): ?>
      <dt><?= e($pergunta) ?></dt>
      <dd><?= e($resposta) ?></dd>
      <?php endforeach; ?>
    </dl>
  </section>

  <!-- ===================== CONTATO ===================== -->
  <section id="contato" class="wrap contact">
    <h2>Vamos conversar?</h2>
    <p>Costumo responder no mesmo dia.</p>
    <p class="contact-links">
      <a href="<?= e(whatsLink('Olá, Lucas! Vi o seu site e gostaria de conversar.')) ?>" target="_blank" rel="noopener">WhatsApp</a>
      <a href="<?= e(mailLink('Contato pelo site', 'Olá, Lucas!')) ?>">E-mail</a>
    </p>
  </section>
</main>

<footer class="wrap foot">
  <span>Feito pelo Lucas, <?= e($ano) ?>.</span>
  <a href="#">Voltar ao topo ↑</a>
</footer>

<?php if ($atual): /* ===================== DETALHES DO SITE ===================== */ ?>
<dialog id="detalhes" class="modal" aria-labelledby="m-title" open>
  <a class="modal-close" href="<?= e(url(['categoria' => $categoriaAtual], 'catalogo')) ?>" aria-label="Fechar">Fechar</a>
  <div class="modal-media"><?= capa($atual) ?><?= selo($atual) ?></div>
  <div class="modal-body">
    <p class="meta"><?= e($atual['categoria']) ?><?= !empty($atual['exclusivo']) ? ' · exclusivo: vendido uma única vez' : '' ?></p>
    <h3 id="m-title"><?= e($atual['nome']) ?></h3>
    <p><?= e($atual['descricao'] ?: $atual['resumo']) ?></p>

    <p class="m-label">O que está incluso</p>
    <ul class="m-features">
      <?php foreach ($atual['recursos'] ?? [] as $r): ?>
      <li><?= e($r) ?></li>
      <?php endforeach; ?>
    </ul>

    <div class="modal-foot">
      <p class="m-price"><?= precoHtml($atual) ?></p>
      <div class="modal-actions">
        <?php if (!empty($atual['demo'])): ?>
        <a class="link" href="<?= e($atual['demo']) ?>" target="_blank" rel="noopener">Ver funcionando ↗</a>
        <?php else: ?>
        <a class="link" aria-disabled="true">Demonstração em breve</a>
        <?php endif; ?>
        <a class="btn" href="#m-pedido"><?= vendido($atual) ? 'Quero um semelhante' : 'Quero um assim' ?></a>
      </div>
    </div>

    <form class="pedido" id="m-pedido" method="post" action="<?= e(url(['categoria' => $categoriaAtual, 'site' => $atual['id']])) ?>" novalidate>
      <input type="hidden" name="site" value="<?= e($atual['id']) ?>">
      <p class="m-label">Peça o seu</p>
      <p class="pedido-intro">Conte o básico sobre o seu negócio. A mensagem chega pronta no meu WhatsApp, e eu respondo com as próximas etapas. Preencha só o que já souber.</p>

      <div class="campos">
        <label>Seu nome<input name="nome" type="text" autocomplete="name" maxlength="120" required value="<?= e($form['nome']) ?>"<?= in_array('nome', $invalidos, true) ? ' class="invalido" autofocus' : '' ?>></label>
        <label>Nome do negócio<input name="negocio" type="text" autocomplete="organization" maxlength="120" required value="<?= e($form['negocio']) ?>"<?= in_array('negocio', $invalidos, true) ? ' class="invalido"' . (in_array('nome', $invalidos, true) ? '' : ' autofocus') : '' ?>></label>
        <label>O que o negócio faz<input name="ramo" type="text" maxlength="120" placeholder="Ex.: pizzaria, estúdio de pilates" value="<?= e($form['ramo']) ?>"></label>
        <label>Cidade<input name="cidade" type="text" autocomplete="address-level2" maxlength="120" value="<?= e($form['cidade']) ?>"></label>
        <label class="largo">Cores que quer usar<input name="cores" type="text" maxlength="200" placeholder="Ex.: verde-escuro e creme, ou as cores do meu logotipo" value="<?= e($form['cores']) ?>"></label>
        <label class="largo">Informações para o site<textarea name="info" rows="4" maxlength="2000" placeholder="Serviços ou produtos, preços, horários, endereço, Instagram…"><?= e($form['info']) ?></textarea></label>
      </div>

      <!-- armadilha contra robôs: não preencha -->
      <label class="armadilha" aria-hidden="true">Site<input name="website" type="text" tabindex="-1" autocomplete="off"></label>

      <fieldset class="tenho">
        <legend>Já tenho</legend>
        <?php foreach ($TENHO_OPCOES as $valor => $rotulo): ?>
        <label><input type="checkbox" name="tenho[]" value="<?= e($valor) ?>"<?= in_array($valor, $form['tenho'], true) ? ' checked' : '' ?>> <?= e($rotulo) ?></label>
        <?php endforeach; ?>
      </fieldset>

      <p class="pedido-erro" role="alert"><?= e($erro) ?></p>
      <button class="btn" type="submit">Enviar pelo WhatsApp</button>
    </form>
  </div>
</dialog>

<script>
  // Melhoria opcional: abre os detalhes como janela de verdade (com fundo escuro,
  // Esc para fechar e clique fora). Sem JavaScript, tudo continua funcionando.
  (function () {
    var d = document.getElementById("detalhes");
    if (!d || !d.showModal) return;
    var fechar = d.querySelector(".modal-close").getAttribute("href");
    d.removeAttribute("open");
    d.showModal();
    d.scrollTop = 0;
    <?php if ($erro): ?>
    document.getElementById("m-pedido").scrollIntoView({ block: "start" });
    <?php endif; ?>
    d.addEventListener("cancel", function (ev) { ev.preventDefault(); location.href = fechar; });
    d.addEventListener("click", function (ev) { if (ev.target === d) location.href = fechar; });
  })();
</script>
<?php endif; ?>

</body>
</html>
