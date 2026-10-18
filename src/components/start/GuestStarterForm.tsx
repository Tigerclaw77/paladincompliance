"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import IndustrySelect from "@/components/start/IndustrySelect";
import { formatPaladinPrice, getPaladinPriceItem } from "@/lib/paladin/pricing";

type GuestStarterFormProps = {
  canceled?: boolean;
  initialHipaaEnabled?: boolean;
  supportEmail: string;
};

export default function GuestStarterForm({
  canceled = false,
  initialHipaaEnabled = false,
  supportEmail,
}: GuestStarterFormProps) {
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState(
    initialHipaaEnabled ? "Healthcare" : ""
  );
  const [hipaaEnabled, setHipaaEnabled] = useState(initialHipaaEnabled);
  const [staffAttestation, setStaffAttestation] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const withHipaa = industry === "Healthcare" && hipaaEnabled;
  const priceItem = getPaladinPriceItem(withHipaa ? "starterHipaa" : "starter");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        body: JSON.stringify({
          email,
          hipaaEnabled: withHipaa,
          industry,
          organizationName,
          priceKey: "starter",
          staffAttestation,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        url?: string;
      } | null;

      if (!response.ok || !data?.url) {
        setError(
          data?.error ??
            `Checkout is unavailable right now. Please try again or contact ${supportEmail}.`
        );
        setPending(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError(
        `Checkout is unavailable right now. Please try again or contact ${supportEmail}.`
      );
      setPending(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={{ marginBottom: 32 }}>
          <p style={eyebrowStyle}>Starter</p>
          <h1 style={titleStyle}>Buy Starter — {formatPaladinPrice(priceItem)}</h1>
          <p style={subheadStyle}>
            No account needed to purchase. Pay securely with Stripe; your
            organization workspace is created after payment and you sign in with
            the email you enter here.
          </p>
        </header>

        <section style={layoutStyle}>
          <form onSubmit={handleSubmit} style={cardStyle}>
            {canceled && (
              <div style={noticeStyle}>Checkout was canceled. No payment was made.</div>
            )}

            <label style={labelStyle}>
              Organization name
              <input
                autoComplete="organization"
                maxLength={96}
                minLength={2}
                onChange={(event) => setOrganizationName(event.target.value)}
                required
                style={inputStyle}
                value={organizationName}
              />
            </label>

            <label style={labelStyle}>
              Account email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                style={inputStyle}
                type="email"
                value={email}
              />
            </label>

            <IndustrySelect
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              onChange={setIndustry}
              required={false}
              value={industry}
            />

            {industry === "Healthcare" && (
              <label style={checkboxLabelStyle}>
                <input
                  checked={hipaaEnabled}
                  onChange={(event) => setHipaaEnabled(event.target.checked)}
                  type="checkbox"
                />
                Add the optional HIPAA-oriented policy materials
              </label>
            )}

            <label style={checkboxLabelStyle}>
              <input
                checked={staffAttestation}
                onChange={(event) => setStaffAttestation(event.target.checked)}
                required
                type="checkbox"
              />
              My organization has 1-25 staff.
            </label>

            {error && <div style={errorStyle}>{error}</div>}

            <button disabled={pending} style={buttonStyle} type="submit">
              {pending ? "Opening Checkout..." : "Continue to secure checkout"}
            </button>
          </form>

          <aside style={cardStyle}>
            <p style={eyebrowStyle}>Selected package</p>
            <h2 style={{ fontSize: 22, fontWeight: 900 }}>
              {withHipaa ? "Starter + Optional HIPAA Add-On" : "Starter"}
            </h2>
            <p style={priceStyle}>{formatPaladinPrice(priceItem)}</p>
            <p style={mutedStyle}>Billed annually. U.S. shipping address collected at checkout for the initial binder.</p>
            <p style={mutedStyle}>
              Operational governance reference materials. Not legal advice and
              not a HIPAA, TRAIGA, or other regulatory certification. Questions:{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  background: "#f6f8fb",
  color: "#102033",
  padding: "clamp(20px, 4vw, 32px)",
};
const containerStyle: CSSProperties = { margin: "0 auto", maxWidth: 1100 };
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
  alignSelf: "start",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  display: "grid",
  gap: 18,
  padding: 28,
};
const labelStyle: CSSProperties = {
  color: "#102033",
  display: "grid",
  fontSize: 14,
  fontWeight: 700,
  gap: 8,
};
const checkboxLabelStyle: CSSProperties = {
  alignItems: "center",
  color: "#102033",
  display: "flex",
  fontSize: 14,
  fontWeight: 600,
  gap: 10,
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
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 900,
  padding: "14px",
};
const errorStyle: CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  color: "#991b1b",
  padding: 16,
};
const noticeStyle: CSSProperties = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
  color: "#92400e",
  padding: 16,
};
const priceStyle: CSSProperties = { fontSize: 38, fontWeight: 900, lineHeight: 1 };
const mutedStyle: CSSProperties = { color: "#5b7087", fontSize: 15, lineHeight: 1.5 };
