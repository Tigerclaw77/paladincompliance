"use client";

import { useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";
import IndustrySelect from "@/components/start/IndustrySelect";
import {
  formatPaladinPrice,
  getCoveragePriceKey,
  getPaladinPlanName,
  getPaladinPriceItem,
} from "@/lib/paladin/pricing";

type PlanKey = "operational" | "starter";
const DEFAULT_OPERATIONAL_EMPLOYEE_COUNT = 50;

type IntentDefaults = {
  employeeCount?: number | null;
  industry?: string;
};

type PlanStartFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  contactEmail: string;
  errorMessage?: string;
  initialEmployeeCount?: number | null;
  organizationName: string;
  plan: PlanKey;
  savedIntent?: IntentDefaults | null;
};

export default function PlanStartForm({
  action,
  contactEmail,
  errorMessage = "",
  initialEmployeeCount = null,
  organizationName,
  plan,
  savedIntent,
}: PlanStartFormProps) {
  const [industry, setIndustry] = useState(
    savedIntent?.industry ?? ""
  );
  const employeeCount =
    plan === "operational"
      ? initialEmployeeCount ??
        savedIntent?.employeeCount ??
        DEFAULT_OPERATIONAL_EMPLOYEE_COUNT
      : null;
  const selectedPriceItem = getPaladinPriceItem(
    getCoveragePriceKey({
      employeeCount,
      plan,
    })
  );

  function handleIndustryChange(nextIndustry: string) {
    setIndustry(nextIndustry);
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <p style={eyebrowStyle}>{planLabel(plan)}</p>
          <h1 style={titleStyle}>Confirm Your Package</h1>
          <p style={subheadStyle}>
            This starts the public registry record page, policy record, and update
            cycle for your organization.
          </p>
        </header>

        <section style={layoutStyle}>
          <form action={action} style={cardStyle}>
            <div style={lockedFieldsStyle}>
              <label style={labelStyle}>
                Organization
                <input readOnly style={inputStyle} value={organizationName} />
              </label>

              <label style={labelStyle}>
                Account Email
                <input readOnly style={inputStyle} value={contactEmail} />
              </label>
            </div>

            <IndustrySelect
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              onChange={handleIndustryChange}
              required={false}
              value={industry}
            />

            {plan === "operational" && (
              <input
                name="employees"
                type="hidden"
                value={employeeCount ?? DEFAULT_OPERATIONAL_EMPLOYEE_COUNT}
              />
            )}

            <div style={staticFieldStyle}>
              <span style={staticLabelStyle}>Annual Package</span>
              <strong>Public registry record, policies, and updates</strong>
            </div>

            {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

            <SubmitButton plan={plan} />
          </form>

          <aside style={summaryStyle}>
            <p style={sectionLabelStyle}>Selected Package</p>
            <h2 style={sectionTitleStyle}>
              {getPaladinPlanName(selectedPriceItem)}
            </h2>
            <p style={priceStyle}>
              {formatPaladinPrice(selectedPriceItem)}
            </p>
            <p style={mutedStyle}>Billed annually</p>
            <div style={dividerStyle} />
            <p style={mutedStyle}>
              Continuing saves this package and opens hosted Stripe Checkout.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SubmitButton({ plan }: { plan: PlanKey }) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} style={buttonStyle} type="submit">
      {pending ? "Opening Checkout..." : `Continue with ${planLabel(plan)}`}
    </button>
  );
}

function planLabel(plan: PlanKey) {
  return plan === "starter" ? "Starter" : "Operational";
}

const pageStyle: CSSProperties = {
  background: "#f6f8fb",
  color: "#102033",
  padding: "clamp(20px, 4vw, 32px)",
};

const containerStyle: CSSProperties = {
  margin: "0 auto",
  maxWidth: 1100,
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
  fontSize: "clamp(32px, 5vw, 40px)",
  marginTop: 8,
};

const subheadStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 18,
  marginTop: 12,
  maxWidth: 620,
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gap: 24,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  display: "grid",
  gap: 18,
  padding: 28,
};

const summaryStyle: CSSProperties = {
  ...cardStyle,
  alignSelf: "start",
};

const lockedFieldsStyle: CSSProperties = {
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

const buttonStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e3a8a, #2563eb)",
  border: "1px solid rgba(198, 168, 91, 0.46)",
  borderRadius: 8,
  boxShadow: "0 12px 26px rgba(37, 99, 235, 0.22)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 900,
  padding: "14px",
};

const staticFieldStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  color: "#102033",
  display: "grid",
  gap: 4,
  padding: "12px 14px",
};

const staticLabelStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
};

const errorStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  color: "#991b1b",
  padding: 16,
};

const sectionLabelStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
};

const priceStyle: CSSProperties = {
  fontSize: 38,
  fontWeight: 900,
  lineHeight: 1,
  marginTop: 10,
};

const mutedStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 15,
  lineHeight: 1.5,
  marginTop: 10,
};

const dividerStyle: CSSProperties = {
  background: "#e5e7eb",
  height: 1,
  margin: "20px 0",
};
