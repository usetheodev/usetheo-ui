import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";
import "./styles.css";

// tokens.css ativa dark via `.dark` (ou [data-theme="dark"]) no root.
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const dark = globalState.theme === "dark";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      {children}
    </div>
  );
};
