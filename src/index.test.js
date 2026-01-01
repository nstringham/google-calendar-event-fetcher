import { describe, it, expect } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";

const API_KEY = "example_api_key";
const CALENDAR_ID = "example_calendar@group.calendar.google.com";

describe("GoogleCalendarEventFetcher", () => {
  it("should be exported as default and with a name", () => {
    expect(GoogleCalendarEventFetcher).toBeDefined();
    expect(GoogleCalendarEventFetcher).toBe(defaultExport);
  });

  it("should require an apiKey and a calendarId", () => {
    // @ts-expect-error
    expect(() => new GoogleCalendarEventFetcher()).toThrow();
    // @ts-expect-error
    expect(() => new GoogleCalendarEventFetcher({})).toThrow();
    // @ts-expect-error
    expect(() => new GoogleCalendarEventFetcher({ apiKey: API_KEY })).toThrow();
    // @ts-expect-error
    expect(() => new GoogleCalendarEventFetcher({ calendarId: CALENDAR_ID })).toThrow();
  });
});
