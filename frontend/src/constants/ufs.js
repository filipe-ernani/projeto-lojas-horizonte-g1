export const UFS_LISTA = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export const UFS_SET = new Set(UFS_LISTA);

export const OPCOES_UF = [
  { value: "", label: "Selecione a UF" },
  ...UFS_LISTA.map((uf) => ({ value: uf, label: uf })),
];
