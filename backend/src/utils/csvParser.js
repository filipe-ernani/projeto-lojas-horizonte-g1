/**
 * Parser CSV em conformidade com a RFC 4180.
 * Suporta:
 * - Aspas duplas e aspas escapadas ("")
 * - Vírgulas e quebras de linha (\r\n ou \n) dentro de campos delimitados por aspas
 * - Remoção de UTF-8 BOM no início
 * - Mapeamento por nome de coluna do cabeçalho
 * - Rastreamento do número da linha original no arquivo para validação e mensagens de erro
 */

export function parseCsvRfc4180(conteudoTexto) {
  if (typeof conteudoTexto !== "string") {
    throw new TypeError("O conteúdo CSV deve ser uma string.");
  }

  // Remove BOM (\uFEFF) se presente no início
  let texto = conteudoTexto;
  if (texto.charCodeAt(0) === 0xfeff) {
    texto = texto.slice(1);
  }

  const matrizLinhas = [];
  let linhaAtual = [];
  let campoAtual = "";
  let dentroDeAspas = false;
  let numeroLinha = 1;
  let linhaInicioRegistro = 1;

  const total = texto.length;
  let i = 0;

  while (i < total) {
    const char = texto[i];

    if (dentroDeAspas) {
      if (char === '"') {
        if (i + 1 < total && texto[i + 1] === '"') {
          // Aspas duplas escapadas ("")
          campoAtual += '"';
          i += 2;
          continue;
        }
        // Fechamento de aspas
        dentroDeAspas = false;
        i++;
      } else {
        if (char === "\n") {
          numeroLinha++;
        }
        campoAtual += char;
        i++;
      }
    } else {
      if (char === '"') {
        dentroDeAspas = true;
        i++;
      } else if (char === ",") {
        linhaAtual.push(campoAtual);
        campoAtual = "";
        i++;
      } else if (char === "\r") {
        if (i + 1 < total && texto[i + 1] === "\n") {
          i++;
        }
        numeroLinha++;
        linhaAtual.push(campoAtual);
        matrizLinhas.push({
          colunas: linhaAtual,
          linhaArquivo: linhaInicioRegistro,
        });
        linhaAtual = [];
        campoAtual = "";
        linhaInicioRegistro = numeroLinha;
        i++;
      } else if (char === "\n") {
        numeroLinha++;
        linhaAtual.push(campoAtual);
        matrizLinhas.push({
          colunas: linhaAtual,
          linhaArquivo: linhaInicioRegistro,
        });
        linhaAtual = [];
        campoAtual = "";
        linhaInicioRegistro = numeroLinha;
        i++;
      } else {
        campoAtual += char;
        i++;
      }
    }
  }

  // Último registro se não terminar com quebra de linha
  if (campoAtual.length > 0 || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual);
    matrizLinhas.push({
      colunas: linhaAtual,
      linhaArquivo: linhaInicioRegistro,
    });
  }

  // Ignora linha vazia no final se houver
  while (
    matrizLinhas.length > 0 &&
    matrizLinhas[matrizLinhas.length - 1].colunas.length === 1 &&
    matrizLinhas[matrizLinhas.length - 1].colunas[0].trim() === ""
  ) {
    matrizLinhas.pop();
  }

  if (matrizLinhas.length === 0) {
    return { cabecalho: [], registros: [] };
  }

  const cabecalhoBruto = matrizLinhas[0].colunas;
  const cabecalho = cabecalhoBruto.map((c) => c.trim());

  const registros = [];
  for (let idx = 1; idx < matrizLinhas.length; idx++) {
    const { colunas, linhaArquivo } = matrizLinhas[idx];
    const registro = { _linhaArquivo: linhaArquivo };

    cabecalho.forEach((nomeColuna, colIdx) => {
      registro[nomeColuna] = colunas[colIdx] !== undefined ? colunas[colIdx] : "";
    });

    registros.push(registro);
  }

  return { cabecalho, registros };
}
