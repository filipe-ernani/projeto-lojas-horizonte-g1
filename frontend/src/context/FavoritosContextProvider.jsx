import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { FavoritosContext } from "./FavoritosContext";
import {
  adicionarFavorito,
  listarFavoritos,
  removerFavorito,
} from "@/services/favoritosService";

export function FavoritosProvider({ children }) {
  const { usuario } = useAuth();

  const [itens, setItens] = useState([]);
  const [skus, setSkus] = useState(() => new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    setVersao((v) => v + 1);
  }, []);

  // Carrega favoritos apenas quando houver usuário autenticado
  useEffect(() => {
    if (!usuario) {
      return;
    }

    const controller = new AbortController();

    listarFavoritos({ signal: controller.signal })
      .then((lista) => {
        setItens(lista);
        const novoSet = new Set(lista.map((p) => p.sku || p.id));
        setSkus(novoSet);
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
  }, [usuario, versao]);

  const isFavorito = useCallback(
    (sku) => {
      if (!usuario || !sku) return false;
      return skus.has(String(sku).trim());
    },
    [usuario, skus],
  );

  /**
   * Alterna estado de favorito (adicionar/remover) com atualização otimista e reversão em erro.
   * Se não houver usuário logado, não chama a API e devolve { precisaLogin: true }.
   */
  const alternar = useCallback(
    async (sku, produto = null) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      const skuLimpo = String(sku || "").trim();
      if (!skuLimpo) return { erro: "SKU inválido" };

      const jaEhFavorito = skus.has(skuLimpo);

      // Snapshot para rollback em caso de falha
      const snapshotItens = [...itens];
      const snapshotSkus = new Set(skus);

      // 1. Atualização otimista imediata na interface
      if (jaEhFavorito) {
        setItens((prev) => prev.filter((p) => (p.sku || p.id) !== skuLimpo));
        setSkus((prev) => {
          const next = new Set(prev);
          next.delete(skuLimpo);
          return next;
        });
      } else {
        const itemOtimista = produto || {
          id: skuLimpo,
          sku: skuLimpo,
          nome: "",
          preco: 0,
        };
        setItens((prev) => [itemOtimista, ...prev]);
        setSkus((prev) => {
          const next = new Set(prev);
          next.add(skuLimpo);
          return next;
        });
      }

      // 2. Chamada à API
      try {
        if (jaEhFavorito) {
          await removerFavorito(skuLimpo);
        } else {
          await adicionarFavorito(skuLimpo);
        }
        return { sucesso: true, favorito: !jaEhFavorito };
      } catch (err) {
        // 3. Rollback imediato
        setItens(snapshotItens);
        setSkus(snapshotSkus);
        setErro(err);
        throw err;
      }
    },
    [usuario, skus, itens],
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
      isFavorito,
      alternar,
      recarregar,
    };
  }, [
    usuario,
    itens,
    skus,
    carregando,
    erro,
    isFavorito,
    alternar,
    recarregar,
  ]);

  return (
    <FavoritosContext.Provider value={valor}>
      {children}
    </FavoritosContext.Provider>
  );
}
