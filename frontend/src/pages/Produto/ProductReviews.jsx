import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button/Button";
import StarRating from "@/components/StarRating/StarRating";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import styles from "./ProductReviews.module.css";

const ESTRELAS = [5, 4, 3, 2, 1];
const LIMITE_COMENTARIO = 1000;

function FormularioAvaliacao({
  minhaAvaliacao,
  salvando,
  erroSalvar,
  onSalvar,
  onSucesso,
}) {
  const [nota, setNota] = useState(minhaAvaliacao?.nota || 0);
  const [comentario, setComentario] = useState(minhaAvaliacao?.comentario || "");
  const [erroLocal, setErroLocal] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErroLocal("");
    setSucessoMsg("");

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      setErroLocal("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const res = await onSalvar({
      nota,
      comentario: comentario.trim() || null,
    });

    if (res?.ok) {
      setSucessoMsg(
        minhaAvaliacao
          ? "Alterações salvas com sucesso!"
          : "Avaliação enviada com sucesso!",
      );
      onSucesso?.();
    }
  }

  const mensagemErro = erroLocal || erroSalvar?.message || "";

  return (
    <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formTitle}>
        {minhaAvaliacao ? "Sua avaliação" : "Avaliar este produto"}
      </h3>

      <div className={styles.ratingField}>
        <span className={styles.fieldLabel}>Sua nota *</span>
        <StarRating
          modo="entrada"
          valor={nota}
          onChange={(n) => {
            setNota(n);
            setErroLocal("");
          }}
          desabilitado={salvando}
          tamanho={24}
        />
      </div>

      <div className={styles.textareaField}>
        <label htmlFor="avaliacao-comentario" className={styles.fieldLabel}>
          Comentário (opcional)
        </label>
        <textarea
          id="avaliacao-comentario"
          className={styles.textarea}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={LIMITE_COMENTARIO}
          rows={3}
          disabled={salvando}
          placeholder="Conte como foi sua experiência com este produto"
        />
        <span className={styles.charCounter}>
          {comentario.length}/{LIMITE_COMENTARIO}
        </span>
      </div>

      {mensagemErro ? (
        <p className={styles.errorText} role="alert">
          {mensagemErro}
        </p>
      ) : null}

      {sucessoMsg ? (
        <p className={styles.successText} role="status">
          {sucessoMsg}
        </p>
      ) : null}

      <div className={styles.formActions}>
        <Button type="submit" variant="primary" size="md" loading={salvando}>
          {minhaAvaliacao ? "Salvar alterações" : "Enviar avaliação"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Seção de avaliações do produto (#avaliacoes):
 * Resumo, formulário condicional (logado + compra finalizada) e lista paginada.
 */
export default function ProductReviews({
  avaliacoes = null,
  carregando = false,
  carregandoMais = false,
  erro = null,
  onRecarregar,
  onVerMais,
  usuario = null,
  podeAvaliar = false,
  minhaAvaliacao = null,
  carregandoMinha = false,
  erroMinha = null,
  onRecarregarMinha,
  onSalvarMinha,
  salvandoMinha = false,
  erroSalvarMinha = null,
  className = "",
}) {
  const location = useLocation();
  const resumo = avaliacoes?.resumo || null;
  const itens = Array.isArray(avaliacoes?.itens) ? avaliacoes.itens : [];

  const mediaBruta = resumo?.media ?? resumo?.notaMedia ?? null;
  const mediaNum = mediaBruta != null ? Number(mediaBruta) : null;
  const notaMediaTexto =
    mediaNum != null ? mediaNum.toFixed(1).replace(".", ",") : null;
  const total = resumo?.total ?? itens.length;
  const distribuicao = resumo?.distribuicao || {};
  const temMais = itens.length < total;

  return (
    <section
      id="avaliacoes"
      className={`${styles.section} ${className}`.trim()}
      aria-labelledby="avaliacoes-heading"
    >
      <h2 id="avaliacoes-heading" className={styles.title}>
        Avaliações
      </h2>

      {carregando ? (
        <div className={styles.stateBox} role="status">
          <p className={styles.infoText}>Carregando avaliações...</p>
        </div>
      ) : erro ? (
        <div className={styles.stateBox} role="alert">
          <p className={styles.errorText}>
            Não foi possível carregar as avaliações.
          </p>
          {onRecarregar ? (
            <Button variant="outline" size="sm" onClick={onRecarregar}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {total > 0 && mediaNum != null ? (
            <div className={styles.summaryCard}>
              <div className={styles.scoreBlock}>
                <span className={styles.bigScore}>{notaMediaTexto}</span>
                <div className={styles.starsWrapper}>
                  <StarRating nota={mediaNum} tamanho={20} />
                </div>
                <span className={styles.totalLabel}>
                  {total} {total === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>

              <div
                className={styles.distributionBlock}
                role="region"
                aria-label="Distribuição de estrelas"
              >
                {ESTRELAS.map((estrela) => {
                  const qtd = distribuicao[estrela] || 0;
                  const porcentagem =
                    total > 0 ? Math.round((qtd / total) * 100) : 0;

                  return (
                    <div key={estrela} className={styles.distRow}>
                      <span className={styles.starLabel}>
                        {estrela} {estrela === 1 ? "estrela" : "estrelas"}
                      </span>
                      <div
                        className={styles.track}
                        role="progressbar"
                        aria-valuenow={porcentagem}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${estrela} estrelas: ${qtd} avaliações (${porcentagem}%)`}
                      >
                        <div
                          className={styles.fill}
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                      <span className={styles.distCount}>{qtd}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className={styles.reviewActionBox}>
            {!usuario ? (
              <p className={styles.infoText}>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className={styles.loginLink}
                >
                  Entre para avaliar
                </Link>{" "}
                este produto.
              </p>
            ) : carregandoMinha ? (
              <p className={styles.infoText}>
                Verificando sua elegibilidade para avaliar...
              </p>
            ) : erroMinha ? (
              <div className={styles.inlineErrorRow} role="alert">
                <span className={styles.errorText}>
                  Não foi possível verificar sua avaliação.
                </span>
                {onRecarregarMinha ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRecarregarMinha}
                  >
                    Tentar de novo
                  </Button>
                ) : null}
              </div>
            ) : !podeAvaliar ? (
              <p className={styles.infoText}>
                Só quem comprou este produto pode avaliar.
              </p>
            ) : (
              <FormularioAvaliacao
                key={
                  minhaAvaliacao
                    ? `${minhaAvaliacao.id}-${minhaAvaliacao.updatedAt || minhaAvaliacao.nota}`
                    : "nova"
                }
                minhaAvaliacao={minhaAvaliacao}
                salvando={salvandoMinha}
                erroSalvar={erroSalvarMinha}
                onSalvar={onSalvarMinha}
                onSucesso={onRecarregar}
              />
            )}
          </div>

          {itens.length > 0 ? (
            <>
              <div className={styles.reviewsList}>
                {itens.map((avaliacao) => (
                  <ReviewCard key={avaliacao.id} avaliacao={avaliacao} />
                ))}
              </div>

              {temMais && onVerMais ? (
                <div className={styles.loadMoreWrapper}>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onVerMais}
                    loading={carregandoMais}
                  >
                    Ver mais avaliações
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.emptyReviews}>
              <p className={styles.emptyText}>
                Este produto ainda não tem avaliações
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
