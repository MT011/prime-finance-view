import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  hidden: boolean;
  toggle: () => void;
  format: (value: number) => string;
};

const ValueVisibilityContext = createContext<Ctx | null>(null);

export function ValueVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const format = (value: number) => {
    if (hidden) return "R$ •••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };
  return (
    <ValueVisibilityContext.Provider value={{ hidden, toggle: () => setHidden((h) => !h), format }}>
      {children}
    </ValueVisibilityContext.Provider>
  );
}

export function useValueVisibility() {
  const ctx = useContext(ValueVisibilityContext);
  if (!ctx) throw new Error("useValueVisibility must be inside ValueVisibilityProvider");
  return ctx;
}
