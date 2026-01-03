import { describe, it, expect, vi } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";

/** @import { Mock } from "vitest" */
/** @import { Options, GoogleCalendarEvent, GoogleCalendarEvents } from "./index.js"; */

const API_KEY = "example_api_key";
const CALENDAR_ID = "example_calendar@group.calendar.google.com";

/**
 * Creates a mock for the fetch function.
 * @param {Response} response
 * @returns {Mock<Required<Options>["fetch"]>}
 */
function mockFetch(response) {
  return vi.fn(() => Promise.resolve(response));
}

/**
 * Transforms an event into a simple string.
 * @param {GoogleCalendarEvent} event
 * @returns {string}
 */
function transformToString(event) {
  return `${event.summary} (${event.id})`;
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

  it("should accept a transform function", () => {
    new GoogleCalendarEventFetcher({
      apiKey: API_KEY,
      calendarId: CALENDAR_ID,
      transform: transformToString,
    });
  });

  it("should require transform to be a function if provided", () => {
    expect(
      () =>
        new GoogleCalendarEventFetcher({
          apiKey: API_KEY,
          calendarId: CALENDAR_ID,
          // @ts-expect-error
          transform: "not a function",
        }),
    ).toThrow();
  });

  it("should fetch and transformevents within a given range", async () => {
    /** @satisfies {GoogleCalendarEvents} */
    const mockEvents = {
      kind: "calendar#events",
      items: [
        {
          kind: "calendar#event",
          id: "1",
          summary: "Event 1",
          start: { date: "2026-01-10" },
          end: { date: "2026-01-10" },
        },
        {
          kind: "calendar#event",
          id: "2",
          summary: "Event 2",
          start: { dateTime: "2026-01-12T12:00:00Z", timeZone: "America/New_York" },
          end: { dateTime: "2026-01-12T13:00:00Z", timeZone: "America/New_York" },
        },
      ],
    };
    const fetch = mockFetch(Response.json(mockEvents));
    const transform = vi.fn(transformToString);

    const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch, transform });

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

    expect(transform).toHaveBeenCalledTimes(2);
    expect(transform).toHaveBeenNthCalledWith(1, mockEvents.items[0]);
    expect(transform).toHaveBeenNthCalledWith(2, mockEvents.items[1]);

    expect(events).toEqual(["Event 1 (1)", "Event 2 (2)"]);
  });
});
