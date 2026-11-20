// Requer a API local iniciada com ALLOW_TEST_TOKENS=true (tokens test:) e a
// variável INTEGRACAO_API_KEY definida no ambiente ou no backend/.env.
import { pool, query } from "../src/db.js";

async function testarGarantiaUsuario() {
  const chaveIntegracao = process.env.INTEGRACAO_API_KEY;
  if (!chaveIntegracao) {
    throw new Error("Defina INTEGRACAO_API_KEY para executar este teste.");
  }

  const testUid = "user-virgem-" + Date.now();
  const testEmail = testUid + "@teste.com";
  const testNome = "Usuario Teste " + Date.now();
  const testToken = `test:${testUid}:${testEmail}:${testNome}`;

  console.log("=== TESTE 1: USUÁRIO NUNCA CHAMOU O PERFIL ===");
  // 1. Confirmar que não existe no banco
  const preCheck = await query("SELECT * FROM loja.usuarios WHERE usuario_id = $1;", [testUid]);
  console.log("Existe antes do teste?", preCheck.rows.length > 0);

  // 2. Chamar PUT /api/favoritos/HZ-FEM-001 com conta virgem
  const favRes = await fetch("http://localhost:3000/api/favoritos/HZ-FEM-001", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + testToken,
      "Content-Type": "application/json",
    },
  });
  console.log("PUT /api/favoritos status:", favRes.status);

  // 3. Verificar se a linha do usuário foi criada automaticamente no banco
  const postFavCheck = await query("SELECT * FROM loja.usuarios WHERE usuario_id = $1;", [testUid]);
  console.log("Existe após PUT favoritos?", postFavCheck.rows.length > 0);
  if (postFavCheck.rows.length > 0) {
    console.log("Linha criada:", {
      usuario_id: postFavCheck.rows[0].usuario_id,
      email: postFavCheck.rows[0].email,
      nome: postFavCheck.rows[0].nome,
      criado_em: postFavCheck.rows[0].criado_em,
    });
  }

  // 4. Chamar POST /api/enderecos com a mesma conta virgem
  const endRes = await fetch("http://localhost:3000/api/enderecos", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + testToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apelido: "Casa",
      cep: "01310-100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      complemento: "Apto 101",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      padrao: true,
    }),
  });
  console.log("POST /api/enderecos status:", endRes.status);
  const endJson = await endRes.json();
  console.log("Endereço criado:", endJson);

  // 5. Testar GET /api/usuarios/perfil para conferir campos de dataLocal
  const perfilRes = await fetch("http://localhost:3000/api/usuarios/perfil", {
    headers: { Authorization: "Bearer " + testToken },
  });
  const perfilJson = await perfilRes.json();
  console.log("\n=== TESTE 2: PERFIL E DATAS LOCAL SP ===");
  console.log("Perfil retornado:", perfilJson);

  // 6. Testar PUT /api/usuarios/perfil atualizando telefone sem apagar nome existente
  const putPerfilRes = await fetch("http://localhost:3000/api/usuarios/perfil", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + testToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telefone: "11987654321",
    }),
  });
  const putPerfilJson = await putPerfilRes.json();
  console.log("\n=== TESTE 3: ATUALIZAR TELEFONE SEM APAGAR NOME ===");
  console.log("Perfil após atualização de telefone:", putPerfilJson);

  // 7. Testar criação e consulta de pedidos com datas formatadas
  console.log("\n=== TESTE 4: PEDIDO E DATAS LOCAL SP ===");
  // Criar um carrinho e finalizar para testar pedido
  await fetch("http://localhost:3000/api/carrinho", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + testToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      itens: [{ produtoId: "HZ-FEM-001", tamanho: "M", cor: "Marrom", quantidade: 1 }],
      ultimaEtapa: "CHECKOUT_INICIADO",
    }),
  });

  const finalizarRes = await fetch("http://localhost:3000/api/carrinho/finalizar", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + testToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      enderecoId: endJson.id,
      formaPagamento: "PIX",
    }),
  });
  const pedidoFinalizado = await finalizarRes.json();
  console.log("Pedido Finalizado:", {
    id: pedidoFinalizado.id,
    data: pedidoFinalizado.data,
    dataIso: pedidoFinalizado.dataIso,
    dataLocal: pedidoFinalizado.dataLocal,
    criadoEmLocal: pedidoFinalizado.criadoEmLocal,
    finalizadoEmLocal: pedidoFinalizado.finalizadoEmLocal,
  });

  const meusPedidosRes = await fetch("http://localhost:3000/api/pedidos/meus", {
    headers: { Authorization: "Bearer " + testToken },
  });
  const meusPedidosJson = await meusPedidosRes.json();
  console.log("Meus Pedidos:", {
    total: meusPedidosJson.length,
    primeiro: {
      id: meusPedidosJson[0]?.id,
      data: meusPedidosJson[0]?.data,
      dataLocal: meusPedidosJson[0]?.dataLocal,
      status: meusPedidosJson[0]?.status,
    },
  });

  // 8. Testar integração (deve continuar com Z)
  const integRes = await fetch("http://localhost:3000/api/integracao/pedidos?limite=1", {
    headers: { "X-API-Key": chaveIntegracao },
  });
  const integJson = await integRes.json();
  console.log("\n=== TESTE 5: EXPORT INTEGRAÇÃO (ISO UTC com Z) ===");
  console.log("Primeiro pedido exportado updated_at:", integJson.itens[0]?.updated_at);
  console.log("Termina com Z?", integJson.itens[0]?.updated_at?.endsWith("Z"));

  await pool.end();
}

testarGarantiaUsuario().catch((err) => {
  console.error("Erro no teste:", err);
  process.exit(1);
});
