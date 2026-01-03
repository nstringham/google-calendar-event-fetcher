/**
 * Fetches events from a Google Calendar.
 * @template [T=GoogleCalendarEvent] The type that the fetched events will be mapped to.
 */
export class GoogleCalendarEventFetcher {
  #apiKey;
  #calendarId;
  #transform;
  #fetch;

  /**
   * @param {GoogleCalendarEvent extends T ? MakeOptional<Options<T>, "transform"> : Options<T>} options
   */
  constructor({ apiKey, calendarId, fetch, transform }) {
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
    this.#transform = transform ?? ((event) => /** @type {T} */ (event));
  }

  /**
   * Fetches all the events within a given range.
   * @param {Date} from The start of the time range to fetch events for.
   * @param {Date} to The end of the time range to fetch events for.
   * @returns {Promise<T[]>} A promise that resolves to an array of events.
   */
  async fetchEvents(from, to) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events`);
    url.searchParams.append("key", this.#apiKey);
    url.searchParams.append("timeMin", from.toISOString());
    url.searchParams.append("timeMax", to.toISOString());
    const response = await this.#fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`, { cause: response });
    }
    /** @type {GoogleCalendarEvents} */
    const events = await response.json();
    return events.items.map((event) => this.#transform(event));
  }
}

export default GoogleCalendarEventFetcher;

/**
 * @template [T=unknown] The type that the fetched events will be mapped to.
 * @typedef {Object} Options
 * @property {string} apiKey The API key for accessing Google Calendar API.
 * @property {string} calendarId The ID of the Google Calendar to fetch events from.
 * @property {(url: URL) => Promise<Response>} [fetch=fetch] Optional fetch function to use for making HTTP requests.
 * @property {((event: GoogleCalendarEvent) => T)} transform Optional function to transform the fetched events.
 */

/**
 * @typedef {Object} GoogleCalendarEvent
 * @property {"calendar#event"} kind Type of the resource
 * @property {string} id Opaque identifier of the event.
 * @property {string} summary Title of the event.
 * @property {string=} description Description of the event. Can contain HTML.
 * @property {string=} location Geographic location of the event as free-form text.
 * @property {{ date: string } | { dateTime: string, timeZone:string }} start The (inclusive) start time of the event.
 * @property {{ date: string } | { dateTime: string, timeZone:string }} end The (exclusive) end time of the event.
 */

/**
 * @typedef {Object} GoogleCalendarEvents
 * @property {"calendar#events"} kind Type of the collection
 * @property {GoogleCalendarEvent[]} items List of events on the calendar.
 */

/**
 * @template {object} Type
 * @template {keyof Type} Keys
 * @typedef {Omit<Type, Keys> & Partial<Pick<Type, Keys>>} MakeOptional
 */
