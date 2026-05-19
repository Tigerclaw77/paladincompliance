import Link from "next/link";
import type { CSSProperties } from "react";

export default function SubscribeSuccessPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Coverage Started</p>
        <h1 style={titleStyle}>Checkout Complete</h1>
        <p style={bodyStyle}>
          Your Paladin checkout was completed. Coverage status will update in
          the dashboard after Stripe confirms the subscription event.
        </p>
        <Link href="/dashboard" style={linkStyle}>
          Go to Dashboard
        </Link>
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
  color: "#1e3a8a",
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

const linkStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e2a3a, #0f172a)",
  border: "1px solid rgba(198, 168, 91, 0.38)",
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontWeight: 900,
  marginTop: 24,
  padding: "13px 16px",
  textDecoration: "none",
};
