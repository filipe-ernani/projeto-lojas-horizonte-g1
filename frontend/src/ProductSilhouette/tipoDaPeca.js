const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const MAPA = [["body splash","cosmetic"],["kit maquiagem","makeup"],["oculos","sunglasses"],["tapete","mat"],["toalha","folded"],["jogo de cama","folded"],["sabonete","cosmetic"],["camiseta","tshirt"],["blusa","tshirt"],["body","tshirt"],["camisa","shirt"],["polo","shirt"],["moletom","hoodie"],["jaqueta","jacket"],["calca","pants"],["legging","pants"],["short","shorts"],["bermuda","shorts"],["saia","skirt"],["vestido","dress"],["macacao","dress"],["conjunto","set"],["pijama","set"],["tenis","sneaker"],["mocassim","sneaker"],["sapatilha","sneaker"],["bota","boot"],["sandalia","sandal"],["chinelo","sandal"],["calcinha","brief"],["cueca","brief"],["sunga","brief"],["sutia","bra"],["biquini","bra"],["maio","swimsuit"],["carteira","wallet"],["cinto","belt"],["mochila","backpack"],["bolsa","bag"],["mala","suitcase"],["relogio","watch"],["garrafa","bottle"],["hidratante","cosmetic"],["perfume","cosmetic"],["almofada","pillow"],["manta","folded"],["cortina","curtain"]];

/** Devolve o tipo da silhueta a partir do nome do produto, ou null. */
export function tipoDaPeca(nome = "") {
  const n = norm(nome);
  for (const [prefixo, tipo] of MAPA) if (n.startsWith(prefixo)) return tipo;
  return null;
}
