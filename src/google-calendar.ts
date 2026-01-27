/**
 * https://developers.google.com/workspace/calendar/api/v3/reference/events/list#response
 */
export type GoogleCalendarEvents = {
  /** Type of the collection. */
  kind: "calendar#events";
  /** List of events on the calendar. */
  items: GoogleCalendarEvent[];
};

/**
 * https://developers.google.com/workspace/calendar/api/v3/reference/events#resource-representations
 */
export type GoogleCalendarEventTemplate<DateType extends GoogleCalendarDate | GoogleCalendarDateTime> = {
  /** Type of the resource. */
  kind: "calendar#event";
  /** Opaque identifier of the event. */
  id: string;
  /** Title of the event. */
  summary: string;
  /** Description of the event. Can contain HTML. */
  description?: string;
  /** Geographic location of the event as free-form text. */
  location?: string;
  /** The (inclusive) start time of the event. */
  start: DateType;
  /** The (exclusive) end time of the event. */
  end: DateType;
  /** File attachments for the event. */
  attachments?: GoogleCalendarAttachment[];
  /** An absolute link to this event in the Google Calendar Web UI. */
  htmlLink: string;
};

export type GoogleCalendarAllDayEvent = GoogleCalendarEventTemplate<GoogleCalendarDate>;

export type GoogleCalendarTimedEvent = GoogleCalendarEventTemplate<GoogleCalendarDateTime>;

export type GoogleCalendarEvent = GoogleCalendarAllDayEvent | GoogleCalendarTimedEvent;

/**
 * The start or end date of an all day event
 */
export type GoogleCalendarDate = {
  /** The date, in the format "yyyy-mm-dd". */
  date: string;
};

/**
 * The start or end time of a non-all day event
 */
export type GoogleCalendarDateTime = {
  /** The time, as a combined date-time value (formatted according to RFC3339). */
  dateTime: string;
  /** The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) */
  timeZone: string;
};

/**
 * A file attached to an event
 */
export type GoogleCalendarAttachment = {
  /** ID of the attached file. */
  fileId: string;
  /** URL link to the attachment. */
  fileUrl: string;
  /** URL link to the attachment's icon. */
  iconLink: string;
  /** Internet media type (MIME type) of the attachment. */
  mimeType: string;
  /** Attachment title. */
  title: string;
};

/**
 * Checks if an event from google calendar is an all day event
 */
export function isAllDayEvent(event: GoogleCalendarEvent): event is GoogleCalendarAllDayEvent {
  return "date" in event.start;
}

/**
 * Converts a google calendar event start or end to a JavaScript Date object
 */
export function convertToDate(date: GoogleCalendarDate | GoogleCalendarDateTime): Date {
  return new Date("date" in date ? date.date : date.dateTime);
}
