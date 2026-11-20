import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { CarrinhoContext } from "./CarrinhoContext";
import { obterCarrinho, salvarCarrinho } from "@/services/carrinhoService";

const FRETE_SIMULADO_PADRAO = 15.0;
const CARRINHO_VAZIO = { itens: [], subtotal: 0, frete: 0, total: 0 };

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

/**
 * Um item da cesta é identificado por produto + tamanho + cor.
 */
function ehMesmoItem(item, produtoId, tamanho, cor) {
  return (
    (item.produtoId || item.sku) === produtoId &&
    (item.tamanho ?? null) === (tamanho ?? null) &&
    (item.cor ?? null) === (cor ?? null)
  );
}

export function CarrinhoProvider({ children }) {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [itens, setItens] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [frete, setFrete] = useState(0);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [erro, setErro] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);
  const [cestaPronta, setCestaPronta] = useState(false);
  const [versao, setVersao] = useState(0);
  const [uidAtual, setUidAtual] = useState(uid);

  // Último estado confirmado pelo servidor e mutações ainda não confirmadas
  const confirmadoRef = useRef(CARRINHO_VAZIO);
  const pendentesRef = useRef([]);
  const filaRef = useRef(Promise.resolve());
  const sessaoRef = useRef(0);
  const cestaProntaRef = useRef(false);

  // Troca de usuário: nada do usuário anterior pode continuar na tela
  if (uid !== uidAtual) {
    setUidAtual(uid);
    setItens([]);
    setSubtotal(0);
    setFrete(0);
    setTotal(0);
    setErro(null);
    setErroAcao(null);
    setCestaPronta(false);
    setCarregando(Boolean(uid));
  }

  /**
   * Publica na tela o estado confirmado com as mutações pendentes reaplicadas sobre ele.
   */
  const publicar = useCallback(() => {
    const confirmado = confirmadoRef.current;
    const pendentes = pendentesRef.current;

    if (pendentes.length === 0) {
      setItens(confirmado.itens);
      setSubtotal(confirmado.subtotal);
      setFrete(confirmado.frete);
      setTotal(confirmado.total);
      return;
    }

    const itensVisiveis = pendentes.reduce(
      (acc, mutacao) => mutacao.gerarNovosItens(acc),
      confirmado.itens,
    );
    const totais = calcularTotaisOtimistas(itensVisiveis);
    setItens(itensVisiveis);
    setSubtotal(totais.subtotal);
    setFrete(totais.frete);
    setTotal(totais.total);
  }, []);

  const enfileirar = useCallback((tarefa) => {
    const resultado = filaRef.current.then(tarefa);
    filaRef.current = resultado.catch(() => {});
    return resultado;
  }, []);

  // Cada usuário começa com fila e estado confirmado próprios
  useEffect(() => {
    sessaoRef.current += 1;
    confirmadoRef.current = CARRINHO_VAZIO;
    pendentesRef.current = [];
    filaRef.current = Promise.resolve();
    cestaProntaRef.current = false;
  }, [uid]);

  // A carga entra na fila para nunca sobrescrever uma mutação em andamento
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
        const dados = await obterCarrinho({ signal: controller.signal });
        if (controller.signal.aborted || sessao !== sessaoRef.current) {
          return;
        }
        confirmadoRef.current = dados;
        cestaProntaRef.current = true;
        publicar();
        setCestaPronta(true);
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

  /**
   * Executa uma alteração no carrinho: mostra na hora e envia ao servidor em fila,
   * sempre calculando o PUT sobre o último estado confirmado.
   */
  const aplicarMutacaoOtimista = useCallback(
    async (gerarNovosItens) => {
      if (!uid) {
        return { precisaLogin: true };
      }

      if (!cestaProntaRef.current) {
        const erroBloqueio = new Error(
          "Aguarde o carregamento da sua cesta e tente novamente.",
        );
        setErroAcao(erroBloqueio);
        throw erroBloqueio;
      }

      const sessao = sessaoRef.current;
      const mutacao = { gerarNovosItens };

      const concluirMutacao = () => {
        pendentesRef.current = pendentesRef.current.filter(
          (m) => m !== mutacao,
        );
        publicar();
      };

      setErroAcao(null);
      pendentesRef.current = [...pendentesRef.current, mutacao];
      publicar();

      return enfileirar(async () => {
        if (sessao !== sessaoRef.current) {
          throw new Error("A sessão foi alterada antes de salvar a cesta.");
        }

        try {
          const respostaServidor = await salvarCarrinho({
            itens: gerarNovosItens(confirmadoRef.current.itens),
            ultimaEtapa: "CARRINHO",
          });

          if (sessao === sessaoRef.current) {
            confirmadoRef.current = respostaServidor;
            concluirMutacao();
          }

          return { sucesso: true, carrinho: respostaServidor };
        } catch (err) {
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

  /**
   * Adiciona um item ao carrinho. Se o mesmo SKU com mesmo tamanho e cor já existir, incrementa a quantidade.
   */
  const adicionar = useCallback(
    async (itemNovo) => {
      const sku = itemNovo.produtoId || itemNovo.sku || "";
      const tamanho = itemNovo.tamanho || null;
      const cor = itemNovo.cor || null;
      const quantidadeAdicionar = Math.max(1, Number(itemNovo.quantidade) || 1);

      return aplicarMutacaoOtimista((itensAtuais) => {
        const indiceExistente = itensAtuais.findIndex((i) =>
          ehMesmoItem(i, sku, tamanho, cor),
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
            corHex: itemNovo.corHex || null,
            quantidade: Math.min(10, quantidadeAdicionar),
          },
        ];
      });
    },
    [aplicarMutacaoOtimista],
  );

  /**
   * Altera a quantidade de um item. Se quantidade <= 0, remove o item.
   */
  const alterarQuantidade = useCallback(
    async (produtoId, tamanho, cor, novaQuantidade) => {
      const qtd = Number(novaQuantidade);
      if (!Number.isFinite(qtd)) {
        const erroQuantidade = new Error("Quantidade inválida.");
        setErroAcao(erroQuantidade);
        throw erroQuantidade;
      }

      return aplicarMutacaoOtimista((itensAtuais) => {
        if (qtd <= 0) {
          return itensAtuais.filter(
            (i) => !ehMesmoItem(i, produtoId, tamanho, cor),
          );
        }

        return itensAtuais.map((item) =>
          ehMesmoItem(item, produtoId, tamanho, cor)
            ? { ...item, quantidade: Math.min(10, Math.max(1, qtd)) }
            : item,
        );
      });
    },
    [aplicarMutacaoOtimista],
  );

  /**
   * Remove um item do carrinho.
   */
  const remover = useCallback(
    async (produtoId, tamanho, cor) =>
      aplicarMutacaoOtimista((itensAtuais) =>
        itensAtuais.filter((i) => !ehMesmoItem(i, produtoId, tamanho, cor)),
      ),
    [aplicarMutacaoOtimista],
  );

  /**
   * Limpa todo o carrinho.
   */
  const limpar = useCallback(
    async () => aplicarMutacaoOtimista(() => []),
    [aplicarMutacaoOtimista],
  );

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
      erroAcao: usuario ? erroAcao : null,
      cestaPronta: usuario ? cestaPronta : false,
      adicionar,
      alterarQuantidade,
      remover,
      limpar,
      recarregar,
      limparErroAcao,
    };
  }, [
    usuario,
    itens,
    subtotal,
    frete,
    total,
    carregando,
    erro,
    erroAcao,
    cestaPronta,
    adicionar,
    alterarQuantidade,
    remover,
    limpar,
    recarregar,
    limparErroAcao,
  ]);

  return (
    <CarrinhoContext.Provider value={valor}>
      {children}
    </CarrinhoContext.Provider>
  );
}
