/**
 * Utilitários de formatação de datas no fuso horário America/Sao_Paulo (UTC-3).
 * Todas as datas devolvidas pela API para exibição no front devem incluir
 * dataLocal formatada no fuso America/Sao_Paulo além do ISO UTC original.
 * Os exports de integração (/api/integracao/*) continuam em UTC ISO com Z.
 */

export const FUSO_SAO_PAULO = "America/Sao_Paulo";

/**
 * Formata um objeto Date ou string no formato ISO com offset do fuso America/Sao_Paulo.
 * Exemplo: "2026-11-18T08:21:00-03:00"
 */
export function formatarDataLocalSaoPaulo(dateInput) {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_SAO_PAULO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(d);

  const mapa = {};
  for (const p of partes) {
    mapa[p.type] = p.value;
  }

  let tz = mapa.timeZoneName || "-03:00";
  if (tz.startsWith("GMT")) {
    tz = tz.slice(3);
  }
  if (!tz.includes(":") && (tz.length === 3 || tz.length === 5)) {
    const sinal = tz[0];
    const horas = tz.slice(1, 3);
    const mins = tz.length === 5 ? tz.slice(3, 5) : "00";
    tz = `${sinal}${horas}:${mins}`;
  }

  return `${mapa.year}-${mapa.month}-${mapa.day}T${mapa.hour}:${mapa.minute}:${mapa.second}${tz}`;
}

/**
 * Formata uma data em ISO UTC padrão (com sufixo "Z").
 */
export function formatarIsoUtc(dateInput) {
  if (!dateInput) return null;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Formata a data como YYYY-MM-DD com base no horário de São Paulo.
 */
export function formatarDataSimples(dateInput) {
  if (!dateInput) return null;
  const local = formatarDataLocalSaoPaulo(dateInput);
  return local ? local.slice(0, 10) : null;
}
