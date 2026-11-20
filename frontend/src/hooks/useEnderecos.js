import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  criarEndereco,
  definirEnderecoPadrao,
  editarEndereco,
  excluirEndereco,
  listarEnderecos,
} from "@/services/enderecosService";

/**
 * Hook para listar e gerenciar endereços de entrega do usuário autenticado (/api/enderecos).
 * Retorna { dados, enderecos, carregando, erro, recarregar, criar, editar, excluir, definirPadrao } com AbortController.
 */
export default function useEnderecos() {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [enderecos, setEnderecos] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [uidAtual, setUidAtual] = useState(uid);

  // Troca de usuário: nada do usuário anterior pode continuar na tela
  if (uid !== uidAtual) {
    setUidAtual(uid);
    setEnderecos([]);
    setErro(null);
    setCarregando(Boolean(uid));
  }

  const recarregar = useCallback(() => {
    if (!uid) {
      return;
    }
    if (erro) {
      setCarregando(true);
    }
    setErro(null);
    setVersao((v) => v + 1);
  }, [uid, erro]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const controller = new AbortController();

    listarEnderecos({ signal: controller.signal })
      .then((lista) => {
        if (controller.signal.aborted) {
          return;
        }
        setEnderecos(lista);
        setErro(null);
        setCarregando(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setErro(err);
        setCarregando(false);
      });

    return () => {
      controller.abort();
    };
  }, [uid, versao]);

  const criar = useCallback(
    async (dados) => {
      if (!usuario) return { precisaLogin: true };
      const novo = await criarEndereco(dados);
      recarregar();
      return novo;
    },
    [usuario, recarregar],
  );

  const editar = useCallback(
    async (id, dados) => {
      if (!usuario) return { precisaLogin: true };
      const atualizado = await editarEndereco(id, dados);
      recarregar();
      return atualizado;
    },
    [usuario, recarregar],
  );

  const excluir = useCallback(
    async (id) => {
      if (!usuario) return { precisaLogin: true };
      const res = await excluirEndereco(id);
      recarregar();
      return res;
    },
    [usuario, recarregar],
  );

  const definirPadrao = useCallback(
    async (id, dados = {}) => {
      if (!usuario) return { precisaLogin: true };
      const res = await definirEnderecoPadrao(id, dados);
      recarregar();
      return res;
    },
    [usuario, recarregar],
  );

  const enderecosEfetivos = usuario ? enderecos : [];

  return {
    dados: enderecosEfetivos,
    enderecos: enderecosEfetivos,
    carregando: usuario ? carregando : false,
    erro: usuario ? erro : null,
    recarregar,
    criar,
    editar,
    excluir,
    definirPadrao,
  };
}
