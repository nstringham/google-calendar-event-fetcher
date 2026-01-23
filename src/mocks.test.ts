import { describe, it, expect, vi, type Mock } from "vitest";
import type { FetchFunction, GoogleCalendarEvent, GoogleCalendarEvents } from "./index.js";

export const API_KEY = "example_api_key";
export const CALENDAR_ID = "example_calendar@group.calendar.google.com";

/**
 * Creates a mock for the fetch function.
 * @description Each time the mock function is called, it returns the next response from the arguments. When there are no responses left, the function will return an empty response.
 */
export function mockFetch(...responses: GoogleCalendarEvents[]): Mock<FetchFunction> {
  const mock = vi.fn<FetchFunction>(async () => Response.json({ kind: "calendar#events", items: [] }));
  for (const response of responses) {
    mock.mockResolvedValueOnce(Response.json(response));
  }
  return mock;
}

/**
 * Transforms an event into a simple string.
 */
export function transformToString(event: GoogleCalendarEvent) {
  return `${event.summary} (${event.id})`;
}

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
} as const satisfies { [key: string]: GoogleCalendarEvent };

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
    const fetch = mockFetch({
      kind: "calendar#events",
      items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1],
    });

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
