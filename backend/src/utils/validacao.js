/**
 * Converte um identificador recebido da URL ou do corpo em inteiro positivo seguro.
 * Devolve null quando o valor não é um id válido.
 */
export function paraIdSeguro(valor) {
  const numero =
    typeof valor === "string" && /^\d+$/.test(valor.trim())
      ? Number(valor.trim())
      : valor;

  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

/**
 * Indica se o texto tem caracteres de controle (inclusive o byte nulo).
 */
export function temCaractereDeControle(texto) {
  // eslint-disable-next-line no-control-regex
  return /[\u0000-\u001f\u007f]/.test(texto);
}
