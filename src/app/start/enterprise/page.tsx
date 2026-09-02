"use client";

import { type FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import IndustrySelect from "@/components/start/IndustrySelect";

export default function StartEnterprisePage() {
  const [form, setForm] = useState({
    organizationName: "",
    contactEmail: "",
    industry: "",
    locations: "",
    governanceNeeds: "",
    notes: "",
  });

  function handleIndustryChange(industry: string) {
    setForm((currentForm) => ({
      ...currentForm,
      industry,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = "Enterprise Plan Request";
    const body = [
      `Organization Name: ${form.organizationName}`,
      `Contact Email: ${form.contactEmail}`,
      `Industry: ${form.industry}`,
      `Locations or operating units: ${form.locations}`,
      "",
      "Public profile and binder needs:",
      form.governanceNeeds,
      "",
      "Notes:",
      form.notes,
    ].join("\n");

    window.location.href = `mailto:hello@paladincompliance.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <p style={eyebrowStyle}>Enterprise</p>
          <h1 style={titleStyle}>Contact Sales</h1>
          <p style={subheadStyle}>
            Provide the basic details Paladin needs for a premium binder,
            enhanced public profile, and update plan.
          </p>
        </header>

        <section style={cardStyle}>
          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={labelStyle}>
              Organization Name
              <input
                required
                value={form.organizationName}
                onChange={(event) =>
                  setForm({ ...form, organizationName: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Contact Email
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm({ ...form, contactEmail: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <IndustrySelect
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              onChange={handleIndustryChange}
              value={form.industry}
            />

            <label style={labelStyle}>
              Locations or operating units
              <input
                required
                min={0}
                type="number"
                value={form.locations}
                onChange={(event) =>
                  setForm({ ...form, locations: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Public profile and binder needs
              <textarea
                required
                value={form.governanceNeeds}
                onChange={(event) =>
                  setForm({ ...form, governanceNeeds: event.target.value })
                }
                style={textareaStyle}
              />
            </label>

            <label style={labelStyle}>
              Notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                style={textareaStyle}
              />
            </label>

            <button type="submit" style={buttonStyle}>
              Contact Sales
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  background: "#f6f8fb",
  color: "#102033",
  padding: 32,
};

const containerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  marginBottom: 32,
};

const eyebrowStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontSize: 40,
  marginTop: 8,
};

const subheadStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 18,
  marginTop: 12,
  maxWidth: 620,
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  maxWidth: 820,
  padding: 28,
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: 18,
};

const labelStyle: CSSProperties = {
  color: "#102033",
  display: "grid",
  fontSize: 14,
  fontWeight: 700,
  gap: 8,
};

const inputStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  color: "#102033",
  fontSize: 16,
  padding: "12px 14px",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const buttonStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e2a3a, #0f172a)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 800,
  padding: "14px",
};
