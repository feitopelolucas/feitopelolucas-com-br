# Baixa fotos públicas do negócio (Google Maps, Instagram) para a pasta da prévia,
# regravando cada uma como JPEG limpo: até 1400 px no lado maior, qualidade 82, sem metadados.
#
# Uso (na pasta feitopelolucas):
#   python -I ferramentas/fotos/baixar.py <pasta> nome1=URL1 nome2=URL2 ...
# Exemplo:
#   python -I ferramentas/fotos/baixar.py pardal "fachada=https://lh3.googleusercontent.com/gps-cs-s/...=w1400" "cafe=https://..."
# Salva em public/previa/<pasta>/fotos/<nome>.jpg e mostra largura x altura de cada uma
# (use esses números no width/height da <img>).
#
# Fotos do Google Maps: troque o sufixo do link (=w400-h300-k-no etc.) por =w1400 para vir grande.
# Nunca baixar foto de banco de imagem nem post marcado "Conteúdo de IA" (ver skill criar-previa).

import io, os, sys, urllib.request
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    if len(sys.argv) < 3:
        sys.exit('Uso: python -I ferramentas/fotos/baixar.py <pasta> nome=URL [nome=URL ...]')
    pasta = sys.argv[1]
    destino = os.path.join(RAIZ, 'public', 'previa', pasta, 'fotos')
    os.makedirs(destino, exist_ok=True)
    for item in sys.argv[2:]:
        nome, _, url = item.partition('=')
        if not url.startswith('https://'):
            print(f'PULEI {nome}: o link precisa começar com https://'); continue
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            dados = urllib.request.urlopen(req, timeout=30).read()
            im = Image.open(io.BytesIO(dados))
            im = ImageOps.exif_transpose(im).convert('RGB')
            im.thumbnail((1400, 1400), Image.LANCZOS)
            arq = os.path.join(destino, nome + '.jpg')
            im.save(arq, 'JPEG', quality=82, optimize=True, progressive=True)
            print(f'ok  fotos/{nome}.jpg  {im.width}x{im.height}  {os.path.getsize(arq) // 1024} KB')
        except Exception as e:
            print(f'ERRO {nome}: {e}')

if __name__ == '__main__':
    main()
