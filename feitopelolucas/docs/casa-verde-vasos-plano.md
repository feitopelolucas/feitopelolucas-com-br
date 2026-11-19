# Casa Verde Vasos — briefing, catálogo e plano técnico

> Loja fictícia, criada como demonstração. Os dados de entrada abaixo foram inventados para completar a ficha.

## Ficha usada

| Campo | Valor |
|---|---|
| Negócio | Casa Verde Vasos, vasos de cerâmica |
| Produtos | Vaso Pequeno Terra, cerâmica 12 cm, R$ 39,90; Vaso Médio Terra, cerâmica 18 cm, R$ 69,90; Vaso Grande Terra, cerâmica 25 cm, R$ 119,90 (em falta); Vaso Pequeno Areia, cerâmica 12 cm, R$ 39,90; Prato Coletor Terra, cerâmica 15 cm, R$ 19,90; Suporte de Madeira, R$ 49,90 |
| Entrega e retirada | Combinada pelo WhatsApp depois do pagamento |
| Quem aprova preços e textos | Ana Souza |
| Tom da loja | Simples e acolhedor |

---

## 1. Briefing

1. **Negócio:** Casa Verde Vasos, loja de vasos de cerâmica.
2. **Público:** quem chega pelo celular e quer comprar um ou poucos vasos sem criar conta.
3. **O que a loja vende:** seis itens fixos: quatro vasos de cerâmica, um prato coletor e um suporte de madeira.
4. **Como o cliente compra:** escolhe os produtos, ajusta as quantidades no carrinho e paga na página de Checkout da Stripe.
5. **Como recebe o produto:** a entrega é combinada pelo WhatsApp depois do pagamento.
6. **Tom:** simples e acolhedor. Frases curtas, sem exageros e sem termos técnicos.
7. **O que a loja não faz:** controle de estoque, cálculo de frete, Pix, login de cliente e painel administrativo.
8. **Pendências:** ver a seção "Pendências para Ana Souza", no fim.

## 2. Catálogo

| Código | Nome | Descrição | Preço | Disponível |
|---|---|---|---|---|
| VPT | Vaso Pequeno Terra | Vaso de cerâmica cor de terra, com 12 cm de altura. | R$ 39,90 | sim |
| VMT | Vaso Médio Terra | Vaso de cerâmica cor de terra, com 18 cm de altura. | R$ 69,90 | sim |
| VGT | Vaso Grande Terra | Vaso de cerâmica cor de terra, com 25 cm de altura. | R$ 119,90 | não |
| VPA | Vaso Pequeno Areia | Vaso de cerâmica cor de areia, com 12 cm de altura. | R$ 39,90 | sim |
| PCT | Prato Coletor Terra | Prato de cerâmica com 15 cm de diâmetro, para apoiar vasos. | R$ 19,90 | sim |
| SMD | Suporte de Madeira | Suporte de madeira para apoiar um vaso. | R$ 49,90 | sim |

## 3. Telas

| Tela | Conteúdo | Vazio | Carregando | Erro |
|---|---|---|---|---|
| Catálogo | Grade com imagem, nome, preço e o selo "Em falta" quando indisponível | "Nenhum produto por aqui no momento." | Seis cartões cinza no lugar dos produtos | "Não conseguimos carregar os produtos." e botão "Tentar de novo" |
| Produto | Imagem, nome, descrição, preço, quantidade e botão "Adicionar ao carrinho"; botão desativado com o texto "Em falta" quando indisponível | Código inexistente: "Produto não encontrado." e link para o catálogo | Bloco cinza no lugar da imagem e do texto | Mesma mensagem do catálogo, com "Tentar de novo" |
| Carrinho | Itens com quantidade, botões + e −, remover, subtotal por item, total, aviso de entrega pelo WhatsApp e botão "Pagar" | "Seu carrinho está vazio." e link para o catálogo | Botão "Pagar" mostra "Abrindo o pagamento…" e fica desativado | "Não foi possível iniciar o pagamento. Seu carrinho continua salvo." |
| Sucesso | "Recebemos seu pedido", número do pedido e aviso de que a confirmação chega depois; o carrinho é esvaziado | Sem número do pedido no endereço: link para o catálogo | Não se aplica | Não se aplica: esta tela não consulta nem altera o status |
| Cancelamento | "O pagamento não foi concluído. Seu carrinho continua salvo." e botão para voltar ao carrinho | Não se aplica | Não se aplica | Não se aplica |

## 4. Tabelas do banco (Supabase)

**produtos**

| Campo | Tipo | Regra |
|---|---|---|
| codigo | text | Chave primária; 3 letras maiúsculas |
| nome | text | Obrigatório |
| descricao | text | Obrigatório; uma linha |
| preco_centavos | integer | Obrigatório; maior que 0 |
| disponivel | boolean | Obrigatório; padrão `true` |
| criado_em | timestamptz | Padrão `now()` |

**pedidos**

| Campo | Tipo | Regra |
|---|---|---|
| id | uuid | Chave primária; gerado pelo banco |
| status | text | Um destes: `aguardando_pagamento`, `pago`, `falhou`, `cancelado`; padrão `aguardando_pagamento` |
| total_centavos | integer | Calculado no servidor a partir de `produtos.preco_centavos`; maior que 0 |
| stripe_session_id | text | Único; preenchido ao criar a sessão de Checkout |
| nome_cliente | text | Preenchido pelo webhook a partir dos dados da Stripe |
| telefone_cliente | text | Preenchido pelo webhook; usado para combinar a entrega |
| criado_em | timestamptz | Padrão `now()` |
| atualizado_em | timestamptz | Atualizado a cada mudança de status |

**itens_pedido**

| Campo | Tipo | Regra |
|---|---|---|
| id | bigint | Chave primária, gerada automaticamente |
| pedido_id | uuid | Chave estrangeira para `pedidos.id`; obrigatório |
| produto_codigo | text | Chave estrangeira para `produtos.codigo`; obrigatório |
| quantidade | integer | Entre 1 e 10 |
| preco_unitario_centavos | integer | Copiado de `produtos.preco_centavos` no momento do pedido |

## 5. Caminho do pedido

1. O cliente clica em "Pagar". O navegador envia apenas os códigos e as quantidades para a função do servidor (Vercel).
2. O servidor valida cada item: o código existe, o produto está disponível e a quantidade fica entre 1 e 10.
3. O servidor busca os preços na tabela `produtos` e calcula o total. Nenhum preço vindo do navegador é usado.
4. O servidor grava o pedido com status `aguardando_pagamento` e grava os itens com o preço unitário copiado do banco.
5. O servidor cria a sessão de Checkout da Stripe com esses valores e com o `id` do pedido nos metadados, grava o `stripe_session_id` e devolve a URL da sessão.
6. O navegador redireciona o cliente para a página de Checkout da Stripe.
7. Se o cliente desistir, a Stripe o leva para a tela de cancelamento. O carrinho continua salvo e o status não muda.
8. Se o pagamento for concluído, a Stripe leva o cliente para a tela de sucesso. Essa tela não altera o status.
9. A Stripe envia o webhook para o servidor. O servidor confere a assinatura com o segredo do webhook e descarta qualquer aviso com assinatura inválida.
10. Com `checkout.session.completed` e pagamento aprovado, o pedido passa para `pago`. Com falha no pagamento, passa para `falhou`. Com `checkout.session.expired`, passa para `cancelado`.
11. Um pedido que já está como `pago` não volta para outro status, mesmo se o mesmo aviso chegar de novo.

## 6. Regras de segurança

1. A chave secreta da Stripe, o segredo do webhook e a chave `service_role` do Supabase existem apenas nas variáveis de ambiente da Vercel. Uma busca no código público e nos arquivos enviados ao navegador não encontra nenhuma delas.
2. O navegador usa apenas a chave pública (`anon`) do Supabase e só consegue ler a tabela `produtos`.
3. As tabelas `pedidos` e `itens_pedido` têm RLS ativada e nenhuma política para a chave `anon`: uma leitura ou gravação feita do navegador é recusada.
4. O valor cobrado pela Stripe é sempre igual à soma de `preco_unitario_centavos × quantidade` gravada no banco.
5. Um pedido enviado com preço alterado no navegador é cobrado pelo preço do banco.
6. O status `pago` só é gravado pela função do webhook, depois de a assinatura ser validada.
7. Abrir a URL de sucesso diretamente não muda o status de nenhum pedido.
8. Um produto com `disponivel = false` é recusado pelo servidor, mesmo se for enviado no carrinho.

## 7. Critérios de aceite

1. **Catálogo:** ao abrir a loja, aparecem 6 produtos com nome e preço iguais aos da tabela da seção 2, e o Vaso Grande Terra mostra "Em falta".
2. **Produto indisponível:** na página do Vaso Grande Terra, o botão de compra está desativado e mostra "Em falta".
3. **Carrinho:** ao adicionar 2 Vasos Pequenos Terra e 1 Suporte de Madeira, o total mostrado é R$ 129,70. Ao recarregar a página, o carrinho continua igual.
4. **Pagamento de teste:** ao pagar na Stripe com o cartão de teste 4242 4242 4242 4242, a tela de sucesso aparece e o pedido fica como `pago` na tabela `pedidos` alguns segundos depois.
5. **Cancelamento:** ao clicar em voltar na página da Stripe, a tela de cancelamento aparece, o carrinho continua com os mesmos itens e nenhum pedido fica como `pago`.
6. **Preço protegido:** ao alterar no navegador o preço de um item para R$ 1,00 antes de pagar, a página da Stripe mostra o preço original do banco.

---

## Pendências para Ana Souza

1. Confirmar os seis produtos, os preços e as descrições do catálogo.
2. Confirmar se o Vaso Grande Terra deve aparecer como "Em falta" ou sair da loja.
3. Informar o prazo para entrar em contato pelo WhatsApp depois do pagamento. A ficha não informa esse prazo, e a loja não promete nenhum.
4. Informar se existe retirada no local e, se existir, o endereço. A ficha não informa.
5. Informar quem paga a entrega e se esse valor é combinado no WhatsApp.
6. Informar a política de troca e de devolução. Sem ela, a loja não exibe nenhuma.
7. Enviar as fotos dos produtos. Até lá, a loja usa ilustrações simples.
