import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";
import "./styles.css";

// tokens.css enables dark through `.dark` (or [data-theme="dark"]) on the root.
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const dark = globalState.theme === "dark";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <div className="min-h-screen bg-background bg-dotted-violet text-foreground">
      <div className="container py-12">{children}</div>
    </div>
  );
};
