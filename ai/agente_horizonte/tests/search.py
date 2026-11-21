import argparse
import re

from agente_horizonte.config import bm25_top_k
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import load_documents_from_databricks
from agente_horizonte.retrieval.preprocessing import normalize_text


def parse_rating_query(query: str) -> tuple[str, bool]:
    """Recognize explicit requests for higher ratings without using an LLM."""
    normalized = normalize_text(query)
    pattern = r"\b(?:(?:com|de) (?:as )?)?(?:maiores notas|melhores notas|mais bem avaliados)\b"
    if re.search(pattern, normalized):
        return " ".join(re.sub(pattern, "", normalized).split()), True
    return query, False


def main() -> None:
    parser = argparse.ArgumentParser(description="Busca lexical no catálogo e nos reviews reais.")
    parser.add_argument(
        "--reviews", action="store_true", help="Inclui titulo e comentario dos reviews"
    )
    parser.add_argument(
        "--best-rated",
        action="store_true",
        help="Ordena produtos pela média das notas; inclui reviews",
    )
    args = parser.parse_args()
    include_reviews = args.reviews or args.best_rated
    top_k = bm25_top_k()
    print("Carregando os dados do Databricks...")
    documents = load_documents_from_databricks(
        review_id_field="avaliacao_id" if include_reviews else None,
        review_text_fields=("titulo", "comentario") if include_reviews else (),
    )
    retriever = BM25Retriever(documents, top_k=top_k)
    product_count = sum(document["type"] == "product" for document in documents)
    review_count = len(documents) - product_count
    print(f"Índice pronto: {product_count} produtos e {review_count} reviews. Top-K: {top_k}.")
    print("Digite uma busca ou 'sair' para encerrar.")

    while True:
        try:
            query = input("\nBusca: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if query.casefold() == "sair":
            break
        if not query:
            continue

        query, rating_request = parse_rating_query(query)
        sort_by_rating = args.best_rated or rating_request
        if sort_by_rating and not include_reviews:
            print("Para buscar por nota, inicie o comando com --reviews ou --best-rated.")
            continue
        results = retriever.search(query, sort_by_rating=sort_by_rating)
        if not results:
            print(
                "Nenhum produto avaliado encontrado."
                if sort_by_rating
                else "Nenhum item encontrado."
            )
        for position, result in enumerate(results, start=1):
            row = result["source"]["row"]
            name = row.get("nome") or row.get("nome_produto") or result["text"]
            print(f"\n{position}. {name}")
            print(
                f"   Tipo: {result['type']} | SKU: {result['product_id']} "
                f"| Score: {result['score']:.4f}"
            )
            if "review_id" in result:
                print(f"   ID do review: {result['review_id']}")
                if row.get("nota") is not None:
                    print(f"   Nota do review: {row['nota']}/5")
            if result.get("average_rating") is not None:
                print(
                    f"   Média: {result['average_rating']:.2f}/5 "
                    f"| Avaliações: {result['review_count']}"
                )
            print(f"   Conteúdo: {result['text']}")


if __name__ == "__main__":
    main()
