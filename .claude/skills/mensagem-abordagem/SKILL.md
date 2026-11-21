---
name: mensagem-abordagem
description: Escreve a mensagem de abordagem que o Lucas manda para cada negócio junto com o link da prévia, grava na ficha e gera o .txt do negócio na pasta da cidade (mensagem + contatos + dados). Use na etapa 4 do /prospectar ou quando o Lucas pedir "escreve a mensagem do <negócio>". Nunca envia nada.
argument-hint: "<Cidade - UF>" | <pasta da prévia>
---

# Mensagem de abordagem

**Nada é enviado.** Você escreve; o Lucas copia e manda.

Para cada ficha `auditada` em `<Cidade - UF>\_controle\fichas\`:
1. Escreva a mensagem no campo `mensagem` (regras abaixo). Confira `melhorCanal` e os contatos.
2. Revise `peloQueVi` e `atencao`: são o que o Lucas lê antes de mandar. Frases completas, sem markdown.
3. Marque `situacao: "mensagem pronta"`.

Os .txt (`NN - Nome.txt` e `00 - LEIA-ME.txt`) saem das fichas com `node ferramentas/prospeccao/gerar-txt.mjs "<Cidade - UF>"`
(na pasta `feitopelolucas`). No /prospectar isso roda **depois** de a prévia estar no ar. Para uma prévia avulsa, rode no fim.
Referência de tom: as fichas de `D:\Lucas\Documentos\Prospecção\Campinas - SP\_controle\fichas\` (63 mensagens já aprovadas).
Leia 3 ou 4 do mesmo ramo antes de escrever.

## Como escrever

Estrutura (2 parágrafos curtos, cabe numa tela de celular; parágrafos separados por `\n` no JSON):

1. **Cumprimento pelo nome** do negócio (ou da pessoa, se o dono aparece com nome: "Oi, Ju!").
2. **"Sou o Lucas, faço sites aqui em <cidade>."** (outra cidade da região: "faço sites aqui na região de Campinas").
3. **Um detalhe real e específico** que mostre que ele olhou de verdade: número de avaliações, uma frase de cliente, os anos de casa,
   algo do Instagram. É o que separa a mensagem de spam.
4. **O problema, sem acusar**: "mas quem procura no Google não acha site/telefone".
5. **O link**: `Montei uma ideia de como ele poderia ser: https://feitopelolucas.com.br/previa/<pasta>/`
6. **O que tem de útil na prévia**: 1 ou 2 recursos concretos (selo "aberto agora", pedido que chega pronto no WhatsApp, calculadora...).
7. **Saída leve**: "Se gostarem, a gente conversa. Se não, sem problema nenhum!"

Regras:
- Tom de gente: simples, educado, sem jargão (nada de "presença digital", "alavancar", "solução"). No máximo um "!" por parágrafo, sem emoji.
- Nada de preço, prazo ou desconto na primeira mensagem. Nada de pressão ("só hoje", "vagas limitadas").
- Não afirmar nada que não esteja apurado. Avaliação negativa nunca vai na mensagem (vai em `atencao`).
- Canal sem WhatsApp: a mensagem serve para direct, e-mail ou ligação; pode oferecer "também dá para criar um WhatsApp para os pedidos".
  Para e-mail, acrescente na primeira linha um assunto: `Assunto: Uma ideia de site para a <Nome>`.
- Varie as aberturas entre os negócios: o Lucas pode mandar várias no mesmo bairro.
