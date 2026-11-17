import { useEffect } from "react";

/**
 * Hook para gestão de acessibilidade do modal/dialog do ChatWidget:
 * - Foca automaticamente no campo de texto ao abrir.
 * - Fecha com a tecla Escape.
 * - Mantém o foco preso (focus trap) no Tab e Shift+Tab enquanto o painel estiver aberto.
 */
export function useChatFocusTrap(aberto, painelRef, fecharChat) {
  useEffect(() => {
    if (!aberto) return;

    const timer = setTimeout(() => {
      const inputEl = painelRef.current?.querySelector("input");
      inputEl?.focus();
    }, 50);

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        fecharChat();
        return;
      }

      if (e.key === "Tab") {
        const focusable = painelRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [aberto, painelRef, fecharChat]);
}
