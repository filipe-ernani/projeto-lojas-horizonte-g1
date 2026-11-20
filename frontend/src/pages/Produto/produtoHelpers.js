/**
 * Helper de validação e mensagens da regra D-07 ajustada:
 * - Exige cor somente se o produto tiver cores disponíveis.
 * - Exige tamanho somente se o produto tiver mais de 1 tamanho.
 * - Produz mensagem precisa para o atributo role="status".
 */
export function obterMensagemFalta({
  precisaCor,
  temCor,
  precisaTamanho,
  temTamanho,
  saoCalcados,
}) {
  const faltaCor = precisaCor && !temCor;
  const faltaTamanho = precisaTamanho && !temTamanho;

  if (faltaCor && faltaTamanho) {
    const rotuloTipo = saoCalcados ? "número" : "tamanho";
    return `Selecione uma cor e um ${rotuloTipo} para adicionar à cesta.`;
  }
  if (faltaCor) {
    return "Selecione uma cor para adicionar à cesta.";
  }
  if (faltaTamanho) {
    const rotuloTipo = saoCalcados ? "número" : "tamanho";
    return `Selecione um ${rotuloTipo} para adicionar à cesta.`;
  }
  return "";
}
