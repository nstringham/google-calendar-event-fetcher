import { describe, expect, it, vi } from "vitest";
import { refineProps } from "@fullcalendar/core/internal";
import { API_KEY, CALENDAR_ID, EVENTS, mockFetch } from "../index.test.js";
import GoogleCalendarEventFetcher from "../index.js";
import plugin from "./index.js";
import { eventSourceDef } from "./event-source.js";

/** @import { GoogleCalendarEventSource } from "./index.js" */
/** @import { GoogleCalendarEventSourceMeta } from "./event-source.js" */

describe("fullcalendar plugin", () => {
  describe("eventSourceRefiners", () => {
    it("refines options for in calendar id and api key", () => {
      /** @type {GoogleCalendarEventSource} */
      const raw = {
        googleCalendarId: CALENDAR_ID,
        googleCalendarApiKey: API_KEY,
      };

      const { refined, extra } = refineProps(raw, plugin.eventSourceRefiners);

      expect(refined).toEqual(raw);
      expect(extra).toEqual({});
    });
  });

  describe("eventSourceDefs", () => {
    it("has only one eventSourceDef", () => {
      expect(plugin.eventSourceDefs.length).toBe(1);
      expect(plugin.eventSourceDefs[0]).toBe(eventSourceDef);
    });

    describe("parseMeta", () => {
      it("ignores event sources without a google calendar ID", () => {
        const eventSource = {
          googleCalendarApiKey: API_KEY,
        };

        expect(eventSourceDef.parseMeta(eventSource)).toBeNull();
      });

      it("throws if google api key is missing", () => {
        const eventSource = {
          googleCalendarId: CALENDAR_ID,
        };

        expect(() => eventSourceDef.parseMeta(eventSource)).toThrow("googleCalendarApiKey is required");
      });

      it("constructs an event fetcher instance", () => {
        /** @type {GoogleCalendarEventSource} */
        const eventSource = {
          googleCalendarId: CALENDAR_ID,
          googleCalendarApiKey: API_KEY,
        };

        const meta = /** @type {GoogleCalendarEventSourceMeta} */ (eventSourceDef.parseMeta(eventSource));

        expect(meta).not.toBeNull();
        expect(meta.eventFetcher).toBeInstanceOf(GoogleCalendarEventFetcher);
      });
    });

    describe("fetch", () => {
      it("calls fetchEvents and passes the events to the success callback", async () => {
        const fetch = mockFetch({
          kind: "calendar#events",
          items: [EVENTS.SIMPLE_1, EVENTS.ALL_DAY_1, EVENTS.DETAILED_1],
        });

        /** @type {GoogleCalendarEventSource} */
        const eventSource = {
          googleCalendarId: CALENDAR_ID,
          googleCalendarApiKey: API_KEY,
          customFetch: fetch,
        };
        const meta = /** @type {GoogleCalendarEventSourceMeta} */ (eventSourceDef.parseMeta(eventSource));

        const from = new Date("2026-01-01T00:00:00Z");
        const to = new Date("2026-02-01T00:00:00Z");
        const successCallback = vi.fn();
        const errorCallback = vi.fn();

        eventSourceDef.fetch(
          // @ts-ignore -- this does not include all the things fullcalendar will provide
          { eventSource: { meta }, range: { start: from, end: to } },
          successCallback,
          errorCallback,
        );

        await vi.waitFor(() => {
          expect(fetch).toHaveBeenCalledOnce();
          expect(successCallback).toHaveBeenCalledExactlyOnceWith({
            rawEvents: [
              {
                title: "Simple Event 1",
                allDay: false,
                start: "2026-01-03T12:00:00Z",
                end: "2026-01-03T13:00:00Z",
                extendedProps: {},
              },
              {
                title: "All Day Event 1",
                allDay: true,
                start: "2026-01-15",
                end: "2026-01-16",
                extendedProps: {},
              },
              {
                title: "Detailed Event 1",
                allDay: false,
                start: "2026-01-22T03:00:00Z",
                end: "2026-01-22T03:30:00Z",
                extendedProps: {
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
                },
              },
            ],
          });
          expect(errorCallback).not.toHaveBeenCalled();
        });
      });

      it("calls fetchEvents and passes the error to the error callback", async () => {
        const fetch = mockFetch();
        fetch.mockRejectedValueOnce(new Error("mock error"));

        /** @type {GoogleCalendarEventSource} */
        const eventSource = {
          googleCalendarId: CALENDAR_ID,
          googleCalendarApiKey: API_KEY,
          customFetch: fetch,
        };
        const meta = /** @type {GoogleCalendarEventSourceMeta} */ (eventSourceDef.parseMeta(eventSource));

        const from = new Date("2026-01-01T00:00:00Z");
        const to = new Date("2026-02-01T00:00:00Z");
        const successCallback = vi.fn();
        const errorCallback = vi.fn();

        eventSourceDef.fetch(
          // @ts-ignore -- this does not include all the things fullcalendar will provide
          { eventSource: { meta }, range: { start: from, end: to } },
          successCallback,
          errorCallback,
        );

        await vi.waitFor(() => {
          expect(fetch).toHaveBeenCalledOnce();
          expect(successCallback).not.toHaveBeenCalled();
          expect(errorCallback).toHaveBeenCalledExactlyOnceWith(new Error("mock error"));
        });
      });
    });
  });
});
