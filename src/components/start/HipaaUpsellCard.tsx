"use client";

import { useId, type CSSProperties } from "react";

type HipaaUpsellCardProps = {
  checked: boolean;
  name?: string;
  onChange: (checked: boolean) => void;
  priceLabel?: string;
};

const features = [
  "HIPAA policy module",
  "Workforce AI usage guidance",
  "HIPAA label on the registry record",
  "Binder inserts + annual updates",
  "HIPAA label on the registry record",
];

export default function HipaaUpsellCard({
  checked,
  name = "hipaaEnabled",
  onChange,
  priceLabel = "Catalog-priced plan",
}: HipaaUpsellCardProps) {
  const checkboxId = useId();

  return (
    <section style={cardStyle} aria-label="HIPAA module">
      <div style={topRowStyle}>
        <div>
          <p style={eyebrowStyle}>Healthcare module option</p>
          <h2 style={titleStyle}>Add HIPAA Module</h2>
        </div>
        <p style={priceStyle}>{priceLabel}</p>
      </div>

      <p style={bodyStyle}>
        Recommended for organizations handling protected health information
        (PHI), patient communications, or AI-assisted clinical workflows.
      </p>

      <ul style={featureListStyle}>
        {features.map((feature) => (
          <li key={feature} style={featureItemStyle}>
            <span style={featureCheckStyle} aria-hidden="true">
              &#10003;
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <label style={checkboxRowStyle} htmlFor={checkboxId}>
        <input
          id={checkboxId}
          checked={checked}
          name={name}
          onChange={(event) => onChange(event.target.checked)}
          style={checkboxStyle}
          type="checkbox"
        />
        <span>Add HIPAA Module</span>
      </label>

      <div style={verificationStyle}>
        <p style={verificationIntroStyle}>
          Organizations with the HIPAA module display:
        </p>
        <div style={verificationBadgeStyle}>
          <span style={badgeCheckStyle} aria-hidden="true">
            &#10003;
          </span>
          HIPAA Module Active
        </div>
        <p style={verificationNoteStyle}>on their public registry record page.</p>
      </div>

      {checked && (
        <div style={selectedBadgeStyle} aria-label="Selected badge preview">
          <span style={badgeCheckStyle} aria-hidden="true">
            &#10003;
          </span>
          HIPAA Module Active
        </div>
      )}
    </section>
  );
}

const cardStyle: CSSProperties = {
  background: "linear-gradient(145deg, #0f172a 0%, #18243a 58%, #1e3a8a 120%)",
  border: "1px solid rgba(198, 168, 91, 0.62)",
  borderRadius: 8,
  boxShadow: "0 18px 38px rgba(15, 23, 42, 0.18)",
  color: "#f8fafc",
  display: "grid",
  gap: 18,
  padding: 22,
};

const topRowStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  gap: 16,
  justifyContent: "space-between",
};

const eyebrowStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 12,
  fontWeight: 800,
  margin: 0,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  margin: "6px 0 0",
};

const priceStyle: CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(231, 211, 159, 0.48)",
  borderRadius: 8,
  color: "#e7d39f",
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 900,
  margin: 0,
  padding: "8px 10px",
};

const bodyStyle: CSSProperties = {
  color: "#dbeafe",
  fontSize: 15,
  lineHeight: 1.55,
  margin: 0,
};

const featureListStyle: CSSProperties = {
  display: "grid",
  gap: 9,
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const featureItemStyle: CSSProperties = {
  alignItems: "center",
  color: "#f8fafc",
  display: "flex",
  fontSize: 14,
  fontWeight: 700,
  gap: 10,
};

const featureCheckStyle: CSSProperties = {
  color: "#e7d39f",
  fontWeight: 900,
};

const checkboxRowStyle: CSSProperties = {
  alignItems: "center",
  background: "rgba(15, 23, 42, 0.58)",
  border: "1px solid rgba(148, 163, 184, 0.36)",
  borderRadius: 8,
  color: "#ffffff",
  cursor: "pointer",
  display: "flex",
  fontSize: 15,
  fontWeight: 900,
  gap: 10,
  padding: "12px 14px",
};

const checkboxStyle: CSSProperties = {
  accentColor: "#c6a85b",
  height: 18,
  width: 18,
};

const verificationStyle: CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(191, 219, 254, 0.24)",
  borderRadius: 8,
  display: "grid",
  gap: 8,
  padding: 14,
};

const verificationIntroStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 13,
  lineHeight: 1.45,
  margin: 0,
};

const verificationBadgeStyle: CSSProperties = {
  alignItems: "center",
  background: "linear-gradient(145deg, #1e3a8a, #2563eb)",
  border: "1px solid rgba(231, 211, 159, 0.48)",
  borderRadius: 999,
  color: "#ffffff",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 900,
  gap: 7,
  justifySelf: "start",
  padding: "7px 11px",
};

const verificationNoteStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 13,
  margin: 0,
};

const selectedBadgeStyle: CSSProperties = {
  ...verificationBadgeStyle,
  background: "linear-gradient(145deg, #c6a85b, #e7d39f)",
  color: "#0f172a",
};

const badgeCheckStyle: CSSProperties = {
  fontWeight: 900,
};
