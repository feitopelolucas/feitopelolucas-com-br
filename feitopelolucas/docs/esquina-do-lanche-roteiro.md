# Esquina do Lanche — do cardápio de papel à entrega

> Lanchonete fictícia. Não havia foto de cardápio anexada, então o cardápio de papel do passo 1 foi **inventado** para a demonstração. Com um cliente real, o passo 1 é feito a partir da foto e conferido com o dono antes de seguir.

Página pronta: `public/modelos/esquina-do-lanche/index.html`

## Entradas usadas (fictícias)

| Campo | Valor |
|---|---|
| Lanchonete | Esquina do Lanche |
| Dono | seu Marcos |
| Meu nome | Lucas |
| Frase do topo | Monte seu pedido e mande pronto no WhatsApp. |
| Horário | Todo dia, das 18h às 23h. |
| Bairros de entrega | Vila Nova, Centro, Jardim América |
| Categorias, na ordem | Lanches, Porções, Bebidas |
| Desconto dos combos | de 8% a 12% abaixo da soma dos itens |
| Número dos pedidos (demonstração) | 5519996515563 (o meu) |
| Pagamentos | Pix, Cartão na entrega, Dinheiro |
| Taxa | A lanchonete confirma a taxa de entrega pelo WhatsApp. |
| Preço da página | R$ 800 |
| O que entra no preço | a página com o cardápio de vocês, o pedido no WhatsApp, a página no ar na conta de vocês e a troca de preços e itens por 30 dias |
| Como recebem pedido hoje | áudio no WhatsApp |
| Endereço da demonstração | ainda não está no ar (nome previsto: esquina-do-lanche-demo.pages.dev) |

---

## Passo 1 — Transcrição do cardápio

```
Lanches | X-Burger | pão, hambúrguer, queijo | 18,00
Lanches | X-Salada | pão, hambúrguer, queijo, alface, tomate | 22,00
Lanches | X-Bacon | pão, hambúrguer, queijo, bacon | 25,00
Lanches | X-Tudo | pão, 2 hambúrgueres, queijo, bacon, ovo, presunto, alface, tomate | 32,00
Lanches | Misto quente | pão de forma, presunto, queijo | 12,00
Porções | Batata frita | 400 g | 24,00
Porções | Batata com cheddar e bacon | 400 g | 32,00
Porções | Calabresa acebolada | 400 g | 30,00
Bebidas | Refrigerante lata | 350 ml | 6,00
Bebidas | Refrigerante 2 litros | 2 litros | 14,00
Bebidas | Suco natural | 500 ml, laranja ou limão | 9,00
Bebidas | Água mineral | 500 ml | 4,00
```

**Para conferir:** nenhum item com `?`.

**Contagem:** Lanches 5 de 5 · Porções 3 de 3 · Bebidas 4 de 4 · Total 12 de 12.

---

## Passo 2 — Cardápio organizado e combos

```
Combos | Combo X-Salada | X-Salada, batata frita 400 g e refrigerante lata 350 ml | 46,90
Combos | Combo Dupla X-Burger | 2 X-Burger e refrigerante 2 litros | 45,00
Combos | Combo X-Tudo | X-Tudo, batata com cheddar e bacon e suco 500 ml | 65,90
Lanches | X-Burger | Hambúrguer e queijo no pão | 18,00
Lanches | X-Salada | Hambúrguer, queijo, alface e tomate no pão | 22,00
Lanches | X-Bacon | Hambúrguer, bacon e queijo no pão | 25,00
Lanches | X-Tudo | Dois hambúrgueres, bacon, ovo, presunto, queijo, alface e tomate no pão | 32,00
Lanches | Misto quente | Presunto e queijo no pão de forma | 12,00
Porções | Batata frita | 400 g | 24,00
Porções | Batata com cheddar e bacon | 400 g | 32,00
Porções | Calabresa acebolada | 400 g | 30,00
Bebidas | Refrigerante lata | 350 ml | 6,00
Bebidas | Refrigerante 2 litros | 2 litros | 14,00
Bebidas | Suco natural | 500 ml, laranja ou limão | 9,00
Bebidas | Água mineral | 500 ml | 4,00
```

**Conta dos combos** (faixa permitida: 8% a 12% abaixo da soma)

| Combo | Itens | Soma | Faixa permitida | Preço do combo | Fica mais barato |
|---|---|---|---|---|---|
| Combo X-Salada | X-Salada 22,00 + Batata frita 24,00 + Refrigerante lata 6,00 | 52,00 | 45,76 a 47,84 | 46,90 | 5,10 (9,8%) |
| Combo Dupla X-Burger | 2 × X-Burger 18,00 + Refrigerante 2 litros 14,00 | 50,00 | 44,00 a 46,00 | 45,00 | 5,00 (10,0%) |
| Combo X-Tudo | X-Tudo 32,00 + Batata com cheddar e bacon 32,00 + Suco natural 9,00 | 73,00 | 64,24 a 67,16 | 65,90 | 7,10 (9,7%) |

**Conferência:** os 12 itens do passo 1 estão no bloco, com o mesmo nome e o mesmo preço. As descrições só reordenam o que o cardápio diz. A maior descrição é a do X-Tudo, com **11 palavras**.

---

## Passos 3 e 4 — Bloco DADOS final

```js
/* ===== TROQUE SÓ ESTE BLOCO ===== */
const DADOS = {
  nome: "Esquina do Lanche",
  titulo: "Monte seu pedido e mande pronto no WhatsApp.",
  horario: "Todo dia, das 18h às 23h.",
  bairros: ["Vila Nova", "Centro", "Jardim América"],
  aviso_demo: "Demonstração: esta ainda não é a página oficial da Esquina do Lanche.",
  whatsapp: "5519996515563",
  pagamentos: ["Pix", "Cartão na entrega", "Dinheiro"],
  taxa: "A lanchonete confirma a taxa de entrega pelo WhatsApp.",
  cardapio: `
Combos | Combo X-Salada | X-Salada, batata frita 400 g e refrigerante lata 350 ml | 46,90
Combos | Combo Dupla X-Burger | 2 X-Burger e refrigerante 2 litros | 45,00
Combos | Combo X-Tudo | X-Tudo, batata com cheddar e bacon e suco 500 ml | 65,90
Lanches | X-Burger | Hambúrguer e queijo no pão | 18,00
Lanches | X-Salada | Hambúrguer, queijo, alface e tomate no pão | 22,00
Lanches | X-Bacon | Hambúrguer, bacon e queijo no pão | 25,00
Lanches | X-Tudo | Dois hambúrgueres, bacon, ovo, presunto, queijo, alface e tomate no pão | 32,00
Lanches | Misto quente | Presunto e queijo no pão de forma | 12,00
Porções | Batata frita | 400 g | 24,00
Porções | Batata com cheddar e bacon | 400 g | 32,00
Porções | Calabresa acebolada | 400 g | 30,00
Bebidas | Refrigerante lata | 350 ml | 6,00
Bebidas | Refrigerante 2 litros | 2 litros | 14,00
Bebidas | Suco natural | 500 ml, laranja ou limão | 9,00
Bebidas | Água mineral | 500 ml | 4,00
`
};
/* ===== FIM DO BLOCO ===== */
```

- Entraram **15 itens** em **4 categorias**: Combos 3, Lanches 5, Porções 3 e Bebidas 4.
- Nenhum item aparece como "Preço a confirmar".
- O número tem **13 dígitos** e começa com **55**.

**Pedido de teste:** 2 X-Salada e 1 Refrigerante lata, para Carla, Rua das Flores, 120, Vila Nova, em dinheiro, com troco para 100.

Conta: 2 × 22,00 = 44,00; 1 × 6,00 = 6,00; total = **50,00**.

Mensagem que chega no WhatsApp:

```
Pedido: Esquina do Lanche
2x X-Salada (R$ 44,00)
1x Refrigerante lata (R$ 6,00)
Total dos itens: R$ 50,00
Entrega: A lanchonete confirma a taxa de entrega pelo WhatsApp.
Nome: Carla
Endereço: Rua das Flores, 120, Vila Nova
Pagamento: Dinheiro (troco para R$ 100)
```

Não há linha de observação porque o pedido de teste não tem nenhuma.

---

## Passo 5 — Colocar no ar, oferecer e entregar

### Parte 1. Colocar a demonstração no ar

A demonstração ainda não está no ar. Faça um passo de cada vez:

1. No painel da Cloudflare, abra **Workers & Pages** e clique em **Create application**.
2. Escolha a aba **Pages** e clique em **Get started** na opção **Drag and drop your files**.
3. Em nome do projeto, escreva `esquina-do-lanche-demo`.
4. Arraste a pasta `esquina-do-lanche`, que tem só o `index.html`, para a área indicada.
5. Clique em **Deploy site** e espere aparecer o endereço `esquina-do-lanche-demo.pages.dev`.

Se algum botão tiver outro nome na sua tela, me diga o que aparece e eu indico o próximo passo.

Depois que estiver no ar, faça os 4 testes:

1. Abra o endereço numa **janela anônima**: o cardápio e o aviso de demonstração aparecem.
2. Abra no **celular, usando os dados móveis** (sem o Wi-Fi de casa): a página carrega e os botões + e − funcionam.
3. Faça o **pedido de teste** acima: a mensagem chega no seu WhatsApp, igual à do passo 4, com total de R$ 50,00.
4. **No dia seguinte**, abra o endereço de novo: a página continua no ar.

> Essa página também fica em `feitopelolucas.com.br/modelos/esquina-do-lanche/` depois que você publicar o seu site.

### Parte 2. Mensagem para o dono

```
Olá, seu Marcos! Sou o Lucas e faço páginas de pedido para lanchonetes.
Vi que hoje os pedidos da Esquina do Lanche chegam por áudio no WhatsApp.
Montei uma demonstração com o cardápio de vocês: esquina-do-lanche-demo.pages.dev
Nela o cliente escolhe os itens, vê o total e envia o pedido escrito, com endereço e forma de pagamento.
Por R$ 800, entram a página, o pedido no WhatsApp, a página no ar na conta de vocês e a troca de preços e itens por 30 dias.
Posso mostrar a página funcionando no seu celular?
```

Relida como se fosse o dono: tem o endereço, o preço e uma pergunta só. Não promete mais pedidos nem nenhum resultado.

### Parte 3. Roteiro da entrega (depois do sim)

1. **Conta do dono:** o seu Marcos cria a conta dele na Cloudflare, com o e-mail dele. Ninguém passa senha.
2. **Convite:** na conta dele, ele abre **Manage Account → Members**, clica em **Invite members**, informa o seu e-mail e escolhe acesso de administrador.
3. **Aceitar:** você aceita o convite pelo link que chega no seu e-mail. A conta da Esquina do Lanche passa a aparecer na sua lista de contas.
4. **Ajustar o bloco DADOS:** no `index.html`, troque `whatsapp` pelo número da lanchonete (só dígitos, 12 ou 13, começando com 55) e deixe `aviso_demo: ""`. Sem texto, a faixa de aviso some.
5. **Projeto na conta dele:** dentro da conta da lanchonete, repita a Parte 1 com um nome como `esquina-do-lanche`, arrastando a mesma pasta já ajustada.
6. **Pedido de teste:** faça um pedido no endereço novo e confirme com o seu Marcos que a mensagem chegou no WhatsApp da lanchonete.
7. **Apagar a demonstração:** na **sua** conta, abra o projeto `esquina-do-lanche-demo`, vá em **Settings** e use **Delete project**.
8. **Trocar um preço depois:** edite o preço na linha do item dentro de `cardapio`, abra o projeto na conta dele, clique em **Create a new deployment** e arraste a pasta de novo.
9. **Voltar uma versão:** no projeto, abra **Deployments**, clique nos três pontos da versão que estava certa e escolha **Rollback to this deployment**.
