type ClassValue = string | number | null | boolean | undefined | ClassValue[];

function flatten(input: ClassValue, out: string[]) {
  if (!input && input !== 0) return;
  if (typeof input === "string" || typeof input === "number") {
    out.push(String(input));
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) flatten(item, out);
  }
}

/** Joins class names, skipping falsy values. Accepts nested arrays. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  flatten(inputs, out);
  return out.join(" ");
}
