const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase36(n: number): string {
  if (n === 0) return "0";
  let result = "";
  while (n > 0) {
    result = ALPHABET[n % 36] + result;
    n = Math.floor(n / 36);
  }
  return result;
}

/**
 * D001, D002, ..., D999 → DA00... (base36)
 */
export function generateNextId(currentCount: number): string {
  const next = currentCount + 1;
  if (next <= 999) {
    return `D${String(next).padStart(3, "0")}`;
  }
  const encoded = encodeBase36(next).padStart(4, "0");
  return `D${encoded}`;
}

/**
 * C001, C002, ..., C999 → CA00... (base36)
 */
export function generateNextChangeId(currentCount: number): string {
  const next = currentCount + 1;
  if (next <= 999) {
    return `C${String(next).padStart(3, "0")}`;
  }
  const encoded = encodeBase36(next).padStart(4, "0");
  return `C${encoded}`;
}

/**
 * ID'den sayısal değeri çıkarır (sıralama için)
 */
export function idToNumber(id: string): number {
  const suffix = id.slice(1);
  const decimal = parseInt(suffix, 10);
  if (!isNaN(decimal)) return decimal;
  return parseInt(suffix, 36);
}
