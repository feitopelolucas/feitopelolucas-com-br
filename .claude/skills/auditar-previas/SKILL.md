---
name: auditar-previas
description: Auditoria completa das prévias de site (feitopelolucas.com.br/previa/) em 11 etapas - estrutura, links, fotos, dados x ficha, textos, layout em 6 telas, acessibilidade, interação com formulários e botões, selo de horário simulado, desempenho e revisão visual registrada - e correção de tudo. Use na etapa 3 do /prospectar ou quando o Lucas pedir para auditar, revisar ou fazer pente fino nas prévias.
argument-hint: <pastas> | --todas | --cidade "<Cidade - UF>"
---

# Auditoria completa das prévias

Meta: **0 erros**, todo aviso **corrigido ou justificado por escrito**, e a revisão visual **registrada** para cada página.
Uma prévia mal-acabada queima o contato: na dúvida, corrija. Não pergunte ao Lucas: decida e registre.

## 1. Rodar a ferramenta

Na pasta `feitopelolucas`:

```
node ferramentas/auditoria/auditar.mjs --cidade "Valinhos - SP"   # as prévias das fichas dessa cidade
node ferramentas/auditoria/auditar.mjs pardal karioka             # prévias específicas
node ferramentas/auditoria/auditar.mjs --todas                    # todas (~10 min; rode em segundo plano)
```

Saída em `feitopelolucas/.auditoria/<data-hora>/` (fora do git), com cópia em `<Cidade - UF>\_controle\auditorias\`:
- `relatorio.md`: tabela geral e todas as páginas; **nada é cortado**.
- `paginas/<pasta>.md`: a página sozinha, com a tabela das 11 etapas.
- `revisao-visual.md`: modelo da etapa 11, para preencher.
- `telas/<pasta>-celular.jpg` e `-desktop.jpg`: página inteira em colunas.
- `telas/detalhes/<pasta>-NN.png`: recorte de cada elemento com problema.
- `.auditoria/historico.md`: uma linha por rodada (dá para ver a evolução).

Cada achado traz **etapa, nível, telas onde acontece, linha do HTML, seletor CSS e recorte**: vá direto ao ponto.

## 2. As 11 etapas (o que a ferramenta confere)

1. **Estrutura e SEO**: CSP logo após o charset, lang, viewport, noindex, título, description, og:* e imagem 1200x630, favicon, faixa de prévia
   com o nome, 1 h1, rodapé, ids repetidos, erros de JavaScript e de console, arquivos que não carregam.
2. **Links e contatos**: link do Lucas com mensagem citando o negócio, formato de WhatsApp/telefone, mensagens prontas sem texto quebrado,
   noopener, âncoras, links vazios ou sem href, mapa e "Como chegar", **todos os links externos acessados de verdade** (404 = erro).
3. **Fotos**: existem, alt, width/height iguais à proporção do arquivo, resolução mínima, peso, sem uso, a mesma foto repetida
   (por nome e por conteúdo), suspeita de 360°.
4. **Dados x ficha**: WhatsApp, telefone, Instagram, nota, nº de avaliações, número do endereço, horários e nome da página batem com a ficha.
5. **Textos**: textos de modelo esquecidos, acento quebrado, palavra repetida, espaço antes de pontuação, "Whatsapp", "R$" e preço mal
   formatados, erros comuns ("à partir", "concerto", "agente", "seje"...).
6. **Layout em 6 telas** (360, 375, 390, 768, 1366 e 1920 px): rolagem para o lado, texto cortado ou escondido pela borda, título fora
   ou abaixo da primeira tela, imagem quebrada, foto esticada ou ampliada demais, fonte que não carregou, botões/títulos sobrepostos,
   contato na primeira tela (celular até 700 px; desktop até 768 px).
7. **Legibilidade e acessibilidade**: letra < 12 px, contraste (AA), texto sobre foto sem sombra/fundo, alvos de toque < 44 px, campos
   com letra < 16 px (zoom do iPhone), botões/links sem nome, campos sem rótulo, títulos pulando nível, iframe sem title, foto grande sem
   descrição, botão flutuante sumindo no rodapé.
8. **Interação**: preenche e envia cada formulário, aperta os botões de quantidade e os demais botões, confere os links de WhatsApp gerados
   (número do negócio, mensagem sem "undefined/NaN") e se a página mostra lixo depois do uso. O relatório mostra cada mensagem gerada.
9. **Selo de horário**: simula os 7 dias, de meia em meia hora, compara com a tabela da página (aberto/fechado, horário de fechamento,
   "amanhã" em dia fechado) e mostra a linha do tempo inteira.
10. **Desempenho**: peso da página (HTML + fotos) e primeira foto com `loading="lazy"`.
11. **Revisão visual**: sua, com os olhos (abaixo). A ferramenta só prepara as capturas e o checklist.

## 3. Corrigir

- **ERRO**: sempre.
- **AVISO**: corrija. Se for intencional, justifique na ficha (`auditoria.avisosJustificados`: "<aviso> → <por quê>").
  Já conhecidos: vários WhatsApps quando o negócio tem setores; sem telefone quando o negócio não publica nenhum; nº de avaliações
  arredondado de propósito ("mais de mil"); foto 2:1 que não é 360° (anote em `ferramentas/auditoria/fotos-conferidas.txt`).
- Selo de horário fora do padrão → troque pelo script de [criar-previa/horario.js](../criar-previa/horario.js).
- Foto 360° → `python -I ferramentas/fotos/reprojetar-360.py` (instruções no topo do arquivo).
- Divergência com a ficha → descubra qual está certo (volte à fonte), corrija a errada e anote em `atencao` se continuar em dúvida.
- Achou um tipo de defeito que a ferramenta não pega? Corrija **e** acrescente a checagem em `ferramentas/auditoria/auditar.mjs`.

## 4. Revisão visual (etapa 11, obrigatória e registrada)

Abra com Read cada `telas/<pasta>-celular.jpg`, `telas/<pasta>-desktop.jpg`, os recortes da página e `public/previa/<pasta>/fotos/compartilhar.jpg`.
Confira o checklist e **escreva o resultado** em `revisao-visual.md` (marque cada item, anote o que viu e o que corrigiu):

1. Primeira tela do celular: nome do negócio, título forte, botão de contato, foto real que mostra o lugar.
2. Fotos: reais e do próprio lugar, nítidas, bem enquadradas (sem cabeça cortada, sem torta, sem distorção de 360°), sem repetição,
   sem rosto de cliente em destaque, sem marca d'água ou print.
3. Textos: português correto, tom do negócio, nada inventado (preço, prêmio, "desde", nº de avaliações conferem com a ficha).
4. Layout: alinhamentos, espaços vazios grandes, cartões órfãos numa grade, títulos quebrando feio, sobreposições.
5. Consistência: selo = tabela; endereço = mapa; nome igual em tudo; avaliações com autor.
6. Desktop: abertura acima da dobra, grades completas, nada esticado.
7. Imagem de compartilhamento: nome certo, foto boa, legível.
8. Rodapé, faixa de prévia e botão flutuante.

Na dúvida sobre um detalhe, abra a página no navegador embutido (servidor `site-alt` do `.claude/launch.json`) no tamanho do celular e olhe de perto.
Copie o resumo da revisão de cada página para a ficha (`auditoria.revisaoVisual`) e atualize `auditoria.rodadas` e `auditoria.erros`.

## 5. Repetir até limpar

Corrigiu → rode a ferramenta de novo nas páginas mexidas e refaça a revisão visual delas. Só marque `auditada` (ficha e `lote.md`)
com **0 erros**, avisos resolvidos ou justificados e revisão visual escrita. No fim, liste o que foi corrigido e o que ficou como está, e por quê.
