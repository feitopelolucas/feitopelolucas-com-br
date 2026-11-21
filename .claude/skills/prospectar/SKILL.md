---
name: prospectar
description: Roda a prospecção inteira do Lucas para uma cidade/estado - acha negócios bem avaliados sem site, cria uma prévia de site para cada um, audita tudo e escreve a mensagem de abordagem. Use quando o Lucas digitar /prospectar, pedir "prospecta <cidade>", "faz um lote de prévias em <cidade>" ou quiser continuar um lote parado.
argument-hint: <cidade> <UF> [quantidade=20] [ramos separados por vírgula]
---

# Prospecção completa: /prospectar <cidade> <UF> [quantidade] [ramos]

Exemplos: `/prospectar Campinas SP`, `/prospectar Valinhos SP 15`, `/prospectar Sorocaba SP 10 padarias,oficinas`.
Sem quantidade: 20 prévias. Sem ramos: a lista padrão de [analisar-locais](../analisar-locais/SKILL.md).

O trabalho é longo (horas). Ele é feito em 4 etapas, cada uma com sua skill, e o progresso fica salvo
num arquivo do lote para poder parar e continuar depois.

## Antes de começar

1. Leia as memórias do projeto sobre prospecção, fotos, CSP, deploy e perfil do Lucas (elas valem para todas as etapas).
2. Monte o nome do lote: `<cidade-sem-acento-minúscula>-<uf>-<AAAA-MM-DD>` (ex.: `valinhos-sp-2026-11-22`).
3. Se já existe `feitopelolucas/docs/lotes/<lote>/lote.md`, **continue de onde parou** (veja a coluna Situação). Não refaça o que está pronto.
4. Crie a lista de tarefas com as 4 etapas.

## Arquivo do lote: `feitopelolucas/docs/lotes/<lote>/lote.md`

```markdown
# Lote <Cidade>/<UF> · <data>
Pedido: <quantidade> prévias · ramos: <ramos>

| # | Negócio | Ramo | Nota | Avaliações | Pasta | Situação |
|---|---------|------|------|-----------|-------|----------|
| 1 | Pardal Panificadora | Padaria | 4,7 | 1.004 | pardal | mensagem pronta |
```

Situações, nesta ordem: `achado` → `prévia criada` → `auditada` → `mensagem pronta`, ou `pulado: <motivo>`.
Atualize o arquivo **a cada negócio concluído** (é ele que permite retomar).

## Etapas

1. **Análise de locais** → skill [analisar-locais](../analisar-locais/SKILL.md).
   Gera `docs/lotes/<lote>/candidatos.md` e preenche `lote.md` com uns 30% a mais que a quantidade pedida
   (parte cai na apuração). Apresente a lista ao Lucas num resumo curto e **siga sem esperar**, a menos que ele tenha pedido para aprovar antes.
2. **Criação das prévias** → skill [criar-previa](../criar-previa/SKILL.md), um negócio por vez, na ordem da lista,
   até completar a quantidade pedida. Quem cair na apuração (tem site, fechou, é rede) vira `pulado: <motivo>` e entra o próximo.
3. **Auditoria completa** → skill [auditar-previas](../auditar-previas/SKILL.md) com as pastas do lote.
   Corrija tudo e rode de novo até dar **0 erros**, com os avisos resolvidos ou justificados e a revisão visual feita em todas.
4. **Mensagens** → skill [mensagem-abordagem](../mensagem-abordagem/SKILL.md). Gera `docs/lotes/<lote>/mensagens.md`.

## Publicar

Depois da etapa 3 limpa: um commit por lote (`Lote <Cidade>/<UF>: N prévias`) e push na main (o GitHub Pages publica sozinho;
ver memória de deploy). Confira a publicação com `gh run list --limit 1` e baixe 2 ou 3 páginas do site no ar para confirmar.
Se o Lucas não autorizou publicar nesta conversa, pergunte antes do push.

## Regras que valem para o lote inteiro

- **Nenhuma mensagem é enviada.** O Lucas envia. Você só escreve.
- Nada inventado: nota, número de avaliações, horários, telefones, depoimentos e fotos são reais e conferidos. O que não deu para confirmar vai como pendência na mensagem.
- Tudo em português do Brasil.
- Pare e pergunte só se algo exigir decisão do Lucas (ex.: a cidade não tem negócios suficientes que passem nos critérios).

## Ao terminar

Resumo para o Lucas: quantas prévias, quantos pulados e por quê, link do `mensagens.md`, pendências mais importantes, e confirmação de que está no ar.
Salve uma memória curta do lote (como as dos lotes de 20 e 21/11/2026).
