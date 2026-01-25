import { RangeSet, type Range } from "./range-set.js";
import type { GoogleCalendarEvent, GoogleCalendarEvents } from "./google-calendar.js";

/**
 * Fetches events from a Google Calendar.
 * @template T The type that the fetched events will be mapped to.
 */
export class GoogleCalendarEventFetcher<T = GoogleCalendarEvent> {
  #apiKey: string;
  #calendarId: string;
  #alwaysFetchFresh: boolean;
  #transform: (event: GoogleCalendarEvent) => T;
  #fetch: FetchFunction;

  #requestedRanges = new RangeSet();

  #pendingRequests = new Set<Promise<GoogleCalendarEvents>>();

  #allEvents = new Map<string, T>();

  /**
   * All events that have been fetched so far.
   */
  get allEvents() {
    return Array.from(this.#allEvents.values());
  }

  #subscribers: Set<(events: T[]) => void> = new Set();

  constructor(options: GoogleCalendarEvent extends T ? MakeOptional<Options<T>, "transform"> : Options<T>) {
    const { apiKey, calendarId, fetch, transform, alwaysFetchFresh } = options;
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
    this.#transform = transform ?? ((event) => event as T);
  }

  /**
   * Fetches all the events within a given range.
   * @param from The start of the time range to fetch events for.
   * @param to The end of the time range to fetch events for.
   * @returns A promise that resolves to {@link allEvents}.
   * @see https://developers.google.com/workspace/calendar/api/v3/reference/events/list
   */
  async fetchEvents(from: Date, to: Date): Promise<T[]> {
    if (from >= to) {
      throw new Error("Invalid date range: 'from' must be before 'to'.");
    }
    const range: Range = [from.valueOf(), to.valueOf()];
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
   * @param callback The callback to be called when new events are fetched.
   * @returns A function to unsubscribe the callback.
   * @note When subscribed, `callback` is immediately called.
   */
  subscribe(callback: (events: T[]) => void): () => void {
    this.#subscribers.add(callback);
    callback(this.allEvents);
    return () => {
      this.#subscribers.delete(callback);
    };
  }

  /**
   * Requests events for a specific range from the Google Calendar API.
   */
  async #requestEvents(range: Range) {
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
   */
  async #callGoogleApi(min: Date, max: Date): Promise<GoogleCalendarEvents> {
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

/**
 * The options required by the {@link GoogleCalendarEventFetcher} constructor
 * @template T The type that the fetched events will be mapped to.
 */
export type Options<T = unknown> = {
  /** The API key for accessing Google Calendar API. */
  apiKey: string;
  /** The ID of the Google Calendar to fetch events from. */
  calendarId: string;
  /** True if a events should always be re-requested from Google instead of cached. */
  alwaysFetchFresh?: boolean;
  /** Optional fetch function to use for making HTTP requests. */
  fetch?: FetchFunction;
  /** Optional function to transform the fetched events. */
  transform: (event: GoogleCalendarEvent) => T;
};

export type FetchFunction = (url: URL) => Promise<Response>;

export type MakeOptional<Type extends object, Keys extends keyof Type> = Omit<Type, Keys> & Partial<Pick<Type, Keys>>;
