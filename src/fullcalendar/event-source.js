import { GoogleCalendarEventFetcher } from "../index.js";

/** @import { GoogleCalendarEvent } from "../index.js" */
/** @import { EventInput } from "@fullcalendar/core" */
/** @import { EventSourceDef } from "@fullcalendar/core/internal" */

/**
 * The data needed by an instance of a FullCalendar event source
 * @typedef {Object} GoogleCalendarEventSourceMeta
 * @property {GoogleCalendarEventFetcher<EventInput>} eventFetcher
 */

/** @type {EventSourceDef<GoogleCalendarEventSourceMeta>} */
export const eventSource = {
  parseMeta: ({ googleCalendarId, googleCalendarApiKey }) => {
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
 * Transforms Google Calendar Events into FullCalendar events
 * @param {GoogleCalendarEvent} event
 * @returns {EventInput}
 */
export function transform({ summary, description, start, end, location, attachments }) {
  return {
    title: summary,
    allDay: "date" in start,
    start: "date" in start ? start.date : start.dateTime,
    end: "date" in end ? end.date : end.dateTime,
    extendedProps: { attachments, description, location },
  };
}
