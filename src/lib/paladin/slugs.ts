const MAX_SLUG_LENGTH = 64;

export function createSlugFromOrganizationName(value: string) {
  return normalizeOrganizationSlug(value);
}

export function normalizeOrganizationSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

export function appendNumericSlugSuffix(baseSlug: string, suffix: number) {
  if (suffix <= 1) {
    return baseSlug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
  }

  const suffixText = `-${suffix}`;
  const baseLength = MAX_SLUG_LENGTH - suffixText.length;
  const safeBase = baseSlug.slice(0, baseLength).replace(/-+$/g, "");

  return `${safeBase}${suffixText}`;
}

export function isValidOrganizationSlug(value: string) {
  return (
    value.length >= 3 &&
    value.length <= MAX_SLUG_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}
