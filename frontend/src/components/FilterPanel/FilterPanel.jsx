import { X } from "lucide-react";
import Accordion from "@/components/ui/Accordion/Accordion";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Chip from "@/components/ui/Chip/Chip";
import Field from "@/components/ui/Field/Field";
import Button from "@/components/ui/Button/Button";
import styles from "./FilterPanel.module.css";

/**
 * Painel de filtros conforme docs/DESIGN.md:
 * - Filtros permitidos: Categoria, Tamanho e Preço (D-06).
 * - Sem filtro de cor, marca ou estilo.
 * - Desktop: coluna lateral de 280 px.
 * - Mobile: painel em tela cheia / drawer com botão fechar e ações.
 * - Opções recebidas via props (categorias, tamanhos). Sem dados fixos no código.
 */
export default function FilterPanel({
  categorias = [],
  tamanhos = [],
  filtros = {},
  onAlterarFiltro,
  onLimparFiltros,
  onAplicar,
  abertoMobile = false,
  onFecharMobile,
  className = "",
}) {
  const {
    categoria: categoriaAtiva = "",
    tamanho: tamanhoAtivo = "",
    precoMin = "",
    precoMax = "",
  } = filtros;

  function handleCategoriaChange(cat) {
    if (!onAlterarFiltro) return;
    // Se clicar na categoria já ativa, desmarca; senão seleciona
    onAlterarFiltro("categoria", categoriaAtiva === cat ? "" : cat);
  }

  function handleTamanhoClick(tam) {
    if (!onAlterarFiltro) return;
    onAlterarFiltro("tamanho", tamanhoAtivo === tam ? "" : tam);
  }

  function handlePrecoChange(campo, valor) {
    if (!onAlterarFiltro) return;
    onAlterarFiltro(campo, valor);
  }

  return (
    <>
      {/* Backdrop para mobile */}
      {abertoMobile ? (
        <div
          className={styles.backdrop}
          onClick={onFecharMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`${styles.panel} ${abertoMobile ? styles.panelOpenMobile : ""} ${className}`.trim()}
        aria-label="Filtros de catálogo"
      >
        <div className={styles.headerMobile}>
          <h2 className={styles.titleMobile}>Filtros</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onFecharMobile}
            aria-label="Fechar painel de filtros"
          >
            <X size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.groupsContainer}>
          {/* Grupo 1: Categoria */}
          <Accordion titulo="Categoria" defaultOpen>
            {categorias.length === 0 ? (
              <p className={styles.emptyText}>Nenhuma categoria disponível.</p>
            ) : (
              <div className={styles.checkboxList}>
                {categorias.map((cat) => (
                  <Checkbox
                    key={cat}
                    label={cat}
                    checked={categoriaAtiva === cat}
                    onChange={() => handleCategoriaChange(cat)}
                  />
                ))}
              </div>
            )}
          </Accordion>

          {/* Grupo 2: Tamanho */}
          <Accordion titulo="Tamanho" defaultOpen>
            {tamanhos.length === 0 ? (
              <p className={styles.emptyText}>Nenhum tamanho disponível.</p>
            ) : (
              <div className={styles.chipGrid}>
                {tamanhos.map((tam) => (
                  <Chip
                    key={tam}
                    selected={tamanhoAtivo === tam}
                    onClick={() => handleTamanhoClick(tam)}
                  >
                    {tam}
                  </Chip>
                ))}
              </div>
            )}
          </Accordion>

          {/* Grupo 3: Faixa de Preço */}
          <Accordion titulo="Preço" defaultOpen>
            <div className={styles.priceFields}>
              <Field
                label="Mínimo (R$)"
                type="number"
                placeholder="0"
                min="0"
                value={precoMin}
                onChange={(e) => handlePrecoChange("precoMin", e.target.value)}
              />
              <Field
                label="Máximo (R$)"
                type="number"
                placeholder="1000"
                min="0"
                value={precoMax}
                onChange={(e) => handlePrecoChange("precoMax", e.target.value)}
              />
            </div>
          </Accordion>
        </div>

        {/* Ações do painel */}
        <div className={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={onLimparFiltros}
          >
            Limpar filtros
          </Button>

          {onAplicar ? (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              className={styles.applyButtonMobile}
              onClick={onAplicar}
            >
              Aplicar filtros
            </Button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
