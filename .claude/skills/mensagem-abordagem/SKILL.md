---
name: mensagem-abordagem
description: Escreve a mensagem de abordagem que o Lucas manda para cada negócio junto com o link da prévia, mais o resumo do que foi apurado e por onde mandar. Use na etapa 4 do /prospectar ou quando o Lucas pedir "escreve a mensagem do <negócio>". Nunca envia nada.
argument-hint: <lote> | <pasta da prévia>
---

# Mensagem de abordagem

**Nada é enviado.** Você escreve; o Lucas copia e manda.

Saída: `feitopelolucas/docs/lotes/<lote>/mensagens.md` (para uma prévia avulsa, acrescente no arquivo do lote dela).
Referência de tom e formato: `feitopelolucas/docs/previas-49-mensagens.md`. Leia 3 ou 4 exemplos antes de escrever.

## Formato do arquivo

```markdown
# Prévias de <Cidade>/<UF> · <data> · mensagens de abordagem

Uma mensagem por negócio, pronta para copiar. Nada foi enviado.
Link de cada prévia: https://feitopelolucas.com.br/previa/<pasta>/

---

## 1. <Nome> · /previa/<pasta>/

**Pelo que vi:** o que foi apurado e serve para o Lucas na conversa: Instagram (@, seguidores, ativo?), desde quando existe,
horário usado, WhatsApp/telefone, de onde vieram as fotos, o que o site tem de especial.
**Atenção:** pendências (endereço ou horário divergente, avaliação negativa recente, perfil não reivindicado, outro negócio com nome parecido).
**Por onde mandar:** WhatsApp (19) 9xxxx-xxxx · direct do Instagram @x · ligar no fixo.

> <a mensagem>
```

Os pulados entram no mesmo arquivo com `· pulado` no título e o motivo, para ninguém refazer.

## Como escrever a mensagem

Estrutura (2 parágrafos curtos, cabe numa tela de celular):

1. **Cumprimento pelo nome** do negócio (ou da pessoa, se o dono aparece com nome: "Oi, Ju!").
2. **"Sou o Lucas, faço sites aqui em <cidade>."** (se for outra cidade: "faço sites aqui na região de Campinas").
3. **Um detalhe real e específico** que mostra que ele olhou de verdade: número de avaliações, uma frase de cliente, os anos de casa,
   algo do Instagram. É o que separa a mensagem de spam.
4. **O problema, sem acusar**: "mas quem procura no Google não acha site/telefone".
5. **O link**: `Montei uma ideia de como ele poderia ser: https://feitopelolucas.com.br/previa/<pasta>/`
6. **O que tem de útil na prévia**: 1 ou 2 recursos concretos (o selo "aberto agora", o pedido que chega pronto no WhatsApp, a calculadora...).
7. **Saída leve**: "Se gostarem, a gente conversa. Se não, sem problema nenhum!"

Regras:
- Tom de gente: simples, educado, sem jargão (nada de "presença digital", "alavancar", "solução"). No máximo um "!" por parágrafo, sem emoji.
- Nada de preço, prazo ou desconto na primeira mensagem. Nada de pressão ("só hoje", "vagas limitadas").
- Não afirmar nada que não esteja apurado. Não citar a avaliação negativa na mensagem (ela vai em **Atenção**).
- Sem WhatsApp público: a mensagem é para direct ou ligação, e pode oferecer "também dá para criar um WhatsApp para os pedidos".
- Varie as aberturas entre os negócios: o Lucas pode mandar várias no mesmo bairro.

Ao terminar, marque `mensagem pronta` no `lote.md`.
