import { describe, it, expect, vi } from "vitest";
import defaultExport, { GoogleCalendarEventFetcher } from "./index.js";
import { API_KEY, CALENDAR_ID, EVENTS, mockFetch, transformToString } from "./mocks.test.js";

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
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      });
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
      const fetch = mockFetch(
        {
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_1],
        },
        {
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_2],
        },
      );
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
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1],
      });
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
      const fetch = mockFetch(
        {
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_1],
        },
        {
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_2],
        },
      );
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
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      });
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
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
      });
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("notifies subscribers with a list of all events when they subscribe after fetching", async () => {
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
      });
      const fetcher = new GoogleCalendarEventFetcher({ apiKey: API_KEY, calendarId: CALENDAR_ID, fetch });

      const from = new Date("2026-01-01T00:00:00Z");
      const to = new Date("2026-01-11T00:00:00Z");
      await fetcher.fetchEvents(from, to);

      const subscriber = vi.fn();
      fetcher.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledExactlyOnceWith([EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1]);
    });

    it("notifies subscribers with a list of all fetched events", async () => {
      const fetch = mockFetch(
        {
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_1, EVENTS.VERY_LONG_1],
        },
        {
          kind: "calendar#events",
          items: [EVENTS.ALL_DAY_2, EVENTS.VERY_LONG_1],
        },
      );
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
      const fetch = mockFetch({
        kind: "calendar#events",
        items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
      });
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
