import type { PaladinPriceItem } from "@/lib/paladin/pricing";
import type { StripePriceMapping } from "@/lib/stripe/priceIds";

export type StripeCatalogItem = PaladinPriceItem & StripePriceMapping;
