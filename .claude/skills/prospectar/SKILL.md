---
name: prospectar
description: Roda sozinha a prospecção inteira do Lucas numa cidade - acha negócios bem avaliados sem site, cria e audita uma prévia de site para cada um, publica no ar e deixa na pasta da cidade um .txt por negócio com a mensagem pronta e os contatos. Use quando o Lucas digitar /prospectar, pedir "prospecta <cidade>", "faz um lote em <cidade>" ou quiser continuar um lote parado.
argument-hint: <cidade> <UF> [quantidade=20] [ramos separados por vírgula]
---

# /prospectar <cidade> <UF> [quantidade] [ramos]

Exemplos: `/prospectar Valinhos SP`, `/prospectar Sorocaba SP 10`, `/prospectar Jundiaí SP 15 padarias,oficinas`.
Sem quantidade: 20 prévias. Sem ramos: a lista padrão de [analisar-locais](../analisar-locais/SKILL.md).

## O combinado com o Lucas (21/11/2026)

O único trabalho do Lucas é **mandar as mensagens**. Todo o resto é seu, do começo ao fim, **sem parar para perguntar**:
- não peça aprovação da lista, das prévias, do texto nem da publicação;
- **publique sem perguntar** (commit e push na main): o Lucas autorizou isso para o /prospectar;
- decida sozinho os casos duvidosos com as regras das skills e registre a decisão na ficha (campo `atencao`);
- só pare se for impossível continuar (ex.: a cidade não tem nenhum negócio que passe nos critérios, o navegador não abre) e, aí, explique o que falta.
- **Nunca envie mensagem a ninguém.** Você escreve; o Lucas manda.

## Onde fica cada coisa

Configuração: `feitopelolucas/ferramentas/prospeccao/config.json` (`pastaCidades` = `D:\Lucas\Documentos\Prospecção`).

```
D:\Lucas\Documentos\Prospecção\<Cidade - UF>\          (ex.: "Valinhos - SP"; uma pasta por cidade, para sempre)
  00 - LEIA-ME.txt            lista do que mandar, em ordem
  01 - <Negócio>.txt          mensagem pronta + WhatsApp/Instagram/e-mail/telefone + dados do negócio
  ...
  Enviadas\                   o Lucas arrasta para cá o que já mandou
  _controle\
    lote.md                   andamento (tabela) e histórico das rodadas
    candidatos.md             levantamento da etapa 1 (inclui descartados e o motivo)
    fichas\<pasta>.json       a ficha de cada negócio (modelo: ferramentas/prospeccao/ficha-modelo.json)
    auditorias\<data-hora>\   relatórios da auditoria (cópia automática)
```

Os dados dos clientes ficam **só nessa pasta do computador**, nunca no repositório (ele é público).
A pasta da cidade é a mesma em todas as rodadas: rodar de novo na mesma cidade **acrescenta** negócios novos e continua os inacabados.

## Passo a passo

0. **Preparar.** Leia as memórias do projeto (prospecção, fotos, CSP, deploy, perfil do Lucas). Crie a pasta da cidade se não existir.
   Se `_controle/lote.md` já existe, retome: quem está `mensagem pronta` fica como está; continue os outros pela situação.
   Crie a lista de tarefas com as etapas abaixo.
1. **Análise de locais** → [analisar-locais](../analisar-locais/SKILL.md). Cria uma ficha `achado` por candidato (uns 30% a mais que a quantidade), sem repetir negócio que já tem ficha em qualquer cidade nem prévia em `public/previa/`.
2. **Criação das prévias** → [criar-previa](../criar-previa/SKILL.md), um por vez, na ordem, até completar a quantidade. Quem cair na apuração vira `pulado` com motivo e entra o próximo da lista. Atualize a ficha e o `lote.md` a cada negócio.
3. **Auditoria completa** → [auditar-previas](../auditar-previas/SKILL.md) com `--cidade "<Cidade - UF>"`. Corrija e rode de novo até **0 erros**, avisos resolvidos ou justificados na ficha, e a revisão visual registrada para **todas**. Marque `auditada`.
4. **Mensagens** → [mensagem-abordagem](../mensagem-abordagem/SKILL.md). Grava a mensagem na ficha e marca `mensagem pronta`.
5. **Publicar** (sem perguntar): na raiz do repositório, `git add` só das pastas `feitopelolucas/public/previa/<pasta>/` do lote, commit
   `Prévias de <Cidade>/<UF>: N negócios` (com a linha Co-Authored-By) e `git push origin main`.
   Acompanhe com `gh run watch <id> --exit-status`. Se falhar, leia o log (`gh run view <id> --log-failed`), corrija e publique de novo.
6. **Conferir no ar.** Para cada prévia do lote: `curl -s -o /dev/null -w "%{http_code}" https://feitopelolucas.com.br/previa/<pasta>/` tem que dar 200,
   e baixe 3 delas para confirmar que a versão no ar é a nova. Uma prévia só vai para os .txt depois de estar no ar.
7. **Gerar os .txt**: `node ferramentas/prospeccao/gerar-txt.mjs "<Cidade - UF>"` (na pasta `feitopelolucas`). Abra 2 arquivos e confira.
8. **Fechar.** Registre a rodada no fim do `lote.md` (data, quantas prévias, puladas, commit). Salve/atualize a memória da cidade.
   Responda ao Lucas em poucas linhas: quantas mensagens estão prontas, o caminho da pasta, os 3 negócios mais promissores e
   qualquer pendência que ele precise saber antes de mandar.

## lote.md

```markdown
# Prospecção · <Cidade>/<UF>

| # | Negócio | Ramo | Nota | Avaliações | Pasta | Situação |
|---|---------|------|------|-----------|-------|----------|
| 1 | Pardal Panificadora | Padaria | 4,7 | 1.004 | pardal | mensagem pronta |

## Rodadas
- 22/11/2026 · pedido 20 · 20 prévias, 6 pulados · commit abc1234
```

Situações: `achado` → `prévia criada` → `auditada` → `mensagem pronta`, ou `pulado`. A ficha é a fonte da verdade; o `lote.md` é o resumo.

## Regras do lote inteiro

- Nada inventado: nota, avaliações, horários, telefones, depoimentos e fotos são reais e conferidos. O que não deu para confirmar vai em `atencao`.
- Tudo em português do Brasil.
- O trabalho é longo: siga até o fim mesmo que leve horas. Se a conversa for resumida no meio, o `lote.md` e as fichas dizem onde parou.
