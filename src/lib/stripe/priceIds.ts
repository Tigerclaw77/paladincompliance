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
    priceId: "price_1TYtALQp2qjjaF5trwYIV8bU",
    productId: "prod_UTtnsWBZgxRpmH",
  },
  additionalBinderHipaa: {
    priceId: "price_1TYtA7Qp2qjjaF5tshVyoAnm",
    productId: "prod_UTtnMAWvKS6chl",
  },
  complianceBinder: {
    priceId: "price_1TYtABQp2qjjaF5tj0wtKD6F",
    productId: "prod_UTtkfp4tyuAzWE",
  },
  complianceBinderHipaa: {
    priceId: "price_1TYtAHQp2qjjaF5tCIrHsIms",
    productId: "prod_UTtl77jPUWvIXw",
  },
  starter: {
    priceId: "price_1TYtAPQp2qjjaF5tkd2fNiEI",
    productId: "prod_UTtNC0tCOgtnbH",
  },
  starterHipaa: {
    priceId: "price_1TYtALQp2qjjaF5tDh6EN7uQ",
    productId: "prod_UTtbLO7yjhJXr1",
  },
  operational101To250: {
    priceId: "price_1TYtAQQp2qjjaF5tY9R8ZWVH",
    productId: "prod_UXxH0gQaUIi5yE",
  },
  operational101To250Hipaa: {
    priceId: "price_1TYtALQp2qjjaF5tPSbhRJB6",
    productId: "prod_UXxH4z5o8qUcS0",
  },
  operational26To50: {
    priceId: "price_1TYtAAQp2qjjaF5tlVMEDVpC",
    productId: "prod_UXIoaNbKXQztbj",
  },
  operational26To50Hipaa: {
    priceId: "price_1TYtAKQp2qjjaF5tc8np0ONd",
    productId: "prod_UXIoUDXkgnEOiS",
  },
  operational51To100: {
    priceId: "price_1TYtACQp2qjjaF5tOJBU4WwF",
    productId: "prod_UXxHw814UOiXX4",
  },
  operational51To100Hipaa: {
    priceId: "price_1TYtALQp2qjjaF5tRXuJ4SgQ",
    productId: "prod_UXxHnokxPOvmsb",
  },
} as const satisfies Record<PaladinPriceKey, StripePriceMapping>;
