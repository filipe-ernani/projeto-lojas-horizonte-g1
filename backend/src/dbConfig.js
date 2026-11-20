/**
 * Opção de TLS da conexão com o PostgreSQL, definida por DATABASE_SSL:
 * - "true": exige TLS e valida o certificado do servidor;
 * - "no-verify": exige TLS sem validar o certificado;
 * - vazio ou qualquer outro valor: conexão sem TLS (banco local em Docker).
 */
export function opcaoSslBanco() {
  const valor = (process.env.DATABASE_SSL || "").trim().toLowerCase();

  if (valor === "true") return { rejectUnauthorized: true };
  if (valor === "no-verify") return { rejectUnauthorized: false };
  return false;
}
