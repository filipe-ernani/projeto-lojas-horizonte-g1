const formatadorData = new Intl.DateTimeFormat("pt-BR");

/**
 * Formata uma data (string ISO ou objeto Date) para dd/mm/aaaa.
 */
export function formatDate(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    const limpa = data.trim();
    const matchISO = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpa);
    if (matchISO) {
      const [, ano, mes, dia] = matchISO;
      return `${dia}/${mes}/${ano}`;
    }
  }

  const objetoData = data instanceof Date ? data : new Date(data);
  if (Number.isNaN(objetoData.getTime())) {
    return "";
  }

  return formatadorData.format(objetoData);
}
