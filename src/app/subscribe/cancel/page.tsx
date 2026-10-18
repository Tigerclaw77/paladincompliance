import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubscribeCancelPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Checkout Canceled</p>
        <h1 style={titleStyle}>Subscription Not Started</h1>
        <p style={bodyStyle}>
          No billing record was created. You can return to pricing or continue
          setting up your Paladin account.
        </p>
        <div style={actionsStyle}>
          <Link href="/pricing" style={primaryLinkStyle}>
            View Pricing
          </Link>
          <Link href="/dashboard" style={secondaryLinkStyle}>
            Go to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  alignItems: "center",
  background: "#f6f8fb",
  color: "#102033",
  display: "flex",
  justifyContent: "center",
  minHeight: "70vh",
  padding: 32,
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 18px 38px rgba(15, 23, 42, 0.08)",
  maxWidth: 620,
  padding: 32,
};

const eyebrowStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontSize: 38,
  fontWeight: 900,
  marginTop: 8,
};

const bodyStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 17,
  lineHeight: 1.6,
  marginTop: 14,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 24,
};

const primaryLinkStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e2a3a, #0f172a)",
  border: "1px solid rgba(198, 168, 91, 0.38)",
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontWeight: 900,
  padding: "13px 16px",
  textDecoration: "none",
};

const secondaryLinkStyle: CSSProperties = {
  ...primaryLinkStyle,
  background: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#102033",
};
