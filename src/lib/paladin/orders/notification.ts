// Fulfillment alert for the business owner. Binder orders are fulfilled by hand
// (print and mail), and Stripe is the only order record, so each paid binder or
// Starter checkout sends the owner one plain-text message with what to ship.
// Pure: builds the message from a minimal Stripe Checkout Session shape.

export type OrderSessionShape = {
  id: string;
  mode?: string | null;
  livemode?: boolean;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      address?: {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
      } | null;
    } | null;
  } | null;
  metadata?: Record<string, string> | null;
};

function oneLine(value: string | null | undefined) {
  return (value ?? "").replace(/[\r\n]+/g, " ").trim();
}

export function isFulfillableOrder(session: OrderSessionShape) {
  const family = session.metadata?.product_family;
  const key = session.metadata?.catalog_key;

  if (session.payment_status === "unpaid") {
    return false;
  }

  return (
    (session.mode === "payment" && family === "binder") ||
    (session.mode === "subscription" && key === "starter")
  );
}

export function buildOrderNotificationEmail(session: OrderSessionShape) {
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;
  const amount =
    typeof session.amount_total === "number"
      ? `${(session.amount_total / 100).toFixed(2)} ${(session.currency ?? "usd").toUpperCase()}`
      : "unknown";
  const quantity = session.metadata?.binder_quantity ?? "1";
  const item =
    session.metadata?.plan_name || session.metadata?.catalog_key || "Paladin order";
  const dashboard = `https://dashboard.stripe.com/${session.livemode ? "" : "test/"}payments`;
  const lines = [
    "A Paladin Compliance order needs fulfillment (print and mail the binder).",
    "",
    `Item: ${oneLine(item)}`,
    `Quantity of printed binders: ${oneLine(quantity)}`,
    `Amount paid: ${amount}`,
    `Mode: ${session.livemode ? "LIVE" : "TEST"}`,
    `Customer: ${oneLine(session.customer_details?.name)} <${oneLine(session.customer_details?.email)}>`,
    "",
    "Ship to:",
    `  ${oneLine(shipping?.name)}`,
    `  ${oneLine(address?.line1)}`,
    ...(address?.line2 ? [`  ${oneLine(address.line2)}`] : []),
    `  ${oneLine(address?.city)}, ${oneLine(address?.state)} ${oneLine(address?.postal_code)}`,
    `  ${oneLine(address?.country)}`,
    "",
    `Stripe session: ${session.id}`,
    `Stripe payments: ${dashboard}`,
    "",
    "This alert is sent once per checkout. Mark the order shipped in your own tracking; the app does not store orders.",
  ];

  return {
    subject: `[Paladin order] ${oneLine(item)} x${oneLine(quantity)} (${session.livemode ? "live" : "test"})`,
    text: lines.join("\n"),
  };
}
