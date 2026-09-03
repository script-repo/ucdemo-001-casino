export type RoomType = "standard" | "premium" | "suite";

export type RoomForecast = {
  roomType: RoomType;
  capacity: number;
  expectedRooms: number;
  intervalLow: number;
  intervalHigh: number;
  currentRate: number;
  recommendedRate: number;
  casinoHoldRooms: number;
  rationale: string[];
};

export type RevenueDay = {
  stayDate: string;
  event: string | null;
  expectedHighValueArrivals: number;
  expectedCasinoRooms: number;
  displacementValue: number;
  bookingPace: number;
  priorYearPace: number;
  rooms: RoomForecast[];
};

export type AccuracyPoint = {
  leadDays: number;
  mape: number;
  baselineMape: number;
  observations: number;
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROOM_CONFIG: Array<{
  roomType: RoomType;
  capacity: number;
  baseRate: number;
}> = [
  { roomType: "standard", capacity: 220, baseRate: 139 },
  { roomType: "premium", capacity: 60, baseRate: 209 },
  { roomType: "suite", capacity: 20, baseRate: 379 },
];

const EVENTS: Record<number, string> = {
  8: "Regional poker final",
  16: "Arena concert",
  23: "Holiday weekend",
  38: "Championship fight",
  52: "Convention arrival",
  67: "New Year's preview event",
  78: "VIP slot tournament",
};

function buildForecast(): RevenueDay[] {
  const rand = mulberry32(2026090319);
  const start = new Date("2026-09-04T12:00:00Z");

  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const weekend = date.getUTCDay() === 5 || date.getUTCDay() === 6;
    const event = EVENTS[index] ?? null;
    const pressure =
      0.55 +
      (weekend ? 0.19 : 0) +
      (event ? 0.18 : 0) +
      Math.sin(index / 7) * 0.05 +
      (rand() - 0.5) * 0.08;
    const expectedHighValueArrivals = Math.max(
      8,
      Math.round(14 + pressure * 27 + rand() * 8),
    );
    const expectedCasinoRooms = Math.round(expectedHighValueArrivals * 0.72);
    const bookingPace = Math.round(112 + pressure * 122 + rand() * 20);
    const priorYearPace = Math.round(bookingPace * (0.78 + rand() * 0.15));

    return {
      stayDate: date.toISOString().slice(0, 10),
      event,
      expectedHighValueArrivals,
      expectedCasinoRooms,
      displacementValue: Math.round(
        expectedCasinoRooms * (610 + rand() * 380),
      ),
      bookingPace,
      priorYearPace,
      rooms: ROOM_CONFIG.map((config, roomIndex) => {
        const roomPressure = Math.min(
          0.99,
          pressure + roomIndex * 0.035 + (rand() - 0.5) * 0.04,
        );
        const expectedRooms = Math.round(config.capacity * roomPressure);
        const recommendedRate = Math.round(
          (config.baseRate *
            (0.82 + roomPressure * 0.65 + (event ? 0.12 : 0))) /
            5,
        ) * 5;
        const currentRate = Math.round(
          (config.baseRate * (0.96 + (weekend ? 0.12 : 0))) / 5,
        ) * 5;
        const casinoHoldRooms = Math.min(
          Math.round(expectedCasinoRooms * [0.67, 0.25, 0.08][roomIndex]!),
          Math.max(1, config.capacity - expectedRooms + 5),
        );

        return {
          roomType: config.roomType,
          capacity: config.capacity,
          expectedRooms,
          intervalLow: Math.max(0, expectedRooms - Math.round(config.capacity * 0.06)),
          intervalHigh: Math.min(
            config.capacity,
            expectedRooms + Math.round(config.capacity * 0.05),
          ),
          currentRate,
          recommendedRate,
          casinoHoldRooms,
          rationale: [
            `Forecast occupancy is ${Math.round(roomPressure * 100)}%.`,
            `Booking pace is ${bookingPace >= priorYearPace ? "ahead of" : "behind"} the same point last year.`,
            `${casinoHoldRooms} ${config.roomType} rooms are reserved for expected casino demand.`,
            ...(event ? [`${event} is included in the demand forecast.`] : []),
          ],
        };
      }),
    };
  });
}

export const REVENUE_FORECAST = buildForecast();
export const FORECAST_DATE = "2026-09-03";
export const MODEL_VERSION = "rm-demand-gbr-v1.4";

export const ACCURACY: AccuracyPoint[] = [
  { leadDays: 1, mape: 0.047, baselineMape: 0.071, observations: 120 },
  { leadDays: 7, mape: 0.081, baselineMape: 0.114, observations: 114 },
  { leadDays: 30, mape: 0.139, baselineMape: 0.151, observations: 92 },
];
