"use client";

import type { CSSProperties } from "react";

const INDUSTRY_OPTIONS = ["Healthcare", "Finance", "Technology", "Other"];

type IndustrySelectProps = {
  inputStyle?: CSSProperties;
  labelStyle?: CSSProperties;
  name?: string;
  onChange: (industry: string) => void;
  value: string;
};

export default function IndustrySelect({
  inputStyle,
  labelStyle,
  name = "industry",
  onChange,
  value,
}: IndustrySelectProps) {
  return (
    <label style={labelStyle}>
      Industry
      <select
        name={name}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        <option value="" disabled>
          Select Industry
        </option>
        {INDUSTRY_OPTIONS.map((industry) => (
          <option key={industry} value={industry}>
            {industry}
          </option>
        ))}
      </select>
    </label>
  );
}
