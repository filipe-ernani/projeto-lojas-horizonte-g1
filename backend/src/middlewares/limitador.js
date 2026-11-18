/**
 * Limitador simples em memória, por IP e janela fixa (D13).
 * O contador vale para uma única instância da API e zera ao reiniciar.
 */
export function criarLimitador({ janelaMs, maximo, mensagem }) {
  const contadores = new Map();

  // Remove janelas vencidas para o mapa não crescer sem limite
  setInterval(() => {
    const agora = Date.now();
    for (const [chave, registro] of contadores) {
      if (registro.expiraEm <= agora) contadores.delete(chave);
    }
  }, janelaMs).unref();

  return function limitador(req, res, next) {
    const agora = Date.now();
    const chave = req.ip || "desconhecido";
    let registro = contadores.get(chave);

    if (!registro || registro.expiraEm <= agora) {
      registro = { total: 0, expiraEm: agora + janelaMs };
      contadores.set(chave, registro);
    }

    registro.total += 1;

    if (registro.total > maximo) {
      res.setHeader("Retry-After", Math.ceil((registro.expiraEm - agora) / 1000));
      return res.status(429).json({ erro: mensagem });
    }

    next();
  };
}
