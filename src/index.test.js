import { describe, it, expect, vi } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";

const API_KEY = "example_api_key";
const CALENDAR_ID = "example_calendar@group.calendar.google.com";

/**
 * Creates a mock for the fetch function.
 * @param {Response} response
 * @returns {import("vitest").Mock<Required<import("./index.js").Options>["fetch"]>}
 */
function mockFetch(response) {
  return vi.fn(() => Promise.resolve(response));
}

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

  it("should accept a fetch function", () => {
    const fetch = mockFetch(Response.json([]));

    new GoogleCalendarEventFetcher({
      apiKey: API_KEY,
      calendarId: CALENDAR_ID,
      fetch: fetch,
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should require fetch to be a function if provided", () => {
    expect(
      () =>
        new GoogleCalendarEventFetcher({
          apiKey: API_KEY,
          calendarId: CALENDAR_ID,
          // @ts-expect-error
          fetch: "not a function",
        }),
    ).toThrow();
  });

  it("should fetch events within a given range", async () => {
    const mockEvents = {
      kind: "calendar#events",
      items: [
        { kind: "calendar#event", id: "1", summary: "Event 1" },
        { kind: "calendar#event", id: "2", summary: "Event 2" },
      ],
    };
    const fetch = mockFetch(Response.json(mockEvents));
    const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-01-31T23:59:59Z");

    const events = await fetcher.fetchEvents(from, to);

    expect(fetch).toHaveBeenCalledOnce();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl.origin).toBe("https://www.googleapis.com");
    expect(calledUrl.pathname).toBe(`/calendar/v3/calendars/${CALENDAR_ID}/events`);
    expect(calledUrl.searchParams.get("key")).toBe(API_KEY);
    expect(calledUrl.searchParams.get("timeMin")).toBe(from.toISOString());
    expect(calledUrl.searchParams.get("timeMax")).toBe(to.toISOString());

    expect(events).toEqual(mockEvents);
  });
});
