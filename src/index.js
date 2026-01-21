import { RangeSet } from "./range-set.js";

/** @import { Range } from "./range-set.js" */

/**
 * Fetches events from a Google Calendar.
 * @template [T=GoogleCalendarEvent] The type that the fetched events will be mapped to.
 */
export class GoogleCalendarEventFetcher {
  #apiKey;
  #calendarId;
  #alwaysFetchFresh;
  #transform;
  #fetch;

  #requestedRanges = new RangeSet();

  /** @type {Set<Promise<GoogleCalendarEvents>>} */
  #pendingRequests = new Set();

  /** @type {Map<string, T>} */
  #allEvents = new Map();

  /**
   * All events that have been fetched so far.
   */
  get allEvents() {
    return Array.from(this.#allEvents.values());
  }

  /** @type {Set<(events: T[]) => void>} */
  #subscribers = new Set();

  /**
   * @param {GoogleCalendarEvent extends T ? MakeOptional<Options<T>, "transform"> : Options<T>} options
   */
  constructor({ apiKey, calendarId, fetch, transform, alwaysFetchFresh }) {
    if (typeof apiKey !== "string" || apiKey == "") {
      throw new Error("apiKey is a required string");
    }
    if (typeof calendarId !== "string" || calendarId == "") {
      throw new Error("calendarId is a required string");
    }
    if (alwaysFetchFresh != undefined && typeof alwaysFetchFresh !== "boolean") {
      throw new Error("alwaysFetchFresh must be a boolean");
    }
    if (fetch != undefined && typeof fetch !== "function") {
      throw new Error("fetch must be a function");
    }
    if (transform != undefined && typeof transform !== "function") {
      throw new Error("transform must be a function");
    }
    this.#apiKey = apiKey;
    this.#calendarId = calendarId;
    this.#alwaysFetchFresh = alwaysFetchFresh ?? false;
    this.#fetch = fetch ?? globalThis.fetch;
    this.#transform = transform ?? ((event) => /** @type {T} */ (event));
  }

  /**
   * Fetches all the events within a given range.
   * @param {Date} from The start of the time range to fetch events for.
   * @param {Date} to The end of the time range to fetch events for.
   * @returns {Promise<T[]>} A promise that resolves to {@link allEvents}.
   * @see https://developers.google.com/workspace/calendar/api/v3/reference/events/list
   */
  async fetchEvents(from, to) {
    if (from >= to) {
      throw new Error("Invalid date range: 'from' must be before 'to'.");
    }
    /** @type {Range} */
    const range = [from.valueOf(), to.valueOf()];
    if (this.#alwaysFetchFresh) {
      await this.#requestEvents(range);
    } else {
      const existingRequests = Promise.all(this.#pendingRequests);
      const missingRanges = this.#requestedRanges.inverse().intersection(new RangeSet([range]));
      await Promise.all(missingRanges.ranges.map((range) => this.#requestEvents(range)));
      await existingRequests;
    }
    return this.allEvents;
  }

  /**
   * Subscribes to events.
   * @param {(events: T[]) => void} callback The callback to be called when new events are fetched.
   * @returns {() => void} A function to unsubscribe the callback.
   * @note When subscribed, `callback` is immediately called.
   */
  subscribe(callback) {
    this.#subscribers.add(callback);
    callback(this.allEvents);
    return () => {
      this.#subscribers.delete(callback);
    };
  }

  /**
   * Requests events for a specific range from the Google Calendar API.
   * @param {Range} range
   */
  async #requestEvents(range) {
    const pendingRequest = this.#callGoogleApi(new Date(range[0]), new Date(range[1]));
    try {
      this.#requestedRanges.addRange(range);
      this.#pendingRequests.add(pendingRequest);
      const events = await pendingRequest;
      for (const event of events.items) {
        this.#allEvents.set(event.id, this.#transform(event));
      }
      this.#notifySubscribers();
    } catch (error) {
      this.#requestedRanges.removeRange(range);
      throw error;
    } finally {
      this.#pendingRequests.delete(pendingRequest);
    }
  }

  /**
   * Makes the actual Google Calendar API call.
   * @param {Date} min
   * @param {Date} max
   * @returns {Promise<GoogleCalendarEvents>}
   */
  async #callGoogleApi(min, max) {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${this.#calendarId}/events`);
    url.searchParams.append("key", this.#apiKey);
    url.searchParams.append("timeMin", min.toISOString());
    url.searchParams.append("timeMax", max.toISOString());
    url.searchParams.append("singleEvents", "true");
    const response = await this.#fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`, { cause: response });
    }
    return response.json();
  }

  #notifySubscribers() {
    for (const subscriber of this.#subscribers) {
      subscriber(this.allEvents);
    }
  }
}

export default GoogleCalendarEventFetcher;

/**
 * @template [T=unknown] The type that the fetched events will be mapped to.
 * @typedef {Object} Options
 * @property {string} apiKey The API key for accessing Google Calendar API.
 * @property {string} calendarId The ID of the Google Calendar to fetch events from.
 * @property {boolean} [alwaysFetchFresh=false] True if a events should always be re-requested from Google instead of cached.
 * @property {(url: URL) => Promise<Response>} [fetch=fetch] Optional fetch function to use for making HTTP requests.
 * @property {((event: GoogleCalendarEvent) => T)} transform Optional function to transform the fetched events.
 */

/**
 * https://developers.google.com/workspace/calendar/api/v3/reference/events/list#response
 * @typedef {Object} GoogleCalendarEvents |
 * @property {"calendar#events"} kind Type of the collection.
 * @property {GoogleCalendarEvent[]} items List of events on the calendar.
 */

/**
 * https://developers.google.com/workspace/calendar/api/v3/reference/events#resource-representations
 * @typedef {Object} GoogleCalendarEvent
 * @property {"calendar#event"} kind Type of the resource.
 * @property {string} id Opaque identifier of the event.
 * @property {string} summary Title of the event.
 * @property {string=} description Description of the event. Can contain HTML.
 * @property {string=} location Geographic location of the event as free-form text.
 * @property {GoogleCalendarDate | GoogleCalendarDateTime} start The (inclusive) start time of the event.
 * @property {GoogleCalendarDate | GoogleCalendarDateTime} end The (exclusive) end time of the event.
 * @property {GoogleCalendarAttachment[]=} attachments File attachments for the event.
 * @property {string} htmlLink An absolute link to this event in the Google Calendar Web UI.
 */

/**
 * The start or end date of an all day event
 * @typedef {Object} GoogleCalendarDate
 * @property {string} date The date, in the format "yyyy-mm-dd".
 */

/**
 * The start or end time of a non-all day event
 * @typedef {Object} GoogleCalendarDateTime
 * @property {string} dateTime The time, as a combined date-time value (formatted according to RFC3339).
 * @property {string} timeZone The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".)
 */

/**
 * A file attached to an event
 * @typedef {Object} GoogleCalendarAttachment
 * @property {string} fileId ID of the attached file.
 * @property {string} fileUrl URL link to the attachment.
 * @property {string} iconLink URL link to the attachment's icon.
 * @property {string} mimeType Internet media type (MIME type) of the attachment.
 * @property {string} title Attachment title.
 */

/**
 * @template {object} Type
 * @template {keyof Type} Keys
 * @typedef {Omit<Type, Keys> & Partial<Pick<Type, Keys>>} MakeOptional
 */
