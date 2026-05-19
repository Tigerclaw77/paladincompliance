"use client";

import { useMemo, useState, type CSSProperties } from "react";
import CheckoutButton from "@/components/CheckoutButton";
import type {
  AdditionalBinderPriceKey,
  PublicBinderPriceKey,
} from "@/lib/paladin/pricing";

const MIN_BINDER_QUANTITY = 1;
const MAX_BINDER_QUANTITY = 25;

type BinderCheckoutControlsProps = {
  buttonStyle?: CSSProperties;
  label: string;
  planName: string;
  priceKey: AdditionalBinderPriceKey | PublicBinderPriceKey;
  unitAmountCents: number;
  variant?: "dark" | "light";
};

export default function BinderCheckoutControls({
  buttonStyle,
  label,
  planName,
  priceKey,
  unitAmountCents,
  variant = "light",
}: BinderCheckoutControlsProps) {
  const [quantity, setQuantity] = useState(MIN_BINDER_QUANTITY);
  const totalLabel = useMemo(
    () => formatCurrency(unitAmountCents * quantity),
    [quantity, unitAmountCents]
  );
  const unitLabel = formatCurrency(unitAmountCents);
  const isDark = variant === "dark";

  function updateQuantity(value: string) {
    const parsedQuantity = Number(value);

    if (!Number.isInteger(parsedQuantity)) {
      setQuantity(MIN_BINDER_QUANTITY);
      return;
    }

    setQuantity(
      Math.min(
        MAX_BINDER_QUANTITY,
        Math.max(MIN_BINDER_QUANTITY, parsedQuantity)
      )
    );
  }

  return (
    <div style={controlsStyle}>
      <div
        style={{
          ...quantityPanelStyle,
          ...(isDark ? darkQuantityPanelStyle : lightQuantityPanelStyle),
        }}
      >
        <label
          style={{
            ...quantityLabelStyle,
            color: isDark ? "#cbd5e1" : "#5b7087",
          }}
        >
          Quantity
          <input
            aria-label={`${planName} quantity`}
            inputMode="numeric"
            maxLength={2}
            onChange={(event) => updateQuantity(event.target.value)}
            pattern="[0-9]*"
            style={{
              ...quantityInputStyle,
              ...(isDark ? darkQuantityInputStyle : lightQuantityInputStyle),
            }}
            type="text"
            value={quantity}
          />
        </label>

        <div style={totalBlockStyle}>
          <span
            style={{
              ...totalLabelStyle,
              color: isDark ? "#94a3b8" : "#5b7087",
            }}
          >
            Total
          </span>
          <span style={{ ...totalValueStyle, color: isDark ? "#fef3c7" : "#102033" }}>
            {totalLabel}
          </span>
          <span
            style={{
              ...unitPriceStyle,
              color: isDark ? "#94a3b8" : "#5b7087",
            }}
          >
            {unitLabel} each
          </span>
        </div>
      </div>

      <CheckoutButton
        label={label}
        priceKey={priceKey}
        quantity={quantity}
        style={buttonStyle}
      />
    </div>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(amountCents / 100);
}

const controlsStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const quantityPanelStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: 10,
  display: "flex",
  gap: 14,
  justifyContent: "space-between",
  padding: 12,
};

const lightQuantityPanelStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dbe3ef",
};

const darkQuantityPanelStyle: CSSProperties = {
  background: "rgba(255, 255, 255, 0.045)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
};

const quantityLabelStyle: CSSProperties = {
  display: "grid",
  fontSize: 12,
  fontWeight: 900,
  gap: 6,
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const quantityInputStyle: CSSProperties = {
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 900,
  height: 40,
  outline: "none",
  padding: "0 10px",
  width: 82,
};

const lightQuantityInputStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#102033",
};

const darkQuantityInputStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  color: "#ffffff",
};

const totalBlockStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  justifyItems: "end",
  textAlign: "right",
};

const totalLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.7,
  textTransform: "uppercase",
};

const totalValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1.1,
};

const unitPriceStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.3,
};
