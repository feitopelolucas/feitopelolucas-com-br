# Converte uma foto 360° (equiretangular, proporção 2:1, típica do Street View)
# numa foto comum em perspectiva, como se tirada por uma câmera apontada para um lado.
#
# Uso (na pasta feitopelolucas):
#   python -I ferramentas/fotos/reprojetar-360.py ENTRADA GIRO INCLINACAO CAMPO LARGURA ALTURA SAIDA
#     GIRO        graus para a direita a partir do centro da foto (-180 a 180).
#                 Posição x na foto original -> giro = (x / largura_original - 0.5) * 360
#     INCLINACAO  graus para cima (+) ou para baixo (-); geralmente entre -6 e 3
#     CAMPO       abertura horizontal em graus (100 a 118 fica natural)
#     LARGURA ALTURA  tamanho da saída; use a proporção do lugar onde a foto aparece (ex.: 1000 500)
# Exemplo:
#   python -I ferramentas/fotos/reprojetar-360.py public/previa/karioka/fotos/salao.jpg -62 3 112 1000 500 salao-novo.jpg
#
# Gere 2 ou 3 versões com giros diferentes, olhe e fique com a que mostra melhor o lugar.
# Depois, atualize width/height da <img> para o novo tamanho.
# Só precisa do Pillow (sem numpy). Leva uns segundos por foto.
import sys, math
from PIL import Image

def view(src, yaw, pitch, hfov, W, H):
    s = Image.open(src).convert('RGB')
    sw, sh = s.size
    px = s.load()
    out = Image.new('RGB', (W, H)); op = out.load()
    f = (W / 2) / math.tan(math.radians(hfov) / 2)
    p, yw = math.radians(pitch), math.radians(yaw)
    cp, sp, cy, sy = math.cos(p), math.sin(p), math.cos(yw), math.sin(yw)
    for j in range(H):
        y = -(j - H / 2 + .5)
        for i in range(W):
            x = i - W / 2 + .5
            z = f
            n = math.sqrt(x * x + y * y + z * z)
            dx, dy, dz = x / n, y / n, z / n
            # pitch (x axis)
            dy, dz = dy * cp - dz * sp, dy * sp + dz * cp
            # yaw (y axis)
            dx, dz = dx * cy + dz * sy, -dx * sy + dz * cy
            lon = math.atan2(dx, dz); lat = math.asin(max(-1, min(1, dy)))
            u = (lon / (2 * math.pi) + .5) * sw - .5
            v = (.5 - lat / math.pi) * sh - .5
            u0 = math.floor(u); v0 = math.floor(v); du = u - u0; dv = v - v0
            v0c = min(max(v0, 0), sh - 1); v1c = min(max(v0 + 1, 0), sh - 1)
            a = px[u0 % sw, v0c]; b = px[(u0 + 1) % sw, v0c]
            c = px[u0 % sw, v1c]; d = px[(u0 + 1) % sw, v1c]
            op[i, j] = tuple(int(a[k] * (1 - du) * (1 - dv) + b[k] * du * (1 - dv) + c[k] * (1 - du) * dv + d[k] * du * dv + .5) for k in range(3))
    return out

if __name__ == '__main__':
    if len(sys.argv) != 8:
        sys.exit('Uso: python -I ferramentas/fotos/reprojetar-360.py ENTRADA GIRO INCLINACAO CAMPO LARGURA ALTURA SAIDA (detalhes no topo do arquivo)')
    src, yaw, pitch, hfov, W, H, dst = sys.argv[1:8]
    img = view(src, float(yaw), float(pitch), float(hfov), int(W), int(H))
    # o comentário avisa a auditoria que esta foto já foi tratada
    img.save(dst, quality=86, optimize=True, progressive=True, comment=b'reprojetada-360')
