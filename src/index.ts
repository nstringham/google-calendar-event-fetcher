/**
 * Fetches events from a Google Calendar.
 * @template T The type that the fetched events will be mapped to.
 */
export class GoogleCalendarEventFetcher<T = GoogleCalendarEvent> {
  #apiKey: string;
  #calendarId: string;
  #transform: (event: GoogleCalendarEvent) => T;
  #fetch: (url: URL) => Promise<Response>;

  #allEvents: Map<string, T> = new Map();

  /**
   * All events that have been fetched so far.
   */
  get allEvents() {
    return Array.from(this.#allEvents.values());
  }

  #subscribers: Set<(events: T[]) => void> = new Set();

  constructor({
    apiKey,
    calendarId,
    fetch,
    transform,
  }: GoogleCalendarEvent extends T ? MakeOptional<Options<T>, "transform"> : Options<T>) {
    if (typeof apiKey !== "string" || apiKey == "") {
      throw new Error("apiKey is a required string");
    }
    if (typeof calendarId !== "string" || calendarId == "") {
      throw new Error("calendarId is a required string");
    }
    if (fetch != undefined && typeof fetch !== "function") {
      throw new Error("fetch must be a function");
    }
    if (transform != undefined && typeof transform !== "function") {
      throw new Error("transform must be a function");
    }
    this.#apiKey = apiKey;
    this.#calendarId = calendarId;
    this.#fetch = fetch ?? globalThis.fetch;
    this.#transform = transform ?? ((event) => event as T);
  }

  /**
   * Fetches all the events within a given range.
   * @param from The start of the time range to fetch events for.
   * @param to The end of the time range to fetch events for.
   * @returns A promise that resolves to {@link allEvents}
   */
  async fetchEvents(from: Date, to: Date): Promise<T[]> {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events`);
    url.searchParams.append("key", this.#apiKey);
    url.searchParams.append("timeMin", from.toISOString());
    url.searchParams.append("timeMax", to.toISOString());
    url.searchParams.append("singleEvents", "true");
    const response = await this.#fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`, { cause: response });
    }
    const events: GoogleCalendarEvents = await response.json();
    for (const event of events.items) {
      this.#allEvents.set(event.id, this.#transform(event));
    }
    this.#notifySubscribers();
    return this.allEvents;
  }

  /**
   * Subscribes to events.
   * @param callback The callback to be called when events new are fetched.
   * @returns A function to unsubscribe the callback.
   */
  subscribe(callback: (events: T[]) => void): () => void {
    this.#subscribers.add(callback);
    return () => {
      this.#subscribers.delete(callback);
    };
  }

  #notifySubscribers() {
    for (const subscriber of this.#subscribers) {
      subscriber(this.allEvents);
    }
  }
}

export default GoogleCalendarEventFetcher;

/** @template T The type that the fetched events will be mapped to. */
export type Options<T = unknown> = {
  /** The API key for accessing Google Calendar API. */
  apiKey: string;
  /** The ID of the Google Calendar to fetch events from. */
  calendarId: string;
  /** Optional fetch function to use for making HTTP requests. */
  fetch?: (url: URL) => Promise<Response>;
  /** Optional function to transform the fetched events. */
  transform: (event: GoogleCalendarEvent) => T;
};

/** @see https://developers.google.com/workspace/calendar/api/v3/reference/events/list#response */
export type GoogleCalendarEvents = {
  /** Type of the collection */
  kind: "calendar#events";
  /** List of events on the calendar. */
  items: GoogleCalendarEvent[];
};

/** @see https://developers.google.com/workspace/calendar/api/v3/reference/events#resource-representations */
export type GoogleCalendarEvent = {
  /** Type of the resource */
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
  start: GoogleCalendarDate | GoogleCalendarDateTime;
  /** The (exclusive) end time of the event. */
  end: GoogleCalendarDate | GoogleCalendarDateTime;
  /** File attachments for the event. */
  attachments?: GoogleCalendarAttachment[];
};

/** The start or end date of an all day event */
export type GoogleCalendarDate = {
  /** The date, in the format "yyyy-mm-dd". */
  date: string;
};

/** The start or end time of a non-all day event */
export type GoogleCalendarDateTime = {
  /** The time, as a combined date-time value (formatted according to RFC3339) */
  dateTime: string;
  /** The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) */
  timeZone: string;
};

/** A file attached to an event */
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

export type MakeOptional<Type extends object, Keys extends keyof Type> = Omit<Type, Keys> & Partial<Pick<Type, Keys>>;
