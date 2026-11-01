import { GoogleCalendarEventFetcher } from "../event-fetcher.js";
import type { GoogleCalendarEvent } from "../google-calendar.js";
import type { EventInput } from "@fullcalendar/core";
import type { EventSourceDef } from "@fullcalendar/core/internal";

/**
 * The data needed by an instance of a FullCalendar event source
 */
export type GoogleCalendarEventSourceMeta = {
  eventFetcher: GoogleCalendarEventFetcher<EventInput>;
  successCallback?: (response: { rawEvents: EventInput[] }) => void;
  errorCallback?: (error: Error) => void;
};

export const eventSourceDef: EventSourceDef<GoogleCalendarEventSourceMeta> = {
  parseMeta: ({ googleCalendarId, googleCalendarApiKey, customFetch }) => {
    if (googleCalendarId == null) {
      return null;
    }

    if (googleCalendarApiKey == null) {
      throw new Error("googleCalendarApiKey is required");
    }

    return {
      eventFetcher: new GoogleCalendarEventFetcher({
        apiKey: googleCalendarApiKey,
        calendarId: googleCalendarId,
        fetch: customFetch,
        transform,
      }),
    };
  },

  fetch: ({ eventSource, range }, successCallback, errorCallback) => {
    eventSource.meta.successCallback = successCallback;
    eventSource.meta.errorCallback = errorCallback;
    eventSource.meta.eventFetcher
      .fetchEvents(range.start, range.end)
      .then(() => eventSource.meta.successCallback!({ rawEvents: eventSource.meta.eventFetcher.allEvents }))
      .catch((error: Error) => eventSource.meta.errorCallback!(error));
  },
};

/**
 * Transforms Google Calendar Events into FullCalendar events.
 */
export function transform({
  summary,
  description,
  start,
  end,
  location,
  attachments,
}: GoogleCalendarEvent): EventInput {
  return {
    title: summary,
    allDay: "date" in start,
    start: "date" in start ? start.date : start.dateTime,
    end: "date" in end ? end.date : end.dateTime,
    extendedProps: { attachments, description, location },
  };
}
