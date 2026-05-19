import type { PaladinPriceKey } from "@/lib/paladin/pricing";

export type StripePriceMapping = {
  priceId: string;
  productId: string;
};

// Generated from Paladin app-owned pricing. Regenerate missing Stripe TEST IDs with `npm run stripe:create-missing -- --write`.
// Stripe remains the payment processor; pricing and plan logic live in src/lib/paladin/pricing.ts.
// Blank mappings mean the app-owned price exists but the matching Stripe Price ID has not been supplied yet.
export const STRIPE_PRICE_IDS = {
  additionalBinder: {
    priceId: "price_1TUvzXJWAlqh6e3YYs77LtdY",
    productId: "prod_UTtnsWBZgxRpmH",
  },
  additionalBinderHipaa: {
    priceId: "price_1TUw00JWAlqh6e3YjBIWM85P",
    productId: "prod_UTtnMAWvKS6chl",
  },
  complianceBinder: {
    priceId: "price_1TUvxIJWAlqh6e3Y8VodUnKK",
    productId: "prod_UTtkfp4tyuAzWE",
  },
  complianceBinderHipaa: {
    priceId: "price_1TUvxrJWAlqh6e3YnVn3EEyF",
    productId: "prod_UTtl77jPUWvIXw",
  },
  starter: {
    priceId: "price_1TUvb7JWAlqh6e3YDjnXfEsg",
    productId: "prod_UTtNC0tCOgtnbH",
  },
  starterHipaa: {
    priceId: "price_1TUvogJWAlqh6e3YqdWjNkZ0",
    productId: "prod_UTtbLO7yjhJXr1",
  },
  operational101To250: {
    priceId: "price_1TYrNOJWAlqh6e3Y1KSxnLX4",
    productId: "prod_UXxH0gQaUIi5yE",
  },
  operational101To250Hipaa: {
    priceId: "price_1TYrNPJWAlqh6e3YZe9K8cNg",
    productId: "prod_UXxH4z5o8qUcS0",
  },
  operational26To50: {
    priceId: "price_1TYECqJWAlqh6e3Y6tgfuNSq",
    productId: "prod_UXIoaNbKXQztbj",
  },
  operational26To50Hipaa: {
    priceId: "price_1TYECqJWAlqh6e3YdaSBaX0H",
    productId: "prod_UXIoUDXkgnEOiS",
  },
  operational51To100: {
    priceId: "price_1TYrNPJWAlqh6e3YfXeeVd2u",
    productId: "prod_UXxHw814UOiXX4",
  },
  operational51To100Hipaa: {
    priceId: "price_1TYrNPJWAlqh6e3Y97RyVy2X",
    productId: "prod_UXxHnokxPOvmsb",
  },
} as const satisfies Record<PaladinPriceKey, StripePriceMapping>;
