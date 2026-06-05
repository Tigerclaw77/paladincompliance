"use client";

import type { CSSProperties } from "react";

const INDUSTRY_OPTIONS = ["Healthcare", "Finance", "Technology", "Other"];

type IndustrySelectProps = {
  inputStyle?: CSSProperties;
  labelStyle?: CSSProperties;
  name?: string;
  onChange: (industry: string) => void;
  required?: boolean;
  value: string;
};

export default function IndustrySelect({
  inputStyle,
  labelStyle,
  name = "industry",
  onChange,
  required = true,
  value,
}: IndustrySelectProps) {
  return (
    <label style={labelStyle}>
      {required ? "Industry" : "Industry (Optional)"}
      <select
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        <option value="" disabled={required}>
          {required ? "Select Industry" : "No industry selected"}
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
