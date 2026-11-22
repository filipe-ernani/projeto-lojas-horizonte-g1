/**
 * Parser de Markdown mínimo e seguro para as respostas do assistente.
 *
 * Devolve só uma estrutura de dados (blocos e trechos); quem desenha é o
 * componente MarkdownText, que cria elementos React a partir de texto. Nada
 * aqui produz HTML, então qualquer tag na resposta aparece como texto literal.
 *
 * Suporta: parágrafos, quebra de linha simples, **negrito**, *itálico*,
 * _itálico_, `código`, listas com marcador (-, *, •) e numeradas, títulos
 * (#, ##, ###) e links http(s) ([texto](url) ou URL solta). O resto vira texto.
 *
 * Blocos:
 *   { tipo: "paragrafo", linhas: Trecho[][] }
 *   { tipo: "titulo", trechos: Trecho[] }
 *   { tipo: "lista", ordenada: boolean, inicio: number, itens: Trecho[][][] }
 *     (cada item é uma lista de linhas, e cada linha uma lista de trechos)
 * Trechos:
 *   { tipo: "texto", valor } | { tipo: "codigo", valor }
 *   { tipo: "negrito", filhos } | { tipo: "italico", filhos }
 *   { tipo: "link", href, filhos }
 */

const PROFUNDIDADE_MAXIMA = 6;

const RE_TITULO = /^ {0,3}#{1,3}[ \t]+(.+?)[ \t#]*$/;
const RE_MARCADOR = /^[ \t]*[-*•][ \t]+(.+)$/;
const RE_NUMERADA = /^[ \t]*(\d{1,9})[.)][ \t]+(.+)$/;
const RE_INDENTADA = /^[ \t]{2,}\S/;

const RE_IMAGEM = /^!\[[^\]\n]*\]\([^)\n]*\)/;
const RE_LINK = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;
const RE_URL_SOLTA = /^https?:\/\/[^\s<>()[\]{}"'`]+/i;
const RE_PONTUACAO_FINAL = /[.,;:!?*_]+$/;
const RE_ALFANUM = /[\p{L}\p{N}]/u;

/**
 * Devolve a URL normalizada se o esquema for http: ou https:, senão null.
 */
export function urlSegura(bruta) {
  if (typeof bruta !== "string" || !/^https?:\/\//i.test(bruta.trim())) return null;
  try {
    const url = new URL(bruta.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function anexarTexto(trechos, valor) {
  if (!valor) return;
  const ultimo = trechos[trechos.length - 1];
  if (ultimo && ultimo.tipo === "texto") {
    ultimo.valor += valor;
  } else {
    trechos.push({ tipo: "texto", valor });
  }
}

function ehEspaco(caractere) {
  return caractere === undefined || /\s/.test(caractere);
}

/**
 * Procura o delimitador de fechamento de ênfase a partir de `inicio`.
 * O fechamento não pode vir logo depois de espaço.
 */
function acharFechamento(texto, delimitador, inicio) {
  let posicao = texto.indexOf(delimitador, inicio);
  while (posicao !== -1) {
    const anterior = texto[posicao - 1];
    const ehDuplo = delimitador.length === 1 && texto[posicao + 1] === delimitador;
    if (posicao > inicio && !ehEspaco(anterior) && !ehDuplo) {
      if (delimitador !== "_" || !RE_ALFANUM.test(texto[posicao + 1] || "")) {
        return posicao;
      }
    }
    posicao = texto.indexOf(delimitador, posicao + (ehDuplo ? 2 : 1));
  }
  return -1;
}

/**
 * Converte uma linha em trechos inline.
 */
export function parseInline(texto, profundidade = 0, permitirLink = true) {
  const trechos = [];
  if (!texto) return trechos;
  if (profundidade > PROFUNDIDADE_MAXIMA) {
    anexarTexto(trechos, texto);
    return trechos;
  }

  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    const resto = () => texto.slice(i, i + 2048);

    // Código inline: conteúdo literal até a próxima crase
    if (c === "`") {
      const fim = texto.indexOf("`", i + 1);
      if (fim > i + 1) {
        trechos.push({ tipo: "codigo", valor: texto.slice(i + 1, fim) });
        i = fim + 1;
        continue;
      }
      anexarTexto(trechos, c);
      i += 1;
      continue;
    }

    // Imagem não é suportada: vai inteira como texto
    if (c === "!" && texto[i + 1] === "[") {
      const imagem = resto().match(RE_IMAGEM);
      if (imagem) {
        anexarTexto(trechos, imagem[0]);
        i += imagem[0].length;
        continue;
      }
    }

    // [texto](url): só http(s) vira link; outro esquema fica como texto
    if (c === "[") {
      const link = resto().match(RE_LINK);
      if (link) {
        const href = permitirLink ? urlSegura(link[2]) : null;
        if (href) {
          trechos.push({
            tipo: "link",
            href,
            filhos: parseInline(link[1], profundidade + 1, false),
          });
        } else {
          anexarTexto(trechos, link[0]);
        }
        i += link[0].length;
        continue;
      }
    }

    // URL solta http(s)
    if ((c === "h" || c === "H") && permitirLink && !RE_ALFANUM.test(texto[i - 1] || "")) {
      const solta = resto().match(RE_URL_SOLTA);
      if (solta) {
        const bruta = solta[0].replace(RE_PONTUACAO_FINAL, "");
        const href = urlSegura(bruta);
        if (href) {
          trechos.push({ tipo: "link", href, filhos: [{ tipo: "texto", valor: bruta }] });
          i += bruta.length;
          continue;
        }
      }
    }

    // **negrito**
    if (c === "*" && texto[i + 1] === "*" && !ehEspaco(texto[i + 2])) {
      const fim = acharFechamento(texto, "**", i + 2);
      if (fim !== -1) {
        trechos.push({
          tipo: "negrito",
          filhos: parseInline(texto.slice(i + 2, fim), profundidade + 1, permitirLink),
        });
        i = fim + 2;
        continue;
      }
      anexarTexto(trechos, "**");
      i += 2;
      continue;
    }

    // *itálico* e _itálico_ (o _ não abre no meio de palavra, como em nome_de_arquivo)
    if ((c === "*" || c === "_") && !ehEspaco(texto[i + 1])) {
      const abreNoMeio = c === "_" && RE_ALFANUM.test(texto[i - 1] || "");
      const fim = abreNoMeio ? -1 : acharFechamento(texto, c, i + 1);
      if (fim !== -1) {
        trechos.push({
          tipo: "italico",
          filhos: parseInline(texto.slice(i + 1, fim), profundidade + 1, permitirLink),
        });
        i = fim + 1;
        continue;
      }
    }

    anexarTexto(trechos, c);
    i += 1;
  }

  return trechos;
}

/**
 * Converte o texto inteiro em blocos. Texto vazio ou não string devolve [].
 */
export function parseMarkdown(texto) {
  if (typeof texto !== "string" || texto.trim() === "") return [];

  const linhas = texto.replace(/\r\n?/g, "\n").split("\n");
  const blocos = [];
  let paragrafo = null;
  let lista = null;

  function fecharTudo() {
    paragrafo = null;
    lista = null;
  }

  for (const linha of linhas) {
    if (linha.trim() === "") {
      fecharTudo();
      continue;
    }

    const titulo = linha.match(RE_TITULO);
    if (titulo) {
      fecharTudo();
      blocos.push({ tipo: "titulo", trechos: parseInline(titulo[1].trim()) });
      continue;
    }

    const marcador = linha.match(RE_MARCADOR);
    const numerada = marcador ? null : linha.match(RE_NUMERADA);
    if (marcador || numerada) {
      const ordenada = Boolean(numerada);
      if (!lista || lista.ordenada !== ordenada) {
        paragrafo = null;
        lista = {
          tipo: "lista",
          ordenada,
          inicio: ordenada ? Number(numerada[1]) : 1,
          itens: [],
        };
        blocos.push(lista);
      }
      const conteudo = (marcador ? marcador[1] : numerada[2]).trim();
      lista.itens.push([parseInline(conteudo)]);
      continue;
    }

    // Linha recuada logo após um item continua o mesmo item
    if (lista && RE_INDENTADA.test(linha)) {
      lista.itens[lista.itens.length - 1].push(parseInline(linha.trim()));
      continue;
    }

    lista = null;
    if (!paragrafo) {
      paragrafo = { tipo: "paragrafo", linhas: [] };
      blocos.push(paragrafo);
    }
    paragrafo.linhas.push(parseInline(linha.trim()));
  }

  return blocos;
}
