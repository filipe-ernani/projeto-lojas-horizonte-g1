const TIMEOUT_VIACEP_MS = 5000;
const MSG_NAO_ENCONTRADO = "CEP não encontrado. Preencha o endereço manualmente.";
const MSG_ERRO_REDE =
  "Não foi possível buscar o CEP agora. Preencha o endereço manualmente.";

/**
 * Consulta o endereço pelo CEP na API pública ViaCEP com timeout de 5s.
 */
export async function buscarEnderecoPorCep(cepDigitos, { signal } = {}) {
  const digitos = String(cepDigitos || "").replace(/\D/g, "");
  if (digitos.length !== 8) {
    throw new Error("Informe um CEP válido com 8 dígitos.");
  }

  const controller = new AbortController();
  let expirouTimeout = false;

  const timer = setTimeout(() => {
    expirouTimeout = true;
    controller.abort();
  }, TIMEOUT_VIACEP_MS);

  function aoAbortarExterno() {
    controller.abort();
  }

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new DOMException("Operação cancelada.", "AbortError");
    }
    signal.addEventListener("abort", aoAbortarExterno, { once: true });
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!resposta.ok) {
      throw new Error(MSG_ERRO_REDE);
    }

    const dados = await resposta.json();
    if (dados?.erro) {
      throw new Error(MSG_NAO_ENCONTRADO);
    }

    return {
      logradouro: dados.logradouro || "",
      bairro: dados.bairro || "",
      cidade: dados.localidade || "",
      uf: String(dados.uf || "").trim().toUpperCase(),
    };
  } catch (err) {
    if (err?.name === "AbortError" && !expirouTimeout && signal?.aborted) {
      throw err;
    }
    if (err?.message === MSG_NAO_ENCONTRADO) {
      throw err;
    }
    throw new Error(MSG_ERRO_REDE, { cause: err });
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener("abort", aoAbortarExterno);
    }
  }
}
