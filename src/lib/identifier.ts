// src/lib/identifier.ts — works in browser and server
//
// Pure helpers. No imports from "next/headers", "fs", "prisma", or anything
// Node-only. That's the rule for "isomorphic" modules.

export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[^\d+]/g, "");
  let candidate: string;
  if (cleaned.startsWith("+62")) candidate = cleaned;
  else if (cleaned.startsWith("62")) candidate = "+" + cleaned;
  else if (cleaned.startsWith("0")) candidate = "+62" + cleaned.slice(1);
  else return null;
  if (!/^\+62[1-9]\d{7,11}$/.test(candidate)) return null;
  return candidate;
}

export function classifyIdentifier(
  input: string
): "email" | "phone" | "invalid" {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? "email" : "invalid";
  }
  if (normalizePhone(trimmed)) return "phone";
  return "invalid";
}
