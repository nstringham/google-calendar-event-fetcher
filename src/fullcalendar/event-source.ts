import { GoogleCalendarEventFetcher, type GoogleCalendarEvent } from "../index.js";
import type { EventInput } from "@fullcalendar/core";
import type { EventSourceDef } from "@fullcalendar/core/internal";

/**
 * The data needed by an instance of a FullCalendar event source
 */
export type GoogleCalendarEventSourceMeta = {
  eventFetcher: GoogleCalendarEventFetcher<EventInput>;
};

export const eventSourceDef: EventSourceDef<GoogleCalendarEventSourceMeta> = {
  parseMeta: ({ googleCalendarId, googleCalendarApiKey, customFetch }) => {
    if (googleCalendarId == undefined) {
      return null;
    }

    if (googleCalendarApiKey == undefined) {
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

  fetch: ({ eventSource, range }, success, error) => {
    eventSource.meta.eventFetcher
      .fetchEvents(range.start, range.end)
      .then((events) => success({ rawEvents: events }))
      .catch(error);
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
