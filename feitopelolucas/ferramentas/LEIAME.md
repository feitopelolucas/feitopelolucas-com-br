# Ferramentas da prospecção

Rodam na pasta `feitopelolucas`. Usam o Microsoft Edge do Windows (playwright-core) e o Pillow do Python.
Na primeira vez numa máquina nova: `npm install`.

| Ferramenta | Para quê |
|---|---|
| `node ferramentas/auditoria/auditar.mjs <pastas> \| --todas \| --cidade "Cidade - UF"` | Auditoria completa em 11 etapas. Relatórios e capturas em `.auditoria/` (fora do git), com cópia na pasta da cidade. |
| `node ferramentas/prospeccao/gerar-txt.mjs "Cidade - UF"` | Gera, das fichas, um `.txt` por negócio (mensagem + contatos + dados) e o `00 - LEIA-ME.txt`. |
| `python -I ferramentas/fotos/baixar.py <pasta> nome=URL ...` | Baixa fotos públicas do negócio e regrava em JPEG limpo de até 1400 px. |
| `python -I ferramentas/fotos/reprojetar-360.py ...` | Transforma foto 360° do Street View em foto comum. |
| `node ferramentas/fotos/compartilhar.mjs <pasta> ...` | Gera a imagem 1200x630 que aparece quando o link é mandado no WhatsApp. |

Configuração: `ferramentas/prospeccao/config.json` (pasta das cidades, WhatsApp do Lucas).
Modelo da ficha de cada negócio: `ferramentas/prospeccao/ficha-modelo.json`.

## Pastas das cidades (fora do repositório)

`D:\Lucas\Documentos\Prospecção\<Cidade - UF>\` tem um `.txt` por negócio pronto para mandar, a pasta `Enviadas\` e, em `_controle\`,
o andamento (`lote.md`), o levantamento (`candidatos.md`), as fichas e as auditorias. Os dados dos clientes ficam só aí: o repositório é público.

## O processo

Está nas skills em `.claude/skills/`. No Claude Code: `/prospectar <cidade> <UF> [quantidade] [ramos]` faz tudo sozinho
(levantamento, prévias, auditoria, publicação e os .txt). Cada etapa também pode ser chamada sozinha:
`/analisar-locais`, `/criar-previa`, `/auditar-previas`, `/mensagem-abordagem`.
