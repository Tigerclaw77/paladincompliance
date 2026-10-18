"use client";

import { type CSSProperties, type ReactNode } from "react";
import { DISCLAIMER_SHORT, SUPPORTS_NOT_REPLACES } from "@/lib/paladin/copy";
import {
  formatPaladinPrice,
  getCoveragePriceKey,
  getPaladinPriceItem,
} from "@/lib/paladin/pricing";

type PricingClientProps = {
  checkoutCanceled: boolean;
  supportEmail: string;
};

const sharedIncludes = [
  "Initial physical AI Policy & Evidence Binder",
  "Public registry record page",
  "QR registry lookup",
  "Annual binder revision with email notice and revision log",
  "Compliance calendar in your dashboard, with a downloadable .ics file and reminder emails (unsubscribe any time)",
  "Renewal reminder email about 30 days before renewal",
  "Three short AI use training modules with dated acknowledgment records (CSV export)",
  "Quarterly AI tool inventory and semiannual vendor review checklists with dated records",
  "Annual AI spend summary (CSV and printable)",
  "Email support, answered on business days on a best-effort basis (no guaranteed response time)",
];

const starterFeatures = [
  "Single operating footprint",
  "Standard binder presentation",
  "Digital quick-reference record (13-page PDF) in your workspace",
];

const operationalFeatures = [
  "Sized by organization range",
  "For organizations with broader coordination needs",
  "Everything in Starter, sized by organization range",
  "Scope and price confirmed in writing before purchase",
];

const enterpriseFeatures = [
  "Multi-location coordination",
  "Scope, deliverables and pricing confirmed in writing before purchase",
];

export default function PricingClient({
  checkoutCanceled,
  supportEmail,
}: PricingClientProps) {
  const starterItem = getPaladinPriceItem(
    getCoveragePriceKey({
      plan: "starter",
    })
  );
  const publicBinderItem = getPaladinPriceItem("complianceBinder");
  const additionalBinderItem = getPaladinPriceItem("additionalBinder");

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <p style={eyebrowStyle}>AI Policy &amp; Evidence Binder</p>
          <h1 style={titleStyle}>Keep your AI policy and records in one binder.</h1>
          <p style={subheadStyle}>
            For insurance renewals, client security questionnaires, and board or
            budget records. Includes a documented record of what your
            organization spends on AI compliance resources each year, so you
            can say &ldquo;we spent $X on AI compliance this year.&rdquo;
          </p>
          <p style={disclaimerStyle}>
            {DISCLAIMER_SHORT} {SUPPORTS_NOT_REPLACES}
          </p>
        </header>

        {checkoutCanceled && (
          <section style={noticeStyle}>
            Checkout was canceled. No billing record was changed.
          </section>
        )}

        <section style={proofStyle} aria-label="What the binder is used for">
          <div>
            <p style={smallLabelStyle}>Where it gets used</p>
            <h2 style={sectionTitleStyle}>
              Documentation you can hand to the people who ask
            </h2>
          </div>
          <ul style={proofListStyle}>
            <li>
              Insurance renewals and client security questionnaires: one
              organized set of your AI use policy sections and annual spend
              record to attach or reference.
            </li>
            <li>
              Board and budget records: a documented record of what the
              organization spends on AI compliance resources each year. It is
              a documented gesture that supports, and does not replace,
              responsible AI use.
            </li>
            <li>
              A public registry record showing this binder was issued to your
              organization, with a QR code on the binder. Paladin issues the
              record; it is not a third-party review.
              {" "}
              <a href="/sample">See sample contents</a>.
            </li>
          </ul>
        </section>

        <section style={includedStyle} aria-label="Included with every plan">
          <p style={includedIntroStyle}>Every membership includes</p>
          <div style={includedPillsStyle}>
            {sharedIncludes.map((item) => (
              <span key={item} style={includedPillStyle}>
                {item}
              </span>
            ))}
          </div>
          <a href="/whats-included" style={includedLinkStyle}>
            What&apos;s included and how the binder works
          </a>
        </section>

        <section style={tierGridStyle}>
          <PricingCard
            controls={
              <div style={scopeStaticStyle}>
                <span style={scopeStaticLabelStyle}>Organization scope</span>
                <strong>1-25 staff</strong>
              </div>
            }
            ctaHref={createStartHref({
              basePath: "/start/starter",
                    })}
            ctaLabel={`Buy Starter — ${formatAnnualPrice(starterItem.amountCents).replace("/year", "/yr")}`}
            description="For independent practices, small offices, and teams up to 25 staff."
            features={starterFeatures}
            footnote="Initial physical binder included with new memberships. Secure Stripe checkout. No account needed to purchase; you create your account after payment."
            price={formatAnnualPrice(starterItem.amountCents)}
            title="Starter"
          />

          <PricingCard
            ctaHref="/start/enterprise?reason=operational"
            ctaLabel="Contact Us"
            description="For organizations with 26-250 staff where coordination, public exposure, and internal consistency carry more weight."
            features={operationalFeatures}
            footnote="Operational is arranged by email for now: we confirm scope and price in writing before you pay."
            price="Contact us"
            title="Operational"
            variant="operational"
          />

          <EnterprisePricingCard />
        </section>

        <section id="binder" style={binderNoteStyle}>
          <div>
            <p style={smallLabelStyle}>Physical records</p>
            <h2 style={sectionTitleStyle}>
              AI Policy &amp; Evidence Binder — {formatOneTimePrice(publicBinderItem.amountCents)}
            </h2>
            <p style={binderPriceStyle}>One-time purchase</p>
          </div>
          <p style={sectionCopyStyle}>
            {formatOneTimePrice(publicBinderItem.amountCents)} for organizations
            without a subscription: no membership or account required. Ships to
            U.S. addresses. The initial binder is included with new
            memberships. Subscribers can order additional binders for{" "}
            {formatOneTimePrice(additionalBinderItem.amountCents)} each, useful
            when more than one office, partner, or board member needs a copy.
            Order from your dashboard or contact{" "}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
          <a href="/order" style={binderOrderLinkStyle}>
            Order the binder —{" "}
            {formatPaladinPrice(publicBinderItem)}
          </a>
        </section>

        <section style={foundingStyle}>
          <div>
            <p style={foundingEyebrowStyle}>Founding Member Program</p>
            <h2 style={foundingTitleStyle}>Charter Organization Program</h2>
            <p style={foundingCopyStyle}>
              A custom, case-by-case arrangement for organizations with
              requirements beyond the standard plans. Not self-serve.
            </p>
          </div>
          <ul style={foundingListStyle}>
            <li>Custom engagement: nothing is included by default</li>
            <li>Scope and deliverables are agreed in writing before purchase</li>
          </ul>
          <div style={foundingActionStyle}>
            <span style={foundingMetaStyle}>Custom engagement</span>
            <a href="/contact" style={secondaryCtaStyle}>
              Contact us
            </a>
          </div>
        </section>

        <p style={noteStyle}>
          The registry record stays active while the annual membership is current.
          Questions? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>
      </div>
    </main>
  );
}

function EnterprisePricingCard() {
  return (
    <div style={enterpriseCardStyle}>
      <div style={noiseLayerStyle} />
      <div style={lightLayerStyle} />
      <div style={goldTopLineStyle} />

      <div style={enterpriseInnerStyle}>
        <div style={tierTopStyle}>
          <p style={enterpriseEyebrowStyle}>Enterprise</p>
          <h2 style={enterpriseTitleStyle}>Enterprise</h2>
          <p style={enterpriseDescStyle}>
            For 250+ staff, multi-location deployments, procurement needs, or
            custom rollout coordination.
          </p>
        </div>

        <div style={priceBlockStyle}>
          <p style={enterprisePriceStyle}>Custom Pricing</p>
          <p style={enterpriseBillingStyle}>
            Priced by organizational scope.
          </p>
        </div>

        <ul style={enterpriseListStyle}>
          {enterpriseFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <div style={cardFooterStyle}>
          <a href="/start/enterprise" style={enterpriseCtaStyle}>
            Contact Sales
          </a>
          <a href="/whats-included" style={enterpriseIncludedLinkStyle}>
            What&apos;s included
          </a>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  controls,
  ctaHref,
  ctaLabel,
  description,
  features,
  footnote,
  price,
  title,
  variant = "standard",
}: {
  controls?: ReactNode;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  features: string[];
  footnote: string;
  price: string;
  title: string;
  variant?: "operational" | "standard";
}) {
  return (
    <div style={variant === "operational" ? operationalCardStyle : cardStyle}>
      <div style={tierTopStyle}>
        <h3 style={tierTitleStyle}>{title}</h3>
        <p style={tierDescStyle}>{description}</p>
      </div>

      <div style={priceBlockStyle}>
        <p style={priceStyle}>{price}</p>
        <p style={billingStyle}>Billed annually</p>
      </div>

      <div style={controlSlotStyle}>{controls}</div>

      <ul style={listStyle}>
        {features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true" style={checkStyle}>
              +
            </span>{" "}
            {feature}
          </li>
        ))}
      </ul>

      <div style={cardFooterStyle}>
        <p style={cardFootnoteStyle}>{footnote}</p>
        <a href={ctaHref} style={primaryCtaStyle}>
          {ctaLabel}
        </a>
        <a href="/whats-included" style={cardIncludedLinkStyle}>
          What&apos;s included
        </a>
      </div>
    </div>
  );
}

function createStartHref({
  basePath,
  employeeCount,
}: {
  basePath: string;
  employeeCount?: number | null;
}) {
  const params = new URLSearchParams();

  if (employeeCount) {
    params.set("employees", String(employeeCount));
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

function formatAnnualPrice(amountCents: number) {
  return `${formatCurrency(amountCents)}/year`;
}

function formatOneTimePrice(amountCents: number) {
  return formatCurrency(amountCents);
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(amountCents / 100);
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
  marginBottom: 28,
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(34px, 5vw, 44px)",
  lineHeight: 1.05,
  marginTop: 8,
  maxWidth: 760,
};

const eyebrowStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: "uppercase",
};

const subheadStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 18,
  lineHeight: 1.5,
  marginTop: 14,
  maxWidth: 650,
};

const noticeStyle: CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  color: "#1e3a8a",
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 18,
  padding: 16,
};

const includedStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d8e1ec",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
  marginBottom: 16,
  padding: 18,
};

const includedIntroStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1,
  marginBottom: 12,
  textTransform: "uppercase",
};

const includedPillsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const includedPillStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dbe3ef",
  borderRadius: 999,
  color: "#102033",
  fontSize: 13,
  fontWeight: 800,
  padding: "8px 11px",
};

const includedLinkStyle: CSSProperties = {
  color: "#1d4ed8",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 900,
  marginTop: 14,
  textDecoration: "none",
};

const tierGridStyle: CSSProperties = {
  alignItems: "stretch",
  display: "grid",
  gap: 20,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: 28,
};

const operationalCardStyle: CSSProperties = {
  ...cardStyle,
  border: "1px solid #bfdbfe",
  boxShadow: "0 12px 34px rgba(37, 99, 235, 0.12)",
};

const tierTopStyle: CSSProperties = {
  minHeight: 150,
};

const tierTitleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  margin: 0,
};

const tierDescStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 15,
  lineHeight: 1.55,
  marginTop: 12,
};

const priceBlockStyle: CSSProperties = {
  minHeight: 86,
};

const priceStyle: CSSProperties = {
  color: "#102033",
  fontSize: "clamp(30px, 4vw, 38px)",
  fontWeight: 900,
  lineHeight: 1.05,
  margin: 0,
};

const billingStyle: CSSProperties = {
  color: "#102033",
  fontSize: 13,
  fontWeight: 800,
  marginTop: 8,
};

const controlSlotStyle: CSSProperties = {
  minHeight: 78,
};

const scopeStaticStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  color: "#102033",
  display: "grid",
  gap: 4,
  padding: "12px 14px",
};

const scopeStaticLabelStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  listStyle: "none",
  marginBottom: 16,
  marginTop: 0,
  minHeight: 108,
  paddingLeft: 0,
};

const checkStyle: CSSProperties = {
  color: "#16a34a",
  fontWeight: 900,
};

const cardFootnoteStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  lineHeight: 1.45,
  margin: 0,
  minHeight: 40,
};

const cardIncludedLinkStyle: CSSProperties = {
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 900,
  textAlign: "center",
  textDecoration: "none",
};

const cardFooterStyle: CSSProperties = {
  display: "grid",
  gap: 18,
  marginTop: "auto",
};

const primaryCtaStyle: CSSProperties = {
  alignItems: "center",
  background: "linear-gradient(145deg, #1e3a8a, #2563eb)",
  border: "1px solid rgba(198, 168, 91, 0.46)",
  borderRadius: 8,
  boxShadow: "0 12px 26px rgba(37, 99, 235, 0.22)",
  color: "#ffffff",
  display: "flex",
  fontSize: 15,
  fontWeight: 900,
  justifyContent: "center",
  padding: "14px",
  textDecoration: "none",
};

const enterpriseCardStyle: CSSProperties = {
  background: `
    linear-gradient(135deg, rgba(11,18,32,0.96), rgba(30,41,59,0.96)),
    url('/textures/slate-dark.png')
  `,
  backgroundBlendMode: "soft-light",
  backgroundSize: "cover",
  border: "1px solid rgba(212,175,55,0.75)",
  borderRadius: 18,
  boxSizing: "border-box",
  boxShadow: `
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.7),
    0 0 0 1px rgba(255,215,120,0.35),
    0 16px 34px rgba(0,0,0,0.35)
  `,
  color: "#e5e7eb",
  height: "100%",
  overflow: "hidden",
  padding: 28,
  position: "relative",
};

const enterpriseInnerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  position: "relative",
};

const goldTopLineStyle: CSSProperties = {
  background: `
    linear-gradient(
      90deg,
      transparent,
      rgba(255,215,120,0.9),
      rgba(212,175,55,0.9),
      rgba(255,215,120,0.9),
      transparent
    )
  `,
  height: 3,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
};

const noiseLayerStyle: CSSProperties = {
  backgroundImage: `
    radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
    radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)
  `,
  backgroundSize: "4px 4px",
  inset: 0,
  mixBlendMode: "overlay",
  opacity: 0.3,
  pointerEvents: "none",
  position: "absolute",
};

const lightLayerStyle: CSSProperties = {
  background: `
    linear-gradient(120deg, rgba(255,255,255,0.06), transparent 40%),
    linear-gradient(300deg, rgba(0,0,0,0.4), transparent 60%)
  `,
  inset: 0,
  pointerEvents: "none",
  position: "absolute",
};

const enterpriseEyebrowStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.1,
  margin: 0,
  textTransform: "uppercase",
};

const enterpriseTitleStyle: CSSProperties = {
  color: "#f9fafb",
  fontSize: 34,
  fontWeight: 900,
  margin: "18px 0 0",
};

const enterpriseDescStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 15,
  lineHeight: 1.55,
  marginTop: 12,
};

const enterprisePriceStyle: CSSProperties = {
  color: "#f9fafb",
  fontSize: "clamp(30px, 4vw, 38px)",
  fontWeight: 900,
  lineHeight: 1.05,
  margin: 0,
};

const enterpriseBillingStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.4,
  marginTop: 8,
};

const enterpriseListStyle: CSSProperties = {
  color: "#f8fafc",
  display: "grid",
  gap: 10,
  marginBottom: 16,
  marginTop: 0,
  minHeight: 108,
  paddingLeft: 18,
};

const enterpriseCtaStyle: CSSProperties = {
  ...primaryCtaStyle,
  background: "linear-gradient(145deg, #c6a85b, #e7d39f)",
  boxShadow: "0 12px 28px rgba(198, 168, 91, 0.18)",
  color: "#0f172a",
};

const enterpriseIncludedLinkStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 13,
  fontWeight: 900,
  textAlign: "center",
  textDecoration: "none",
};

const disclaimerStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 10,
  maxWidth: 620,
};

const proofStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d8e1ec",
  borderRadius: 12,
  display: "grid",
  gap: 14,
  marginBottom: 22,
  padding: 22,
};

const proofListStyle: CSSProperties = {
  color: "#334a63",
  display: "grid",
  fontSize: 15,
  gap: 8,
  lineHeight: 1.5,
  paddingLeft: 20,
};

const binderPriceStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 14,
  fontWeight: 700,
  marginTop: 6,
};

const binderNoteStyle: CSSProperties = {
  alignItems: "center",
  background: "#ffffff",
  border: "1px solid #d8e1ec",
  borderRadius: 12,
  display: "grid",
  gap: 18,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  marginTop: 22,
  padding: 22,
};

const binderOrderLinkStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e3a8a, #2563eb)",
  border: "1px solid rgba(198, 168, 91, 0.46)",
  borderRadius: 8,
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 900,
  justifySelf: "start",
  padding: "12px 14px",
  textDecoration: "none",
};

const smallLabelStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const sectionTitleStyle: CSSProperties = {
  color: "#102033",
  fontSize: 24,
  fontWeight: 900,
  marginTop: 4,
};

const sectionCopyStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 15,
  lineHeight: 1.55,
};

const foundingStyle: CSSProperties = {
  alignItems: "center",
  background: "#111827",
  border: "1px solid rgba(212, 175, 55, 0.42)",
  borderRadius: 14,
  color: "#f8fafc",
  display: "grid",
  gap: 22,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  marginTop: 22,
  padding: 24,
};

const foundingEyebrowStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const foundingTitleStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: 25,
  fontWeight: 900,
  marginTop: 4,
};

const foundingCopyStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 15,
  lineHeight: 1.55,
  marginTop: 8,
};

const foundingListStyle: CSSProperties = {
  color: "#e5e7eb",
  display: "grid",
  gap: 7,
  fontSize: 14,
  fontWeight: 700,
  margin: 0,
  paddingLeft: 18,
};

const foundingActionStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
};

const foundingMetaStyle: CSSProperties = {
  color: "#e7d39f",
  fontSize: 13,
  fontWeight: 900,
};

const secondaryCtaStyle: CSSProperties = {
  alignItems: "center",
  background: "#ffffff",
  borderRadius: 8,
  color: "#0f172a",
  display: "inline-flex",
  fontSize: 14,
  fontWeight: 900,
  justifyContent: "center",
  padding: "12px 16px",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const noteStyle: CSSProperties = {
  color: "#5b7087",
  fontSize: 15,
  marginTop: 30,
};
