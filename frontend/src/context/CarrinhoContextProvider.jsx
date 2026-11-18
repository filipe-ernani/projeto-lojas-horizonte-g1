import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { CarrinhoContext } from "./CarrinhoContext";
import { obterCarrinho, salvarCarrinho } from "@/services/carrinhoService";

const FRETE_SIMULADO_PADRAO = 15.0;

function calcularTotaisOtimistas(itens = []) {
  const subtotal = itens.reduce(
    (acc, i) => acc + (Number(i.preco) || 0) * (Number(i.quantidade) || 1),
    0,
  );
  const frete = itens.length > 0 ? FRETE_SIMULADO_PADRAO : 0;
  const total = subtotal + frete;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    frete,
    total: Math.round(total * 100) / 100,
  };
}

export function CarrinhoProvider({ children }) {
  const { usuario } = useAuth();

  const [itens, setItens] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [frete, setFrete] = useState(0);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    setVersao((v) => v + 1);
  }, []);

  // Carrega o carrinho somente quando houver usuário autenticado
  useEffect(() => {
    if (!usuario) {
      return;
    }

    const controller = new AbortController();

    obterCarrinho({ signal: controller.signal })
      .then((dados) => {
        setItens(dados.itens);
        setSubtotal(dados.subtotal);
        setFrete(dados.frete);
        setTotal(dados.total);
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

  /**
   * Executa uma alteração no carrinho com atualização otimista e reversão em caso de falha.
   */
  const aplicarMutacaoOtimista = useCallback(
    async (gerarNovosItens) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      // Snapshots para rollback
      const snapshotItens = [...itens];
      const snapshotSubtotal = subtotal;
      const snapshotFrete = frete;
      const snapshotTotal = total;

      const novosItens = gerarNovosItens(snapshotItens);
      const novosTotais = calcularTotaisOtimistas(novosItens);

      // 1. Atualização otimista imediata
      setItens(novosItens);
      setSubtotal(novosTotais.subtotal);
      setFrete(novosTotais.frete);
      setTotal(novosTotais.total);

      // 2. Persistência na API
      try {
        const respostaServidor = await salvarCarrinho({
          itens: novosItens,
          ultimaEtapa: "CARRINHO",
        });

        // 3. Sincroniza com valores exatos do servidor
        setItens(respostaServidor.itens);
        setSubtotal(respostaServidor.subtotal);
        setFrete(respostaServidor.frete);
        setTotal(respostaServidor.total);

        return { sucesso: true, carrinho: respostaServidor };
      } catch (err) {
        // 4. Rollback
        setItens(snapshotItens);
        setSubtotal(snapshotSubtotal);
        setFrete(snapshotFrete);
        setTotal(snapshotTotal);
        setErro(err);
        throw err;
      }
    },
    [usuario, itens, subtotal, frete, total],
  );

  /**
   * Adiciona um item ao carrinho. Se o mesmo SKU com mesmo tamanho e cor já existir, incrementa a quantidade.
   */
  const adicionar = useCallback(
    async (itemNovo) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      const sku = itemNovo.produtoId || itemNovo.sku || "";
      const tamanho = itemNovo.tamanho || null;
      const cor = itemNovo.cor || null;
      const quantidadeAdicionar = Math.max(1, Number(itemNovo.quantidade) || 1);

      return aplicarMutacaoOtimista((itensAtuais) => {
        const indiceExistente = itensAtuais.findIndex(
          (i) =>
            (i.produtoId === sku || i.sku === sku) &&
            i.tamanho === tamanho &&
            i.cor === cor,
        );

        if (indiceExistente >= 0) {
          const copia = [...itensAtuais];
          const itemExistente = copia[indiceExistente];
          const novaQtd = Math.min(
            10,
            itemExistente.quantidade + quantidadeAdicionar,
          );
          copia[indiceExistente] = { ...itemExistente, quantidade: novaQtd };
          return copia;
        }

        return [
          ...itensAtuais,
          {
            produtoId: sku,
            sku,
            nome: itemNovo.nome || "",
            preco: Number(itemNovo.preco) || 0,
            imagemUrl: itemNovo.imagemUrl || null,
            tamanho,
            cor,
            quantidade: Math.min(10, quantidadeAdicionar),
          },
        ];
      });
    },
    [usuario, aplicarMutacaoOtimista],
  );

  /**
   * Altera a quantidade de um item. Se quantidade <= 0, remove o item.
   */
  const alterarQuantidade = useCallback(
    async (identificador, novaQuantidade) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      const qtd = Number(novaQuantidade);

      return aplicarMutacaoOtimista((itensAtuais) => {
        if (qtd <= 0) {
          return itensAtuais.filter(
            (i) =>
              (i.produtoId || i.sku) !== identificador &&
              i.id !== identificador,
          );
        }

        return itensAtuais.map((item) => {
          const match =
            (item.produtoId || item.sku) === identificador ||
            item.id === identificador;
          if (match) {
            return { ...item, quantidade: Math.min(10, Math.max(1, qtd)) };
          }
          return item;
        });
      });
    },
    [usuario, aplicarMutacaoOtimista],
  );

  /**
   * Remove um item do carrinho.
   */
  const remover = useCallback(
    async (identificador) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      return aplicarMutacaoOtimista((itensAtuais) =>
        itensAtuais.filter(
          (i) =>
            (i.produtoId || i.sku) !== identificador &&
            i.id !== identificador,
        ),
      );
    },
    [usuario, aplicarMutacaoOtimista],
  );

  /**
   * Limpa todo o carrinho.
   */
  const limpar = useCallback(async () => {
    if (!usuario) {
      return { precisaLogin: true };
    }

    return aplicarMutacaoOtimista(() => []);
  }, [usuario, aplicarMutacaoOtimista]);

  const valor = useMemo(() => {
    const itensEfetivos = usuario ? itens : [];
    const subtotalEfetivo = usuario ? subtotal : 0;
    const freteEfetivo = usuario ? frete : 0;
    const totalEfetivo = usuario ? total : 0;
    const qtdTotal = itensEfetivos.reduce(
      (acc, i) => acc + (Number(i.quantidade) || 0),
      0,
    );

    return {
      itens: itensEfetivos,
      subtotal: subtotalEfetivo,
      frete: freteEfetivo,
      total: totalEfetivo,
      qtdTotal,
      carregando: usuario ? carregando : false,
      erro: usuario ? erro : null,
      adicionar,
      alterarQuantidade,
      remover,
      limpar,
      recarregar,
    };
  }, [
    usuario,
    itens,
    subtotal,
    frete,
    total,
    carregando,
    erro,
    adicionar,
    alterarQuantidade,
    remover,
    limpar,
    recarregar,
  ]);

  return (
    <CarrinhoContext.Provider value={valor}>
      {children}
    </CarrinhoContext.Provider>
  );
}
