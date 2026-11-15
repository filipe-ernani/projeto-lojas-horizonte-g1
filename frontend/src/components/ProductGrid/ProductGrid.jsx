import ProductCard from "@/components/ProductCard/ProductCard";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import styles from "./ProductGrid.module.css";

/**
 * Grade de produtos conforme docs/DESIGN.md:
 * 2 colunas no mobile, 3 no tablet e 4 no desktop via classe global .product-grid.
 * Recebe a lista de produtos por props.
 */
export default function ProductGrid({
  produtos = [],
  emptyTitulo = "Nenhum produto encontrado",
  emptyMensagem = "Não há produtos para exibir nesta seção no momento.",
  className = "",
}) {
  if (!produtos || produtos.length === 0) {
    return (
      <EmptyState
        titulo={emptyTitulo}
        mensagem={emptyMensagem}
        textoAcao="Ver catálogo completo"
        para="/catalogo"
        className={className}
      />
    );
  }

  return (
    <div className={`product-grid ${styles.grid} ${className}`.trim()}>
      {produtos.map((produto) => (
        <ProductCard key={produto.id} produto={produto} />
      ))}
    </div>
  );
}
