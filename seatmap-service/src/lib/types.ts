export interface SeatInput {
  row: string;
  number: number;
  tier: string;
  price: number;
}

export interface SeatMapData {
  seats: SeatInput[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  seats?: SeatInput[];
}

export interface SeatPublic {
  id: string;
  row: string;
  number: number;
  tier: string;
  price: number;
  status: string;
}

export interface TierSummary {
  tier: string;
  price: number;
  total: number;
  available: number;
}

export const TIER_COLORS: Record<string, string> = {
  SVIP: "#ef4444",     // Red
  VIP: "#eab308",      // Yellow/Gold
  STANDARD: "#3b82f6", // Blue
};

export const TIER_LABELS: Record<string, string> = {
  SVIP: "SVIP",
  VIP: "VIP",
  STANDARD: "Thường",
};
