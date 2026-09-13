import { createHash, randomInt } from "node:crypto";

export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

export function generateCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}
