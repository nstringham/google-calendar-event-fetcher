/**
 * Fetches events from a Google Calendar.
 */
export class GoogleCalendarEventFetcher {
  #apiKey;
  #calendarId;
  #fetch;

  /** @param {Options} options */
  constructor({ apiKey, calendarId, fetch }) {
    if (typeof apiKey !== "string" || apiKey == "") {
      throw new Error("apiKey is a required string");
    }
    if (typeof calendarId !== "string" || calendarId == "") {
      throw new Error("calendarId is a required string");
    }
    if (fetch != undefined && typeof fetch !== "function") {
      throw new Error("fetch must be a function");
    }
    this.#apiKey = apiKey;
    this.#calendarId = calendarId;
    this.#fetch = fetch ?? globalThis.fetch;
  }

  /**
   * Fetches all the events within a given range.
   * @param {Date} from The start of the time range to fetch events for.
   * @param {Date} to The end of the time range to fetch events for.
   * @returns {Promise<object[]>} A promise that resolves to an array of events.
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
    return await response.json();
  }
}

export default GoogleCalendarEventFetcher;

/**
 * @typedef {Object} Options
 * @property {string} apiKey The API key for accessing Google Calendar API.
 * @property {string} calendarId The ID of the Google Calendar to fetch events from.
 * @property {(url: URL) => Promise<Response>} [fetch=fetch] Optional fetch function to use for making HTTP requests.
 */
