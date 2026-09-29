/**
 * S-06: Seat Map JSON Validator
 * 
 * Validates the uploaded JSON file before writing to database.
 * Collects ALL errors and returns them in a single response.
 */

import type { SeatInput, ValidationResult } from "./types";

const VALID_TIERS = ["VIP", "STANDARD", "SVIP"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFileSize(size: number): string | null {
  if (size > MAX_FILE_SIZE) {
    return `File vượt quá giới hạn 5MB (kích thước: ${(size / 1024 / 1024).toFixed(2)}MB)`;
  }
  return null;
}

export function validateSeatMap(jsonText: string): ValidationResult {
  const errors: string[] = [];

  // 1. Try to parse JSON
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return {
      valid: false,
      errors: [`Lỗi cú pháp JSON: ${msg}`],
    };
  }

  // 2. Check root structure
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: ['JSON phải là một object chứa trường "seats"'],
    };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.seats || !Array.isArray(obj.seats)) {
    return {
      valid: false,
      errors: ['Thiếu hoặc sai trường "seats" (phải là một mảng)'],
    };
  }

  if (obj.seats.length === 0) {
    return {
      valid: false,
      errors: ["Mảng seats không được rỗng"],
    };
  }

  // 3. Validate each seat entry
  const seats: SeatInput[] = [];
  const positions = new Set<string>();

  (obj.seats as unknown[]).forEach((seat: unknown, index: number) => {
    const prefix = `Ghế [${index}]`;

    if (!seat || typeof seat !== "object") {
      errors.push(`${prefix}: Phải là một object`);
      return;
    }

    const s = seat as Record<string, unknown>;

    // Check 'row' field
    if (!s.row || typeof s.row !== "string" || s.row.trim() === "") {
      errors.push(`${prefix}: Thiếu hoặc sai trường "row" (phải là chuỗi không rỗng)`);
    }

    // Check 'number' field
    if (
      s.number === undefined ||
      s.number === null ||
      typeof s.number !== "number" ||
      !Number.isInteger(s.number) ||
      s.number < 1
    ) {
      errors.push(
        `${prefix}: Thiếu hoặc sai trường "number" (phải là số nguyên dương)`
      );
    }

    // Check 'tier' field
    if (!s.tier || typeof s.tier !== "string") {
      errors.push(`${prefix}: Thiếu hoặc sai trường "tier" (phải là chuỗi)`);
    } else if (!VALID_TIERS.includes(String(s.tier).toUpperCase())) {
      errors.push(
        `${prefix}: Hạng ghế "${s.tier}" không hợp lệ. Chỉ chấp nhận: ${VALID_TIERS.join(", ")}`
      );
    }

    // Check 'price' field
    if (
      s.price === undefined ||
      s.price === null ||
      typeof s.price !== "number" ||
      s.price < 0
    ) {
      errors.push(
        `${prefix}: Thiếu hoặc sai trường "price" (phải là số >= 0)`
      );
    }

    // Check duplicate positions
    if (s.row && typeof s.row === "string" && typeof s.number === "number") {
      const key = `${s.row.toUpperCase()}-${s.number}`;
      if (positions.has(key)) {
        errors.push(
          `${prefix}: Trùng vị trí ghế (Hàng ${s.row}, Số ${s.number})`
        );
      }
      positions.add(key);
    }

    // If valid, add to validated list
    if (
      typeof s.row === "string" &&
      s.row.trim() !== "" &&
      typeof s.number === "number" &&
      Number.isInteger(s.number) &&
      s.number >= 1 &&
      typeof s.tier === "string" &&
      VALID_TIERS.includes(String(s.tier).toUpperCase()) &&
      typeof s.price === "number" &&
      s.price >= 0
    ) {
      seats.push({
        row: String(s.row).toUpperCase(),
        number: s.number,
        tier: String(s.tier).toUpperCase(),
        price: s.price,
      });
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], seats };
}
