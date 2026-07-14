import { randomUUID } from "node:crypto";

const BOOKING_NUMBER_PATTERN = /^RNT-(\d{6})-(\d{4})$/;

export function formatRentalBookingNumber(sequence: number, year: number): string {
  return `RNT-${String(sequence).padStart(6, "0")}-${year}`;
}

export function generateRentalTrackingToken(): string {
  return randomUUID();
}

export function parseRentalBookingNumber(
  bookingNumber: string
): { sequence: number; year: number } | null {
  const match = BOOKING_NUMBER_PATTERN.exec(bookingNumber);
  if (!match) return null;
  return { sequence: Number(match[1]), year: Number(match[2]) };
}

export function getRentalBookingYear(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    }).format(date)
  );
}

export const RENTAL_BOOKING_SEQUENCE_START = 1000;
