import { describe, it, expect, vi } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";

/** @import { Mock } from "vitest" */
/** @import { GoogleCalendarEvent, GoogleCalendarEvents } from "./index.js"; */

const API_KEY = "example_api_key";
const CALENDAR_ID = "example_calendar@group.calendar.google.com";

/**
 * Creates a mock for the fetch function.
 * @param {GoogleCalendarEvents[]} responses
 */
function mockFetch(...responses) {
  /** @type {Mock<(url: URL) => Promise<Response>>} */
  const mock = vi.fn(async () => Response.json({ kind: "calendar#events", items: [] }));
  for (const response of responses) {
    mock.mockResolvedValueOnce(Response.json(response));
  }
  return mock;
}

/**
 * Transforms an event into a simple string.
 * @param {GoogleCalendarEvent} event
 * @returns {string}
 */
function transformToString(event) {
  return `${event.summary} (${event.id})`;
}

/** @satisfies {{ [key: string]: GoogleCalendarEvent }} */
const EVENTS = {
  SIMPLE_1: {
    kind: "calendar#event",
    id: "simple1",
    summary: "Simple Event 1",
    start: { dateTime: "2026-01-03T12:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2026-01-03T13:00:00Z", timeZone: "America/New_York" },
  },
  SIMPLE_2: {
    kind: "calendar#event",
    id: "simple2",
    summary: "Simple Event 2",
    start: { dateTime: "2026-01-12T06:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2026-01-12T08:30:00Z", timeZone: "America/New_York" },
  },
  ALL_DAY_1: {
    kind: "calendar#event",
    id: "allday1",
    summary: "All Day Event 1",
    start: { date: "2026-01-15" },
    end: { date: "2026-01-16" },
  },
  ALL_DAY_2: {
    kind: "calendar#event",
    id: "allday2",
    summary: "All Day Event 2",
    start: { date: "2026-01-20" },
    end: { date: "2026-01-21" },
  },
  VERY_LONG_1: {
    kind: "calendar#event",
    id: "verylong1",
    summary: "Very Long Event 1",
    start: { dateTime: "2025-02-13T09:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2027-08-26T17:00:00Z", timeZone: "America/New_York" },
  },
};

describe("GoogleCalendarEventFetcher", () => {
  it("is exported as default and with a name", () => {
    expect(GoogleCalendarEventFetcher).toBeDefined();
    expect(GoogleCalendarEventFetcher).toBe(defaultExport);
  });

  describe("constructor", () => {
    it("requires an apiKey and a calendarId", () => {
      // @ts-expect-error
      expect(() => new GoogleCalendarEventFetcher()).toThrow();
      // @ts-expect-error
      expect(() => new GoogleCalendarEventFetcher({})).toThrow();
      // @ts-expect-error
      expect(() => new GoogleCalendarEventFetcher({ apiKey: API_KEY })).toThrow();
      // @ts-expect-error
      expect(() => new GoogleCalendarEventFetcher({ calendarId: CALENDAR_ID })).toThrow();
    });

    it("accepts a fetch function", () => {
      const fetch = mockFetch();

      new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        fetch: fetch,
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it("requires fetch to be a function if provided", () => {
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

    it("accepts a transform function", () => {
      new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        transform: transformToString,
      });
    });

    it("requires transform to be a function if provided", () => {
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
  });

  describe("fetchEvents", () => {
    it("fetches and transforms events within a given range", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const mockEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      };
      const fetch = mockFetch(mockEvents);
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
      expect(calledUrl.searchParams.get("singleEvents")).toBe("true");

      expect(transform).toHaveBeenCalledTimes(2);
      expect(transform).toHaveBeenNthCalledWith(1, EVENTS.SIMPLE_1);
      expect(transform).toHaveBeenNthCalledWith(2, EVENTS.ALL_DAY_1);

      expect(events).toEqual(["Simple Event 1 (simple1)", "All Day Event 1 (allday1)"]);
    });

    it("accumulates events across multiple fetches", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const firstFetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1],
      };
      /** @satisfies {GoogleCalendarEvents} */
      const secondFetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_2],
      };
      const fetch = mockFetch(firstFetchEvents, secondFetchEvents);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const firstFrom = new Date("2026-01-01T00:00:00Z");
      const firstTo = new Date("2026-01-10T23:59:59Z");
      const firstEvents = await fetcher.fetchEvents(firstFrom, firstTo);
      expect(firstEvents).toEqual([EVENTS.SIMPLE_1]);
      expect(fetcher.allEvents).toEqual([EVENTS.SIMPLE_1]);

      const secondFrom = new Date("2026-01-11T00:00:00Z");
      const secondTo = new Date("2026-01-20T23:59:59Z");
      const secondEvents = await fetcher.fetchEvents(secondFrom, secondTo);
      expect(secondEvents).toEqual([EVENTS.SIMPLE_1, EVENTS.SIMPLE_2]);
      expect(fetcher.allEvents).toEqual([EVENTS.SIMPLE_1, EVENTS.SIMPLE_2]);
    });

    it("throws when it receives an http error", async () => {
      const fetch = mockFetch();
      const transform = vi.fn(transformToString);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch, transform });

      const failureResponse = new Response(null, { status: 403, statusText: "Forbidden" });
      fetch.mockResolvedValueOnce(failureResponse);

      expect(fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T23:59:59Z"))).rejects.toThrow(
        new Error("Failed to fetch events: 403 Forbidden", { cause: failureResponse }),
      );
    });
  });

  describe("subscribe", () => {
    it("notifies subscribers with a list of all transformed events", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const firstFetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
      };
      /** @satisfies {GoogleCalendarEvents} */
      const secondFetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.ALL_DAY_2, EVENTS.VERY_LONG_1],
      };
      const fetch = mockFetch(firstFetchEvents, secondFetchEvents);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);

      const firstFrom = new Date("2026-01-01T00:00:00Z");
      const firstTo = new Date("2026-01-10T23:59:59Z");
      await fetcher.fetchEvents(firstFrom, firstTo);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1]);

      subscriber.mockClear();

      const secondFrom = new Date("2026-01-11T00:00:00Z");
      const secondTo = new Date("2026-01-20T23:59:59Z");
      await fetcher.fetchEvents(secondFrom, secondTo);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1, EVENTS.ALL_DAY_2]);
    });

    it("returns an unsubscribe function", async () => {
      const fetch = mockFetch();
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const subscriber = vi.fn();
      const unsubscribe = fetcher.subscribe(subscriber);

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T23:59:59Z"));

      expect(subscriber).toHaveBeenCalledOnce();
      subscriber.mockClear();

      unsubscribe();

      await fetcher.fetchEvents(new Date("2026-02-01T00:00:00Z"), new Date("2026-02-28T23:59:59Z"));

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
