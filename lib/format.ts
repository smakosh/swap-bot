const EXTRA_DIGITS = 5;

export function calcDigits(value: number, extraDigits = EXTRA_DIGITS): number {
  const v = Math.abs(value);
  let digits = 2;
  if (value === 0) {
    return digits;
  }
  if (v < 10 && v !== 0) {
    digits = -Math.floor(Math.log(v) / Math.log(10) + 1) + extraDigits;
  } else if (value < 100) {
    digits = 4;
  }
  return Math.min(digits, 20);
}

export function formatPrice(v?: number, prefix = '$', suffix = ''): string {
  if (v && v < 0.01) return `<${prefix}0.01`;
  const f = (v || 0).toLocaleString('en', {
    minimumFractionDigits: calcDigits(v ?? 0),
  });
  return `${prefix}${f} ${suffix}`;
}

export function formatPercentage(value?: number): string {
  const v = (value ?? 0) * 100;
  const extraDigits = 2;
  const digits = !v
    ? 0
    : Math.max(
        0,
        -Math.floor(Math.log(v ?? 0) / Math.log(10) + 1) + extraDigits
      );
  return (
    v.toLocaleString('en', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits + 2,
    }) + '%'
  );
}
