import { describe, it, expect } from "vitest";
import { isAllDayEvent, convertToDate } from "./index.js";
import { EVENTS } from "./mocks.test.js";

describe("isAllDayEvent", () => {
  it("returns true for all day events", () => {
    expect(isAllDayEvent(EVENTS.ALL_DAY_1)).toBe(true);
    expect(isAllDayEvent(EVENTS.ALL_DAY_2)).toBe(true);
  });

  it("returns false for all timed events", () => {
    expect(isAllDayEvent(EVENTS.SIMPLE_1)).toBe(false);
    expect(isAllDayEvent(EVENTS.SIMPLE_2)).toBe(false);
  });
});

describe("convertToDate", () => {
  it("converts all day dates to Date objects", () => {
    expect(convertToDate(EVENTS.ALL_DAY_1.start)).toEqual(new Date("2026-01-15T00:00:00Z"));
    expect(convertToDate(EVENTS.ALL_DAY_1.end)).toEqual(new Date("2026-01-16T00:00:00Z"));
    expect(convertToDate(EVENTS.ALL_DAY_2.start)).toEqual(new Date("2026-01-20T00:00:00Z"));
    expect(convertToDate(EVENTS.ALL_DAY_2.end)).toEqual(new Date("2026-01-21T00:00:00Z"));
  });

  it("converts dates with times to Date objects", () => {
    expect(convertToDate(EVENTS.SIMPLE_1.start)).toEqual(new Date("2026-01-03T12:00:00Z"));
    expect(convertToDate(EVENTS.SIMPLE_1.end)).toEqual(new Date("2026-01-03T13:00:00Z"));
    expect(convertToDate(EVENTS.SIMPLE_2.start)).toEqual(new Date("2026-01-12T06:00:00Z"));
    expect(convertToDate(EVENTS.SIMPLE_2.end)).toEqual(new Date("2026-01-12T08:30:00Z"));
  });
});
