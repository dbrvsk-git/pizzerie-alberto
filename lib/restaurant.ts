// Konfigurace restaurace sdílená mezi klientem a serverem.

export type TableType = "large" | "small";
export type Table = { id: string; capacity: number; type: TableType };

export const TABLES: Table[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: `S${n}`, capacity: 4, type: "large" as const })),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `T${n}`, capacity: 2, type: "small" as const })),
];

export const TABLE_IDS = TABLES.map((t) => t.id);

export function findTable(id: string): Table | undefined {
  return TABLES.find((t) => t.id === id);
}

/** Délka rezervace v minutách. */
export const RESERVATION_MINUTES = 120;

/** Počet minut, po které čeká nepotvrzená rezervace na potvrzení e-mailem. */
export const CONFIRMATION_MINUTES = 30;

/** Maximální počet osob při online rezervaci (největší stůl). */
export const MAX_ONLINE_GUESTS = 4;

/** Jak daleko dopředu lze rezervovat online. */
export const MAX_DAYS_AHEAD = 90;

/** Časy začátku rezervace (otevřeno 11–23, poslední rezervace ve 21:00). */
export const TIME_SLOTS = Array.from({ length: 19 }, (_, i) => {
  const minutes = 12 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});

/** Rozsah časové osy v administraci. */
export const OPENING_HOUR = 11;
export const CLOSING_HOUR = 23;

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Čeká na potvrzení",
  confirmed: "Potvrzená",
  cancelled: "Zrušená",
};
