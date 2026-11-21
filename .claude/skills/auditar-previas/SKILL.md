---
name: auditar-previas
description: Auditoria completa das prévias de site (feitopelolucas.com.br/previa/) - checagens automáticas no Edge (estrutura, links, fotos, celular e desktop, contraste, selo de horário simulado em todos os dias e horas) mais a revisão visual de cada página, e correção de tudo que aparecer. Use na etapa 3 do /prospectar ou quando o Lucas pedir para auditar, revisar ou fazer pente fino nas prévias.
argument-hint: <pastas> | --todas | --lote <lote>
---

# Auditoria completa das prévias

Meta: **0 erros**, todo aviso resolvido ou justificado, e cada página olhada com os próprios olhos. Uma prévia mal-acabada
queima o contato: na dúvida, corrija.

## 1. Rodar a ferramenta

Na pasta `feitopelolucas`:

```
node ferramentas/auditoria/auditar.mjs <pasta1> <pasta2> ...   # as prévias do lote
node ferramentas/auditoria/auditar.mjs --todas                 # todas (~3 min para 67)
```

Para pegar as pastas de um lote, leia a coluna Pasta de `docs/lotes/<lote>/lote.md`.
Rode em segundo plano se forem muitas. Saída em `feitopelolucas/.auditoria/<data-hora>/` (fora do git):
`relatorio.md`, `relatorio.json` e `telas/<pasta>-celular.jpg` / `-desktop.jpg` (página inteira em colunas).

O que ela já confere sozinha: CSP logo após o charset, noindex, og:image 1200x630, faixa de prévia, link do Lucas citando o negócio,
1 h1, formatos de WhatsApp/telefone, âncoras, ids repetidos, textos esquecidos, imagens inexistentes/sem alt/sem tamanho/tamanho
errado, fotos pesadas, sem uso, repetidas e possíveis 360°, erros de JavaScript e arquivos que não carregam, rolagem para o lado,
imagens quebradas, fontes que falharam, texto cortado, letra < 12px, contraste, botões pequenos, contato na primeira tela do celular,
botão flutuante sumindo no rodapé, e o **selo de horário simulado nos 7 dias de meia em meia hora** comparado com a tabela da página.

## 2. Ler o relatório e corrigir

- **Erro**: corrigir sempre.
- **Aviso**: corrigir, a menos que seja intencional. Se for intencional, diga por quê no resumo final. Casos já conhecidos:
  vários WhatsApps quando o negócio tem setores (ex.: Sonho da Manhã); sem telefone quando o negócio não publica nenhum;
  foto 2:1 que não é 360° (acrescente em `ferramentas/auditoria/fotos-conferidas.txt` depois de olhar).
- **Linha do tempo do horário**: leia a de cada página. Procure: "amanhã" quando amanhã é fechado, "aberto" fora do horário,
  horário de fechamento diferente da tabela, texto sem sentido. Selo fora do padrão → troque pelo script de
  [criar-previa/horario.js](../criar-previa/horario.js).
- Foto 360° confirmada → `python -I ferramentas/fotos/reprojetar-360.py` (instruções no topo do arquivo).

## 3. Revisão visual (obrigatória, uma por uma)

Abra com Read cada `telas/<pasta>-celular.jpg` e `telas/<pasta>-desktop.jpg`. Para cada página, confira:

1. **Primeira tela do celular**: nome do negócio, título forte, botão de contato visível, foto real que mostra o lugar.
2. **Fotos**: reais e do próprio lugar, nítidas, bem enquadradas (sem cabeça cortada, sem foto torta, sem distorção de 360°),
   sem a mesma foto duas vezes, sem rosto de cliente em destaque, sem marca d'água ou print de tela.
3. **Texto**: português correto, sem repetição, tom do negócio, nada inventado (preço, prêmio, "desde", número de avaliações conferem com a apuração).
4. **Layout**: alinhamentos, espaços vazios grandes, cartões órfãos numa grade, títulos quebrando feio, elementos sobrepostos, rodapé.
5. **Consistência**: horário do selo = tabela; endereço = mapa; nome igual em todo lugar; avaliações com autor.
6. **Desktop**: abertura acima da dobra (1366x768), grades completas, nada esticado demais.

Na dúvida sobre um detalhe, abra a página de verdade no navegador embutido (servidor `site` ou `site-alt` do `.claude/launch.json`)
no tamanho do celular (`resize_window` preset mobile) e olhe de perto.

## 4. Repetir até limpar

Corrigiu → rode a ferramenta de novo nas pastas mexidas e revise de novo as telas que mudaram. Só marque `auditada` no `lote.md`
quando a página estiver limpa. No fim, liste para o Lucas o que foi corrigido e o que ficou como está (e por quê).
