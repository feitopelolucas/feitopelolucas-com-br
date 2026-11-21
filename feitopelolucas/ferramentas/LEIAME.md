# Ferramentas da prospecção

Rodam na pasta `feitopelolucas`. Usam o Microsoft Edge do Windows (playwright-core) e o Pillow do Python.
Na primeira vez numa máquina nova: `npm install`.

| Ferramenta | Para quê |
|---|---|
| `node ferramentas/auditoria/auditar.mjs <pastas> \| --todas` | Auditoria completa das prévias. Relatório e capturas em `.auditoria/` (fora do git). |
| `python -I ferramentas/fotos/baixar.py <pasta> nome=URL ...` | Baixa fotos públicas do negócio e regrava em JPEG limpo de até 1400 px. |
| `python -I ferramentas/fotos/reprojetar-360.py ...` | Transforma foto 360° do Street View em foto comum. |
| `node ferramentas/fotos/compartilhar.mjs <pasta> ...` | Gera a imagem 1200x630 que aparece quando o link é mandado no WhatsApp. |

O processo inteiro (achar negócios, criar a prévia, auditar, escrever a mensagem) está nas skills em `.claude/skills/`.
No Claude Code: `/prospectar <cidade> <UF> [quantidade] [ramos]`, ou cada etapa separada:
`/analisar-locais`, `/criar-previa`, `/auditar-previas`, `/mensagem-abordagem`.
Os lotes ficam em `docs/lotes/<cidade-uf-data>/` (`lote.md`, `candidatos.md`, `mensagens.md`).
