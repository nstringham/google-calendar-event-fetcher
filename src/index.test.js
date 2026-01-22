import { describe, it, expect, vi } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";

/** @import { Mock } from "vitest" */
/** @import { GoogleCalendarEvent, GoogleCalendarEvents } from "./index.js"; */

export const API_KEY = "example_api_key";
export const CALENDAR_ID = "example_calendar@group.calendar.google.com";

/**
 * Creates a mock for the fetch function.
 * @param {GoogleCalendarEvents[]} responses
 * @description Each time the mock function is called, it returns the next response from the arguments. When there are no responses left, the function will return an empty response.
 */
export function mockFetch(...responses) {
  /** @type {Mock<(url: URL) => Promise<Response>>} */
  const mock = vi.fn(async () => Response.json({ kind: "calendar#events", items: [] }));
  for (const response of responses) {
    mock.mockResolvedValueOnce(Response.json(response));
  }
  return mock;
}

describe("mockFetch", () => {
  it("returns empty responses when called with no arguments", async () => {
    const fetch = mockFetch();

    const firstResponse = await fetch(new URL("https://example.com"));

    expect(firstResponse).toBeInstanceOf(Response);
    const firstBody = await firstResponse.json();
    expect(firstBody).toEqual({ kind: "calendar#events", items: [] });

    const secondResponse = await fetch(new URL("https://example.com"));

    expect(secondResponse).toBeInstanceOf(Response);
    const secondBody = await secondResponse.json();
    expect(secondBody).toEqual({ kind: "calendar#events", items: [] });
  });

  it("returns non-empty response", async () => {
    /** @satisfies {GoogleCalendarEvents} */
    const fetchEvents = {
      kind: "calendar#events",
      items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
    };
    const fetch = mockFetch(fetchEvents);

    const firstResponse = await fetch(new URL("https://example.com"));

    expect(firstResponse).toBeInstanceOf(Response);
    const firstBody = await firstResponse.json();
    expect(firstBody).toEqual({ kind: "calendar#events", items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1] });

    const secondResponse = await fetch(new URL("https://example.com"));

    expect(secondResponse).toBeInstanceOf(Response);
    const secondBody = await secondResponse.json();
    expect(secondBody).toEqual({ kind: "calendar#events", items: [] });
  });

  it("returns multiple non-empty responses", async () => {
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

    const firstResponse = await fetch(new URL("https://example.com/1"));

    expect(firstResponse).toBeInstanceOf(Response);
    const firstBody = await firstResponse.json();
    expect(firstBody).toEqual({ kind: "calendar#events", items: [EVENTS.SIMPLE_1] });

    const secondResponse = await fetch(new URL("https://example.com/2"));

    expect(secondResponse).toBeInstanceOf(Response);
    const secondBody = await secondResponse.json();
    expect(secondBody).toEqual({ kind: "calendar#events", items: [EVENTS.SIMPLE_2] });

    const thirdResponse = await fetch(new URL("https://example.com/3"));

    expect(thirdResponse).toBeInstanceOf(Response);
    const thirdBody = await thirdResponse.json();
    expect(thirdBody).toEqual({ kind: "calendar#events", items: [] });
  });
});

/**
 * Transforms an event into a simple string.
 * @param {GoogleCalendarEvent} event
 * @returns {string}
 */
function transformToString(event) {
  return `${event.summary} (${event.id})`;
}

/** @satisfies {{ [key: string]: GoogleCalendarEvent }} */
export const EVENTS = {
  SIMPLE_1: {
    kind: "calendar#event",
    id: "simple1",
    summary: "Simple Event 1",
    start: { dateTime: "2026-01-03T12:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2026-01-03T13:00:00Z", timeZone: "America/New_York" },
    htmlLink: "https://www.google.com/calendar/event?eid=simple1",
  },
  SIMPLE_2: {
    kind: "calendar#event",
    id: "simple2",
    summary: "Simple Event 2",
    start: { dateTime: "2026-01-12T06:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2026-01-12T08:30:00Z", timeZone: "America/New_York" },
    htmlLink: "https://www.google.com/calendar/event?eid=simple2",
  },
  ALL_DAY_1: {
    kind: "calendar#event",
    id: "allday1",
    summary: "All Day Event 1",
    start: { date: "2026-01-15" },
    end: { date: "2026-01-16" },
    htmlLink: "https://www.google.com/calendar/event?eid=allday1",
  },
  ALL_DAY_2: {
    kind: "calendar#event",
    id: "allday2",
    summary: "All Day Event 2",
    start: { date: "2026-01-20" },
    end: { date: "2026-01-21" },
    htmlLink: "https://www.google.com/calendar/event?eid=allday2",
  },
  VERY_LONG_1: {
    kind: "calendar#event",
    id: "verylong1",
    summary: "Very Long Event 1",
    start: { dateTime: "2025-02-13T09:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2027-08-26T17:00:00Z", timeZone: "America/New_York" },
    htmlLink: "https://www.google.com/calendar/event?eid=verylong1",
  },
  DETAILED_1: {
    kind: "calendar#event",
    id: "detailed1",
    summary: "Detailed Event 1",
    start: { dateTime: "2026-01-22T03:00:00Z", timeZone: "America/New_York" },
    end: { dateTime: "2026-01-22T03:30:00Z", timeZone: "America/New_York" },
    description: "A detailed event with <b>lots<b/> of details.",
    location: "1600 Amphitheatre Parkway, Mountain View, CA 94043-1351, USA",
    attachments: [
      {
        title: "More Details.pdf",
        fileUrl: "https://drive.google.com/open?id=moreDetails",
        mimeType: "application/pdf",
        iconLink: "https://drive-thirdparty.googleusercontent.com/32/type/application/pdf",
        fileId: "moreDetails",
      },
    ],
    htmlLink: "https://www.google.com/calendar/event?eid=detailed1",
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

    it("accepts a alwaysFetchFresh flag", () => {
      new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        alwaysFetchFresh: true,
      });
    });

    it("requires alwaysFetchFresh to be a boolean if provided", () => {
      expect(
        () =>
          new GoogleCalendarEventFetcher({
            apiKey: API_KEY,
            calendarId: CALENDAR_ID,
            // @ts-expect-error
            alwaysFetchFresh: "false",
          }),
      ).toThrow();
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
      const fetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      };
      const fetch = mockFetch(fetchEvents);
      const transform = vi.fn(transformToString);

      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch, transform });

      const from = new Date("2026-01-01T00:00:00Z");
      const to = new Date("2026-02-01T00:00:00Z");

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
      const firstTo = new Date("2026-01-11T00:00:00Z");
      const firstEvents = await fetcher.fetchEvents(firstFrom, firstTo);
      expect(firstEvents).toEqual([EVENTS.SIMPLE_1]);
      expect(fetcher.allEvents).toEqual([EVENTS.SIMPLE_1]);

      const secondFrom = new Date("2026-01-11T00:00:00Z");
      const secondTo = new Date("2026-01-21T00:00:00Z");
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

      await expect(
        fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")),
      ).rejects.toThrow(new Error("Failed to fetch events: 403 Forbidden", { cause: failureResponse }));
    });

    it("throws when given an invalid range", async () => {
      const fetch = mockFetch();
      const transform = vi.fn(transformToString);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch, transform });

      await expect(
        fetcher.fetchEvents(new Date("2026-02-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z")),
      ).rejects.toThrow("Invalid date range: 'from' must be before 'to'.");
    });

    it("does not refetch events by default", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const fetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1],
      };
      const fetch = mockFetch(fetchEvents);
      const transform = vi.fn(transformToString);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch, transform });
      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);
      subscriber.mockClear();

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));

      expect(fetch).toHaveBeenCalledOnce();
      expect(transform).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledOnce();
    });

    it("does not refetch events when alwaysFetchFresh is false", async () => {
      const fetch = mockFetch();
      const fetcher = new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        fetch,
        alwaysFetchFresh: false,
      });

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));

      expect(fetch).toHaveBeenCalledOnce();
    });

    it("refetches events when alwaysFetchFresh is true", async () => {
      const fetch = mockFetch();
      const fetcher = new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        fetch,
        alwaysFetchFresh: true,
      });

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("does not refetch events previously requested accost multiple fetches", async () => {
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

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-11T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-11T00:00:00Z"), new Date("2026-01-21T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-21T00:00:00Z"));
      await fetcher.fetchEvents(new Date("2026-01-08T00:00:00Z"), new Date("2026-01-18T00:00:00Z"));

      expect(fetch).toBeCalledTimes(2);
      expect(fetcher.allEvents).toEqual([EVENTS.SIMPLE_1, EVENTS.SIMPLE_2]);
    });

    it("requests only the ranges that have not been requested previously", async () => {
      const fetch = mockFetch();
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-05T00:00:00Z"));
      expect(fetch).toHaveBeenCalledTimes(1);
      await fetcher.fetchEvents(new Date("2026-01-02T00:00:00Z"), new Date("2026-01-05T00:00:00Z"));
      expect(fetch).toHaveBeenCalledTimes(1);
      await fetcher.fetchEvents(new Date("2026-01-10T00:00:00Z"), new Date("2026-01-12T00:00:00Z"));
      expect(fetch).toHaveBeenCalledTimes(2);
      await fetcher.fetchEvents(new Date("2026-01-14T00:00:00Z"), new Date("2026-01-18T00:00:00Z"));
      expect(fetch).toHaveBeenCalledTimes(3);
      await fetcher.fetchEvents(new Date("2026-01-03T00:00:00Z"), new Date("2026-01-16T00:00:00Z"));
      expect(fetch).toHaveBeenCalledTimes(5);

      const calls = fetch.mock.calls.map(([url]) => ({
        timeMin: url.searchParams.get("timeMin"),
        timeMax: url.searchParams.get("timeMax"),
      }));
      expect(calls[0]).toEqual({ timeMin: "2026-01-01T00:00:00.000Z", timeMax: "2026-01-05T00:00:00.000Z" });
      expect(calls[1]).toEqual({ timeMin: "2026-01-10T00:00:00.000Z", timeMax: "2026-01-12T00:00:00.000Z" });
      expect(calls[2]).toEqual({ timeMin: "2026-01-14T00:00:00.000Z", timeMax: "2026-01-18T00:00:00.000Z" });
      expect(calls[3]).toEqual({ timeMin: "2026-01-05T00:00:00.000Z", timeMax: "2026-01-10T00:00:00.000Z" });
      expect(calls[4]).toEqual({ timeMin: "2026-01-12T00:00:00.000Z", timeMax: "2026-01-14T00:00:00.000Z" });
    });

    it("refetches events when previous attempt fails", async () => {
      const fetch = mockFetch();
      const failureResponse = new Response(null, { status: 403, statusText: "Forbidden" });
      fetch.mockResolvedValueOnce(failureResponse);
      const fetcher = new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        fetch,
      });

      await expect(
        fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")),
      ).rejects.toThrow("Failed to fetch events: 403 Forbidden");
      await expect(
        fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")),
      ).resolves.toEqual([]);
      await expect(
        fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")),
      ).resolves.toEqual([]);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("does not refetch events requested in parallel", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const fetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      };
      const fetch = mockFetch(fetchEvents);
      const fetcher = new GoogleCalendarEventFetcher({
        apiKey: API_KEY,
        calendarId: CALENDAR_ID,
        fetch,
      });

      const firstPromise = fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      const secondPromise = fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));
      const thirdPromise = fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));

      await expect(firstPromise).resolves.toEqual([EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1]);
      await expect(secondPromise).resolves.toEqual([EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1]);
      await expect(thirdPromise).resolves.toEqual([EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1]);

      expect(fetch).toHaveBeenCalledOnce();
    });
  });

  describe("subscribe", () => {
    it("notifies subscribers with no events when they subscribe before fetching", () => {
      /** @satisfies {GoogleCalendarEvents} */
      const fetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
      };

      const fetch = mockFetch(fetchEvents);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("notifies subscribers with a list of all events when they subscribe after fetching", async () => {
      /** @satisfies {GoogleCalendarEvents} */
      const fetchEvents = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
      };
      const fetch = mockFetch(fetchEvents);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const from = new Date("2026-01-01T00:00:00Z");
      const to = new Date("2026-01-11T00:00:00Z");
      await fetcher.fetchEvents(from, to);

      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1]);
    });

    it("notifies subscribers with a list of all fetched events", async () => {
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

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([]);
      subscriber.mockClear();

      const firstFrom = new Date("2026-01-01T00:00:00Z");
      const firstTo = new Date("2026-01-11T00:00:00Z");
      await fetcher.fetchEvents(firstFrom, firstTo);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1]);
      subscriber.mockClear();

      const secondFrom = new Date("2026-01-11T00:00:00Z");
      const secondTo = new Date("2026-01-21T00:00:00Z");
      await fetcher.fetchEvents(secondFrom, secondTo);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1, EVENTS.ALL_DAY_2]);
    });

    it("only notifies a new subscriber when they subscribe", async () => {
      /**@satisfies {GoogleCalendarEvents} */
      const mockEvent = {
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      };

      const fetch = mockFetch(mockEvent);
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const firstSubscriber = vi.fn();
      fetcher.subscribe(firstSubscriber);

      const from = new Date("2026-01-01T00:00:00Z");
      const to = new Date("2026-01-11T00:00:00Z");
      await fetcher.fetchEvents(from, to);

      expect(firstSubscriber).toHaveBeenCalledWith([EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1]);
      firstSubscriber.mockClear();

      const secondSubscriber = vi.fn();
      fetcher.subscribe(secondSubscriber);

      expect(firstSubscriber).not.toHaveBeenCalled();
      expect(secondSubscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1]);
    });

    it("returns an unsubscribe function", async () => {
      const fetch = mockFetch();
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const subscriber = vi.fn();
      const unsubscribe = fetcher.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledOnce();
      subscriber.mockClear();

      await fetcher.fetchEvents(new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z"));

      expect(subscriber).toHaveBeenCalledOnce();
      subscriber.mockClear();

      unsubscribe();

      await fetcher.fetchEvents(new Date("2026-02-01T00:00:00Z"), new Date("2026-03-01T00:00:00Z"));

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
