const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formata um valor numérico em Real brasileiro (BRL).
 */
export function formatCurrency(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const numero = Number(valor);
  if (Number.isNaN(numero)) {
    return "";
  }

  return formatadorBRL.format(numero);
}
