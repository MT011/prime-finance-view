import * as React from "react";
import { Input } from "@/components/ui/input";

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
};

const formatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toCents(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || "0");
}

export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  const cents = toCents(value);
  const displayValue = formatter.format(cents / 100);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Extrai somente os dígitos: digitação, backspace e colagem seguem a mesma regra.
    const nextCents = toCents(event.currentTarget.value);
    onValueChange((nextCents / 100).toFixed(2));
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      placeholder="R$ 0,00"
    />
  );
}
