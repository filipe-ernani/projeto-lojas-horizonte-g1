import neutraLight from "@/assets/hori/horizonte-hori-neutra-light.svg";
import neutraDark from "@/assets/hori/horizonte-hori-neutra-dark.svg";
import pensandoLight from "@/assets/hori/horizonte-hori-pensando-light.svg";
import pensandoDark from "@/assets/hori/horizonte-hori-pensando-dark.svg";
import felizLight from "@/assets/hori/horizonte-hori-feliz-light.svg";
import felizDark from "@/assets/hori/horizonte-hori-feliz-dark.svg";
import neutraLightEstatico from "@/assets/hori/horizonte-hori-neutra-light-estatico.svg";
import neutraDarkEstatico from "@/assets/hori/horizonte-hori-neutra-dark-estatico.svg";
import pensandoLightEstatico from "@/assets/hori/horizonte-hori-pensando-light-estatico.svg";
import pensandoDarkEstatico from "@/assets/hori/horizonte-hori-pensando-dark-estatico.svg";
import felizLightEstatico from "@/assets/hori/horizonte-hori-feliz-light-estatico.svg";
import felizDarkEstatico from "@/assets/hori/horizonte-hori-feliz-dark-estatico.svg";

export const ESTADOS_HORI = ["neutra", "pensando", "feliz"];

/** Arquivos da Hori por estado, tema e movimento (animado ou estático). */
export const ARQUIVOS_HORI = {
  animado: {
    neutra: { light: neutraLight, dark: neutraDark },
    pensando: { light: pensandoLight, dark: pensandoDark },
    feliz: { light: felizLight, dark: felizDark },
  },
  estatico: {
    neutra: { light: neutraLightEstatico, dark: neutraDarkEstatico },
    pensando: { light: pensandoLightEstatico, dark: pensandoDarkEstatico },
    feliz: { light: felizLightEstatico, dark: felizDarkEstatico },
  },
};

export function arquivoHori(estado, tema, movimentoReduzido) {
  const conjunto = ARQUIVOS_HORI[movimentoReduzido ? "estatico" : "animado"];
  const porEstado = conjunto[estado] || conjunto.neutra;
  return tema === "dark" ? porEstado.dark : porEstado.light;
}

/** Pré-carrega os 6 arquivos animados para a troca de estado não piscar. */
export function precarregarHori() {
  if (typeof Image === "undefined") return;
  for (const estado of ESTADOS_HORI) {
    for (const tema of ["light", "dark"]) {
      const imagem = new Image();
      imagem.src = ARQUIVOS_HORI.animado[estado][tema];
    }
  }
}
