import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { FavoritosContext } from "./FavoritosContext";
import {
  adicionarFavorito,
  listarFavoritos,
  removerFavorito,
} from "@/services/favoritosService";

function skuDoItem(item) {
  return item.sku || item.id;
}

/**
 * Aplica uma alternância de favorito sobre uma lista.
 */
function aplicarAlternancia(lista, { sku, favoritar, item }) {
  const semOItem = lista.filter((p) => skuDoItem(p) !== sku);
  return favoritar ? [item, ...semOItem] : semOItem;
}

export function FavoritosProvider({ children }) {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [itens, setItens] = useState([]);
  const [skus, setSkus] = useState(() => new Set());
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [erro, setErro] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);
  const [favoritosProntos, setFavoritosProntos] = useState(false);
  const [versao, setVersao] = useState(0);
  const [uidAtual, setUidAtual] = useState(uid);

  // Última lista confirmada pelo servidor e alternâncias ainda não confirmadas
  const confirmadosRef = useRef([]);
  const pendentesRef = useRef([]);
  const filaRef = useRef(Promise.resolve());
  const sessaoRef = useRef(0);
  const favoritosProntosRef = useRef(false);

  // Troca de usuário: nada do usuário anterior pode continuar na tela
  if (uid !== uidAtual) {
    setUidAtual(uid);
    setItens([]);
    setSkus(new Set());
    setErro(null);
    setErroAcao(null);
    setFavoritosProntos(false);
    setCarregando(Boolean(uid));
  }

  /**
   * Publica na tela a lista confirmada com as alternâncias pendentes reaplicadas sobre ela.
   */
  const publicar = useCallback(() => {
    const visiveis = pendentesRef.current.reduce(
      aplicarAlternancia,
      confirmadosRef.current,
    );
    setItens(visiveis);
    setSkus(new Set(visiveis.map(skuDoItem)));
  }, []);

  const enfileirar = useCallback((tarefa) => {
    const resultado = filaRef.current.then(tarefa);
    filaRef.current = resultado.catch(() => {});
    return resultado;
  }, []);

  // Cada usuário começa com fila e lista confirmada próprias
  useEffect(() => {
    sessaoRef.current += 1;
    confirmadosRef.current = [];
    pendentesRef.current = [];
    filaRef.current = Promise.resolve();
    favoritosProntosRef.current = false;
  }, [uid]);

  // A carga entra na fila para nunca sobrescrever uma alternância em andamento
  useEffect(() => {
    if (!uid) {
      return;
    }

    const controller = new AbortController();
    const sessao = sessaoRef.current;

    enfileirar(async () => {
      if (controller.signal.aborted) {
        return;
      }

      try {
        const lista = await listarFavoritos({ signal: controller.signal });
        if (controller.signal.aborted || sessao !== sessaoRef.current) {
          return;
        }
        confirmadosRef.current = lista;
        favoritosProntosRef.current = true;
        publicar();
        setFavoritosProntos(true);
        setErro(null);
        setCarregando(false);
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          controller.signal.aborted ||
          sessao !== sessaoRef.current
        ) {
          return;
        }
        setErro(err);
        setCarregando(false);
      }
    });

    return () => {
      controller.abort();
    };
  }, [uid, versao, enfileirar, publicar]);

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

  const limparErroAcao = useCallback(() => {
    setErroAcao(null);
  }, []);

  const isFavorito = useCallback(
    (sku) => {
      if (!usuario || !sku) return false;
      return skus.has(String(sku).trim());
    },
    [usuario, skus],
  );

  /**
   * Alterna estado de favorito (adicionar/remover) com atualização otimista e envio em fila.
   * Se não houver usuário logado, não chama a API e devolve { precisaLogin: true }.
   */
  const alternar = useCallback(
    async (sku, produto = null) => {
      if (!uid) {
        return { precisaLogin: true };
      }

      const skuLimpo = String(sku || "").trim();
      if (!skuLimpo) return { erro: "SKU inválido" };

      // Sem a primeira carga não dá para saber se o item já é favorito
      if (!favoritosProntosRef.current) {
        setErroAcao(
          new Error("Aguarde o carregamento dos seus favoritos e tente novamente."),
        );
        return { bloqueado: true };
      }

      // Decide a partir do que está visível, já contando as alternâncias pendentes
      const visiveis = pendentesRef.current.reduce(
        aplicarAlternancia,
        confirmadosRef.current,
      );
      const favoritar = !visiveis.some((p) => skuDoItem(p) === skuLimpo);

      const sessao = sessaoRef.current;
      const mutacao = {
        sku: skuLimpo,
        favoritar,
        item: produto || {
          id: skuLimpo,
          sku: skuLimpo,
          nome: "",
          preco: 0,
        },
      };

      const concluirMutacao = () => {
        pendentesRef.current = pendentesRef.current.filter(
          (m) => m !== mutacao,
        );
        publicar();
      };

      // 1. Atualização otimista imediata na interface
      setErroAcao(null);
      pendentesRef.current = [...pendentesRef.current, mutacao];
      publicar();

      // 2. Chamada à API, uma de cada vez
      return enfileirar(async () => {
        if (sessao !== sessaoRef.current) {
          throw new Error("A sessão foi alterada antes de salvar o favorito.");
        }

        try {
          if (favoritar) {
            await adicionarFavorito(skuLimpo);
          } else {
            await removerFavorito(skuLimpo);
          }

          if (sessao === sessaoRef.current) {
            confirmadosRef.current = aplicarAlternancia(
              confirmadosRef.current,
              mutacao,
            );
            concluirMutacao();
          }

          return { sucesso: true, favorito: favoritar };
        } catch (err) {
          // 3. Reversão: a alternância que falhou sai da lista de pendentes
          if (sessao === sessaoRef.current) {
            concluirMutacao();
            setErroAcao(err);
          }
          throw err;
        }
      });
    },
    [uid, enfileirar, publicar],
  );

  const valor = useMemo(() => {
    const itensEfetivos = usuario ? itens : [];
    const skusEfetivos = usuario ? Array.from(skus) : [];
    return {
      itens: itensEfetivos,
      favoritos: itensEfetivos,
      skus: skusEfetivos,
      total: itensEfetivos.length,
      carregando: usuario ? carregando : false,
      erro: usuario ? erro : null,
      erroAcao: usuario ? erroAcao : null,
      favoritosProntos: usuario ? favoritosProntos : false,
      isFavorito,
      alternar,
      recarregar,
      limparErroAcao,
    };
  }, [
    usuario,
    itens,
    skus,
    carregando,
    erro,
    erroAcao,
    favoritosProntos,
    isFavorito,
    alternar,
    recarregar,
    limparErroAcao,
  ]);

  return (
    <FavoritosContext.Provider value={valor}>
      {children}
    </FavoritosContext.Provider>
  );
}
