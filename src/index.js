/**
 * Fetches events from a Google Calendar.
 */
export class GoogleCalendarEventFetcher {
  #apiKey;
  #calendarId;

  /** @param {Options} options */
  constructor({ apiKey, calendarId }) {
    if (typeof apiKey !== "string" || apiKey == "") {
      throw new Error("apiKey is a required string");
    }
    if (typeof calendarId !== "string" || calendarId == "") {
      throw new Error("calendarId is a required string");
    }
    this.#apiKey = apiKey;
    this.#calendarId = calendarId;
  }
}

export default GoogleCalendarEventFetcher;

/**
 * @typedef {Object} Options
 * @property {string} apiKey The API key for accessing Google Calendar API.
 * @property {string} calendarId The ID of the Google Calendar to fetch events from.
 */
